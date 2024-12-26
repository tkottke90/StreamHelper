import express from 'express';
import { Inject } from '@decorators/di';
import { Body, Controller, Next, Post, Response } from '@decorators/express';
import { StreamDaoIdentifier, StreamDao } from '../dao/stream.dao';
import { StreamUpdateRoute } from '../routes';
import {
  LoggerServiceIdentifier,
  LoggerService
} from '../services/logger.service';
import { NginxOnPublishAuthBody } from '../interfaces/nginx.interfaces';
import { BadRequestError, ForbiddenError } from '../utilities/errors.util';

@Controller(StreamUpdateRoute.path, [express.json({ limit: '1mb' })])
export default class ServerStatusController {
  constructor(
    @Inject(StreamDaoIdentifier) readonly streamDao: StreamDao,
    @Inject(LoggerServiceIdentifier) readonly logger: LoggerService
  ) {}

  @Post('/activate')
  async validateAndEnableStream(
    @Body() body: NginxOnPublishAuthBody,
    @Response() res: express.Response,
    @Next() next: express.NextFunction
  ) {
    try {
      this.logger.log('debug', 'Validating stream key', { nginx: body });

      if (body?.call !== 'publish') {
        throw new BadRequestError('Invalid validation event');
      }

      if (!body.name) {
        throw new BadRequestError('Missing or invalid stream key');
      }

      // No need to check the user here because this should only come from our
      // NGINX instance running the RTMP server
      const matchingStreams = await this.streamDao.get({ key: body.name });

      if (matchingStreams.length === 0) {
        throw new ForbiddenError('Stream Not Found');
      }

      // Should only get one back so we can grab that one if the
      // stream is longer than zero
      const [firstStream] = matchingStreams;

      // Update the stream to be live per the publish event
      await this.streamDao.setLiveStatus(firstStream.id, true);
      this.logger.log('debug', 'Stream is now active', {
        stream: firstStream.id,
        owner: firstStream.ownerId
      });

      res.send('');
    } catch (error) {
      next(error);
    }
  }

  @Post('/deactivate')
  async disableStreamKey(
    @Body() body: NginxOnPublishAuthBody,
    @Response() res: express.Response,
    @Next() next: express.NextFunction
  ) {
    try {
      this.logger.log('debug', 'Validating stream key', { nginx: body });

      if (body?.call !== 'publish_done') {
        throw new BadRequestError('Invalid event type: ' + body.call);
      }

      if (!body.name) {
        throw new BadRequestError('Missing or invalid stream key');
      }

      // No need to check the user here because this should only come from our
      // NGINX instance running the RTMP server
      const matchingStreams = await this.streamDao.get({ key: body.name });

      if (matchingStreams.length === 0) {
        throw new ForbiddenError('Stream Not Found');
      }

      // Should only get one back so we can grab that one if the
      // stream is longer than zero
      const [firstStream] = matchingStreams;

      // Update the stream to be live per the publish event
      await this.streamDao.setLiveStatus(firstStream.id, false);
      this.logger.log('debug', 'Stream is now inactive', {
        stream: firstStream.id,
        owner: firstStream.ownerId
      });

      res.send('');
    } catch (error) {
      next(error);
    }
  }
}
