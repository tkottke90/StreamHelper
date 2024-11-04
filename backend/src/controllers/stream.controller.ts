import express from 'express';
import { Controller, Get, Response } from '@decorators/express';
import passport from 'passport';

@Controller('/stream', [passport.authenticate('cookie', { session: false })])
export default class ServerStatusController {
  @Get('/')
  getRoot(@Response() res: express.Response) {
    res.json({ endpoint: 'Stream Endpoint' });
  }
}
