import { PrismaClient } from '../prisma/generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';

const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
const db = new Database(dbUrl.replace('file:', ''));
const adapter = new PrismaBetterSqlite3({ url: dbUrl });

export default new PrismaClient({ adapter });
