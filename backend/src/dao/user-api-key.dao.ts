import { Container, Inject, Injectable, InjectionToken } from '@decorators/di';
import { randomUUID } from 'crypto';
import type { PrismaClient, UserApiKey } from '../../prisma/generated/prisma/client.js';
import type { UserApiKeyCreateInput, UserApiKeyUpdateInput } from '../dto/user-api-key.dto.js';
import { SQLServiceIdentifier, SqlService } from '../services/sql.service.js';

@Injectable()
export class UserApiKeyDAO {
  private readonly model: PrismaClient['userApiKey'];

  constructor(
    @Inject(SQLServiceIdentifier) private readonly sqlService: SqlService
  ) {
    this.model = this.sqlService.getClient().userApiKey;
  }

  /**
   * Generate a secure API key
   */
  private generateKey(): string {
    return randomUUID();
  }

  /**
   * Create a new API key for a user
   */
  async create(ownerId: number, data: UserApiKeyCreateInput): Promise<UserApiKey> {
    return this.model.create({
      data: {
        ownerId,
        name: data.name,
        key: this.generateKey(),
        expiresAt: data.expiresAt ?? null,
        lastUsedAt: null  // Never used yet
      }
    });
  }

  /**
   * Find an API key by ID with ownership validation
   */
  async findByIdForOwner(id: number, ownerId: number): Promise<UserApiKey | null> {
    return this.model.findFirst({
      where: {
        id,
        ownerId
      }
    });
  }

  /**
   * Find all API keys for a user
   */
  async findByOwnerId(ownerId: number): Promise<UserApiKey[]> {
    return this.model.findMany({
      where: {
        ownerId
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Update an API key with ownership validation
   */
  async update(
    id: number,
    ownerId: number,
    data: UserApiKeyUpdateInput
  ): Promise<UserApiKey> {
    // Verify ownership before updating
    const existing = await this.findByIdForOwner(id, ownerId);
    if (!existing) {
      throw new Error('API key not found or access denied');
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
   * Delete an API key with ownership validation
   */
  async delete(id: number, ownerId: number): Promise<UserApiKey> {
    // Verify ownership before deleting
    const existing = await this.findByIdForOwner(id, ownerId);
    if (!existing) {
      throw new Error('API key not found or access denied');
    }

    return this.model.delete({
      where: { id }
    });
  }

  /**
   * Regenerate an API key with ownership validation
   */
  async regenerateKey(id: number, ownerId: number): Promise<UserApiKey> {
    // Verify ownership before regenerating
    const existing = await this.findByIdForOwner(id, ownerId);
    if (!existing) {
      throw new Error('API key not found or access denied');
    }

    return this.model.update({
      where: { id },
      data: {
        key: this.generateKey(),
        lastUsedAt: null,  // Reset usage tracking on regeneration
        updatedAt: new Date()
      }
    });
  }

  /**
   * Find an API key by key value (for authentication)
   */
  async findByKey(key: string): Promise<UserApiKey | null> {
    return this.model.findUnique({
      where: { key }
    });
  }

  /**
   * Record usage of an API key
   */
  async recordUsage(id: number): Promise<void> {
    await this.model.update({
      where: { id },
      data: {
        lastUsedAt: new Date()
      }
    });
  }

  /**
   * Check if an API key is expired
   */
  isExpired(apiKey: UserApiKey): boolean {
    if (!apiKey.expiresAt) {
      return false;  // No expiration date means never expires
    }
    return apiKey.expiresAt < new Date();
  }

  /**
   * Find all active (non-expired) API keys for a user
   */
  async findActiveByOwnerId(ownerId: number): Promise<UserApiKey[]> {
    return this.model.findMany({
      where: {
        ownerId,
        OR: [
          { expiresAt: null },  // Never expires
          { expiresAt: { gt: new Date() } }  // Not yet expired
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const UserApiKeyDAOIdentifier = new InjectionToken('UserApiKeyDAO');
Container.provide([
  { provide: UserApiKeyDAOIdentifier, useClass: UserApiKeyDAO }
]);

