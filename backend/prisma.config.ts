// Load .env file in development, but use environment variables in production
if (process.env.NODE_ENV !== 'production') {
  await import('dotenv/config');
}

import { defineConfig } from 'prisma/config';

const url = process.env.DATABASE_URL || 'file:./data/prod.db';

export default defineConfig({
  // the main entry for your schema
  schema: 'prisma/schema.prisma',

  // where migrations should be generated
  migrations: {
    path: 'prisma/migrations',
  },

  // The database URL - use process.env directly for better compatibility
  datasource: {
    url,
  },
});

console.log(url);
