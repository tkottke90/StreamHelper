import express from 'express';
import { Controller, Get, Response } from '@decorators/express';

@Controller('/user')
export default class ServerStatusController {
  @Get('/')
  getRoot(@Response() res: express.Response) {
    res.json({ endpoint: 'Stream Endpoint' });
  }
}
