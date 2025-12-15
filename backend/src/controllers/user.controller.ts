import express from 'express';
import { Controller, Get, Response } from '@decorators/express';
import { UsersRoute } from '../routes.js';
import { CookieMiddleware } from '../middleware/auth.middleware.js';

@Controller(UsersRoute.path, [express.json({ limit: '1mb' }), CookieMiddleware])
export default class UserController {
  @Get('/')
  getRoot(@Response() res: express.Response) {
    res.json({ endpoint: 'Find Users Endpoint' });
  }
}
