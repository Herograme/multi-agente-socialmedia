/**
 * LLM Service barrel exports
 */

// Types
export type {
  LLMProviderName,
  LLMMessageRole,
  LLMMessage,
  LLMGenerateOptions,
  LLMTokenUsage,
  LLMGenerateResult,
  LLMProviderConfig,
  LLMProviderStatus,
  LLMProviderMetrics,
  LLMProvider,
  LLMServiceConfig,
  LLMService,
  LLMServiceEvents,
} from './types';

export { LLMError, LLMErrorCode } from './types';

// Service implementation
export { LLMServiceImpl } from './llm-service';

// Factory functions
export {
  createLLMService,
  createLLMServiceFromEnv,
  getDefaultLLMConfig,
} from './factory';

// Providers
export { GroqProvider, createGroqProvider } from './providers';
