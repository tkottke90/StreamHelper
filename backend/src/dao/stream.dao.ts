import { Container, Injectable, InjectionToken } from '@decorators/di';
import PrismaClient from '../db';
import { Prisma } from '@prisma/client';
import { StreamCreateDTO } from '../dto/stream.dto';

@Injectable()
export class StreamDao {
  private readonly model: typeof PrismaClient.inputStream;

  constructor() {
    this.model = PrismaClient.inputStream;
  }

  create(data: StreamCreateDTO) {
    return this.model.create({
      data
    });
  }

  get(filter: Prisma.InputStreamFindManyArgs['where']) {
    return this.model.findMany({
      where: filter
    });
  }
}

export const StreamDaoIdentifier = new InjectionToken('StreamDao');
Container.provide([{ provide: StreamDaoIdentifier, useClass: StreamDao }]);
