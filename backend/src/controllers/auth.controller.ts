import {
  Body,
  Controller,
  Get,
  Next,
  Post,
  Request,
  Response
} from '@decorators/express';
import express from 'express';
import {
  AuthenticateCallbackMiddleware,
  AuthenticateMiddleware,
  BearerAuthMiddleware,
  CookieMiddleware
} from '../middleware/auth.middleware';
import { Inject } from '@decorators/di';
import { UserDao, UserDaoIdentifier } from '../dao/user.dao';
import { AuthentikUserInfo } from '../interfaces/authentik.interfaces';
import { StreamDao, StreamDaoIdentifier } from '../dao/stream.dao';
import { BadRequestError, ForbiddenError } from '../utilities/errors.util';
import {
  LoggerService,
  LoggerServiceIdentifier
} from '../services/logger.service';
import { NginxOnPublishAuthBody } from '../interfaces/nginx.interfaces';

const AUTH_COOKIE_NAME = 'auth';

@Controller('/auth')
export default class ServerStatusController {
  constructor(
    @Inject(UserDaoIdentifier) private readonly userDao: UserDao,
    @Inject(StreamDaoIdentifier) private readonly streamDao: StreamDao,
    @Inject(LoggerServiceIdentifier)
    private readonly loggerService: LoggerService
  ) {}

  @Get('/login', [AuthenticateMiddleware])
  login() {
    console.log('authenticate'); // Placeholder so we can use the middleware
  }

  @Get('/logout')
  async logout(
    @Response() res: express.Response,
    @Next() next: express.NextFunction
  ) {
    try {
      res.clearCookie(AUTH_COOKIE_NAME);

      const logoutUrl = process.env.OAUTH_LOGOUT_URL ?? '';
      if (!logoutUrl) {
        await fetch(logoutUrl);
      }

      res.redirect('/logout');
    } catch (error) {
      next(error);
    }
  }

  @Get('/code', [AuthenticateCallbackMiddleware])
  loginCallback(
    @Request() req: express.Request,
    @Response() res: express.Response
  ) {
    const { value } = (req.user as any).accessToken;

    res.json({ token: value });
  }

  @Get('/me', [BearerAuthMiddleware])
  async getMe(
    @Request('user') user: AuthentikUserInfo,
    @Response() res: express.Response,
    @Next() next: express.NextFunction
  ) {
    try {
      const localUserRecord = await this.userDao.getUserByUuid(user.sub, true);

      res.cookie('auth', user.token ?? '', {
        httpOnly: true,
        sameSite: true,
        secure: false,
        expires: user.tokenExpiration ?? new Date()
      });

      res.json(localUserRecord);
    } catch (error) {
      next(error);
    }
  }

  @Get('/userInfo', [CookieMiddleware])
  async getUserInfo(
    @Request('user') user: AuthentikUserInfo,
    @Response() res: express.Response,
    @Next() next: express.NextFunction
  ) {
    try {
      const localUserRecord = await this.getUser(user.sub);

      res.json(localUserRecord);
    } catch (error) {
      next(error);
    }
  }

  @Post('/validate-stream-key')
  async validateStream(
    @Body() body: NginxOnPublishAuthBody,
    @Request() req: express.Request,
    @Response() res: express.Response,
    @Next() next: express.NextFunction
  ) {
    try {
      this.loggerService.log('debug', 'Validating stream key', { nginx: body });

      if (body?.call !== 'publish') {
        throw new BadRequestError('Invalid validation event');
      }

      if (!body.name) {
        throw new BadRequestError('Missing or invalid stream key');
      }

      // No need to check the user here because this should only come from our
      // NGINX instance running the RTMP server
      const matchingStreams = await this.streamDao.get({ key: body.name });

      if (matchingStreams.length === 0) {
        throw new ForbiddenError('Stream Not Found');
      }

      // Should only get one back so we can grab that one if the
      // stream is longer than zero
      const [firstStream] = matchingStreams;

      // Update the stream to be live per the publish event
      await this.streamDao.setLiveStatus(firstStream.id, true);

      res.send('');
    } catch (error) {
      next(error);
    }
  }

  private async getUser(userId: string) {
    return await this.userDao.getUserByUuid(userId, true);
  }
}
