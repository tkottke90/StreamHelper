# Multi-cast Streaming Implementation Plan

## Overview
This document outlines the implementation plan for adding multi-cast streaming capabilities to StreamHelper, enabling users to simultaneously stream to multiple platforms (Twitch, YouTube) while streaming to our service.

## Architecture Summary
- **Stream Ingestion**: NGINX-RTMP receives incoming streams
- **Multi-cast Engine**: Node.js backend spawns ffmpeg child processes to restream to external platforms
- **Process Management**: Graceful shutdown handling for both API and ffmpeg processes
- **Health Monitoring**: NGINX monitors backend health via `on_update` directive

---

## 1. StreamDestination Data Structure

### 1.1 Database Schema Changes

**File**: `backend/prisma/schema.prisma`

Add new `StreamDestination` model:

```prisma
model StreamDestination {
  id Int @id @default(autoincrement())

  // Relationship to parent stream
  stream InputStream @relation(fields: [streamId], references: [id], onDelete: Cascade)
  streamId Int

  // User ownership for security
  owner User @relation(fields: [ownerId], references: [id])
  ownerId Int

  // Platform configuration
  platform String // 'twitch', 'youtube', 'facebook', 'custom'
  enabled Boolean @default(true)

  // Destination RTMP configuration
  rtmpUrl String // e.g., 'rtmp://live.twitch.tv/app'
  streamKey String // Encrypted stream key

  // Optional metadata
  displayName String @default("") // User-friendly name

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @default(now()) @updatedAt
  deletedAt DateTime?

  @@index([streamId])
  @@index([ownerId])
  @@index([platform])
}
```

Update `InputStream` model:

```prisma
model InputStream {
  id Int @id @default(autoincrement())
  key String @default(uuid())

  owner User @relation(fields: [ownerId], references: [id])
  ownerId Int

  isLive Boolean @default(false)

  // Add relationship to destinations
  destinations StreamDestination[]

  createdAt DateTime @default(now())
  updatedAt DateTime @default(now()) @updatedAt
  deletedAt DateTime?
}
```

Update `User` model to include relationship:

```prisma
model User {
  id Int @id @default(autoincrement())
  // ... existing fields ...

  streams InputStream[]
  streamDestinations StreamDestination[]  // Add this

  // ... rest of model ...
}
```

### 1.2 Migration Steps

1. Run `npm run db-migrate` to create migration
2. Migration will add `StreamDestination` table
3. Add indexes for performance

---

## 2. Stream Destination APIs

### 2.1 DTOs (Data Transfer Objects)

**File**: `backend/src/dto/stream-destination.dto.ts`

```typescript
import { z } from 'zod';

// Platform enum
export const PlatformSchema = z.enum(['twitch', 'youtube', 'facebook', 'custom']);
export type Platform = z.infer<typeof PlatformSchema>;

// Platform-specific RTMP URLs
export const PLATFORM_RTMP_URLS: Record<Exclude<Platform, 'custom'>, string> = {
  twitch: 'rtmp://live.twitch.tv/app',
  youtube: 'rtmp://a.rtmp.youtube.com/live2',
  facebook: 'rtmps://live-api-s.facebook.com:443/rtmp'
};

// Create destination DTO
export const CreateStreamDestinationSchema = z.object({
  streamId: z.number().int().positive(),
  platform: PlatformSchema,
  streamKey: z.string().min(1),
  rtmpUrl: z.string().url().optional(), // Required only for 'custom' platform
  displayName: z.string().optional()
});
export type CreateStreamDestinationInput = z.infer<typeof CreateStreamDestinationSchema>;

// Update destination DTO
export const UpdateStreamDestinationSchema = z.object({
  enabled: z.boolean().optional(),
  streamKey: z.string().min(1).optional(),
  rtmpUrl: z.string().url().optional(),
  displayName: z.string().optional()
});
export type UpdateStreamDestinationInput = z.infer<typeof UpdateStreamDestinationSchema>;

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
export type StreamDestinationResponse = z.infer<typeof StreamDestinationResponseSchema>;
```

### 2.2 DAO (Data Access Object)

**File**: `backend/src/dao/stream-destination.dao.ts`

```typescript
import { Injectable } from '@decorators/di';
import { PrismaClient, StreamDestination } from '@prisma/client';
import { db } from '../db';

@Injectable()
export class StreamDestinationDAO {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = db;
  }

  async create(data: {
    streamId: number;
    ownerId: number;
    platform: string;
    rtmpUrl: string;
    streamKey: string;
    displayName?: string;
  }): Promise<StreamDestination> {
    return this.prisma.streamDestination.create({ data });
  }

  async findById(id: number, ownerId: number): Promise<StreamDestination | null> {
    return this.prisma.streamDestination.findUnique({
      where: { id, ownerId, deletedAt: null }
    });
  }

  async findByStreamId(streamId: number, ownerId: number): Promise<StreamDestination[]> {
    return this.prisma.streamDestination.findMany({
      where: { streamId, ownerId, deletedAt: null }
    });
  }

  async findEnabledByStreamId(streamId: number): Promise<StreamDestination[]> {
    return this.prisma.streamDestination.findMany({
      where: { streamId, enabled: true, deletedAt: null }
    });
  }

  async findByOwnerId(ownerId: number): Promise<StreamDestination[]> {
    return this.prisma.streamDestination.findMany({
      where: { ownerId, deletedAt: null },
      include: { stream: true }
    });
  }

  async update(id: number, ownerId: number, data: Partial<StreamDestination>): Promise<StreamDestination> {
    // Verify ownership before updating
    const existing = await this.findById(id, ownerId);
    if (!existing) {
      throw new Error('Stream destination not found or access denied');
    }

    return this.prisma.streamDestination.update({
      where: { id },
      data: { ...data, updatedAt: new Date() }
    });
  }

  async softDelete(id: number, ownerId: number): Promise<StreamDestination> {
    // Verify ownership before deleting
    const existing = await this.findById(id, ownerId);
    if (!existing) {
      throw new Error('Stream destination not found or access denied');
    }

    return this.prisma.streamDestination.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
}
```

### 2.3 Controller

**File**: `backend/src/controllers/stream-destination.controller.ts`

```typescript
import { Controller, Post, Get, Put, Delete, Params, Body, Response, Request } from '@decorators/express';
import { Injectable } from '@decorators/di';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { StreamDestinationDAO } from '../dao/stream-destination.dao';
import { StreamDAO } from '../dao/stream.dao';
import { EncryptionService } from '../services/encryption.service';
import {
  CreateStreamDestinationSchema,
  UpdateStreamDestinationSchema,
  PLATFORM_RTMP_URLS,
  type CreateStreamDestinationInput,
  type UpdateStreamDestinationInput
} from '../dto/stream-destination.dto';

// Extend Express Request to include user from authentication
interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: number;
    email: string;
  };
}

@Controller('/stream-destinations/v1')
@Injectable()
export class StreamDestinationController {
  constructor(
    private destinationDAO: StreamDestinationDAO,
    private streamDAO: StreamDAO,
    private encryptionService: EncryptionService
  ) {}

  @Post('/')
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() body: CreateStreamDestinationInput,
    @Response() res: ExpressResponse
  ) {
    const validated = CreateStreamDestinationSchema.parse(body);
    const userId = req.user.id;

    // Verify user owns the stream
    const stream = await this.streamDAO.findById(validated.streamId);
    if (!stream || stream.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied: You do not own this stream' });
    }

    // Auto-populate RTMP URL for known platforms
    const rtmpUrl = validated.platform === 'custom'
      ? validated.rtmpUrl!
      : PLATFORM_RTMP_URLS[validated.platform];

    // Encrypt stream key before storing
    const encryptedKey = this.encryptionService.encrypt(validated.streamKey);

    const destination = await this.destinationDAO.create({
      streamId: validated.streamId,
      ownerId: userId,
      platform: validated.platform,
      rtmpUrl,
      streamKey: encryptedKey,
      displayName: validated.displayName || `${validated.platform} Stream`
    });

    // Remove sensitive data from response
    const { streamKey, ...safeDestination } = destination;

    res.status(201).json(safeDestination);
  }

  @Get('/stream/:streamId')
  async getByStreamId(
    @Request() req: AuthenticatedRequest,
    @Params('streamId') streamId: string,
    @Response() res: ExpressResponse
  ) {
    const userId = req.user.id;
    const parsedStreamId = parseInt(streamId, 10);

    if (isNaN(parsedStreamId)) {
      return res.status(400).json({ error: 'Invalid stream ID' });
    }

    // Verify user owns the stream
    const stream = await this.streamDAO.findById(parsedStreamId);
    if (!stream || stream.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied: You do not own this stream' });
    }

    const destinations = await this.destinationDAO.findByStreamId(parsedStreamId, userId);

    // Remove stream keys from all responses
    const safeDestinations = destinations.map(({ streamKey, ...dest }) => dest);

    res.json(safeDestinations);
  }

  @Get('/')
  async getAll(
    @Request() req: AuthenticatedRequest,
    @Response() res: ExpressResponse
  ) {
    const userId = req.user.id;
    const destinations = await this.destinationDAO.findByOwnerId(userId);

    // Remove stream keys from all responses
    const safeDestinations = destinations.map(({ streamKey, ...dest }) => dest);

    res.json(safeDestinations);
  }

  @Put('/:id')
  async update(
    @Request() req: AuthenticatedRequest,
    @Params('id') id: string,
    @Body() body: UpdateStreamDestinationInput,
    @Response() res: ExpressResponse
  ) {
    const validated = UpdateStreamDestinationSchema.parse(body);
    const userId = req.user.id;
    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      return res.status(400).json({ error: 'Invalid destination ID' });
    }

    try {
      // Encrypt new stream key if provided
      const updateData = validated.streamKey
        ? { ...validated, streamKey: this.encryptionService.encrypt(validated.streamKey) }
        : validated;

      // DAO will verify ownership
      const destination = await this.destinationDAO.update(parsedId, userId, updateData);
      const { streamKey, ...safeDestination } = destination;

      res.json(safeDestination);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found or access denied')) {
        return res.status(403).json({ error: 'Access denied: Destination not found or you do not own it' });
      }
      throw error;
    }
  }

  @Delete('/:id')
  async delete(
    @Request() req: AuthenticatedRequest,
    @Params('id') id: string,
    @Response() res: ExpressResponse
  ) {
    const userId = req.user.id;
    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      return res.status(400).json({ error: 'Invalid destination ID' });
    }

    try {
      // DAO will verify ownership
      await this.destinationDAO.softDelete(parsedId, userId);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found or access denied')) {
        return res.status(403).json({ error: 'Access denied: Destination not found or you do not own it' });
      }
      throw error;
    }
  }
}
```

### 2.4 Security Enforcement

**Key Security Requirements:**

1. **User Ownership Validation**
   - All stream destinations MUST be owned by a user
   - Users can ONLY access their own stream destinations
   - Ownership is verified at both DAO and Controller levels

2. **Authentication Required**
   - All endpoints require authenticated user via `req.user`
   - User ID is extracted from authentication middleware
   - No anonymous access to stream destinations

3. **Type Safety**
   - All request bodies use Zod schemas for validation
   - All parameters are properly typed (no `any` types)
   - Type inference from Zod schemas ensures consistency

4. **Sensitive Data Protection**
   - Stream keys are NEVER returned in API responses
   - Stream keys are encrypted at rest
   - Decryption only happens when spawning ffmpeg processes

**Example Authentication Middleware** (if not already implemented):

```typescript
// backend/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import passport from 'passport';

export interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  passport.authenticate('jwt', { session: false }, (err: Error, user: any) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    (req as AuthenticatedRequest).user = user;
    next();
  })(req, res, next);
}
```

**Apply to Controller:**

```typescript
import { requireAuth } from '../middleware/auth.middleware';

// In your app setup
app.use('/api/v1/stream-destinations', requireAuth);
```

---

## 3. Multicast Service + FFMPEG Configuration

### 3.1 Encryption Service

**File**: `backend/src/services/encryption.service.ts`

```typescript
import { Injectable } from '@decorators/di';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor() {
    // Get encryption key from environment or generate one
    const keyString = process.env.ENCRYPTION_KEY;
    if (!keyString) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    this.key = Buffer.from(keyString, 'hex');
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedData: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

### 3.2 Multicast Service

**File**: `backend/src/services/multicast.service.ts`

```typescript
import { Injectable } from '@decorators/di';
import { spawn, ChildProcess } from 'child_process';
import { StreamDestinationDAO } from '../dao/stream-destination.dao';
import { EncryptionService } from './encryption.service';
import { LoggerService } from './logger.service';

interface MulticastProcess {
  process: ChildProcess;
  destinationId: number;
  platform: string;
  startTime: Date;
}

@Injectable()
export class MulticastService {
  private activeProcesses: Map<string, MulticastProcess[]> = new Map();
  private isShuttingDown = false;

  constructor(
    private destinationDAO: StreamDestinationDAO,
    private encryptionService: EncryptionService,
    private logger: LoggerService
  ) {}

  /**
   * Start multicast for a stream
   */
  async startMulticast(streamKey: string, streamId: number): Promise<void> {
    if (this.isShuttingDown) {
      this.logger.warn('Rejecting new multicast - system is shutting down');
      return;
    }

    // Get all enabled destinations for this stream
    const destinations = await this.destinationDAO.findEnabledByStreamId(streamId);

    if (destinations.length === 0) {
      this.logger.info(`No destinations configured for stream ${streamKey}`);
      return;
    }

    const processes: MulticastProcess[] = [];

    for (const dest of destinations) {
      try {
        // Decrypt stream key
        const decryptedKey = this.encryptionService.decrypt(dest.streamKey);

        // Construct full RTMP URL
        const fullRtmpUrl = `${dest.rtmpUrl}/${decryptedKey}`;

        // Source stream URL (from nginx-rtmp)
        const sourceUrl = `rtmp://stream_helper_lb:1935/live/${streamKey}`;

        // Spawn ffmpeg process with copy codec (no re-encoding)
        const ffmpeg = spawn('ffmpeg', [
          '-i', sourceUrl,
          '-c', 'copy',           // Copy codec - no re-encoding
          '-f', 'flv',            // Output format
          fullRtmpUrl
        ], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        // Setup process event handlers
        this.setupProcessHandlers(ffmpeg, streamKey, dest.id, dest.platform);

        processes.push({
          process: ffmpeg,
          destinationId: dest.id,
          platform: dest.platform,
          startTime: new Date()
        });

        this.logger.info(`Started multicast to ${dest.platform} for stream ${streamKey}`);
      } catch (error) {
        this.logger.error(`Failed to start multicast to ${dest.platform}:`, error);
      }
    }

    // Store processes for this stream
    this.activeProcesses.set(streamKey, processes);
  }

  /**
   * Stop multicast for a stream
   */
  async stopMulticast(streamKey: string): Promise<void> {
    const processes = this.activeProcesses.get(streamKey);

    if (!processes || processes.length === 0) {
      return;
    }

    this.logger.info(`Stopping multicast for stream ${streamKey}`);

    // Stop all processes for this stream
    await Promise.all(
      processes.map(({ process, platform }) =>
        this.stopProcess(process, platform, streamKey)
      )
    );

    // Remove from active processes
    this.activeProcesses.delete(streamKey);
  }

  /**
   * Gracefully stop a single ffmpeg process
   */
  private async stopProcess(
    process: ChildProcess,
    platform: string,
    streamKey: string
  ): Promise<void> {
    return new Promise((resolve) => {
      const timeout = 5000; // 5 second timeout
      let resolved = false;

      const cleanup = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      // Listen for process exit
      process.once('exit', cleanup);

      // Phase 1: Try graceful quit via stdin (0-1s)
      if (process.stdin && !process.stdin.destroyed) {
        process.stdin.write('q\n');
        this.logger.debug(`Sent 'q' command to ${platform} process for ${streamKey}`);
      }

      // Phase 2: Send SIGTERM after 1 second
      setTimeout(() => {
        if (!resolved && !process.killed) {
          process.kill('SIGTERM');
          this.logger.debug(`Sent SIGTERM to ${platform} process for ${streamKey}`);
        }
      }, 1000);

      // Phase 3: Force kill with SIGKILL after timeout
      setTimeout(() => {
        if (!resolved && !process.killed) {
          process.kill('SIGKILL');
          this.logger.warn(`Force killed ${platform} process for ${streamKey}`);
        }
        cleanup();
      }, timeout);
    });
  }

  /**
   * Setup event handlers for ffmpeg process
   */
  private setupProcessHandlers(
    process: ChildProcess,
    streamKey: string,
    destinationId: number,
    platform: string
  ): void {
    // Log stdout
    process.stdout?.on('data', (data) => {
      this.logger.debug(`[${platform}:${streamKey}] ${data.toString()}`);
    });

    // Log stderr (ffmpeg outputs to stderr)
    process.stderr?.on('data', (data) => {
      this.logger.debug(`[${platform}:${streamKey}] ${data.toString()}`);
    });

    // Handle process exit
    process.on('exit', (code, signal) => {
      if (code === 0) {
        this.logger.info(`${platform} multicast ended normally for ${streamKey}`);
      } else {
        this.logger.warn(
          `${platform} multicast exited with code ${code}, signal ${signal} for ${streamKey}`
        );
      }
    });

    // Handle process errors
    process.on('error', (error) => {
      this.logger.error(`${platform} multicast error for ${streamKey}:`, error);
    });
  }

  /**
   * Get count of active multicast streams
   */
  getActiveStreamCount(): number {
    return this.activeProcesses.size;
  }

  /**
   * Get total count of active processes
   */
  getActiveProcessCount(): number {
    let count = 0;
    for (const processes of this.activeProcesses.values()) {
      count += processes.length;
    }
    return count;
  }

  /**
   * Graceful shutdown - stop all multicast processes
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    this.logger.info('Shutting down multicast service...');

    const streamKeys = Array.from(this.activeProcesses.keys());

    await Promise.all(
      streamKeys.map(key => this.stopMulticast(key))
    );

    this.logger.info('Multicast service shutdown complete');
  }
}
```

### 3.3 Integration with Stream Update Controller

**File**: `backend/src/controllers/stream-update.controller.ts` (modifications)

Add multicast service integration to existing controller:

```typescript
import { MulticastService } from '../services/multicast.service';

@Controller('/stream-update')
@Injectable()
export class StreamUpdateController {
  constructor(
    private streamDAO: StreamDAO,
    private multicastService: MulticastService,  // Add this
    private logger: LoggerService
  ) {}

  @Post('/activate')
  async validateAndEnableStream(@Body() body: NginxRtmpDirectiveBody) {
    // Existing validation logic...
    const stream = await this.updateStreamStatus(body.name, true);

    // Start multicast after stream is validated
    await this.multicastService.startMulticast(body.name, stream.id);

    return stream;
  }

  @Post('/deactivate')
  async disableStream(@Body() body: NginxRtmpDirectiveBody) {
    // Stop multicast before marking stream as offline
    await this.multicastService.stopMulticast(body.name);

    // Existing deactivation logic...
    const stream = await this.updateStreamStatus(body.name, false);

    return stream;
  }
}
```

---

## 4. Graceful Shutdown

### 4.1 Main Application Entry Point

**File**: `backend/index.ts` (complete rewrite)

```typescript
import 'reflect-metadata';
import { Container } from '@decorators/di';
import express from 'express';
import http from 'http';
import { attachControllers } from '@decorators/express';
import { app } from './src/app';
import { MulticastService } from './src/services/multicast.service';
import { LoggerService } from './src/services/logger.service';
import { db } from './src/db';

const PORT = process.env.PORT || 5000;
let server: http.Server;
let isShuttingDown = false;

async function startServer() {
  const logger = Container.get(LoggerService);

  try {
    // Create HTTP server
    server = http.createServer(app);

    // Start listening
    await new Promise<void>((resolve) => {
      server.listen(PORT, () => {
        logger.info(`Server started on port ${PORT}`);
        resolve();
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  const logger = Container.get(LoggerService);

  logger.info(`Received ${signal}, starting graceful shutdown...`);

  const shutdownTimeout = 8000; // 8 seconds (before Docker's 10s SIGKILL)
  const timeoutHandle = setTimeout(() => {
    logger.error('Graceful shutdown timeout - forcing exit');
    process.exit(1);
  }, shutdownTimeout);

  try {
    // Phase 1: Stop accepting new connections
    logger.info('Phase 1: Stopping HTTP server...');
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    logger.info('HTTP server stopped');

    // Phase 2: Stop all multicast processes
    logger.info('Phase 2: Stopping multicast processes...');
    const multicastService = Container.get(MulticastService);
    await multicastService.shutdown();
    logger.info('Multicast processes stopped');

    // Phase 3: Close database connections
    logger.info('Phase 3: Closing database connections...');
    await db.$disconnect();
    logger.info('Database connections closed');

    clearTimeout(timeoutHandle);
    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    clearTimeout(timeoutHandle);
    process.exit(1);
  }
}

// Register signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  const logger = Container.get(LoggerService);
  logger.error('Uncaught exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  const logger = Container.get(LoggerService);
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start the server
startServer();
```

### 4.2 Docker Configuration Updates

**File**: `docker-compose.yaml` (modifications)

```yaml
services:
  stream_helper_backend:
    container_name: stream_helper_backend
    build: ./
    networks:
      - stream_helper
    env_file:
      - ./.docker-compose-env
    volumes:
      - './prod-data/:/usr/app/data'
      - './video:/usr/app/public/video'
    depends_on:
      - stream_helper_redis
    stop_grace_period: 10s  # Add this - gives 10s for graceful shutdown
    healthcheck:             # Add this - health monitoring
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:5000/api/v1/server/healthcheck"]
      interval: 10s
      timeout: 3s
      retries: 3
      start_period: 10s

  stream_helper_lb:
    container_name: stream_helper_lb
    build: ./nginx-rtmp
    environment:
      - BACKEND_HOST=stream_helper_backend:5000
    networks:
      - stream_helper
    ports:
      - 1935:1935
      - 8080:8080
    depends_on:
      stream_helper_backend:
        condition: service_healthy  # Wait for backend to be healthy
    stop_grace_period: 5s  # Add this
```

### 4.3 Health Check Endpoint

**File**: `backend/src/controllers/server.controller.ts` (modifications)

Add health check endpoint:

```typescript
@Get('/healthcheck')
getHealthcheck(@Response() res: express.Response) {
  const multicastService = Container.get(MulticastService);

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    activeStreams: multicastService.getActiveStreamCount(),
    activeProcesses: multicastService.getActiveProcessCount(),
    uptime: process.uptime()
  });
}
```

---

## 5. NGINX-RTMP Integration with Backend Health and Multicast

### 5.1 NGINX Configuration Updates

**File**: `nginx-rtmp/nginx.conf` (modifications)

```nginx
rtmp {
  server {
    listen 1935;
    chunk_size 4096;

    application live {
      live on;
      record off;

      # Publish management - validate stream key
      on_publish http://stream_helper_backend:5000/api/v1/stream-update/activate;
      on_publish_done http://stream_helper_backend:5000/api/v1/stream-update/deactivate;

      # Health monitoring - check backend every 30s
      on_update http://stream_helper_backend:5000/api/v1/stream-update/status;
      notify_update_timeout 30s;
      notify_update_strict on;  # Terminate stream if backend is unavailable

      # Drop idle publishers after 10 seconds
      drop_idle_publisher 10s;

      # Wait for key frame before starting playback
      wait_key on;
      wait_video on;
    }
  }
}

http {
  server {
    listen 8080;

    # RTMP statistics
    location /stat {
      rtmp_stat all;
      rtmp_stat_stylesheet stat.xsl;
    }

    location /stat.xsl {
      root /usr/local/nginx/html;
    }
  }
}
```

### 5.2 Backend Status Endpoint

**File**: `backend/src/controllers/stream-update.controller.ts` (add method)

```typescript
@Post('/status')
async streamStatus(@Body() body: NginxRtmpDirectiveBody, @Response() res: express.Response) {
  try {
    // Verify stream still exists and is valid
    const stream = await this.streamDAO.findByKey(body.name);

    if (!stream || stream.deletedAt) {
      // Stream no longer exists - tell nginx to terminate
      return res.status(404).json({ error: 'Stream not found' });
    }

    // Check if multicast processes are healthy
    const multicastService = Container.get(MulticastService);
    const hasActiveProcesses = multicastService.hasActiveProcesses(body.name);

    // Return 200 to keep stream alive
    res.status(200).json({
      status: 'OK',
      streamKey: body.name,
      isLive: stream.isLive,
      hasMulticast: hasActiveProcesses
    });
  } catch (error) {
    this.logger.error('Error in stream status check:', error);
    // Return 500 to signal backend issues - nginx will terminate stream
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### 5.3 Multicast Service Helper Method

**File**: `backend/src/services/multicast.service.ts` (add method)

```typescript
/**
 * Check if stream has active multicast processes
 */
hasActiveProcesses(streamKey: string): boolean {
  const processes = this.activeProcesses.get(streamKey);
  return processes !== undefined && processes.length > 0;
}
```

### 5.4 NGINX Dockerfile Updates

**File**: `nginx-rtmp/Dockerfile` (ensure ffmpeg is NOT needed here)

Since we're running ffmpeg in the backend container, nginx container doesn't need it:

```dockerfile
FROM alfg/nginx-rtmp:latest

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy statistics stylesheet
COPY stat.xsl /usr/local/nginx/html/stat.xsl

EXPOSE 1935 8080

CMD ["nginx", "-g", "daemon off;"]
```

### 5.5 Backend Dockerfile Updates

**File**: `backend/Dockerfile` (ensure ffmpeg is installed)

```dockerfile
FROM node:20-alpine

# Install ffmpeg for multicast streaming
RUN apk add --no-cache ffmpeg

WORKDIR /usr/app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

# Generate Prisma client
RUN npx prisma generate

EXPOSE 5000

# Use exec form to ensure Node.js receives signals
CMD ["node", "dist/index.js"]
```

---

## 6. Implementation Checklist

### Phase 1: Database & Core Services
- [ ] Update Prisma schema with `StreamDestination` model (including `ownerId` field)
- [ ] Update `User` model to include `streamDestinations` relationship
- [ ] Run database migration
- [ ] Create `EncryptionService` with AES-256-GCM encryption
- [ ] Generate and set `ENCRYPTION_KEY` environment variable
- [ ] Create `StreamDestinationDAO` with ownership validation
- [ ] Create DTOs with proper TypeScript types exported

### Phase 2: API Layer
- [ ] Create authentication middleware (if not exists)
- [ ] Create `StreamDestinationController` with typed parameters
- [ ] Implement ownership validation in all endpoints
- [ ] Ensure all `@Body()`, `@Params()`, `@Query()` are properly typed (no `any`)
- [ ] Add `GET /stream-destinations` endpoint (user's destinations)
- [ ] Add `GET /stream-destinations/stream/:streamId` endpoint (with ownership check)
- [ ] Add `POST /stream-destinations` endpoint (with ownership check)
- [ ] Add `PUT /stream-destinations/:id` endpoint (with ownership check)
- [ ] Add `DELETE /stream-destinations/:id` endpoint (with ownership check)
- [ ] Test API endpoints with Postman/curl
- [ ] Verify stream key encryption/decryption
- [ ] Test unauthorized access attempts (should return 403)

### Phase 3: Multicast Service
- [ ] Create `MulticastService` with process management
- [ ] Implement `startMulticast()` method
- [ ] Implement `stopMulticast()` method with graceful shutdown
- [ ] Add process event handlers and logging
- [ ] Integrate with `StreamUpdateController`
- [ ] Test multicast with single destination

### Phase 4: Graceful Shutdown
- [ ] Rewrite `backend/index.ts` with signal handlers
- [ ] Implement multi-phase shutdown process
- [ ] Add shutdown timeout protection
- [ ] Update `docker-compose.yaml` with `stop_grace_period`
- [ ] Add health check endpoint to `ServerController`
- [ ] Test graceful shutdown scenarios

### Phase 5: NGINX Integration
- [ ] Update `nginx.conf` with `on_update` directive
- [ ] Enable `notify_update_strict` mode
- [ ] Add status endpoint to `StreamUpdateController`
- [ ] Update backend Dockerfile to install ffmpeg
- [ ] Add health check to docker-compose
- [ ] Test NGINX-backend communication

### Phase 6: Testing & Validation
- [ ] Test stream ingestion with multicast to Twitch
- [ ] Test stream ingestion with multicast to YouTube
- [ ] Test multiple destinations simultaneously
- [ ] Test graceful shutdown during active streaming
- [ ] Test backend restart during active streaming
- [ ] Test NGINX behavior when backend is unavailable
- [ ] Load test with multiple concurrent streams
- [ ] Verify no orphaned ffmpeg processes after shutdown

### Phase 7: Documentation & Deployment
- [ ] Update API documentation
- [ ] Create user guide for adding stream destinations
- [ ] Document environment variables
- [ ] Create deployment guide
- [ ] Add monitoring/alerting for multicast failures

---

## 7. Environment Variables

Add to `.docker-compose-env`:

```bash
# Encryption key for stream keys (generate with: openssl rand -hex 32)
ENCRYPTION_KEY=your_64_character_hex_string_here

# Database
DATABASE_URL=file:/usr/app/data/stream_helper.db

# Server
PORT=5000
NODE_ENV=production
```

---

## 8. Testing Strategy

### Unit Tests
- `EncryptionService`: Test encrypt/decrypt roundtrip
- `MulticastService`: Test process lifecycle management
- `StreamDestinationDAO`: Test CRUD operations

### Integration Tests
- Test full flow: Create destination → Start stream → Verify multicast → Stop stream
- Test graceful shutdown with active streams
- Test NGINX health monitoring

### Manual Testing
1. **Twitch Multicast**:
   - Create Twitch destination with valid stream key
   - Start streaming to StreamHelper
   - Verify stream appears on Twitch
   - Stop stream and verify cleanup

2. **YouTube Multicast**:
   - Create YouTube destination with valid stream key
   - Start streaming to StreamHelper
   - Verify stream appears on YouTube
   - Stop stream and verify cleanup

3. **Multi-Platform**:
   - Create both Twitch and YouTube destinations
   - Start streaming
   - Verify both platforms receive stream
   - Stop stream and verify all processes cleaned up

4. **Graceful Shutdown**:
   - Start streaming with multicast active
   - Send SIGTERM to backend container
   - Verify ffmpeg processes stop gracefully
   - Verify no orphaned processes

---

## 9. Security Considerations

### 9.1 User Ownership & Access Control
1. **User-Specific Resources**: All stream destinations are owned by a specific user
2. **Ownership Validation**: Every API operation validates user ownership
3. **No Cross-User Access**: Users cannot view, modify, or delete other users' destinations
4. **Database-Level Enforcement**: DAO methods require `ownerId` parameter
5. **Controller-Level Enforcement**: Controllers verify stream ownership before operations

### 9.2 Data Protection
1. **Stream Key Encryption**: All stream keys stored encrypted with AES-256-GCM
2. **Encryption Key Management**: `ENCRYPTION_KEY` stored in environment variables
3. **No Plaintext Keys**: Stream keys never stored or logged in plaintext
4. **Response Sanitization**: Stream keys excluded from all API responses
5. **Decryption Scope**: Keys only decrypted when spawning ffmpeg processes

### 9.3 API Security
1. **Authentication Required**: All endpoints require authenticated user
2. **Type Safety**: No `any` types - all parameters properly typed
3. **Input Validation**: Zod schemas validate all request bodies
4. **Parameter Validation**: All IDs validated and parsed safely
5. **Error Messages**: Generic error messages to prevent information leakage

### 9.4 Additional Security Measures
1. **Rate Limiting**: Add rate limits to prevent abuse
2. **Input Validation**: Validate all RTMP URLs and stream keys
3. **Process Isolation**: ffmpeg processes run with limited permissions
4. **Audit Logging**: Log all create/update/delete operations with user ID
5. **HTTPS Only**: Enforce HTTPS in production for API calls

---

## 10. Monitoring & Observability

### Metrics to Track
- Active multicast streams count
- Active ffmpeg processes count
- Multicast failures per platform
- Average stream duration
- Process restart count

### Logs to Monitor
- Multicast start/stop events
- ffmpeg process errors
- Graceful shutdown progress
- NGINX health check failures

### Alerts
- High multicast failure rate
- Orphaned ffmpeg processes detected
- Backend health check failures
- Disk space for video storage

---

## 11. Future Enhancements

1. **Transcoding Support**: Add option to transcode streams for different platforms
2. **Recording**: Record multicast streams locally
3. **Analytics**: Track viewer counts from external platforms
4. **Auto-Retry**: Automatically retry failed multicast connections
5. **Platform Templates**: Pre-configured settings for popular platforms
6. **Web UI**: Frontend interface for managing destinations
7. **Webhooks**: Notify external services of stream events
8. **Multi-Region**: Support for region-specific RTMP servers


