/**
 * Pipeline Service
 * Manages pipeline execution and status tracking
 */

import { EventEmitter } from 'events';
import { createLogger, generateId } from '@social-content/shared';
import {
  createResearchCuratePipeline,
  getPipelineStatusStore,
  PipelineStatus,
  StepStatus,
  type PipelineResult,
  type PipelineState,
  type ResearchCurateInput,
} from '@social-content/agents';

const logger = createLogger('service:pipeline');

/**
 * Options for starting a pipeline
 */
export interface StartPipelineOptions {
  sources?: Array<'devto' | 'hackernews' | 'reddit'>;
  limit?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Pipeline run response
 */
export interface PipelineRunResponse {
  status: 'started';
  pipelineId: string;
  timestamp: string;
  message: string;
}

/**
 * Pipeline status response
 */
export interface PipelineStatusResponse {
  pipelineId: string;
  configName: string;
  status: PipelineStatus;
  progress: {
    currentStep: number;
    totalSteps: number;
    percentComplete: number;
    currentStepName: string;
  };
  startedAt: string;
  completedAt?: string;
  steps: Array<{
    name: string;
    status: StepStatus;
    duration?: number;
    error?: string;
  }>;
  finalOutput?: unknown;
  error?: string;
}

/**
 * Pipeline Service class
 */
export class PipelineService extends EventEmitter {
  private _statusStore: ReturnType<typeof getPipelineStatusStore> | null = null;
  private abortControllers: Map<string, AbortController> = new Map();

  private get statusStore() {
    if (!this._statusStore) {
      this._statusStore = getPipelineStatusStore();
    }
    return this._statusStore;
  }

  /**
   * Start the research-curate pipeline
   */
  async startResearchCurate(options: StartPipelineOptions = {}): Promise<PipelineRunResponse> {
    const pipelineId = `pipe-${generateId()}`;
    const startTime = new Date();

    logger.info('Starting research-curate pipeline', {
      pipelineId,
      sources: options.sources,
      limit: options.limit,
    });

    // Create the pipeline
    const pipeline = createResearchCuratePipeline();

    // Initialize state in store
    const initialState = pipeline.buildInitialState(pipelineId);
    this.statusStore.create(initialState);

    // Create abort controller for cancellation
    const abortController = new AbortController();
    this.abortControllers.set(pipelineId, abortController);

    // Wire up pipeline events to status store
    this.setupPipelineEventHandlers(pipeline, pipelineId);

    // Start async execution (don't await)
    const input: ResearchCurateInput = {
      sources: options.sources ?? ['devto', 'hackernews', 'reddit'],
      limit: options.limit ?? 50,
    };

    pipeline
      .run(input, {
        pipelineId,
        metadata: options.metadata,
        abortSignal: abortController.signal,
      })
      .then((result) => {
        this.handlePipelineComplete(pipelineId, result);
      })
      .catch((error) => {
        this.handlePipelineError(pipelineId, error);
      })
      .finally(() => {
        this.abortControllers.delete(pipelineId);
      });

    return {
      status: 'started',
      pipelineId,
      timestamp: startTime.toISOString(),
      message: 'Pipeline research-curate started successfully',
    };
  }

  /**
   * Get pipeline status by ID
   */
  getStatus(pipelineId: string): PipelineStatusResponse | null {
    const state = this.statusStore.get(pipelineId);
    if (!state) {
      return null;
    }

    return this.transformStateToResponse(state);
  }

  /**
   * Get all pipeline statuses
   */
  getAllStatuses(): PipelineStatusResponse[] {
    return this.statusStore
      .getAll()
      .map((state) => this.transformStateToResponse(state));
  }

  /**
   * Get pipelines by status
   */
  getByStatus(status: PipelineStatus): PipelineStatusResponse[] {
    return this.statusStore
      .getByStatus(status)
      .map((state) => this.transformStateToResponse(state));
  }

  /**
   * Cancel a running pipeline
   */
  cancel(pipelineId: string): boolean {
    const abortController = this.abortControllers.get(pipelineId);
    if (!abortController) {
      return false;
    }

    logger.info('Cancelling pipeline', { pipelineId });
    abortController.abort();
    this.statusStore.updateStatus(pipelineId, PipelineStatus.CANCELLED, 'Pipeline was cancelled');
    return true;
  }

  /**
   * Retry a failed pipeline
   */
  async retry(pipelineId: string): Promise<PipelineRunResponse | null> {
    const state = this.statusStore.get(pipelineId);
    if (!state || state.status !== PipelineStatus.FAILED) {
      return null;
    }

    logger.info('Retrying failed pipeline', { originalPipelineId: pipelineId });

    // Start a new pipeline with same configuration
    // For now, use default options since we don't store original options
    return this.startResearchCurate();
  }

  /**
   * Check if a pipeline is currently running
   */
  isRunning(): boolean {
    return this.statusStore.getByStatus(PipelineStatus.RUNNING).length > 0;
  }

  /**
   * Get status counts
   */
  getStatusCounts(): Record<PipelineStatus, number> {
    return this.statusStore.getStatusCounts();
  }

  /**
   * Setup event handlers for pipeline events
   */
  private setupPipelineEventHandlers(pipeline: EventEmitter, pipelineId: string): void {
    pipeline.on('pipeline:started', (event) => {
      this.statusStore.updateStatus(pipelineId, PipelineStatus.RUNNING);
      this.emit('pipeline:started', { pipelineId, ...event });
    });

    pipeline.on('pipeline:step:started', (event) => {
      this.statusStore.updateProgress(pipelineId, event.stepIndex, event.stepName);
      this.statusStore.updateStepState(pipelineId, event.stepIndex, {
        status: StepStatus.RUNNING,
        startedAt: event.timestamp,
      });
      this.emit('pipeline:step:started', { pipelineId, ...event });
    });

    pipeline.on('pipeline:step:completed', (event) => {
      this.statusStore.updateStepState(pipelineId, event.stepIndex, {
        status: StepStatus.COMPLETED,
        completedAt: event.timestamp,
        duration: event.duration,
        output: event.output,
      });
      this.emit('pipeline:step:completed', { pipelineId, ...event });
    });

    pipeline.on('pipeline:step:failed', (event) => {
      this.statusStore.updateStepState(pipelineId, event.stepIndex, {
        status: StepStatus.FAILED,
        completedAt: event.timestamp,
        error: event.error,
      });
      this.emit('pipeline:step:failed', { pipelineId, ...event });
    });

    pipeline.on('pipeline:progress', (event) => {
      this.emit('pipeline:progress', { pipelineId, ...event });
    });

    pipeline.on('pipeline:completed', (event) => {
      this.emit('pipeline:completed', { pipelineId, ...event });
    });

    pipeline.on('pipeline:failed', (event) => {
      this.emit('pipeline:failed', { pipelineId, ...event });
    });
  }

  /**
   * Handle pipeline completion
   */
  private handlePipelineComplete(pipelineId: string, result: PipelineResult): void {
    if (result.status === PipelineStatus.COMPLETED) {
      this.statusStore.complete(pipelineId, result.finalOutput);
      logger.info('Pipeline completed successfully', {
        pipelineId,
        duration: result.duration,
      });
    } else {
      const errorMsg = result.errors[0]?.message ?? 'Unknown error';
      const failedStep = result.errors[0]?.stepIndex;
      this.statusStore.fail(pipelineId, errorMsg, failedStep);
      logger.error('Pipeline failed', {
        pipelineId,
        error: errorMsg,
        failedStep,
      });
    }
  }

  /**
   * Handle pipeline error
   */
  private handlePipelineError(pipelineId: string, error: Error): void {
    const errorMsg = error.message ?? 'Unknown error';
    this.statusStore.fail(pipelineId, errorMsg);
    logger.error('Pipeline error', { pipelineId, error: errorMsg });
  }

  /**
   * Transform state to response format
   */
  private transformStateToResponse(state: PipelineState): PipelineStatusResponse {
    return {
      pipelineId: state.pipelineId,
      configName: state.configName,
      status: state.status,
      progress: state.progress,
      startedAt: state.startedAt.toISOString(),
      completedAt: state.completedAt?.toISOString(),
      steps: state.stepStates.map((step) => ({
        name: step.name,
        status: step.status,
        duration: step.duration,
        error: step.error,
      })),
      finalOutput: state.finalOutput,
      error: state.error,
    };
  }
}

// Singleton instance
let serviceInstance: PipelineService | null = null;

/**
 * Get the pipeline service singleton
 */
export function getPipelineService(): PipelineService {
  if (!serviceInstance) {
    serviceInstance = new PipelineService();
  }
  return serviceInstance;
}

/**
 * Create a new pipeline service instance (for testing)
 */
export function createPipelineService(): PipelineService {
  return new PipelineService();
}
