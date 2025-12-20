import { Inject } from '@decorators/di';
import { Controller, Get, Headers, Next, Request, Response } from '@decorators/express';
import express from 'express';
import { UserDao, UserDaoIdentifier } from '../dao/user.dao.js';
import { AuthentikUserInfo } from '../interfaces/authentik.interfaces.js';
import {
  AUTH_COOKIE_NAME,
  AuthenticateCallbackMiddleware,
  AuthenticateMiddleware,
  BearerAuthMiddleware,
  CookieMiddleware,
  REFRESH_COOKIE_NAME
} from '../middleware/auth.middleware.js';

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
      res.clearCookie(REFRESH_COOKIE_NAME);

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

    res.json({ token: value, refresh: (req.user as any).refreshToken.value });
  }

  @Get('/me', [BearerAuthMiddleware])
  async getMe(
    @Request('user') user: AuthentikUserInfo,
    @Headers(REFRESH_COOKIE_NAME) refreshToken: string,
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

      if (refreshToken) {
        res.cookie('rtoken', refreshToken, {
          httpOnly: true,
          sameSite: true,
          secure: true
        });
      }

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
