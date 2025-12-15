import express from 'express';
import pgk from '../../package.json' with { type: 'json' };
import { Controller, Get, Response } from '@decorators/express';
import { loadEnv } from '../utilities/environment.js';

const HOSTNAME = loadEnv('HOSTNAME', 'http://localhost:5000');

@Controller('/')
export default class ServerStatusController {
  @Get('/')
  getRoot(@Response() res: express.Response) {
    res.json({
      version: pgk.version,
      repository: 'https://github.com/tkottke90/StreamHelper',
      links: {
        login: `${HOSTNAME}/api/v1/auth/login`,
        issues: 'https://github.com/tkottke90/StreamHelper/issues'
      }
    });
  }

  @Get('/healthcheck')
  getHealthcheck(@Response() res: express.Response) {
    res.json({ status: 'OKAY' });
  }
}
