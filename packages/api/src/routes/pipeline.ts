/**
 * Pipeline API Routes
 * REST endpoints for pipeline orchestration
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
import { PipelineStatus, type VisualPipelineOptions } from '@social-content/agents';

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

