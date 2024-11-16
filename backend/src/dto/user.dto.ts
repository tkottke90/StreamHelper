import z from 'zod';

const BaseDTO = z.object({
  id: z.number(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const UserCreateSchema = z
  .object({
    uuid: z.string().uuid(),
    displayName: z.string()
  })
  .required();

export const UserSchema = UserCreateSchema.merge(BaseDTO);
export const UserSchemaWithRoles = UserSchema.merge(
  z.object({ roles: z.array(z.string()) })
);

export type UserCreateDTO = z.infer<typeof UserCreateSchema>;
export type UserDTO = z.infer<typeof UserSchema>;
export type UserWithRolesDTO = z.infer<typeof UserSchemaWithRoles>;
