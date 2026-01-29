/**
 * Metrics Service
 * Story 5.3: Dashboard Principal com Metricas
 *
 * Provides aggregated metrics for the dashboard with caching.
 */

import Database from 'better-sqlite3';
import { getDatabase } from '../database';
import type {
  DashboardMetrics,
  ChartData,
  PostsByDayData,
  ScoreDistributionData,
} from '@social-content/shared';

/**
 * Cache entry with expiration
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * Service for computing dashboard metrics with 30-second caching.
 */
export class MetricsService {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private readonly CACHE_TTL = 30 * 1000; // 30 seconds
  private db: Database.Database | null = null;

  /**
   * Sets the database instance to use.
   * Useful for testing with a different database.
   */
  setDatabase(db: Database.Database): void {
    this.db = db;
  }

  /**
   * Gets the database instance (custom or singleton).
   */
  private getDb(): Database.Database {
    return this.db ?? getDatabase();
  }

  /**
   * Gets aggregated dashboard metrics.
   * Returns cached data if available and not expired.
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const cached = this.getFromCache<DashboardMetrics>('dashboard_metrics');
    if (cached) return cached;

    const db = this.getDb();

    // Get today's date boundaries (in UTC)
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const todayIso = today.toISOString();

    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayIso = yesterday.toISOString();

    // Last 7 days for average calculations
    const last7Days = new Date(today);
    last7Days.setUTCDate(last7Days.getUTCDate() - 7);
    const last7DaysIso = last7Days.toISOString();

    // Previous 7 days (for comparison)
    const prev7Days = new Date(last7Days);
    prev7Days.setUTCDate(prev7Days.getUTCDate() - 7);
    const prev7DaysIso = prev7Days.toISOString();

    // Posts today
    const postsTodayRow = db
      .prepare(
        `
        SELECT COUNT(*) as count FROM posts
        WHERE created_at >= ?
      `
      )
      .get(todayIso) as { count: number };

    // Posts yesterday (for comparison)
    const postsYesterdayRow = db
      .prepare(
        `
        SELECT COUNT(*) as count FROM posts
        WHERE created_at >= ? AND created_at < ?
      `
      )
      .get(yesterdayIso, todayIso) as { count: number };

    // Average score (last 7 days)
    const avgScoreRow = db
      .prepare(
        `
        SELECT AVG(s.overall_score) as avg_score
        FROM scores s
        INNER JOIN posts p ON s.post_id = p.id
        WHERE p.created_at >= ?
      `
      )
      .get(last7DaysIso) as { avg_score: number | null };

    // Average score (previous 7 days for comparison)
    const prevAvgScoreRow = db
      .prepare(
        `
        SELECT AVG(s.overall_score) as avg_score
        FROM scores s
        INNER JOIN posts p ON s.post_id = p.id
        WHERE p.created_at >= ? AND p.created_at < ?
      `
      )
      .get(prev7DaysIso, last7DaysIso) as { avg_score: number | null };

    // Approval rate (last 7 days)
    const approvalRow = db
      .prepare(
        `
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
        FROM posts
        WHERE created_at >= ?
      `
      )
      .get(last7DaysIso) as { total: number; approved: number };

    // Approval rate (previous 7 days)
    const prevApprovalRow = db
      .prepare(
        `
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
        FROM posts
        WHERE created_at >= ? AND created_at < ?
      `
      )
      .get(prev7DaysIso, last7DaysIso) as { total: number; approved: number };

    // Average generation time (last 7 days)
    const avgTimeRow = db
      .prepare(
        `
        SELECT AVG(
          CAST((julianday(finished_at) - julianday(started_at)) * 86400000 AS INTEGER)
        ) as avg_time
        FROM executions
        WHERE status = 'completed'
          AND finished_at IS NOT NULL
          AND started_at >= ?
      `
      )
      .get(last7DaysIso) as { avg_time: number | null };

    // Average generation time (previous period)
    const prevAvgTimeRow = db
      .prepare(
        `
        SELECT AVG(
          CAST((julianday(finished_at) - julianday(started_at)) * 86400000 AS INTEGER)
        ) as avg_time
        FROM executions
        WHERE status = 'completed'
          AND finished_at IS NOT NULL
          AND started_at >= ? AND started_at < ?
      `
      )
      .get(prev7DaysIso, last7DaysIso) as { avg_time: number | null };

    // Calculate metrics
    const postsToday = postsTodayRow.count;
    const postsYesterday = postsYesterdayRow.count;
    const postsTodayChange = this.calculatePercentChange(postsToday, postsYesterday);

    const averageScore = avgScoreRow.avg_score ?? 0;
    const prevAverageScore = prevAvgScoreRow.avg_score ?? 0;
    const averageScoreChange = this.calculatePercentChange(averageScore, prevAverageScore);

    const approvalRate =
      approvalRow.total > 0 ? (approvalRow.approved / approvalRow.total) * 100 : 0;
    const prevApprovalRate =
      prevApprovalRow.total > 0 ? (prevApprovalRow.approved / prevApprovalRow.total) * 100 : 0;
    const approvalRateChange = this.calculatePercentChange(approvalRate, prevApprovalRate);

    const avgGenerationTime = avgTimeRow.avg_time ?? 0;
    const prevAvgGenerationTime = prevAvgTimeRow.avg_time ?? 0;
    const avgGenerationTimeChange = this.calculatePercentChange(
      avgGenerationTime,
      prevAvgGenerationTime
    );

    const metrics: DashboardMetrics = {
      postsToday,
      postsTodayChange: Math.round(postsTodayChange),
      averageScore: Number(averageScore.toFixed(2)),
      averageScoreChange: Math.round(averageScoreChange),
      approvalRate: Number(approvalRate.toFixed(1)),
      approvalRateChange: Math.round(approvalRateChange),
      avgGenerationTime: Math.round(avgGenerationTime),
      avgGenerationTimeChange: Math.round(avgGenerationTimeChange),
    };

    this.setCache('dashboard_metrics', metrics);
    return metrics;
  }

  /**
   * Gets chart data for posts by day and score distribution.
   * Returns cached data if available and not expired.
   */
  async getChartData(): Promise<ChartData> {
    const cached = this.getFromCache<ChartData>('chart_data');
    if (cached) return cached;

    const db = this.getDb();

    // Get last 7 days boundary
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    last7Days.setHours(0, 0, 0, 0);
    const last7DaysIso = last7Days.toISOString();

    // Posts by day with platform breakdown
    const postsByDayRows = db
      .prepare(
        `
        SELECT
          date(created_at) as date,
          COUNT(*) as count,
          SUM(CASE WHEN text_ig IS NOT NULL AND text_ig != '' THEN 1 ELSE 0 END) as instagram,
          SUM(CASE WHEN text_linkedin IS NOT NULL AND text_linkedin != '' THEN 1 ELSE 0 END) as linkedin
        FROM posts
        WHERE created_at >= ?
        GROUP BY date(created_at)
        ORDER BY date(created_at) ASC
      `
      )
      .all(last7DaysIso) as Array<{
      date: string;
      count: number;
      instagram: number;
      linkedin: number;
    }>;

    // Fill in missing days with zeros
    const postsByDay: PostsByDayData[] = this.fillMissingDays(postsByDayRows, 7);

    // Score distribution
    const scoreDistributionRows = db
      .prepare(
        `
        SELECT
          CASE
            WHEN overall_score < 2 THEN '0-2'
            WHEN overall_score < 4 THEN '2-4'
            WHEN overall_score < 6 THEN '4-6'
            WHEN overall_score < 8 THEN '6-8'
            ELSE '8-10'
          END as range,
          COUNT(*) as count
        FROM scores s
        INNER JOIN posts p ON s.post_id = p.id
        WHERE p.created_at >= ?
        GROUP BY
          CASE
            WHEN overall_score < 2 THEN '0-2'
            WHEN overall_score < 4 THEN '2-4'
            WHEN overall_score < 6 THEN '4-6'
            WHEN overall_score < 8 THEN '6-8'
            ELSE '8-10'
          END
      `
      )
      .all(last7DaysIso) as Array<{ range: string; count: number }>;

    // Calculate total for percentages and fill in missing ranges
    const totalScores = scoreDistributionRows.reduce((sum, row) => sum + row.count, 0);
    const ranges = ['0-2', '2-4', '4-6', '6-8', '8-10'];
    const scoreDistribution: ScoreDistributionData[] = ranges.map((range) => {
      const found = scoreDistributionRows.find((r) => r.range === range);
      const count = found?.count ?? 0;
      return {
        range,
        count,
        percentage: totalScores > 0 ? Number(((count / totalScores) * 100).toFixed(1)) : 0,
      };
    });

    const chartData: ChartData = {
      postsByDay,
      scoreDistribution,
    };

    this.setCache('chart_data', chartData);
    return chartData;
  }

  /**
   * Invalidates all cached metrics (call after data changes).
   */
  invalidateCache(): void {
    this.cache.clear();
  }

  /**
   * Fills in missing days with zero values.
   */
  private fillMissingDays(
    rows: Array<{ date: string; count: number; instagram: number; linkedin: number }>,
    numDays: number
  ): PostsByDayData[] {
    const result: PostsByDayData[] = [];
    const dataMap = new Map(rows.map((r) => [r.date, r]));

    const today = new Date();
    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const existing = dataMap.get(dateStr);
      result.push({
        date: dateStr,
        count: existing?.count ?? 0,
        instagram: existing?.instagram ?? 0,
        linkedin: existing?.linkedin ?? 0,
      });
    }

    return result;
  }

  /**
   * Calculates percentage change between current and previous values.
   */
  private calculatePercentChange(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  }

  /**
   * Gets data from cache if not expired.
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.data as T;
    }
    return null;
  }

  /**
   * Stores data in cache with TTL.
   */
  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.CACHE_TTL,
    });
  }
}

// Singleton instance
let metricsService: MetricsService | null = null;

/**
 * Gets the singleton metrics service instance.
 */
export function getMetricsService(): MetricsService {
  if (!metricsService) {
    metricsService = new MetricsService();
  }
  return metricsService;
}

/**
 * Resets the metrics service (for testing).
 */
export function resetMetricsService(): void {
  metricsService = null;
}
