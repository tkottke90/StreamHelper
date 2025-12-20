import { Container, Inject, Injectable, InjectionToken } from '@decorators/di';
import type { Prisma, PrismaClient } from '../../prisma/generated/prisma/client.js';
import type { UserGameCreateDTO, UserGameDTO } from '../dto/userGame.dto.js';
import { UserGameSchema } from '../dto/userGame.dto.js';
import { SQLServiceIdentifier, SqlService } from '../services/sql.service.js';
import type { OptionalFilters } from './utilities.dao.js';

@Injectable()
export class UserGameDAO {
  private readonly model: PrismaClient['userGame'];

  constructor(
    @Inject(SQLServiceIdentifier) private readonly sqlService: SqlService
  ) {
    this.model = this.sqlService.getClient().userGame;
  }

  /**
   * Create a new user game
   */
  async create(data: UserGameCreateDTO): Promise<UserGameDTO> {
    const userGame = await this.model.create({
      data
    });

    return UserGameSchema.parse(userGame);
  }

  async find(query: Prisma.UserGameFindManyArgs) {
    return this.model.findMany({
      ...query
    });
  }

  async findFirst(query: Prisma.UserGameFindFirstArgs) {
    return this.model.findFirst({
      ...query
    });
  }

  /**
   * Find a user game by ID
   */
  async findById(id: number, filter: OptionalFilters<Prisma.UserGameWhereInput, 'id'> = {}): Promise<UserGameDTO | null> {
    const userGame = await this.model.findFirst({
      where: {
        ...filter,
        id,
      }
    });

    if (!userGame) {
      return null;
    }

    return UserGameSchema.parse(userGame);
  }

  /**
   * Find a user game by UUID
   */
  async findByUUID(gameUUID: string, filter: OptionalFilters<Prisma.UserGameWhereInput, 'id' | 'gameUUID'> = {}): Promise<UserGameDTO | null> {
    const userGame = await this.model.findFirst({
      where: {
        ...filter,
        gameUUID
      }
    });

    if (!userGame) {
      return null;
    }

    return UserGameSchema.parse(userGame);
  }

  /**
   * Find all user games for a specific owner
   */
  async findByOwnerId(ownerId: number, filter: OptionalFilters<Prisma.UserGameWhereInput, 'ownerId'> = {}): Promise<UserGameDTO[]> {
    const userGames = await this.model.findMany({
      where: {
        ...filter,
        ownerId
      },
      orderBy: { createdAt: 'desc' }
    });

    return userGames.map(game => UserGameSchema.parse(game));
  }

  async findBySessionUUID(sessionUUID: string) {
    return this.model.findMany({
      where: {
        userGameDatas: {
          some: {
            sessionUUID
          }
        }
      },
      include: {
        userGameDatas: true,
        userGameKeys: true
      }
    });
  }

  /**
   * Update a user game
   */
  async update(
    id: number,
    data: Partial<Omit<UserGameDTO, 'id' | 'createdAt' | 'updatedAt' | 'gameUUID' | 'ownerId'>>,
    ownerId? : number
  ): Promise<UserGameDTO> {
    // Verify ownership before updating
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('User game not found or access denied');
    }

    const updated = await this.model.update({
      where: { id, ownerId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    return UserGameSchema.parse(updated);
  }

  /**
   * Delete a user game
   * This will cascade delete related UserGameData and UserGameDataKeys
   */
  async delete(id: number): Promise<void> {
    await this.model.delete({
      where: { id }
    });
  }

  /**
   * Check if a user owns a specific game
   */
  async canUserEdit(gameId: number, ownerId: number): Promise<boolean> {
    const game = await this.model.findFirst({
      where: { id: gameId, ownerId }
    });

    return !!game;
  }
}

export const UserGameDAOIdentifier = new InjectionToken('UserGameDAO');
Container.provide([{ provide: UserGameDAOIdentifier, useClass: UserGameDAO }]);

