import express from 'express';
import {
  Controller,
  Response,
  Request,
  Next,
  Post,
  Query,
  Get
} from '@decorators/express';
import passport from 'passport';
import { StreamRoute } from '../routes';
import { Inject } from '@decorators/di';
import { StreamDao, StreamDaoIdentifier } from '../dao/stream.dao';
import { StreamFindDTO, StreamFindSchema } from '../dto/stream.dto';
import { AuthenticatedUser } from '../interfaces/auth.interfaces';
import { randomUUID } from 'crypto';

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

      res.json(result);
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
        ownerId: user.id,
        key: randomUUID(),
        url: 'http://stream-helper.tdkottke.com'
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
