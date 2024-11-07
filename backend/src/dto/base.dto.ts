import z from 'zod';

export type BaseSchema<T extends Record<string, any>> = Omit<
  T,
  'id' | 'createdAt' | 'updatedAt'
>;

export type ZodBaseSchema<K extends Record<string, any>> = z.ZodRawShape & {
  [key in keyof BaseSchema<K>]: z.ZodTypeAny;
};

export const BaseDTO = z.object({
  id: z.number(),
  createdAt: z.date(),
  updatedAt: z.date()
});
