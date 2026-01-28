import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RateLimiter, withRateLimit } from '../utils/rate-limiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow requests within limit', async () => {
    const limiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 });

    // Should not block for first 3 requests
    const start = Date.now();
    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(50);
  });

  it('should block when rate limit exceeded', async () => {
    vi.useRealTimers(); // Need real timers for this test

    const limiter = new RateLimiter({ maxRequests: 2, windowMs: 100 });

    const start = Date.now();
    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire(); // This should wait
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(40);
  });

  it('should refill tokens over time', async () => {
    vi.useRealTimers();

    const limiter = new RateLimiter({ maxRequests: 2, windowMs: 100 });

    await limiter.acquire();
    await limiter.acquire();

    // Wait for tokens to refill
    await new Promise(r => setTimeout(r, 120));

    const tokens = limiter.getAvailableTokens();
    expect(tokens).toBeGreaterThanOrEqual(1);
  });

  it('should return correct available tokens', () => {
    const limiter = new RateLimiter({ maxRequests: 5, windowMs: 1000 });

    expect(limiter.getAvailableTokens()).toBe(5);
    limiter.tryAcquire();
    expect(limiter.getAvailableTokens()).toBe(4);
    limiter.tryAcquire();
    expect(limiter.getAvailableTokens()).toBe(3);
  });

  it('tryAcquire should return false when no tokens', () => {
    const limiter = new RateLimiter({ maxRequests: 1, windowMs: 1000 });

    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(false);
  });

  it('should reset correctly', () => {
    const limiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 });

    limiter.tryAcquire();
    limiter.tryAcquire();
    expect(limiter.getAvailableTokens()).toBe(1);

    limiter.reset();
    expect(limiter.getAvailableTokens()).toBe(3);
  });
});

describe('withRateLimit', () => {
  it('should create a rate-limited function', async () => {
    vi.useRealTimers();

    const fn = vi.fn().mockResolvedValue('result');
    const limitedFn = withRateLimit(fn, { maxRequests: 2, windowMs: 100 });

    const start = Date.now();
    await limitedFn('a');
    await limitedFn('b');
    await limitedFn('c'); // Should wait
    const elapsed = Date.now() - start;

    expect(fn).toHaveBeenCalledTimes(3);
    expect(elapsed).toBeGreaterThanOrEqual(40);
  });

  it('should pass arguments correctly', async () => {
    const fn = vi.fn().mockResolvedValue('result');
    const limitedFn = withRateLimit(fn, { maxRequests: 10, windowMs: 1000 });

    await limitedFn('arg1', 123, { key: 'value' });

    expect(fn).toHaveBeenCalledWith('arg1', 123, { key: 'value' });
  });
});
