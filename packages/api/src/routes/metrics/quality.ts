// Quality Metrics Routes - Social Content Agent
// Story 4.6: Quality Gate e Threshold

import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type {
  QualityMetrics,
  MetricsPeriod,
  ScoreDistribution,
  PostApprovalStatus,
} from '@social-content/shared';
import {
  createQualityMetricsService,
  type IPostRepository,
  type PostForQualityGate,
} from '@social-content/agents';

interface GetMetricsQuery {
  period?: MetricsPeriod;
}

interface MetricsResponse extends QualityMetrics {
  cached: boolean;
}

interface DistributionResponse {
  distribution: ScoreDistribution;
  totalPosts: number;
  labels: string[];
  calculatedAt: Date;
}

interface ErrorResponse {
  error: string;
  message: string;
}

// Simple in-memory cache
interface CacheEntry {
  data: QualityMetrics;
  timestamp: number;
}

const metricsCache = new Map<MetricsPeriod, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Valid periods
const VALID_PERIODS: MetricsPeriod[] = ['24h', '7d', '30d', 'all'];

/**
 * Mock post repository for development
 * In production, this would be replaced with actual database repository
 */
class MockPostRepository implements IPostRepository {
  private readonly mockPosts: PostForQualityGate[] = [
    // Generate some mock data for testing
    ...Array.from({ length: 10 }, (_, i) => ({
      id: `post-${i + 1}`,
      qaScore: 5 + Math.random() * 5,
      approvalStatus: (Math.random() > 0.3
        ? 'approved'
        : 'needs_review') as PostApprovalStatus,
      regenerationCount: Math.floor(Math.random() * 2),
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    })),
  ];

  async findByDateRange(
    since: Date | null,
    until: Date
  ): Promise<PostForQualityGate[]> {
    return this.mockPosts.filter((post) => {
      if (since && post.createdAt < since) return false;
      if (post.createdAt > until) return false;
      return true;
    });
  }

  async findByApprovalStatus(
    status: PostApprovalStatus
  ): Promise<PostForQualityGate[]> {
    return this.mockPosts.filter((post) => post.approvalStatus === status);
  }
}

/**
 * Quality metrics routes
 * Prefix: /api/metrics
 */
export const qualityMetricsRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance
) => {
  // Create metrics service with mock repository for now
  // TODO: Replace with actual repository when database is set up
  const postRepository = new MockPostRepository();
  const metricsService = createQualityMetricsService(postRepository);

  /**
   * GET /api/metrics/quality
   * Returns aggregated quality metrics for the specified period
   */
  fastify.get<{ Querystring: GetMetricsQuery; Reply: MetricsResponse | ErrorResponse }>(
    '/quality',
    async (request, reply) => {
      const period: MetricsPeriod = request.query.period || '7d';

      // Validate period
      if (!VALID_PERIODS.includes(period)) {
        return reply.status(400).send({
          error: 'Invalid period',
          message: `Period must be one of: ${VALID_PERIODS.join(', ')}`,
        });
      }

      // Check cache
      const cached = metricsCache.get(period);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return {
          ...cached.data,
          cached: true,
        };
      }

      try {
        // Calculate metrics
        const metrics = await metricsService.calculateMetrics(period);

        // Update cache
        metricsCache.set(period, {
          data: metrics,
          timestamp: Date.now(),
        });

        return {
          ...metrics,
          cached: false,
        };
      } catch (error) {
        fastify.log.error({ error }, 'Failed to calculate quality metrics');
        return reply.status(500).send({
          error: 'Metrics calculation failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * GET /api/metrics/quality/distribution
   * Returns detailed score distribution
   */
  fastify.get<{ Reply: DistributionResponse | ErrorResponse }>(
    '/quality/distribution',
    async (_request, reply) => {
      try {
        const metrics = await metricsService.calculateMetrics('all');

        return {
          distribution: metrics.scoreDistribution,
          totalPosts: metrics.totalPosts,
          labels: ['0-2', '2-4', '4-6', '6-8', '8-10'],
          calculatedAt: metrics.calculatedAt,
        };
      } catch (error) {
        fastify.log.error({ error }, 'Failed to calculate distribution');
        return reply.status(500).send({
          error: 'Distribution calculation failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * DELETE /api/metrics/quality/cache
   * Clears the metrics cache (for admin/debugging)
   */
  fastify.delete('/quality/cache', async (_request, _reply) => {
    metricsCache.clear();
    return { success: true, message: 'Metrics cache cleared' };
  });
};
