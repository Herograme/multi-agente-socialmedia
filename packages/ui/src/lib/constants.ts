// WebSocket configuration constants

export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const WS_CONFIG = {
  maxReconnectAttempts: 10,
  initialReconnectDelay: 1000,
  maxReconnectDelay: 30000,
  heartbeatInterval: 30000,
  pollingInterval: 5000,
} as const;

// Agent display names and order
export const AGENT_ORDER = [
  'researcher',
  'topic-generator',
  'curator',
  'writer',
  'image-designer',
  'carousel-builder',
  'pdf-maker',
  'qa-analyst',
] as const;

export const AGENT_DISPLAY_NAMES: Record<string, string> = {
  researcher: 'Pesquisador',
  'topic-generator': 'Gerador de Topicos',
  curator: 'Curador',
  writer: 'Redator',
  'image-designer': 'Designer de Imagens',
  'carousel-builder': 'Construtor de Carrossel',
  'pdf-maker': 'Gerador de PDF',
  'qa-analyst': 'Analista de QA',
};
