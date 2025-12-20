import crypto from 'node:crypto';
import z from 'zod';
import { DtoWithLinksSchema } from '../utilities/hateos.js';
import { BaseDTO } from './base.dto.js';

export const UserGameImmutableFields = z.object({
  gameUUID: z.string().uuid().default(crypto.randomUUID()),
  ownerId: z.number().int().positive()
});

export const UserGameCreateInputSchema = z
  .object({
    game: z.string(),
    allowAutoCreateSessions: z.boolean().optional().default(false)
  })
  .required();


export const UserGameSessionCreateSchema = z
  .object({
    /**
     * Session ID for the game data.  This ensures that we do not
     * cross-contaminate data between different sessions.  Defaults
     * to a random UUID if not provided
     */
    sessionUUID: z.string().uuid().default(crypto.randomUUID()),
    
    /**
     * ID of the game to initialize
     */
    gameUUID: z.string().uuid(),
    
    /**
     * ID of the user to initialize the game data for
     */
    userId: z.number().int().positive(),
  })
  .required();


export const UserGameCreateSchema = UserGameCreateInputSchema.extend(UserGameImmutableFields.shape);
export const UserGameSchema = UserGameCreateSchema.extend(BaseDTO.shape);
export const UserGameUpdateSchema = UserGameCreateInputSchema.partial();

export const UserGameDTOWithLinks = DtoWithLinksSchema(UserGameSchema);

export type UserGameSessionCreateDTO = z.infer<typeof UserGameSessionCreateSchema>;

export type UserGameCreateDTO = z.infer<typeof UserGameCreateSchema>;
export type UserGameUpdateDTO = z.infer<typeof UserGameUpdateSchema>;

export type UserGameDTO = z.infer<typeof UserGameSchema>;
export type UserGameDTOWithLinks = z.infer<typeof UserGameDTOWithLinks>;
