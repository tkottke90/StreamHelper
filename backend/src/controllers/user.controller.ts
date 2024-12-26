import express from 'express';
import { Controller, Get, Response } from '@decorators/express';
import passport from 'passport';
import { UsersRoute } from '../routes';

@Controller(UsersRoute.path, [
  passport.authenticate('cookie', { session: false }),
  express.json({ limit: '1mb' })
])
export default class UserController {
  @Get('/')
  getRoot(@Response() res: express.Response) {
    res.json({ endpoint: 'Find Users Endpoint' });
  }
}
