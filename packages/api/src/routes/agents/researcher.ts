/**
 * Researcher Agent API Routes
 */

import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { getResearcherService, type PersistedResult } from '../../services/researcher.service';

/**
 * Request body for POST /api/agents/researcher/run
 */
interface RunRequestBody {
  sources?: ('devto' | 'hackernews' | 'reddit')[];
  limit?: number;
}

/**
 * Response for POST /api/agents/researcher/run
 */
interface RunResponse {
  status: 'started';
  executionId: string;
  timestamp: string;
}

/**
 * Response for GET /api/agents/researcher/results
 */
interface ResultsResponse {
  trends: PersistedResult['trends'];
  metadata: PersistedResult['metadata'];
}

/**
 * Error response format
 */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
  };
}

/**
 * Researcher routes plugin
 */
export const researcherRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const service = getResearcherService();

  /**
   * POST /api/agents/researcher/run
   * Start the researcher agent execution
   */
  fastify.post<{
    Body: RunRequestBody;
    Reply: RunResponse | ErrorResponse;
  }>('/api/agents/researcher/run', async (request: FastifyRequest<{ Body: RunRequestBody }>, reply: FastifyReply) => {
    const { sources, limit } = request.body || {};

    request.log.info({ sources, limit }, 'Starting researcher agent');

    // Validate sources if provided
    if (sources) {
      const validSources = ['devto', 'hackernews', 'reddit'];
      const invalidSources = sources.filter((s) => !validSources.includes(s));
      if (invalidSources.length > 0) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_SOURCES',
            message: `Invalid sources: ${invalidSources.join(', ')}`,
            details: { validSources },
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    // Validate limit if provided
    if (limit !== undefined && (typeof limit !== 'number' || limit < 1 || limit > 100)) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_LIMIT',
          message: 'Limit must be a number between 1 and 100',
          timestamp: new Date().toISOString(),
        },
      });
    }

    try {
      // Check if already running
      if (service.isRunning()) {
        return reply.status(409).send({
          error: {
            code: 'AGENT_ALREADY_RUNNING',
            message: 'Researcher agent is already running',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const result = await service.run({ sources, limit });

      request.log.info({ executionId: result.executionId }, 'Researcher agent started');

      return reply.status(202).send(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      request.log.error({ error: errorMessage }, 'Failed to start researcher agent');

      return reply.status(500).send({
        error: {
          code: 'AGENT_START_ERROR',
          message: `Failed to start researcher agent: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        },
      });
    }
  });

  /**
   * GET /api/agents/researcher/results
   * Get the latest researcher results
   */
  fastify.get<{
    Reply: ResultsResponse | ErrorResponse;
  }>('/api/agents/researcher/results', async (request: FastifyRequest, reply: FastifyReply) => {
    request.log.info('Fetching researcher results');

    try {
      const results = await service.getLatestResults();

      if (!results) {
        return reply.status(404).send({
          error: {
            code: 'NO_RESULTS',
            message: 'No researcher results available. Run the researcher agent first.',
            timestamp: new Date().toISOString(),
          },
        });
      }

      request.log.info(
        { trendsCount: results.trends.length, executionId: results.metadata.executionId },
        'Returning researcher results'
      );

      return reply.status(200).send({
        trends: results.trends,
        metadata: results.metadata,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      request.log.error({ error: errorMessage }, 'Failed to fetch researcher results');

      return reply.status(500).send({
        error: {
          code: 'RESULTS_FETCH_ERROR',
          message: `Failed to fetch researcher results: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        },
      });
    }
  });

  /**
   * GET /api/agents/researcher/status
   * Get the current execution status
   */
  fastify.get<{
    Reply: { status: string; executionId?: string; startTime?: string; endTime?: string; error?: string } | ErrorResponse;
  }>('/api/agents/researcher/status', async (request: FastifyRequest, reply: FastifyReply) => {
    request.log.debug('Fetching researcher status');

    const state = service.getStatus();

    if (!state) {
      return reply.status(200).send({
        status: 'idle',
      });
    }

    return reply.status(200).send({
      status: state.status,
      executionId: state.executionId,
      startTime: state.startTime.toISOString(),
      endTime: state.endTime?.toISOString(),
      error: state.error,
    });
  });
};
