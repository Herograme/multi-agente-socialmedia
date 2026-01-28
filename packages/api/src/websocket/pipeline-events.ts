/**
 * Pipeline WebSocket Events
 * Event handling for real-time pipeline progress updates
 *
 * Note: This module provides event types and utilities for WebSocket integration.
 * Socket.IO can be integrated later by connecting to the PipelineService events.
 */

import { EventEmitter } from 'events';
import { createLogger } from '@social-content/shared';
import { getPipelineService } from '../services/pipeline.service';

const logger = createLogger('websocket:pipeline');

/**
 * Pipeline WebSocket event types
 */
export enum PipelineWSEvent {
  // Client -> Server
  SUBSCRIBE = 'pipeline:subscribe',
  UNSUBSCRIBE = 'pipeline:unsubscribe',

  // Server -> Client
  STARTED = 'pipeline:started',
  STEP_STARTED = 'pipeline:step:started',
  STEP_COMPLETED = 'pipeline:step:completed',
  STEP_FAILED = 'pipeline:step:failed',
  PROGRESS = 'pipeline:progress',
  COMPLETED = 'pipeline:completed',
  FAILED = 'pipeline:failed',
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
