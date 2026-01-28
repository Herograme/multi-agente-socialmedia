/* eslint-disable no-console */
// Structured logger utility - Social Content Agent
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
export class Logger {
    level;
    context;
    pretty;
    constructor(options = {}) {
        this.level = options.level ?? 'info';
        this.context = options.context;
        this.pretty = options.pretty ?? process.env.NODE_ENV !== 'production';
    }
    shouldLog(level) {
        return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
    }
    formatEntry(entry) {
        if (this.pretty) {
            const prefix = `[${entry.timestamp}] ${entry.level.toUpperCase()}`;
            const ctx = entry.context ? ` [${entry.context}]` : '';
            const data = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
            return `${prefix}${ctx}: ${entry.message}${data}`;
        }
        return JSON.stringify(entry);
    }
    log(level, message, data) {
        if (!this.shouldLog(level))
            return;
        const entry = {
            level,
            message,
            timestamp: new Date().toISOString(),
            context: this.context,
            data,
        };
        const formatted = this.formatEntry(entry);
        switch (level) {
            case 'debug':
            case 'info':
                console.log(formatted);
                break;
            case 'warn':
                console.warn(formatted);
                break;
            case 'error':
                console.error(formatted);
                break;
        }
    }
    debug(message, data) {
        this.log('debug', message, data);
    }
    info(message, data) {
        this.log('info', message, data);
    }
    warn(message, data) {
        this.log('warn', message, data);
    }
    error(message, data) {
        this.log('error', message, data);
    }
    child(context) {
        return new Logger({
            level: this.level,
            context: this.context ? `${this.context}:${context}` : context,
            pretty: this.pretty,
        });
    }
}
// Default logger instance
export const logger = new Logger();
// Factory function for creating context-specific loggers
export function createLogger(context, options) {
    return new Logger({ ...options, context });
}
//# sourceMappingURL=logger.js.map