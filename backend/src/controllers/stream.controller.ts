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
  Params
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
import { ForbiddenError } from '../utilities/errors.util';

const StreamDTOWithLinks = DtoWithLinksSchema(StreamSchema);

@Controller(StreamRoute.path, [
  passport.authenticate('cookie', { session: false })
])
export default class ServerStatusController {
  constructor(@Inject(StreamDaoIdentifier) readonly streamDao: StreamDao) {}

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
