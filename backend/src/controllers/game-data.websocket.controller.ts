import express from 'express';
import { Controller, Get, Response } from '@decorators/express';
import { WebSocketController, WebSocketEvent, WsEventContext } from '../websockets/index.js';

@Controller('/game-data')
@WebSocketController('game-data')
export default class GameDataController {

  @Get('/')
  async status(@Response() res: express.Response) {
    res.json({ status: 'OKAY' });
  }

  @WebSocketEvent('initialize')
  async initializeUserGameData(context: WsEventContext) {
    context.send({
      type: 'game-data:initialized',
      data: {
        message: 'Hello World'
      }
    });
  }

}
