import express from 'express';
import { Controller, Get, Response } from '@decorators/express';
import { WebSocketController, WebSocketEvent, WsEventContext } from '../websockets/index.js';
import { RedisService } from '../services/redis.service.js';
import { Inject } from '@decorators/di';
import { LoggerService, LoggerServiceIdentifier } from '../services/logger.service.js';
import { AuthenticationMiddleware } from '../middleware/auth.middleware.js';

@Controller('/game-data')
@WebSocketController('game-data')
export default class GameDataController {

  constructor(
    @Inject(RedisService) readonly redis: RedisService,
    @Inject(LoggerServiceIdentifier) readonly logger: LoggerService
  ) {
    logger.log('debug', 'GameDataController initialized');
  }

  @Get('/')
  async status(@Response() res: express.Response) {
    res.json({ status: 'OKAY' });
  }

  @WebSocketEvent('initialize', [AuthenticationMiddleware])
  async initializeUserGameData(context: WsEventContext) {
    try {
      const value = await this.redis.getClient().get('Game_Name');

      context.send({
        type: 'game-data:initialized',
        data: {
          message: 'Hello World From Redis: ' + value
        }
      });
    } catch (err) {

      this.logger.log('error', 'Error getting game data', { error: err });

      context.sendError('Unable to get value')
    }
  }
}

