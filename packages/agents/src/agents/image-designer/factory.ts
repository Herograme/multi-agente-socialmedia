/**
 * Factory function for ImageDesignerAgent
 */

import { ImageDesignerAgent } from './image-designer-agent';
import type { ImageDesignerConfig } from './types';
import { ImageStyle } from '../../services/image-gen';
import type { ImageGenService } from '../../services/image-gen';

/**
 * Default configuration for ImageDesignerAgent
 */
const DEFAULT_CONFIG: ImageDesignerConfig = {
  outputDir: 'output/images',
  minWidth: 1080,
  minHeight: 1080,
  maxRetries: 3,
  defaultStyle: ImageStyle.ABSTRACT,
  allowedFormats: ['png', 'jpg', 'webp'],
};

/**
 * Validate ImageDesignerConfig
 *
 * @param config - Configuration to validate
 * @throws Error if configuration is invalid
 */
function validateConfig(config: ImageDesignerConfig): void {
  // Validate minWidth
  if (typeof config.minWidth !== 'number' || config.minWidth < 100) {
    throw new Error('minWidth must be at least 100 pixels');
  }

  // Validate minHeight
  if (typeof config.minHeight !== 'number' || config.minHeight < 100) {
    throw new Error('minHeight must be at least 100 pixels');
  }

  // Validate maxRetries
  if (typeof config.maxRetries !== 'number' || config.maxRetries < 0) {
    throw new Error('maxRetries must be non-negative');
  }

  if (config.maxRetries > 10) {
    throw new Error('maxRetries must not exceed 10');
  }

  // Validate outputDir
  if (!config.outputDir || typeof config.outputDir !== 'string' || config.outputDir.trim() === '') {
    throw new Error('outputDir must be specified');
  }

  // Validate allowedFormats
  if (!Array.isArray(config.allowedFormats) || config.allowedFormats.length === 0) {
    throw new Error('At least one allowed format must be specified');
  }

  const validFormats = ['png', 'jpg', 'webp'];
  for (const format of config.allowedFormats) {
    if (!validFormats.includes(format)) {
      throw new Error(`Invalid format '${format}'. Allowed: ${validFormats.join(', ')}`);
    }
  }

  // Validate defaultStyle
  const validStyles = Object.values(ImageStyle);
  if (!validStyles.includes(config.defaultStyle)) {
    throw new Error(`Invalid defaultStyle '${config.defaultStyle}'. Allowed: ${validStyles.join(', ')}`);
  }
}

/**
 * Create a new ImageDesignerAgent instance
 *
 * @param config - Partial configuration (will be merged with defaults)
 * @param imageGenService - Optional ImageGenService instance
 * @returns Configured ImageDesignerAgent instance
 *
 * @example
 * ```typescript
 * // Create with defaults
 * const agent = createImageDesignerAgent();
 *
 * // Create with custom config
 * const agent = createImageDesignerAgent({
 *   minWidth: 1200,
 *   minHeight: 1200,
 *   maxRetries: 5
 * });
 *
 * // Create with ImageGenService
 * const agent = createImageDesignerAgent({}, imageGenService);
 * ```
 */
export function createImageDesignerAgent(
  config?: Partial<ImageDesignerConfig>,
  imageGenService?: ImageGenService
): ImageDesignerAgent {
  const mergedConfig: ImageDesignerConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    // Ensure arrays are properly merged (not replaced with undefined)
    allowedFormats: config?.allowedFormats ?? DEFAULT_CONFIG.allowedFormats,
  };

  validateConfig(mergedConfig);

  return new ImageDesignerAgent(mergedConfig, imageGenService);
}

/**
 * Get the default configuration
 *
 * @returns A copy of the default configuration
 */
export function getDefaultConfig(): ImageDesignerConfig {
  return { ...DEFAULT_CONFIG };
}

/**
 * Validate a partial configuration (useful for pre-validation)
 *
 * @param config - Partial configuration to validate
 * @returns true if valid
 * @throws Error if invalid
 */
export function validatePartialConfig(config: Partial<ImageDesignerConfig>): boolean {
  const mergedConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    allowedFormats: config?.allowedFormats ?? DEFAULT_CONFIG.allowedFormats,
  };

  validateConfig(mergedConfig);
  return true;
}
