import passport from 'passport';
import OAuth2Strategy from 'passport-oauth2';

const config = {
  authorizationURL: process.env.OAUTH_AUTHORIZATION_URL ?? '',
  tokenURL: process.env.OAUTH_TOKEN_URL ?? '',
  clientID: process.env.OAUTH_CLIENT_ID ?? '',
  clientSecret: process.env.OAUTH_CLIENT_SECRET ?? '',
  callbackURL: 'http://localhost:5000/auth/code'
};

console.dir(config);

passport.use(
  new OAuth2Strategy(
    {
      ...config
    },
    function (
      accessToken: string,
      refreshToken: string,
      profile: passport.Profile,
      cb: (err: Error | null, user: any) => void
    ) {
      console.log('callback called');
      return cb(null, { username: 'altotom90' });
    }
  )
);

export const AuthenticateMiddleware = passport.authenticate('oauth2', {
  session: false
});
export const AuthenticateCallbackMiddleware = passport.authenticate('oauth2', {
  successRedirect: '/',
  failureRedirect: process.env.OAUTH_LOGOUT_URL,
  session: false
});
