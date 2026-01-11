import { Inject } from '@decorators/di';
import { Body, Controller, Delete, Get, Params, Patch, Post, Query, Request, Response } from '@decorators/express';
import express from 'express';
import { z } from 'zod';
import { ONE_HOUR } from '../constants.js';
import { UserGameDAO, UserGameDAOIdentifier } from '../dao/user-game.dao.js';
import { UserGameCreateInputSchema, UserGameCreateSchema, UserGameDTO, UserGameSessionCreateSchema, UserGameUpdateSchema } from '../dto/userGame.dto.js';
import { AuthenticatedUser } from '../interfaces/auth.interfaces.js';
import { ApiKeyOrCookieWsAuthMiddleware } from '../middleware/api-key-auth.middleware.js';
import { CookieMiddleware, CookieOrApiKeyMiddleware } from '../middleware/auth.middleware.js';
import { ZodBodyValidator } from '../middleware/zod-middleware.js';
import { RedisClient, scanKeys } from '../redis.js';
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
  
  @Get('/', [CookieOrApiKeyMiddleware])
  async getGames(
    @Request('user') user: AuthenticatedUser,
    @Response() res: express.Response
  ) {
    const games = await this.userGameDAO.findByOwnerId(user.id);

    const gamesWithLinks = games.map(game => this.createGameDataLinks(game));

    res.status(200);
    res.json({ games: gamesWithLinks, links: { self: GameDataRoute.url(), create: GameDataRoute.url() } });
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
    res.json(this.createGameDataLinks(game));
  }

  @Get('/view', [CookieMiddleware])
  async getGameView(
    @Request('user') user: AuthenticatedUser,
    @Params('gameId') gameId: string,
    @Query() query: any,
    @Response() res: express.Response
  ) {
    const games = await this.userGameDAO.findByOwnerId(user.id);

    const gamesWithLinks = games.map(game => this.createGameDataLinks(game));

    res.status(200);
    res.json({ games: gamesWithLinks, links: { self: GameDataRoute.url(), create: GameDataRoute.url() } });
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

  @Post('/:gameId/initialize-session', [CookieOrApiKeyMiddleware])
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

    // Calculate the key for the game data
    const session = new GameDataSession(
      user.uuid,

      // Use the provided session id OR create one
      body.sessionUUID ?? crypto.randomUUID(),
      
      gameId
    );


    // Get the redis client
    const redis = this.redis.getClient();
    
    // Store the URL for the session
    await redis.setEx(session.urlKey, ONE_HOUR, GameDataRoute.fullPath + `live/${session.sessionId}`);

    this.logger.log('debug', 'Initialized game data session', {
      user: user.id,
      game: game.id,
      session: session.sessionId
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

  @Patch('/:gameId', [CookieMiddleware, ZodBodyValidator(UserGameUpdateSchema)])
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

  @Delete('/:gameId', [CookieMiddleware])
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

  @WebSocketEvent('update', [ApiKeyOrCookieWsAuthMiddleware])
  async updateGameData(context: WsEventContext) {
    const contextData = context.json<{ sessionUUID: string; data: Record<string, any> }>();

    const { sessionUUID, data } = contextData.data;

    this.logger.log('debug', 'Received WebSocket message', {
      client: context.clientId,
      data
    });

    // We will look up the queue for the game data using the 
    // user id and the session uuid.  This means we do not need to
    // retain the game id for the update step here
    const session = new GameDataSession(context.user!.uuid, sessionUUID);

    const redis = this.redis.getClient();

    // Use the Session & User ID to fill in the full key
    // for all data in Redis
    await session.getGameKey(redis);

    // Make sure the session has been setup by checking for the URL key
    const urlExists = await redis.exists(session.urlKey);

    if (!urlExists) {
      context.sendError('Invalid session UUID or expired session');
      return;
    }

    // Update the Url Key to reset it's expiration
    // to keep the session alive
    await redis.expire(session.urlKey, ONE_HOUR);

    // Push the data to the queue
    await redis.lPush(session.dataKey, JSON.stringify(data));

    void this.userGameDAO.syncGameData(session.dataKey);

    // Let the client know we are done
    context.send({ type: 'update:done' });
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

  createGameDataKey(userId: string, sessionId: string, gameId: string = '*') {
    return `gamedata:${userId}:${gameId}:${sessionId}`;
  }
}


class GameDataSession {

  constructor(
    public userId: string,
    public sessionId: string,
    public gameId: string = '*',
  ) {}

  get dataKey() {
    return `gamedata:${this.userId}:${this.gameId}:${this.sessionId}:data`;
  }

  get urlKey() {
    return `gamedata:${this.userId}:${this.gameId}:${this.sessionId}:url`;
  }

  async getGameKey(redis: RedisClient) {
    const [key] = await scanKeys(redis, `gamedata:${this.userId}:*:${this.sessionId}:url`);

    if (!key) {
      return '';
    }

    const [
      /* gamedata group */,
      /* userId */,
      gameId,
      /* sessionId */,
      /* data */
    ] = key.split(':');

    // Update the game id on the session
    this.gameId = gameId;

    // Return the game id
    return gameId;;
  }
}