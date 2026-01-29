/**
 * Executions API Routes
 * Story 4.8: Historico de Execucoes na UI
 *
 * REST endpoints for execution history and statistics.
 */

import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import {
  ExecutionStatus,
  Platform,
  PostStatus,
  type ExecutionWithDuration,
  type ExecutionWithPosts,
  type ExecutionStats,
  type PostSummary,
} from '@social-content/shared';

/**
 * Query parameters for GET /api/executions
 */
interface ExecutionQueryParams {
  period?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Route params for GET /api/executions/:id
 */
interface ExecutionIdParams {
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
  };
}

/**
 * Calculate date range from period string
 */
function getDateRange(
  period: string,
  startDate?: string,
  endDate?: string
): { start: Date; end: Date } {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  if (period === 'custom' && startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  const periodDays: Record<string, number> = {
    today: 0,
    '7days': 7,
    '30days': 30,
    '90days': 90,
  };

  const days = periodDays[period] ?? 7;
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);

  return { start, end: endOfDay };
}

// In-memory storage for demo purposes
// In production, this would be replaced with database queries
const mockExecutions: ExecutionWithDuration[] = generateMockExecutions();

/**
 * Generate mock execution data for demo
 */
function generateMockExecutions(): ExecutionWithDuration[] {
  const executions: ExecutionWithDuration[] = [];
  const now = new Date();

  for (let i = 0; i < 20; i++) {
    const startedAt = new Date(now);
    startedAt.setDate(startedAt.getDate() - Math.floor(Math.random() * 30));
    startedAt.setHours(Math.floor(Math.random() * 24));

    const duration = Math.floor(Math.random() * 300000) + 60000; // 1-6 minutes
    const finishedAt = new Date(startedAt.getTime() + duration);

    const postsGenerated = Math.floor(Math.random() * 8) + 1;
    const postsApproved = Math.floor(Math.random() * (postsGenerated + 1));

    const statuses = [
      ExecutionStatus.COMPLETED,
      ExecutionStatus.COMPLETED,
      ExecutionStatus.COMPLETED,
      ExecutionStatus.FAILED,
      ExecutionStatus.CANCELLED,
    ];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    executions.push({
      id: `exec-${(i + 1).toString().padStart(3, '0')}`,
      startedAt,
      finishedAt: status !== ExecutionStatus.RUNNING ? finishedAt : undefined,
      status,
      config: {
        numPosts: 5,
        platforms: [Platform.INSTAGRAM, Platform.LINKEDIN],
        includeVisual: true,
        qualityThreshold: 7,
        sources: ['devto', 'hackernews'],
      },
      postsGenerated,
      postsApproved,
      duration,
      averageScore: status === ExecutionStatus.COMPLETED ? Math.random() * 3 + 7 : undefined,
    });
  }

  // Sort by startedAt descending
  return executions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
}

/**
 * Generate mock posts for an execution
 */
function generateMockPosts(executionId: string, count: number): PostSummary[] {
  const topics = [
    'Como usar React 19 Server Components',
    'Best practices para TypeScript em 2026',
    'Introducao ao LangGraph para agentes AI',
    'Otimizando performance de APIs Node.js',
    'Design patterns em arquiteturas modernas',
    'Testando aplicacoes com Vitest',
    'Microservices vs Monolith em 2026',
    'AI-driven development: tendencias',
  ];

  const posts: PostSummary[] = [];

  for (let i = 0; i < count; i++) {
    const statuses = [PostStatus.APPROVED, PostStatus.APPROVED, PostStatus.REJECTED, PostStatus.PENDING];
    posts.push({
      id: `post-${executionId}-${i + 1}`,
      topic: topics[Math.floor(Math.random() * topics.length)],
      platform: Math.random() > 0.5 ? Platform.INSTAGRAM : Platform.LINKEDIN,
      score: Math.random() * 3 + 7,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      hasVisual: Math.random() > 0.3,
    });
  }

  return posts;
}

/**
 * Executions routes plugin
 */
export const executionsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * GET /api/executions
   * List executions with filters
   */
  fastify.get<{
    Querystring: ExecutionQueryParams;
    Reply: { executions: ExecutionWithDuration[] } | ErrorResponse;
  }>('/api/executions', async (
    request: FastifyRequest<{ Querystring: ExecutionQueryParams }>,
    reply: FastifyReply
  ) => {
    const {
      period = '7days',
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = request.query;

    request.log.debug({ period, status, startDate, endDate }, 'Fetching executions');

    try {
      const dateRange = getDateRange(period, startDate, endDate);

      let filtered = mockExecutions.filter((exec) => {
        const execDate = new Date(exec.startedAt);
        return execDate >= dateRange.start && execDate <= dateRange.end;
      });

      // Filter by status
      if (status && status !== 'all') {
        if (status === 'partial') {
          // Partial = completed but not all posts approved
          filtered = filtered.filter(
            (exec) =>
              exec.status === ExecutionStatus.COMPLETED &&
              exec.postsApproved < exec.postsGenerated
          );
        } else {
          filtered = filtered.filter((exec) => exec.status === status);
        }
      }

      // Paginate
      const startIndex = (page - 1) * limit;
      const paginated = filtered.slice(startIndex, startIndex + limit);

      return reply.send({ executions: paginated });
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
   * GET /api/executions/stats
   * Get aggregated statistics
   */
  fastify.get<{
    Querystring: ExecutionQueryParams;
    Reply: ExecutionStats | ErrorResponse;
  }>('/api/executions/stats', async (
    request: FastifyRequest<{ Querystring: ExecutionQueryParams }>,
    reply: FastifyReply
  ) => {
    const { period = '7days', startDate, endDate } = request.query;

    request.log.debug({ period }, 'Fetching execution stats');

    try {
      const dateRange = getDateRange(period, startDate, endDate);

      const filtered = mockExecutions.filter((exec) => {
        const execDate = new Date(exec.startedAt);
        return execDate >= dateRange.start && execDate <= dateRange.end;
      });

      // Calculate stats
      const totalExecutions = filtered.length;
      const totalPosts = filtered.reduce((sum, exec) => sum + exec.postsGenerated, 0);
      const completedExecutions = filtered.filter(
        (exec) => exec.status === ExecutionStatus.COMPLETED
      );
      const successRate = totalExecutions > 0 ? completedExecutions.length / totalExecutions : 0;

      const scoresWithValues = filtered
        .filter((exec) => exec.averageScore !== undefined)
        .map((exec) => exec.averageScore!);
      const averageScore =
        scoresWithValues.length > 0
          ? scoresWithValues.reduce((sum, s) => sum + s, 0) / scoresWithValues.length
          : 0;

      // Group by date for charts
      const scoreByDate = new Map<string, { total: number; count: number }>();
      const postsByDate = new Map<string, number>();

      filtered.forEach((exec) => {
        const dateKey = new Date(exec.startedAt).toISOString().split('T')[0];

        // Score aggregation
        if (exec.averageScore !== undefined) {
          const existing = scoreByDate.get(dateKey) || { total: 0, count: 0 };
          scoreByDate.set(dateKey, {
            total: existing.total + exec.averageScore,
            count: existing.count + 1,
          });
        }

        // Posts aggregation
        postsByDate.set(dateKey, (postsByDate.get(dateKey) || 0) + exec.postsGenerated);
      });

      const scoreOverTime = Array.from(scoreByDate.entries())
        .map(([date, { total, count }]) => ({
          date,
          averageScore: total / count,
          count,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const postsByPeriod = Array.from(postsByDate.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const stats: ExecutionStats = {
        totalExecutions,
        totalPosts,
        averageScore,
        successRate,
        scoreOverTime,
        postsByPeriod,
      };

      return reply.send(stats);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      request.log.error({ error: errorMessage }, 'Failed to fetch execution stats');

      return reply.status(500).send({
        error: {
          code: 'STATS_ERROR',
          message: `Failed to fetch stats: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        },
      });
    }
  });

  /**
   * GET /api/executions/:id
   * Get execution with posts
   */
  fastify.get<{
    Params: ExecutionIdParams;
    Reply: ExecutionWithPosts | ErrorResponse;
  }>('/api/executions/:id', async (
    request: FastifyRequest<{ Params: ExecutionIdParams }>,
    reply: FastifyReply
  ) => {
    const { id } = request.params;

    request.log.debug({ executionId: id }, 'Fetching execution details');

    const execution = mockExecutions.find((exec) => exec.id === id);

    if (!execution) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: `Execution not found: ${id}`,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Generate mock posts for this execution
    const posts = generateMockPosts(id, execution.postsGenerated);

    const executionWithPosts: ExecutionWithPosts = {
      ...execution,
      posts,
    };

    return reply.send(executionWithPosts);
  });

  /**
   * GET /api/executions/export
   * Export executions as CSV
   */
  fastify.get<{
    Querystring: ExecutionQueryParams;
  }>('/api/executions/export', async (
    request: FastifyRequest<{ Querystring: ExecutionQueryParams }>,
    reply: FastifyReply
  ) => {
    const { period = '30days', status, startDate, endDate } = request.query;

    request.log.info({ period, status }, 'Exporting executions to CSV');

    try {
      const dateRange = getDateRange(period, startDate, endDate);

      let filtered = mockExecutions.filter((exec) => {
        const execDate = new Date(exec.startedAt);
        return execDate >= dateRange.start && execDate <= dateRange.end;
      });

      // Filter by status
      if (status && status !== 'all') {
        filtered = filtered.filter((exec) => exec.status === status);
      }

      // Generate CSV
      const headers = [
        'ID',
        'Data Inicio',
        'Data Fim',
        'Duracao (s)',
        'Status',
        'Posts Gerados',
        'Posts Aprovados',
        'Score Medio',
      ];

      const statusLabels: Record<ExecutionStatus, string> = {
        [ExecutionStatus.COMPLETED]: 'Sucesso',
        [ExecutionStatus.PENDING]: 'Pendente',
        [ExecutionStatus.RUNNING]: 'Executando',
        [ExecutionStatus.FAILED]: 'Falha',
        [ExecutionStatus.CANCELLED]: 'Cancelado',
      };

      const rows = filtered.map((exec) => [
        exec.id,
        exec.startedAt.toISOString().replace('T', ' ').substring(0, 19),
        exec.finishedAt ? exec.finishedAt.toISOString().replace('T', ' ').substring(0, 19) : '',
        Math.round(exec.duration / 1000).toString(),
        statusLabels[exec.status] || exec.status,
        exec.postsGenerated.toString(),
        exec.postsApproved.toString(),
        exec.averageScore?.toFixed(2) || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map(escapeCSV).join(',')),
      ].join('\n');

      const today = new Date().toISOString().split('T')[0];

      reply.header('Content-Type', 'text/csv;charset=utf-8');
      reply.header(
        'Content-Disposition',
        `attachment; filename="executions-${today}.csv"`
      );

      return reply.send('\uFEFF' + csvContent); // BOM for Excel UTF-8
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      request.log.error({ error: errorMessage }, 'Failed to export executions');

      return reply.status(500).send({
        error: {
          code: 'EXPORT_ERROR',
          message: `Failed to export: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        },
      });
    }
  });
};

/**
 * Escape CSV value
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
