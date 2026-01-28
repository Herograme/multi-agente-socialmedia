/**
 * Factory function for CuradorAgent
 */

import { CuradorAgent } from './curador-agent';
import type { CuradorConfig, ContentSource } from './types';

/**
 * Default configuration for CuradorAgent
 */
const DEFAULT_CONFIG: CuradorConfig = {
  sources: [],
  minRelevanceScore: 50,
  maxResults: 20,
  categories: ['tech', 'programming', 'ai'],
  rateLimitPerMinute: 60,
};

/**
 * Validate content source configuration
 */
function validateSource(source: ContentSource, index: number): void {
  if (!source.id || typeof source.id !== 'string') {
    throw new Error(`Source at index ${index}: id is required and must be a string`);
  }

  if (!source.name || typeof source.name !== 'string') {
    throw new Error(`Source at index ${index}: name is required and must be a string`);
  }

  if (!['rss', 'api', 'scraper'].includes(source.type)) {
    throw new Error(`Source at index ${index}: type must be 'rss', 'api', or 'scraper'`);
  }

  if (!source.url || typeof source.url !== 'string') {
    throw new Error(`Source at index ${index}: url is required and must be a string`);
  }

  if (typeof source.enabled !== 'boolean') {
    throw new Error(`Source at index ${index}: enabled must be a boolean`);
  }

  if (typeof source.priority !== 'number' || source.priority < 1 || source.priority > 10) {
    throw new Error(`Source at index ${index}: priority must be a number between 1 and 10`);
  }
}

/**
 * Validate the complete configuration
 */
function validateConfig(config: CuradorConfig): void {
  if (config.minRelevanceScore < 0 || config.minRelevanceScore > 100) {
    throw new Error('minRelevanceScore must be between 0 and 100');
  }

  if (config.maxResults < 1) {
    throw new Error('maxResults must be at least 1');
  }

  if (config.rateLimitPerMinute < 1) {
    throw new Error('rateLimitPerMinute must be at least 1');
  }

  if (!Array.isArray(config.categories)) {
    throw new Error('categories must be an array');
  }

  if (!Array.isArray(config.sources)) {
    throw new Error('sources must be an array');
  }

  // Validate each source
  config.sources.forEach((source, index) => {
    validateSource(source, index);
  });
}

/**
 * Create a new CuradorAgent instance
 *
 * @param config - Partial configuration (will be merged with defaults)
 * @returns Configured CuradorAgent instance
 */
export function createCuradorAgent(
  config?: Partial<CuradorConfig>
): CuradorAgent {
  const mergedConfig: CuradorConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    // Ensure arrays are properly merged (not replaced with undefined)
    sources: config?.sources ?? DEFAULT_CONFIG.sources,
    categories: config?.categories ?? DEFAULT_CONFIG.categories,
  };

  validateConfig(mergedConfig);

  return new CuradorAgent(mergedConfig);
}

/**
 * Get the default configuration
 */
export function getDefaultConfig(): CuradorConfig {
  return { ...DEFAULT_CONFIG };
}
