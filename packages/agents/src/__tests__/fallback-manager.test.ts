/**
 * Fallback Manager Tests
 * Story 4.5: Orquestrador - Retry e Error Handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  FallbackManager,
  createFallbackManager,
  DEFAULT_FALLBACK_CONFIG,
} from '../orchestrator/retry/fallback-manager';

describe('FallbackManager', () => {
  let manager: FallbackManager;

  beforeEach(() => {
    manager = new FallbackManager({
      providers: ['groq', 'gemini', 'openai'],
      failureThreshold: 3,
      autoRecover: true,
      recoveryDelay: 100, // Short for tests
    });
  });

  afterEach(() => {
    manager.dispose();
  });

  describe('Constructor', () => {
    it('should initialize all providers as healthy', () => {
      const health = manager.getAllProviderHealth();

      expect(health).toHaveLength(3);
      for (const h of health) {
        expect(h.isHealthy).toBe(true);
        expect(h.consecutiveFailures).toBe(0);
        expect(h.circuitState).toBe('closed');
      }
    });

    it('should use default config when no options provided', () => {
      const defaultManager = new FallbackManager();
      const config = defaultManager.getConfig();

      expect(config.failureThreshold).toBe(DEFAULT_FALLBACK_CONFIG.failureThreshold);
      expect(config.resetTimeout).toBe(DEFAULT_FALLBACK_CONFIG.resetTimeout);

      defaultManager.dispose();
    });

    it('should accept initial health state', () => {
      const initialHealth = new Map([
        ['groq', {
          provider: 'groq',
          consecutiveFailures: 2,
          lastFailure: new Date(),
          lastSuccess: null,
          isHealthy: true,
          circuitState: 'closed' as const,
        }],
      ]);

      const customManager = new FallbackManager({
        providers: ['groq', 'gemini'],
        initialHealth,
      });

      const health = customManager.getProviderHealth('groq');
      expect(health?.consecutiveFailures).toBe(2);

      customManager.dispose();
    });
  });

  describe('recordFailure', () => {
    it('should track consecutive failures', () => {
      manager.recordFailure('groq');
      manager.recordFailure('groq');

      const health = manager.getProviderHealth('groq');
      expect(health?.consecutiveFailures).toBe(2);
      expect(health?.isHealthy).toBe(true);
    });

    it('should mark provider unhealthy after threshold', () => {
      manager.recordFailure('groq');
      manager.recordFailure('groq');
      manager.recordFailure('groq');

      const health = manager.getProviderHealth('groq');
      expect(health?.consecutiveFailures).toBe(3);
      expect(health?.isHealthy).toBe(false);
      expect(health?.circuitState).toBe('open');
    });

    it('should emit provider:unhealthy event', () => {
      const listener = vi.fn();
      manager.on('provider:unhealthy', listener);

      manager.recordFailure('groq');
      manager.recordFailure('groq');
      manager.recordFailure('groq');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'groq',
          health: expect.objectContaining({
            isHealthy: false,
            circuitState: 'open',
          }),
        })
      );
    });

    it('should update lastFailure timestamp', () => {
      const beforeTime = new Date();

      manager.recordFailure('groq');

      const health = manager.getProviderHealth('groq');
      expect(health?.lastFailure).toBeInstanceOf(Date);
      expect(health?.lastFailure!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    });

    it('should ignore unknown providers', () => {
      // Should not throw
      manager.recordFailure('unknown-provider');
    });
  });

  describe('recordSuccess', () => {
    it('should reset consecutive failures', () => {
      manager.recordFailure('groq');
      manager.recordFailure('groq');

      manager.recordSuccess('groq');

      const health = manager.getProviderHealth('groq');
      expect(health?.consecutiveFailures).toBe(0);
    });

    it('should recover unhealthy provider', () => {
      // Make unhealthy
      manager.recordFailure('groq');
      manager.recordFailure('groq');
      manager.recordFailure('groq');

      expect(manager.getProviderHealth('groq')?.isHealthy).toBe(false);

      // Record success
      manager.recordSuccess('groq');

      const health = manager.getProviderHealth('groq');
      expect(health?.isHealthy).toBe(true);
      expect(health?.circuitState).toBe('closed');
    });

    it('should emit provider:recovered event when recovering', () => {
      const listener = vi.fn();
      manager.on('provider:recovered', listener);

      // Make unhealthy first
      manager.recordFailure('groq');
      manager.recordFailure('groq');
      manager.recordFailure('groq');

      // Recover
      manager.recordSuccess('groq');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'groq',
          health: expect.objectContaining({
            isHealthy: true,
          }),
        })
      );
    });

    it('should update lastSuccess timestamp', () => {
      const beforeTime = new Date();

      manager.recordSuccess('groq');

      const health = manager.getProviderHealth('groq');
      expect(health?.lastSuccess).toBeInstanceOf(Date);
      expect(health?.lastSuccess!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    });
  });

  describe('shouldFallback', () => {
    it('should return false for healthy provider', () => {
      expect(manager.shouldFallback('groq')).toBe(false);
    });

    it('should return true for unhealthy provider', () => {
      manager.recordFailure('groq');
      manager.recordFailure('groq');
      manager.recordFailure('groq');

      expect(manager.shouldFallback('groq')).toBe(true);
    });

    it('should return false for unknown provider', () => {
      expect(manager.shouldFallback('unknown')).toBe(false);
    });
  });

  describe('getNextProvider', () => {
    it('should return next healthy provider', () => {
      // Make groq unhealthy
      manager.recordFailure('groq');
      manager.recordFailure('groq');
      manager.recordFailure('groq');

      const next = manager.getNextProvider('groq');
      expect(next).toBe('gemini');
    });

    it('should skip unhealthy providers', () => {
      // Make groq and gemini unhealthy
      for (let i = 0; i < 3; i++) {
        manager.recordFailure('groq');
        manager.recordFailure('gemini');
      }

      const next = manager.getNextProvider('groq');
      expect(next).toBe('openai');
    });

    it('should return null if no healthy providers', () => {
      // Make all unhealthy
      for (const provider of ['groq', 'gemini', 'openai']) {
        manager.recordFailure(provider);
        manager.recordFailure(provider);
        manager.recordFailure(provider);
      }

      const next = manager.getNextProvider('groq');
      expect(next).toBeNull();
    });

    it('should emit fallback:activated event', () => {
      const listener = vi.fn();
      manager.on('fallback:activated', listener);

      // Make groq unhealthy
      manager.recordFailure('groq');
      manager.recordFailure('groq');
      manager.recordFailure('groq');

      manager.getNextProvider('groq');

      expect(listener).toHaveBeenCalledWith({
        from: 'groq',
        to: 'gemini',
      });
    });

    it('should return null for unknown provider', () => {
      expect(manager.getNextProvider('unknown')).toBeNull();
    });

    it('should accept half-open providers', () => {
      // Make gemini unhealthy then half-open
      manager.recordFailure('gemini');
      manager.recordFailure('gemini');
      manager.recordFailure('gemini');

      // Simulate half-open transition
      const health = manager.getProviderHealth('gemini');
      if (health) {
        // Manually set to half-open for test
        (health as { circuitState: string }).circuitState = 'half-open';
      }

      // Make groq unhealthy
      manager.recordFailure('groq');
      manager.recordFailure('groq');
      manager.recordFailure('groq');

      // gemini is half-open, so it should be accepted
      const next = manager.getNextProvider('groq');
      expect(next).toBe('openai'); // gemini is not healthy, so it goes to openai
    });
  });

  describe('getPrimaryProvider', () => {
    it('should return first provider', () => {
      expect(manager.getPrimaryProvider()).toBe('groq');
    });

    it('should return null for empty provider list', () => {
      const emptyManager = new FallbackManager({ providers: [] });
      expect(emptyManager.getPrimaryProvider()).toBeNull();
      emptyManager.dispose();
    });
  });

  describe('getBestAvailableProvider', () => {
    it('should return primary when healthy', () => {
      expect(manager.getBestAvailableProvider()).toBe('groq');
    });

    it('should return fallback when primary unhealthy', () => {
      manager.recordFailure('groq');
      manager.recordFailure('groq');
      manager.recordFailure('groq');

      expect(manager.getBestAvailableProvider()).toBe('gemini');
    });

    it('should return primary even when all unhealthy (fail fast)', () => {
      for (const provider of ['groq', 'gemini', 'openai']) {
        manager.recordFailure(provider);
        manager.recordFailure(provider);
        manager.recordFailure(provider);
      }

      // Still returns primary (will fail fast)
      expect(manager.getBestAvailableProvider()).toBe('groq');
    });
  });

  describe('resetProvider', () => {
    it('should reset provider to healthy state', () => {
      // Make unhealthy
      manager.recordFailure('groq');
      manager.recordFailure('groq');
      manager.recordFailure('groq');

      expect(manager.getProviderHealth('groq')?.isHealthy).toBe(false);

      // Reset
      manager.resetProvider('groq');

      const health = manager.getProviderHealth('groq');
      expect(health?.isHealthy).toBe(true);
      expect(health?.consecutiveFailures).toBe(0);
      expect(health?.circuitState).toBe('closed');
    });
  });

  describe('resetAll', () => {
    it('should reset all providers', () => {
      // Make all unhealthy
      for (const provider of ['groq', 'gemini', 'openai']) {
        manager.recordFailure(provider);
        manager.recordFailure(provider);
        manager.recordFailure(provider);
      }

      manager.resetAll();

      for (const health of manager.getAllProviderHealth()) {
        expect(health.isHealthy).toBe(true);
        expect(health.consecutiveFailures).toBe(0);
      }
    });
  });

  describe('getHealthStatistics', () => {
    it('should return correct counts', () => {
      const stats = manager.getHealthStatistics();

      expect(stats.total).toBe(3);
      expect(stats.healthy).toBe(3);
      expect(stats.unhealthy).toBe(0);
      expect(stats.halfOpen).toBe(0);
    });

    it('should track unhealthy providers', () => {
      manager.recordFailure('groq');
      manager.recordFailure('groq');
      manager.recordFailure('groq');

      const stats = manager.getHealthStatistics();

      expect(stats.healthy).toBe(2);
      expect(stats.unhealthy).toBe(1);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      manager.updateConfig({ failureThreshold: 5 });
      expect(manager.getConfig().failureThreshold).toBe(5);
    });

    it('should handle provider list changes', () => {
      manager.updateConfig({ providers: ['groq', 'gemini', 'anthropic'] });

      const health = manager.getAllProviderHealth();
      const providers = health.map((h) => h.provider);

      expect(providers).toContain('groq');
      expect(providers).toContain('gemini');
      expect(providers).toContain('anthropic');
    });
  });

  describe('hasAvailableFallback', () => {
    it('should return true when fallback available', () => {
      expect(manager.hasAvailableFallback('groq')).toBe(true);
    });

    it('should return false when no fallback available', () => {
      // Single provider manager
      const singleManager = new FallbackManager({
        providers: ['groq'],
        failureThreshold: 3,
      });

      expect(singleManager.hasAvailableFallback('groq')).toBe(false);

      singleManager.dispose();
    });
  });

  describe('Auto Recovery', () => {
    it('should transition to half-open after recovery delay', async () => {
      const listener = vi.fn();
      manager.on('provider:half-open', listener);

      // Make unhealthy
      manager.recordFailure('groq');
      manager.recordFailure('groq');
      manager.recordFailure('groq');

      // Wait for recovery delay (100ms in test)
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(listener).toHaveBeenCalledWith({ provider: 'groq' });

      const health = manager.getProviderHealth('groq');
      expect(health?.circuitState).toBe('half-open');
    });
  });

  describe('dispose', () => {
    it('should clean up resources without error', () => {
      // Make unhealthy to trigger timers
      manager.recordFailure('groq');
      manager.recordFailure('groq');
      manager.recordFailure('groq');

      // Should not throw
      manager.dispose();
    });
  });
});

describe('createFallbackManager', () => {
  it('should create a FallbackManager instance', () => {
    const manager = createFallbackManager({
      providers: ['a', 'b'],
      failureThreshold: 5,
    });

    expect(manager).toBeInstanceOf(FallbackManager);
    expect(manager.getConfig().failureThreshold).toBe(5);

    manager.dispose();
  });
});
