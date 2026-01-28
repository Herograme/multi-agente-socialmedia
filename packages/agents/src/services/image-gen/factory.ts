/**
 * ImageGenService factory
 * Creates configured ImageGenService instances
 */

import { createLogger } from '@social-content/shared';
import { ImageGenService } from './image-gen-service';
import type { ImageGenConfig, ImageProvider, ImageProviderConfig } from './types';
import { ImageStyle, AspectRatio, ImageGenError, ImageGenErrorCode } from './types';
import { createIdeogramProvider } from './providers/ideogram-provider';
import { createLeonardoProvider } from './providers/leonardo-provider';

const logger = createLogger('image-gen:factory');

/**
 * Default configuration for ImageGenService
 */
const DEFAULT_CONFIG: ImageGenConfig = {
  providers: [],
  defaultStyle: ImageStyle.TECH,
  defaultAspectRatio: AspectRatio.SQUARE,
  defaultOutputDir: './output/images',
  maxRetries: 3,
  circuitBreakerThreshold: 5,
  circuitBreakerResetMs: 60000, // 1 minute
};

/**
 * Create an ImageGenService with the specified configuration
 *
 * @example
 * ```typescript
 * const service = createImageGenService({
 *   providers: [
 *     { name: 'ideogram', apiKey: process.env.IDEOGRAM_API_KEY!, enabled: true, priority: 1 },
 *     { name: 'leonardo', apiKey: process.env.LEONARDO_API_KEY!, enabled: true, priority: 2 }
 *   ],
 *   defaultStyle: ImageStyle.TECH,
 *   defaultAspectRatio: AspectRatio.LANDSCAPE
 * });
 *
 * const image = await service.generate({ prompt: 'A futuristic cityscape' });
 * ```
 *
 * @param config - Partial configuration to merge with defaults
 * @returns Configured ImageGenService instance
 * @throws ImageGenError if configuration is invalid
 */
export function createImageGenService(config?: Partial<ImageGenConfig>): ImageGenService {
  const mergedConfig: ImageGenConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    providers: config?.providers ?? DEFAULT_CONFIG.providers,
  };

  // Validate configuration
  validateConfig(mergedConfig);

  // Create provider instances
  const providers = createProviders(mergedConfig.providers);

  if (providers.length === 0) {
    throw new ImageGenError(
      'At least one image provider must be enabled',
      'factory',
      ImageGenErrorCode.INVALID_CONFIG,
      false
    );
  }

  logger.info('Creating ImageGenService', {
    providers: providers.map((p) => p.name),
    defaultStyle: mergedConfig.defaultStyle,
    defaultAspectRatio: mergedConfig.defaultAspectRatio,
  });

  return new ImageGenService(providers, mergedConfig);
}

/**
 * Validate the configuration
 */
function validateConfig(config: ImageGenConfig): void {
  if (config.maxRetries < 1) {
    throw new ImageGenError(
      'maxRetries must be at least 1',
      'factory',
      ImageGenErrorCode.INVALID_CONFIG,
      false
    );
  }

  if (config.circuitBreakerThreshold < 1) {
    throw new ImageGenError(
      'circuitBreakerThreshold must be at least 1',
      'factory',
      ImageGenErrorCode.INVALID_CONFIG,
      false
    );
  }

  if (config.circuitBreakerResetMs < 1000) {
    throw new ImageGenError(
      'circuitBreakerResetMs must be at least 1000ms',
      'factory',
      ImageGenErrorCode.INVALID_CONFIG,
      false
    );
  }

  // Validate each provider config
  for (const providerConfig of config.providers) {
    if (providerConfig.enabled && !providerConfig.apiKey) {
      throw new ImageGenError(
        `API key required for enabled provider: ${providerConfig.name}`,
        'factory',
        ImageGenErrorCode.INVALID_CONFIG,
        false
      );
    }

    if (providerConfig.priority < 0) {
      throw new ImageGenError(
        `Invalid priority for provider ${providerConfig.name}: must be >= 0`,
        'factory',
        ImageGenErrorCode.INVALID_CONFIG,
        false
      );
    }
  }

  logger.debug('Configuration validated', {
    providerCount: config.providers.length,
    enabledCount: config.providers.filter((p) => p.enabled).length,
  });
}

/**
 * Create provider instances from configuration
 */
function createProviders(providerConfigs: ImageProviderConfig[]): ImageProvider[] {
  const providers: ImageProvider[] = [];

  // Filter enabled providers and sort by priority
  const enabledProviders = providerConfigs.filter((p) => p.enabled).sort((a, b) => a.priority - b.priority);

  for (const providerConfig of enabledProviders) {
    try {
      const provider = createProvider(providerConfig);
      if (provider) {
        providers.push(provider);
        logger.debug('Provider created', {
          name: providerConfig.name,
          priority: providerConfig.priority,
        });
      }
    } catch (error) {
      logger.error('Failed to create provider', {
        name: providerConfig.name,
        error: (error as Error).message,
      });
    }
  }

  return providers;
}

/**
 * Create a single provider instance from configuration
 */
function createProvider(config: ImageProviderConfig): ImageProvider | null {
  switch (config.name) {
    case 'ideogram':
      return createIdeogramProvider({
        apiKey: config.apiKey,
        rateLimits: config.rateLimits,
      });

    case 'leonardo':
      return createLeonardoProvider({
        apiKey: config.apiKey,
        rateLimits: config.rateLimits,
      });

    default:
      logger.warn('Unknown provider type', { name: config.name });
      return null;
  }
}

/**
 * Create ImageGenService from environment variables
 * Convenience function that reads API keys from standard env vars
 *
 * @example
 * ```typescript
 * // Reads IDEOGRAM_API_KEY and LEONARDO_API_KEY from environment
 * const service = createImageGenServiceFromEnv();
 * ```
 */
export function createImageGenServiceFromEnv(
  configOverrides?: Partial<Omit<ImageGenConfig, 'providers'>>
): ImageGenService {
  const providers: ImageProviderConfig[] = [];

  // Check for Ideogram API key
  const ideogramKey = process.env.IDEOGRAM_API_KEY;
  if (ideogramKey) {
    providers.push({
      name: 'ideogram',
      apiKey: ideogramKey,
      enabled: true,
      priority: 1,
    });
  }

  // Check for Leonardo API key
  const leonardoKey = process.env.LEONARDO_API_KEY;
  if (leonardoKey) {
    providers.push({
      name: 'leonardo',
      apiKey: leonardoKey,
      enabled: true,
      priority: 2,
    });
  }

  if (providers.length === 0) {
    throw new ImageGenError(
      'No image provider API keys found in environment. Set IDEOGRAM_API_KEY or LEONARDO_API_KEY.',
      'factory',
      ImageGenErrorCode.INVALID_CONFIG,
      false
    );
  }

  logger.info('Creating ImageGenService from environment', {
    providers: providers.map((p) => p.name),
  });

  return createImageGenService({
    ...configOverrides,
    providers,
  });
}

/**
 * Get default configuration for reference
 */
export function getDefaultConfig(): ImageGenConfig {
  return { ...DEFAULT_CONFIG };
}
