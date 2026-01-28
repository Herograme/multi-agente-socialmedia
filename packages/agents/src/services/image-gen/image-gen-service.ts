/**
 * ImageGenService - Multi-provider image generation with automatic fallback
 * Orchestrates image generation across multiple AI providers
 */

import { EventEmitter } from 'events';
import { createLogger } from '@social-content/shared';
import type {
  ImageProvider,
  ImageGenOptions,
  GeneratedImage,
  ImageGenConfig,
  ProviderStatus,
  ProviderMetrics,
  ImageGenEvents,
} from './types';
import { ImageGenError, ImageGenErrorCode } from './types';

const logger = createLogger('image-gen:service');

/**
 * Internal state for circuit breaker per provider
 */
interface CircuitBreakerState {
  /** Number of consecutive failures */
  failures: number;
  /** Timestamp of last failure */
  lastFailure?: Date;
  /** Whether the circuit is currently open (blocking requests) */
  isOpen: boolean;
}

/**
 * ImageGenService - Orchestrates image generation with automatic fallback
 *
 * @example
 * ```typescript
 * const service = createImageGenService({
 *   providers: [
 *     { name: 'ideogram', apiKey: 'key1', enabled: true, priority: 1 },
 *     { name: 'leonardo', apiKey: 'key2', enabled: true, priority: 2 }
 *   ]
 * });
 *
 * const image = await service.generate({
 *   prompt: 'A futuristic cityscape',
 *   style: ImageStyle.TECH,
 *   aspectRatio: AspectRatio.LANDSCAPE
 * });
 * ```
 */
export class ImageGenService extends EventEmitter {
  private providers: ImageProvider[] = [];
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private config: ImageGenConfig;
  private usageMetrics: Map<string, ProviderMetrics> = new Map();

  constructor(providers: ImageProvider[], config: ImageGenConfig) {
    super();

    // Sort providers by priority (lower = higher priority)
    this.providers = providers.sort((a, b) => {
      const configA = config.providers.find((p) => p.name === a.name);
      const configB = config.providers.find((p) => p.name === b.name);
      return (configA?.priority ?? 99) - (configB?.priority ?? 99);
    });

    this.config = config;

    // Initialize circuit breakers and metrics for each provider
    for (const provider of this.providers) {
      this.circuitBreakers.set(provider.name, {
        failures: 0,
        isOpen: false,
      });
      this.usageMetrics.set(provider.name, {
        requests: 0,
        successes: 0,
        failures: 0,
      });
    }

    logger.info('ImageGenService initialized', {
      providers: this.providers.map((p) => p.name),
      defaultStyle: config.defaultStyle,
      defaultAspectRatio: config.defaultAspectRatio,
    });
  }

  /**
   * Generate an image using the configured providers
   * Automatically falls back to the next provider on failure
   *
   * @param options - Generation options
   * @returns Generated image result
   * @throws ImageGenError if all providers fail
   */
  async generate(options: ImageGenOptions): Promise<GeneratedImage> {
    const normalizedOptions = this.normalizeOptions(options);

    logger.info('Starting image generation', {
      prompt: normalizedOptions.prompt.substring(0, 100),
      style: normalizedOptions.style,
      aspectRatio: normalizedOptions.aspectRatio,
    });

    for (const provider of this.providers) {
      // Check circuit breaker
      if (this.isCircuitOpen(provider.name)) {
        logger.debug('Skipping provider - circuit open', { provider: provider.name });
        this.emitEvent('provider:skipped', { provider: provider.name, reason: 'circuit_open' });
        continue;
      }

      // Check provider availability
      const isAvailable = await provider.isAvailable();
      if (!isAvailable) {
        logger.debug('Skipping provider - unavailable', { provider: provider.name });
        this.emitEvent('provider:skipped', { provider: provider.name, reason: 'unavailable' });
        continue;
      }

      try {
        this.emitEvent('provider:start', { provider: provider.name, options: normalizedOptions });
        this.incrementMetric(provider.name, 'requests');

        const result = await this.executeWithRetry(provider, normalizedOptions);

        this.incrementMetric(provider.name, 'successes');
        this.resetCircuitBreaker(provider.name);
        this.emitEvent('provider:success', { provider: provider.name, result });

        logger.info('Image generated successfully', {
          provider: provider.name,
          imageId: result.id,
          localPath: result.localPath,
        });

        return result;
      } catch (error) {
        this.incrementMetric(provider.name, 'failures');
        this.recordFailure(provider.name);
        this.emitEvent('provider:error', { provider: provider.name, error: error as Error });

        logger.error('Provider failed', {
          provider: provider.name,
          error: (error as Error).message,
        });

        // If error is not retriable, propagate immediately
        if (error instanceof ImageGenError && !error.retriable) {
          throw error;
        }

        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    const error = new ImageGenError(
      'All image providers failed',
      'all',
      ImageGenErrorCode.ALL_PROVIDERS_FAILED,
      false
    );

    logger.error('All providers failed', {
      providers: this.providers.map((p) => p.name),
    });

    throw error;
  }

  /**
   * Execute generation with retry logic
   */
  private async executeWithRetry(
    provider: ImageProvider,
    options: ImageGenOptions
  ): Promise<GeneratedImage> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await provider.generate(options);
      } catch (error) {
        lastError = error as Error;

        // If not retriable, don't retry
        if (error instanceof ImageGenError && !error.retriable) {
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
          const delay = Math.pow(2, attempt) * 1000;
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Normalize options with defaults
   */
  private normalizeOptions(options: ImageGenOptions): ImageGenOptions {
    return {
      ...options,
      style: options.style ?? this.config.defaultStyle,
      aspectRatio: options.aspectRatio ?? this.config.defaultAspectRatio,
      outputPath: options.outputPath ?? this.config.defaultOutputDir,
    };
  }

  /**
   * Check if circuit breaker is open for a provider
   */
  private isCircuitOpen(providerName: string): boolean {
    const state = this.circuitBreakers.get(providerName);
    if (!state || !state.isOpen) return false;

    // Check if enough time has passed to attempt closing the circuit
    if (state.lastFailure) {
      const elapsed = Date.now() - state.lastFailure.getTime();
      if (elapsed >= this.config.circuitBreakerResetMs) {
        // Half-open state - allow one attempt
        state.isOpen = false;
        state.failures = 0;
        this.emitEvent('circuit:close', { provider: providerName });
        logger.info('Circuit breaker closed', { provider: providerName });
        return false;
      }
    }

    return true;
  }

  /**
   * Record a failure and potentially open the circuit breaker
   */
  private recordFailure(providerName: string): void {
    const state = this.circuitBreakers.get(providerName);
    if (!state) return;

    state.failures++;
    state.lastFailure = new Date();

    if (state.failures >= this.config.circuitBreakerThreshold) {
      state.isOpen = true;
      this.emitEvent('circuit:open', { provider: providerName, failures: state.failures });
      logger.warn('Circuit breaker opened', {
        provider: providerName,
        failures: state.failures,
      });
    }
  }

  /**
   * Reset circuit breaker after a successful request
   */
  private resetCircuitBreaker(providerName: string): void {
    const state = this.circuitBreakers.get(providerName);
    if (state) {
      state.failures = 0;
      state.isOpen = false;
    }
  }

  /**
   * Increment a metric for a provider
   */
  private incrementMetric(
    providerName: string,
    metric: 'requests' | 'successes' | 'failures'
  ): void {
    const metrics = this.usageMetrics.get(providerName);
    if (metrics) {
      metrics[metric]++;
    }
  }

  /**
   * Get status of all providers
   */
  getProvidersStatus(): ProviderStatus[] {
    return this.providers.map((p) => p.getStatus());
  }

  /**
   * Get a specific provider's status
   */
  getProviderStatus(providerName: string): ProviderStatus | undefined {
    const provider = this.providers.find((p) => p.name === providerName);
    return provider?.getStatus();
  }

  /**
   * Get usage metrics for all providers
   */
  getMetrics(): Map<string, ProviderMetrics> {
    return new Map(this.usageMetrics);
  }

  /**
   * Get metrics for a specific provider
   */
  getProviderMetrics(providerName: string): ProviderMetrics | undefined {
    return this.usageMetrics.get(providerName);
  }

  /**
   * Get list of available provider names
   */
  getProviderNames(): string[] {
    return this.providers.map((p) => p.name);
  }

  /**
   * Check if a provider exists
   */
  hasProvider(providerName: string): boolean {
    return this.providers.some((p) => p.name === providerName);
  }

  /**
   * Type-safe event emitter
   */
  private emitEvent<K extends keyof ImageGenEvents>(event: K, data: ImageGenEvents[K]): void {
    this.emit(event, data);
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
