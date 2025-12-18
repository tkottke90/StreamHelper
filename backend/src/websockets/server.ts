import * as ws from 'ws';
import { IncomingMessage } from 'http';
import { LoggerService } from '../services/index.js';
import http from 'http';
import { getControllerMetadata } from './controller.js';
import { getEventMetadata } from './event.js';
import { WsEventContext, WsMiddleware, WebSocketClientInstance } from './types.js';
import { Duplex } from 'stream';
import { Container } from '@decorators/di';

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

  // Map of event type -> handler registration
  private events: Map<string, EventRegistration> = new Map();

  constructor() {
    this.wss = new ws.WebSocketServer({ noServer: true });
    this.configureConnectionEvent();
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
    server.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
      // Only handle WebSocket upgrade requests for /ws path
      if (request.url === '/ws') {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });
  }
    
  private configureConnectionEvent() {
    this.wss.on('connection', (ws: WebSocketClientInstance, _request: IncomingMessage) => {
      // Generate unique client id for this connection
      ws.clientId = this.generateClientId();

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
      ws.on('close', () => {
        logger.log('info', 'WebSocket client disconnected', {
          clientId: ws.clientId
        });
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

      // Create event context
      const context = this.createEventContext(ws, data, isBinary);

      // Execute middleware chain and handler
      await this.executeWithMiddleware(
        context,
        registration.middleware
      );
      
      await registration.handler(context, message.data);

    } catch (error) {
      logger.log('error', 'Error handling WebSocket message', {
        error,
        clientId: ws.clientId
      });

      ws.send(JSON.stringify({
        type: 'error',
        message: 'Internal server error'
      }));
    }
  }

  /**
   * Create event context for handlers
   */
  private createEventContext(
    ws: WebSocketClientInstance,
    data: Buffer,
    isBinary: boolean
  ): WsEventContext {
    return {
      clientId: ws.clientId || 'unknown',
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