import { createRedisInstance, scanKeys } from './src/redis.js';

async function testScan() {
  const client = createRedisInstance({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  });

  await client.connect();

  console.log('Connected to Redis');

  // First, let's see ALL keys in Redis
  console.log('\n=== ALL KEYS IN REDIS ===');
  const allKeys = await scanKeys(client, '*');
  console.log(`Total keys: ${allKeys.length}`);
  allKeys.forEach(key => console.log(`  - ${key}`));

  // Now test your specific pattern
  const userUUID = 'eece0d2b-66a8-4a55-a85f-9ddc477be331';
  const sessionUUID = '1f964363-0167-4b8f-aac3-fa9d00e7d94d';
  const pattern = `gamedata:${userUUID}:*:${sessionUUID}:url`;

  console.log(`\n=== SEARCHING FOR PATTERN ===`);
  console.log(`Pattern: ${pattern}`);
  const matchingKeys = await scanKeys(client, pattern);
  console.log(`Matching keys: ${matchingKeys.length}`);
  matchingKeys.forEach(key => console.log(`  - ${key}`));

  // Also try without the :url suffix
  const dataPattern = `gamedata:${userUUID}:*:${sessionUUID}:*`;
  console.log(`\n=== SEARCHING FOR BROADER PATTERN ===`);
  console.log(`Pattern: ${dataPattern}`);
  const dataKeys = await scanKeys(client, dataPattern);
  console.log(`Matching keys: ${dataKeys.length}`);
  dataKeys.forEach(key => console.log(`  - ${key}`));

  await client.disconnect();
}

testScan().catch(console.error);

