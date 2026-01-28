/**
 * Visual Pipeline Service
 * Story 3.7 - Integracao Pipeline Visual
 *
 * Manages visual pipeline execution and status tracking
 */

import { EventEmitter } from 'events';
import { createLogger, generateId } from '@social-content/shared';
import {
  runVisualPipeline,
  getPipelineStatusStore,
  PipelineStatus,
  StepStatus,
  type VisualPipelineInput,
  type VisualPipelineOptions,
  type VisualPipelineOutput,
  type GeneratedAsset,
  type PipelineState,
} from '@social-content/agents';

const logger = createLogger('service:visual-pipeline');

/**
 * Response for starting a visual pipeline
 */
export interface VisualPipelineRunResponse {
  status: 'started';
  pipelineId: string;
  postId: string;
  timestamp: string;
  message: string;
}

/**
 * Response for visual pipeline status
 */
export interface VisualPipelineStatusResponse {
  pipelineId: string;
  postId: string;
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
  assets?: GeneratedAsset[];
  error?: string;
}

/**
 * Options for starting the visual pipeline
 */
export interface StartVisualPipelineOptions extends VisualPipelineOptions {
  metadata?: Record<string, unknown>;
}

/**
 * Visual Pipeline Service class
 */
export class VisualPipelineService extends EventEmitter {
  private _statusStore: ReturnType<typeof getPipelineStatusStore> | null = null;
  private abortControllers: Map<string, AbortController> = new Map();
  private pipelineResults: Map<string, VisualPipelineOutput> = new Map();
  private pipelinePostIds: Map<string, string> = new Map();

  private get statusStore() {
    if (!this._statusStore) {
      this._statusStore = getPipelineStatusStore();
    }
    return this._statusStore;
  }

  /**
   * Start the visual pipeline
   */
  async startVisualPipeline(
    input: VisualPipelineInput,
    options: StartVisualPipelineOptions = {}
  ): Promise<VisualPipelineRunResponse> {
    const pipelineId = `visual-pipe-${generateId()}`;
    const postId = input.postId ?? `direct-${generateId()}`;
    const startTime = new Date();

    logger.info('Starting visual pipeline', {
      pipelineId,
      postId,
      hasContent: !!input.content,
      options,
    });

    // Store the post ID mapping
    this.pipelinePostIds.set(pipelineId, postId);

    // Create abort controller for cancellation
    const abortController = new AbortController();
    this.abortControllers.set(pipelineId, abortController);

    // Build initial state for tracking
    const totalSteps = this.calculateTotalSteps(options);
    const initialState: PipelineState = {
      pipelineId,
      configId: 'visual-pipeline',
      configName: 'Visual Content Pipeline',
      status: PipelineStatus.PENDING,
      progress: {
        currentStep: 0,
        totalSteps,
        percentComplete: 0,
        currentStepName: 'ImageDesigner',
      },
      startedAt: startTime,
      stepStates: this.buildInitialStepStates(options),
    };

    this.statusStore.create(initialState);

    // Start async execution (don't await)
    this.executeVisualPipeline(pipelineId, input, options)
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
      postId,
      timestamp: startTime.toISOString(),
      message: 'Visual pipeline started successfully',
    };
  }

  /**
   * Execute the visual pipeline
   */
  private async executeVisualPipeline(
    pipelineId: string,
    input: VisualPipelineInput,
    options: VisualPipelineOptions
  ): Promise<VisualPipelineOutput> {
    // Update status to running
    this.statusStore.updateStatus(pipelineId, PipelineStatus.RUNNING);
    this.emit('pipeline:started', { pipelineId });

    // Run the pipeline
    const result = await runVisualPipeline(input, options);

    // Store the result
    this.pipelineResults.set(pipelineId, result);

    return result;
  }

  /**
   * Get the status of a visual pipeline
   */
  getStatus(pipelineId: string): VisualPipelineStatusResponse | null {
    const state = this.statusStore.get(pipelineId);
    if (!state) {
      return null;
    }

    const result = this.pipelineResults.get(pipelineId);
    const postId = this.pipelinePostIds.get(pipelineId) ?? 'unknown';

    return {
      pipelineId: state.pipelineId,
      postId,
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
      assets: result?.assets,
      error: state.error,
    };
  }

  /**
   * Get the output of a completed visual pipeline
   */
  getOutput(pipelineId: string): VisualPipelineOutput | null {
    return this.pipelineResults.get(pipelineId) ?? null;
  }

  /**
   * Cancel a running visual pipeline
   */
  cancel(pipelineId: string): boolean {
    const abortController = this.abortControllers.get(pipelineId);
    if (!abortController) {
      return false;
    }

    logger.info('Cancelling visual pipeline', { pipelineId });
    abortController.abort();
    this.statusStore.updateStatus(pipelineId, PipelineStatus.CANCELLED, 'Pipeline was cancelled');
    this.emit('pipeline:cancelled', { pipelineId });
    return true;
  }

  /**
   * Get all visual pipeline statuses
   */
  getAllStatuses(): VisualPipelineStatusResponse[] {
    return this.statusStore
      .getAll()
      .filter((state) => state.configId === 'visual-pipeline')
      .map((state) => this.transformStateToResponse(state));
  }

  /**
   * Get visual pipelines by status
   */
  getByStatus(status: PipelineStatus): VisualPipelineStatusResponse[] {
    return this.statusStore
      .getByStatus(status)
      .filter((state) => state.configId === 'visual-pipeline')
      .map((state) => this.transformStateToResponse(state));
  }

  /**
   * Check if any visual pipeline is currently running
   */
  isRunning(): boolean {
    return this.statusStore
      .getByStatus(PipelineStatus.RUNNING)
      .some((state) => state.configId === 'visual-pipeline');
  }

  /**
   * Handle pipeline completion
   */
  private handlePipelineComplete(pipelineId: string, result: VisualPipelineOutput): void {
    this.statusStore.complete(pipelineId, result);
    logger.info('Visual pipeline completed successfully', {
      pipelineId,
      assetCount: result.assets.length,
      processingTimeMs: result.metadata.processingTimeMs,
    });
    this.emit('pipeline:completed', { pipelineId, result });
  }

  /**
   * Handle pipeline error
   */
  private handlePipelineError(pipelineId: string, error: Error): void {
    const errorMsg = error.message ?? 'Unknown error';
    this.statusStore.fail(pipelineId, errorMsg);
    logger.error('Visual pipeline failed', { pipelineId, error: errorMsg });
    this.emit('pipeline:failed', { pipelineId, error: errorMsg });
  }

  /**
   * Calculate total steps based on options
   */
  private calculateTotalSteps(options: VisualPipelineOptions): number {
    let steps = 1; // ImageDesigner always runs
    if (options.gerarCarousel !== false) steps++;
    if (options.gerarPdf !== false && options.gerarCarousel !== false) steps++;
    return steps;
  }

  /**
   * Build initial step states based on options
   */
  private buildInitialStepStates(options: VisualPipelineOptions) {
    const steps = [
      { name: 'ImageDesigner', index: 0, status: StepStatus.PENDING },
    ];

    if (options.gerarCarousel !== false) {
      steps.push({ name: 'CarouselBuilder', index: 1, status: StepStatus.PENDING });
    }

    if (options.gerarPdf !== false && options.gerarCarousel !== false) {
      steps.push({ name: 'PDFMaker', index: steps.length, status: StepStatus.PENDING });
    }

    return steps;
  }

  /**
   * Transform state to response format
   */
  private transformStateToResponse(state: PipelineState): VisualPipelineStatusResponse {
    const result = this.pipelineResults.get(state.pipelineId);
    const postId = this.pipelinePostIds.get(state.pipelineId) ?? 'unknown';

    return {
      pipelineId: state.pipelineId,
      postId,
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
      assets: result?.assets,
      error: state.error,
    };
  }
}

// Singleton instance
let serviceInstance: VisualPipelineService | null = null;

/**
 * Get the visual pipeline service singleton
 */
export function getVisualPipelineService(): VisualPipelineService {
  if (!serviceInstance) {
    serviceInstance = new VisualPipelineService();
  }
  return serviceInstance;
}

/**
 * Create a new visual pipeline service instance (for testing)
 */
export function createVisualPipelineService(): VisualPipelineService {
  return new VisualPipelineService();
}
