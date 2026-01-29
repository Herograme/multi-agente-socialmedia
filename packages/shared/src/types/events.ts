/**
 * WebSocket Event Types - Social Content Agent
 *
 * Shared types for WebSocket communication between server and client.
 * These types are used by both the API server and frontend clients.
 *
 * @module types/events
 * @see Story 5.1 - WebSocket Server para Real-Time
 */

import type { AgentStatus } from './agents';

/**
 * Types of WebSocket events that can be emitted by the server
 */
export enum WSEventType {
  // Pipeline events
  PIPELINE_START = 'pipeline:start',
  PIPELINE_PROGRESS = 'pipeline:progress',
  PIPELINE_COMPLETE = 'pipeline:complete',
  PIPELINE_ERROR = 'pipeline:error',

  // Agent events
  AGENT_START = 'agent:start',
  AGENT_PROGRESS = 'agent:progress',
  AGENT_COMPLETE = 'agent:complete',
  AGENT_ERROR = 'agent:error',

  // Post events
  POST_GENERATED = 'post:generated',
  POST_SCORED = 'post:scored',

  // Connection events
  CONNECTED = 'connected',
  HEARTBEAT = 'heartbeat',
  PONG = 'pong',
  ERROR = 'error',
}

/**
 * Types of messages that clients can send to the server
 */
export enum WSClientMessage {
  /** Subscribe to specific events or executions */
  SUBSCRIBE = 'subscribe',
  /** Unsubscribe from events */
  UNSUBSCRIBE = 'unsubscribe',
  /** Manual ping for keepalive */
  PING = 'ping',
  /** Request current connection status */
  GET_STATUS = 'get_status',
}

/**
 * Base WebSocket message structure (for JSON transport)
 */
export interface WSMessage<T = unknown> {
  type: WSEventType | string;
  payload: T;
  timestamp: string;
  executionId?: string;
}

/**
 * Base WebSocket event structure (deprecated Date format)
 * @deprecated Use WSMessage instead for consistency
 */
export interface WSEvent<T = unknown> {
  type: WSEventType;
  payload: T;
  timestamp: Date;
  executionId?: string;
}

// ============================================
// Payload types for WebSocket events
// ============================================

/**
 * Payload for pipeline:start event
 */
export interface PipelineStartPayload {
  /** Unique identifier for this pipeline execution */
  executionId: string;
  /** Configuration for this pipeline run */
  config: {
    /** Number of posts to generate */
    numPosts: number;
    /** Target platforms (e.g., instagram, linkedin) */
    platforms: string[];
    /** Whether to include visual content generation */
    includeVisual: boolean;
    /** Minimum quality threshold for posts */
    qualityThreshold: number;
  };
  /** Total number of agents in the pipeline */
  totalAgents?: number;
}

/**
 * Payload for pipeline:progress event
 */
export interface PipelineProgressPayload {
  executionId: string;
  progress: number;
  currentAgent: string;
  message?: string;
}

/**
 * Payload for pipeline:complete event
 */
export interface PipelineCompletePayload {
  /** Execution ID for this pipeline run */
  executionId: string;
  /** Final status of the pipeline */
  status: 'completed' | 'failed' | 'cancelled';
  /** Total posts generated */
  postsGenerated: number;
  /** Average quality score */
  averageScore: number;
  /** Total duration in milliseconds */
  duration: number;
  /** Detailed statistics (optional, for extended info) */
  stats?: {
    postsGenerated: number;
    postsApproved: number;
    averageScore: number;
    agentsExecuted: number;
    errorsCount: number;
  };
}

/**
 * Payload for pipeline:error event
 */
export interface PipelineErrorPayload {
  executionId: string;
  error: string;
  agentId?: string;
}

/**
 * Payload for agent:start event
 */
export interface AgentStartPayload {
  /** Execution ID this agent belongs to */
  executionId: string;
  /** Unique identifier for the agent */
  agentId: string;
  /** Human-readable name of the agent */
  agentName: string;
  /** Zero-based index of this agent in the pipeline */
  agentIndex?: number;
  /** Total number of agents in the pipeline */
  totalAgents?: number;
}

/**
 * Payload for agent:progress event
 */
export interface AgentProgressPayload {
  /** Execution ID this agent belongs to */
  executionId: string;
  /** Unique identifier for the agent */
  agentId: string;
  /** Progress percentage (0-100) */
  progress: number;
  /** Human-readable progress message */
  message: string;
  /** Optional current step name within the agent */
  currentStep?: string;
  /** Optional additional data */
  data?: unknown;
}

/**
 * Payload for agent:complete event
 */
export interface AgentCompletePayload {
  /** Execution ID this agent belongs to */
  executionId: string;
  /** Unique identifier for the agent */
  agentId: string;
  /** Human-readable name of the agent (optional for backward compat) */
  agentName?: string;
  /** Duration of agent execution in milliseconds */
  duration: number;
  /** Whether the agent completed successfully */
  success?: boolean;
  /** Optional result data */
  result?: {
    itemsProcessed?: number;
    outputPath?: string;
    summary?: string;
    [key: string]: unknown;
  };
}

/**
 * Payload for agent:error event
 */
export interface AgentErrorPayload {
  /** Execution ID this agent belongs to */
  executionId: string;
  /** Unique identifier for the agent */
  agentId: string;
  /** Human-readable name of the agent (optional) */
  agentName?: string;
  /** Error message */
  error: string;
  /** Optional error code for programmatic handling */
  errorCode?: string;
  /** Whether the agent will retry */
  willRetry: boolean;
  /** Current retry attempt number */
  retryCount?: number;
  /** Maximum retry attempts */
  maxRetries?: number;
}

// ============================================
// Connection-related types
// ============================================

/**
 * Payload for subscribe messages from client
 */
export interface SubscribePayload {
  /** Optional: Filter events by execution ID */
  executionId?: string;
  /** Optional: Filter by specific event types */
  events?: WSEventType[];
}

/**
 * Information about a connected client
 */
export interface ConnectionInfo {
  /** Unique connection identifier */
  id: string;
  /** ISO 8601 timestamp when client connected */
  connectedAt: string;
  /** ISO 8601 timestamp of last ping response */
  lastPing: string;
  /** Current subscriptions for this client */
  subscriptions: SubscribePayload;
  /** Whether the connection is considered alive */
  isAlive: boolean;
}

/**
 * Payload for connected event
 */
export interface ConnectedPayload {
  /** The assigned connection ID */
  connectionId: string;
}

/**
 * Payload for heartbeat events
 */
export interface HeartbeatPayload {
  /** Status indicator */
  status: 'pong' | 'connected';
  /** Connection ID */
  connectionId: string;
  /** ISO 8601 timestamp when connected (for status requests) */
  connectedAt?: string;
  /** Current subscriptions (for status requests) */
  subscriptions?: SubscribePayload;
  /** Total connections on server (for status requests) */
  totalConnections?: number;
}

/**
 * Payload for error events
 */
export interface ErrorPayload {
  /** Error message */
  error: string;
  /** Optional retry-after seconds (for rate limiting) */
  retryAfter?: number;
}

// ============================================
// Legacy types kept for backward compatibility
// ============================================

/**
 * @deprecated Use AgentStartPayload, AgentProgressPayload, etc. instead
 */
export interface AgentEvent {
  agentId: string;
  agentName: string;
  status: AgentStatus;
  progress?: number;
  message?: string;
  data?: unknown;
}

/**
 * @deprecated Use PipelineStartPayload or PipelineCompletePayload instead
 */
export interface PipelineEvent {
  executionId: string;
  currentAgent?: string;
  progress: number;
  message?: string;
}
