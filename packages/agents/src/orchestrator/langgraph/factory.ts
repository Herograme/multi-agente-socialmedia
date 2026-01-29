/**
 * LangGraph Orchestrator Factory
 * Factory functions for creating pipeline orchestrator instances
 */

import { createLogger } from '@social-content/shared';
import { createPipelineGraph, runPipeline } from './pipeline-graph';
import { createMemoryCheckpointer } from './checkpointer';
import { createTransitionLogger } from './logger';
import { DEFAULT_PIPELINE_CONFIG } from './config';
import type {
  LangGraphPipelineConfig,
  LangGraphPipelineResult,
  GraphOptions,
  Orchestrator,
  OrchestratorOptions,
} from './types';
import { LangGraphPipelineStatus } from './types';

const logger = createLogger('langgraph:factory');

/**
 * Validate pipeline configuration
 */
function validateConfig(config: Partial<LangGraphPipelineConfig>): void {
  if (config.numPosts !== undefined && config.numPosts < 1) {
    throw new Error('numPosts must be at least 1');
  }

  if (config.qualityThreshold !== undefined) {
    if (config.qualityThreshold < 0 || config.qualityThreshold > 10) {
      throw new Error('qualityThreshold must be between 0 and 10');
    }
  }

  if (config.maxRetries !== undefined && config.maxRetries < 0) {
    throw new Error('maxRetries cannot be negative');
  }

  if (config.timeoutMs !== undefined && config.timeoutMs < 1000) {
    throw new Error('timeoutMs must be at least 1000ms');
  }

  if (config.platforms !== undefined && config.platforms.length === 0) {
    throw new Error('At least one platform must be specified');
  }
}

/**
 * Create an orchestrator instance
 */
export function createOrchestrator(options: OrchestratorOptions = {}): Orchestrator {
  // Validate and merge configuration
  if (options.config) {
    validateConfig(options.config);
  }

  const config: LangGraphPipelineConfig = {
    ...DEFAULT_PIPELINE_CONFIG,
    ...options.config,
  };

  // Setup graph options
  const graphOptions: GraphOptions = {
    checkpointer:
      options.enableCheckpoints !== false
        ? createMemoryCheckpointer()
        : undefined,
    logger:
      options.enableLogging !== false
        ? createTransitionLogger()
        : undefined,
    onNodeStart: options.onNodeStart as GraphOptions['onNodeStart'],
    onNodeEnd: options.onNodeEnd as GraphOptions['onNodeEnd'],
    onError: options.onError,
  };

  logger.info('Orchestrator created', {
    checkpointEnabled: options.enableCheckpoints !== false,
    loggingEnabled: options.enableLogging !== false,
    config: {
      numPosts: config.numPosts,
      platforms: config.platforms,
      includeVisual: config.includeVisual,
    },
  });

  return {
    /**
     * Run the full pipeline
     */
    async run(executionId: string): Promise<LangGraphPipelineResult> {
      logger.info('Orchestrator starting pipeline', { executionId });
      return runPipeline(executionId, config, graphOptions);
    },

    /**
     * Resume a pipeline from checkpoint
     */
    async resume(threadId: string): Promise<LangGraphPipelineResult> {
      if (!graphOptions.checkpointer) {
        throw new Error('Checkpointer not enabled - cannot resume');
      }

      logger.info('Orchestrator resuming pipeline', { threadId });

      try {
        const graph = createPipelineGraph(graphOptions);

        const result = await graph.invoke(null, {
          configurable: { thread_id: threadId },
        });

        // Calculate statistics from resumed state
        const approvedPosts = result.qaResults?.filter(
          (r: { approved: boolean }) => r.approved
        ).length ?? 0;

        const totalScore = result.qaResults?.reduce(
          (sum: number, r: { overallScore: number }) => sum + r.overallScore,
          0
        ) ?? 0;

        const averageScore =
          result.qaResults?.length > 0
            ? totalScore / result.qaResults.length
            : 0;

        return {
          executionId: result.executionId ?? threadId,
          status: result.status ?? LangGraphPipelineStatus.COMPLETED,
          posts: result.posts ?? [],
          qaResults: result.qaResults ?? [],
          stats: {
            totalGenerated: result.posts?.length ?? 0,
            totalApproved: approvedPosts,
            averageScore: Math.round(averageScore * 10) / 10,
            durationMs: 0, // Cannot calculate for resumed pipelines
          },
          errors: result.errors ?? [],
        };
      } catch (error) {
        logger.error('Pipeline resume failed', {
          threadId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        return {
          executionId: threadId,
          status: LangGraphPipelineStatus.FAILED,
          posts: [],
          qaResults: [],
          stats: {
            totalGenerated: 0,
            totalApproved: 0,
            averageScore: 0,
            durationMs: 0,
          },
          errors: [
            {
              node: 'resume',
              message: error instanceof Error ? error.message : 'Resume failed',
              code: 'RESUME_FAILED',
              timestamp: new Date(),
              retriable: false,
            },
          ],
        };
      }
    },

    /**
     * Get current configuration
     */
    getConfig(): LangGraphPipelineConfig {
      return { ...config };
    },
  };
}

/**
 * Create a configured pipeline graph directly
 */
export function createConfiguredGraph(options: OrchestratorOptions = {}) {
  if (options.config) {
    validateConfig(options.config);
  }

  const graphOptions: GraphOptions = {
    checkpointer:
      options.enableCheckpoints !== false
        ? createMemoryCheckpointer()
        : undefined,
    logger:
      options.enableLogging !== false
        ? createTransitionLogger()
        : undefined,
    onNodeStart: options.onNodeStart as GraphOptions['onNodeStart'],
    onNodeEnd: options.onNodeEnd as GraphOptions['onNodeEnd'],
    onError: options.onError,
  };

  return createPipelineGraph(graphOptions);
}

/**
 * Create default orchestrator with minimal configuration
 */
export function createDefaultOrchestrator(): Orchestrator {
  return createOrchestrator();
}

/**
 * Create orchestrator for testing (no checkpointing, minimal logging)
 */
export function createTestOrchestrator(
  configOverrides?: Partial<LangGraphPipelineConfig>
): Orchestrator {
  return createOrchestrator({
    config: {
      ...configOverrides,
      numPosts: configOverrides?.numPosts ?? 1,
      maxRetries: configOverrides?.maxRetries ?? 0,
      timeoutMs: configOverrides?.timeoutMs ?? 30000,
    },
    enableCheckpoints: false,
    enableLogging: false,
  });
}

/**
 * Helper to generate a unique execution ID
 */
export function generateExecutionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `exec-${timestamp}-${random}`;
}
