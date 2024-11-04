import { Controller, Get, Next, Request, Response } from '@decorators/express';
import express from 'express';
import {
  AuthenticateCallbackMiddleware,
  AuthenticateMiddleware,
  BearerAuthMiddleware
} from '../middleware/auth.middleware';
import { Inject } from '@decorators/di';
import { UserDao, UserDaoIdentifier } from '../dao/user.dao';
import { AuthentikUserInfo } from '../interfaces/authentik.interfaces';

@Controller('/auth')
export default class ServerStatusController {
  constructor(@Inject(UserDaoIdentifier) private readonly userDao: UserDao) {}

  @Get('/login', [AuthenticateMiddleware])
  login() {
    console.log('authenticate'); // Placeholder so we can use the middleware
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
  async getUserInfo(
    @Request('user') user: AuthentikUserInfo,
    @Response() res: express.Response,
    @Next() next: express.NextFunction
  ) {
    try {
      const localUserRecord = await this.userDao.getUserByUuid(user.sub, true);

      res.cookie('auth', user.token ?? '', {
        httpOnly: true,
        sameSite: true,
        secure: true,
        expires: user.tokenExpiration ?? new Date()
      });

      res.json(localUserRecord);
    } catch (error) {
      next(error);
    }
  }
}
