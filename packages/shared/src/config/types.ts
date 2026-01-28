// Configuration types - Social Content Agent

export type NodeEnv = 'development' | 'production' | 'test';
export type LLMProvider = 'groq' | 'gemini' | 'openai' | 'anthropic';
export type ImageProvider = 'ideogram' | 'leonardo' | 'dalle';

export interface AppConfig {
  server: ServerConfig;
  database: DatabaseConfig;
  llm: LLMConfig;
  image: ImageConfig;
  sources: SourcesConfig;
  quality: QualityConfig;
}

export interface ServerConfig {
  port: number;
  nodeEnv: NodeEnv;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface DatabaseConfig {
  url: string;
}

export interface LLMConfig {
  primary: LLMProviderConfig;
  fallback?: LLMProviderConfig;
}

export interface LLMProviderConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ImageConfig {
  primary: ImageProviderConfig;
  fallback?: ImageProviderConfig;
}

export interface ImageProviderConfig {
  provider: ImageProvider;
  apiKey: string;
  defaultStyle?: string;
}

export interface SourcesConfig {
  devto: SourceConfig;
  hackernews: SourceConfig;
  reddit: SourceConfig;
}

export interface SourceConfig {
  enabled: boolean;
  url: string;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
}

export interface QualityConfig {
  threshold: number;
  autoRetry: boolean;
  maxRetries: number;
}

// Environment variable names
export const ENV_VARS = {
  // Required
  GROQ_API_KEY: 'GROQ_API_KEY',
  IDEOGRAM_API_KEY: 'IDEOGRAM_API_KEY',

  // Optional
  GEMINI_API_KEY: 'GEMINI_API_KEY',
  LEONARDO_API_KEY: 'LEONARDO_API_KEY',
  PORT: 'PORT',
  NODE_ENV: 'NODE_ENV',
  LOG_LEVEL: 'LOG_LEVEL',
  DATABASE_URL: 'DATABASE_URL',

  // Sources
  DEVTO_ENABLED: 'DEVTO_ENABLED',
  HACKERNEWS_ENABLED: 'HACKERNEWS_ENABLED',
  REDDIT_ENABLED: 'REDDIT_ENABLED',

  // Quality
  QUALITY_THRESHOLD: 'QUALITY_THRESHOLD',
} as const;

export const REQUIRED_ENV_VARS = [
  ENV_VARS.GROQ_API_KEY,
  ENV_VARS.IDEOGRAM_API_KEY,
] as const;

export const OPTIONAL_ENV_VARS = [
  ENV_VARS.GEMINI_API_KEY,
  ENV_VARS.LEONARDO_API_KEY,
  ENV_VARS.PORT,
  ENV_VARS.NODE_ENV,
  ENV_VARS.LOG_LEVEL,
  ENV_VARS.DATABASE_URL,
  ENV_VARS.DEVTO_ENABLED,
  ENV_VARS.HACKERNEWS_ENABLED,
  ENV_VARS.REDDIT_ENABLED,
  ENV_VARS.QUALITY_THRESHOLD,
] as const;
