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

  async delete(id: number) {
    return this.model.delete({
      where: { id }
    });
  }

  async isUserOwner(streamId: number, ownerId: number) {
    const stream = await this.model.findFirst({
      where: { id: streamId, ownerId }
    });

    return !!stream;
  }
}

export const StreamDaoIdentifier = new InjectionToken('StreamDao');
Container.provide([{ provide: StreamDaoIdentifier, useClass: StreamDao }]);
