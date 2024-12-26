import { Controller, Get, Next, Request, Response } from '@decorators/express';
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

const AUTH_COOKIE_NAME = 'auth';

@Controller('/auth')
export default class AuthController {
  constructor(@Inject(UserDaoIdentifier) private readonly userDao: UserDao) {}

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

  private async getUser(userId: string) {
    return await this.userDao.getUserByUuid(userId, true);
  }
}
