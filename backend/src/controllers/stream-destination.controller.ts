import express from 'express';
import {
  Controller,
  Response,
  Request,
  Next,
  Post,
  Get,
  Put,
  Delete,
  Params,
  Body
} from '@decorators/express';
import { Inject } from '@decorators/di';
import { AuthenticatedUser } from '../interfaces/auth.interfaces';
import { CookieMiddleware } from '../middleware/auth.middleware';
import { ForbiddenError, NotFoundError } from '../utilities/errors.util';
import {
  LoggerService,
  LoggerServiceIdentifier
} from '../services/logger.service';
import {
  StreamDestinationDAO,
  StreamDestinationDAOIdentifier
} from '../dao/stream-destination.dao';
import {
  EncryptionService,
  EncryptionServiceIdentifier
} from '../services/encryption.service';
import {
  CreateStreamDestinationInput,
  CreateStreamDestinationSchema,
  UpdateStreamDestinationInput,
  UpdateStreamDestinationSchema,
  PLATFORM_RTMP_URLS,
  Platform
} from '../dto/stream-destination.dto';
import { StreamDao, StreamDaoIdentifier } from '../dao/stream.dao';
import { ZodIdValidator } from '../middleware/zod-middleware';

@Controller('/api/v1/stream-destinations', [
  express.json({ limit: '1mb' }),
  CookieMiddleware
])
export default class StreamDestinationController {
  constructor(
    @Inject(StreamDestinationDAOIdentifier)
    readonly streamDestinationDAO: StreamDestinationDAO,
    @Inject(StreamDaoIdentifier) readonly streamDao: StreamDao,
    @Inject(EncryptionServiceIdentifier)
    readonly encryptionService: EncryptionService,
    @Inject(LoggerServiceIdentifier) readonly logger: LoggerService
  ) {}

  /**
   * GET /api/v1/stream-destinations/metadata
   * Get API metadata for UI forms and filters
   */
  @Get('/metadata')
  async getMetadata(@Response() res: express.Response) {
    res.json({
      create: {
        streamId: {
          type: 'number',
          required: true,
          description: 'ID of the stream to multicast',
          validation: {
            min: 1,
            integer: true
          }
        },
        platform: {
          type: 'enum',
          required: true,
          description: 'Streaming platform',
          options: ['twitch', 'youtube', 'facebook', 'custom'],
          default: 'twitch'
        },
        streamKey: {
          type: 'string',
          required: true,
          description: 'Stream key for the destination platform',
          validation: {
            minLength: 1
          },
          sensitive: true
        },
        rtmpUrl: {
          type: 'string',
          required: false,
          description:
            'Custom RTMP URL (required only when platform is "custom")',
          validation: {
            format: 'url'
          },
          conditionallyRequired: {
            when: 'platform',
            equals: 'custom'
          }
        },
        displayName: {
          type: 'string',
          required: false,
          description: 'Friendly name for this destination',
          default: 'Uses platform name if not provided'
        }
      },
      update: {
        enabled: {
          type: 'boolean',
          required: false,
          description: 'Enable or disable this destination'
        },
        streamKey: {
          type: 'string',
          required: false,
          description: 'Update the stream key',
          validation: {
            minLength: 1
          },
          sensitive: true
        },
        rtmpUrl: {
          type: 'string',
          required: false,
          description: 'Update the RTMP URL',
          validation: {
            format: 'url'
          }
        },
        displayName: {
          type: 'string',
          required: false,
          description: 'Update the friendly name'
        }
      },
      filter: {
        streamId: {
          type: 'number',
          description: 'Filter by stream ID',
          validation: {
            min: 1,
            integer: true
          }
        },
        platform: {
          type: 'enum',
          description: 'Filter by platform',
          options: ['twitch', 'youtube', 'facebook', 'custom']
        },
        enabled: {
          type: 'boolean',
          description: 'Filter by enabled status'
        }
      },
      platforms: {
        twitch: {
          name: 'Twitch',
          rtmpUrl: PLATFORM_RTMP_URLS.twitch,
          requiresCustomUrl: false
        },
        youtube: {
          name: 'YouTube',
          rtmpUrl: PLATFORM_RTMP_URLS.youtube,
          requiresCustomUrl: false
        },
        facebook: {
          name: 'Facebook',
          rtmpUrl: PLATFORM_RTMP_URLS.facebook,
          requiresCustomUrl: false
        },
        custom: {
          name: 'Custom RTMP',
          rtmpUrl: null,
          requiresCustomUrl: true
        }
      }
    });
  }

  /**
   * GET /api/v1/stream-destinations
   * Get all stream destinations for the authenticated user
   */
  @Get('/')
  async getAllDestinations(
    @Response() res: express.Response,
    @Request('user') user: AuthenticatedUser,
    @Next() next: express.NextFunction
  ) {
    try {
      const destinations = await this.streamDestinationDAO.findByOwnerId(
        user.id
      );

      // Remove encrypted stream keys from response
      const sanitized = destinations.map((dest) => ({
        ...dest,
        streamKey: undefined
      }));

      res.json(sanitized);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/stream-destinations/stream/:streamId
   * Get all stream destinations for a specific stream (with ownership check)
   */
  @Get('/stream/:streamId', [ZodIdValidator('streamId')])
  async getDestinationsByStream(
    @Response() res: express.Response,
    @Request('user') user: AuthenticatedUser,
    @Params('streamId') streamId: number,
    @Next() next: express.NextFunction
  ) {
    try {
      // Verify user owns the stream
      if (!(await this.streamDao.isUserOwner(streamId, user.id))) {
        throw new ForbiddenError('You are not allowed to access this stream');
      }

      const destinations = await this.streamDestinationDAO.findByStreamId(
        streamId,
        user.id
      );

      // Remove encrypted stream keys from response
      const sanitized = destinations.map((dest) => ({
        ...dest,
        streamKey: undefined
      }));

      res.json(sanitized);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/stream-destinations
   * Create a new stream destination
   */
  @Post('/')
  async createDestination(
    @Response() res: express.Response,
    @Request('user') user: AuthenticatedUser,
    @Body() body: CreateStreamDestinationInput,
    @Next() next: express.NextFunction
  ) {
    try {
      // Validate input
      const validated = CreateStreamDestinationSchema.parse(body);

      // Verify user owns the stream
      if (!(await this.streamDao.isUserOwner(validated.streamId, user.id))) {
        throw new ForbiddenError('You are not allowed to access this stream');
      }

      // Determine RTMP URL
      const rtmpUrl =
        validated.platform === 'custom'
          ? validated.rtmpUrl!
          : PLATFORM_RTMP_URLS[
              validated.platform as Exclude<Platform, 'custom'>
            ];

      // Encrypt stream key
      const encryptedStreamKey = this.encryptionService.encrypt(
        validated.streamKey
      );

      // Create destination
      const destination = await this.streamDestinationDAO.create({
        streamId: validated.streamId,
        ownerId: user.id,
        platform: validated.platform,
        rtmpUrl,
        streamKey: encryptedStreamKey,
        displayName: validated.displayName || validated.platform
      });

      // Remove encrypted stream key from response
      res.status(201).json({
        ...destination,
        streamKey: undefined
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/stream-destinations/:id
   * Update a stream destination
   */
  @Put('/:id', [ZodIdValidator()])
  async updateDestination(
    @Response() res: express.Response,
    @Request('user') user: AuthenticatedUser,
    @Params('id') id: number,
    @Body() body: UpdateStreamDestinationInput,
    @Next() next: express.NextFunction
  ) {
    try {
      // Validate input
      const validated = UpdateStreamDestinationSchema.parse(body);

      // Update with ownership validation (DAO will verify ownership)
      const destination = await this.streamDestinationDAO.update(id, user.id, {
        enabled: validated.enabled,
        displayName: validated.displayName,
        rtmpUrl: validated.rtmpUrl,

        // Encrypt and store the key if provided
        streamKey:
          validated.streamKey &&
          this.encryptionService.encrypt(validated.streamKey)
      });

      // Remove encrypted stream key from response
      res.json({
        ...destination,
        streamKey: undefined
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        next(new NotFoundError('Stream destination not found'));
      } else if (
        error instanceof Error &&
        error.message.includes('access denied')
      ) {
        next(new ForbiddenError('You are not allowed to access this resource'));
      } else {
        next(error);
      }
    }
  }

  /**
   * DELETE /api/v1/stream-destinations/:id
   * Delete a stream destination
   */
  @Delete('/:id', [ZodIdValidator()])
  async deleteDestination(
    @Response() res: express.Response,
    @Request('user') user: AuthenticatedUser,
    @Params('id') id: number,
    @Next() next: express.NextFunction
  ) {
    try {
      // Soft delete with ownership validation (DAO will verify ownership)
      const destination = await this.streamDestinationDAO.softDelete(
        id,
        user.id
      );

      // Remove encrypted stream key from response
      res.json({
        ...destination,
        streamKey: undefined
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        next(new NotFoundError('Stream destination not found'));
      } else if (
        error instanceof Error &&
        error.message.includes('access denied')
      ) {
        next(new ForbiddenError('You are not allowed to access this resource'));
      } else {
        next(error);
      }
    }
  }
}
