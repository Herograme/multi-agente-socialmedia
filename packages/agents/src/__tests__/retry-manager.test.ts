/**
 * Retry Manager Tests
 * Story 4.5: Orquestrador - Retry e Error Handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  RetryManager,
  createRetryManager,
  executeWithRetry,
  DEFAULT_RETRY_CONFIG,
} from '../orchestrator/retry/retry-manager';
import { ErrorCategory } from '../orchestrator/retry/types';
import { clearCustomClassifiers } from '../orchestrator/retry/error-classifier';

describe('RetryManager', () => {
  let manager: RetryManager;

  beforeEach(() => {
    manager = new RetryManager();
  });

  afterEach(() => {
    manager.dispose();
    clearCustomClassifiers();
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should use default config when no options provided', () => {
      const config = manager.getConfig();
      expect(config.maxAttempts).toBe(DEFAULT_RETRY_CONFIG.maxAttempts);
      expect(config.initialDelay).toBe(DEFAULT_RETRY_CONFIG.initialDelay);
      expect(config.backoffFactor).toBe(DEFAULT_RETRY_CONFIG.backoffFactor);
    });

    it('should merge provided options with defaults', () => {
      const customManager = new RetryManager({ maxAttempts: 5, initialDelay: 500 });
      const config = customManager.getConfig();

      expect(config.maxAttempts).toBe(5);
      expect(config.initialDelay).toBe(500);
      expect(config.backoffFactor).toBe(DEFAULT_RETRY_CONFIG.backoffFactor);

      customManager.dispose();
    });
  });

  describe('calculateDelay', () => {
    it('should calculate exponential backoff without jitter', () => {
      const noJitterManager = new RetryManager({ jitter: false });

      // initialDelay * backoffFactor^(attempt-1)
      // 1000 * 2^0 = 1000
      expect(noJitterManager.calculateDelay(1)).toBe(1000);
      // 1000 * 2^1 = 2000
      expect(noJitterManager.calculateDelay(2)).toBe(2000);
      // 1000 * 2^2 = 4000
      expect(noJitterManager.calculateDelay(3)).toBe(4000);
      // 1000 * 2^3 = 8000
      expect(noJitterManager.calculateDelay(4)).toBe(8000);

      noJitterManager.dispose();
    });

    it('should cap delay at maxDelay', () => {
      const cappedManager = new RetryManager({
        jitter: false,
        maxDelay: 5000,
      });

      // Even at attempt 10, should be capped at 5000
      expect(cappedManager.calculateDelay(10)).toBe(5000);

      cappedManager.dispose();
    });

    it('should add jitter when enabled', () => {
      const jitterManager = new RetryManager({ jitter: true });
      const delays = new Set<number>();

      // Run multiple times to get different jittered values
      for (let i = 0; i < 20; i++) {
        delays.add(jitterManager.calculateDelay(1));
      }

      // With jitter, we should get some variation
      expect(delays.size).toBeGreaterThan(1);

      jitterManager.dispose();
    });

    it('should keep jitter within bounds', () => {
      const jitterManager = new RetryManager({
        jitter: true,
        jitterFactor: 0.25,
        initialDelay: 1000,
      });

      for (let i = 0; i < 100; i++) {
        const delay = jitterManager.calculateDelay(1);
        // 1000 +/- 25% = 750 to 1250
        expect(delay).toBeGreaterThanOrEqual(750);
        expect(delay).toBeLessThanOrEqual(1250);
      }

      jitterManager.dispose();
    });

    it('should apply delay multiplier for rate limit errors', () => {
      const noJitterManager = new RetryManager({ jitter: false });

      const normalDelay = noJitterManager.calculateDelay(1);
      const rateLimitDelay = noJitterManager.calculateDelay(1, ErrorCategory.RATE_LIMITED);

      // Rate limit should have 3x delay
      expect(rateLimitDelay).toBe(normalDelay * 3);

      noJitterManager.dispose();
    });

    it('should apply delay multiplier for timeout errors', () => {
      const noJitterManager = new RetryManager({ jitter: false });

      const normalDelay = noJitterManager.calculateDelay(1);
      const timeoutDelay = noJitterManager.calculateDelay(1, ErrorCategory.TIMEOUT);

      // Timeout should have 1.5x delay
      expect(timeoutDelay).toBe(normalDelay * 1.5);

      noJitterManager.dispose();
    });
  });

  describe('shouldRetry', () => {
    it('should return true for retriable errors below max attempts', () => {
      const error = new Error('Network error');
      expect(manager.shouldRetry(error, 1)).toBe(true);
      expect(manager.shouldRetry(error, 2)).toBe(true);
    });

    it('should return false when max attempts reached', () => {
      const error = new Error('Network error');
      // Default maxAttempts is 3
      expect(manager.shouldRetry(error, 3)).toBe(false);
      expect(manager.shouldRetry(error, 4)).toBe(false);
    });

    it('should return false for fatal errors', () => {
      const error = new Error('Invalid API key');
      expect(manager.shouldRetry(error, 1)).toBe(false);
    });

    it('should respect custom retriable categories', () => {
      const customManager = new RetryManager({
        retriableCategories: [ErrorCategory.RETRIABLE],
      });

      // Network errors are normally retriable, but not with this config
      const networkError = new Error('ECONNREFUSED');
      expect(customManager.shouldRetry(networkError, 1)).toBe(false);

      customManager.dispose();
    });
  });

  describe('createInitialState', () => {
    it('should create state with zero attempts', () => {
      const state = manager.createInitialState('test-provider');

      expect(state.attempts).toBe(0);
      expect(state.lastError).toBeNull();
      expect(state.lastErrorCategory).toBeNull();
      expect(state.totalDelay).toBe(0);
      expect(state.currentProvider).toBe('test-provider');
      expect(state.fallbackActive).toBe(false);
      expect(state.startedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateStateAfterFailure', () => {
    it('should record error without incrementing attempts', () => {
      const initialState = manager.createInitialState('test');
      const error = new Error('Network error');

      const newState = manager.updateStateAfterFailure(initialState, error, 1000);

      // Note: attempts is NOT incremented by updateStateAfterFailure
      // (it's incremented before execution in execute())
      expect(newState.attempts).toBe(0);
      expect(newState.lastError).toBe(error);
      expect(newState.lastErrorCategory).toBe(ErrorCategory.NETWORK);
      expect(newState.totalDelay).toBe(1000);
    });

    it('should accumulate total delay', () => {
      let state = manager.createInitialState('test');
      const error = new Error('Network error');

      state = manager.updateStateAfterFailure(state, error, 1000);
      state = manager.updateStateAfterFailure(state, error, 2000);
      state = manager.updateStateAfterFailure(state, error, 4000);

      expect(state.totalDelay).toBe(7000);
    });
  });

  describe('execute', () => {
    it('should succeed on first try', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const { result, state } = await manager.execute(fn);

      expect(result).toBe('success');
      expect(state.attempts).toBe(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const noJitterManager = new RetryManager({
        jitter: false,
        initialDelay: 10, // Short delay for tests
        maxAttempts: 4, // Allow 4 attempts
      });

      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const { result, state } = await noJitterManager.execute(fn);

      expect(result).toBe('success');
      expect(state.attempts).toBe(3); // 2 failures + 1 success
      expect(fn).toHaveBeenCalledTimes(3);

      noJitterManager.dispose();
    });

    it('should throw after max retries exhausted', async () => {
      const noJitterManager = new RetryManager({
        jitter: false,
        initialDelay: 10, // Short delay for tests
        maxAttempts: 2, // Only 2 attempts allowed
      });

      const fn = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(noJitterManager.execute(fn)).rejects.toThrow('Network error');
      expect(fn).toHaveBeenCalledTimes(2); // 2 attempts

      noJitterManager.dispose();
    });

    it('should not retry fatal errors', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Invalid API key'));

      await expect(manager.execute(fn)).rejects.toThrow('Invalid API key');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry callback before each retry', async () => {
      const noJitterManager = new RetryManager({
        jitter: false,
        initialDelay: 10, // Short delay for tests
        maxAttempts: 4, // Allow 4 attempts
      });

      const onRetry = vi.fn();
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      await noJitterManager.execute(fn, { onRetry });

      expect(onRetry).toHaveBeenCalledTimes(2);
      // onRetry is called after the failed attempt
      // attempts = 1 after first failure, 2 after second failure
      expect(onRetry.mock.calls[0][0]).toMatchObject({ attempts: 1 });
      expect(onRetry.mock.calls[1][0]).toMatchObject({ attempts: 2 });
      expect(onRetry.mock.calls[0][1]).toEqual(expect.any(Number)); // delay

      noJitterManager.dispose();
    });

    it('should track initial provider in state', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const { state } = await manager.execute(fn, { initialProvider: 'groq' });

      expect(state.currentProvider).toBe('groq');
    });

    it('should handle abort signal', async () => {
      const abortController = new AbortController();
      const fn = vi.fn().mockImplementation(async () => {
        // Simulate some work
        await new Promise((resolve) => setTimeout(resolve, 100));
        return 'success';
      });

      // Abort immediately
      abortController.abort();

      await expect(
        manager.execute(fn, { abortSignal: abortController.signal })
      ).rejects.toThrow('aborted');
    });

    it('should preserve state between retries', async () => {
      const noJitterManager = new RetryManager({
        jitter: false,
        initialDelay: 10, // Short delay for tests
      });

      const states: number[] = [];
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      await noJitterManager.execute(fn, {
        onRetry: (state) => states.push(state.attempts),
      });

      // onRetry receives state with attempts = 1 after first failure
      expect(states).toEqual([1]);

      noJitterManager.dispose();
    });

    it('should accumulate delay in state', async () => {
      const noJitterManager = new RetryManager({
        jitter: false,
        initialDelay: 10, // Short delay for tests
      });

      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const { state } = await noJitterManager.execute(fn);

      expect(state.totalDelay).toBe(10); // One retry with 10ms delay

      noJitterManager.dispose();
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      manager.updateConfig({ maxAttempts: 10 });
      expect(manager.getConfig().maxAttempts).toBe(10);
    });

    it('should merge with existing config', () => {
      manager.updateConfig({ maxAttempts: 10 });
      manager.updateConfig({ initialDelay: 500 });

      const config = manager.getConfig();
      expect(config.maxAttempts).toBe(10);
      expect(config.initialDelay).toBe(500);
    });
  });

  describe('dispose', () => {
    it('should clean up custom classifiers', () => {
      const customManager = new RetryManager({
        customClassifiers: [() => null],
      });

      // Dispose should unregister the classifier
      customManager.dispose();

      // This is hard to verify directly, but at least no errors
    });
  });
});

describe('createRetryManager', () => {
  it('should create a RetryManager instance', () => {
    const manager = createRetryManager({ maxAttempts: 5 });
    expect(manager).toBeInstanceOf(RetryManager);
    expect(manager.getConfig().maxAttempts).toBe(5);
    manager.dispose();
  });
});

describe('executeWithRetry', () => {
  afterEach(() => {
    clearCustomClassifiers();
  });

  it('should execute function with retry using default config', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const { result, state } = await executeWithRetry(fn);

    expect(result).toBe('success');
    expect(state.attempts).toBe(1);
  });

  it('should use provided options', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue('success');

    const { result, state } = await executeWithRetry(fn, {
      maxAttempts: 3, // 3 max attempts
      initialDelay: 10,
      jitter: false,
    });

    expect(result).toBe('success');
    expect(state.attempts).toBe(2); // 1 failed + 1 success
  });
});
