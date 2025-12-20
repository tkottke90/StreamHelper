import { Container, Inject, Injectable, InjectionToken } from '@decorators/di';
import type { PrismaClient, UserRole } from '../../prisma/generated/prisma/client.js';
import type { UserCreateDTO } from '../dto/user.dto.js';
import { UserSchema, UserSchemaWithRoles } from '../dto/user.dto.js';
import { SQLServiceIdentifier, SqlService } from '../services/sql.service.js';

@Injectable()
export class UserDao {
  private readonly model: PrismaClient['user'];

  constructor(
    @Inject(SQLServiceIdentifier) private readonly sqlService: SqlService
  ) {
    this.model = this.sqlService.getClient().user;
  }

  createUser(data: UserCreateDTO) {
    return this.model.create({
      data
    });
  }

  async getOrCreate(user: UserCreateDTO) {
    let userRecord = await this.getUserByUuid(user.uuid);

    if (!userRecord) {
      userRecord = await this.createUser(user);
    }

    return UserSchema.parse(userRecord);
  }

  getUser(id: number) {
    return this.model.findFirst({ where: { id } });
  }

  async getUserByUuid(uuid: string, includeRoles = false) {
    let include = {};

    if (includeRoles) {
      include = { roles: true };
    }

    const userRecord = await this.model.findFirst({
      where: { uuid },
      include
    });

    if (!userRecord) {
      return undefined;
    }

    const response = UserSchema.parse(userRecord);

    if (!includeRoles) {
      return response;
    }

    return UserSchemaWithRoles.parse({
      ...response,
      roles: (userRecord as any).roles.map((role: UserRole) => role.value)
    });
  }
}

export const UserDaoIdentifier = new InjectionToken('UserDao');
Container.provide([{ provide: UserDaoIdentifier, useClass: UserDao }]);
