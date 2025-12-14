import {
  Container,
  Inject,
  Injectable,
  InjectionToken
} from '@decorators/di';
import { ChildProcess, spawn } from 'child_process';
import {
  StreamDestinationDAO,
  StreamDestinationDAOIdentifier
} from '../dao/stream-destination.dao';
import {
  EncryptionService,
  EncryptionServiceIdentifier
} from './encryption.service';
import { LoggerService, LoggerServiceIdentifier } from './logger.service';

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
    @Inject(StreamDestinationDAOIdentifier)
    private destinationDAO: StreamDestinationDAO,
    @Inject(EncryptionServiceIdentifier)
    private encryptionService: EncryptionService,
    @Inject(LoggerServiceIdentifier) private logger: LoggerService
  ) {}

  /**
   * Start multicast for a stream
   */
  async startMulticast(streamKey: string, streamId: number): Promise<void> {
    if (this.isShuttingDown) {
      this.logger.log(
        'warn',
        'Rejecting new multicast - system is shutting down'
      );
      return;
    }

    // Get all enabled destinations for this stream
    const destinations =
      await this.destinationDAO.findEnabledByStreamId(streamId);

    if (destinations.length === 0) {
      this.logger.log(
        'info',
        `No destinations configured for stream ${streamKey}`
      );
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

        this.logger.log(
          'info',
          `Starting multicast to ${dest.platform} for stream ${streamKey}`
        );

        // Spawn ffmpeg process with copy codec (no re-encoding)
        const ffmpeg = spawn(
          'ffmpeg',
          [
            '-i',
            sourceUrl,
            '-c',
            'copy', // Copy codec - no re-encoding
            '-f',
            'flv', // Output format
            fullRtmpUrl
          ],
          {
            stdio: ['pipe', 'pipe', 'pipe']
          }
        );

        // Setup process event handlers
        this.setupProcessHandlers(ffmpeg, streamKey, dest.id, dest.platform);

        processes.push({
          process: ffmpeg,
          destinationId: dest.id,
          platform: dest.platform,
          startTime: new Date()
        });

        this.logger.log(
          'info',
          `Started multicast to ${dest.platform} for stream ${streamKey}`
        );
      } catch (error) {
        this.logger.log(
          'error',
          `Failed to start multicast to ${dest.platform}`,
          { error }
        );
      }
    }

    // Store processes for this stream
    if (processes.length > 0) {
      this.activeProcesses.set(streamKey, processes);
    }
  }

  /**
   * Stop multicast for a stream
   */
  async stopMulticast(streamKey: string): Promise<void> {
    const processes = this.activeProcesses.get(streamKey);

    if (!processes || processes.length === 0) {
      return;
    }

    this.logger.log('info', `Stopping multicast for stream ${streamKey}`);

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
   * Check if stream has active multicast processes
   */
  hasActiveProcesses(streamKey: string): boolean {
    const processes = this.activeProcesses.get(streamKey);
    return processes !== undefined && processes.length > 0;
  }

  /**
   * Get count of active streams
   */
  getActiveStreamCount(): number {
    return this.activeProcesses.size;
  }

  /**
   * Gracefully shutdown all multicast processes
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;

    this.logger.log(
      'info',
      `Shutting down multicast service with ${this.activeProcesses.size} active streams`
    );

    // Stop all active streams
    const streamKeys = Array.from(this.activeProcesses.keys());
    await Promise.all(streamKeys.map((key) => this.stopMulticast(key)));

    this.logger.log('info', 'Multicast service shutdown complete');
  }

  /**
   * Stop a single ffmpeg process gracefully
   */
  private async stopProcess(
    process: ChildProcess,
    platform: string,
    streamKey: string
  ): Promise<void> {
    return new Promise((resolve) => {
      const timeout = 8000; // 8 seconds (before Docker's 10s SIGKILL)
      let resolved = false;

      const cleanup = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      // Listen for process exit
      process.on('exit', () => {
        this.logger.log(
          'info',
          `${platform} multicast process exited for ${streamKey}`
        );
        cleanup();
      });

      // Phase 1: Try graceful quit via stdin 'q' command
      try {
        process.stdin?.write('q\n');
        this.logger.log(
          'debug',
          `Sent 'q' command to ${platform} process for ${streamKey}`
        );
      } catch (error) {
        this.logger.log(
          'warn',
          `Failed to send 'q' command to ${platform} process`,
          { error }
        );
      }

      // Phase 2: After 3 seconds, send SIGTERM
      setTimeout(() => {
        if (!resolved && !process.killed) {
          this.logger.log(
            'debug',
            `Sending SIGTERM to ${platform} process for ${streamKey}`
          );
          process.kill('SIGTERM');
        }
      }, 3000);

      // Phase 3: After 8 seconds total, force kill with SIGKILL
      setTimeout(() => {
        if (!resolved && !process.killed) {
          this.logger.log(
            'warn',
            `Force killing ${platform} process for ${streamKey}`
          );
          process.kill('SIGKILL');
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
      this.logger.log('debug', `[${platform}:${streamKey}] ${data.toString()}`);
    });

    // Log stderr (ffmpeg outputs to stderr)
    process.stderr?.on('data', (data) => {
      this.logger.log('debug', `[${platform}:${streamKey}] ${data.toString()}`);
    });

    // Handle process exit
    process.on('exit', (code, signal) => {
      if (code === 0) {
        this.logger.log(
          'info',
          `${platform} multicast ended normally for ${streamKey}`
        );
      } else {
        this.logger.log(
          'warn',
          `${platform} multicast exited with code ${code}, signal ${signal} for ${streamKey}`
        );
      }
    });

    // Handle process errors
    process.on('error', (error) => {
      this.logger.log(
        'error',
        `${platform} multicast process error for ${streamKey}`,
        { error }
      );
    });
  }
}

export const MulticastServiceIdentifier = new InjectionToken(
  'MulticastService'
);
Container.provide([
  { provide: MulticastServiceIdentifier, useClass: MulticastService }
]);

