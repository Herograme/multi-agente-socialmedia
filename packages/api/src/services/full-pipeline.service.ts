/**
 * Full Pipeline Service
 * Story 4.7 - Pipeline Completo End-to-End
 *
 * Service for managing full pipeline execution lifecycle
 */

import { EventEmitter } from 'events';
import { createLogger } from '@social-content/shared';
import {
  runFullPipeline,
  type FullPipelineInput,
  type FullPipelineOptions,
  type ExecutionStatus,
  type ExecutionFilters,
  type ExecutionStats,
  type GeneratedPost,
} from '@social-content/agents';
import {
  getExecutionsRepository,
  type IExecutionsRepository,
} from '../repositories/executions.repository';
import {
  getPipelineResultsService,
  type PipelineResultsService,
} from './pipeline-results.service';
import {
  getExecutionEventBus,
  PipelineWSEvent,
  type ExecutionEventBus,
} from '../websocket/pipeline-events';

const logger = createLogger('service:full-pipeline');

/**
 * Full pipeline run response
 */
export interface FullPipelineRunResponse {
  executionId: string;
  status: 'running';
  message: string;
  statusUrl: string;
}

/**
 * Full pipeline status response
 */
export interface FullPipelineStatusResponse {
  executionId: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt?: string;
  currentStep?: string;
  progress?: number;
  config: FullPipelineOptions;
  summary?: {
    totalGenerated: number;
    totalApproved: number;
    totalNeedsReview: number;
    averageScore: number;
    scoreDistribution: {
      excellent: number;
      good: number;
      needsWork: number;
    };
    assetsGenerated: {
      backgrounds: number;
      carouselSlides: number;
      pdfs: number;
    };
  };
  posts?: GeneratedPost[];
  error?: string;
}

/**
 * Full Pipeline Service class
 */
export class FullPipelineService extends EventEmitter {
  private executionsRepo: IExecutionsRepository;
  private resultsService: PipelineResultsService;
  private eventBus: ExecutionEventBus;
  private abortControllers: Map<string, AbortController> = new Map();

  constructor(
    executionsRepo?: IExecutionsRepository,
    resultsService?: PipelineResultsService,
    eventBus?: ExecutionEventBus
  ) {
    super();
    this.executionsRepo = executionsRepo ?? getExecutionsRepository();
    this.resultsService = resultsService ?? getPipelineResultsService();
    this.eventBus = eventBus ?? getExecutionEventBus();
  }

  /**
   * Start the full pipeline execution
   */
  async startFullPipeline(
    input: FullPipelineInput,
    options: FullPipelineOptions
  ): Promise<FullPipelineRunResponse> {
    const startTime = new Date();

    logger.info('Starting full pipeline', { options });

    // Create execution record in database
    const execution = await this.executionsRepo.create({
      status: 'running',
      startedAt: startTime,
      config: JSON.stringify(options),
      progress: 0,
      currentStep: 'Pesquisador',
    });

    logger.info('Created execution record', { executionId: execution.id });

    // Create AbortController for cancellation
    const abortController = new AbortController();
    this.abortControllers.set(execution.id, abortController);

    // Emit execution started event
    this.eventBus.emitExecutionEvent(execution.id, PipelineWSEvent.EXECUTION_STARTED, {
      executionId: execution.id,
      startedAt: startTime.toISOString(),
      options,
    });

    // Run pipeline asynchronously
    this.runPipelineAsync(execution.id, input, options, abortController.signal)
      .catch((error) => {
        logger.error('Pipeline execution failed', {
          executionId: execution.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      })
      .finally(() => {
        this.abortControllers.delete(execution.id);
      });

    return {
      executionId: execution.id,
      status: 'running',
      message: 'Full pipeline started successfully',
      statusUrl: `/api/pipeline/status/${execution.id}`,
    };
  }

  /**
   * Get execution status
   */
  async getStatus(executionId: string): Promise<FullPipelineStatusResponse | null> {
    const execution = await this.executionsRepo.findById(executionId);
    if (!execution) {
      return null;
    }

    // Get posts if execution is complete
    let posts: GeneratedPost[] | undefined;
    if (execution.status === 'completed' || execution.status === 'failed') {
      posts = await this.resultsService.getPostsByExecution(executionId);
    }

    // Parse config and summary
    let config: FullPipelineOptions = {};
    let summary: FullPipelineStatusResponse['summary'];

    try {
      config = JSON.parse(execution.config);
    } catch {
      // Use empty config if parse fails
    }

    if (execution.summary) {
      try {
        summary = JSON.parse(execution.summary);
      } catch {
        // Ignore parse errors
      }
    }

    return {
      executionId: execution.id,
      status: execution.status,
      startedAt: execution.startedAt.toISOString(),
      completedAt: execution.completedAt?.toISOString(),
      currentStep: execution.currentStep,
      progress: execution.progress,
      config,
      summary,
      posts: posts?.length ? posts : undefined,
      error: execution.error,
    };
  }

  /**
   * Cancel a running execution
   */
  async cancel(executionId: string): Promise<{ success: boolean; error?: string }> {
    const abortController = this.abortControllers.get(executionId);

    if (!abortController) {
      // Check if execution exists but is not running
      const execution = await this.executionsRepo.findById(executionId);

      if (!execution) {
        return { success: false, error: 'not_found' };
      }

      if (execution.status !== 'running') {
        return { success: false, error: 'not_running' };
      }

      // Execution exists but we don't have the abort controller
      // This shouldn't happen normally
      return { success: false, error: 'not_running' };
    }

    logger.info('Cancelling execution', { executionId });

    // Trigger abort
    abortController.abort();

    // Update status in database
    await this.executionsRepo.updateStatus(executionId, 'cancelled', {
      completedAt: new Date(),
      error: 'Cancelled by user',
    });

    // Emit cancellation event
    this.eventBus.emitExecutionEvent(executionId, PipelineWSEvent.EXECUTION_CANCELLED, {
      executionId,
      cancelledAt: new Date().toISOString(),
    });

    return { success: true };
  }

  /**
   * Get all executions with filters
   */
  async getAllExecutions(filters?: ExecutionFilters): Promise<FullPipelineStatusResponse[]> {
    const executions = await this.executionsRepo.findAll(filters);

    return Promise.all(
      executions.map(async (execution) => {
        const status = await this.getStatus(execution.id);
        return status!;
      })
    );
  }

  /**
   * Get execution statistics
   */
  async getStats(): Promise<ExecutionStats> {
    return this.executionsRepo.getStats();
  }

  /**
   * Check if any execution is currently running
   */
  isRunning(): boolean {
    return this.abortControllers.size > 0;
  }

  /**
   * Run the pipeline asynchronously with progress tracking
   */
  private async runPipelineAsync(
    executionId: string,
    input: FullPipelineInput,
    options: FullPipelineOptions,
    abortSignal: AbortSignal
  ): Promise<void> {
    try {
      const result = await runFullPipeline(input, options, {
        onStepStart: (step: string, index: number, total: number) => {
          // Update database
          this.executionsRepo.updateStatus(executionId, 'running', {
            currentStep: step,
            progress: Math.round((index / total) * 100),
          });

          // Emit WebSocket event
          this.eventBus.emitExecutionEvent(
            executionId,
            PipelineWSEvent.EXECUTION_STEP_PROGRESS,
            {
              executionId,
              step,
              status: 'running',
              progress: Math.round((index / total) * 100),
            }
          );
        },

        onStepComplete: (step: string, _output: unknown) => {
          this.eventBus.emitExecutionEvent(
            executionId,
            PipelineWSEvent.EXECUTION_STEP_PROGRESS,
            {
              executionId,
              step,
              status: 'completed',
            }
          );
        },

        onStepError: (step: string, error: Error) => {
          this.eventBus.emitExecutionEvent(
            executionId,
            PipelineWSEvent.EXECUTION_STEP_PROGRESS,
            {
              executionId,
              step,
              status: 'failed',
              error: error.message,
            }
          );
        },

        onProgress: (progress: number, currentStep: string) => {
          this.eventBus.emitExecutionEvent(
            executionId,
            PipelineWSEvent.EXECUTION_PROGRESS,
            {
              executionId,
              progress,
              currentStep,
            }
          );
        },

        abortSignal,
      });

      // Save results to database
      await this.resultsService.saveResults(executionId, result);

      // Determine final status
      const finalStatus: ExecutionStatus =
        result.status === 'completed' ? 'completed' :
        result.status === 'partial' ? 'completed' : 'failed';

      // Update execution with final status and summary
      await this.executionsRepo.updateStatus(executionId, finalStatus, {
        completedAt: new Date(),
        summary: JSON.stringify(result.summary),
        progress: 100,
      });

      // Emit completion event
      this.eventBus.emitExecutionEvent(
        executionId,
        PipelineWSEvent.EXECUTION_COMPLETED,
        {
          executionId,
          completedAt: new Date().toISOString(),
          summary: result.summary,
        }
      );

      logger.info('Pipeline execution completed', {
        executionId,
        status: finalStatus,
        postsGenerated: result.posts.length,
      });
    } catch (error) {
      // Check if it was cancelled
      if (abortSignal.aborted) {
        logger.info('Pipeline was cancelled', { executionId });
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update status to failed
      await this.executionsRepo.updateStatus(executionId, 'failed', {
        completedAt: new Date(),
        error: errorMessage,
      });

      // Emit failure event
      this.eventBus.emitExecutionEvent(
        executionId,
        PipelineWSEvent.EXECUTION_FAILED,
        {
          executionId,
          failedAt: new Date().toISOString(),
          error: errorMessage,
        }
      );

      logger.error('Pipeline execution failed', {
        executionId,
        error: errorMessage,
      });

      throw error;
    }
  }
}

// Singleton instance
let instance: FullPipelineService | null = null;

/**
 * Get the full pipeline service singleton
 */
export function getFullPipelineService(): FullPipelineService {
  if (!instance) {
    instance = new FullPipelineService();
  }
  return instance;
}

/**
 * Create a new full pipeline service instance (for testing)
 */
export function createFullPipelineService(
  executionsRepo?: IExecutionsRepository,
  resultsService?: PipelineResultsService,
  eventBus?: ExecutionEventBus
): FullPipelineService {
  return new FullPipelineService(executionsRepo, resultsService, eventBus);
}

/**
 * Set the full pipeline service instance (for dependency injection)
 */
export function setFullPipelineService(service: FullPipelineService): void {
  instance = service;
}
