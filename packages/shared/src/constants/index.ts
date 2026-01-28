// Constants - Social Content Agent

export const AGENT_NAMES = {
  PESQUISADOR: 'pesquisador',
  CURADOR: 'curador',
  REDATOR: 'redator',
  VISUAL: 'visual',
  REVISOR: 'revisor',
} as const;

export const TREND_SOURCES = {
  DEVTO: 'dev.to',
  HACKERNEWS: 'hackernews',
  REDDIT: 'reddit',
  GITHUB: 'github',
} as const;

export const DEFAULT_CONFIG = {
  QUALITY_THRESHOLD: 6.0,
  MAX_POSTS: 5,
  MAX_RETRIES: 3,
  RATE_LIMIT_REQUESTS: 10,
  RATE_LIMIT_WINDOW_MS: 60000,
} as const;

export const API_ENDPOINTS = {
  HEALTH: '/health',
  EXECUTIONS: '/api/executions',
  POSTS: '/api/posts',
  SETTINGS: '/api/settings',
} as const;
