import { Container, Inject, Injectable, InjectionToken } from "@decorators/di";
import http from 'http';
import { API_KEY_HEADER_NAME, AUTH_COOKIE_NAME } from "../constants";
import { UserDao, UserDaoIdentifier } from "../dao";
import { UserApiKeyDAO, UserApiKeyDAOIdentifier } from "../dao/user-api-key.dao";
import { AuthenticatedUser } from "../interfaces/auth.interfaces";
import { LoggerService, LoggerServiceIdentifier } from "./logger.service";
import { RedisService, RedisServiceIdentifier } from "./redis.service";

@Injectable()
export class AuthService {

  constructor(
    @Inject(LoggerServiceIdentifier) private readonly logger: LoggerService,
    @Inject(RedisServiceIdentifier) private readonly redis: RedisService,
    @Inject(UserDaoIdentifier) private readonly userDao: UserDao,
    @Inject(UserApiKeyDAOIdentifier) private readonly userApiKeyDAO: UserApiKeyDAO
  ) {}

  extractFromCookie(headers: http.IncomingHttpHeaders, targetKey: string) {
    const cookieStr = headers.cookie ?? '';

    if (!cookieStr) {
      return '';
    }
    
    const match = cookieStr.match(new RegExp(`(?:^|;\\s*)${targetKey}=([^;]*)`));
    return match ? match[1] : undefined;
  }

  getHeaderValue(headers: http.IncomingHttpHeaders, targetKey: string) {
    return headers[targetKey] ?? '';
  }

  getJwtPayload(token: string) {
    return JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString('utf-8')
    );
  }

  async getUserFromCookie(request: http.IncomingMessage, key = 'auth') {
    const token = this.extractFromCookie(request.headers, key);
    return await this.getUserForAuthToken(token);
  }

  async getUserForAuthToken(token?: string) {
    // Abort early if the token is empty or undefined
    if (!token) {
      return undefined;
    }

    // Validate the users token against the Oauth provider
    const headers = new Headers();
    headers.append('Authorization', `Bearer ${token}`);

    const payload = this.getJwtPayload(token);

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

    userInfo.token = token;
    userInfo.tokenExpiration = new Date(payload.exp * 1000);

    const userRecord = await this.userDao.getUserByUuid(userInfo.sub);

    if (!userRecord) {
      return undefined;
    }

    // Construct user object
    const user: AuthenticatedUser = {
      ...userRecord,
      email: userInfo.email,
      email_verified: userInfo.email_verified,
      given_name: userInfo.given_name,
      preferred_username: userInfo.preferred_username,
      token
    };

    return user;
  }

  async getUserForApiKey(apiKeyStr: string) {
    const apiKey = await this.userApiKeyDAO.findByKey(apiKeyStr);

    if (!apiKey) {
      return undefined;
    }

    if (this.userApiKeyDAO.isExpired(apiKey)) {
      return undefined;
    }

    const user: AuthenticatedUser = {
      ...apiKey.user,
      email: '',
      email_verified: true,
      given_name: apiKey.name,
      preferred_username: apiKey.name,
      token: apiKey.key
    };

    return user;
  }

  async getUserForApiKeyRequest(request: http.IncomingMessage) {
    const apiKeyStr = this.getHeaderValue(request.headers, API_KEY_HEADER_NAME);

    if (!apiKeyStr) {
      return undefined;
    }

    if (Array.isArray(apiKeyStr)) {
      return apiKeyStr.at(0);
    }

    return await this.getUserForApiKey(apiKeyStr);
  }

  async parseProvidedAuthValue(request: http.IncomingMessage) {
    // Parse the request and check if a user can be identified from the
    // request details

    const apiKeyUser = await this.getUserForApiKeyRequest(request);
    const authTokenUser = await this.getUserForAuthToken(
      this.extractFromCookie(request.headers, AUTH_COOKIE_NAME)
    );

    // Safeguard against both values with mismatched users
    if (!apiKeyUser?.id !== !authTokenUser?.id) {
      return undefined;
    }

    // Prefer the auth token user if both are provided
    return authTokenUser ?? apiKeyUser;
  }

}


export const AuthServiceIdentifier = new InjectionToken('AuthService');
Container.provide([
  { provide: AuthServiceIdentifier, useClass: AuthService }
]);
