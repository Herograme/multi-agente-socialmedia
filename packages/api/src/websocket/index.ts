/**
 * WebSocket Module
 *
 * Provides real-time communication capabilities for the pipeline dashboard.
 * Includes WebSocket server setup, connection management, and event emission.
 *
 * @module websocket
 * @see Story 5.1 - WebSocket Server para Real-Time
 */

// Server
export { registerWebSocket, getConnectionCount, broadcastEvent } from './server';
export type { WebSocketServerOptions } from './server';

// Types
export {
  WSEventType,
  WSClientMessage,
  type WSEvent,
  type PipelineStartPayload,
  type AgentStartPayload,
  type AgentProgressPayload,
  type AgentCompletePayload,
  type AgentErrorPayload,
  type PipelineCompletePayload,
  type SubscribePayload,
  type ConnectionInfo,
  type ConnectedPayload,
  type HeartbeatPayload,
  type ErrorPayload,
  type ClientMessage,
  type ServerEventPayload,
} from './types';

// Connection Manager
export { ConnectionManager, getConnectionManager } from './connection-manager';

// Heartbeat
export {
  startHeartbeat,
  stopHeartbeat,
  handlePong,
  isHeartbeatRunning,
  getHeartbeatInterval,
  getPongTimeout,
  getHeartbeatMetrics,
  resetHeartbeatMetrics,
} from './heartbeat';

// Pipeline Event Emitter
export {
  PipelineEventEmitter,
  getPipelineEventEmitter,
  PIPELINE_AGENTS,
  type AgentId,
} from './pipeline-emitter';

// Handlers
export {
  handleMessage,
  clearRateLimits,
  clearRateLimitForConnection,
  getRateLimitInfo,
  validateMessage,
} from './handlers';

// Legacy exports (from existing pipeline-events.ts)
// These are kept for backward compatibility with Story 4.7
export {
  PipelineEventBus,
  getPipelineEventBus,
  formatPipelineEvent,
  PipelineWSEvent,
  ExecutionEventBus,
  getExecutionEventBus,
  formatExecutionEvent,
} from './pipeline-events';

export type {
  PipelineStartedPayload,
  PipelineStepStartedPayload,
  PipelineStepCompletedPayload,
  PipelineStepFailedPayload,
  PipelineProgressPayload,
  PipelineCompletedPayload,
  PipelineFailedPayload,
  PipelineEventPayload,
  ExecutionStartedPayload,
  ExecutionStepProgressPayload,
  ExecutionProgressPayload,
  ExecutionCompletedPayload,
  ExecutionFailedPayload,
  ExecutionCancelledPayload,
  ExecutionEventPayload,
} from './pipeline-events';
