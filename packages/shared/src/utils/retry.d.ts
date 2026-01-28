export interface RetryOptions {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    onRetry?: (error: Error, attempt: number) => void;
}
/**
 * Sleep for a specified duration
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Retry a function with exponential backoff
 *
 * @example
 * const result = await retry(
 *   () => fetchData(),
 *   { maxAttempts: 5, initialDelay: 500 }
 * );
 */
export declare function retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
/**
 * Create a retryable version of a function
 *
 * @example
 * const retryableFetch = withRetry(fetchData, { maxAttempts: 3 });
 * const result = await retryableFetch();
 */
export declare function withRetry<T, Args extends unknown[]>(fn: (...args: Args) => Promise<T>, options?: RetryOptions): (...args: Args) => Promise<T>;
//# sourceMappingURL=retry.d.ts.map