/**
 * @social-content/agents
 * Core agent implementations
 */

export * from './agents';

// Export services but handle LLM type conflicts
// The qa-analyst also exports LLM types (simple interfaces)
// The services/llm exports the full implementation
export * from './services/sources';

export * from './services/search';
export * from './services/extractors';
export * from './services/ranking';
export * from './services/aggregator';
export * from './services/image-gen';
export * from './services/template-engine';
export * from './services/syntax-highlighter';
export * from './services/renderer';
export * from './services/cleanup';
export * from './services/quality-gate';

// LLM Service - Full implementation (these types supersede qa-analyst LLM types)
export {
  // Types (re-export with explicit names)
  type LLMProviderName,
  type LLMMessageRole,
  type LLMTokenUsage,
  type LLMProviderConfig,
  type LLMProviderStatus,
  type LLMProviderMetrics,
  type LLMProvider,
  type LLMServiceConfig,
  type LLMServiceEvents,
  // Error types
  LLMError,
  LLMErrorCode,
  // Service implementation
  LLMServiceImpl,
  // Factory functions
  createLLMService,
  createLLMServiceFromEnv,
  getDefaultLLMConfig,
  // Providers
  GroqProvider,
  createGroqProvider,
} from './services/llm';

export * from './orchestrator';
