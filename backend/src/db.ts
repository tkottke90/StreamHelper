import { PrismaClient } from '../prisma/generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

// TODO: Fix this hard coded value
const dbUrl = './data/prod.db';
const adapter = new PrismaBetterSqlite3({ url: dbUrl });

export default new PrismaClient({ adapter });
