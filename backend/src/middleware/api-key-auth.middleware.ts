import { Container } from '@decorators/di';
import express from 'express';
import { UserApiKeyDAO, UserApiKeyDAOIdentifier } from '../dao/user-api-key.dao.js';
import { UserDao, UserDaoIdentifier } from '../dao/user.dao.js';
import { AuthenticatedUser } from '../interfaces/auth.interfaces.js';
import { LoggerService } from '../services/logger.service.js';

const logger = LoggerService;

/**
 * Middleware that authenticates requests using API keys
 * Checks for API key in X-API-Key header
 * Validates that the key exists, is not expired, and belongs to a valid user
 * Records usage of the API key on successful authentication
 */
export async function ApiKeyAuthMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      logger.log('warn', 'API key authentication failed: missing key', {
        ip: req.ip,
        path: req.path
      });
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'API key required. Please provide a valid API key in the X-API-Key header.'
      });
    }

    // Get DAOs
    const userApiKeyDAO: UserApiKeyDAO = await Container.get(UserApiKeyDAOIdentifier);
    const userDao: UserDao = await Container.get(UserDaoIdentifier);

    // Find the API key
    const keyRecord = await userApiKeyDAO.findByKey(apiKey);

    if (!keyRecord) {
      logger.log('warn', 'API key authentication failed: invalid key', {
        ip: req.ip,
        path: req.path
      });
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API key'
      });
    }

    // Check if the key is expired
    if (userApiKeyDAO.isExpired(keyRecord)) {
      logger.log('warn', 'API key authentication failed: expired key', {
        ip: req.ip,
        path: req.path,
        apiKeyId: keyRecord.id,
        expiresAt: keyRecord.expiresAt
      });
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'API key has expired',
        expiredAt: keyRecord.expiresAt
      });
    }

    // Get the user associated with this API key
    const user = await userDao.getUserById(keyRecord.ownerId);

    if (!user) {
      logger.log('error', 'API key authentication failed: user not found', {
        ip: req.ip,
        path: req.path,
        apiKeyId: keyRecord.id,
        ownerId: keyRecord.ownerId
      });
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API key'
      });
    }

    // Record usage of the API key (fire and forget - don't wait for it)
    userApiKeyDAO.recordUsage(keyRecord.id).catch((error) => {
      logger.log('error', 'Failed to record API key usage', {
        error,
        apiKeyId: keyRecord.id
      });
    });

    // Attach user info to request (minimal info for API key auth)
    req.user = {
      ...user,
      email: '',
      email_verified: false,
      preferred_username: user.displayName,
      given_name: user.displayName,
      token: ''
    } as AuthenticatedUser;

    logger.log('debug', 'API key authentication successful', {
      userId: user.id,
      apiKeyId: keyRecord.id,
      apiKeyName: keyRecord.name,
      path: req.path
    });

    next();
  } catch (error) {
    logger.log('error', 'API key authentication error', {
      error,
      ip: req.ip,
      path: req.path
    });
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during authentication'
    });
  }
}

