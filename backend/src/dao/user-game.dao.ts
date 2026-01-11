import { Container, Inject, Injectable, InjectionToken } from '@decorators/di';
import type { Prisma, PrismaClient } from '../../prisma/generated/prisma/client.js';
import type { UserGameCreateDTO, UserGameDTO } from '../dto/userGame.dto.js';
import { UserGameSchema } from '../dto/userGame.dto.js';
import { RedisService, RedisServiceIdentifier } from '../services/redis.service.js';
import { SQLServiceIdentifier, SqlService } from '../services/sql.service.js';
import type { OptionalFilters } from './utilities.dao.js';

@Injectable()
export class UserGameDAO {
  private readonly model: PrismaClient['userGame'];
  private readonly gameDataModel: PrismaClient['userGameData'];
  private readonly gameDataKeysModel: PrismaClient['userGameDataKeys'];

  constructor(
    @Inject(SQLServiceIdentifier) private readonly sqlService: SqlService,
    @Inject(RedisServiceIdentifier) private readonly redis: RedisService
  ) {
    this.model = this.sqlService.getClient().userGame;
    this.gameDataModel = this.sqlService.getClient().userGameData;
    this.gameDataKeysModel = this.sqlService.getClient().userGameDataKeys;
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
      include: {
        userGameDatas: true,
        userGameKeys: true
      },
      orderBy: { game: 'desc' }
    });

    return userGames.map(game => UserGameSchema.parse(game));
  }

  async findBySessionUUID(sessionUUID: string) {
    return this.model.findFirst({
      where: {
        userGameDatas: {
          some: {
            sessionUUID
          }
        }
      }
    });
  }

  async syncGameData(key: string) {
    const [_gameData,, gameId ,sessionUUID ] = key.split(':');

    // Load the game
    const game = await this.model.findFirst({
      where: {
        gameUUID: gameId
      }
    });

    if (!game) {
      throw new Error('Game not found');
    }

    // Get the oldest items in the queue
    const itemsToPublish = await this.redis.getClient().lRange(key, 1000, -1) as string[];
    
    // Trim the queue to 1000 items - No need to await
    // this because it can happen asynchronously from 
    // the rest of this process
    void this.redis.getClient().lTrim(key, 0, 999);

    // Extract the data keys from the game data items
    const keyLists = itemsToPublish.flatMap(item => {
      const data = JSON.parse(item) as Record<string, any>;
      return Object.keys(data);
    });

    // Get the unique keys
    const uniqueKeys = [...new Set(keyLists)];

    // Load the existing keys so we know what needs to be created
    const existingKeys = await this.gameDataKeysModel.findMany({
      where: {
        gameId: game.id,
        key: {
          in: uniqueKeys
        }
      }
    });

    // Get the keys that need to be created
    const keysToCreate = uniqueKeys.filter(key => !existingKeys.find(existing => existing.key === key));

    // Create missing keys
    await this.gameDataKeysModel.createMany({
      data: keysToCreate.map(key => ({
        gameId: game.id,
        key
      })),
    });

    // Add the game data to the database
    await this.gameDataModel.createMany({
      data: itemsToPublish.map(item => {
        const data = JSON.parse(item) as Record<string, any>;
        return {
          gameId: game.id,
          ownerId: game.ownerId,
          sessionUUID,
          data
        };
      })
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

