// Execution types for real-time pipeline monitoring - Story 5.4

import type { Trend, Topic, CuratedContent } from './agents';
import type { Post, Platform } from './entities';

/**
 * Agent identifiers for the pipeline
 */
export type AgentId =
  | 'researcher'
  | 'topic-generator'
  | 'curator'
  | 'writer'
  | 'image-designer'
  | 'carousel-builder'
  | 'pdf-maker'
  | 'qa-analyst';

/**
 * Status of an individual agent node in the pipeline
 */
export type AgentNodeStatus = 'waiting' | 'running' | 'done' | 'error' | 'skipped';

/**
 * State of an individual agent during execution
 */
export interface AgentNodeState {
  id: AgentId;
  name: string;
  status: AgentNodeStatus;
  startedAt?: Date;
  finishedAt?: Date;
  duration?: number; // milliseconds
  progress?: number; // 0-100
  error?: string;
  output?: unknown;
}

/**
 * Overall pipeline execution status
 */
export type PipelineExecutionStatus = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * State of the entire pipeline execution
 */
export interface PipelineState {
  executionId: string;
  status: PipelineExecutionStatus;
  startedAt?: Date;
  finishedAt?: Date;
  config: ExecutionViewConfig;
  agents: Record<AgentId, AgentNodeState>;
  logs: ExecutionLogEntry[];
  outputs: PipelineOutputs;
}

/**
 * Log levels for execution view events
 */
export type ExecutionLogLevel = 'info' | 'success' | 'warning' | 'error';

/**
 * A single log entry during execution view
 */
export interface ExecutionLogEntry {
  id: string;
  timestamp: Date;
  level: ExecutionLogLevel;
  agentId?: AgentId;
  message: string;
  data?: unknown;
}

/**
 * Accumulated outputs from pipeline execution
 */
export interface PipelineOutputs {
  trends?: Trend[];
  topics?: Topic[];
  curatedContent?: CuratedContent[];
  posts?: Post[];
  images?: string[];
}

/**
 * Configuration used for execution (view-specific)
 */
export interface ExecutionViewConfig {
  numPosts: number;
  platforms: Platform[];
  includeVisual: boolean;
  qualityThreshold: number;
}

/**
 * Agent configuration for UI display
 */
export interface AgentDisplayConfig {
  id: AgentId;
  name: string;
  description: string;
}
