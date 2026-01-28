// Retry utility with exponential backoff - Social Content Agent
const DEFAULT_OPTIONS = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2,
};
/**
 * Sleep for a specified duration
 */
export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Retry a function with exponential backoff
 *
 * @example
 * const result = await retry(
 *   () => fetchData(),
 *   { maxAttempts: 5, initialDelay: 500 }
 * );
 */
export async function retry(fn, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const { maxAttempts, initialDelay, maxDelay, backoffFactor, onRetry } = opts;
    let lastError;
    let delay = initialDelay;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt === maxAttempts) {
                break;
            }
            if (onRetry) {
                onRetry(lastError, attempt);
            }
            await sleep(delay);
            delay = Math.min(delay * backoffFactor, maxDelay);
        }
    }
    throw lastError;
}
/**
 * Create a retryable version of a function
 *
 * @example
 * const retryableFetch = withRetry(fetchData, { maxAttempts: 3 });
 * const result = await retryableFetch();
 */
export function withRetry(fn, options = {}) {
    return (...args) => retry(() => fn(...args), options);
}
//# sourceMappingURL=retry.js.map