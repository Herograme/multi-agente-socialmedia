/**
 * QA Analyst Factory
 * Story 4.3 - Agente QA Analyst - Analise de Imagens
 *
 * Factory function for creating configured QAAnalystAgent instances.
 * Handles configuration validation and default value merging.
 */

import { QAAnalystAgent } from './qa-analyst-agent';
import type {
  QAAnalystVisualConfig,
  HeuristicAnalysisConfig,
  MultimodalAnalysisConfig,
} from './visual-types';
import {
  DEFAULT_QA_VISUAL_CONFIG,
  DEFAULT_HEURISTIC_CONFIG,
} from './visual-types';

/**
 * Validates the QA Analyst configuration
 *
 * @param config - Configuration to validate
 * @throws Error if configuration is invalid
 */
function validateConfig(config: QAAnalystVisualConfig): void {
  // Validate threshold
  if (config.threshold < 0 || config.threshold > 10) {
    throw new Error('threshold must be between 0 and 10');
  }

  // Validate contrast ratio
  if (config.minContrastRatio < 1 || config.minContrastRatio > 21) {
    throw new Error('minContrastRatio must be between 1 and 21');
  }

  // Validate weights
  if (config.visualWeight < 0 || config.visualWeight > 1) {
    throw new Error('visualWeight must be between 0 and 1');
  }

  if (config.textWeight < 0 || config.textWeight > 1) {
    throw new Error('textWeight must be between 0 and 1');
  }

  // Validate that weights sum to approximately 1
  const totalWeight = config.visualWeight + config.textWeight;
  if (Math.abs(totalWeight - 1) > 0.01) {
    throw new Error(`visualWeight + textWeight must equal 1 (got ${totalWeight})`);
  }

  // Validate heuristic config if provided
  if (config.heuristic) {
    validateHeuristicConfig(config.heuristic);
  }

  // Validate multimodal config if provided
  if (config.multimodal) {
    validateMultimodalConfig(config.multimodal);
  }
}

/**
 * Validates heuristic configuration
 */
function validateHeuristicConfig(config: Partial<HeuristicAnalysisConfig>): void {
  if (config.minWidth !== undefined && config.minWidth < 100) {
    throw new Error('heuristic.minWidth must be at least 100');
  }

  if (config.minHeight !== undefined && config.minHeight < 100) {
    throw new Error('heuristic.minHeight must be at least 100');
  }

  if (config.maxWidth !== undefined && config.minWidth !== undefined) {
    if (config.maxWidth < config.minWidth) {
      throw new Error('heuristic.maxWidth must be >= minWidth');
    }
  }

  if (config.maxHeight !== undefined && config.minHeight !== undefined) {
    if (config.maxHeight < config.minHeight) {
      throw new Error('heuristic.maxHeight must be >= minHeight');
    }
  }

  if (config.minFileSize !== undefined && config.minFileSize < 0) {
    throw new Error('heuristic.minFileSize must be >= 0');
  }

  if (config.maxFileSize !== undefined && config.minFileSize !== undefined) {
    if (config.maxFileSize < config.minFileSize) {
      throw new Error('heuristic.maxFileSize must be >= minFileSize');
    }
  }

  if (config.allowedFormats !== undefined && config.allowedFormats.length === 0) {
    throw new Error('heuristic.allowedFormats must not be empty');
  }

  if (config.minContrastRatio !== undefined) {
    if (config.minContrastRatio < 1 || config.minContrastRatio > 21) {
      throw new Error('heuristic.minContrastRatio must be between 1 and 21');
    }
  }
}

/**
 * Validates multimodal configuration
 */
function validateMultimodalConfig(config: MultimodalAnalysisConfig): void {
  const validProviders = ['gemini', 'openai', 'anthropic'];
  if (!validProviders.includes(config.provider)) {
    throw new Error(`multimodal.provider must be one of: ${validProviders.join(', ')}`);
  }

  if (!config.apiKey) {
    throw new Error('multimodal.apiKey is required when multimodal is configured');
  }

  if (!config.model) {
    throw new Error('multimodal.model is required when multimodal is configured');
  }

  if (config.maxTokens < 100 || config.maxTokens > 10000) {
    throw new Error('multimodal.maxTokens must be between 100 and 10000');
  }

  if (config.temperature < 0 || config.temperature > 2) {
    throw new Error('multimodal.temperature must be between 0 and 2');
  }

  if (config.rateLimitPerMinute < 1 || config.rateLimitPerMinute > 1000) {
    throw new Error('multimodal.rateLimitPerMinute must be between 1 and 1000');
  }
}

/**
 * Creates a new QAAnalystAgent instance
 *
 * @param config - Optional configuration overrides
 * @returns Configured QAAnalystAgent instance
 *
 * @throws Error if configuration is invalid
 *
 * @example
 * ```typescript
 * // Basic usage with defaults
 * const agent = createQAAnalystAgent();
 *
 * // With custom threshold
 * const agent = createQAAnalystAgent({
 *   threshold: 7,
 *   visualWeight: 0.5,
 *   textWeight: 0.5
 * });
 *
 * // With multimodal analysis
 * const agent = createQAAnalystAgent({
 *   multimodal: {
 *     provider: 'gemini',
 *     apiKey: process.env.GEMINI_API_KEY,
 *     model: 'gemini-pro-vision',
 *     maxTokens: 1000,
 *     temperature: 0.3,
 *     rateLimitPerMinute: 10
 *   }
 * });
 * ```
 */
export function createQAAnalystAgent(
  config?: Partial<QAAnalystVisualConfig>
): QAAnalystAgent {
  // Merge with defaults
  const mergedConfig: QAAnalystVisualConfig = {
    ...DEFAULT_QA_VISUAL_CONFIG,
    ...config,
    heuristic: config?.heuristic
      ? { ...DEFAULT_HEURISTIC_CONFIG, ...config.heuristic }
      : undefined,
  };

  // Validate the merged configuration
  validateConfig(mergedConfig);

  return new QAAnalystAgent(mergedConfig);
}

/**
 * Gets the default configuration
 *
 * @returns Copy of the default configuration object
 */
export function getDefaultConfig(): QAAnalystVisualConfig {
  return { ...DEFAULT_QA_VISUAL_CONFIG };
}

/**
 * Gets the default heuristic configuration
 *
 * @returns Copy of the default heuristic configuration object
 */
export function getDefaultHeuristicConfig(): HeuristicAnalysisConfig {
  return { ...DEFAULT_HEURISTIC_CONFIG };
}

/**
 * Validates partial configuration for use with merge
 *
 * @param config - Partial configuration to validate
 * @throws Error if any provided values are invalid
 */
export function validatePartialConfig(config: Partial<QAAnalystVisualConfig>): void {
  if (config.threshold !== undefined) {
    if (config.threshold < 0 || config.threshold > 10) {
      throw new Error('threshold must be between 0 and 10');
    }
  }

  if (config.minContrastRatio !== undefined) {
    if (config.minContrastRatio < 1 || config.minContrastRatio > 21) {
      throw new Error('minContrastRatio must be between 1 and 21');
    }
  }

  if (config.visualWeight !== undefined) {
    if (config.visualWeight < 0 || config.visualWeight > 1) {
      throw new Error('visualWeight must be between 0 and 1');
    }
  }

  if (config.textWeight !== undefined) {
    if (config.textWeight < 0 || config.textWeight > 1) {
      throw new Error('textWeight must be between 0 and 1');
    }
  }

  if (config.heuristic) {
    validateHeuristicConfig(config.heuristic);
  }

  if (config.multimodal) {
    validateMultimodalConfig(config.multimodal);
  }
}

/**
 * Creates a recommended configuration for production use
 *
 * @param multimodalApiKey - Optional API key for multimodal analysis
 * @param provider - Multimodal provider (default: 'gemini')
 * @returns Production-ready configuration
 */
export function createProductionConfig(
  multimodalApiKey?: string,
  provider: 'gemini' | 'openai' | 'anthropic' = 'gemini'
): QAAnalystVisualConfig {
  const config: QAAnalystVisualConfig = {
    threshold: 6.5,
    minContrastRatio: 4.5,
    visualWeight: 0.4,
    textWeight: 0.6,
    heuristic: {
      ...DEFAULT_HEURISTIC_CONFIG,
      minWidth: 1080,
      minHeight: 1080,
    },
  };

  if (multimodalApiKey) {
    const modelMap: Record<string, string> = {
      gemini: 'gemini-pro-vision',
      openai: 'gpt-4-vision-preview',
      anthropic: 'claude-3-opus-20240229',
    };

    config.multimodal = {
      provider,
      apiKey: multimodalApiKey,
      model: modelMap[provider] || modelMap['gemini']!,
      maxTokens: 1000,
      temperature: 0.3,
      rateLimitPerMinute: 10,
    };
  }

  return config;
}
