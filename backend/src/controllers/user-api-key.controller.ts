import { Inject } from '@decorators/di';
import {
  Body,
  Controller,
  Delete,
  Get,
  Next,
  Params,
  Post,
  Put,
  Request,
  Response
} from '@decorators/express';
import express from 'express';
import type { UserApiKey } from '../../prisma/generated/prisma/client.js';
import {
  UserApiKeyDAO,
  UserApiKeyDAOIdentifier
} from '../dao/user-api-key.dao.js';
import {
  UserApiKeyCreateInput,
  UserApiKeyCreateInputSchema,
  UserApiKeyDTO,
  UserApiKeyDTOWithLinks,
  UserApiKeyUpdateInput,
  UserApiKeyUpdateInputSchema,
  UserApiKeyWithSecretDTO,
  UserApiKeyWithSecretDTOWithLinks
} from '../dto/user-api-key.dto.js';
import { AuthenticatedUser } from '../interfaces/auth.interfaces.js';
import { CookieMiddleware } from '../middleware/auth.middleware.js';
import { ZodIdValidator } from '../middleware/zod-middleware.js';
import {
  UserApiKeyRegenerateRouteEntry,
  UserApiKeyRouteEntry,
  UserApiKeysRoute
} from '../routes.js';
import {
  LoggerService,
  LoggerServiceIdentifier
} from '../services/logger.service.js';
import { NotFoundError } from '../utilities/errors.util.js';

@Controller(UserApiKeysRoute.path, [
  express.json({ limit: '1mb' }),
  CookieMiddleware
])
export default class UserApiKeyController {
  constructor(
    @Inject(UserApiKeyDAOIdentifier)
    private readonly userApiKeyDAO: UserApiKeyDAO,
    @Inject(LoggerServiceIdentifier) private readonly logger: LoggerService
  ) {}

  /**
   * Convert UserApiKey to DTO with HATEOS links (without key)
   */
  private toDTO(apiKey: UserApiKey): UserApiKeyDTOWithLinks {
    const now = new Date();
    const isExpired = apiKey.expiresAt ? apiKey.expiresAt < now : false;
    const neverExpires = apiKey.expiresAt === null;

    const dto: UserApiKeyDTO = {
      id: apiKey.id,
      ownerId: apiKey.ownerId,
      name: apiKey.name,
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
      isExpired,
      neverExpires,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt
    };

    return {
      ...dto,
      links: {
        self: UserApiKeyRouteEntry.url({ id: apiKey.id.toString() }),
        parent: UserApiKeysRoute.url(),
        regenerate: UserApiKeyRegenerateRouteEntry.url({
          id: apiKey.id.toString()
        }),
        delete: UserApiKeyRouteEntry.url({ id: apiKey.id.toString() })
      }
    };
  }

  /**
   * Convert UserApiKey to DTO with HATEOS links (with key for create/regenerate)
   */
  private toDTOWithSecret(apiKey: UserApiKey): UserApiKeyWithSecretDTOWithLinks {
    const now = new Date();
    const isExpired = apiKey.expiresAt ? apiKey.expiresAt < now : false;
    const neverExpires = apiKey.expiresAt === null;

    const dto: UserApiKeyWithSecretDTO = {
      id: apiKey.id,
      ownerId: apiKey.ownerId,
      name: apiKey.name,
      key: apiKey.key,
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
      isExpired,
      neverExpires,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt
    };

    return {
      ...dto,
      links: {
        self: UserApiKeyRouteEntry.url({ id: apiKey.id.toString() }),
        parent: UserApiKeysRoute.url(),
        regenerate: UserApiKeyRegenerateRouteEntry.url({
          id: apiKey.id.toString()
        }),
        delete: UserApiKeyRouteEntry.url({ id: apiKey.id.toString() })
      }
    };
  }

  /**
   * GET /api/v1/user-api-keys
   * Get all API keys for the authenticated user
   */
  @Get('/')
  async getAllKeys(
    @Response() res: express.Response,
    @Request('user') user: AuthenticatedUser,
    @Next() next: express.NextFunction
  ) {
    try {
      const apiKeys = await this.userApiKeyDAO.findByOwnerId(user.id);

      const keysWithLinks = apiKeys.map((key) => this.toDTO(key));

      res.json({
        content: keysWithLinks,
        links: {
          self: UserApiKeysRoute.url(),
          create: UserApiKeysRoute.url()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/user-api-keys/:id
   * Get a single API key by ID
   */
  @Get('/:id', [ZodIdValidator()])
  async getKey(
    @Response() res: express.Response,
    @Request('user') user: AuthenticatedUser,
    @Params('id') id: number,
    @Next() next: express.NextFunction
  ) {
    try {
      const apiKey = await this.userApiKeyDAO.findByIdForOwner(id, user.id);

      if (!apiKey) {
        throw new NotFoundError('API key not found');
      }

      res.json(this.toDTO(apiKey));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/user-api-keys
   * Create a new API key
   */
  @Post('/')
  async createKey(
    @Response() res: express.Response,
    @Request('user') user: AuthenticatedUser,
    @Body() body: UserApiKeyCreateInput,
    @Next() next: express.NextFunction
  ) {
    try {
      // Validate input
      const validated = UserApiKeyCreateInputSchema.parse(body);

      // Create the API key
      const apiKey = await this.userApiKeyDAO.create(user.id, validated);

      this.logger.log('info', 'API key created', {
        userId: user.id,
        apiKeyId: apiKey.id,
        apiKeyName: apiKey.name
      });

      // Return with the key visible (only time it's shown)
      res.status(201).json(this.toDTOWithSecret(apiKey));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/user-api-keys/:id
   * Update an API key (name only)
   */
  @Put('/:id', [ZodIdValidator()])
  async updateKey(
    @Response() res: express.Response,
    @Request('user') user: AuthenticatedUser,
    @Params('id') id: number,
    @Body() body: UserApiKeyUpdateInput,
    @Next() next: express.NextFunction
  ) {
    try {
      // Validate input
      const validated = UserApiKeyUpdateInputSchema.parse(body);

      // Update with ownership validation
      const apiKey = await this.userApiKeyDAO.update(id, user.id, validated);

      this.logger.log('info', 'API key updated', {
        userId: user.id,
        apiKeyId: apiKey.id,
        apiKeyName: apiKey.name
      });

      res.json(this.toDTO(apiKey));
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        next(new NotFoundError('API key not found'));
      } else {
        next(error);
      }
    }
  }

  /**
   * DELETE /api/v1/user-api-keys/:id
   * Delete an API key
   */
  @Delete('/:id', [ZodIdValidator()])
  async deleteKey(
    @Response() res: express.Response,
    @Request('user') user: AuthenticatedUser,
    @Params('id') id: number,
    @Next() next: express.NextFunction
  ) {
    try {
      await this.userApiKeyDAO.delete(id, user.id);

      this.logger.log('info', 'API key deleted', {
        userId: user.id,
        apiKeyId: id
      });

      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        next(new NotFoundError('API key not found'));
      } else {
        next(error);
      }
    }
  }

  /**
   * POST /api/v1/user-api-keys/:id/regenerate
   * Regenerate an API key
   */
  @Post('/:id/regenerate', [ZodIdValidator()])
  async regenerateKey(
    @Response() res: express.Response,
    @Request('user') user: AuthenticatedUser,
    @Params('id') id: number,
    @Next() next: express.NextFunction
  ) {
    try {
      const apiKey = await this.userApiKeyDAO.regenerateKey(id, user.id);

      this.logger.log('info', 'API key regenerated', {
        userId: user.id,
        apiKeyId: apiKey.id,
        apiKeyName: apiKey.name
      });

      // Return with the new key visible
      res.json(this.toDTOWithSecret(apiKey));
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        next(new NotFoundError('API key not found'));
      } else {
        next(error);
      }
    }
  }
}

