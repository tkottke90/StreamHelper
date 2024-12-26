import express from 'express';
import {
  Controller,
  Response,
  Request,
  Next,
  Post,
  Query,
  Get,
  Delete,
  Params,
  Body
} from '@decorators/express';
import passport from 'passport';
import { StreamRoute, StreamRouteEntry } from '../routes';
import { Inject } from '@decorators/di';
import { StreamDao, StreamDaoIdentifier } from '../dao/stream.dao';
import {
  StreamDTO,
  StreamFindDTO,
  StreamFindSchema,
  StreamSchema
} from '../dto/stream.dto';
import { AuthenticatedUser } from '../interfaces/auth.interfaces';
import { DtoWithLinksSchema } from '../utilities/hateos';
import { ZodIdValidator } from '../middleware/zod-middleware';
import { ForbiddenError, NotFoundError } from '../utilities/errors.util';
import {
  LoggerService,
  LoggerServiceIdentifier
} from '../services/logger.service';
import { NginxOnPublishAuthBody } from '../interfaces/nginx.interfaces';

const StreamDTOWithLinks = DtoWithLinksSchema(StreamSchema);

const AuthMiddleware = passport.authenticate('cookie', { session: false });

@Controller(StreamRoute.path, [express.json({ limit: '1mb' }), AuthMiddleware])
export default class StreamController {
  constructor(
    @Inject(StreamDaoIdentifier) readonly streamDao: StreamDao,
    @Inject(LoggerServiceIdentifier) readonly logger: LoggerService
  ) {}

  @Post('/')
  async createStream(
    @Response() res: express.Response,
    @Request('user') user: AuthenticatedUser,
    @Next() next: express.NextFunction
  ) {
    try {
      const result = await this.streamDao.create({
        ownerId: user.id
      });

      res.json(this.toDTO(result));
    } catch (error) {
      next(error);
    }
  }

  @Post('/close')
  async closeStream(
    @Response() res: express.Response,
    @Body() body: NginxOnPublishAuthBody,
    @Next() next: express.NextFunction
  ) {
    try {
      this.logger.log('debug', 'Stream Close Message Received', {
        nginx: body
      });

      const matchingStreams = await this.streamDao.get({ key: body.name });

      if (matchingStreams.length === 0) {
        throw new NotFoundError('Invalid Stream Key');
      }

      const [firstStream] = matchingStreams;

      const result = await this.streamDao.setLiveStatus(firstStream.id, false);

      res.json(this.toDTO(result));
    } catch (error) {
      next(error);
    }
  }

  @Delete('/:id', [ZodIdValidator()])
  async deleteStream(
    @Response() res: express.Response,
    @Request('user') user: AuthenticatedUser,
    @Params('id') streamId: number,
    @Next() next: express.NextFunction
  ) {
    try {
      if (!(await this.streamDao.isUserOwner(streamId, user.id))) {
        throw new ForbiddenError('You are not allowed to access this stream');
      }

      const result = await this.streamDao.delete(streamId);

      res.json(this.toDTO(result));
    } catch (error) {
      next(error);
    }
  }

  @Get('/')
  async getStreams(
    @Response() res: express.Response,
    @Query() filter: StreamFindDTO,
    @Request('user') user: AuthenticatedUser,
    @Next() next: express.NextFunction
  ) {
    try {
      const query = StreamFindSchema.parse({ ...filter, ownerId: user.id });

      const result = await this.streamDao.get(query);

      res.json(result.map((stream) => this.toDTO(stream)));
    } catch (error) {
      next(error);
    }
  }

  @Post('/')
  async endLiveStream(
    @Response() res: express.Response,
    @Query() filter: StreamFindDTO,
    @Request('user') user: AuthenticatedUser,
    @Next() next: express.NextFunction
  ) {
    try {
      const query = StreamFindSchema.parse({ ...filter, ownerId: user.id });

      const result = await this.streamDao.get(query);

      res.json(result.map((stream) => this.toDTO(stream)));
    } catch (error) {
      next(error);
    }
  }

  toDTO(stream: StreamDTO) {
    return StreamDTOWithLinks.parse({
      ...stream,
      url: `${this.getStreamUrlPath()}/${stream.key}`,
      links: {
        self: StreamRouteEntry.url({ id: stream.id }),
        parent: StreamRoute.url()
      }
    });
  }

  private getStreamUrlPath() {
    return process.env.BASE_STREAM_URL ?? 'http://localhost:5000/live';
  }
}
