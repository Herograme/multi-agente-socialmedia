/**
 * Curador Agent API Routes
 */

import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import {
  getCuradorService,
  CuradorAlreadyRunningError,
  NoTrendsAvailableError,
  type CuradorOptions,
  type Platform,
  type PersistedCuradorResult,
  type CuradorExecutionState,
} from '../../services/curador.service';

/**
 * Request body for POST /api/agents/curador/run
 */
interface RunRequestBody {
  trendIds?: string[];
  useLatestTrends?: boolean;
  platforms?: Platform[];
  language?: string;
}

/**
 * Query params for GET /api/agents/curador/results
 */
interface ResultsQueryParams {
  executionId?: string;
}

/**
 * Response for POST /api/agents/curador/run
 */
interface RunResponse {
  status: 'started';
  executionId: string;
  timestamp: string;
  message: string;
}

/**
 * Response for GET /api/agents/curador/results
 */
interface ResultsResponse {
  curatedContent: PersistedCuradorResult['curatedContent'];
  metadata: PersistedCuradorResult['metadata'];
  sourceExecution?: PersistedCuradorResult['sourceExecution'];
}

/**
 * Response for GET /api/agents/curador/status
 */
interface StatusResponse {
  status: CuradorExecutionState['status'];
  executionId?: string;
  progress?: CuradorExecutionState['progress'];
  startedAt?: string;
  endTime?: string;
  error?: string;
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
 * Valid platforms
 */
const VALID_PLATFORMS: Platform[] = ['instagram', 'linkedin', 'twitter'];

/**
 * Curador routes plugin
 */
export const curadorRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const service = getCuradorService();

  /**
   * POST /api/agents/curador/run
   * Start the curador agent execution
   */
  fastify.post<{
    Body: RunRequestBody;
    Reply: RunResponse | ErrorResponse;
  }>('/api/agents/curador/run', async (request: FastifyRequest<{ Body: RunRequestBody }>, reply: FastifyReply) => {
    const { trendIds, useLatestTrends, platforms, language } = request.body || {};

    request.log.info({ trendIds, useLatestTrends, platforms, language }, 'Starting curador agent');

    // Validate platforms if provided
    if (platforms) {
      const invalidPlatforms = platforms.filter((p) => !VALID_PLATFORMS.includes(p));
      if (invalidPlatforms.length > 0) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_PLATFORMS',
            message: `Invalid platforms: ${invalidPlatforms.join(', ')}`,
            details: { validPlatforms: VALID_PLATFORMS },
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    // Validate language if provided
    if (language !== undefined && typeof language !== 'string') {
      return reply.status(400).send({
        error: {
          code: 'INVALID_LANGUAGE',
          message: 'Language must be a string',
          timestamp: new Date().toISOString(),
        },
      });
    }

    try {
      const options: CuradorOptions = {
        trendIds,
        useLatestTrends: useLatestTrends ?? true,
        platforms,
        language,
      };

      const result = await service.startExecution(options);

      request.log.info({ executionId: result.executionId }, 'Curador agent started');

      return reply.status(202).send(result);
    } catch (error) {
      // Handle specific error types
      if (error instanceof CuradorAlreadyRunningError) {
        return reply.status(409).send({
          error: {
            code: error.code,
            message: error.message,
            details: { executionId: error.executionId },
            timestamp: new Date().toISOString(),
          },
        });
      }

      if (error instanceof NoTrendsAvailableError) {
        return reply.status(400).send({
          error: {
            code: error.code,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        });
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      request.log.error({ error: errorMessage }, 'Failed to start curador agent');

      return reply.status(500).send({
        error: {
          code: 'CURADOR_EXECUTION_ERROR',
          message: `Failed to start curador agent: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        },
      });
    }
  });

  /**
   * GET /api/agents/curador/results
   * Get curador results
   */
  fastify.get<{
    Querystring: ResultsQueryParams;
    Reply: ResultsResponse | ErrorResponse;
  }>('/api/agents/curador/results', async (request: FastifyRequest<{ Querystring: ResultsQueryParams }>, reply: FastifyReply) => {
    const { executionId } = request.query;

    request.log.info({ executionId }, 'Fetching curador results');

    try {
      const results = await service.getResults(executionId);

      if (!results) {
        return reply.status(404).send({
          error: {
            code: 'NO_RESULTS_FOUND',
            message: executionId
              ? `No results found for execution: ${executionId}`
              : 'No curador results available. Run the curador agent first.',
            timestamp: new Date().toISOString(),
          },
        });
      }

      request.log.info(
        {
          contentCount: results.curatedContent.length,
          executionId: results.metadata.executionId,
        },
        'Returning curador results'
      );

      return reply.status(200).send({
        curatedContent: results.curatedContent,
        metadata: results.metadata,
        sourceExecution: results.sourceExecution,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      request.log.error({ error: errorMessage }, 'Failed to fetch curador results');

      return reply.status(500).send({
        error: {
          code: 'RESULTS_FETCH_ERROR',
          message: `Failed to fetch curador results: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        },
      });
    }
  });

  /**
   * GET /api/agents/curador/status
   * Get the current execution status
   */
  fastify.get<{
    Reply: StatusResponse | ErrorResponse;
  }>('/api/agents/curador/status', async (request: FastifyRequest, reply: FastifyReply) => {
    request.log.debug('Fetching curador status');

    try {
      const state = service.getStatus();

      const response: StatusResponse = {
        status: state.status,
      };

      if (state.executionId) {
        response.executionId = state.executionId;
      }

      if (state.startedAt) {
        response.startedAt = state.startedAt.toISOString();
      }

      if (state.endTime) {
        response.endTime = state.endTime.toISOString();
      }

      if (state.status === 'running' || state.status === 'completed') {
        response.progress = state.progress;
      }

      if (state.error) {
        response.error = state.error;
      }

      return reply.status(200).send(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      request.log.error({ error: errorMessage }, 'Failed to fetch curador status');

      return reply.status(500).send({
        error: {
          code: 'STATUS_FETCH_ERROR',
          message: `Failed to fetch curador status: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        },
      });
    }
  });
};
