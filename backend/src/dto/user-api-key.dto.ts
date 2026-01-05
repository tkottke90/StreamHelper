import { z } from 'zod';
import { DtoWithLinksSchema } from '../utilities/hateos.js';
import { BaseDTO } from './base.dto.js';

// Create input schema - only name and expiresAt are client-controlled
export const UserApiKeyCreateInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  expiresAt: z.date({ coerce: true }).optional().nullable()  // Optional expiration date
});
export type UserApiKeyCreateInput = z.infer<typeof UserApiKeyCreateInputSchema>;

// Update input schema - name and expiresAt can be updated
export const UserApiKeyUpdateInputSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  expiresAt: z.date({ coerce: true }).optional().nullable()  // Can set, update, or remove expiration
});
export type UserApiKeyUpdateInput = z.infer<typeof UserApiKeyUpdateInputSchema>;

// Full entity schema (internal use)
export const UserApiKeySchema = BaseDTO.extend({
  ownerId: z.number(),
  name: z.string(),
  key: z.string(),
  lastUsedAt: z.date({ coerce: true }).nullable(),
  expiresAt: z.date({ coerce: true }).nullable()
});
export type UserApiKey = z.infer<typeof UserApiKeySchema>;

// Response schema - excludes the key for security, includes computed fields
export const UserApiKeyResponseSchema = BaseDTO.extend({
  ownerId: z.number(),
  name: z.string(),
  lastUsedAt: z.date({ coerce: true }).nullable(),
  expiresAt: z.date({ coerce: true }).nullable(),
  isExpired: z.boolean(),  // Computed field
  neverExpires: z.boolean()  // Computed field
});
export type UserApiKeyDTO = z.infer<typeof UserApiKeyResponseSchema>;

// Response schema with secret - includes key (only for create/regenerate)
export const UserApiKeyWithSecretResponseSchema = BaseDTO.extend({
  ownerId: z.number(),
  name: z.string(),
  key: z.string(),
  lastUsedAt: z.date({ coerce: true }).nullable(),
  expiresAt: z.date({ coerce: true }).nullable(),
  isExpired: z.boolean(),  // Computed field
  neverExpires: z.boolean()  // Computed field
});
export type UserApiKeyWithSecretDTO = z.infer<typeof UserApiKeyWithSecretResponseSchema>;

// HATEOS-wrapped DTO
export const UserApiKeyDTOWithLinksSchema = DtoWithLinksSchema(UserApiKeyResponseSchema);
export type UserApiKeyDTOWithLinks = z.infer<typeof UserApiKeyDTOWithLinksSchema>;

// HATEOS-wrapped DTO with secret
export const UserApiKeyWithSecretDTOWithLinksSchema = DtoWithLinksSchema(UserApiKeyWithSecretResponseSchema);
export type UserApiKeyWithSecretDTOWithLinks = z.infer<typeof UserApiKeyWithSecretDTOWithLinksSchema>;

