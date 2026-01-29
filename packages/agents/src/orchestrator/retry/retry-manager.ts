/**
 * Retry Manager
 * Manages retry logic with exponential backoff and state preservation
 * Story 4.5: Orquestrador - Retry e Error Handling
 */

import { createLogger } from '@social-content/shared';
import {
  ErrorCategory,
  RetryConfig,
  RetryState,
  RetryManagerOptions,
  RetryExecutionResult,
} from './types';
import {
  classifyError,
  isRetriable,
  registerClassifier,
  getDelayMultiplier,
} from './error-classifier';

const logger = createLogger('orchestrator:retry-manager');

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitter: true,
  jitterFactor: 0.25,
  retriableCategories: [
    ErrorCategory.RETRIABLE,
    ErrorCategory.TIMEOUT,
    ErrorCategory.NETWORK,
    ErrorCategory.RATE_LIMITED,
  ],
};

/**
 * Options for the execute method
 */
export interface ExecuteOptions {
  /** Callback called before each retry */
  onRetry?: (state: RetryState, delay: number) => void;
  /** Initial provider name for state tracking */
  initialProvider?: string;
  /** Abort signal for cancellation */
  abortSignal?: AbortSignal;
}

/**
 * Retry Manager class
 * Handles retry logic with exponential backoff and jitter
 */
export class RetryManager {
  private config: RetryConfig;
  private unregisterClassifiers: Array<() => void> = [];

  constructor(options: RetryManagerOptions = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...options };

    // Register any custom classifiers
    if (options.customClassifiers) {
      for (const classifier of options.customClassifiers) {
        this.unregisterClassifiers.push(registerClassifier(classifier));
      }
    }
  }

  /**
   * Calculate delay for the next retry attempt
   * Uses exponential backoff with optional jitter
   *
   * @param attempt - Current attempt number (1-based)
   * @param errorCategory - Optional error category for delay adjustment
   * @returns Delay in milliseconds
   */
  calculateDelay(attempt: number, errorCategory?: ErrorCategory): number {
    // Calculate base exponential backoff: initialDelay * (backoffFactor ^ (attempt - 1))
    const exponentialDelay =
      this.config.initialDelay * Math.pow(this.config.backoffFactor, attempt - 1);

    // Apply category-based multiplier (e.g., rate limits need longer waits)
    const multiplier = errorCategory ? getDelayMultiplier(errorCategory) : 1;
    const adjustedDelay = exponentialDelay * multiplier;

    // Cap at maxDelay
    let delay = Math.min(adjustedDelay, this.config.maxDelay);

    // Apply jitter if enabled
    if (this.config.jitter) {
      const jitterRange = delay * this.config.jitterFactor;
      // Random value between -jitterRange and +jitterRange
      const jitter = Math.random() * jitterRange * 2 - jitterRange;
      delay = Math.max(0, delay + jitter);
    }

    return Math.round(delay);
  }

  /**
   * Determine if a retry should be attempted
   *
   * @param error - The error that occurred
   * @param attempt - Current attempt number (1-based)
   * @returns Whether to retry
   */
  shouldRetry(error: Error, attempt: number): boolean {
    // Check if we've exhausted attempts
    if (attempt >= this.config.maxAttempts) {
      logger.debug('Max attempts reached', {
        attempt,
        maxAttempts: this.config.maxAttempts,
      });
      return false;
    }

    // Classify the error
    const category = classifyError(error);

    // Check if the category allows retry
    const canRetry = isRetriable(category, this.config.retriableCategories);

    logger.debug('Retry decision', {
      attempt,
      maxAttempts: this.config.maxAttempts,
      category,
      canRetry,
      errorMessage: error.message,
    });

    return canRetry;
  }

  /**
   * Create an initial retry state
   *
   * @param provider - Initial provider name
   * @returns Initial state
   */
  createInitialState(provider: string): RetryState {
    return {
      attempts: 0,
      lastError: null,
      lastErrorCategory: null,
      totalDelay: 0,
      currentProvider: provider,
      fallbackActive: false,
      startedAt: new Date(),
    };
  }

  /**
   * Update state after a failed attempt
   * Note: attempts is NOT incremented here since it's already
   * incremented before execution in the execute() method
   *
   * @param state - Current state
   * @param error - Error that occurred
   * @param delay - Delay that will be applied
   * @returns Updated state
   */
  updateStateAfterFailure(state: RetryState, error: Error, delay: number): RetryState {
    const category = classifyError(error);
    return {
      ...state,
      lastError: error,
      lastErrorCategory: category,
      totalDelay: state.totalDelay + delay,
    };
  }

  /**
   * Execute a function with automatic retry
   *
   * @param fn - Async function to execute
   * @param options - Execution options
   * @returns Result and final state
   *
   * @example
   * const manager = new RetryManager({ maxAttempts: 5 });
   *
   * const { result, state } = await manager.execute(
   *   async () => fetchData(),
   *   {
   *     onRetry: (state, delay) => console.log(`Retrying in ${delay}ms`),
   *   }
   * );
   */
  async execute<T>(
    fn: () => Promise<T>,
    options: ExecuteOptions = {}
  ): Promise<RetryExecutionResult<T>> {
    let state = this.createInitialState(options.initialProvider ?? 'default');

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // Check for cancellation before attempt
      if (options.abortSignal?.aborted) {
        const abortError = new Error('Operation was aborted');
        abortError.name = 'AbortError';
        throw abortError;
      }

      try {
        // Increment attempts and execute
        state = { ...state, attempts: state.attempts + 1 };

        logger.debug('Executing attempt', {
          attempt: state.attempts,
          maxAttempts: this.config.maxAttempts,
          provider: state.currentProvider,
        });

        const result = await fn();

        logger.info('Execution succeeded', {
          attempts: state.attempts,
          totalDelay: state.totalDelay,
          provider: state.currentProvider,
        });

        return { result, state };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        const category = classifyError(err);

        logger.warn('Execution failed', {
          attempt: state.attempts,
          maxAttempts: this.config.maxAttempts,
          error: err.message,
          category,
          provider: state.currentProvider,
        });

        // Check if we should retry
        if (!this.shouldRetry(err, state.attempts)) {
          logger.error('Retry exhausted or error not retriable', {
            attempts: state.attempts,
            category,
            errorMessage: err.message,
          });

          // Update state with final error before throwing
          state = {
            ...state,
            lastError: err,
            lastErrorCategory: category,
          };

          throw err;
        }

        // Calculate delay for this retry
        const delay = this.calculateDelay(state.attempts, category);

        // Update state
        state = this.updateStateAfterFailure(state, err, delay);

        // Call onRetry callback
        if (options.onRetry) {
          options.onRetry(state, delay);
        }

        logger.info('Retrying after delay', {
          attempt: state.attempts + 1,
          maxAttempts: this.config.maxAttempts,
          delay,
          totalDelay: state.totalDelay,
          category,
        });

        // Wait before retrying
        await this.sleep(delay, options.abortSignal);
      }
    }
  }

  /**
   * Sleep for a specified duration with abort support
   */
  private sleep(ms: number, abortSignal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);

      if (abortSignal) {
        const onAbort = () => {
          clearTimeout(timeout);
          const error = new Error('Sleep was aborted');
          error.name = 'AbortError';
          reject(error);
        };

        if (abortSignal.aborted) {
          clearTimeout(timeout);
          onAbort();
          return;
        }

        abortSignal.addEventListener('abort', onAbort, { once: true });
      }
    });
  }

  /**
   * Get the current configuration
   */
  getConfig(): RetryConfig {
    return { ...this.config };
  }

  /**
   * Update the configuration
   *
   * @param config - Partial configuration to merge
   */
  updateConfig(config: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...config };
    logger.debug('Configuration updated', { config: this.config });
  }

  /**
   * Clean up resources (unregister custom classifiers)
   */
  dispose(): void {
    for (const unregister of this.unregisterClassifiers) {
      unregister();
    }
    this.unregisterClassifiers = [];
  }
}

/**
 * Create a RetryManager instance
 *
 * @param options - Configuration options
 * @returns RetryManager instance
 */
export function createRetryManager(options?: RetryManagerOptions): RetryManager {
  return new RetryManager(options);
}

/**
 * Execute a function with retry using default configuration
 *
 * @param fn - Function to execute
 * @param options - Execution options
 * @returns Result and state
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  options?: RetryManagerOptions & ExecuteOptions
): Promise<RetryExecutionResult<T>> {
  const manager = new RetryManager(options);
  try {
    return await manager.execute(fn, options);
  } finally {
    manager.dispose();
  }
}
