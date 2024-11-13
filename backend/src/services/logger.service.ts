import { Container, Injectable, InjectionToken } from '@decorators/di';

const levels = ['fatal', 'error', 'warn', 'info', 'verbose', 'debug'] as const;
type tempLevels = (typeof levels)[number];

interface ILoggerService<Levels extends string> {
  log: (level: Levels, message: string, metadata?: Record<string, any>) => void;
  error: (error: Error) => void;
}

@Injectable()
export class LoggerService implements ILoggerService<tempLevels> {
  log(level: tempLevels, message: string, metadata?: Record<string, any>) {
    const metadataStr = metadata ? JSON.stringify(metadata) : '';

    console.log(
      `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message} ${metadataStr}`
    );
  }

  error(error: Error) {
    this.log('info', error.message);

    if (error.stack) {
      console.log(error.stack);
    }
  }
}

export const LoggerServiceIdentifier = new InjectionToken('LoggerService');
Container.provide([
  { provide: LoggerServiceIdentifier, useClass: LoggerService }
]);

export default new LoggerService();
