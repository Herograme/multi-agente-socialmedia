/**
 * Pipeline Orchestrator Types
 * Defines interfaces for agent pipeline orchestration
 */

import type { Agent } from '../agents/types';

/**
 * Pipeline execution status
 */
export enum PipelineStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Status for individual pipeline steps
 */
export enum StepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

/**
 * Error that occurred during pipeline execution
 */
export interface PipelineError {
  step: string;
  stepIndex: number;
  message: string;
  code: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

/**
 * Definition of a pipeline step
 */
export interface PipelineStep<TInput = unknown, TOutput = unknown> {
  name: string;
  agent: Agent<TInput, TOutput>;
  timeout?: number;
  retries?: number;
  /** Optional transform function to adapt output for next step */
  transform?: (output: TOutput) => unknown;
}

/**
 * Configuration for a pipeline
 */
export interface PipelineConfig {
  id: string;
  name: string;
  description?: string;
  steps: PipelineStep<unknown, unknown>[];
  /** Default timeout for steps in ms (default: 60000) */
  defaultTimeout?: number;
  /** Maximum retries per step (default: 0) */
  defaultRetries?: number;
}

/**
 * Context passed through pipeline execution
 */
export interface PipelineContext {
  /** Unique ID for this pipeline run */
  pipelineId: string;
  /** Pipeline configuration ID */
  configId: string;
  /** When the pipeline started */
  startedAt: Date;
  /** Current step index (0-based) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Data accumulated during pipeline execution */
  data: Record<string, unknown>;
  /** Errors encountered during execution */
  errors: PipelineError[];
  /** Metadata for logging and tracking */
  metadata: {
    triggeredBy?: string;
    correlationId?: string;
    [key: string]: unknown;
  };
}

/**
 * Result of a single step execution
 */
export interface StepResult<T = unknown> {
  stepName: string;
  stepIndex: number;
  status: StepStatus;
  output?: T;
  error?: string;
  duration: number;
  startedAt: Date;
  completedAt: Date;
  retryCount: number;
}

/**
 * Result of entire pipeline execution
 */
export interface PipelineResult {
  pipelineId: string;
  configId: string;
  status: PipelineStatus;
  duration: number;
  startedAt: Date;
  completedAt: Date;
  stepResults: StepResult[];
  finalOutput: unknown;
  errors: PipelineError[];
  metadata: Record<string, unknown>;
}

/**
 * Pipeline state stored in status store
 */
export interface PipelineState {
  pipelineId: string;
  configId: string;
  configName: string;
  status: PipelineStatus;
  progress: {
    currentStep: number;
    totalSteps: number;
    percentComplete: number;
    currentStepName: string;
  };
  startedAt: Date;
  completedAt?: Date;
  stepStates: StepState[];
  finalOutput?: unknown;
  error?: string;
}

/**
 * State of a single step
 */
export interface StepState {
  name: string;
  index: number;
  status: StepStatus;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  error?: string;
  output?: unknown;
}

/**
 * Events emitted by the pipeline orchestrator
 */
export interface PipelineEvents {
  'pipeline:started': {
    pipelineId: string;
    configId: string;
    configName: string;
    totalSteps: number;
    timestamp: Date;
  };
  'pipeline:step:started': {
    pipelineId: string;
    stepName: string;
    stepIndex: number;
    timestamp: Date;
  };
  'pipeline:step:completed': {
    pipelineId: string;
    stepName: string;
    stepIndex: number;
    duration: number;
    output?: unknown;
    timestamp: Date;
  };
  'pipeline:step:failed': {
    pipelineId: string;
    stepName: string;
    stepIndex: number;
    error: string;
    timestamp: Date;
  };
  'pipeline:progress': {
    pipelineId: string;
    progress: number;
    currentStep: string;
    timestamp: Date;
  };
  'pipeline:completed': {
    pipelineId: string;
    duration: number;
    output: unknown;
    timestamp: Date;
  };
  'pipeline:failed': {
    pipelineId: string;
    error: string;
    failedStep?: string;
    timestamp: Date;
  };
}

/**
 * Options for running a pipeline
 */
export interface PipelineRunOptions {
  /** Custom pipeline ID (auto-generated if not provided) */
  pipelineId?: string;
  /** Metadata to attach to the pipeline run */
  metadata?: Record<string, unknown>;
  /** Abort signal for cancellation */
  abortSignal?: AbortSignal;
}

/**
 * Adapter interface for transforming agent output to next agent input
 */
export interface PipelineAdapter<TFrom, TTo> {
  name: string;
  transform(input: TFrom): TTo;
}
