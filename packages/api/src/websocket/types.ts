/**
 * WebSocket Types for Real-Time Communication
 *
 * This module defines all types used for WebSocket communication between
 * the server and clients. It includes event types, payloads for all pipeline
 * and agent events, and client message types.
 *
 * @module websocket/types
 * @see Story 5.1 - WebSocket Server para Real-Time
 */

/**
 * Types of WebSocket events that can be emitted by the server
 */
export enum WSEventType {
  // Pipeline events
  PIPELINE_START = 'pipeline:start',
  PIPELINE_COMPLETE = 'pipeline:complete',

  // Agent events
  AGENT_START = 'agent:start',
  AGENT_PROGRESS = 'agent:progress',
  AGENT_COMPLETE = 'agent:complete',
  AGENT_ERROR = 'agent:error',

  // Connection events
  CONNECTED = 'connected',
  HEARTBEAT = 'heartbeat',
  ERROR = 'error',
}

/**
 * Base WebSocket event structure
 *
 * All events sent from server to client follow this structure.
 *
 * @template T - The payload type for this event
 */
export interface WSEvent<T = unknown> {
  /** The type of event */
  type: WSEventType;
  /** The event payload data */
  payload: T;
  /** ISO 8601 timestamp when the event was created */
  timestamp: string;
  /** Optional execution ID to filter events */
  executionId?: string;
}

/**
 * Payload for pipeline:start event
 *
 * Sent when a new pipeline execution begins.
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
  totalAgents: number;
}

/**
 * Payload for agent:start event
 *
 * Sent when an agent begins processing.
 */
export interface AgentStartPayload {
  /** Execution ID this agent belongs to */
  executionId: string;
  /** Unique identifier for the agent */
  agentId: string;
  /** Human-readable name of the agent */
  agentName: string;
  /** Zero-based index of this agent in the pipeline */
  agentIndex: number;
  /** Total number of agents in the pipeline */
  totalAgents: number;
}

/**
 * Payload for agent:progress event
 *
 * Sent periodically to indicate progress within an agent.
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
 *
 * Sent when an agent successfully completes processing.
 */
export interface AgentCompletePayload {
  /** Execution ID this agent belongs to */
  executionId: string;
  /** Unique identifier for the agent */
  agentId: string;
  /** Human-readable name of the agent */
  agentName: string;
  /** Duration of agent execution in milliseconds */
  duration: number;
  /** Whether the agent completed successfully */
  success: boolean;
  /** Optional result summary */
  result?: {
    /** Number of items processed */
    itemsProcessed?: number;
    /** Path to output files */
    outputPath?: string;
    /** Summary message */
    summary?: string;
  };
}

/**
 * Payload for agent:error event
 *
 * Sent when an agent encounters an error.
 */
export interface AgentErrorPayload {
  /** Execution ID this agent belongs to */
  executionId: string;
  /** Unique identifier for the agent */
  agentId: string;
  /** Human-readable name of the agent */
  agentName: string;
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

/**
 * Payload for pipeline:complete event
 *
 * Sent when the entire pipeline finishes execution.
 */
export interface PipelineCompletePayload {
  /** Execution ID for this pipeline run */
  executionId: string;
  /** Final status of the pipeline */
  status: 'completed' | 'failed' | 'cancelled';
  /** Total duration of pipeline execution in milliseconds */
  duration: number;
  /** Statistics about the pipeline run */
  stats: {
    /** Total posts generated */
    postsGenerated: number;
    /** Posts that passed quality threshold */
    postsApproved: number;
    /** Average quality score */
    averageScore: number;
    /** Number of agents that executed */
    agentsExecuted: number;
    /** Number of errors encountered */
    errorsCount: number;
  };
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

/**
 * Client message structure
 */
export interface ClientMessage {
  /** The type of client message */
  type: WSClientMessage;
  /** Optional payload data */
  payload?: unknown;
}

/**
 * Union type of all server event payloads
 */
export type ServerEventPayload =
  | PipelineStartPayload
  | AgentStartPayload
  | AgentProgressPayload
  | AgentCompletePayload
  | AgentErrorPayload
  | PipelineCompletePayload
  | ConnectedPayload
  | HeartbeatPayload
  | ErrorPayload;
