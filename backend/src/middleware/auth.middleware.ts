import passport from 'passport';
import OAuth2Strategy from 'passport-oauth2';
import { Strategy as BearerStrategy } from 'passport-http-bearer';
import { UserDao, UserDaoIdentifier } from '../dao/user.dao';
import { Container } from '@decorators/di';
import express from 'express';

const config = {
  authorizationURL: process.env.OAUTH_AUTHORIZATION_URL ?? '',
  tokenURL: process.env.OAUTH_TOKEN_URL ?? '',
  clientID: process.env.OAUTH_CLIENT_ID ?? '',
  clientSecret: process.env.OAUTH_CLIENT_SECRET ?? '',
  callbackURL: 'http://localhost:5000/auth/code'
};

// TODO: Add input validation for these values.  Maybe store them in the DB?

export function getJwtPayload(token: string) {
  return JSON.parse(
    Buffer.from(token.split('.')[1], 'base64').toString('utf-8')
  );
}

passport.use(
  new BearerStrategy(async function (token, done) {
    const userInfo = await fetch(process.env.USER_URL ?? '').then((response) =>
      response.json()
    );

    done(null, userInfo);
  })
);

passport.use(
  new OAuth2Strategy(
    {
      ...config
    },
    async (
      accessToken: string,
      _refreshToken: string,
      _profile: passport.Profile,
      cb: (err: Error | null, user: any) => void
    ) => {
      // After login we need to make sure the user exists
      const userDao: UserDao = await Container.get(UserDaoIdentifier);

      const payload = getJwtPayload(accessToken);

      const user = await userDao.getOrCreate({
        uuid: payload.sub,
        displayName: payload.given_name
      });

      return cb(null, {
        ...user,
        accessToken: { value: accessToken, exp: payload.exp }
      });
    }
  )
);

export const AuthenticateMiddleware = passport.authenticate('oauth2', {
  session: false
});

export const AuthenticateCallbackMiddleware = passport.authenticate('oauth2', {
  failureRedirect: process.env.OAUTH_LOGOUT_URL,
  session: false,
  authInfo: true
});

export async function BearerAuthMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers.authorization?.split(' ')[1];

  if (!authHeader) {
    return res
      .status(401)
      .json({ message: 'Missing or invalid authorization' });
  }

  const payload = getJwtPayload(authHeader);

  const headers = new Headers();
  headers.append('Authorization', req.headers.authorization ?? '');

  const userInfo = await fetch(process.env.OAUTH_USER_URL ?? '', {
    method: 'POST',
    headers
  }).then(async (response) => {
    if (!response.ok) {
      if ([401, 403].includes(response.status)) {
        throw Error('Unauthorized');
      }

      throw Error('Auth Service Connection issue');
    }

    return response.json();
  });

  userInfo.token = authHeader;
  userInfo.tokenExpiration = new Date(payload.exp * 1000);

  req.user = userInfo;

  next();
}
