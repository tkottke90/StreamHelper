import { Container } from '@decorators/di';
import { BaseError } from '@tkottke90/js-errors';
import http, { IncomingMessage } from 'http';
import { Duplex } from 'stream';
import * as ws from 'ws';
import { API_KEY_COOKIE_NAME } from '../constants.js';
import { AuthenticatedUser } from '../interfaces/auth.interfaces.js';
import { AuthService, AuthServiceIdentifier } from '../services/auth.service.js';
import { LoggerService } from '../services/index.js';
import { RedisService, RedisServiceIdentifier } from '../services/redis.service.js';
import { getControllerMetadata } from './controller.js';
import { getEventMetadata } from './event.js';
import { WebSocketClientInstance, WsEventContext, WsMiddleware } from './types.js';

const logger = LoggerService;

// Handler function type
type EventHandler = (context: WsEventContext, data: any) => Promise<void>;



// Event registration info
interface EventRegistration {
  handler: EventHandler;
  middleware: WsMiddleware[];
  controllerName: string;
  methodName: string;
}

export class WebSocketServer {
  private readonly wss: ws.WebSocketServer;
  private redisService: RedisService | null = null;

  // Map of event type -> handler registration
  private events: Map<string, EventRegistration> = new Map();

  constructor() {
    this.wss = new ws.WebSocketServer({ noServer: true });
    this.configureConnectionEvent();

    // Initialize Redis service asynchronously
    Container.get<RedisService>(RedisServiceIdentifier).then(redis => {
      this.redisService = redis;
      logger.log('debug', 'Redis service initialized for WebSocket server');
    }).catch(error => {
      logger.log('error', 'Failed to initialize Redis service for WebSocket', { error });
    });
  }

  async close(): Promise<void> {
    logger.log('info', 'Closing WebSocket server...');

    return new Promise((resolve) => {
      this.wss.clients.forEach(client => {
        client.close(1000, 'Server shutting down');
      });
      
      this.wss.close(() => {
        logger.log('info', 'WebSocket server closed');
        resolve();
      });
    });
  }

  async registerController(controller: any) {
    // Handle both class and instance - get the actual class
    const controllerClass = typeof controller === 'function' ? controller : controller.constructor;

    // Get controller metadata
    const controllerMetadata = getControllerMetadata(controllerClass);

    if (!controllerMetadata) {
      logger.log('warn', 'Attempted to register a non-WebSocket controller', {
        controller: controllerClass.name
      });
      return false;
    }

    const { path: controllerPath, middleware: controllerMiddleware } = controllerMetadata;

    logger.log('debug', 'Registering WebSocket controller', {
      controller: controllerClass.name,
      path: controllerPath
    });

    // Get all event metadata from the controller
    const events = getEventMetadata(controllerClass);

    if (!events || events.length === 0) {
      logger.log('warn', `WebSocket controller ${controllerClass.name} has no events`);
      return false;
    }

    // Create an instance using the DI Container if we received a class
    const instance = typeof controller === 'function'
      ? await Container.get(controllerClass)
      : controller;

    // Register each event handler
    for (const event of events) {
      const { eventType, methodName, middleware: eventMiddleware } = event;

      // Construct full event type: controller:event (e.g., 'stream:status')
      const fullEventType = `${controllerPath}:${eventType}`;

      // Get the handler method from the controller instance
      const handlerMethod = instance[methodName];

      if (typeof handlerMethod !== 'function') {
        logger.log('error', `Handler method ${methodName} not found on controller ${controllerClass.name}`);
        continue;
      }

      // Bind the handler to the controller instance
      const boundHandler = handlerMethod.bind(instance);

      // Combine controller and event middleware
      const allMiddleware = [...controllerMiddleware, ...eventMiddleware];

      // Store the event registration
      this.events.set(fullEventType, {
        handler: boundHandler,
        middleware: allMiddleware,
        controllerName: controllerClass.name,
        methodName
      });

      logger.log('debug', `Registered WebSocket event: ${fullEventType} -> ${controllerClass.name}.${methodName}`);
    }

    return true;
  }

  setupUpgradeHandler(server: http.Server) {
    const path = '/api/v1/ws';

    server.on('upgrade', async (request: IncomingMessage, socket: Duplex, head: Buffer) => {
      // Only handle WebSocket upgrade requests for /ws path
      if (request.url !== path) {
        socket.destroy();
        return;
      }

      try {
        const authService: AuthService = await Container.get(AuthServiceIdentifier);
        const apiKey = await authService.extractFromCookie(request.headers, API_KEY_COOKIE_NAME);

        const user = apiKey ? await authService.getUserForApiKey(apiKey) : undefined;

        this.wss.handleUpgrade(request, socket, head, async (ws) => {
          // Cast to our custom WebSocket type and set authentication status
          const wsClient = ws as WebSocketClientInstance;

          // Generate unique client ID
          wsClient.clientId = this.generateClientId();
          wsClient.isAuthenticated = !!user;
          wsClient.remoteAddress = request.socket.remoteAddress;

          // Store user in Redis cache with 24-hour TTL
          if (user && wsClient.clientId) {
            const redisService = this.redisService;
            if (redisService) {
              const redis = redisService.getClient();
              const key = `ws:${wsClient.clientId}:user`;
              await redis.setEx(key, 86400, JSON.stringify(user));

              logger.log('debug', 'Stored user in Redis cache for WebSocket connection', {
                clientId: wsClient.clientId,
                userId: user.id
              });
            }
          }

          // Emit connection event
          this.wss.emit('connection', wsClient, request);
        });
      } catch (error) {
        logger.log('warn', 'WebSocket upgrade authentication failed', { error });
        socket.destroy();
      }
    });

    return path;
  }
    
  private configureConnectionEvent() {
    this.wss.on('connection', (ws: WebSocketClientInstance, _request: IncomingMessage) => {
      ws.on('message', (data: Buffer, isBinary: boolean) => {
        this.handleMessage(ws, data, isBinary);
      });

      // Handle errors
      ws.on('error', (error) => {
        logger.log('error', 'WebSocket error', {
          error,
          clientId: ws.clientId
        });
      });

      // Handle disconnection
      ws.on('close', async () => {
        logger.log('info', 'WebSocket client disconnected', {
          clientId: ws.clientId
        });

        // Clean up user data from Redis cache
        if (ws.clientId) {
          const redisService = this.redisService;
          if (redisService) {
            try {
              const redis = redisService.getClient();
              const key = `ws:${ws.clientId}:user`;
              await redis.del(key);

              logger.log('debug', 'Removed user from Redis cache on disconnect', {
                clientId: ws.clientId
              });
            } catch (error) {
              logger.log('error', 'Failed to clean up Redis cache on disconnect', {
                error,
                clientId: ws.clientId
              });
            }
          }
        }
      });
    });
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private async handleMessage(ws: WebSocketClientInstance, data: Buffer, isBinary: boolean) {
    try {
      logger.log('debug', 'Received WebSocket message', {
        client: ws.clientId,
        isBinary
      });

      // Parse the message
      const message = JSON.parse(data.toString());

      // Get the event type
      const eventType = message.type;

      if (!eventType) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Event type is required'
        }));
        return;
      }

      // Get the event registration
      const registration = this.events.get(eventType);

      if (!registration) {
        logger.log('debug', `No handler for event type: ${eventType}`);

        ws.send(JSON.stringify({
          type: 'error',
          message: `No handler for event type: ${eventType}`
        }));

        return;
      }

      // Retrieve user from Redis cache
      let user: AuthenticatedUser | undefined;
      if (ws.clientId) {
        const redisService = this.redisService;
        if (redisService) {
          const redis = redisService.getClient();
          const key = `ws:${ws.clientId}:user`;
          const userJson = await redis.get(key);

          if (userJson) {
            user = JSON.parse(userJson) as AuthenticatedUser;
            logger.log('debug', 'Retrieved user from Redis cache', {
              clientId: ws.clientId,
              userId: user.id
            });
          }
        }
      }

      // Create event context with user data
      const context = this.createEventContext(ws, data, isBinary, user);

      // Execute middleware chain and handler
      await this.executeWithMiddleware(
        context,
        registration.middleware
      );

      await registration.handler(context, message.data);

    } catch (error) {
      const parsedError = BaseError.fromCatch(error);

      logger.log('error', parsedError.toString())

      ws.send(JSON.stringify({
        type: 'error',
        message: parsedError.message
      }));
    }
  }

  /**
   * Create event context for handlers
   */
  private createEventContext(
    ws: WebSocketClientInstance,
    data: Buffer,
    isBinary: boolean,
    user?: AuthenticatedUser
  ): WsEventContext {
    return {
      clientId: ws.clientId || 'unknown',
      isAuthenticated: ws.isAuthenticated,
      user,
      ws,
      isBinary,
      json: <T = any>() => JSON.parse(data.toString()) as T,
      text: () => data.toString(),
      raw: data,
      send: (message: string | object) => {
        const payload = typeof message === 'string' ? message : JSON.stringify(message);
        ws.send(payload);
      },
      sendError: (message: string) => {
        ws.send(JSON.stringify({ type: 'error', message }));
      },
      broadcast: (message: string | object) => {
        const payload = typeof message === 'string' ? message : JSON.stringify(message);
        this.wss.clients.forEach((client) => {
          if (client.readyState === ws.OPEN) {
            client.send(payload);
          }
        });
      }
    };
  }

  /**
   * Execute handler with middleware chain
   */
  private async executeWithMiddleware(
    context: WsEventContext,
    middleware: WsMiddleware[]
  ): Promise<void> {

    let errorTracker = undefined;
    
    for (const middlewareFn of middleware) {
      await middlewareFn(context, async (error?: any) => {
        errorTracker = error; 
      });

      if (errorTracker) {
        throw errorTracker;
      }
    }
  }
}