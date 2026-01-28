export interface RateLimiterOptions {
    maxRequests: number;
    windowMs: number;
}
/**
 * Token bucket rate limiter
 *
 * @example
 * const limiter = new RateLimiter({ maxRequests: 10, windowMs: 1000 });
 * await limiter.acquire(); // Waits if rate limit exceeded
 * await makeRequest();
 */
export declare class RateLimiter {
    private tokens;
    private lastRefill;
    private readonly maxTokens;
    private readonly refillRate;
    constructor(options: RateLimiterOptions);
    /**
     * Acquire a token, waiting if necessary
     */
    acquire(): Promise<void>;
    /**
     * Try to acquire a token without waiting
     * @returns true if token was acquired, false if rate limited
     */
    tryAcquire(): boolean;
    /**
     * Get current available tokens
     */
    getAvailableTokens(): number;
    /**
     * Reset the rate limiter
     */
    reset(): void;
    private refill;
}
/**
 * Create a rate-limited version of a function
 *
 * @example
 * const limitedFetch = withRateLimit(fetch, { maxRequests: 5, windowMs: 1000 });
 * await limitedFetch(url);
 */
export declare function withRateLimit<T, Args extends unknown[]>(fn: (...args: Args) => Promise<T>, options: RateLimiterOptions): (...args: Args) => Promise<T>;
//# sourceMappingURL=rate-limiter.d.ts.map