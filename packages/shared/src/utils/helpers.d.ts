/**
 * Generate a unique ID
 */
export declare function generateId(): string;
/**
 * Format a date as ISO string
 */
export declare function formatDate(date: Date): string;
/**
 * Mask sensitive data for logging
 */
export declare function maskSecret(value: string): string;
/**
 * Check if a value is defined (not null or undefined)
 */
export declare function isDefined<T>(value: T | null | undefined): value is T;
/**
 * Safely parse JSON with error handling
 */
export declare function safeJsonParse<T>(json: string, fallback: T): T;
/**
 * Truncate a string to a maximum length
 */
export declare function truncate(str: string, maxLength: number, suffix?: string): string;
/**
 * Pick specified keys from an object
 */
export declare function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
/**
 * Omit specified keys from an object
 */
export declare function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>;
//# sourceMappingURL=helpers.d.ts.map