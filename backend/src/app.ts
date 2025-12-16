import express from 'express';
import controllers from './controllers/index.js';
import { HttpEventMiddleware } from './middleware/index.js';
import cookieParser from 'cookie-parser';

const app = express();

// Trust the first proxy (nginx) - required for rate limiting and client IP detection
app.set('trust proxy', 1);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(HttpEventMiddleware);

controllers(app);

app.use('/', express.static('./public'));
app.use('*', express.static('./public/index.html'));

app.disable('x-powered-by');

export default app;
