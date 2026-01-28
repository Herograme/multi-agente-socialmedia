// Default configuration values - Social Content Agent

import type { ServerConfig, SourcesConfig, QualityConfig } from './types';

export const DEFAULT_SERVER: ServerConfig = {
  port: 3001,
  nodeEnv: 'development',
  logLevel: 'info',
};

export const DEFAULT_SOURCES: SourcesConfig = {
  devto: {
    enabled: true,
    url: 'https://dev.to/api/articles',
    rateLimit: {
      maxRequests: 10,
      windowMs: 60000,
    },
  },
  hackernews: {
    enabled: true,
    url: 'https://hacker-news.firebaseio.com/v0',
    rateLimit: {
      maxRequests: 30,
      windowMs: 60000,
    },
  },
  reddit: {
    enabled: true,
    url: 'https://www.reddit.com/r/programming.json',
    rateLimit: {
      maxRequests: 10,
      windowMs: 60000,
    },
  },
};

export const DEFAULT_QUALITY: QualityConfig = {
  threshold: 6.0,
  autoRetry: true,
  maxRetries: 3,
};

export const DEFAULT_LLM_MODELS = {
  groq: 'llama-3.3-70b-versatile',
  gemini: 'gemini-1.5-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-haiku-20240307',
} as const;

export const DEFAULT_IMAGE_STYLES = {
  ideogram: 'REALISTIC',
  leonardo: 'CINEMATIC',
  dalle: 'vivid',
} as const;
