// Environment validation - Social Content Agent

import { REQUIRED_ENV_VARS, OPTIONAL_ENV_VARS } from './types';

export interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Validate that all required environment variables are present
 * @throws Error if required variables are missing
 */
export function validateEnv(): void {
  const result = checkEnv();

  if (!result.valid) {
    const message = [
      'Missing required environment variables:',
      ...result.missing.map(v => `  - ${v}`),
      '',
      'Please set these variables in your .env file or environment.',
      'See .env.example for reference.',
    ].join('\n');

    throw new Error(message);
  }
}

/**
 * Check environment variables without throwing
 * @returns Validation result with missing and warning lists
 */
export function checkEnv(): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Check optional variables and warn if missing fallbacks
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasLeonardo = !!process.env.LEONARDO_API_KEY;

  if (!hasGemini) {
    warnings.push('GEMINI_API_KEY not set - no LLM fallback available');
  }
  if (!hasLeonardo) {
    warnings.push('LEONARDO_API_KEY not set - no image fallback available');
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Get an environment variable with optional default
 */
export function getEnv(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (value !== undefined) return value;
  if (defaultValue !== undefined) return defaultValue;
  throw new Error(`Environment variable ${name} is not set`);
}

/**
 * Get an environment variable as a number
 */
export function getEnvNumber(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (value === undefined) return defaultValue;

  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number, got: ${value}`);
  }
  return parsed;
}

/**
 * Get an environment variable as a boolean
 */
export function getEnvBoolean(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return defaultValue;

  const lowered = value.toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(lowered)) return true;
  if (['false', '0', 'no', 'off'].includes(lowered)) return false;

  throw new Error(`Environment variable ${name} must be a boolean, got: ${value}`);
}

/**
 * List all environment variables (for documentation)
 */
export function listEnvVars(): { required: string[]; optional: string[] } {
  return {
    required: [...REQUIRED_ENV_VARS],
    optional: [...OPTIONAL_ENV_VARS],
  };
}
