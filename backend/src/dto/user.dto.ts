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

export type UserCreateDTO = z.infer<typeof UserCreateSchema>;
export type UserDTO = z.infer<typeof UserSchema>;
