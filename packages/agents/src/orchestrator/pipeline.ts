/**
 * Pipeline Orchestrator
 * Orchestrates sequential execution of multiple agents in a pipeline
 */

import { EventEmitter } from 'events';
import { createLogger, generateId } from '@social-content/shared';
import type { AgentResult } from '../agents/types';
import type {
  PipelineConfig,
  PipelineContext,
  PipelineResult,
  PipelineRunOptions,
  PipelineState,
  PipelineStep,
  StepResult,
} from './types';
import { PipelineStatus, StepStatus } from './types';

const logger = createLogger('orchestrator:pipeline');

/**
 * Cleanup handler function type
 */
export type CleanupHandler = (context: PipelineContext) => Promise<void>;

/**
 * Timeout error class
 */
export class PipelineTimeoutError extends Error {
  code = 'PIPELINE_TIMEOUT';
  stepName: string;

  constructor(stepName: string, timeout: number) {
    super(`Step "${stepName}" timed out after ${timeout}ms`);
    this.name = 'PipelineTimeoutError';
    this.stepName = stepName;
  }
}

/**
 * Step execution error class
 */
export class PipelineStepError extends Error {
  code = 'PIPELINE_STEP_ERROR';
  stepName: string;
  stepIndex: number;

  constructor(stepName: string, stepIndex: number, message: string) {
    super(`Step "${stepName}" failed: ${message}`);
    this.name = 'PipelineStepError';
    this.stepName = stepName;
    this.stepIndex = stepIndex;
  }
}

/**
 * Pipeline cancelled error
 */
export class PipelineCancelledError extends Error {
  code = 'PIPELINE_CANCELLED';

  constructor() {
    super('Pipeline was cancelled');
    this.name = 'PipelineCancelledError';
  }
}

/**
 * Pipeline Orchestrator class
 * Manages sequential execution of agents with event emission and status tracking
 */
export class PipelineOrchestrator extends EventEmitter {
  private readonly config: PipelineConfig;
  private readonly defaultTimeout: number;
  private readonly defaultRetries: number;
  private readonly cleanupHandlers: Map<string, CleanupHandler> = new Map();
  private activeContexts: Map<string, PipelineContext> = new Map();

  constructor(config: PipelineConfig) {
    super();
    this.config = config;
    this.defaultTimeout = config.defaultTimeout ?? 60000;
    this.defaultRetries = config.defaultRetries ?? 0;
  }

  /**
   * Register a cleanup handler for a specific step
   */
  registerCleanupHandler(stepName: string, handler: CleanupHandler): void {
    this.cleanupHandlers.set(stepName, handler);
    logger.debug('Registered cleanup handler', { stepName });
  }

  /**
   * Unregister a cleanup handler
   */
  unregisterCleanupHandler(stepName: string): void {
    this.cleanupHandlers.delete(stepName);
  }

  /**
   * Get the pipeline configuration
   */
  getConfig(): PipelineConfig {
    return { ...this.config };
  }

  /**
   * Run the pipeline with the given initial input
   */
  async run<TInput>(
    initialInput: TInput,
    options: PipelineRunOptions = {}
  ): Promise<PipelineResult> {
    const pipelineId = options.pipelineId ?? `pipe-${generateId()}`;
    const startedAt = new Date();

    const context: PipelineContext = {
      pipelineId,
      configId: this.config.id,
      startedAt,
      currentStep: 0,
      totalSteps: this.config.steps.length,
      data: { initialInput },
      errors: [],
      metadata: options.metadata ?? {},
    };

    const stepResults: StepResult[] = [];

    logger.info('Pipeline started', {
      pipelineId,
      configId: this.config.id,
      configName: this.config.name,
      totalSteps: this.config.steps.length,
    });

    this.emit('pipeline:started', {
      pipelineId,
      configId: this.config.id,
      configName: this.config.name,
      totalSteps: this.config.steps.length,
      timestamp: startedAt,
    });

    // Track active context
    this.activeContexts.set(pipelineId, context);

    let currentOutput: unknown = initialInput;
    let finalStatus = PipelineStatus.COMPLETED;
    let finalError: string | undefined;
    let failedStepIndex = -1;

    try {
      for (let i = 0; i < this.config.steps.length; i++) {
        const step = this.config.steps[i]!;
        context.currentStep = i;

        // Check for cancellation
        if (options.abortSignal?.aborted) {
          throw new PipelineCancelledError();
        }

        // Emit progress
        const progress = Math.round((i / this.config.steps.length) * 100);
        this.emit('pipeline:progress', {
          pipelineId,
          progress,
          currentStep: step.name,
          timestamp: new Date(),
        });

        logger.debug('Starting step', {
          pipelineId,
          stepName: step.name,
          stepIndex: i,
        });

        this.emit('pipeline:step:started', {
          pipelineId,
          stepName: step.name,
          stepIndex: i,
          timestamp: new Date(),
        });

        const stepResult = await this.executeStep(step, currentOutput, context, options);
        stepResults.push(stepResult);

        if (stepResult.status === StepStatus.FAILED) {
          const error = new PipelineStepError(step.name, i, stepResult.error ?? 'Unknown error');
          context.errors.push({
            step: step.name,
            stepIndex: i,
            message: stepResult.error ?? 'Unknown error',
            code: 'STEP_EXECUTION_FAILED',
            timestamp: new Date(),
          });

          this.emit('pipeline:step:failed', {
            pipelineId,
            stepName: step.name,
            stepIndex: i,
            error: stepResult.error ?? 'Unknown error',
            timestamp: new Date(),
          });

          throw error;
        }

        // Apply transform if provided
        currentOutput = step.transform
          ? step.transform(stepResult.output)
          : stepResult.output;

        // Store step output in context
        context.data[step.name] = currentOutput;

        logger.debug('Step completed', {
          pipelineId,
          stepName: step.name,
          stepIndex: i,
          duration: stepResult.duration,
        });

        this.emit('pipeline:step:completed', {
          pipelineId,
          stepName: step.name,
          stepIndex: i,
          duration: stepResult.duration,
          output: currentOutput,
          timestamp: new Date(),
        });
      }

      // Final progress
      this.emit('pipeline:progress', {
        pipelineId,
        progress: 100,
        currentStep: 'completed',
        timestamp: new Date(),
      });

      logger.info('Pipeline completed', {
        pipelineId,
        duration: Date.now() - startedAt.getTime(),
        stepsCompleted: stepResults.length,
      });

      this.emit('pipeline:completed', {
        pipelineId,
        duration: Date.now() - startedAt.getTime(),
        output: currentOutput,
        timestamp: new Date(),
      });
    } catch (error) {
      finalStatus = error instanceof PipelineCancelledError
        ? PipelineStatus.CANCELLED
        : PipelineStatus.FAILED;

      finalError = error instanceof Error ? error.message : 'Unknown error';
      const failedStep = error instanceof PipelineStepError ? error.stepName : undefined;
      failedStepIndex = error instanceof PipelineStepError ? error.stepIndex : context.currentStep;

      logger.error('Pipeline failed', {
        pipelineId,
        error: finalError,
        failedStep,
      });

      // Run cleanup for completed steps
      await this.runCleanup(context, failedStepIndex);

      this.emit('pipeline:failed', {
        pipelineId,
        error: finalError,
        failedStep,
        timestamp: new Date(),
      });
    } finally {
      // Remove from active contexts
      this.activeContexts.delete(pipelineId);
    }

    const completedAt = new Date();

    return {
      pipelineId,
      configId: this.config.id,
      status: finalStatus,
      duration: completedAt.getTime() - startedAt.getTime(),
      startedAt,
      completedAt,
      stepResults,
      finalOutput: currentOutput,
      errors: context.errors,
      metadata: context.metadata,
    };
  }

  /**
   * Run cleanup handlers for completed steps (in reverse order)
   */
  private async runCleanup(context: PipelineContext, failedStepIndex: number): Promise<void> {
    // Run cleanup for all steps up to (but not including) the failed step
    for (let i = failedStepIndex - 1; i >= 0; i--) {
      const step = this.config.steps[i];
      if (!step) continue;

      const handler = this.cleanupHandlers.get(step.name);
      if (handler) {
        try {
          logger.debug('Running cleanup for step', {
            pipelineId: context.pipelineId,
            stepName: step.name,
            stepIndex: i,
          });
          await handler(context);
          logger.debug('Cleanup completed for step', {
            pipelineId: context.pipelineId,
            stepName: step.name,
          });
        } catch (cleanupError) {
          // Log but don't throw - cleanup errors shouldn't mask the original error
          logger.error('Cleanup failed for step', {
            pipelineId: context.pipelineId,
            stepName: step.name,
            error: cleanupError instanceof Error ? cleanupError.message : 'Unknown error',
          });
        }
      }
    }
  }

  /**
   * Get active pipeline contexts (for monitoring/debugging)
   */
  getActiveContexts(): PipelineContext[] {
    return Array.from(this.activeContexts.values());
  }

  /**
   * Check if a pipeline is currently running
   */
  isRunning(pipelineId: string): boolean {
    return this.activeContexts.has(pipelineId);
  }

  /**
   * Execute a single step with timeout and retry support
   */
  private async executeStep(
    step: PipelineStep,
    input: unknown,
    context: PipelineContext,
    options: PipelineRunOptions
  ): Promise<StepResult> {
    const timeout = step.timeout ?? this.defaultTimeout;
    const maxRetries = step.retries ?? this.defaultRetries;
    const stepStartedAt = new Date();
    let lastError: string | undefined;
    let retryCount = 0;

    while (retryCount <= maxRetries) {
      try {
        const result = await this.executeWithTimeout(
          step.agent.run(input),
          timeout,
          step.name,
          options.abortSignal
        );

        const completedAt = new Date();

        if (!result.success) {
          throw new Error(result.error ?? 'Agent execution failed');
        }

        return {
          stepName: step.name,
          stepIndex: context.currentStep,
          status: StepStatus.COMPLETED,
          output: result.data,
          duration: completedAt.getTime() - stepStartedAt.getTime(),
          startedAt: stepStartedAt,
          completedAt,
          retryCount,
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';

        if (retryCount < maxRetries) {
          logger.warn('Step failed, retrying', {
            pipelineId: context.pipelineId,
            stepName: step.name,
            retryCount: retryCount + 1,
            maxRetries,
            error: lastError,
          });
          retryCount++;
        } else {
          break;
        }
      }
    }

    const completedAt = new Date();

    return {
      stepName: step.name,
      stepIndex: context.currentStep,
      status: StepStatus.FAILED,
      error: lastError,
      duration: completedAt.getTime() - stepStartedAt.getTime(),
      startedAt: stepStartedAt,
      completedAt,
      retryCount,
    };
  }

  /**
   * Execute a promise with timeout
   */
  private async executeWithTimeout<T>(
    promise: Promise<AgentResult<T>>,
    timeout: number,
    stepName: string,
    abortSignal?: AbortSignal
  ): Promise<AgentResult<T>> {
    return new Promise<AgentResult<T>>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new PipelineTimeoutError(stepName, timeout));
      }, timeout);

      // Handle abort signal
      if (abortSignal) {
        abortSignal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new PipelineCancelledError());
        }, { once: true });
      }

      promise
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Build initial state for a pipeline run
   */
  buildInitialState(pipelineId: string): PipelineState {
    return {
      pipelineId,
      configId: this.config.id,
      configName: this.config.name,
      status: PipelineStatus.PENDING,
      progress: {
        currentStep: 0,
        totalSteps: this.config.steps.length,
        percentComplete: 0,
        currentStepName: this.config.steps[0]?.name ?? '',
      },
      startedAt: new Date(),
      stepStates: this.config.steps.map((step, index) => ({
        name: step.name,
        index,
        status: StepStatus.PENDING,
      })),
    };
  }
}
