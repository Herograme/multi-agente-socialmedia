// Quality Metrics Service - Social Content Agent
// Story 4.6: Quality Gate e Threshold

import { PostApprovalStatus } from '@social-content/shared';

import type {
  IQualityMetricsService,
  IPostRepository,
  QualityMetrics,
  MetricsPeriod,
  ScoreDistribution,
  PostForQualityGate,
} from './types';

/**
 * Quality Metrics Service
 * Calculates aggregated quality metrics for posts
 */
export class QualityMetricsService implements IQualityMetricsService {
  constructor(private readonly postRepository: IPostRepository) {}

  /**
   * Calculates quality metrics for the specified period
   *
   * @param period - Time period for metrics calculation
   * @returns Aggregated quality metrics
   */
  async calculateMetrics(period: MetricsPeriod): Promise<QualityMetrics> {
    const posts = await this.getPostsForPeriod(period);

    if (posts.length === 0) {
      return this.emptyMetrics(period);
    }

    const approvedCount = posts.filter(
      (p) => p.approvalStatus === PostApprovalStatus.APPROVED
    ).length;

    const needsReviewCount = posts.filter(
      (p) => p.approvalStatus === PostApprovalStatus.NEEDS_REVIEW
    ).length;

    // Get scores, filtering out null/undefined
    const scores = posts
      .map((p) => p.qaScore)
      .filter((s): s is number => s !== null && s !== undefined);

    const averageScore =
      scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0;

    const approvalRate =
      posts.length > 0 ? (approvedCount / posts.length) * 100 : 0;

    return {
      totalPosts: posts.length,
      approvedCount,
      needsReviewCount,
      approvalRate: Math.round(approvalRate * 10) / 10,
      averageScore: Math.round(averageScore * 10) / 10,
      scoreDistribution: this.calculateDistribution(scores),
      period,
      calculatedAt: new Date(),
    };
  }

  /**
   * Calculates score distribution in buckets
   *
   * @param scores - Array of scores to distribute
   * @returns Distribution across buckets
   */
  private calculateDistribution(scores: number[]): ScoreDistribution {
    const distribution: ScoreDistribution = {
      '0-2': 0,
      '2-4': 0,
      '4-6': 0,
      '6-8': 0,
      '8-10': 0,
    };

    for (const score of scores) {
      if (score < 2) {
        distribution['0-2']++;
      } else if (score < 4) {
        distribution['2-4']++;
      } else if (score < 6) {
        distribution['4-6']++;
      } else if (score < 8) {
        distribution['6-8']++;
      } else {
        distribution['8-10']++;
      }
    }

    return distribution;
  }

  /**
   * Gets posts for the specified period
   *
   * @param period - Time period
   * @returns Posts within the period
   */
  private async getPostsForPeriod(
    period: MetricsPeriod
  ): Promise<PostForQualityGate[]> {
    const now = new Date();
    let since: Date | null = null;

    switch (period) {
      case '24h':
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        since = null;
        break;
    }

    return this.postRepository.findByDateRange(since, now);
  }

  /**
   * Returns empty metrics for when there are no posts
   *
   * @param period - Time period
   * @returns Empty metrics object
   */
  private emptyMetrics(period: MetricsPeriod): QualityMetrics {
    return {
      totalPosts: 0,
      approvedCount: 0,
      needsReviewCount: 0,
      approvalRate: 0,
      averageScore: 0,
      scoreDistribution: {
        '0-2': 0,
        '2-4': 0,
        '4-6': 0,
        '6-8': 0,
        '8-10': 0,
      },
      period,
      calculatedAt: new Date(),
    };
  }
}

/**
 * Creates a new QualityMetricsService instance
 *
 * @param postRepository - Repository for post data access
 */
export function createQualityMetricsService(
  postRepository: IPostRepository
): QualityMetricsService {
  return new QualityMetricsService(postRepository);
}
