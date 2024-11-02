import express from 'express';
import pgk from '../../package.json';
import { Controller, Get, Response } from '@decorators/express';

@Controller('/')
export default class ServerStatusController {
  @Get('/')
  getRoot(@Response() res: express.Response) {
    res.json({ version: pgk.version });
  }

  @Get('/healthcheck')
  getHealthcheck(@Response() res: express.Response) {
    res.json({ status: 'OKAY' });
  }
}
