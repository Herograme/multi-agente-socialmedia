export interface ValidationResult {
    valid: boolean;
    missing: string[];
    warnings: string[];
}
/**
 * Validate that all required environment variables are present
 * @throws Error if required variables are missing
 */
export declare function validateEnv(): void;
/**
 * Check environment variables without throwing
 * @returns Validation result with missing and warning lists
 */
export declare function checkEnv(): ValidationResult;
/**
 * Get an environment variable with optional default
 */
export declare function getEnv(name: string, defaultValue?: string): string;
/**
 * Get an environment variable as a number
 */
export declare function getEnvNumber(name: string, defaultValue: number): number;
/**
 * Get an environment variable as a boolean
 */
export declare function getEnvBoolean(name: string, defaultValue: boolean): boolean;
/**
 * List all environment variables (for documentation)
 */
export declare function listEnvVars(): {
    required: string[];
    optional: string[];
};
//# sourceMappingURL=validation.d.ts.map