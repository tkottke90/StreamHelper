import 'reflect-metadata';
import express from 'express';
import { initializeHttpControllers, initializeWebSocketControllers } from './controllers/index.js';
import { HttpEventMiddleware } from './middleware/index.js';
import cookieParser from 'cookie-parser';
import { WebSocketServer } from './websockets/server.js';

export async function setupExpress() {
  const app = express();

  // Trust the first proxy (nginx) - required for rate limiting and client IP detection
  app.set('trust proxy', 1);

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.use(HttpEventMiddleware);

  await initializeHttpControllers(app);

  app.use('/', express.static('./public'));
  app.use('*', express.static('./public/index.html'));

  app.disable('x-powered-by');

  return app;
}

export async function setupWebSockets() {
  const wss = new WebSocketServer();

  await initializeWebSocketControllers(wss);

  return wss;
}

