/**
 * Agent Retry Configuration
 * Manages per-agent retry and timeout configuration
 * Story 4.5: Orquestrador - Retry e Error Handling
 */

import { createLogger } from '@social-content/shared';
import {
  RetryConfig,
  TimeoutConfig,
  FallbackConfig,
  AgentExecutionConfig,
  ErrorCategory,
} from './types';
import { DEFAULT_RETRY_CONFIG } from './retry-manager';
import { DEFAULT_FALLBACK_CONFIG } from './fallback-manager';

const logger = createLogger('orchestrator:agent-retry-config');

/**
 * Default timeout configuration
 */
export const DEFAULT_TIMEOUT_CONFIG: TimeoutConfig = {
  timeout: 60000, // 1 minute
  initTimeout: 10000, // 10 seconds
};

/**
 * Validation error for configuration
 */
export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: unknown
  ) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Validate retry configuration
 */
function validateRetryConfig(config: Partial<RetryConfig>, prefix = ''): void {
  const p = prefix ? `${prefix}.` : '';

  if (config.maxAttempts !== undefined) {
    if (typeof config.maxAttempts !== 'number' || config.maxAttempts < 1) {
      throw new ConfigValidationError(
        `${p}maxAttempts must be a positive number`,
        `${p}maxAttempts`,
        config.maxAttempts
      );
    }
  }

  if (config.initialDelay !== undefined) {
    if (typeof config.initialDelay !== 'number' || config.initialDelay < 0) {
      throw new ConfigValidationError(
        `${p}initialDelay must be a non-negative number`,
        `${p}initialDelay`,
        config.initialDelay
      );
    }
  }

  if (config.maxDelay !== undefined) {
    if (typeof config.maxDelay !== 'number' || config.maxDelay < 0) {
      throw new ConfigValidationError(
        `${p}maxDelay must be a non-negative number`,
        `${p}maxDelay`,
        config.maxDelay
      );
    }
  }

  if (config.backoffFactor !== undefined) {
    if (typeof config.backoffFactor !== 'number' || config.backoffFactor < 1) {
      throw new ConfigValidationError(
        `${p}backoffFactor must be at least 1`,
        `${p}backoffFactor`,
        config.backoffFactor
      );
    }
  }

  if (config.jitterFactor !== undefined) {
    if (
      typeof config.jitterFactor !== 'number' ||
      config.jitterFactor < 0 ||
      config.jitterFactor > 1
    ) {
      throw new ConfigValidationError(
        `${p}jitterFactor must be between 0 and 1`,
        `${p}jitterFactor`,
        config.jitterFactor
      );
    }
  }

  if (config.retriableCategories !== undefined) {
    if (!Array.isArray(config.retriableCategories)) {
      throw new ConfigValidationError(
        `${p}retriableCategories must be an array`,
        `${p}retriableCategories`,
        config.retriableCategories
      );
    }

    const validCategories = Object.values(ErrorCategory);
    for (const cat of config.retriableCategories) {
      if (!validCategories.includes(cat)) {
        throw new ConfigValidationError(
          `${p}retriableCategories contains invalid category: ${cat}`,
          `${p}retriableCategories`,
          cat
        );
      }
    }
  }
}

/**
 * Validate timeout configuration
 */
function validateTimeoutConfig(config: Partial<TimeoutConfig>, prefix = ''): void {
  const p = prefix ? `${prefix}.` : '';

  if (config.timeout !== undefined) {
    if (typeof config.timeout !== 'number' || config.timeout < 0) {
      throw new ConfigValidationError(
        `${p}timeout must be a non-negative number`,
        `${p}timeout`,
        config.timeout
      );
    }
  }

  if (config.initTimeout !== undefined) {
    if (typeof config.initTimeout !== 'number' || config.initTimeout < 0) {
      throw new ConfigValidationError(
        `${p}initTimeout must be a non-negative number`,
        `${p}initTimeout`,
        config.initTimeout
      );
    }
  }
}

/**
 * Validate fallback configuration
 */
function validateFallbackConfig(config: Partial<FallbackConfig>, prefix = ''): void {
  const p = prefix ? `${prefix}.` : '';

  if (config.failureThreshold !== undefined) {
    if (typeof config.failureThreshold !== 'number' || config.failureThreshold < 1) {
      throw new ConfigValidationError(
        `${p}failureThreshold must be a positive number`,
        `${p}failureThreshold`,
        config.failureThreshold
      );
    }
  }

  if (config.resetTimeout !== undefined) {
    if (typeof config.resetTimeout !== 'number' || config.resetTimeout < 0) {
      throw new ConfigValidationError(
        `${p}resetTimeout must be a non-negative number`,
        `${p}resetTimeout`,
        config.resetTimeout
      );
    }
  }

  if (config.providers !== undefined) {
    if (!Array.isArray(config.providers)) {
      throw new ConfigValidationError(
        `${p}providers must be an array`,
        `${p}providers`,
        config.providers
      );
    }
  }

  if (config.recoveryDelay !== undefined) {
    if (typeof config.recoveryDelay !== 'number' || config.recoveryDelay < 0) {
      throw new ConfigValidationError(
        `${p}recoveryDelay must be a non-negative number`,
        `${p}recoveryDelay`,
        config.recoveryDelay
      );
    }
  }
}

/**
 * Input for agent configuration
 */
export interface AgentConfigInput {
  retry?: Partial<RetryConfig>;
  timeout?: Partial<TimeoutConfig>;
  fallback?: Partial<FallbackConfig>;
}

/**
 * Configuration options for AgentRetryConfigManager
 */
export interface AgentRetryConfigManagerOptions {
  /** Default retry config for all agents */
  defaultRetry?: Partial<RetryConfig>;
  /** Default timeout config for all agents */
  defaultTimeout?: Partial<TimeoutConfig>;
  /** Default fallback config for all agents */
  defaultFallback?: Partial<FallbackConfig>;
  /** Per-agent configurations */
  agents?: Record<string, AgentConfigInput>;
  /** Whether to validate configurations */
  validate?: boolean;
}

/**
 * Agent Retry Configuration Manager
 * Manages retry, timeout, and fallback configuration per agent
 */
export class AgentRetryConfigManager {
  private globalRetryConfig: RetryConfig;
  private globalTimeoutConfig: TimeoutConfig;
  private globalFallbackConfig: FallbackConfig;
  private agentConfigs: Map<string, AgentExecutionConfig> = new Map();
  private shouldValidate: boolean;

  constructor(options: AgentRetryConfigManagerOptions = {}) {
    this.shouldValidate = options.validate ?? true;

    // Build global configs
    this.globalRetryConfig = { ...DEFAULT_RETRY_CONFIG, ...options.defaultRetry };
    this.globalTimeoutConfig = { ...DEFAULT_TIMEOUT_CONFIG, ...options.defaultTimeout };
    this.globalFallbackConfig = { ...DEFAULT_FALLBACK_CONFIG, ...options.defaultFallback };

    // Validate global configs
    if (this.shouldValidate) {
      validateRetryConfig(this.globalRetryConfig, 'global.retry');
      validateTimeoutConfig(this.globalTimeoutConfig, 'global.timeout');
      validateFallbackConfig(this.globalFallbackConfig, 'global.fallback');
    }

    // Load per-agent configs
    if (options.agents) {
      for (const [name, config] of Object.entries(options.agents)) {
        this.setAgentConfig(name, config);
      }
    }

    logger.debug('AgentRetryConfigManager initialized', {
      agentCount: this.agentConfigs.size,
    });
  }

  /**
   * Get the complete configuration for an agent
   * Falls back to global defaults for missing values
   *
   * @param agentName - Name of the agent
   * @returns Complete execution configuration
   */
  getConfigForAgent(agentName: string): AgentExecutionConfig {
    const cached = this.agentConfigs.get(agentName);
    if (cached) {
      return { ...cached };
    }

    // Return global defaults
    return {
      name: agentName,
      retry: { ...this.globalRetryConfig },
      timeout: { ...this.globalTimeoutConfig },
      fallback: { ...this.globalFallbackConfig },
    };
  }

  /**
   * Get just the retry configuration for an agent
   */
  getRetryConfig(agentName: string): RetryConfig {
    const config = this.agentConfigs.get(agentName);
    return config ? { ...config.retry } : { ...this.globalRetryConfig };
  }

  /**
   * Get just the timeout configuration for an agent
   */
  getTimeoutConfig(agentName: string): TimeoutConfig {
    const config = this.agentConfigs.get(agentName);
    return config ? { ...config.timeout } : { ...this.globalTimeoutConfig };
  }

  /**
   * Get just the fallback configuration for an agent
   */
  getFallbackConfig(agentName: string): FallbackConfig | undefined {
    const config = this.agentConfigs.get(agentName);
    return config?.fallback ? { ...config.fallback } : undefined;
  }

  /**
   * Set configuration for a specific agent
   *
   * @param agentName - Name of the agent
   * @param config - Configuration to set (merged with globals)
   */
  setAgentConfig(agentName: string, config: AgentConfigInput): void {
    // Validate if enabled
    if (this.shouldValidate) {
      if (config.retry) {
        validateRetryConfig(config.retry, `agents.${agentName}.retry`);
      }
      if (config.timeout) {
        validateTimeoutConfig(config.timeout, `agents.${agentName}.timeout`);
      }
      if (config.fallback) {
        validateFallbackConfig(config.fallback, `agents.${agentName}.fallback`);
      }
    }

    // Merge with global defaults
    const fullConfig: AgentExecutionConfig = {
      name: agentName,
      retry: { ...this.globalRetryConfig, ...config.retry },
      timeout: { ...this.globalTimeoutConfig, ...config.timeout },
      fallback: config.fallback
        ? { ...this.globalFallbackConfig, ...config.fallback }
        : undefined,
    };

    this.agentConfigs.set(agentName, fullConfig);

    logger.debug('Agent configuration set', { agentName, config: fullConfig });
  }

  /**
   * Remove configuration for a specific agent (will use globals)
   */
  removeAgentConfig(agentName: string): boolean {
    const deleted = this.agentConfigs.delete(agentName);
    if (deleted) {
      logger.debug('Agent configuration removed', { agentName });
    }
    return deleted;
  }

  /**
   * Check if an agent has custom configuration
   */
  hasAgentConfig(agentName: string): boolean {
    return this.agentConfigs.has(agentName);
  }

  /**
   * Get all agent names with custom configuration
   */
  getConfiguredAgents(): string[] {
    return Array.from(this.agentConfigs.keys());
  }

  /**
   * Update global retry configuration
   */
  updateGlobalRetryConfig(config: Partial<RetryConfig>): void {
    if (this.shouldValidate) {
      validateRetryConfig(config, 'global.retry');
    }

    this.globalRetryConfig = { ...this.globalRetryConfig, ...config };
    logger.debug('Global retry configuration updated', { config: this.globalRetryConfig });
  }

  /**
   * Update global timeout configuration
   */
  updateGlobalTimeoutConfig(config: Partial<TimeoutConfig>): void {
    if (this.shouldValidate) {
      validateTimeoutConfig(config, 'global.timeout');
    }

    this.globalTimeoutConfig = { ...this.globalTimeoutConfig, ...config };
    logger.debug('Global timeout configuration updated', { config: this.globalTimeoutConfig });
  }

  /**
   * Update global fallback configuration
   */
  updateGlobalFallbackConfig(config: Partial<FallbackConfig>): void {
    if (this.shouldValidate) {
      validateFallbackConfig(config, 'global.fallback');
    }

    this.globalFallbackConfig = { ...this.globalFallbackConfig, ...config };
    logger.debug('Global fallback configuration updated', { config: this.globalFallbackConfig });
  }

  /**
   * Get global retry configuration
   */
  getGlobalRetryConfig(): RetryConfig {
    return { ...this.globalRetryConfig };
  }

  /**
   * Get global timeout configuration
   */
  getGlobalTimeoutConfig(): TimeoutConfig {
    return { ...this.globalTimeoutConfig };
  }

  /**
   * Get global fallback configuration
   */
  getGlobalFallbackConfig(): FallbackConfig {
    return { ...this.globalFallbackConfig };
  }

  /**
   * Export all configuration as a JSON-serializable object
   */
  exportConfig(): {
    global: {
      retry: RetryConfig;
      timeout: TimeoutConfig;
      fallback: FallbackConfig;
    };
    agents: Record<string, AgentExecutionConfig>;
  } {
    const agents: Record<string, AgentExecutionConfig> = {};
    for (const [name, config] of this.agentConfigs) {
      agents[name] = { ...config };
    }

    return {
      global: {
        retry: { ...this.globalRetryConfig },
        timeout: { ...this.globalTimeoutConfig },
        fallback: { ...this.globalFallbackConfig },
      },
      agents,
    };
  }

  /**
   * Clear all agent-specific configurations
   */
  clearAgentConfigs(): void {
    this.agentConfigs.clear();
    logger.debug('All agent configurations cleared');
  }
}

/**
 * Create an AgentRetryConfigManager instance
 */
export function createAgentRetryConfigManager(
  options?: AgentRetryConfigManagerOptions
): AgentRetryConfigManager {
  return new AgentRetryConfigManager(options);
}

/**
 * Predefined configuration presets for common scenarios
 */
export const CONFIG_PRESETS = {
  /**
   * Fast-fail configuration - minimal retries for quick feedback
   */
  FAST_FAIL: {
    retry: {
      maxAttempts: 2,
      initialDelay: 500,
      maxDelay: 2000,
    },
    timeout: {
      timeout: 30000,
    },
  } as AgentConfigInput,

  /**
   * Patient configuration - more retries with longer waits
   */
  PATIENT: {
    retry: {
      maxAttempts: 5,
      initialDelay: 2000,
      maxDelay: 60000,
      backoffFactor: 2.5,
    },
    timeout: {
      timeout: 120000,
    },
  } as AgentConfigInput,

  /**
   * LLM API configuration - optimized for LLM API calls
   */
  LLM_API: {
    retry: {
      maxAttempts: 4,
      initialDelay: 1500,
      maxDelay: 30000,
      backoffFactor: 2,
      jitter: true,
      jitterFactor: 0.3,
    },
    timeout: {
      timeout: 90000,
    },
  } as AgentConfigInput,

  /**
   * Image generation configuration - longer timeouts for image gen
   */
  IMAGE_GENERATION: {
    retry: {
      maxAttempts: 3,
      initialDelay: 3000,
      maxDelay: 60000,
    },
    timeout: {
      timeout: 180000, // 3 minutes
    },
  } as AgentConfigInput,
};
