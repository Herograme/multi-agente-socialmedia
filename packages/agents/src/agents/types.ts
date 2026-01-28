/**
 * Agent status enum (mirrors @social-content/shared)
 */
export enum AgentStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
}

/**
 * Base interface for all agents
 */
export interface Agent<TInput = unknown, TOutput = unknown> {
  name: string;
  status: AgentStatus;
  run(input: TInput): Promise<AgentResult<TOutput>>;
}

/**
 * Result returned by agent execution
 */
export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  duration: number;
  timestamp: Date;
}
