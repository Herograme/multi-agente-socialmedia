/**
 * LLM Service Factory
 * Factory functions to create LLM service instances
 */

import { createLogger } from '@social-content/shared';
import { LLMServiceImpl } from './llm-service';
import { GroqProvider } from './providers/groq-provider';
import { createGroqProvider } from './providers';
import type {
  LLMService,
  LLMServiceConfig,
  LLMProviderConfig,
  LLMProvider,
} from './types';
import { LLMError, LLMErrorCode } from './types';

const logger = createLogger('llm:factory');

/**
 * Default service configuration
 */
const DEFAULT_CONFIG: LLMServiceConfig = {
  providers: [],
  defaultTemperature: 0.7,
  defaultMaxTokens: 2048,
  maxRetries: 3,
  retryDelayMs: 1000,
  circuitBreakerThreshold: 3,
  circuitBreakerResetMs: 60000, // 1 minute
};

/**
 * Create an LLM service from explicit provider configurations
 *
 * @param providerConfigs - Array of provider configurations
 * @param configOverrides - Service configuration overrides
 * @returns Configured LLM service
 */
export function createLLMService(
  providerConfigs: LLMProviderConfig[],
  configOverrides?: Partial<Omit<LLMServiceConfig, 'providers'>>
): LLMService {
  const config: LLMServiceConfig = {
    ...DEFAULT_CONFIG,
    ...configOverrides,
    providers: providerConfigs,
  };

  const providers: LLMProvider[] = [];

  for (const providerConfig of providerConfigs) {
    if (!providerConfig.enabled) {
      logger.debug('Skipping disabled provider', { name: providerConfig.name });
      continue;
    }

    switch (providerConfig.name) {
      case 'groq': {
        providers.push(new GroqProvider(providerConfig));
        break;
      }
      default:
        logger.warn('Unknown provider, skipping', { name: providerConfig.name });
    }
  }

  if (providers.length === 0) {
    throw new LLMError(
      'No LLM providers configured',
      'service',
      LLMErrorCode.NO_PROVIDERS_CONFIGURED,
      false
    );
  }

  logger.info('LLM service created', {
    providers: providers.map((p) => p.name),
  });

  return new LLMServiceImpl(providers, config);
}

/**
 * Create an LLM service from environment variables
 * Automatically detects available providers based on API keys
 *
 * @param configOverrides - Service configuration overrides
 * @returns Configured LLM service or null if no providers available
 */
export function createLLMServiceFromEnv(
  configOverrides?: Partial<Omit<LLMServiceConfig, 'providers'>>
): LLMService | null {
  const providers: LLMProvider[] = [];
  const providerConfigs: LLMProviderConfig[] = [];

  // Try to create Groq provider
  const groqProvider = createGroqProvider();
  if (groqProvider) {
    providers.push(groqProvider);
    providerConfigs.push({
      name: 'groq',
      apiKey: process.env.GROQ_API_KEY!,
      enabled: true,
      priority: 1,
    });
    logger.info('Groq provider available');
  }

  if (providers.length === 0) {
    logger.warn('No LLM providers available. Set GROQ_API_KEY environment variable.');
    return null;
  }

  const config: LLMServiceConfig = {
    ...DEFAULT_CONFIG,
    ...configOverrides,
    providers: providerConfigs,
  };

  logger.info('LLM service created from environment', {
    providers: providers.map((p) => p.name),
  });

  return new LLMServiceImpl(providers, config);
}

/**
 * Get default service configuration
 */
export function getDefaultLLMConfig(): LLMServiceConfig {
  return { ...DEFAULT_CONFIG };
}
