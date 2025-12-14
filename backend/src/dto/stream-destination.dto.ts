import { z } from 'zod';

// Platform enum
export const PlatformSchema = z.enum([
  'twitch',
  'youtube',
  'facebook',
  'custom'
]);
export type Platform = z.infer<typeof PlatformSchema>;

// Platform-specific RTMP URLs
export const PLATFORM_RTMP_URLS: Record<Exclude<Platform, 'custom'>, string> = {
  twitch: 'rtmp://live.twitch.tv/app',
  youtube: 'rtmp://a.rtmp.youtube.com/live2',
  facebook: 'rtmps://live-api-s.facebook.com:443/rtmp'
};

// Create destination DTO
export const CreateStreamDestinationSchema = z
  .object({
    streamId: z.number().int().positive(),
    platform: PlatformSchema,
    streamKey: z.string().min(1),
    rtmpUrl: z.string().url().optional(), // Required only for 'custom' platform
    displayName: z.string().optional()
  })
  .refine(
    (data) => {
      // If platform is 'custom', rtmpUrl is required
      if (data.platform === 'custom' && !data.rtmpUrl) {
        return false;
      }
      return true;
    },
    {
      message: 'rtmpUrl is required when platform is "custom"',
      path: ['rtmpUrl']
    }
  );
export type CreateStreamDestinationInput = z.infer<
  typeof CreateStreamDestinationSchema
>;

// Update destination DTO
export const UpdateStreamDestinationSchema = z.object({
  enabled: z.boolean().optional(),
  streamKey: z.string().min(1).optional(),
  rtmpUrl: z.string().url().optional(),
  displayName: z.string().optional()
});
export type UpdateStreamDestinationInput = z.infer<
  typeof UpdateStreamDestinationSchema
>;

// Response DTO (excludes sensitive data)
export const StreamDestinationResponseSchema = z.object({
  id: z.number(),
  streamId: z.number(),
  ownerId: z.number(),
  platform: PlatformSchema,
  enabled: z.boolean(),
  rtmpUrl: z.string(),
  displayName: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
  // Note: streamKey is NOT included in response for security
});
export type StreamDestinationResponse = z.infer<
  typeof StreamDestinationResponseSchema
>;
