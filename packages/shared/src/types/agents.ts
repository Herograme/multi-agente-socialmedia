// Agent types - Social Content Agent

export enum AgentStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  order: number;
}

export interface AgentResult<T = unknown> {
  agentId: string;
  success: boolean;
  data?: T;
  error?: string;
  duration: number;
  timestamp: Date;
}

export interface Trend {
  id: string;
  title: string;
  description?: string;
  source: string;
  url: string;
  discoveredAt: Date;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  engagementPotential: number;
  basedOnTrends: string[];
}

// Curated Content Types
export type CuratedContentType = 'article' | 'video' | 'tutorial' | 'documentation' | 'other';

export interface Snippet {
  id: string;
  code: string;
  language: string;
  description?: string;
}

export interface CuratedContent {
  id: string;
  title: string;
  source: string;
  type: CuratedContentType;
  url: string;
  snippets: Snippet[];
  curatedAt: string;
}
