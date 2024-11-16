import { z } from 'zod';

export function DtoWithLinksSchema<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
) {
  return schema.merge(
    z.object({
      links: z.record(z.string(), z.string())
    })
  );
}
