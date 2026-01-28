export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    context?: string;
    data?: Record<string, unknown>;
}
export interface LoggerOptions {
    level?: LogLevel;
    context?: string;
    pretty?: boolean;
}
export declare class Logger {
    private level;
    private context?;
    private pretty;
    constructor(options?: LoggerOptions);
    private shouldLog;
    private formatEntry;
    private log;
    debug(message: string, data?: Record<string, unknown>): void;
    info(message: string, data?: Record<string, unknown>): void;
    warn(message: string, data?: Record<string, unknown>): void;
    error(message: string, data?: Record<string, unknown>): void;
    child(context: string): Logger;
}
export declare const logger: Logger;
export declare function createLogger(context: string, options?: Omit<LoggerOptions, 'context'>): Logger;
//# sourceMappingURL=logger.d.ts.map