export class Logger {
    name;
    type;
    constructor(name, type = 'console') {
        this.name = name;
        this.type = type;
    }
    debug(message) {
        this.format('debug', message);
    }
    info(message) {
        this.format('info', message);
    }
    log(level, message) {
        this.format(level, message);
    }
    format(level, message) {
        const timestamp = new Date().toISOString();
        switch (this.type) {
            case 'console':
                return console.log(`${timestamp} | ${this.name} | [${level.toUpperCase()}] ${message}`);
            case 'jsonl':
                return console.log(JSON.stringify({
                    level: level.toUpperCase(),
                    timestamp,
                    message
                }));
        }
    }
}
