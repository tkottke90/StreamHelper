import { Inject } from '@decorators/di';
import { Body, Controller, Delete, Get, Params, Patch, Post, Query, Request, Response } from '@decorators/express';
import express from 'express';
import { UserGameCreateDTO, UserGameCreateSchema, UserGameSessionCreateSchema } from '../dto/userGame.dto.js';
import { AuthenticatedUser } from '../interfaces/auth.interfaces.js';
import { AuthenticationMiddleware } from '../middleware/auth.middleware.js';
import { ZodBodyValidator, ZodWebsocketValidator } from '../middleware/zod-middleware.js';
import { LoggerService, LoggerServiceIdentifier } from '../services/logger.service.js';
import { RedisService, RedisServiceIdentifier } from '../services/redis.service.js';
import { WebSocketController, WebSocketEvent, WsEventContext } from '../websockets/index.js';

@Controller('/game-data')
@WebSocketController('game-data')
export default class GameDataController {

  constructor(
    @Inject(RedisServiceIdentifier) readonly redis: RedisService,
    @Inject(LoggerServiceIdentifier) readonly logger: LoggerService
  ) {}

  
  @Get('/')
  async getGames(
    @Request('user') user: AuthenticatedUser,
    @Response() res: express.Response
  ) {
    // TODO: Call the DAO to get the games for the user by passing the userId

    res.status(200);
    res.json({ games: [] });
  }
  
  @Post('/', [ZodBodyValidator(UserGameCreateSchema)])
  async createGame(
    @Request('user') user: AuthenticatedUser,
    @Body() body: UserGameCreateDTO,
    @Response() res: express.Response
  ) {
    // TODO: Call the create on the DAO - Parse the data with the UserGameCreateInputSchema schema and merge in the ownerId

    res.status(201);
    res.json({ game: {} });
  }
  
  @Get('/:gameId/session/:sessionId')
  async getLatestGameData(
    @Request('user') user: AuthenticatedUser,
    @Params('gameId') gameId: string,
    @Params('sessionId') sessionId: string,
    @Query('limit') limit: string = '10',
    @Response() res: express.Response
  ) {
    const key = `gamedata:${user.uuid}:${gameId}:${sessionId}`;
    const redis = this.redis.getClient();
    
    // Get latest N items (0 = newest, -1 = oldest)
    const items = await redis.lRange(key, 0, parseInt(limit) - 1);
    
    res.status(200);
    res.json({
      data: items.map(item => JSON.parse(item)),
      count: items.length
    });
  }

  @Patch('/:gameId', [ZodBodyValidator(UserGameCreateSchema)])
  async updateGame(
    @Request('user') user: AuthenticatedUser,
    @Params('gameId') gameId: string,
    @Body() body: UserGameCreateDTO,
    @Response() res: express.Response
  ) {
    // TODO: Call the update on the DAO - Make sure to pass the userId to ensure they own the game

    res.status(200);
    res.json({ game: {} });
  }

  @Delete('/:gameId')
  async deleteGame(
    @Request('user') user: AuthenticatedUser,
    @Params('gameId') gameId: string,
    @Response() res: express.Response
  ) {
    // TODO: Call the delete on the DAO - Make sure to pass the userId to ensure they own the game
    // TODO: Should cascade delete the game data and keys

    res.status(204);
    res.send();
  }

  @WebSocketEvent('initialize', [AuthenticationMiddleware, ZodWebsocketValidator(UserGameSessionCreateSchema)])
  async initializeUserGameData(context: WsEventContext) {
    // A connection from a web socket client to start a game data session.  This will
    // do the following:
    // 1. Validate that the request was made from a source the user owns
    // 2. Validate that the game exists and is owned by the user
    // 3. Setup a Redis key to store the most recent game data

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

  @WebSocketEvent('update', [AuthenticationMiddleware])
  async updateGameData(context: WsEventContext) {


  }

}