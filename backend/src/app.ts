import express from 'express';
import controllers from './controllers';
import { HttpEventMiddleware } from './middleware';
import cookieParser from 'cookie-parser';

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(HttpEventMiddleware);

controllers(app);

app.use('/', express.static('./public'));
app.use('*', express.static('./public/index.html'));

export default app;
