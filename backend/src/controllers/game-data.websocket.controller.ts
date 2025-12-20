import { Inject } from '@decorators/di';
import { Body, Controller, Delete, Get, Params, Patch, Post, Query, Request, Response } from '@decorators/express';
import express from 'express';
import { z } from 'zod';
import { UserGameDAO, UserGameDAOIdentifier } from '../dao/user-game.dao.js';
import { UserGameCreateInputSchema, UserGameCreateSchema, UserGameDTO, UserGameSessionCreateSchema, UserGameUpdateSchema } from '../dto/userGame.dto.js';
import { AuthenticatedUser } from '../interfaces/auth.interfaces.js';
import { AuthenticationMiddleware, CookieMiddleware } from '../middleware/auth.middleware.js';
import { ZodBodyValidator } from '../middleware/zod-middleware.js';
import { GameDataRoute, GameDataRouteEntry, } from '../routes.js';
import { LoggerService, LoggerServiceIdentifier } from '../services/logger.service.js';
import { RedisService, RedisServiceIdentifier } from '../services/redis.service.js';
import { WebSocketController, WebSocketEvent, WsEventContext } from '../websockets/index.js';

@Controller(GameDataRoute.path, [express.json({ limit: '1mb' })])
@WebSocketController('game-data')
export default class GameDataController {

  constructor(
    @Inject(UserGameDAOIdentifier) readonly userGameDAO: UserGameDAO,
    @Inject(RedisServiceIdentifier) readonly redis: RedisService,
    @Inject(LoggerServiceIdentifier) readonly logger: LoggerService
  ) {}
  
  @Get('/', [CookieMiddleware])
  async getGames(
    @Request('user') user: AuthenticatedUser,
    @Response() res: express.Response
  ) {
    const games = await this.userGameDAO.findByOwnerId(user.id);

    const gamesWithLinks = games.map(game => this.createGameDataLinks(game));

    res.status(200);
    res.json({ games: gamesWithLinks, links: { self: GameDataRouteEntry.url() } });
  }
  
  @Post('/', [CookieMiddleware, ZodBodyValidator(UserGameCreateInputSchema)])
  async createGame(
    @Request('user') user: AuthenticatedUser,
    @Body() body: z.infer<typeof UserGameCreateInputSchema>,
    @Response() res: express.Response
  ) {
    const createData = UserGameCreateSchema.parse({ ...body, ownerId: user.id });

    const game = await this.userGameDAO.create(createData); 

    res.status(201);
    res.json({
      ...game,
      links: {
        self: GameDataRouteEntry.url({ id: game.id.toString() })
      }
    });
  }

  @Get('/live/:uuid')
  async getLiveGameData(
    @Request('user') user: AuthenticatedUser,
    @Params('uuid') uuid: string,
    @Response() res: express.Response
  ) {
    const key = `gamedata:${user.uuid}:${uuid}:latest`;
    const redis = this.redis.getClient();
    
    // Get latest N items (0 = newest, -1 = oldest)
    const items = await redis.lRange(key, 0, 10);
    
    res.status(200);
    res.json({
      data: items.map(item => JSON.parse(item)),
      count: items.length
    });
  }
  
  @Get('/:gameId/session/:sessionId/data', [CookieMiddleware])
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

  @Post('/:gameId/initialize-session', [CookieMiddleware])
  async initializeSession(
    @Request('user') user: AuthenticatedUser,
    @Params('gameId') gameId: string,
    @Body() body: z.infer<typeof UserGameSessionCreateSchema>,
    @Response() res: express.Response
  ) {
    const game = await this.userGameDAO.findByUUID(gameId, { ownerId: user.id });

    if (!game) {
      res.status(404);
      res.json({ error: 'Game not found' });
      return;
    }

    const key = `gamedata:${user.uuid}:${gameId}:${body.sessionUUID}`;

    const redis = this.redis.getClient();

    await redis.set(`${key}:url`, GameDataRoute.fullPath + `live/${body.sessionUUID}`);

    this.logger.log('debug', 'Initialized game data session', {
      user: user.id,
      game: game.id,
      session: body.sessionUUID
    });

    res.status(200);
    res.json({
      ...game,
      links: {
        self: GameDataRouteEntry.url({ id: game.id.toString() })
      }
    });
  }

  @Get('/:gameId', [CookieMiddleware])
  async getGame(
    @Request('user') user: AuthenticatedUser,
    @Params('gameId') gameId: string,
    @Response() res: express.Response
  ) {
    const game = await this.userGameDAO.findByUUID(gameId, { ownerId: user.id });

    if (!game) {
      res.status(404);
      res.json({ error: 'Game not found' });
      return;
    }

    res.status(200);
    res.json(this.createGameDataLinks(game));
  }

  @Patch('/:gameId', [ZodBodyValidator(UserGameUpdateSchema)])
  async updateGame(
    @Request('user') user: AuthenticatedUser,
    @Params('gameId') gameId: string,
    @Body() body: z.infer<typeof UserGameUpdateSchema>,
    @Response() res: express.Response
  ) {
    const gameIdNum = parseInt(gameId, 10);

    if (isNaN(gameIdNum)) {
      res.status(400);
      res.json({ error: 'Invalid game ID' });
      return;
    }

    if (!await this.userGameDAO.canUserEdit(gameIdNum, user.id)) {
      res.status(403);
      res.json({ error: 'Access denied' });
      return;
    }

    const updatedGame = await this.userGameDAO.update(gameIdNum, body, user.id);

    res.status(200);
    res.json(this.createGameDataLinks(updatedGame));
  }

  @Delete('/:gameId')
  async deleteGame(
    @Request('user') user: AuthenticatedUser,
    @Params('gameId') gameId: string,
    @Response() res: express.Response
  ) {
    const gameIdNum = parseInt(gameId, 10);

    if (isNaN(gameIdNum)) {
      res.status(400);
      res.json({ error: 'Invalid game ID' });
      return;
    }

    if (!await this.userGameDAO.canUserEdit(gameIdNum, user.id)) {
      res.status(403);
      res.json({ error: 'Access denied' });
      return;
    }

    // This will cascade delete the game data and keys per the schema
    await this.userGameDAO.delete(gameIdNum);

    res.status(204);
    res.send();
  }

  @WebSocketEvent('update', [AuthenticationMiddleware])
  async updateGameData(context: WsEventContext) {


  }


  createGameDataLinks(game: UserGameDTO) {
    return {
      ...game,
      links: {
        self: GameDataRouteEntry.url({ id: game.id.toString() }),
        sessions: GameDataRouteEntry.url({ id: game.id.toString(), sessionId: 'latest' }),

        update: GameDataRouteEntry.url({ id: game.id.toString() }),
        delete: GameDataRouteEntry.url({ id: game.id.toString() })
      }
    }
  }
}