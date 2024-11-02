import { Controller, Get, Response } from '@decorators/express';
import express from 'express';
import {
  AuthenticateCallbackMiddleware,
  AuthenticateMiddleware
} from '../middleware/auth.middleware';

@Controller('/auth')
export default class ServerStatusController {
  @Get('/login', [AuthenticateMiddleware])
  login() {
    console.log('authenticate');
  }

  @Get('/code', [AuthenticateCallbackMiddleware])
  loginCallback(@Response() res: express.Response) {
    res.redirect('/');
  }
}
