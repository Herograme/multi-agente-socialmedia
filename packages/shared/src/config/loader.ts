// Configuration loader - Social Content Agent

import type {
  AppConfig,
  ServerConfig,
  DatabaseConfig,
  LLMConfig,
  ImageConfig,
  SourcesConfig,
  QualityConfig,
  NodeEnv,
} from './types';
import { validateEnv, getEnv, getEnvNumber, getEnvBoolean } from './validation';
import {
  DEFAULT_SERVER,
  DEFAULT_SOURCES,
  DEFAULT_QUALITY,
  DEFAULT_LLM_MODELS,
  DEFAULT_IMAGE_STYLES,
} from './defaults';
import { maskSecret } from '../utils/helpers';
import { createLogger } from '../utils/logger';

const logger = createLogger('config');

let cachedConfig: AppConfig | null = null;

/**
 * Load and validate application configuration
 * @param validate Whether to validate required env vars (default: true)
 */
export function loadConfig(validate = true): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  if (validate) {
    validateEnv();
  }

  const config: AppConfig = {
    server: loadServerConfig(),
    database: loadDatabaseConfig(),
    llm: loadLLMConfig(),
    image: loadImageConfig(),
    sources: loadSourcesConfig(),
    quality: loadQualityConfig(),
  };

  cachedConfig = config;
  return config;
}

/**
 * Clear cached configuration (useful for testing)
 */
export function clearConfigCache(): void {
  cachedConfig = null;
}

/**
 * Get configuration, loading if not cached
 */
export function getConfig(): AppConfig {
  if (!cachedConfig) {
    return loadConfig();
  }
  return cachedConfig;
}

function loadServerConfig(): ServerConfig {
  const nodeEnv = (process.env.NODE_ENV || DEFAULT_SERVER.nodeEnv) as NodeEnv;
  const validEnvs: NodeEnv[] = ['development', 'production', 'test'];

  if (!validEnvs.includes(nodeEnv)) {
    throw new Error(`Invalid NODE_ENV: ${nodeEnv}. Must be one of: ${validEnvs.join(', ')}`);
  }

  return {
    port: getEnvNumber('PORT', DEFAULT_SERVER.port),
    nodeEnv,
    logLevel: (process.env.LOG_LEVEL || DEFAULT_SERVER.logLevel) as ServerConfig['logLevel'],
  };
}

function loadDatabaseConfig(): DatabaseConfig {
  return {
    url: process.env.DATABASE_URL || 'file:./dev.db',
  };
}

function loadLLMConfig(): LLMConfig {
  const config: LLMConfig = {
    primary: {
      provider: 'groq',
      apiKey: getEnv('GROQ_API_KEY'),
      model: process.env.GROQ_MODEL || DEFAULT_LLM_MODELS.groq,
      maxTokens: getEnvNumber('GROQ_MAX_TOKENS', 4096),
      temperature: parseFloat(process.env.GROQ_TEMPERATURE || '0.7'),
    },
  };

  // Add fallback if Gemini key is available
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    config.fallback = {
      provider: 'gemini',
      apiKey: geminiKey,
      model: process.env.GEMINI_MODEL || DEFAULT_LLM_MODELS.gemini,
      maxTokens: getEnvNumber('GEMINI_MAX_TOKENS', 4096),
      temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
    };
  }

  return config;
}

function loadImageConfig(): ImageConfig {
  const config: ImageConfig = {
    primary: {
      provider: 'ideogram',
      apiKey: getEnv('IDEOGRAM_API_KEY'),
      defaultStyle: process.env.IDEOGRAM_STYLE || DEFAULT_IMAGE_STYLES.ideogram,
    },
  };

  // Add fallback if Leonardo key is available
  const leonardoKey = process.env.LEONARDO_API_KEY;
  if (leonardoKey) {
    config.fallback = {
      provider: 'leonardo',
      apiKey: leonardoKey,
      defaultStyle: process.env.LEONARDO_STYLE || DEFAULT_IMAGE_STYLES.leonardo,
    };
  }

  return config;
}

function loadSourcesConfig(): SourcesConfig {
  return {
    devto: {
      enabled: getEnvBoolean('DEVTO_ENABLED', DEFAULT_SOURCES.devto.enabled),
      url: process.env.DEVTO_URL || DEFAULT_SOURCES.devto.url,
      rateLimit: DEFAULT_SOURCES.devto.rateLimit,
    },
    hackernews: {
      enabled: getEnvBoolean('HACKERNEWS_ENABLED', DEFAULT_SOURCES.hackernews.enabled),
      url: process.env.HACKERNEWS_URL || DEFAULT_SOURCES.hackernews.url,
      rateLimit: DEFAULT_SOURCES.hackernews.rateLimit,
    },
    reddit: {
      enabled: getEnvBoolean('REDDIT_ENABLED', DEFAULT_SOURCES.reddit.enabled),
      url: process.env.REDDIT_URL || DEFAULT_SOURCES.reddit.url,
      rateLimit: DEFAULT_SOURCES.reddit.rateLimit,
    },
  };
}

function loadQualityConfig(): QualityConfig {
  return {
    threshold: parseFloat(process.env.QUALITY_THRESHOLD || String(DEFAULT_QUALITY.threshold)),
    autoRetry: getEnvBoolean('QUALITY_AUTO_RETRY', DEFAULT_QUALITY.autoRetry),
    maxRetries: getEnvNumber('QUALITY_MAX_RETRIES', DEFAULT_QUALITY.maxRetries),
  };
}

/**
 * Log configuration (with secrets masked)
 */
export function logConfig(config: AppConfig): void {
  const safeConfig = {
    server: config.server,
    database: {
      url: maskSecret(config.database.url),
    },
    llm: {
      primary: {
        provider: config.llm.primary.provider,
        model: config.llm.primary.model,
        apiKey: maskSecret(config.llm.primary.apiKey),
      },
      fallback: config.llm.fallback
        ? {
            provider: config.llm.fallback.provider,
            model: config.llm.fallback.model,
            apiKey: maskSecret(config.llm.fallback.apiKey),
          }
        : undefined,
    },
    image: {
      primary: {
        provider: config.image.primary.provider,
        apiKey: maskSecret(config.image.primary.apiKey),
      },
      fallback: config.image.fallback
        ? {
            provider: config.image.fallback.provider,
            apiKey: maskSecret(config.image.fallback.apiKey),
          }
        : undefined,
    },
    sources: {
      devto: { enabled: config.sources.devto.enabled },
      hackernews: { enabled: config.sources.hackernews.enabled },
      reddit: { enabled: config.sources.reddit.enabled },
    },
    quality: config.quality,
  };

  logger.info('Configuration loaded', safeConfig as unknown as Record<string, unknown>);
}

/**
 * Get a summary of active providers
 */
export function getProviderSummary(config: AppConfig): string {
  const lines = [
    `LLM Primary: ${config.llm.primary.provider} (${config.llm.primary.model})`,
    config.llm.fallback
      ? `LLM Fallback: ${config.llm.fallback.provider} (${config.llm.fallback.model})`
      : 'LLM Fallback: none',
    `Image Primary: ${config.image.primary.provider}`,
    config.image.fallback
      ? `Image Fallback: ${config.image.fallback.provider}`
      : 'Image Fallback: none',
    `Sources: ${[
      config.sources.devto.enabled && 'Dev.to',
      config.sources.hackernews.enabled && 'HN',
      config.sources.reddit.enabled && 'Reddit',
    ]
      .filter(Boolean)
      .join(', ')}`,
  ];

  return lines.join('\n');
}
