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
