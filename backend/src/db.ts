import { PrismaClient } from '../prisma/generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const dbUrl = './data/dev.db';
const adapter = new PrismaBetterSqlite3({ url: dbUrl });

export default new PrismaClient({ adapter });
