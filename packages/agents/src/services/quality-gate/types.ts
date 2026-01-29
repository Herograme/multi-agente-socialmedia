// Quality Gate Service Types - Social Content Agent

import type {
  QualityGateConfig,
  QualityGateResult,
  QualityMetrics,
  MetricsPeriod,
  QAResult,
  PostApprovalStatus,
} from '@social-content/shared';

/**
 * Post interface for Quality Gate evaluation
 */
export interface PostForQualityGate {
  id: string;
  qaScore?: number;
  approvalStatus?: PostApprovalStatus;
  regenerationCount?: number;
  createdAt: Date;
}

/**
 * Quality Gate Service interface
 */
export interface IQualityGateService {
  /**
   * Evaluates a post and returns the Quality Gate decision
   */
  evaluatePost(post: PostForQualityGate, qaResult: QAResult): QualityGateResult;

  /**
   * Gets the approval status based on score and threshold
   */
  getStatus(score: number, threshold?: number): PostApprovalStatus;

  /**
   * Checks if a post should be regenerated
   */
  shouldRegenerate(post: PostForQualityGate): boolean;

  /**
   * Updates the threshold at runtime
   */
  updateThreshold(newThreshold: number): number;

  /**
   * Gets the current configuration
   */
  getConfig(): QualityGateConfig;
}

/**
 * Quality Metrics Service interface
 */
export interface IQualityMetricsService {
  /**
   * Calculates quality metrics for the specified period
   */
  calculateMetrics(period: MetricsPeriod): Promise<QualityMetrics>;
}

/**
 * Post repository interface for metrics calculation
 */
export interface IPostRepository {
  /**
   * Finds posts within a date range
   */
  findByDateRange(since: Date | null, until: Date): Promise<PostForQualityGate[]>;

  /**
   * Finds posts by approval status
   */
  findByApprovalStatus(status: PostApprovalStatus): Promise<PostForQualityGate[]>;
}

// Re-export types from shared for convenience
export type {
  QualityGateConfig,
  QualityGateResult,
  QualityMetrics,
  MetricsPeriod,
  QAResult,
  PostApprovalStatus,
  ScoreDistribution,
  CriteriaBreakdownItem,
} from '@social-content/shared';
