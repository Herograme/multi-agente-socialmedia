/**
 * Pipeline Event Emitter for WebSocket
 *
 * Emits real-time events for pipeline execution progress.
 * Integrates with ConnectionManager to broadcast events to connected clients.
 *
 * @module websocket/pipeline-emitter
 * @see Story 5.1 - WebSocket Server para Real-Time
 */

import { createLogger } from '@social-content/shared';
import { ConnectionManager } from './connection-manager';
import {
  WSEvent,
  WSEventType,
  PipelineStartPayload,
  AgentStartPayload,
  AgentProgressPayload,
  AgentCompletePayload,
  AgentErrorPayload,
  PipelineCompletePayload,
} from './types';

const logger = createLogger('websocket:pipeline-emitter');

/**
 * List of pipeline agents with their identifiers and names
 */
export const PIPELINE_AGENTS = [
  { id: 'researcher', name: 'Pesquisador' },
  { id: 'topic-generator', name: 'Gerador de Topicos' },
  { id: 'curator', name: 'Curador' },
  { id: 'writer', name: 'Redator' },
  { id: 'image-designer', name: 'Designer de Imagens' },
  { id: 'carousel-builder', name: 'Carousel Builder' },
  { id: 'pdf-maker', name: 'PDF Maker' },
  { id: 'qa-analyst', name: 'QA Analyst' },
] as const;

/**
 * Agent identifier type
 */
export type AgentId = (typeof PIPELINE_AGENTS)[number]['id'];

/**
 * Pipeline Event Emitter
 *
 * Singleton class responsible for emitting pipeline events to WebSocket clients.
 * All events are broadcast through the ConnectionManager.
 *
 * @example
 * ```typescript
 * const emitter = PipelineEventEmitter.getInstance();
 *
 * // When pipeline starts
 * emitter.emitPipelineStart('exec-123', {
 *   numPosts: 3,
 *   platforms: ['instagram'],
 *   includeVisual: true,
 *   qualityThreshold: 6.0
 * });
 *
 * // When an agent starts
 * emitter.emitAgentStart('exec-123', 'researcher', 'Pesquisador');
 *
 * // When an agent completes
 * emitter.emitAgentComplete('exec-123', 'researcher', 'Pesquisador', 5000, {
 *   itemsProcessed: 10
 * });
 *
 * // When pipeline completes
 * emitter.emitPipelineComplete('exec-123', 'completed', 60000, {
 *   postsGenerated: 5,
 *   postsApproved: 4,
 *   averageScore: 8.2,
 *   agentsExecuted: 8,
 *   errorsCount: 0
 * });
 * ```
 */
export class PipelineEventEmitter {
  private static instance: PipelineEventEmitter | null = null;
  private connectionManager: ConnectionManager;

  private constructor() {
    this.connectionManager = ConnectionManager.getInstance();
    logger.debug('PipelineEventEmitter initialized');
  }

  /**
   * Gets the singleton instance
   *
   * @returns The PipelineEventEmitter instance
   */
  static getInstance(): PipelineEventEmitter {
    if (!PipelineEventEmitter.instance) {
      PipelineEventEmitter.instance = new PipelineEventEmitter();
    }
    return PipelineEventEmitter.instance;
  }

  /**
   * Resets the singleton instance (for testing)
   */
  static resetInstance(): void {
    PipelineEventEmitter.instance = null;
  }

  /**
   * Emits a pipeline:start event
   *
   * Called when a new pipeline execution begins.
   *
   * @param executionId - Unique identifier for this pipeline run
   * @param config - Pipeline configuration
   */
  emitPipelineStart(executionId: string, config: PipelineStartPayload['config']): void {
    const event: WSEvent<PipelineStartPayload> = {
      type: WSEventType.PIPELINE_START,
      payload: {
        executionId,
        config,
        totalAgents: PIPELINE_AGENTS.length,
      },
      timestamp: new Date().toISOString(),
      executionId,
    };

    this.connectionManager.broadcast(event);
    logger.info('Emitted pipeline:start', { executionId, totalAgents: PIPELINE_AGENTS.length });
  }

  /**
   * Emits an agent:start event
   *
   * Called when an agent begins processing.
   *
   * @param executionId - Pipeline execution ID
   * @param agentId - Unique identifier for the agent
   * @param agentName - Human-readable name of the agent
   */
  emitAgentStart(executionId: string, agentId: string, agentName: string): void {
    const agentIndex = PIPELINE_AGENTS.findIndex((a) => a.id === agentId);

    const event: WSEvent<AgentStartPayload> = {
      type: WSEventType.AGENT_START,
      payload: {
        executionId,
        agentId,
        agentName,
        agentIndex: agentIndex >= 0 ? agentIndex : 0,
        totalAgents: PIPELINE_AGENTS.length,
      },
      timestamp: new Date().toISOString(),
      executionId,
    };

    this.connectionManager.broadcast(event);
    logger.info('Emitted agent:start', { executionId, agentId, agentName });
  }

  /**
   * Emits an agent:progress event
   *
   * Called periodically to indicate progress within an agent.
   *
   * @param executionId - Pipeline execution ID
   * @param agentId - Agent identifier
   * @param progress - Progress percentage (0-100)
   * @param message - Human-readable progress message
   * @param data - Optional additional data
   */
  emitAgentProgress(
    executionId: string,
    agentId: string,
    progress: number,
    message: string,
    data?: unknown
  ): void {
    const event: WSEvent<AgentProgressPayload> = {
      type: WSEventType.AGENT_PROGRESS,
      payload: {
        executionId,
        agentId,
        progress: Math.min(100, Math.max(0, progress)), // Clamp to 0-100
        message,
        data,
      },
      timestamp: new Date().toISOString(),
      executionId,
    };

    this.connectionManager.broadcast(event);
    logger.debug('Emitted agent:progress', { executionId, agentId, progress });
  }

  /**
   * Emits an agent:complete event
   *
   * Called when an agent successfully completes processing.
   *
   * @param executionId - Pipeline execution ID
   * @param agentId - Agent identifier
   * @param agentName - Human-readable name of the agent
   * @param duration - Execution duration in milliseconds
   * @param result - Optional result summary
   */
  emitAgentComplete(
    executionId: string,
    agentId: string,
    agentName: string,
    duration: number,
    result?: AgentCompletePayload['result']
  ): void {
    const event: WSEvent<AgentCompletePayload> = {
      type: WSEventType.AGENT_COMPLETE,
      payload: {
        executionId,
        agentId,
        agentName,
        duration,
        success: true,
        result,
      },
      timestamp: new Date().toISOString(),
      executionId,
    };

    this.connectionManager.broadcast(event);
    logger.info('Emitted agent:complete', { executionId, agentId, agentName, duration });
  }

  /**
   * Emits an agent:error event
   *
   * Called when an agent encounters an error.
   *
   * @param executionId - Pipeline execution ID
   * @param agentId - Agent identifier
   * @param agentName - Human-readable name of the agent
   * @param error - Error message
   * @param willRetry - Whether the agent will retry
   * @param retryCount - Current retry attempt number
   * @param maxRetries - Maximum retry attempts
   */
  emitAgentError(
    executionId: string,
    agentId: string,
    agentName: string,
    error: string,
    willRetry: boolean,
    retryCount?: number,
    maxRetries?: number
  ): void {
    const event: WSEvent<AgentErrorPayload> = {
      type: WSEventType.AGENT_ERROR,
      payload: {
        executionId,
        agentId,
        agentName,
        error,
        willRetry,
        retryCount,
        maxRetries,
      },
      timestamp: new Date().toISOString(),
      executionId,
    };

    this.connectionManager.broadcast(event);
    logger.warn('Emitted agent:error', { executionId, agentId, agentName, error, willRetry });
  }

  /**
   * Emits a pipeline:complete event
   *
   * Called when the entire pipeline finishes execution.
   *
   * @param executionId - Pipeline execution ID
   * @param status - Final status of the pipeline
   * @param duration - Total duration in milliseconds
   * @param stats - Statistics about the pipeline run
   */
  emitPipelineComplete(
    executionId: string,
    status: 'completed' | 'failed' | 'cancelled',
    duration: number,
    stats: PipelineCompletePayload['stats']
  ): void {
    const event: WSEvent<PipelineCompletePayload> = {
      type: WSEventType.PIPELINE_COMPLETE,
      payload: {
        executionId,
        status,
        duration,
        stats,
      },
      timestamp: new Date().toISOString(),
      executionId,
    };

    this.connectionManager.broadcast(event);
    logger.info('Emitted pipeline:complete', { executionId, status, duration, stats });
  }
}

/**
 * Gets the PipelineEventEmitter singleton
 *
 * @returns The PipelineEventEmitter instance
 */
export function getPipelineEventEmitter(): PipelineEventEmitter {
  return PipelineEventEmitter.getInstance();
}
