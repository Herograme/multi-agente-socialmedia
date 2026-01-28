import { describe, it, expect, vi } from 'vitest';
import { retry, withRetry, sleep } from '../utils/retry';

describe('sleep', () => {
  it('should sleep for the specified duration', async () => {
    const start = Date.now();
    await sleep(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(45);
    expect(elapsed).toBeLessThan(100);
  });
});

describe('retry', () => {
  it('should return result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const result = await retry(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and succeed', async () => {
    let attempts = 0;
    const fn = vi.fn().mockImplementation(async () => {
      attempts++;
      if (attempts < 3) throw new Error('fail');
      return 'success';
    });

    const result = await retry(fn, { maxAttempts: 3, initialDelay: 10 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));

    await expect(
      retry(fn, { maxAttempts: 3, initialDelay: 10 })
    ).rejects.toThrow('always fails');

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should use exponential backoff', async () => {
    const delays: number[] = [];
    let lastCall = Date.now();

    const fn = vi.fn().mockImplementation(async () => {
      const now = Date.now();
      if (delays.length > 0 || fn.mock.calls.length > 1) {
        delays.push(now - lastCall);
      }
      lastCall = now;
      if (fn.mock.calls.length < 3) throw new Error('fail');
      return 'success';
    });

    await retry(fn, {
      maxAttempts: 3,
      initialDelay: 50,
      backoffFactor: 2,
    });

    // First delay should be ~50ms, second ~100ms
    expect(delays[0]).toBeGreaterThanOrEqual(40);
    expect(delays[1]).toBeGreaterThanOrEqual(80);
  });

  it('should respect maxDelay', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    const start = Date.now();
    await expect(
      retry(fn, {
        maxAttempts: 3,
        initialDelay: 100,
        maxDelay: 100,
        backoffFactor: 10,
      })
    ).rejects.toThrow();

    const elapsed = Date.now() - start;
    // Should take ~200ms (2 delays of 100ms each), not much more
    expect(elapsed).toBeLessThan(300);
  });

  it('should call onRetry callback on each retry', async () => {
    const onRetry = vi.fn();
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    await expect(
      retry(fn, { maxAttempts: 3, initialDelay: 10, onRetry })
    ).rejects.toThrow();

    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1);
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 2);
  });

  it('should convert non-Error throws to Error', async () => {
    const fn = vi.fn().mockRejectedValue('string error');

    await expect(
      retry(fn, { maxAttempts: 1 })
    ).rejects.toThrow('string error');
  });
});

describe('withRetry', () => {
  it('should create a retryable function', async () => {
    let attempts = 0;
    const fn = async (value: number) => {
      attempts++;
      if (attempts < 2) throw new Error('fail');
      return value * 2;
    };

    const retryableFn = withRetry(fn, { maxAttempts: 3, initialDelay: 10 });
    const result = await retryableFn(5);

    expect(result).toBe(10);
    expect(attempts).toBe(2);
  });

  it('should pass arguments correctly', async () => {
    const fn = vi.fn().mockResolvedValue('result');
    const retryableFn = withRetry(fn, { maxAttempts: 1 });

    await retryableFn('arg1', 123, { key: 'value' });

    expect(fn).toHaveBeenCalledWith('arg1', 123, { key: 'value' });
  });
});
