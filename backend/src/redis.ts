import redis from 'redis';
import { LoggerService } from './services/index.js';

interface RedisConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

let client: ReturnType<typeof createRedisInstance>;
const logger = LoggerService

export function createRedisInstance(config: RedisConfig) {  
  const url = [
    'redis://',
    config.username ?? '',
    config.username ? ':' : '',
    config.password ?? '',
    config.host,
    ':',
    config.port
  ].join('')

  logger.log('debug',(`Connecting to ${url}`));

  return redis.createClient({
    url,
  });
}

export async function initialize(config?: Partial<RedisConfig>) {
  logger.log('debug','Initializing Redis...');

  const compiledConfig: RedisConfig = {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    ...config
  }
  
  client = createRedisInstance(compiledConfig);

  client.on('error', err => logger.log('error','Redis Error', err));

  await client.connect();

  if (client.isReady) {
    logger.log('info','Connected to Redis');
  } else {
    logger.log('error','Failed to connect to Redis');
  }
}

export function getClient() {
  if (!client) {
    throw new Error('Redis client not initialized');
  }

  return client;
}

export async function clone() {
  logger.log('debug','Cloning Redis client...');
  const clonedClient = await client.duplicate();

  await clonedClient.connect();

  return clonedClient;
}


export type RedisClient = ReturnType<typeof createRedisInstance>;