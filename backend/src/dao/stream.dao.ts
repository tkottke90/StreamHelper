import { Container, Injectable, InjectionToken } from '@decorators/di';
import PrismaClient from '../db';
import { Prisma } from '@prisma/client';
import { StreamCreateDTO, StreamDTO, StreamSchema } from '../dto/stream.dto';

@Injectable()
export class StreamDao {
  private readonly model: typeof PrismaClient.inputStream;

  constructor() {
    this.model = PrismaClient.inputStream;
  }

  async create(data: StreamCreateDTO): Promise<StreamDTO> {
    const stream = await this.model.create({
      data
    });

    return StreamSchema.parse(stream);
  }

  async get(filter: Prisma.InputStreamFindManyArgs['where']) {
    if (filter && !filter?.deletedAt) {
      filter.deletedAt = null;
    }

    const streams = await this.model.findMany({
      where: filter
    });

    return streams.map((stream) => StreamSchema.parse(stream));
  }

  async getByKey(key: string) {
    const stream = await this.model.findFirst({ where: { key } });

    // We want to return nothing if there was no match
    // and let the caller decided what to do with the result
    // instead of throwing an error and asking the caller to
    // catch the error if they do not want it to be thrown.
    if (!stream) {
      return undefined;
    }

    return StreamSchema.parse(stream);
  }

  async delete(id: number) {
    return this.model.update({
      where: { id },
      data: { deletedAt: new Date().toISOString() }
    });
  }

  async isUserOwner(streamId: number, ownerId: number) {
    const stream = await this.model.findFirst({
      where: { id: streamId, ownerId }
    });

    return !!stream;
  }

  async setLiveStatus(streamId: number, isLive: boolean) {
    return await this.model.update({
      where: { id: streamId },
      data: { isLive }
    });
  }

  async update(streamId: number, data: Prisma.InputStreamUpdateInput) {
    return await this.model.update({
      where: { id: streamId },
      data
    });
  }
}

export const StreamDaoIdentifier = new InjectionToken('StreamDao');
Container.provide([{ provide: StreamDaoIdentifier, useClass: StreamDao }]);
