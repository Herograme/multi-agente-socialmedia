/**
 * Groq LLM Provider
 * Uses Groq's fast inference API with Llama models
 */

import { createLogger } from '@social-content/shared';
import type {
  LLMProvider,
  LLMProviderStatus,
  LLMGenerateOptions,
  LLMGenerateResult,
  LLMProviderConfig,
} from '../types';
import { LLMError, LLMErrorCode } from '../types';

const logger = createLogger('llm:groq');

/**
 * Groq API response types
 */
interface GroqChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqChatChoice {
  index: number;
  message: GroqChatMessage;
  finish_reason: 'stop' | 'length' | 'content_filter';
}

interface GroqUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface GroqChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: GroqChatChoice[];
  usage: GroqUsage;
}

interface GroqErrorResponse {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

/**
 * Default configuration values
 */
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const DEFAULT_BASE_URL = 'https://api.groq.com/openai/v1';
const DEFAULT_TIMEOUT = 60000;

/**
 * Groq LLM Provider implementation
 */
export class GroqProvider implements LLMProvider {
  readonly name = 'groq' as const;
  readonly model: string;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private lastError?: string;
  private lastErrorAt?: Date;
  private enabled: boolean;

  constructor(config: LLMProviderConfig) {
    if (config.name !== 'groq') {
      throw new Error('GroqProvider requires config.name to be "groq"');
    }

    this.apiKey = config.apiKey;
    this.model = config.model || DEFAULT_MODEL;
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
    this.enabled = config.enabled;

    logger.info('GroqProvider initialized', {
      model: this.model,
      baseUrl: this.baseUrl,
    });
  }

  /**
   * Generate a completion using Groq API
   */
  async generate(options: LLMGenerateOptions): Promise<LLMGenerateResult> {
    const model = options.model || this.model;
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 2048;

    logger.debug('Starting generation', {
      model,
      temperature,
      maxTokens,
      messageCount: options.messages.length,
    });

    const requestBody: Record<string, unknown> = {
      model,
      messages: options.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature,
      max_tokens: maxTokens,
    };

    // Add JSON mode if requested
    if (options.responseFormat === 'json') {
      requestBody.response_format = { type: 'json_object' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => ({
          error: { message: 'Unknown error' },
        }))) as GroqErrorResponse;

        this.lastError = errorBody.error?.message || `HTTP ${response.status}`;
        this.lastErrorAt = new Date();

        throw LLMError.fromHttpStatus(
          response.status,
          'groq',
          errorBody.error?.message
        );
      }

      const data = (await response.json()) as GroqChatResponse;

      if (!data.choices || data.choices.length === 0) {
        throw new LLMError(
          'No completion choices in response',
          'groq',
          LLMErrorCode.INVALID_RESPONSE,
          false
        );
      }

      const choice = data.choices[0];
      if (!choice) {
        throw new LLMError(
          'Empty choice in response',
          'groq',
          LLMErrorCode.INVALID_RESPONSE,
          false
        );
      }

      // Clear error state on success
      this.lastError = undefined;
      this.lastErrorAt = undefined;

      logger.debug('Generation completed', {
        model: data.model,
        finishReason: choice.finish_reason,
        tokens: data.usage?.total_tokens,
      });

      return {
        content: choice.message.content,
        provider: 'groq',
        model: data.model,
        usage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens,
              completionTokens: data.usage.completion_tokens,
              totalTokens: data.usage.total_tokens,
            }
          : undefined,
        finishReason: choice.finish_reason,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof LLMError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        this.lastError = 'Request timeout';
        this.lastErrorAt = new Date();

        throw new LLMError(
          `Request timed out after ${this.timeout}ms`,
          'groq',
          LLMErrorCode.PROVIDER_TIMEOUT,
          true
        );
      }

      const message =
        error instanceof Error ? error.message : 'Unknown error';
      this.lastError = message;
      this.lastErrorAt = new Date();

      throw new LLMError(message, 'groq', LLMErrorCode.PROVIDER_API_ERROR, true);
    }
  }

  /**
   * Check if the provider is available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    if (!this.apiKey) {
      logger.debug('Groq provider unavailable: no API key');
      return false;
    }

    // Simple check - assume available if we have an API key
    // Could add a lightweight health check endpoint call here
    return true;
  }

  /**
   * Get provider status
   */
  getStatus(): LLMProviderStatus {
    return {
      name: 'groq',
      available: this.enabled && !!this.apiKey,
      enabled: this.enabled,
      model: this.model,
      lastError: this.lastError,
      lastErrorAt: this.lastErrorAt,
    };
  }
}

/**
 * Create a Groq provider from environment variables
 */
export function createGroqProvider(
  overrides?: Partial<LLMProviderConfig>
): GroqProvider | null {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    logger.warn('GROQ_API_KEY not set, Groq provider unavailable');
    return null;
  }

  return new GroqProvider({
    name: 'groq',
    apiKey,
    enabled: true,
    priority: 1,
    model: DEFAULT_MODEL,
    ...overrides,
  });
}
