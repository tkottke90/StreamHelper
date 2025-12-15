import { Container, Injectable, InjectionToken } from '@decorators/di';
import Prisma from '../db.js';
import {
  UserCreateDTO,
  UserSchema,
  UserSchemaWithRoles
} from '../dto/user.dto.js';
import { UserRole } from '../../prisma/generated/prisma/client.js';

@Injectable()
export class UserDao {
  private readonly model: typeof Prisma.user;

  constructor() {
    this.model = Prisma.user;
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
