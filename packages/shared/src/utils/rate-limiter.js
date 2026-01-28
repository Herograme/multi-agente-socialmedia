// Rate limiter utility - Social Content Agent
import { sleep } from './retry';
/**
 * Token bucket rate limiter
 *
 * @example
 * const limiter = new RateLimiter({ maxRequests: 10, windowMs: 1000 });
 * await limiter.acquire(); // Waits if rate limit exceeded
 * await makeRequest();
 */
export class RateLimiter {
    tokens;
    lastRefill;
    maxTokens;
    refillRate;
    constructor(options) {
        this.maxTokens = options.maxRequests;
        this.refillRate = options.maxRequests / (options.windowMs / 1000);
        this.tokens = this.maxTokens;
        this.lastRefill = Date.now();
    }
    /**
     * Acquire a token, waiting if necessary
     */
    async acquire() {
        this.refill();
        while (this.tokens < 1) {
            const waitTime = Math.ceil((1 - this.tokens) / this.refillRate * 1000);
            await sleep(Math.max(waitTime, 10));
            this.refill();
        }
        this.tokens -= 1;
    }
    /**
     * Try to acquire a token without waiting
     * @returns true if token was acquired, false if rate limited
     */
    tryAcquire() {
        this.refill();
        if (this.tokens >= 1) {
            this.tokens -= 1;
            return true;
        }
        return false;
    }
    /**
     * Get current available tokens
     */
    getAvailableTokens() {
        this.refill();
        return Math.floor(this.tokens);
    }
    /**
     * Reset the rate limiter
     */
    reset() {
        this.tokens = this.maxTokens;
        this.lastRefill = Date.now();
    }
    refill() {
        const now = Date.now();
        const elapsed = (now - this.lastRefill) / 1000;
        this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
        this.lastRefill = now;
    }
}
/**
 * Create a rate-limited version of a function
 *
 * @example
 * const limitedFetch = withRateLimit(fetch, { maxRequests: 5, windowMs: 1000 });
 * await limitedFetch(url);
 */
export function withRateLimit(fn, options) {
    const limiter = new RateLimiter(options);
    return async (...args) => {
        await limiter.acquire();
        return fn(...args);
    };
}
//# sourceMappingURL=rate-limiter.js.map