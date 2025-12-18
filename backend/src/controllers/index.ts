// Controllers manage HTTP requests coming to the system.  Create
// individual controller files in this directory, import them here
// and then add them to the array of controllers in the attach
// controllers method

import { readdir } from 'fs/promises';
import { attachControllers } from '@decorators/express';
import { Application, Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { V1_Route } from '../routes.js';
import { rateLimit } from 'express-rate-limit';
import LoggerService from '../services/logger.service.js';
import { WebSocketServer } from '../websockets/server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const limiter = rateLimit({
  windowMs: 1000, // 15 minutes
  limit: 20, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false // Disable the `X-RateLimit-*` headers.
});

async function getHttpControllers(app: Application | Router) {
  const files = (await readdir(path.resolve(__dirname))).filter((filename) =>
    filename.includes('.controller.')
  );

  LoggerService.log('debug', `Found ${files.length} WebSocket controller files`, {
      files
    });

  return await Promise.all(
    files.map((file) =>
      import(path.resolve(__dirname, file)).then((module) => module.default)
    )
  );
}

/**
 * Discover and load all WebSocket controllers from the controllers directory
 */
async function getWebSocketControllers(): Promise<any[]> {
  try {
    const files = (await readdir(path.resolve(__dirname))).filter((filename) =>
      filename.includes('.websocket.')
    );

    LoggerService.log('debug', `Found ${files.length} WebSocket controller files`, {
      files
    });

    const controllers = await Promise.all(
      files.map((file) =>
        import(path.resolve(__dirname, file)).then((module) => module.default)
      )
    );

    return controllers.filter(Boolean);
  } catch (error) {
    LoggerService.log('error', 'Error loading WebSocket controllers', { error });
    return [];
  }
}

/**
 * Initialize and attach all WebSocket controllers to the WebSocket server
 * 
 * @param wss - WebSocket server instance
 * 
 * @example
 * ```typescript
 * const wss = initializeWebSocketServer(server);
 * await initializeWebSocketControllers(wss);
 * ```
 */
export async function initializeWebSocketControllers(
  wss: WebSocketServer
): Promise<void> {
  const controllers = await getWebSocketControllers();

  if (controllers.length === 0) {
    LoggerService.log('warn', 'No WebSocket controllers found');
    return;
  }

  await Promise.all(controllers.map((ctrl) => wss.registerController(ctrl)));

  LoggerService.log('info', `Initialized ${controllers.length} WebSocket controllers`);
}

const V1_Router = Router();

export async function initializeHttpControllers (app: Application) {
  V1_Router.use(limiter);
  const controllers = await getHttpControllers(V1_Router);

  if (controllers.length === 0) {
    LoggerService.log('warn', 'No Http controllers found');
    return;
  }

  attachControllers(app, controllers);

  app.use(V1_Route.fullPath, V1_Router);
  
  LoggerService.log('info', `Initialized ${controllers.length} Http controllers`);
}
