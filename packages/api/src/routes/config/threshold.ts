// Threshold Configuration Routes - Social Content Agent
// Story 4.6: Quality Gate e Threshold

import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  getQualityGateConfig,
  setQualityThreshold,
  updateQualityGateConfig,
} from '@social-content/shared';

interface UpdateThresholdBody {
  threshold: number;
}

interface UpdateConfigBody {
  threshold?: number;
  autoRegenerate?: boolean;
  maxRegenerations?: number;
}

interface ThresholdResponse {
  threshold: number;
  autoRegenerate: boolean;
  maxRegenerations: number;
}

interface UpdateThresholdResponse {
  success: boolean;
  threshold: number;
  message: string;
}

interface ErrorResponse {
  error: string;
  message: string;
}

/**
 * Threshold configuration routes
 * Prefix: /api/config
 */
export const thresholdRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance
) => {
  /**
   * GET /api/config/threshold
   * Returns current quality gate configuration
   */
  fastify.get<{ Reply: ThresholdResponse }>(
    '/threshold',
    async (_request, _reply) => {
      const config = getQualityGateConfig();
      return {
        threshold: config.threshold,
        autoRegenerate: config.autoRegenerate,
        maxRegenerations: config.maxRegenerations,
      };
    }
  );

  /**
   * PUT /api/config/threshold
   * Updates the quality threshold at runtime
   */
  fastify.put<{ Body: UpdateThresholdBody; Reply: UpdateThresholdResponse | ErrorResponse }>(
    '/threshold',
    async (request, reply) => {
      const { threshold } = request.body;

      // Validate threshold type
      if (typeof threshold !== 'number' || Number.isNaN(threshold)) {
        return reply.status(400).send({
          error: 'Invalid threshold',
          message: 'Threshold must be a number',
        });
      }

      // Validate threshold range
      if (threshold < 0 || threshold > 10) {
        return reply.status(400).send({
          error: 'Invalid threshold',
          message: 'Threshold must be between 0 and 10',
        });
      }

      // Round to 0.1 precision
      const roundedThreshold = Math.round(threshold * 10) / 10;

      try {
        const oldThreshold = getQualityGateConfig().threshold;

        setQualityThreshold(roundedThreshold);
        const newThreshold = getQualityGateConfig().threshold;

        // Log the change
        fastify.log.info({
          event: 'threshold_updated',
          oldThreshold,
          newThreshold,
        });

        return {
          success: true,
          threshold: newThreshold,
          message: `Threshold atualizado de ${oldThreshold} para ${newThreshold}`,
        };
      } catch (error) {
        fastify.log.error({ error }, 'Failed to update threshold');
        return reply.status(500).send({
          error: 'Update failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * PUT /api/config/quality-gate
   * Updates the complete quality gate configuration
   */
  fastify.put<{ Body: UpdateConfigBody; Reply: ThresholdResponse | ErrorResponse }>(
    '/quality-gate',
    async (request, reply) => {
      const { threshold, autoRegenerate, maxRegenerations } = request.body;

      // Validate threshold if provided
      if (threshold !== undefined) {
        if (typeof threshold !== 'number' || Number.isNaN(threshold)) {
          return reply.status(400).send({
            error: 'Invalid threshold',
            message: 'Threshold must be a number',
          });
        }
        if (threshold < 0 || threshold > 10) {
          return reply.status(400).send({
            error: 'Invalid threshold',
            message: 'Threshold must be between 0 and 10',
          });
        }
      }

      // Validate maxRegenerations if provided
      if (maxRegenerations !== undefined) {
        if (
          typeof maxRegenerations !== 'number' ||
          !Number.isInteger(maxRegenerations)
        ) {
          return reply.status(400).send({
            error: 'Invalid maxRegenerations',
            message: 'maxRegenerations must be an integer',
          });
        }
        if (maxRegenerations < 0 || maxRegenerations > 5) {
          return reply.status(400).send({
            error: 'Invalid maxRegenerations',
            message: 'maxRegenerations must be between 0 and 5',
          });
        }
      }

      try {
        const oldConfig = getQualityGateConfig();

        const newConfig = updateQualityGateConfig({
          threshold,
          autoRegenerate,
          maxRegenerations,
        });

        // Log the change
        fastify.log.info({
          event: 'quality_gate_config_updated',
          oldConfig,
          newConfig,
        });

        return {
          threshold: newConfig.threshold,
          autoRegenerate: newConfig.autoRegenerate,
          maxRegenerations: newConfig.maxRegenerations,
        };
      } catch (error) {
        fastify.log.error({ error }, 'Failed to update quality gate config');
        return reply.status(500).send({
          error: 'Update failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );
};
