import z from 'zod';

export type BaseSchema<T extends Record<string, any>> = Omit<
  T,
  'id' | 'createdAt' | 'updatedAt'
>;

export type ZodBaseSchema<K extends Record<string, any>> = z.ZodRawShape & {
  [key in keyof BaseSchema<K>]: z.ZodTypeAny;
};

export type ZodSchemaKeysConfig<TConfig extends z.ZodTypeAny> = Record<
  keyof z.infer<TConfig>,
  z.ZodTypeAny
>;

export const BaseDTO = z.object({
  id: z.number(),
  createdAt: z.date({ coerce: true }),
  updatedAt: z.date({ coerce: true })
});

// Date/DateTime filter matching Prisma's DateTimeFilter
const dateOrString = z.union([z.date({ coerce: true }), z.string().datetime()]);

export const boolFilter = z.union([z.boolean(), z.null()]).optional();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const dateFilter: z.ZodOptional<
  z.ZodUnion<
    [
      z.ZodDate,
      z.ZodString,
      z.ZodObject<{
        equals: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
        in: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodDate, z.ZodString]>>>;
        notIn: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodDate, z.ZodString]>>>;
        lt: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
        lte: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
        gt: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
        gte: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
        not: z.ZodOptional<
          z.ZodUnion<[z.ZodDate, z.ZodString, z.ZodLazy<any>]>
        >;
      }>
    ]
  >
> = z
  .union([
    z.date({ coerce: true }),
    z.string().datetime(),
    z.object({
      equals: dateOrString.optional(),
      in: z.array(dateOrString).optional(),
      notIn: z.array(dateOrString).optional(),
      lt: dateOrString.optional(),
      lte: dateOrString.optional(),
      gt: dateOrString.optional(),
      gte: dateOrString.optional(),
      not: z
        .union([
          z.date({ coerce: true }),
          z.string().datetime(),
          z.lazy(() => dateFilter)
        ])
        .optional()
    })
  ])
  .optional();

export const numberFilter = z
  .union([
    z.number(),
    z.object({
      in: z.array(z.number()).optional(),
      notIn: z.array(z.number()).optional(),
      lt: z.number().optional(),
      lte: z.number().optional(),
      gt: z.number().optional(),
      gte: z.number().optional(),
      not: z.null().optional()
    })
  ])
  .optional();

export const stringFilter = z
  .union([
    z.string(),
    z.object({
      contains: z.string().optional(),
      startsWith: z.string().optional(),
      endsWith: z.string().optional()
    })
  ])
  .optional();
