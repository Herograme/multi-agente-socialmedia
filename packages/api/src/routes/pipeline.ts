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
import { PipelineStatus } from '@social-content/agents';

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
};
