import type { Express } from 'express';
import { config } from 'dotenv';
import http from 'http';
import { Container } from '@decorators/di';
import { setupExpress, setupWebSockets } from './src/app.js';
import { LoggerService } from './src/services/index.js';
import {
  MulticastService,
  MulticastServiceIdentifier
} from './src/services/multicast.service.js';
import db from './src/db.js';
import type { WebSocketServer } from './src/websockets/index.js';

config({ debug: true, override: true });

const PORT = Number(process.env.PORT) ?? 5000;
const HOST = process.env.HOST ?? '0.0.0.0';

let app: Express;
let wss: WebSocketServer;

let server: http.Server;
let isShuttingDown = false;

async function startServer() {
  const logger = LoggerService;

  try {
    // Setup Express and WebSocket servers
    app = await setupExpress();
    wss = await setupWebSockets();

    // Create HTTP server
    server = http.createServer(app);

    // Initialize WebSocket server
    wss.setupUpgradeHandler(server);

    // Start listening
    await new Promise<void>((resolve) => {
      server.listen(PORT, HOST, () => {
        logger.log('info', `Server started at: http://${HOST}:${PORT}`);
        logger.log('info', `WebSocket server available at: ws://${HOST}:${PORT}/ws`);
        resolve();
      });
    });
  } catch (error) {
    logger.log('error', 'Failed to start server', { error });
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  const logger = LoggerService;

  logger.log('info', `Received ${signal}, starting graceful shutdown...`);

  const shutdownTimeout = 8000; // 8 seconds (before Docker's 10s SIGKILL)
  const timeoutHandle = setTimeout(() => {
    logger.log('error', 'Graceful shutdown timeout - forcing exit');
    process.exit(1);
  }, shutdownTimeout);

  try {
    // Phase 1: Close WebSocket connections
    logger.log('debug', 'Phase 1: Closing WebSocket connections...');
    await wss.close();
    logger.log('info', 'WebSocket connections closed');

    // Phase 2: Stop accepting new HTTP connections
    logger.log('debug', 'Phase 2: Stopping HTTP server...');
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    logger.log('info', 'HTTP server stopped');

    // Phase 3: Stop all multicast processes
    logger.log('debug', 'Phase 3: Stopping multicast processes...');
    const multicastService = await Container.get<MulticastService>(
      MulticastServiceIdentifier
    );
    await multicastService.shutdown();
    logger.log('info', 'Multicast processes stopped');

    // Phase 4: Close database connections
    logger.log('debug', 'Phase 4: Closing database connections...');
    await db.$disconnect();
    logger.log('info', 'Database connections closed');

    clearTimeout(timeoutHandle);
    logger.log('info', 'Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.log('error', 'Error during graceful shutdown', { error });
    clearTimeout(timeoutHandle);
    process.exit(1);
  }
}

// Register signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  const logger = LoggerService;
  logger.log('error', 'Uncaught exception', { error });
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(reason)
  const logger = LoggerService;
  logger.log('error', 'Unhandled rejection', { reason, promise });
  gracefulShutdown('unhandledRejection');
});

// Start the server
startServer();
