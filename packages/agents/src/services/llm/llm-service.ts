/**
 * LLM Service - Multi-provider orchestrator with circuit breaker
 * Manages LLM providers with automatic fallback and retry logic
 */

import { EventEmitter } from 'events';
import { createLogger } from '@social-content/shared';
import type {
  LLMProvider,
  LLMService as ILLMService,
  LLMServiceConfig,
  LLMGenerateOptions,
  LLMGenerateResult,
  LLMProviderStatus,
  LLMProviderMetrics,
  LLMServiceEvents,
} from './types';
import { LLMError, LLMErrorCode } from './types';

const logger = createLogger('llm:service');

/**
 * Circuit breaker state for a provider
 */
interface CircuitBreakerState {
  failures: number;
  lastFailure?: Date;
  isOpen: boolean;
}

/**
 * LLM Service implementation
 * Orchestrates multiple LLM providers with automatic fallback
 */
export class LLMServiceImpl extends EventEmitter implements ILLMService {
  private providers: LLMProvider[] = [];
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private metrics: Map<string, LLMProviderMetrics> = new Map();
  private config: LLMServiceConfig;

  constructor(providers: LLMProvider[], config: LLMServiceConfig) {
    super();

    // Sort providers by priority (lower = higher priority)
    this.providers = providers.sort((a, b) => {
      const configA = config.providers.find((p) => p.name === a.name);
      const configB = config.providers.find((p) => p.name === b.name);
      return (configA?.priority ?? 99) - (configB?.priority ?? 99);
    });

    this.config = config;

    // Initialize circuit breakers and metrics
    for (const provider of this.providers) {
      this.circuitBreakers.set(provider.name, {
        failures: 0,
        isOpen: false,
      });
      this.metrics.set(provider.name, {
        requests: 0,
        successes: 0,
        failures: 0,
        totalTokens: 0,
        averageLatencyMs: 0,
      });
    }

    logger.info('LLMService initialized', {
      providers: this.providers.map((p) => p.name),
      defaultTemperature: config.defaultTemperature,
      defaultMaxTokens: config.defaultMaxTokens,
    });
  }

  /**
   * Generate a completion using configured providers
   * Tries providers in order with automatic fallback
   */
  async generate(options: LLMGenerateOptions): Promise<LLMGenerateResult> {
    const normalizedOptions = this.normalizeOptions(options);

    logger.info('Starting LLM generation', {
      messageCount: normalizedOptions.messages.length,
      temperature: normalizedOptions.temperature,
      maxTokens: normalizedOptions.maxTokens,
      responseFormat: normalizedOptions.responseFormat,
    });

    for (const provider of this.providers) {
      // Check circuit breaker
      if (this.isCircuitOpen(provider.name)) {
        logger.debug('Skipping provider - circuit open', {
          provider: provider.name,
        });
        this.emitEvent('provider:skipped', {
          provider: provider.name,
          reason: 'circuit_open',
        });
        continue;
      }

      // Check provider availability
      const isAvailable = await provider.isAvailable();
      if (!isAvailable) {
        logger.debug('Skipping provider - unavailable', {
          provider: provider.name,
        });
        this.emitEvent('provider:skipped', {
          provider: provider.name,
          reason: 'unavailable',
        });
        continue;
      }

      try {
        this.emitEvent('provider:start', {
          provider: provider.name,
          options: normalizedOptions,
        });
        this.incrementMetric(provider.name, 'requests');

        const startTime = Date.now();
        const result = await this.executeWithRetry(provider, normalizedOptions);
        const latency = Date.now() - startTime;

        this.incrementMetric(provider.name, 'successes');
        this.updateLatencyMetric(provider.name, latency);
        if (result.usage) {
          this.addTokensMetric(provider.name, result.usage.totalTokens);
        }
        this.resetCircuitBreaker(provider.name);
        this.emitEvent('provider:success', {
          provider: provider.name,
          result,
        });

        logger.info('LLM generation completed', {
          provider: provider.name,
          model: result.model,
          tokens: result.usage?.totalTokens,
          latencyMs: latency,
        });

        return result;
      } catch (error) {
        this.incrementMetric(provider.name, 'failures');
        this.recordFailure(provider.name);
        this.emitEvent('provider:error', {
          provider: provider.name,
          error: error as Error,
        });

        logger.error('Provider failed', {
          provider: provider.name,
          error: (error as Error).message,
        });

        // If error is not retriable, throw immediately
        if (error instanceof LLMError && !error.retriable) {
          throw error;
        }

        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    const error = new LLMError(
      'All LLM providers failed',
      'service',
      LLMErrorCode.ALL_PROVIDERS_FAILED,
      false
    );

    logger.error('All providers failed', {
      providers: this.providers.map((p) => p.name),
    });

    throw error;
  }

  /**
   * Execute with retry logic
   */
  private async executeWithRetry(
    provider: LLMProvider,
    options: LLMGenerateOptions
  ): Promise<LLMGenerateResult> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await provider.generate(options);
      } catch (error) {
        lastError = error as Error;

        // Don't retry non-retriable errors
        if (error instanceof LLMError && !error.retriable) {
          throw error;
        }

        logger.warn('Generation attempt failed, retrying', {
          provider: provider.name,
          attempt,
          maxRetries: this.config.maxRetries,
          error: (error as Error).message,
        });

        // Exponential backoff before retry
        if (attempt < this.config.maxRetries) {
          const delay = this.config.retryDelayMs * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Normalize options with defaults
   */
  private normalizeOptions(options: LLMGenerateOptions): LLMGenerateOptions {
    return {
      ...options,
      temperature: options.temperature ?? this.config.defaultTemperature,
      maxTokens: options.maxTokens ?? this.config.defaultMaxTokens,
    };
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitOpen(providerName: string): boolean {
    const state = this.circuitBreakers.get(providerName);
    if (!state || !state.isOpen) return false;

    // Check if enough time has passed to close circuit
    if (state.lastFailure) {
      const elapsed = Date.now() - state.lastFailure.getTime();
      if (elapsed >= this.config.circuitBreakerResetMs) {
        // Half-open: allow one attempt
        state.isOpen = false;
        state.failures = 0;
        this.emitEvent('circuit:close', { provider: providerName as any });
        logger.info('Circuit breaker closed', { provider: providerName });
        return false;
      }
    }

    return true;
  }

  /**
   * Record a failure
   */
  private recordFailure(providerName: string): void {
    const state = this.circuitBreakers.get(providerName);
    if (!state) return;

    state.failures++;
    state.lastFailure = new Date();

    if (state.failures >= this.config.circuitBreakerThreshold) {
      state.isOpen = true;
      this.emitEvent('circuit:open', {
        provider: providerName as any,
        failures: state.failures,
      });
      logger.warn('Circuit breaker opened', {
        provider: providerName,
        failures: state.failures,
      });
    }
  }

  /**
   * Reset circuit breaker
   */
  private resetCircuitBreaker(providerName: string): void {
    const state = this.circuitBreakers.get(providerName);
    if (state) {
      state.failures = 0;
      state.isOpen = false;
    }
  }

  /**
   * Increment a metric
   */
  private incrementMetric(
    providerName: string,
    metric: 'requests' | 'successes' | 'failures'
  ): void {
    const metrics = this.metrics.get(providerName);
    if (metrics) {
      metrics[metric]++;
    }
  }

  /**
   * Update latency metric (running average)
   */
  private updateLatencyMetric(providerName: string, latencyMs: number): void {
    const metrics = this.metrics.get(providerName);
    if (metrics && metrics.successes > 0) {
      // Simple running average
      const prevAvg = metrics.averageLatencyMs;
      const n = metrics.successes;
      metrics.averageLatencyMs = prevAvg + (latencyMs - prevAvg) / n;
    }
  }

  /**
   * Add tokens to metric
   */
  private addTokensMetric(providerName: string, tokens: number): void {
    const metrics = this.metrics.get(providerName);
    if (metrics) {
      metrics.totalTokens += tokens;
    }
  }

  /**
   * Get status of all providers
   */
  getProvidersStatus(): LLMProviderStatus[] {
    return this.providers.map((p) => p.getStatus());
  }

  /**
   * Get metrics for all providers
   */
  getMetrics(): Map<string, LLMProviderMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Check if any provider is available
   */
  async isAvailable(): Promise<boolean> {
    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Type-safe event emitter
   */
  private emitEvent<K extends keyof LLMServiceEvents>(
    event: K,
    data: LLMServiceEvents[K]
  ): void {
    this.emit(event, data);
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
