/**
 * Pipeline WebSocket Events
 * Event handling for real-time pipeline progress updates
 *
 * Note: This module provides event types and utilities for WebSocket integration.
 * Socket.IO can be integrated later by connecting to the PipelineService events.
 *
 * Extended for Story 4.7 - Full Pipeline End-to-End
 */

import { EventEmitter } from 'events';
import { createLogger } from '@social-content/shared';
import { getPipelineService } from '../services/pipeline.service';
import type { ExecutionSummary, FullPipelineOptions } from '@social-content/agents';

const logger = createLogger('websocket:pipeline');

/**
 * Pipeline WebSocket event types
 */
export enum PipelineWSEvent {
  // Client -> Server
  SUBSCRIBE = 'pipeline:subscribe',
  UNSUBSCRIBE = 'pipeline:unsubscribe',

  // Server -> Client (existing)
  STARTED = 'pipeline:started',
  STEP_STARTED = 'pipeline:step:started',
  STEP_COMPLETED = 'pipeline:step:completed',
  STEP_FAILED = 'pipeline:step:failed',
  PROGRESS = 'pipeline:progress',
  COMPLETED = 'pipeline:completed',
  FAILED = 'pipeline:failed',

  // Full Pipeline Events (Story 4.7)
  EXECUTION_SUBSCRIBE = 'execution:subscribe',
  EXECUTION_UNSUBSCRIBE = 'execution:unsubscribe',
  EXECUTION_STARTED = 'execution:started',
  EXECUTION_STEP_PROGRESS = 'execution:step:progress',
  EXECUTION_PROGRESS = 'execution:progress',
  EXECUTION_COMPLETED = 'execution:completed',
  EXECUTION_FAILED = 'execution:failed',
  EXECUTION_CANCELLED = 'execution:cancelled',
}

/**
 * Event payloads
 */
export interface PipelineStartedPayload {
  pipelineId: string;
  configId: string;
  configName: string;
  totalSteps: number;
  timestamp: string;
}

export interface PipelineStepStartedPayload {
  pipelineId: string;
  stepName: string;
  stepIndex: number;
  timestamp: string;
}

export interface PipelineStepCompletedPayload {
  pipelineId: string;
  stepName: string;
  stepIndex: number;
  duration: number;
  timestamp: string;
}

export interface PipelineStepFailedPayload {
  pipelineId: string;
  stepName: string;
  stepIndex: number;
  error: string;
  timestamp: string;
}

export interface PipelineProgressPayload {
  pipelineId: string;
  progress: number;
  currentStep: string;
  timestamp: string;
}

export interface PipelineCompletedPayload {
  pipelineId: string;
  duration: number;
  timestamp: string;
}

export interface PipelineFailedPayload {
  pipelineId: string;
  error: string;
  failedStep?: string;
  timestamp: string;
}

// ============================================
// Full Pipeline Events (Story 4.7)
// ============================================

/**
 * Execution started event payload
 */
export interface ExecutionStartedPayload {
  executionId: string;
  startedAt: string;
  options: FullPipelineOptions;
}

/**
 * Execution step progress event payload
 */
export interface ExecutionStepProgressPayload {
  executionId: string;
  step: string;
  status: 'running' | 'completed' | 'failed' | 'skipped';
  progress?: number;
  error?: string;
}

/**
 * Execution overall progress event payload
 */
export interface ExecutionProgressPayload {
  executionId: string;
  progress: number;
  currentStep: string;
}

/**
 * Execution completed event payload
 */
export interface ExecutionCompletedPayload {
  executionId: string;
  completedAt: string;
  summary: ExecutionSummary;
}

/**
 * Execution failed event payload
 */
export interface ExecutionFailedPayload {
  executionId: string;
  failedAt: string;
  error: string;
}

/**
 * Execution cancelled event payload
 */
export interface ExecutionCancelledPayload {
  executionId: string;
  cancelledAt: string;
}

/**
 * All pipeline event payloads
 */
export type PipelineEventPayload =
  | PipelineStartedPayload
  | PipelineStepStartedPayload
  | PipelineStepCompletedPayload
  | PipelineStepFailedPayload
  | PipelineProgressPayload
  | PipelineCompletedPayload
  | PipelineFailedPayload;

/**
 * All execution event payloads
 */
export type ExecutionEventPayload =
  | ExecutionStartedPayload
  | ExecutionStepProgressPayload
  | ExecutionProgressPayload
  | ExecutionCompletedPayload
  | ExecutionFailedPayload
  | ExecutionCancelledPayload;

/**
 * Pipeline Event Bus
 * Centralized event bus for pipeline events that can be connected to WebSocket
 */
export class PipelineEventBus extends EventEmitter {
  private static instance: PipelineEventBus | null = null;
  private subscriptions: Map<string, Set<string>> = new Map(); // pipelineId -> clientIds

  private constructor() {
    super();
    this.setupServiceListeners();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): PipelineEventBus {
    if (!PipelineEventBus.instance) {
      PipelineEventBus.instance = new PipelineEventBus();
    }
    return PipelineEventBus.instance;
  }

  /**
   * Subscribe a client to a pipeline
   */
  subscribe(pipelineId: string, clientId: string): void {
    if (!this.subscriptions.has(pipelineId)) {
      this.subscriptions.set(pipelineId, new Set());
    }
    this.subscriptions.get(pipelineId)!.add(clientId);

    logger.debug('Client subscribed to pipeline', { pipelineId, clientId });
  }

  /**
   * Unsubscribe a client from a pipeline
   */
  unsubscribe(pipelineId: string, clientId: string): void {
    const clients = this.subscriptions.get(pipelineId);
    if (clients) {
      clients.delete(clientId);
      if (clients.size === 0) {
        this.subscriptions.delete(pipelineId);
      }
    }

    logger.debug('Client unsubscribed from pipeline', { pipelineId, clientId });
  }

  /**
   * Unsubscribe a client from all pipelines
   */
  unsubscribeAll(clientId: string): void {
    for (const [pipelineId, clients] of this.subscriptions) {
      clients.delete(clientId);
      if (clients.size === 0) {
        this.subscriptions.delete(pipelineId);
      }
    }

    logger.debug('Client unsubscribed from all pipelines', { clientId });
  }

  /**
   * Get subscribers for a pipeline
   */
  getSubscribers(pipelineId: string): string[] {
    const clients = this.subscriptions.get(pipelineId);
    return clients ? Array.from(clients) : [];
  }

  /**
   * Check if a pipeline has subscribers
   */
  hasSubscribers(pipelineId: string): boolean {
    return (this.subscriptions.get(pipelineId)?.size ?? 0) > 0;
  }

  /**
   * Setup listeners for pipeline service events
   */
  private setupServiceListeners(): void {
    const service = getPipelineService();

    service.on('pipeline:started', (event) => {
      this.broadcastToPipeline(event.pipelineId, PipelineWSEvent.STARTED, {
        pipelineId: event.pipelineId,
        configId: event.configId,
        configName: event.configName,
        totalSteps: event.totalSteps,
        timestamp: event.timestamp.toISOString(),
      });
    });

    service.on('pipeline:step:started', (event) => {
      this.broadcastToPipeline(event.pipelineId, PipelineWSEvent.STEP_STARTED, {
        pipelineId: event.pipelineId,
        stepName: event.stepName,
        stepIndex: event.stepIndex,
        timestamp: event.timestamp.toISOString(),
      });
    });

    service.on('pipeline:step:completed', (event) => {
      this.broadcastToPipeline(event.pipelineId, PipelineWSEvent.STEP_COMPLETED, {
        pipelineId: event.pipelineId,
        stepName: event.stepName,
        stepIndex: event.stepIndex,
        duration: event.duration,
        timestamp: event.timestamp.toISOString(),
      });
    });

    service.on('pipeline:step:failed', (event) => {
      this.broadcastToPipeline(event.pipelineId, PipelineWSEvent.STEP_FAILED, {
        pipelineId: event.pipelineId,
        stepName: event.stepName,
        stepIndex: event.stepIndex,
        error: event.error,
        timestamp: event.timestamp.toISOString(),
      });
    });

    service.on('pipeline:progress', (event) => {
      this.broadcastToPipeline(event.pipelineId, PipelineWSEvent.PROGRESS, {
        pipelineId: event.pipelineId,
        progress: event.progress,
        currentStep: event.currentStep,
        timestamp: event.timestamp.toISOString(),
      });
    });

    service.on('pipeline:completed', (event) => {
      this.broadcastToPipeline(event.pipelineId, PipelineWSEvent.COMPLETED, {
        pipelineId: event.pipelineId,
        duration: event.duration,
        timestamp: event.timestamp.toISOString(),
      });
    });

    service.on('pipeline:failed', (event) => {
      this.broadcastToPipeline(event.pipelineId, PipelineWSEvent.FAILED, {
        pipelineId: event.pipelineId,
        error: event.error,
        failedStep: event.failedStep,
        timestamp: event.timestamp.toISOString(),
      });
    });

    logger.info('Pipeline event bus initialized');
  }

  /**
   * Broadcast event to all subscribers of a pipeline
   */
  private broadcastToPipeline(
    pipelineId: string,
    event: PipelineWSEvent,
    payload: PipelineEventPayload
  ): void {
    // Always emit on the bus for any listeners
    this.emit(event, payload);

    // Also emit a room-specific event
    this.emit(`pipeline:${pipelineId}`, { event, payload });

    const subscribers = this.getSubscribers(pipelineId);
    if (subscribers.length > 0) {
      logger.debug('Broadcasting pipeline event', {
        pipelineId,
        event,
        subscriberCount: subscribers.length,
      });
    }
  }
}

/**
 * Get the pipeline event bus singleton
 */
export function getPipelineEventBus(): PipelineEventBus {
  return PipelineEventBus.getInstance();
}

/**
 * Helper to format event for transport
 */
export function formatPipelineEvent(
  event: PipelineWSEvent,
  payload: PipelineEventPayload
): { event: string; payload: PipelineEventPayload } {
  return { event, payload };
}

// ============================================
// Execution Event Bus (Story 4.7)
// ============================================

/**
 * Execution Event Bus
 * Centralized event bus for full pipeline execution events
 */
export class ExecutionEventBus extends EventEmitter {
  private static instance: ExecutionEventBus | null = null;
  private subscriptions: Map<string, Set<string>> = new Map(); // executionId -> clientIds
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds

  private constructor() {
    super();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ExecutionEventBus {
    if (!ExecutionEventBus.instance) {
      ExecutionEventBus.instance = new ExecutionEventBus();
    }
    return ExecutionEventBus.instance;
  }

  /**
   * Subscribe a client to an execution
   */
  subscribe(executionId: string, clientId: string): void {
    if (!this.subscriptions.has(executionId)) {
      this.subscriptions.set(executionId, new Set());
      this.startHeartbeat(executionId);
    }
    this.subscriptions.get(executionId)!.add(clientId);

    logger.debug('Client subscribed to execution', { executionId, clientId });

    // Emit subscribed event back to client
    this.emit(`execution:${executionId}:subscribed`, { executionId, clientId });
  }

  /**
   * Unsubscribe a client from an execution
   */
  unsubscribe(executionId: string, clientId: string): void {
    const clients = this.subscriptions.get(executionId);
    if (clients) {
      clients.delete(clientId);
      if (clients.size === 0) {
        this.subscriptions.delete(executionId);
        this.stopHeartbeat(executionId);
      }
    }

    logger.debug('Client unsubscribed from execution', { executionId, clientId });
  }

  /**
   * Unsubscribe a client from all executions
   */
  unsubscribeAll(clientId: string): void {
    for (const [executionId, clients] of this.subscriptions) {
      clients.delete(clientId);
      if (clients.size === 0) {
        this.subscriptions.delete(executionId);
        this.stopHeartbeat(executionId);
      }
    }

    logger.debug('Client unsubscribed from all executions', { clientId });
  }

  /**
   * Get subscribers for an execution
   */
  getSubscribers(executionId: string): string[] {
    const clients = this.subscriptions.get(executionId);
    return clients ? Array.from(clients) : [];
  }

  /**
   * Check if an execution has subscribers
   */
  hasSubscribers(executionId: string): boolean {
    return (this.subscriptions.get(executionId)?.size ?? 0) > 0;
  }

  /**
   * Emit an execution event
   */
  emitExecutionEvent(
    executionId: string,
    event: PipelineWSEvent,
    payload: ExecutionEventPayload
  ): void {
    // Always emit on the bus for any listeners
    this.emit(event, payload);

    // Also emit a room-specific event
    this.emit(`execution:${executionId}`, { event, payload });

    const subscribers = this.getSubscribers(executionId);
    if (subscribers.length > 0) {
      logger.debug('Broadcasting execution event', {
        executionId,
        event,
        subscriberCount: subscribers.length,
      });
    }
  }

  /**
   * Start heartbeat for an execution room
   */
  private startHeartbeat(executionId: string): void {
    const interval = setInterval(() => {
      this.emit(`execution:${executionId}:heartbeat`, {
        executionId,
        timestamp: new Date().toISOString(),
      });
    }, this.HEARTBEAT_INTERVAL);

    this.heartbeatIntervals.set(executionId, interval);
    logger.debug('Started heartbeat for execution', { executionId });
  }

  /**
   * Stop heartbeat for an execution room
   */
  private stopHeartbeat(executionId: string): void {
    const interval = this.heartbeatIntervals.get(executionId);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(executionId);
      logger.debug('Stopped heartbeat for execution', { executionId });
    }
  }

  /**
   * Cleanup all heartbeats
   */
  cleanup(): void {
    for (const [executionId, interval] of this.heartbeatIntervals) {
      clearInterval(interval);
    }
    this.heartbeatIntervals.clear();
    this.subscriptions.clear();
    logger.debug('Cleaned up execution event bus');
  }
}

/**
 * Get the execution event bus singleton
 */
export function getExecutionEventBus(): ExecutionEventBus {
  return ExecutionEventBus.getInstance();
}

/**
 * Helper to format execution event for transport
 */
export function formatExecutionEvent(
  event: PipelineWSEvent,
  payload: ExecutionEventPayload
): { event: string; payload: ExecutionEventPayload } {
  return { event, payload };
}
