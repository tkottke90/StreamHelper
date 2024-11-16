import z from 'zod';
import { BaseDTO } from './base.dto';

export const UserRoleCreateSchema = z
  .object({
    value: z.string()
  })
  .required();

export const UserRoleSchema = UserRoleCreateSchema.merge(BaseDTO);

export type UserCreateDTO = z.infer<typeof UserRoleCreateSchema>;
export type UserDTO = z.infer<typeof UserRoleSchema>;
