import { Console } from "console";

type LogMessage = string | Record<string, any>

export class Logger {

  constructor(readonly name: string, readonly type: 'console' | 'jsonl' = 'console') {}

  debug(message: LogMessage) {
    this.format('debug', message)
  }

  info(message: LogMessage) {
    this.format('info', message)
  }

  log(level: string, message: LogMessage) {
    this.format(level, message);
  }


  private format(level: string, message: LogMessage) {
    const timestamp = new Date().toISOString();

    switch(this.type) {
      case 'console':
        return console.log(`${ timestamp } | ${this.name} | [${level.toUpperCase()}] ${message}`)
      case 'jsonl':
        return console.log(JSON.stringify({
          level: level.toUpperCase(),
          timestamp,
          message
        }))
    }
  }
}