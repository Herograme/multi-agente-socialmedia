/* eslint-disable no-console */
// Structured logger utility - Social Content Agent

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

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class Logger {
  private level: LogLevel;
  private context?: string;
  private pretty: boolean;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? 'info';
    this.context = options.context;
    this.pretty = options.pretty ?? process.env.NODE_ENV !== 'production';
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private formatEntry(entry: LogEntry): string {
    if (this.pretty) {
      const prefix = `[${entry.timestamp}] ${entry.level.toUpperCase()}`;
      const ctx = entry.context ? ` [${entry.context}]` : '';
      const data = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
      return `${prefix}${ctx}: ${entry.message}${data}`;
    }
    return JSON.stringify(entry);
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
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

  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.log('error', message, data);
  }

  child(context: string): Logger {
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
export function createLogger(context: string, options?: Omit<LoggerOptions, 'context'>): Logger {
  return new Logger({ ...options, context });
}
