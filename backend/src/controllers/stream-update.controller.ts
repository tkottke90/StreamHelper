import express from 'express';
import { Inject } from '@decorators/di';
import { Body, Controller, Next, Post, Response } from '@decorators/express';
import { StreamDaoIdentifier, StreamDao } from '../dao/stream.dao';
import { StreamUpdateRoute } from '../routes';
import {
  LoggerServiceIdentifier,
  LoggerService
} from '../services/logger.service';
import {
  NginxRtmpDirectiveBody,
  NginxRtmpOnUpdateBody
} from '../interfaces/nginx.interfaces';
import { BadRequestError, ForbiddenError } from '../utilities/errors.util';

@Controller(StreamUpdateRoute.path, [express.json({ limit: '1mb' })])
export default class StreamUpdateController {
  constructor(
    @Inject(StreamDaoIdentifier) readonly streamDao: StreamDao,
    @Inject(LoggerServiceIdentifier) readonly logger: LoggerService
  ) {}

  @Post('/activate')
  async validateAndEnableStream(
    @Body() body: NginxRtmpDirectiveBody,
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

      const stream = await this.updateStreamStatus(body.name, true);

      this.logger.log('debug', 'Stream is now active', {
        stream: stream.id,
        owner: stream.ownerId
      });

      res.send('');
    } catch (error) {
      next(error);
    }
  }

  @Post('/deactivate')
  async disableStreamKey(
    @Body() body: NginxRtmpDirectiveBody,
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

      const stream = await this.updateStreamStatus(body.name, false);

      this.logger.log('debug', 'Stream is now inactive', {
        stream: stream.id,
        owner: stream.ownerId
      });

      res.send('');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Provides an API for RTMP Server to call to monitor the status of a stream.
   * In NGINX this is tied to the `on_update` directive which should allow for
   * the user to be able to control if the server is live or not creating a bi-directional
   * feedback loop where the stream can be opened/closed by the publish command and
   * closed by updating the status manually
   */
  @Post('/status')
  async streamStatus(
    @Body() body: NginxRtmpOnUpdateBody,
    @Response() res: express.Response,
    @Next() next: express.NextFunction
  ) {
    try {
      this.logger.log('debug', 'Validating stream key', { nginx: body });

      if (body?.call !== 'on_update') {
        throw new BadRequestError('Invalid event type: ' + body.call);
      }

      if (!body.name) {
        throw new BadRequestError('Missing or invalid stream key');
      }

      const stream = await this.streamDao.getByKey(body.name);

      if (!stream) {
        throw new ForbiddenError('Stream Not Found');
      }

      this.logger.log('debug', 'Stream is now inactive', {
        stream: stream.id,
        owner: stream.ownerId
      });

      res.send('');
    } catch (error) {
      next(error);
    }
  }

  private async updateStreamStatus(streamKey: string, enabled: boolean) {
    // No need to check the user here because this should only come from our
    // NGINX instance running the RTMP server
    const stream = await this.streamDao.getByKey(streamKey);

    if (!stream) {
      throw new ForbiddenError('Stream Not Found');
    }

    // Update the stream to be live per the publish event
    await this.streamDao.setLiveStatus(stream.id, enabled);

    return stream;
  }
}
