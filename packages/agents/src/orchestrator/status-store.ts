/**
 * Pipeline Status Store
 * In-memory store for tracking pipeline execution status
 */

import { createLogger } from '@social-content/shared';
import type { PipelineState, StepState } from './types';
import { PipelineStatus, StepStatus } from './types';

const logger = createLogger('orchestrator:status-store');

/**
 * Options for the status store
 */
export interface StatusStoreOptions {
  /** Maximum number of pipeline states to keep (default: 100) */
  maxEntries?: number;
  /** Time to live for entries in ms (default: 1 hour) */
  ttlMs?: number;
}

/**
 * Entry stored in the status store
 */
interface StoreEntry {
  state: PipelineState;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Pipeline Status Store
 * Manages the state of all pipeline executions
 */
export class PipelineStatusStore {
  private readonly store: Map<string, StoreEntry> = new Map();
  private readonly maxEntries: number;
  private readonly ttlMs: number;

  constructor(options: StatusStoreOptions = {}) {
    this.maxEntries = options.maxEntries ?? 100;
    this.ttlMs = options.ttlMs ?? 60 * 60 * 1000; // 1 hour default
  }

  /**
   * Create a new pipeline state
   */
  create(state: PipelineState): void {
    this.cleanupOldEntries();

    this.store.set(state.pipelineId, {
      state,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    logger.debug('Pipeline state created', {
      pipelineId: state.pipelineId,
      status: state.status,
    });
  }

  /**
   * Get a pipeline state by ID
   */
  get(pipelineId: string): PipelineState | null {
    const entry = this.store.get(pipelineId);
    if (!entry) {
      return null;
    }
    return { ...entry.state };
  }

  /**
   * Update a pipeline state
   */
  update(pipelineId: string, updates: Partial<PipelineState>): PipelineState | null {
    const entry = this.store.get(pipelineId);
    if (!entry) {
      logger.warn('Attempted to update non-existent pipeline', { pipelineId });
      return null;
    }

    const updatedState: PipelineState = {
      ...entry.state,
      ...updates,
    };

    entry.state = updatedState;
    entry.updatedAt = new Date();

    logger.debug('Pipeline state updated', {
      pipelineId,
      status: updatedState.status,
      progress: updatedState.progress.percentComplete,
    });

    return { ...updatedState };
  }

  /**
   * Update pipeline status
   */
  updateStatus(pipelineId: string, status: PipelineStatus, error?: string): PipelineState | null {
    const entry = this.store.get(pipelineId);
    if (!entry) {
      return null;
    }

    entry.state.status = status;
    entry.state.error = error;
    entry.updatedAt = new Date();

    if (status === PipelineStatus.COMPLETED || status === PipelineStatus.FAILED) {
      entry.state.completedAt = new Date();
    }

    return { ...entry.state };
  }

  /**
   * Update pipeline progress
   */
  updateProgress(
    pipelineId: string,
    currentStep: number,
    currentStepName: string
  ): PipelineState | null {
    const entry = this.store.get(pipelineId);
    if (!entry) {
      return null;
    }

    const totalSteps = entry.state.progress.totalSteps;
    const percentComplete = Math.round((currentStep / totalSteps) * 100);

    entry.state.progress = {
      currentStep,
      totalSteps,
      percentComplete,
      currentStepName,
    };
    entry.state.status = PipelineStatus.RUNNING;
    entry.updatedAt = new Date();

    return { ...entry.state };
  }

  /**
   * Update a specific step state
   */
  updateStepState(
    pipelineId: string,
    stepIndex: number,
    stepUpdate: Partial<StepState>
  ): PipelineState | null {
    const entry = this.store.get(pipelineId);
    if (!entry) {
      return null;
    }

    const step = entry.state.stepStates[stepIndex];
    if (!step) {
      logger.warn('Attempted to update non-existent step', { pipelineId, stepIndex });
      return null;
    }

    entry.state.stepStates[stepIndex] = {
      ...step,
      ...stepUpdate,
    };
    entry.updatedAt = new Date();

    return { ...entry.state };
  }

  /**
   * Mark pipeline as completed with final output
   */
  complete(pipelineId: string, finalOutput: unknown): PipelineState | null {
    const entry = this.store.get(pipelineId);
    if (!entry) {
      return null;
    }

    entry.state.status = PipelineStatus.COMPLETED;
    entry.state.completedAt = new Date();
    entry.state.finalOutput = finalOutput;
    entry.state.progress.percentComplete = 100;
    entry.updatedAt = new Date();

    // Mark all steps as completed
    entry.state.stepStates = entry.state.stepStates.map((step) => ({
      ...step,
      status: StepStatus.COMPLETED,
    }));

    logger.info('Pipeline completed', { pipelineId });

    return { ...entry.state };
  }

  /**
   * Mark pipeline as failed
   */
  fail(pipelineId: string, error: string, failedStepIndex?: number): PipelineState | null {
    const entry = this.store.get(pipelineId);
    if (!entry) {
      return null;
    }

    entry.state.status = PipelineStatus.FAILED;
    entry.state.completedAt = new Date();
    entry.state.error = error;
    entry.updatedAt = new Date();

    // Mark failed step and skip remaining
    if (failedStepIndex !== undefined) {
      entry.state.stepStates = entry.state.stepStates.map((step, index) => {
        if (index === failedStepIndex) {
          return { ...step, status: StepStatus.FAILED, error };
        }
        if (index > failedStepIndex) {
          return { ...step, status: StepStatus.SKIPPED };
        }
        return step;
      });
    }

    logger.info('Pipeline failed', { pipelineId, error });

    return { ...entry.state };
  }

  /**
   * Delete a pipeline state
   */
  delete(pipelineId: string): boolean {
    const deleted = this.store.delete(pipelineId);
    if (deleted) {
      logger.debug('Pipeline state deleted', { pipelineId });
    }
    return deleted;
  }

  /**
   * Get all pipeline states
   */
  getAll(): PipelineState[] {
    return Array.from(this.store.values()).map((entry) => ({ ...entry.state }));
  }

  /**
   * Get pipeline states by status
   */
  getByStatus(status: PipelineStatus): PipelineState[] {
    return Array.from(this.store.values())
      .filter((entry) => entry.state.status === status)
      .map((entry) => ({ ...entry.state }));
  }

  /**
   * Get count of pipelines by status
   */
  getStatusCounts(): Record<PipelineStatus, number> {
    const counts: Record<PipelineStatus, number> = {
      [PipelineStatus.PENDING]: 0,
      [PipelineStatus.RUNNING]: 0,
      [PipelineStatus.COMPLETED]: 0,
      [PipelineStatus.FAILED]: 0,
      [PipelineStatus.CANCELLED]: 0,
    };

    for (const entry of this.store.values()) {
      counts[entry.state.status]++;
    }

    return counts;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.store.clear();
    logger.debug('Pipeline status store cleared');
  }

  /**
   * Get the current size of the store
   */
  get size(): number {
    return this.store.size;
  }

  /**
   * Clean up old entries based on TTL and max entries
   */
  private cleanupOldEntries(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    // Find expired entries
    for (const [pipelineId, entry] of this.store) {
      if (now - entry.createdAt.getTime() > this.ttlMs) {
        toDelete.push(pipelineId);
      }
    }

    // Delete expired entries
    for (const pipelineId of toDelete) {
      this.store.delete(pipelineId);
    }

    // If still over limit, delete oldest entries
    if (this.store.size >= this.maxEntries) {
      const entries = Array.from(this.store.entries())
        .sort((a, b) => a[1].createdAt.getTime() - b[1].createdAt.getTime());

      const numToDelete = this.store.size - this.maxEntries + 1;
      for (let i = 0; i < numToDelete && i < entries.length; i++) {
        const entry = entries[i];
        if (entry) {
          this.store.delete(entry[0]);
        }
      }
    }

    if (toDelete.length > 0) {
      logger.debug('Cleaned up old pipeline entries', { count: toDelete.length });
    }
  }
}

// Singleton instance
let storeInstance: PipelineStatusStore | null = null;

/**
 * Get the pipeline status store singleton
 */
export function getPipelineStatusStore(): PipelineStatusStore {
  if (!storeInstance) {
    storeInstance = new PipelineStatusStore();
  }
  return storeInstance;
}

/**
 * Create a new status store instance (for testing)
 */
export function createPipelineStatusStore(options?: StatusStoreOptions): PipelineStatusStore {
  return new PipelineStatusStore(options);
}
