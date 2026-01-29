/**
 * LLM Service Types
 * Types and interfaces for multi-provider LLM service
 */

/**
 * Supported LLM provider names
 */
export type LLMProviderName = 'groq' | 'openai' | 'anthropic';

/**
 * LLM message role
 */
export type LLMMessageRole = 'system' | 'user' | 'assistant';

/**
 * LLM message format
 */
export interface LLMMessage {
  role: LLMMessageRole;
  content: string;
}

/**
 * LLM generation options
 */
export interface LLMGenerateOptions {
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
  /**
   * Response format - when 'json', instructs the model to return valid JSON
   */
  responseFormat?: 'text' | 'json';
}

/**
 * Token usage information
 */
export interface LLMTokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * LLM generation result
 */
export interface LLMGenerateResult {
  content: string;
  provider: LLMProviderName;
  model: string;
  usage?: LLMTokenUsage;
  finishReason?: 'stop' | 'length' | 'content_filter' | 'error';
}

/**
 * Provider configuration
 */
export interface LLMProviderConfig {
  name: LLMProviderName;
  apiKey: string;
  enabled: boolean;
  priority: number; // Lower = higher priority
  model?: string;
  baseUrl?: string;
  timeout?: number;
}

/**
 * Provider status
 */
export interface LLMProviderStatus {
  name: LLMProviderName;
  available: boolean;
  enabled: boolean;
  model: string;
  lastError?: string;
  lastErrorAt?: Date;
}

/**
 * Provider metrics
 */
export interface LLMProviderMetrics {
  requests: number;
  successes: number;
  failures: number;
  totalTokens: number;
  averageLatencyMs: number;
}

/**
 * LLM Provider interface
 * Implementations must provide generation and availability checking
 */
export interface LLMProvider {
  readonly name: LLMProviderName;
  readonly model: string;

  /**
   * Generate a completion
   */
  generate(options: LLMGenerateOptions): Promise<LLMGenerateResult>;

  /**
   * Check if the provider is available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get provider status
   */
  getStatus(): LLMProviderStatus;
}

/**
 * LLM Service configuration
 */
export interface LLMServiceConfig {
  providers: LLMProviderConfig[];
  defaultTemperature: number;
  defaultMaxTokens: number;
  maxRetries: number;
  retryDelayMs: number;
  circuitBreakerThreshold: number;
  circuitBreakerResetMs: number;
}

/**
 * LLM Service interface for dependency injection
 */
export interface LLMService {
  /**
   * Generate a completion using configured providers
   */
  generate(options: LLMGenerateOptions): Promise<LLMGenerateResult>;

  /**
   * Get status of all providers
   */
  getProvidersStatus(): LLMProviderStatus[];

  /**
   * Get metrics for all providers
   */
  getMetrics(): Map<string, LLMProviderMetrics>;

  /**
   * Check if any provider is available
   */
  isAvailable(): Promise<boolean>;
}

/**
 * LLM error codes
 */
export enum LLMErrorCode {
  // Provider errors
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  PROVIDER_AUTH_ERROR = 'PROVIDER_AUTH_ERROR',
  PROVIDER_RATE_LIMIT = 'PROVIDER_RATE_LIMIT',
  PROVIDER_API_ERROR = 'PROVIDER_API_ERROR',
  PROVIDER_TIMEOUT = 'PROVIDER_TIMEOUT',

  // Service errors
  ALL_PROVIDERS_FAILED = 'ALL_PROVIDERS_FAILED',
  NO_PROVIDERS_CONFIGURED = 'NO_PROVIDERS_CONFIGURED',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  JSON_PARSE_ERROR = 'JSON_PARSE_ERROR',

  // Content errors
  CONTENT_FILTERED = 'CONTENT_FILTERED',
  MAX_TOKENS_EXCEEDED = 'MAX_TOKENS_EXCEEDED',
}

/**
 * LLM Error class
 */
export class LLMError extends Error {
  constructor(
    message: string,
    public provider: LLMProviderName | 'service',
    public code: LLMErrorCode,
    public retriable: boolean = true,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'LLMError';
  }

  /**
   * Create from HTTP status code
   */
  static fromHttpStatus(
    status: number,
    provider: LLMProviderName,
    message?: string
  ): LLMError {
    switch (status) {
      case 401:
      case 403:
        return new LLMError(
          message || 'Authentication failed',
          provider,
          LLMErrorCode.PROVIDER_AUTH_ERROR,
          false,
          status
        );
      case 429:
        return new LLMError(
          message || 'Rate limit exceeded',
          provider,
          LLMErrorCode.PROVIDER_RATE_LIMIT,
          true,
          status
        );
      case 500:
      case 502:
      case 503:
        return new LLMError(
          message || 'Provider API error',
          provider,
          LLMErrorCode.PROVIDER_API_ERROR,
          true,
          status
        );
      default:
        return new LLMError(
          message || `HTTP ${status} error`,
          provider,
          LLMErrorCode.PROVIDER_API_ERROR,
          status >= 500,
          status
        );
    }
  }
}

/**
 * Service events for event emitter
 */
export interface LLMServiceEvents {
  'provider:start': { provider: LLMProviderName; options: LLMGenerateOptions };
  'provider:success': { provider: LLMProviderName; result: LLMGenerateResult };
  'provider:error': { provider: LLMProviderName; error: Error };
  'provider:skipped': { provider: LLMProviderName; reason: string };
  'circuit:open': { provider: LLMProviderName; failures: number };
  'circuit:close': { provider: LLMProviderName };
}
