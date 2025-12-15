import z from 'zod';
import {
  BaseDTO,
  boolFilter,
  dateFilter,
  numberFilter,
  stringFilter,
  ZodSchemaKeysConfig
} from './base.dto.js';
import { DtoWithLinksSchema } from '../utilities/hateos.js';

export const StreamCreateSchema = z.object({
  ownerId: z.number()
});

export const StreamSchema = StreamCreateSchema.merge(BaseDTO).merge(
  z.object({
    url: z.string().url().optional(),
    key: z.string(),
    isLive: z.boolean()
  })
);
export const StreamFindSchema = z
  .object<ZodSchemaKeysConfig<typeof StreamSchema>>({
    ownerId: numberFilter,
    id: numberFilter,
    createdAt: dateFilter,
    updatedAt: dateFilter,
    url: stringFilter,
    key: stringFilter,
    isLive: boolFilter
  })
  .partial();

export type StreamCreateDTO = z.infer<typeof StreamCreateSchema>;
export type StreamDTO = z.infer<typeof StreamSchema>;
export type StreamFindDTO = z.infer<typeof StreamFindSchema>;

export const StreamDTOWithLinks = DtoWithLinksSchema(StreamSchema);

export type StreamDTOWithLinks = z.infer<typeof StreamDTOWithLinks>;
