import express from 'express';
import {
  Body,
  Controller,
  Response,
  Request,
  Next,
  Post
} from '@decorators/express';
import passport from 'passport';
import { StreamRoute } from '../routes';
import { Inject } from '@decorators/di';
import { StreamDao, StreamDaoIdentifier } from '../dao/stream.dao';
import { StreamFindDTO, StreamFindSchema } from '../dto/stream.dto';
import { AuthenticatedUser } from '../interfaces/auth.interfaces';

@Controller(StreamRoute.path, [
  passport.authenticate('cookie', { session: false })
])
export default class ServerStatusController {
  constructor(@Inject(StreamDaoIdentifier) readonly streamDao: StreamDao) {}

  @Post('/')
  async getRoot(
    @Response() res: express.Response,
    @Body() body: StreamFindDTO,
    @Request('user') user: AuthenticatedUser,
    @Next() next: express.NextFunction
  ) {
    try {
      const query = StreamFindSchema.parse({ ...body, ownerId: user.id });

      const result = await this.streamDao.get(query);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
