// Quality Gate Configuration - Social Content Agent

import type { QualityGateConfig } from '../types/quality';

/**
 * Default Quality Gate configuration values
 */
const DEFAULT_CONFIG: QualityGateConfig = {
  threshold: 6.0,
  autoRegenerate: true,
  maxRegenerations: 1,
};

/**
 * Current runtime configuration
 */
let currentConfig: QualityGateConfig = { ...DEFAULT_CONFIG };

/**
 * Validates that a threshold value is within acceptable range
 * @param threshold - The threshold value to validate
 * @throws Error if threshold is not between 0 and 10
 */
function validateThreshold(threshold: number): void {
  if (typeof threshold !== 'number' || Number.isNaN(threshold)) {
    throw new Error(`Invalid threshold: must be a number`);
  }
  if (threshold < 0 || threshold > 10) {
    throw new Error(`Invalid threshold: ${threshold}. Must be between 0 and 10.`);
  }
}

/**
 * Validates the complete Quality Gate configuration
 * @param config - Configuration to validate
 * @throws Error if configuration is invalid
 */
function validateConfig(config: QualityGateConfig): void {
  validateThreshold(config.threshold);

  if (config.maxRegenerations < 0 || config.maxRegenerations > 5) {
    throw new Error(
      `Invalid maxRegenerations: ${config.maxRegenerations}. Must be between 0 and 5.`
    );
  }
}

/**
 * Rounds a number to 0.1 precision
 * @param value - Value to round
 * @returns Rounded value
 */
function roundToPrecision(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Loads Quality Gate configuration from environment variables
 * Priority: env > default
 *
 * Environment variables:
 * - QUALITY_THRESHOLD: Score minimo para aprovacao (0-10, default: 6.0)
 * - QUALITY_AUTO_REGENERATE: Regenerar automaticamente (true/false, default: true)
 * - QUALITY_MAX_REGENERATIONS: Maximo de regeneracoes (0-5, default: 1)
 *
 * @returns Loaded configuration
 */
export function loadQualityGateConfig(): QualityGateConfig {
  const envThreshold = process.env['QUALITY_THRESHOLD'];
  const envAutoRegenerate = process.env['QUALITY_AUTO_REGENERATE'];
  const envMaxRegenerations = process.env['QUALITY_MAX_REGENERATIONS'];

  const config: QualityGateConfig = {
    threshold: envThreshold
      ? parseFloat(envThreshold)
      : DEFAULT_CONFIG.threshold,
    autoRegenerate: envAutoRegenerate
      ? envAutoRegenerate.toLowerCase() === 'true'
      : DEFAULT_CONFIG.autoRegenerate,
    maxRegenerations: envMaxRegenerations
      ? parseInt(envMaxRegenerations, 10)
      : DEFAULT_CONFIG.maxRegenerations,
  };

  // Round threshold to 0.1 precision
  config.threshold = roundToPrecision(config.threshold);

  validateConfig(config);

  currentConfig = { ...config };

  return currentConfig;
}

/**
 * Returns the current quality threshold
 * @returns Current threshold value (0-10)
 */
export function getQualityThreshold(): number {
  return currentConfig.threshold;
}

/**
 * Updates the quality threshold at runtime
 * @param threshold - New threshold value (0-10)
 * @throws Error if threshold is not between 0 and 10
 */
export function setQualityThreshold(threshold: number): void {
  validateThreshold(threshold);
  currentConfig.threshold = roundToPrecision(threshold);
}

/**
 * Returns the complete Quality Gate configuration
 * @returns Copy of current configuration
 */
export function getQualityGateConfig(): QualityGateConfig {
  return { ...currentConfig };
}

/**
 * Updates the complete Quality Gate configuration at runtime
 * @param config - Partial configuration to update
 */
export function updateQualityGateConfig(
  config: Partial<QualityGateConfig>
): QualityGateConfig {
  const newConfig: QualityGateConfig = {
    ...currentConfig,
    ...config,
  };

  if (config.threshold !== undefined) {
    newConfig.threshold = roundToPrecision(config.threshold);
  }

  validateConfig(newConfig);
  currentConfig = { ...newConfig };

  return { ...currentConfig };
}

/**
 * Resets configuration to defaults (useful for testing)
 */
export function resetQualityGateConfig(): void {
  currentConfig = { ...DEFAULT_CONFIG };
}

/**
 * Returns the default configuration values
 * @returns Default configuration
 */
export function getDefaultQualityGateConfig(): QualityGateConfig {
  return { ...DEFAULT_CONFIG };
}
