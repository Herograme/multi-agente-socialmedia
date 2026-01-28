import type { AppConfig } from './types';
/**
 * Load and validate application configuration
 * @param validate Whether to validate required env vars (default: true)
 */
export declare function loadConfig(validate?: boolean): AppConfig;
/**
 * Clear cached configuration (useful for testing)
 */
export declare function clearConfigCache(): void;
/**
 * Get configuration, loading if not cached
 */
export declare function getConfig(): AppConfig;
/**
 * Log configuration (with secrets masked)
 */
export declare function logConfig(config: AppConfig): void;
/**
 * Get a summary of active providers
 */
export declare function getProviderSummary(config: AppConfig): string;
//# sourceMappingURL=loader.d.ts.map