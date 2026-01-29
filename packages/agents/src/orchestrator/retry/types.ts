/**
 * Retry and Error Handling Types
 * Defines interfaces for retry configuration, error categorization, and degradation reporting
 * Story 4.5: Orquestrador - Retry e Error Handling
 */

/**
 * Categories of errors for retry decision-making
 */
export enum ErrorCategory {
  /** Transient error, can be retried */
  RETRIABLE = 'retriable',
  /** Fatal error, should not retry (auth, config, etc) */
  FATAL = 'fatal',
  /** Rate limit exceeded, retry with longer delay */
  RATE_LIMITED = 'rate_limited',
  /** Operation timed out, can be retried */
  TIMEOUT = 'timeout',
  /** Network error, can be retried */
  NETWORK = 'network',
}

/**
 * Configuration for retry behavior per agent
 */
export interface RetryConfig {
  /** Maximum number of attempts including the first try (default: 3) */
  maxAttempts: number;
  /** Initial delay in ms before first retry (default: 1000) */
  initialDelay: number;
  /** Maximum delay in ms between retries (default: 30000) */
  maxDelay: number;
  /** Factor to multiply delay by after each retry (default: 2) */
  backoffFactor: number;
  /** Whether to add random jitter to delays (default: true) */
  jitter: boolean;
  /** Maximum jitter as a fraction of delay (default: 0.25 = 25%) */
  jitterFactor: number;
  /** Error categories that allow retry */
  retriableCategories: ErrorCategory[];
}

/**
 * Configuration for timeout per agent
 */
export interface TimeoutConfig {
  /** Timeout in ms for the main operation (default: 60000) */
  timeout: number;
  /** Timeout in ms for initialization operations */
  initTimeout?: number;
}

/**
 * Configuration for fallback between providers
 */
export interface FallbackConfig {
  /** Number of consecutive failures before triggering fallback (default: 3) */
  failureThreshold: number;
  /** Time in ms before resetting failure counter (default: 60000) */
  resetTimeout: number;
  /** Ordered list of providers (primary first) */
  providers: string[];
  /** Whether to automatically try to recover to primary provider (default: true) */
  autoRecover: boolean;
  /** Minimum time in ms before attempting recovery to primary (default: 30000) */
  recoveryDelay: number;
}

/**
 * State of retry attempts during execution
 */
export interface RetryState {
  /** Current number of attempts made */
  attempts: number;
  /** Last error that occurred */
  lastError: Error | null;
  /** Category of the last error */
  lastErrorCategory: ErrorCategory | null;
  /** Total delay accumulated between retries in ms */
  totalDelay: number;
  /** Current provider being used */
  currentProvider: string;
  /** Whether fallback is currently active */
  fallbackActive: boolean;
  /** Timestamp when execution started */
  startedAt: Date;
}

/**
 * Health status of a provider
 */
export interface ProviderHealth {
  /** Provider name/identifier */
  provider: string;
  /** Number of consecutive failures */
  consecutiveFailures: number;
  /** Timestamp of last failure */
  lastFailure: Date | null;
  /** Timestamp of last success */
  lastSuccess: Date | null;
  /** Whether the provider is currently healthy */
  isHealthy: boolean;
  /** Current circuit breaker state */
  circuitState: CircuitState;
}

/**
 * Circuit breaker states
 */
export type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Record of a fallback that occurred
 */
export interface FallbackRecord {
  /** Step where fallback occurred */
  step: string;
  /** Provider that failed */
  fromProvider: string;
  /** Provider that took over */
  toProvider: string;
  /** When the fallback occurred */
  timestamp: Date;
}

/**
 * Record of retry attempts for a step
 */
export interface StepRetryRecord {
  /** Number of attempts made */
  attempts: number;
  /** Total delay accumulated */
  totalDelay: number;
  /** Error messages encountered */
  errors: string[];
}

/**
 * Report of degradation during pipeline execution
 */
export interface DegradationReport {
  /** Whether any degradation occurred */
  hasDegradation: boolean;
  /** Degradation score (0 = none, 100 = severe) */
  degradationScore: number;
  /** List of fallbacks that were used */
  fallbacksUsed: FallbackRecord[];
  /** Retry information per step */
  retriesPerStep: Record<string, StepRetryRecord>;
  /** Names of steps that experienced degradation */
  degradedSteps: string[];
  /** Recommendations based on the data */
  recommendations: string[];
}

/**
 * Complete execution configuration for an agent
 */
export interface AgentExecutionConfig {
  /** Agent name */
  name: string;
  /** Retry configuration */
  retry: RetryConfig;
  /** Timeout configuration */
  timeout: TimeoutConfig;
  /** Optional fallback configuration */
  fallback?: FallbackConfig;
}

/**
 * Event emitted when a retry occurs
 */
export interface RetryEvent {
  /** Pipeline run ID */
  pipelineId: string;
  /** Step name */
  stepName: string;
  /** Current attempt number */
  attempt: number;
  /** Maximum attempts allowed */
  maxAttempts: number;
  /** Delay before this retry in ms */
  delay: number;
  /** Error message that caused retry */
  error: string;
  /** Category of the error */
  errorCategory: ErrorCategory;
  /** When the event occurred */
  timestamp: Date;
}

/**
 * Event emitted when a fallback occurs
 */
export interface FallbackEvent {
  /** Pipeline run ID */
  pipelineId: string;
  /** Step name */
  stepName: string;
  /** Provider that failed */
  fromProvider: string;
  /** Provider being used as fallback */
  toProvider: string;
  /** Reason for fallback */
  reason: string;
  /** When the event occurred */
  timestamp: Date;
}

/**
 * Custom error classifier function type
 */
export type ErrorClassifierFn = (error: Error) => ErrorCategory | null;

/**
 * Options for creating a RetryManager
 */
export interface RetryManagerOptions extends Partial<RetryConfig> {
  /** Custom error classifiers to use */
  customClassifiers?: ErrorClassifierFn[];
}

/**
 * Options for creating a FallbackManager
 */
export interface FallbackManagerOptions extends Partial<FallbackConfig> {
  /** Initial health state for providers */
  initialHealth?: Map<string, ProviderHealth>;
}

/**
 * Result of a retry-wrapped execution
 */
export interface RetryExecutionResult<T> {
  /** The result of the successful execution */
  result: T;
  /** Final state after execution */
  state: RetryState;
}

/**
 * Events emitted by FallbackManager
 */
export interface FallbackManagerEvents {
  'provider:unhealthy': { provider: string; health: ProviderHealth };
  'provider:recovered': { provider: string; health: ProviderHealth };
  'provider:half-open': { provider: string };
  'fallback:activated': { from: string; to: string };
}
