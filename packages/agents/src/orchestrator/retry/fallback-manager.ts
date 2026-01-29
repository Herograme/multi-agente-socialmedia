/**
 * Fallback Manager
 * Manages fallback between providers with circuit breaker pattern
 * Story 4.5: Orquestrador - Retry e Error Handling
 */

import { EventEmitter } from 'events';
import { createLogger } from '@social-content/shared';
import {
  FallbackConfig,
  FallbackManagerOptions,
  ProviderHealth,
} from './types';

const logger = createLogger('orchestrator:fallback-manager');

/**
 * Default fallback configuration
 */
export const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  failureThreshold: 3,
  resetTimeout: 60000, // 1 minute
  providers: [],
  autoRecover: true,
  recoveryDelay: 30000, // 30 seconds
};

/**
 * Fallback Manager class
 * Tracks provider health and manages fallback between providers
 */
export class FallbackManager extends EventEmitter {
  private config: FallbackConfig;
  private healthMap: Map<string, ProviderHealth> = new Map();
  private recoveryTimers: Map<string, NodeJS.Timeout> = new Map();
  private resetTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(options: FallbackManagerOptions = {}) {
    super();
    this.config = { ...DEFAULT_FALLBACK_CONFIG, ...options };
    this.initializeHealthMap(options.initialHealth);
  }

  /**
   * Initialize health map for all providers
   */
  private initializeHealthMap(initialHealth?: Map<string, ProviderHealth>): void {
    for (const provider of this.config.providers) {
      if (initialHealth?.has(provider)) {
        this.healthMap.set(provider, initialHealth.get(provider)!);
      } else {
        this.healthMap.set(provider, this.createHealthyState(provider));
      }
    }
  }

  /**
   * Create a healthy provider state
   */
  private createHealthyState(provider: string): ProviderHealth {
    return {
      provider,
      consecutiveFailures: 0,
      lastFailure: null,
      lastSuccess: null,
      isHealthy: true,
      circuitState: 'closed',
    };
  }

  /**
   * Record a failure for a provider
   *
   * @param provider - Provider that failed
   */
  recordFailure(provider: string): void {
    const health = this.healthMap.get(provider);
    if (!health) {
      logger.warn('Unknown provider', { provider });
      return;
    }

    // Clear any existing reset timer
    this.clearResetTimer(provider);

    health.consecutiveFailures++;
    health.lastFailure = new Date();

    logger.debug('Failure recorded', {
      provider,
      consecutiveFailures: health.consecutiveFailures,
      threshold: this.config.failureThreshold,
    });

    // Check if threshold reached
    if (health.consecutiveFailures >= this.config.failureThreshold) {
      if (health.isHealthy) {
        // Transition to unhealthy
        health.isHealthy = false;
        health.circuitState = 'open';

        logger.warn('Provider marked unhealthy (circuit open)', {
          provider,
          consecutiveFailures: health.consecutiveFailures,
        });

        this.emit('provider:unhealthy', {
          provider,
          health: { ...health },
        });

        // Schedule recovery attempt if auto-recover is enabled
        if (this.config.autoRecover) {
          this.scheduleRecoveryAttempt(provider);
        }
      }
    }

    // Schedule reset of failure counter if provider is still healthy
    if (health.isHealthy) {
      this.scheduleResetTimer(provider);
    }

    this.healthMap.set(provider, health);
  }

  /**
   * Record a success for a provider
   *
   * @param provider - Provider that succeeded
   */
  recordSuccess(provider: string): void {
    const health = this.healthMap.get(provider);
    if (!health) {
      logger.warn('Unknown provider', { provider });
      return;
    }

    const wasUnhealthy = !health.isHealthy;
    const wasHalfOpen = health.circuitState === 'half-open';

    // Reset state
    health.consecutiveFailures = 0;
    health.lastSuccess = new Date();
    health.isHealthy = true;
    health.circuitState = 'closed';

    // Clear timers
    this.clearResetTimer(provider);
    this.clearRecoveryTimer(provider);

    this.healthMap.set(provider, health);

    if (wasUnhealthy || wasHalfOpen) {
      logger.info('Provider recovered (circuit closed)', {
        provider,
        wasHalfOpen,
      });

      this.emit('provider:recovered', {
        provider,
        health: { ...health },
      });
    }

    logger.debug('Success recorded', { provider });
  }

  /**
   * Check if fallback should be used for a provider
   *
   * @param provider - Provider to check
   * @returns Whether to use fallback
   */
  shouldFallback(provider: string): boolean {
    const health = this.healthMap.get(provider);
    return health ? !health.isHealthy : false;
  }

  /**
   * Get the next available healthy provider
   *
   * @param currentProvider - Current provider that is failing
   * @returns Next healthy provider or null if none available
   */
  getNextProvider(currentProvider: string): string | null {
    const currentIndex = this.config.providers.indexOf(currentProvider);
    if (currentIndex === -1) {
      logger.warn('Current provider not in list', { currentProvider });
      return null;
    }

    // Try to find next healthy provider in order
    for (let i = 1; i < this.config.providers.length; i++) {
      const nextIndex = (currentIndex + i) % this.config.providers.length;
      const nextProvider = this.config.providers[nextIndex];

      if (!nextProvider) continue;

      const health = this.healthMap.get(nextProvider);

      // Accept healthy providers or half-open (worth trying)
      if (health?.isHealthy || health?.circuitState === 'half-open') {
        logger.info('Falling back to provider', {
          from: currentProvider,
          to: nextProvider,
          nextProviderState: health?.circuitState,
        });

        this.emit('fallback:activated', {
          from: currentProvider,
          to: nextProvider,
        });

        return nextProvider;
      }
    }

    logger.error('No healthy providers available', {
      providers: this.config.providers.map((p) => ({
        name: p,
        healthy: this.healthMap.get(p)?.isHealthy,
        circuitState: this.healthMap.get(p)?.circuitState,
      })),
    });

    return null;
  }

  /**
   * Get the primary (first) provider
   */
  getPrimaryProvider(): string | null {
    return this.config.providers[0] ?? null;
  }

  /**
   * Get the best currently available provider
   * Prefers primary if healthy, otherwise first healthy fallback
   */
  getBestAvailableProvider(): string | null {
    for (const provider of this.config.providers) {
      const health = this.healthMap.get(provider);
      if (health?.isHealthy || health?.circuitState === 'half-open') {
        return provider;
      }
    }

    // If no healthy providers, return primary anyway (will fail fast)
    return this.config.providers[0] ?? null;
  }

  /**
   * Schedule a recovery attempt for an unhealthy provider
   */
  private scheduleRecoveryAttempt(provider: string): void {
    // Clear existing timer
    this.clearRecoveryTimer(provider);

    const timer = setTimeout(() => {
      const health = this.healthMap.get(provider);
      if (health && !health.isHealthy) {
        // Transition to half-open to allow one test request
        health.circuitState = 'half-open';
        this.healthMap.set(provider, health);

        logger.info('Provider entering half-open state', { provider });

        this.emit('provider:half-open', { provider });
      }
    }, this.config.recoveryDelay);

    this.recoveryTimers.set(provider, timer);
  }

  /**
   * Schedule reset of failure counter
   */
  private scheduleResetTimer(provider: string): void {
    const timer = setTimeout(() => {
      const health = this.healthMap.get(provider);
      if (health && health.isHealthy) {
        // Reset failure counter if still healthy (no failures during timeout)
        health.consecutiveFailures = 0;
        this.healthMap.set(provider, health);

        logger.debug('Failure counter reset', { provider });
      }
    }, this.config.resetTimeout);

    this.resetTimers.set(provider, timer);
  }

  /**
   * Clear recovery timer for a provider
   */
  private clearRecoveryTimer(provider: string): void {
    const timer = this.recoveryTimers.get(provider);
    if (timer) {
      clearTimeout(timer);
      this.recoveryTimers.delete(provider);
    }
  }

  /**
   * Clear reset timer for a provider
   */
  private clearResetTimer(provider: string): void {
    const timer = this.resetTimers.get(provider);
    if (timer) {
      clearTimeout(timer);
      this.resetTimers.delete(provider);
    }
  }

  /**
   * Get health status of a specific provider
   *
   * @param provider - Provider name
   * @returns Health status or undefined if not found
   */
  getProviderHealth(provider: string): ProviderHealth | undefined {
    const health = this.healthMap.get(provider);
    return health ? { ...health } : undefined;
  }

  /**
   * Get health status of all providers
   */
  getAllProviderHealth(): ProviderHealth[] {
    return Array.from(this.healthMap.values()).map((h) => ({ ...h }));
  }

  /**
   * Manually reset a provider to healthy state
   *
   * @param provider - Provider to reset
   */
  resetProvider(provider: string): void {
    this.clearRecoveryTimer(provider);
    this.clearResetTimer(provider);

    const health = this.healthMap.get(provider);
    if (health) {
      health.consecutiveFailures = 0;
      health.isHealthy = true;
      health.circuitState = 'closed';
      this.healthMap.set(provider, health);

      logger.info('Provider manually reset', { provider });
    }
  }

  /**
   * Reset all providers to healthy state
   */
  resetAll(): void {
    for (const provider of this.config.providers) {
      this.resetProvider(provider);
    }
    logger.info('All providers reset');
  }

  /**
   * Get the current configuration
   */
  getConfig(): FallbackConfig {
    return { ...this.config };
  }

  /**
   * Update the configuration
   *
   * @param config - Partial configuration to merge
   */
  updateConfig(config: Partial<FallbackConfig>): void {
    // If providers changed, reinitialize health map
    if (config.providers && config.providers !== this.config.providers) {
      const oldProviders = new Set(this.config.providers);
      this.config = { ...this.config, ...config };

      // Keep health for existing providers, add new ones
      for (const provider of this.config.providers) {
        if (!oldProviders.has(provider)) {
          this.healthMap.set(provider, this.createHealthyState(provider));
        }
      }

      // Remove providers that are no longer in the list
      for (const provider of oldProviders) {
        if (!this.config.providers.includes(provider)) {
          this.healthMap.delete(provider);
          this.clearRecoveryTimer(provider);
          this.clearResetTimer(provider);
        }
      }
    } else {
      this.config = { ...this.config, ...config };
    }

    logger.debug('Configuration updated', { config: this.config });
  }

  /**
   * Check if any fallback providers are available
   */
  hasAvailableFallback(currentProvider: string): boolean {
    return this.getNextProvider(currentProvider) !== null;
  }

  /**
   * Get statistics about provider health
   */
  getHealthStatistics(): {
    total: number;
    healthy: number;
    unhealthy: number;
    halfOpen: number;
  } {
    let healthy = 0;
    let unhealthy = 0;
    let halfOpen = 0;

    for (const health of this.healthMap.values()) {
      if (health.circuitState === 'half-open') {
        halfOpen++;
      } else if (health.isHealthy) {
        healthy++;
      } else {
        unhealthy++;
      }
    }

    return {
      total: this.config.providers.length,
      healthy,
      unhealthy,
      halfOpen,
    };
  }

  /**
   * Clean up resources (clear all timers)
   */
  dispose(): void {
    for (const provider of this.config.providers) {
      this.clearRecoveryTimer(provider);
      this.clearResetTimer(provider);
    }
    this.removeAllListeners();
    logger.debug('FallbackManager disposed');
  }
}

/**
 * Create a FallbackManager instance
 *
 * @param options - Configuration options
 * @returns FallbackManager instance
 */
export function createFallbackManager(options?: FallbackManagerOptions): FallbackManager {
  return new FallbackManager(options);
}
