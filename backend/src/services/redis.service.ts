import { Container, Inject, Injectable, InjectionToken } from "@decorators/di";
import redis from 'redis';
import { LoggerService, LoggerServiceIdentifier } from "./logger.service";

interface RedisConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

function createRedisInstance(config: RedisConfig) {  
  const url = [
    'redis://',
    config.username ?? '',
    config.username ? ':' : '',
    config.password ?? '',
    config.host,
    ':',
    config.port
  ].join('')

  return redis.createClient({
    url,
  });
}

@Injectable()
export class RedisService {
  private client: ReturnType<typeof createRedisInstance>;

  constructor(
    @Inject(LoggerServiceIdentifier) private readonly logger: LoggerService
  ) {
    const compiledConfig: RedisConfig = {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      username: process.env.REDIS_USERNAME ?? '',
      password: process.env.REDIS_PASSWORD ?? ''
    }
    
    this.client = createRedisInstance(compiledConfig);
    this.client.connect();

    this.logger.log('debug', 'RedisService initialized', {  port: compiledConfig.port, host: compiledConfig.host });
  }

  async clone() {
    this.logger.log('debug','Cloning Redis client...');
    const clonedClient = await this.client.duplicate();
  
    await clonedClient.connect();
  
    return clonedClient;
  }

  getClient() {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    return this.client;
  }
}

export const RedisServiceIdentifier = new InjectionToken('RedisService');

// Create a singleton instance
let redisServiceInstance: RedisService | null = null;

Container.provide([
  {
    provide: RedisServiceIdentifier,
    useFactory: async () => {
      if (!redisServiceInstance) {
        // Get the logger from the container and create the singleton
        const logger = await Container.get<LoggerService>(LoggerServiceIdentifier);
        redisServiceInstance = new RedisService(logger);
      }
      return redisServiceInstance;
    }
  }
]);