import { Container, Inject, Injectable, InjectionToken } from '@decorators/di';
import type { PrismaClient, StreamDestination } from '../../prisma/generated/prisma/client.js';
import type { CreateStreamDestinationInput } from '../dto/stream-destination.dto.js';
import { StreamDestinationRouteEntry } from '../routes.js';
import { SQLServiceIdentifier, SqlService } from '../services/sql.service.js';

@Injectable()
export class StreamDestinationDAO {
  private readonly model: PrismaClient['streamDestination'];

  constructor(
    @Inject(SQLServiceIdentifier) private readonly sqlService: SqlService
  ) {
    this.model = this.sqlService.getClient().streamDestination;
  }

  /**
   * Create a new stream destination
   */
  async create(data: CreateStreamDestinationInput): Promise<StreamDestination> {
    return this.model.create({ data });
  }

  /**
   * Find a stream destination by ID with ownership validation
   */
  async findById(
    id: number,
    ownerId: number
  ): Promise<StreamDestination | null> {
    return this.model.findFirst({
      where: {
        id,
        ownerId,
        deletedAt: null
      }
    });
  }

  /**
   * Find all stream destinations for a specific stream (with ownership validation)
   */
  async findByStreamId(
    streamId: number,
    ownerId: number
  ): Promise<StreamDestination[]> {
    return this.model.findMany({
      where: {
        streamId,
        ownerId,
        deletedAt: null
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Find all enabled stream destinations for a specific stream (no ownership check - used by multicast service)
   */
  async findEnabledByStreamId(streamId: number): Promise<StreamDestination[]> {
    return this.model.findMany({
      where: {
        streamId,
        enabled: true,
        deletedAt: null
      }
    });
  }

  /**
   * Find all stream destinations for a user
   */
  async findByOwnerId(ownerId: number): Promise<StreamDestination[]> {
    return this.model.findMany({
      where: {
        ownerId,
        deletedAt: null
      },
      include: {
        stream: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Update a stream destination with ownership validation
   */
  async update(
    id: number,
    ownerId: number,
    data: Partial<StreamDestination>
  ): Promise<StreamDestination> {
    // Verify ownership before updating
    const existing = await this.findById(id, ownerId);
    if (!existing) {
      throw new Error('Stream destination not found or access denied');
    }

    return this.model.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Soft delete a stream destination with ownership validation
   */
  async softDelete(id: number, ownerId: number): Promise<StreamDestination> {
    // Verify ownership before deleting
    const existing = await this.findById(id, ownerId);
    if (!existing) {
      throw new Error('Stream destination not found or access denied');
    }

    return this.model.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    });
  }

  /**
   * Creates a reference path for a stream destination
   */
  async toReferencePath(dest: StreamDestination) {
    return {
      [dest.platform]: StreamDestinationRouteEntry.url({ id: dest.id })
    };
  }
}

export const StreamDestinationDAOIdentifier = new InjectionToken(
  'StreamDestinationDAO'
);
Container.provide([
  { provide: StreamDestinationDAOIdentifier, useClass: StreamDestinationDAO }
]);
