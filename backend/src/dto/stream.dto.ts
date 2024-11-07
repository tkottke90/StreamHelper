import z from 'zod';
import { BaseDTO } from './base.dto';

export const StreamCreateSchema = z.object({
  key: z.string(),
  url: z.string().url(),
  ownerId: z.number()
});

export const StreamSchema = StreamCreateSchema.merge(BaseDTO);
export const StreamFindSchema = StreamSchema.partial();

export type StreamCreateDTO = z.infer<typeof StreamCreateSchema>;
export type StreamDTO = z.infer<typeof StreamSchema>;
export type StreamFindDTO = z.infer<typeof StreamFindSchema>;
