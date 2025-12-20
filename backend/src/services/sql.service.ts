import { Container, Injectable, InjectionToken } from "@decorators/di";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../../prisma/generated/prisma/client.js";
import LoggerService, { LoggerService as LoggerServiceType } from "./logger.service.js";

@Injectable()
export class SqlService {
  private client: PrismaClient | null = null;

  constructor(private readonly logger: LoggerServiceType) {}

  getClient() {
    // Lazy initialization - only create the client when first accessed
    // This ensures DATABASE_URL is loaded from .env
    if (!this.client) {
      const dbUrl = process.env.DATABASE_URL || 'file:./data/prod.db';
      const adapter = new PrismaBetterSqlite3({ url: dbUrl });
      this.client = new PrismaClient({ adapter });
      this.logger.log('debug', 'SqlService initialized', { url: dbUrl });
    }
    return this.client;
  }
}

export const SQLServiceIdentifier = new InjectionToken('SqlService');

// Create a singleton instance and provide it directly
const sqlServiceInstance = new SqlService(LoggerService);

Container.provide([
  {
    provide: SQLServiceIdentifier,
    useValue: sqlServiceInstance
  }
]);