/**
 * CarouselBuilder Factory
 * Story 3.5 - Agente Carousel Builder
 *
 * Factory function for creating configured CarouselBuilderAgent instances.
 * Handles configuration validation and default value merging.
 */

import { CarouselBuilderAgent } from './carousel-builder-agent';
import type { CarouselConfig, RendererService } from './types';

/**
 * Default configuration for the CarouselBuilder agent
 */
const DEFAULT_CONFIG: CarouselConfig = {
  outputBaseDir: 'output/posts',
  dimensions: {
    width: 1080,
    height: 1080,
  },
  maxSlides: 10,
  overlayOpacity: 0.6,
  codeTheme: 'dracula',
  defaultCtaText: 'Siga para mais conteudo!',
  fonts: {
    title: 'Inter',
    body: 'Inter',
    code: 'JetBrains Mono',
  },
};

/**
 * Instagram's maximum carousel slide count
 */
const INSTAGRAM_MAX_SLIDES = 10;

/**
 * Minimum supported slide dimensions
 */
const MIN_DIMENSIONS = 500;

/**
 * Validates the carousel configuration.
 *
 * @param config - Configuration to validate
 * @throws Error if configuration is invalid
 */
function validateConfig(config: CarouselConfig): void {
  // Validate maxSlides
  if (config.maxSlides < 2 || config.maxSlides > INSTAGRAM_MAX_SLIDES) {
    throw new Error(
      `maxSlides must be between 2 and ${INSTAGRAM_MAX_SLIDES}`
    );
  }

  // Validate dimensions
  if (
    config.dimensions.width < MIN_DIMENSIONS ||
    config.dimensions.height < MIN_DIMENSIONS
  ) {
    throw new Error(
      `Dimensions must be at least ${MIN_DIMENSIONS}x${MIN_DIMENSIONS}`
    );
  }

  // Validate overlay opacity
  if (config.overlayOpacity < 0 || config.overlayOpacity > 1) {
    throw new Error('overlayOpacity must be between 0 and 1');
  }

  // Validate outputBaseDir
  if (!config.outputBaseDir || typeof config.outputBaseDir !== 'string') {
    throw new Error('outputBaseDir must be a non-empty string');
  }

  // Validate codeTheme
  const validThemes = ['dracula', 'one-dark-pro', 'github-dark'];
  if (!validThemes.includes(config.codeTheme)) {
    throw new Error(
      `codeTheme must be one of: ${validThemes.join(', ')}`
    );
  }

  // Validate defaultCtaText
  if (!config.defaultCtaText || typeof config.defaultCtaText !== 'string') {
    throw new Error('defaultCtaText must be a non-empty string');
  }

  // Validate fonts
  if (!config.fonts || typeof config.fonts !== 'object') {
    throw new Error('fonts configuration is required');
  }

  if (!config.fonts.title || !config.fonts.body || !config.fonts.code) {
    throw new Error('fonts must include title, body, and code');
  }
}

/**
 * Creates a new CarouselBuilderAgent instance.
 *
 * @param renderer - RendererService for rendering slides to images
 * @param config - Optional configuration overrides
 * @returns Configured CarouselBuilderAgent instance
 *
 * @throws Error if configuration is invalid
 *
 * @example
 * ```typescript
 * const agent = createCarouselBuilderAgent(renderer, {
 *   maxSlides: 5,
 *   codeTheme: 'github-dark'
 * });
 * ```
 */
export function createCarouselBuilderAgent(
  renderer: RendererService,
  config?: Partial<CarouselConfig>
): CarouselBuilderAgent {
  // Merge with defaults (deep merge for nested objects)
  const mergedConfig: CarouselConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    dimensions: {
      ...DEFAULT_CONFIG.dimensions,
      ...config?.dimensions,
    },
    fonts: {
      ...DEFAULT_CONFIG.fonts,
      ...config?.fonts,
    },
  };

  // Validate the merged configuration
  validateConfig(mergedConfig);

  return new CarouselBuilderAgent(mergedConfig, renderer);
}

/**
 * Gets the default configuration.
 *
 * @returns Copy of the default configuration object
 */
export function getDefaultConfig(): CarouselConfig {
  return {
    ...DEFAULT_CONFIG,
    dimensions: { ...DEFAULT_CONFIG.dimensions },
    fonts: { ...DEFAULT_CONFIG.fonts },
  };
}

/**
 * Creates a mock RendererService for testing.
 *
 * @returns Mock RendererService that returns fake image buffers
 */
export function createMockRenderer(): RendererService {
  return {
    renderToImage: async () => {
      // Return a minimal valid PNG buffer for testing
      // PNG header + IHDR + IEND chunks
      return Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
        0x00, 0x00, 0x00, 0x0d, // IHDR length
        0x49, 0x48, 0x44, 0x52, // IHDR
        0x00, 0x00, 0x00, 0x01, // width: 1
        0x00, 0x00, 0x00, 0x01, // height: 1
        0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, etc.
        0x90, 0x77, 0x53, 0xde, // CRC
        0x00, 0x00, 0x00, 0x0c, // IDAT length
        0x49, 0x44, 0x41, 0x54, // IDAT
        0x08, 0xd7, 0x63, 0xf8, 0x00, 0x00, 0x00, 0x01, // compressed data
        0x00, 0x01, 0x44, 0x72, 0xe5, 0x80, // CRC
        0x00, 0x00, 0x00, 0x00, // IEND length
        0x49, 0x45, 0x4e, 0x44, // IEND
        0xae, 0x42, 0x60, 0x82, // CRC
      ]);
    },
  };
}

/**
 * Validates partial configuration for use with merge.
 *
 * @param config - Partial configuration to validate
 * @throws Error if any provided values are invalid
 */
export function validatePartialConfig(config: Partial<CarouselConfig>): void {
  if (config.maxSlides !== undefined) {
    if (config.maxSlides < 2 || config.maxSlides > INSTAGRAM_MAX_SLIDES) {
      throw new Error(
        `maxSlides must be between 2 and ${INSTAGRAM_MAX_SLIDES}`
      );
    }
  }

  if (config.dimensions !== undefined) {
    if (config.dimensions.width !== undefined && config.dimensions.width < MIN_DIMENSIONS) {
      throw new Error(`dimensions.width must be at least ${MIN_DIMENSIONS}`);
    }
    if (config.dimensions.height !== undefined && config.dimensions.height < MIN_DIMENSIONS) {
      throw new Error(`dimensions.height must be at least ${MIN_DIMENSIONS}`);
    }
  }

  if (config.overlayOpacity !== undefined) {
    if (config.overlayOpacity < 0 || config.overlayOpacity > 1) {
      throw new Error('overlayOpacity must be between 0 and 1');
    }
  }

  if (config.codeTheme !== undefined) {
    const validThemes = ['dracula', 'one-dark-pro', 'github-dark'];
    if (!validThemes.includes(config.codeTheme)) {
      throw new Error(`codeTheme must be one of: ${validThemes.join(', ')}`);
    }
  }
}
