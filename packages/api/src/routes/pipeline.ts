/**
 * Pipeline API Routes
 * REST endpoints for pipeline orchestration
 *
 * Extended for Story 4.7 - Full Pipeline End-to-End
 */

import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import {
  getPipelineService,
  type StartPipelineOptions,
  type PipelineRunResponse,
  type PipelineStatusResponse,
} from '../services/pipeline.service';
import {
  getVisualPipelineService,
  type VisualPipelineRunResponse,
  type VisualPipelineStatusResponse,
} from '../services/visual-pipeline.service';
import {
  getFullPipelineService,
  type FullPipelineRunResponse,
  type FullPipelineStatusResponse,
} from '../services/full-pipeline.service';
import {
  PipelineStatus,
  type VisualPipelineOptions,
  type FullPipelineInput,
  type FullPipelineOptions,
  type ExecutionStatus,
} from '@social-content/agents';

/**
 * Request body for POST /api/pipeline/research-curate
 */
interface StartPipelineBody {
  sources?: Array<'devto' | 'hackernews' | 'reddit'>;
  limit?: number;
}

/**
 * Route params for GET /api/pipeline/:id/status
 */
interface PipelineIdParams {
  id: string;
}

/**
 * Error response format
 */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    timestamp: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Valid sources
 */
const VALID_SOURCES = ['devto', 'hackernews', 'reddit'] as const;

/**
 * Pipeline routes plugin
 */
export const pipelineRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const service = getPipelineService();

  /**
   * POST /api/pipeline/research-curate
   * Start the research-curate pipeline
   */
  fastify.post<{
    Body: StartPipelineBody;
    Reply: PipelineRunResponse | ErrorResponse;
  }>('/api/pipeline/research-curate', async (
    request: FastifyRequest<{ Body: StartPipelineBody }>,
    reply: FastifyReply
  ) => {
    const { sources, limit } = request.body || {};

    request.log.info({ sources, limit }, 'Starting research-curate pipeline');

    // Validate sources if provided
    if (sources) {
      const invalidSources = sources.filter((s) => !VALID_SOURCES.includes(s));
      if (invalidSources.length > 0) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_SOURCES',
            message: `Invalid sources: ${invalidSources.join(', ')}`,
            timestamp: new Date().toISOString(),
            details: { validSources: VALID_SOURCES },
          },
        });
      }
    }

    // Validate limit if provided
    if (limit !== undefined) {
      if (typeof limit !== 'number' || limit < 1 || limit > 100) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_LIMIT',
            message: 'Limit must be a number between 1 and 100',
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    try {
      const options: StartPipelineOptions = {
        sources,
        limit,
      };

      const result = await service.startResearchCurate(options);

      request.log.info({ pipelineId: result.pipelineId }, 'Pipeline started');

      return reply.status(202).send(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      request.log.error({ error: errorMessage }, 'Failed to start pipeline');

      return reply.status(500).send({
        error: {
          code: 'PIPELINE_START_ERROR',
          message: `Failed to start pipeline: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        },
      });
    }
  });

  /**
   * GET /api/pipeline/:id/status
   * Get the status of a specific pipeline
   */
  fastify.get<{
    Params: PipelineIdParams;
    Reply: PipelineStatusResponse | ErrorResponse;
  }>('/api/pipeline/:id/status', async (
    request: FastifyRequest<{ Params: PipelineIdParams }>,
    reply: FastifyReply
  ) => {
    const { id } = request.params;

    request.log.debug({ pipelineId: id }, 'Fetching pipeline status');

    const status = service.getStatus(id);

    if (!status) {
      return reply.status(404).send({
        error: {
          code: 'PIPELINE_NOT_FOUND',
          message: `Pipeline not found: ${id}`,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return reply.status(200).send(status);
  });

  /**
   * GET /api/pipeline/status
   * Get all pipeline statuses
   */
  fastify.get<{
    Querystring: { status?: PipelineStatus };
    Reply: PipelineStatusResponse[] | ErrorResponse;
  }>('/api/pipeline/status', async (
    request: FastifyRequest<{ Querystring: { status?: PipelineStatus } }>,
    reply: FastifyReply
  ) => {
    const { status } = request.query;

    request.log.debug({ status }, 'Fetching pipeline statuses');

    try {
      const statuses = status
        ? service.getByStatus(status)
        : service.getAllStatuses();

      return reply.status(200).send(statuses);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      request.log.error({ error: errorMessage }, 'Failed to fetch pipeline statuses');

      return reply.status(500).send({
        error: {
          code: 'STATUS_FETCH_ERROR',
          message: `Failed to fetch pipeline statuses: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        },
      });
    }
  });

  /**
   * POST /api/pipeline/:id/cancel
   * Cancel a running pipeline
   */
  fastify.post<{
    Params: PipelineIdParams;
    Reply: { success: boolean; message: string } | ErrorResponse;
  }>('/api/pipeline/:id/cancel', async (
    request: FastifyRequest<{ Params: PipelineIdParams }>,
    reply: FastifyReply
  ) => {
    const { id } = request.params;

    request.log.info({ pipelineId: id }, 'Cancelling pipeline');

    const cancelled = service.cancel(id);

    if (!cancelled) {
      return reply.status(404).send({
        error: {
          code: 'PIPELINE_NOT_FOUND_OR_NOT_RUNNING',
          message: `Pipeline not found or not running: ${id}`,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return reply.status(200).send({
      success: true,
      message: `Pipeline ${id} cancelled successfully`,
    });
  });

  /**
   * POST /api/pipeline/:id/retry
   * Retry a failed pipeline
   */
  fastify.post<{
    Params: PipelineIdParams;
    Reply: PipelineRunResponse | ErrorResponse;
  }>('/api/pipeline/:id/retry', async (
    request: FastifyRequest<{ Params: PipelineIdParams }>,
    reply: FastifyReply
  ) => {
    const { id } = request.params;

    request.log.info({ pipelineId: id }, 'Retrying pipeline');

    try {
      const result = await service.retry(id);

      if (!result) {
        return reply.status(404).send({
          error: {
            code: 'PIPELINE_NOT_FOUND_OR_NOT_FAILED',
            message: `Pipeline not found or not in failed state: ${id}`,
            timestamp: new Date().toISOString(),
          },
        });
      }

      return reply.status(202).send(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      request.log.error({ error: errorMessage }, 'Failed to retry pipeline');

      return reply.status(500).send({
        error: {
          code: 'PIPELINE_RETRY_ERROR',
          message: `Failed to retry pipeline: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        },
      });
    }
  });

  /**
   * GET /api/pipeline/stats
   * Get pipeline execution statistics
   */
  fastify.get<{
    Reply: { counts: Record<PipelineStatus, number>; isRunning: boolean };
  }>('/api/pipeline/stats', async (_request, reply: FastifyReply) => {
    const counts = service.getStatusCounts();
    const isRunning = service.isRunning();

    return reply.status(200).send({ counts, isRunning });
  });

  // ============================================
  // Visual Pipeline Routes (Story 3.7)
  // ============================================

  const visualService = getVisualPipelineService();

  /**
   * POST /api/pipeline/visual
   * Start the visual generation pipeline
   */
  fastify.post<{
    Body: VisualPipelineBody;
    Reply: VisualPipelineRunResponse | ErrorResponse;
  }>('/api/pipeline/visual', async (
    request: FastifyRequest<{ Body: VisualPipelineBody }>,
    reply: FastifyReply
  ) => {
    const { postId, content, options } = request.body || {};

    request.log.info({ postId, hasContent: !!content, options }, 'Starting visual pipeline');

    // Validation: need postId OR content
    if (!postId && !content) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_INPUT',
          message: 'Either postId or content must be provided',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validation: cannot have both
    if (postId && content) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_INPUT',
          message: 'Provide either postId or content, not both',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate content
    if (content) {
      if (!content.title || !content.text) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_CONTENT',
            message: 'Content must have title and text',
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    // Validate numSlides
    if (options?.numSlides !== undefined) {
      if (options.numSlides < 1 || options.numSlides > 10) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_NUM_SLIDES',
            message: 'numSlides must be between 1 and 10',
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    try {
      const result = await visualService.startVisualPipeline(
        { postId, content },
        options || {}
      );

      request.log.info({ pipelineId: result.pipelineId }, 'Visual pipeline started');

      return reply.status(202).send(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      request.log.error({ error: errorMessage }, 'Failed to start visual pipeline');

      return reply.status(500).send({
        error: {
          code: 'VISUAL_PIPELINE_ERROR',
          message: `Failed to start visual pipeline: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        },
      });
    }
  });

  /**
   * GET /api/pipeline/visual/:id/status
   * Get the status of a visual pipeline
   */
  fastify.get<{
    Params: PipelineIdParams;
    Reply: VisualPipelineStatusResponse | ErrorResponse;
  }>('/api/pipeline/visual/:id/status', async (
    request: FastifyRequest<{ Params: PipelineIdParams }>,
    reply: FastifyReply
  ) => {
    const { id } = request.params;

    request.log.debug({ pipelineId: id }, 'Fetching visual pipeline status');

    const status = visualService.getStatus(id);

    if (!status) {
      return reply.status(404).send({
        error: {
          code: 'PIPELINE_NOT_FOUND',
          message: `Visual pipeline not found: ${id}`,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return reply.status(200).send(status);
  });

  /**
   * POST /api/pipeline/visual/:id/cancel
   * Cancel a running visual pipeline
   */
  fastify.post<{
    Params: PipelineIdParams;
    Reply: { success: boolean; message: string } | ErrorResponse;
  }>('/api/pipeline/visual/:id/cancel', async (
    request: FastifyRequest<{ Params: PipelineIdParams }>,
    reply: FastifyReply
  ) => {
    const { id } = request.params;

    request.log.info({ pipelineId: id }, 'Cancelling visual pipeline');

    const cancelled = visualService.cancel(id);

    if (!cancelled) {
      return reply.status(404).send({
        error: {
          code: 'PIPELINE_NOT_FOUND_OR_NOT_RUNNING',
          message: `Visual pipeline not found or not running: ${id}`,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return reply.status(200).send({
      success: true,
      message: `Visual pipeline ${id} cancelled successfully`,
    });
  });

  /**
   * GET /api/pipeline/visual/status
   * Get all visual pipeline statuses
   */
  fastify.get<{
    Querystring: { status?: PipelineStatus };
    Reply: VisualPipelineStatusResponse[] | ErrorResponse;
  }>('/api/pipeline/visual/status', async (
    request: FastifyRequest<{ Querystring: { status?: PipelineStatus } }>,
    reply: FastifyReply
  ) => {
    const { status } = request.query;

    request.log.debug({ status }, 'Fetching visual pipeline statuses');

    try {
      const statuses = status
        ? visualService.getByStatus(status)
        : visualService.getAllStatuses();

      return reply.status(200).send(statuses);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      request.log.error({ error: errorMessage }, 'Failed to fetch visual pipeline statuses');

      return reply.status(500).send({
        error: {
          code: 'STATUS_FETCH_ERROR',
          message: `Failed to fetch visual pipeline statuses: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        },
      });
    }
  });

  // ============================================
  // Full Pipeline Routes (Story 4.7)
  // ============================================

  const fullPipelineService = getFullPipelineService();

  /**
   * POST /api/pipeline/run
   * Start the full content generation pipeline
   */
  fastify.post<{
    Body: FullPipelineBody;
    Reply: FullPipelineRunResponse | ErrorResponse;
  }>('/api/pipeline/run', async (
    request: FastifyRequest<{ Body: FullPipelineBody }>,
    reply: FastifyReply
  ) => {
    const { sources, filters, options } = request.body || {};

    request.log.info({ options }, 'Starting full pipeline execution');

    // Validate numPosts
    if (options?.numPosts !== undefined) {
      if (options.numPosts < 1 || options.numPosts > 10) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_NUM_POSTS',
            message: 'numPosts must be between 1 and 10',
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    // Validate qualityThreshold
    if (options?.qualityThreshold !== undefined) {
      if (options.qualityThreshold < 0 || options.qualityThreshold > 10) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_QUALITY_THRESHOLD',
            message: 'qualityThreshold must be between 0 and 10',
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    // Validate carouselSlides
    if (options?.carouselSlides !== undefined) {
      if (options.carouselSlides < 1 || options.carouselSlides > 10) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_CAROUSEL_SLIDES',
            message: 'carouselSlides must be between 1 and 10',
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    try {
      const input: FullPipelineInput = { sources, filters };
      const pipelineOptions: FullPipelineOptions = options || {};

      const result = await fullPipelineService.startFullPipeline(input, pipelineOptions);

      request.log.info({ executionId: result.executionId }, 'Full pipeline started');

      return reply.status(202).send(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      request.log.error({ error: errorMessage }, 'Failed to start full pipeline');

      return reply.status(500).send({
        error: {
          code: 'PIPELINE_START_ERROR',
          message: `Failed to start full pipeline: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        },
      });
    }
  });

  /**
   * GET /api/pipeline/status/:executionId
   * Get the status of a full pipeline execution
   */
  fastify.get<{
    Params: ExecutionIdParams;
    Reply: FullPipelineStatusResponse | ErrorResponse;
  }>('/api/pipeline/status/:executionId', async (
    request: FastifyRequest<{ Params: ExecutionIdParams }>,
    reply: FastifyReply
  ) => {
    const { executionId } = request.params;

    request.log.debug({ executionId }, 'Fetching full pipeline status');

    const status = await fullPipelineService.getStatus(executionId);

    if (!status) {
      return reply.status(404).send({
        error: {
          code: 'EXECUTION_NOT_FOUND',
          message: `Execution not found: ${executionId}`,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return reply.status(200).send(status);
  });

  /**
   * POST /api/pipeline/executions/:executionId/cancel
   * Cancel a running full pipeline execution
   */
  fastify.post<{
    Params: ExecutionIdParams;
    Reply: { executionId: string; status: string; message: string } | ErrorResponse;
  }>('/api/pipeline/executions/:executionId/cancel', async (
    request: FastifyRequest<{ Params: ExecutionIdParams }>,
    reply: FastifyReply
  ) => {
    const { executionId } = request.params;

    request.log.info({ executionId }, 'Cancelling full pipeline');

    const result = await fullPipelineService.cancel(executionId);

    if (!result.success) {
      if (result.error === 'not_found') {
        return reply.status(404).send({
          error: {
            code: 'EXECUTION_NOT_FOUND',
            message: `Execution not found: ${executionId}`,
            timestamp: new Date().toISOString(),
          },
        });
      }

      if (result.error === 'not_running') {
        return reply.status(400).send({
          error: {
            code: 'EXECUTION_NOT_RUNNING',
            message: `Execution is not running: ${executionId}`,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    return reply.status(200).send({
      executionId,
      status: 'cancelled',
      message: 'Execution cancelled successfully',
    });
  });

  /**
   * GET /api/pipeline/executions
   * Get all executions with optional filters
   */
  fastify.get<{
    Querystring: {
      status?: ExecutionStatus;
      limit?: number;
      offset?: number;
    };
    Reply: FullPipelineStatusResponse[] | ErrorResponse;
  }>('/api/pipeline/executions', async (
    request: FastifyRequest<{
      Querystring: {
        status?: ExecutionStatus;
        limit?: number;
        offset?: number;
      };
    }>,
    reply: FastifyReply
  ) => {
    const { status, limit, offset } = request.query;

    request.log.debug({ status, limit, offset }, 'Fetching executions');

    try {
      const executions = await fullPipelineService.getAllExecutions({
        status,
        limit,
        offset,
      });

      return reply.status(200).send(executions);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      request.log.error({ error: errorMessage }, 'Failed to fetch executions');

      return reply.status(500).send({
        error: {
          code: 'FETCH_ERROR',
          message: `Failed to fetch executions: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        },
      });
    }
  });

  /**
   * GET /api/pipeline/executions/stats
   * Get execution statistics
   */
  fastify.get<{
    Reply: { stats: Record<string, unknown> } | ErrorResponse;
  }>('/api/pipeline/executions/stats', async (
    _request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const stats = await fullPipelineService.getStats();

      return reply.status(200).send({ stats });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return reply.status(500).send({
        error: {
          code: 'STATS_ERROR',
          message: `Failed to fetch stats: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        },
      });
    }
  });
};

/**
 * Request body for POST /api/pipeline/visual
 */
interface VisualPipelineBody {
  postId?: string;
  content?: {
    title: string;
    text: string;
    codeBlocks?: Array<{ code: string; language: string }>;
    topic?: string;
  };
  options?: VisualPipelineOptions;
}

/**
 * Request body for POST /api/pipeline/run
 */
interface FullPipelineBody {
  sources?: {
    devto?: boolean;
    hackernews?: boolean;
    reddit?: boolean;
  };
  filters?: {
    minEngagement?: number;
    maxAge?: number;
    keywords?: string[];
  };
  options?: {
    numPosts?: number;
    platforms?: 'instagram' | 'linkedin' | 'both';
    includeVisual?: boolean;
    qualityThreshold?: number;
    carouselSlides?: number;
    backgroundStyle?: 'abstract' | 'gradient' | 'tech' | 'minimal';
  };
}

/**
 * Route params for execution endpoints
 */
interface ExecutionIdParams {
  executionId: string;
}
