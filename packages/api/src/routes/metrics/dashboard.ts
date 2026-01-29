/**
 * Dashboard Metrics Routes
 * Story 5.3: Dashboard Principal com Metricas
 *
 * API endpoints for dashboard metrics and chart data.
 */

import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { getMetricsService } from '../../services/metrics.service';
import type { DashboardMetrics, ChartData, RecentPost } from '@social-content/shared';
import { PostStatus } from '../../database';

/**
 * Response types for route typing
 */
interface MetricsResponse {
  metrics: DashboardMetrics;
  timestamp: string;
}

interface ChartsResponse {
  chartData: ChartData;
  timestamp: string;
}

interface RecentPostsResponse {
  posts: RecentPost[];
  timestamp: string;
}

interface RecentPostsQuery {
  limit?: number;
}

/**
 * Dashboard metrics routes plugin.
 * Provides /api/dashboard/metrics and /api/dashboard/charts endpoints.
 */
export const dashboardMetricsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const metricsService = getMetricsService();

  /**
   * GET /api/dashboard/metrics
   * Returns aggregated dashboard metrics with 30-second caching.
   */
  fastify.get<{
    Reply: MetricsResponse;
  }>('/api/dashboard/metrics', async (_request, reply) => {
    const metrics = await metricsService.getDashboardMetrics();

    return reply.send({
      metrics,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * GET /api/dashboard/charts
   * Returns chart data for posts by day and score distribution.
   */
  fastify.get<{
    Reply: ChartsResponse;
  }>('/api/dashboard/charts', async (_request, reply) => {
    const chartData = await metricsService.getChartData();

    return reply.send({
      chartData,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * GET /api/dashboard/recent-posts
   * Returns the most recent posts for dashboard preview.
   */
  fastify.get<{
    Querystring: RecentPostsQuery;
    Reply: RecentPostsResponse;
  }>('/api/dashboard/recent-posts', async (request, reply) => {
    const limit = request.query.limit ?? 5;

    // Validate limit
    const safeLimit = Math.min(Math.max(1, limit), 20);

    // Get recent posts from database
    const posts = fastify.db.posts.findAll({
      limit: safeLimit,
      orderBy: 'created_at',
      orderDir: 'DESC',
    });

    // Get scores for these posts
    const recentPosts: RecentPost[] = posts.map((post) => {
      const score = fastify.db.scores.findByPostId(post.id);
      const assets = fastify.db.assets.findByPostId(post.id);

      // Determine platform based on which text is present
      const platform: 'instagram' | 'linkedin' =
        post.text_ig && post.text_ig.length > 0 ? 'instagram' : 'linkedin';

      // Find thumbnail from assets
      const thumbnailAsset = assets.find(
        (a) => a.type === 'image' || a.type === 'carousel'
      );

      // Map PostStatus enum to the expected string type
      const mapStatus = (
        status: PostStatus
      ): 'pending' | 'approved' | 'rejected' | 'needs_review' => {
        switch (status) {
          case PostStatus.APPROVED:
            return 'approved';
          case PostStatus.REJECTED:
            return 'rejected';
          case PostStatus.NEEDS_REVIEW:
            return 'needs_review';
          default:
            return 'pending';
        }
      };

      return {
        id: post.id,
        topic: post.topic,
        platform,
        score: score?.overall_score ?? null,
        status: mapStatus(post.status),
        thumbnailUrl: thumbnailAsset?.path ?? null,
        createdAt: new Date(post.created_at),
      };
    });

    return reply.send({
      posts: recentPosts,
      timestamp: new Date().toISOString(),
    });
  });
};
