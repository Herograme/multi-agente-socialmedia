/**
 * Factory function for PDFMakerAgent
 */

import { PDFMakerAgent } from './pdf-maker-agent';
import type { PDFMakerConfig, CompressionLevel } from './types';

/**
 * Default configuration for PDFMakerAgent
 * Optimized for LinkedIn carousel PDFs (mobile viewing)
 */
const DEFAULT_CONFIG: PDFMakerConfig = {
  outputDir: './output',
  defaultAuthor: 'Social Content Agent',
  compression: 'medium',
  dimensions: {
    width: 1080, // Optimized for mobile/Instagram
    height: 1350, // Aspect ratio 4:5 for better viewing
  },
  margin: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
};

/**
 * Valid compression levels
 */
const VALID_COMPRESSIONS: CompressionLevel[] = ['none', 'low', 'medium', 'high'];

/**
 * Validates the complete configuration
 * @param config - Configuration to validate
 * @throws Error if validation fails
 */
function validateConfig(config: PDFMakerConfig): void {
  // Validate outputDir
  if (!config.outputDir || typeof config.outputDir !== 'string') {
    throw new Error('outputDir is required and must be a string');
  }

  // Validate defaultAuthor
  if (!config.defaultAuthor || typeof config.defaultAuthor !== 'string') {
    throw new Error('defaultAuthor is required and must be a string');
  }

  // Validate compression
  if (!VALID_COMPRESSIONS.includes(config.compression)) {
    throw new Error(
      `compression must be one of: ${VALID_COMPRESSIONS.join(', ')}`
    );
  }

  // Validate dimensions
  if (!config.dimensions) {
    throw new Error('dimensions is required');
  }

  if (
    typeof config.dimensions.width !== 'number' ||
    config.dimensions.width < 100 ||
    config.dimensions.width > 4096
  ) {
    throw new Error('dimensions.width must be a number between 100 and 4096');
  }

  if (
    typeof config.dimensions.height !== 'number' ||
    config.dimensions.height < 100 ||
    config.dimensions.height > 4096
  ) {
    throw new Error('dimensions.height must be a number between 100 and 4096');
  }

  // Validate margin
  if (!config.margin) {
    throw new Error('margin is required');
  }

  const marginKeys = ['top', 'bottom', 'left', 'right'] as const;
  for (const key of marginKeys) {
    if (typeof config.margin[key] !== 'number' || config.margin[key] < 0) {
      throw new Error(`margin.${key} must be a non-negative number`);
    }
  }
}

/**
 * Validates a partial configuration
 * @param config - Partial configuration to validate
 * @returns True if valid
 * @throws Error if validation fails
 */
export function validatePartialConfig(
  config: Partial<PDFMakerConfig>
): boolean {
  // Validate outputDir if provided
  if (config.outputDir !== undefined) {
    if (!config.outputDir || typeof config.outputDir !== 'string') {
      throw new Error('outputDir must be a non-empty string');
    }
  }

  // Validate defaultAuthor if provided
  if (config.defaultAuthor !== undefined) {
    if (typeof config.defaultAuthor !== 'string') {
      throw new Error('defaultAuthor must be a string');
    }
  }

  // Validate compression if provided
  if (config.compression !== undefined) {
    if (!VALID_COMPRESSIONS.includes(config.compression)) {
      throw new Error(
        `compression must be one of: ${VALID_COMPRESSIONS.join(', ')}`
      );
    }
  }

  // Validate dimensions if provided
  if (config.dimensions !== undefined) {
    if (config.dimensions.width !== undefined) {
      if (
        typeof config.dimensions.width !== 'number' ||
        config.dimensions.width < 100 ||
        config.dimensions.width > 4096
      ) {
        throw new Error(
          'dimensions.width must be a number between 100 and 4096'
        );
      }
    }
    if (config.dimensions.height !== undefined) {
      if (
        typeof config.dimensions.height !== 'number' ||
        config.dimensions.height < 100 ||
        config.dimensions.height > 4096
      ) {
        throw new Error(
          'dimensions.height must be a number between 100 and 4096'
        );
      }
    }
  }

  // Validate margin if provided
  if (config.margin !== undefined) {
    const marginKeys = ['top', 'bottom', 'left', 'right'] as const;
    for (const key of marginKeys) {
      if (config.margin[key] !== undefined) {
        if (
          typeof config.margin[key] !== 'number' ||
          config.margin[key] < 0
        ) {
          throw new Error(`margin.${key} must be a non-negative number`);
        }
      }
    }
  }

  return true;
}

/**
 * Creates a new PDFMakerAgent instance
 * @param config - Partial configuration (will be merged with defaults)
 * @returns Configured PDFMakerAgent instance
 */
export function createPDFMakerAgent(
  config?: Partial<PDFMakerConfig>
): PDFMakerAgent {
  // Validate partial config before merging
  if (config) {
    validatePartialConfig(config);
  }

  const mergedConfig: PDFMakerConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    dimensions: {
      ...DEFAULT_CONFIG.dimensions,
      ...config?.dimensions,
    },
    margin: {
      ...DEFAULT_CONFIG.margin,
      ...config?.margin,
    },
  };

  // Validate the complete merged config
  validateConfig(mergedConfig);

  return new PDFMakerAgent(mergedConfig);
}

/**
 * Gets the default configuration
 * @returns A copy of the default configuration
 */
export function getDefaultConfig(): PDFMakerConfig {
  return {
    ...DEFAULT_CONFIG,
    dimensions: { ...DEFAULT_CONFIG.dimensions },
    margin: { ...DEFAULT_CONFIG.margin },
  };
}
