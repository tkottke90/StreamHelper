import { config } from 'dotenv';
import http from 'http';
import { Container } from '@decorators/di';
import App from './src/app.js';
import { LoggerService } from './src/services/index.js';
import {
  MulticastService,
  MulticastServiceIdentifier
} from './src/services/multicast.service.js';
import db from './src/db.js';

config();

const PORT = Number(process.env.PORT) ?? 5000;
const HOST = process.env.HOST ?? '0.0.0.0';

let server: http.Server;
let isShuttingDown = false;

async function startServer() {
  const logger = LoggerService;

  try {
    // Create HTTP server
    server = http.createServer(App);

    // Start listening
    await new Promise<void>((resolve) => {
      server.listen(PORT, HOST, () => {
        logger.log('info', `Server started at: http://${HOST}:${PORT}`);
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
    // Phase 1: Stop accepting new connections
    logger.log('info', 'Phase 1: Stopping HTTP server...');
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    logger.log('info', 'HTTP server stopped');

    // Phase 2: Stop all multicast processes
    logger.log('info', 'Phase 2: Stopping multicast processes...');
    const multicastService = await Container.get<MulticastService>(
      MulticastServiceIdentifier
    );
    await multicastService.shutdown();
    logger.log('info', 'Multicast processes stopped');

    // Phase 3: Close database connections
    logger.log('info', 'Phase 3: Closing database connections...');
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
  const logger = LoggerService;
  logger.log('error', 'Unhandled rejection', { reason, promise });
  gracefulShutdown('unhandledRejection');
});

// Start the server
startServer();
