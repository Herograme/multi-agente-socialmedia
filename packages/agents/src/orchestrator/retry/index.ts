/**
 * Retry Module
 * Exports all retry and error handling functionality
 * Story 4.5: Orquestrador - Retry e Error Handling
 */

// Types
export {
  ErrorCategory,
  type RetryConfig,
  type TimeoutConfig,
  type FallbackConfig,
  type RetryState,
  type ProviderHealth,
  type CircuitState,
  type FallbackRecord,
  type StepRetryRecord,
  type DegradationReport,
  type AgentExecutionConfig,
  type RetryEvent,
  type FallbackEvent,
  type ErrorClassifierFn,
  type RetryManagerOptions,
  type FallbackManagerOptions,
  type RetryExecutionResult,
  type FallbackManagerEvents,
} from './types';

// Error Classifier
export {
  classifyError,
  isRetriable,
  registerClassifier,
  clearCustomClassifiers,
  getCustomClassifierCount,
  getCategoryDescription,
  isRateLimitError,
  isTimeoutError,
  isNetworkError,
  isFatalError,
  getDelayMultiplier,
} from './error-classifier';

// Retry Manager
export {
  RetryManager,
  createRetryManager,
  executeWithRetry,
  DEFAULT_RETRY_CONFIG,
  type ExecuteOptions,
} from './retry-manager';

// Fallback Manager
export {
  FallbackManager,
  createFallbackManager,
  DEFAULT_FALLBACK_CONFIG,
} from './fallback-manager';

// Agent Retry Config
export {
  AgentRetryConfigManager,
  createAgentRetryConfigManager,
  ConfigValidationError,
  DEFAULT_TIMEOUT_CONFIG,
  CONFIG_PRESETS,
  type AgentConfigInput,
  type AgentRetryConfigManagerOptions,
} from './agent-retry-config';

// Degradation Report
export {
  DegradationReportBuilder,
  createDegradationReportBuilder,
  mergeDegradationReports,
  EMPTY_DEGRADATION_REPORT,
} from './degradation-report';
