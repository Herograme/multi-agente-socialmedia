// Quality Gate Service - Social Content Agent
// Story 4.6: Quality Gate e Threshold

import {
  getQualityGateConfig,
  setQualityThreshold,
  PostApprovalStatus,
} from '@social-content/shared';

import type {
  PostForQualityGate,
  QualityGateConfig,
  QualityGateResult,
  QAResult,
  IQualityGateService,
} from './types';

/**
 * Quality Gate Service
 * Evaluates posts against configurable quality thresholds
 */
export class QualityGateService implements IQualityGateService {
  /**
   * Evaluates a post against the quality gate
   *
   * @param post - The post to evaluate
   * @param qaResult - The QA result containing the score
   * @returns Quality gate evaluation result
   */
  evaluatePost(post: PostForQualityGate, qaResult: QAResult): QualityGateResult {
    const config = getQualityGateConfig();
    const score = qaResult.overallScore;
    const status = this.getStatus(score, config.threshold);

    const canRegenerate =
      status === PostApprovalStatus.NEEDS_REVIEW &&
      config.autoRegenerate &&
      (post.regenerationCount ?? 0) < config.maxRegenerations;

    return {
      approved: status === PostApprovalStatus.APPROVED,
      status,
      score,
      threshold: config.threshold,
      feedback: this.generateFeedback(qaResult, status),
      canRegenerate,
    };
  }

  /**
   * Determines the approval status based on score and threshold
   *
   * @param score - The QA score
   * @param threshold - Optional custom threshold (uses config if not provided)
   * @returns The approval status
   */
  getStatus(score: number, threshold?: number): PostApprovalStatus {
    const actualThreshold = threshold ?? getQualityGateConfig().threshold;

    if (score >= actualThreshold) {
      return PostApprovalStatus.APPROVED;
    }
    return PostApprovalStatus.NEEDS_REVIEW;
  }

  /**
   * Checks if a post should be regenerated based on its current state
   *
   * @param post - The post to check
   * @returns Whether the post should be regenerated
   */
  shouldRegenerate(post: PostForQualityGate): boolean {
    const config = getQualityGateConfig();

    // Auto-regenerate must be enabled
    if (!config.autoRegenerate) {
      return false;
    }

    // Post must be in needs_review status
    if (post.approvalStatus !== PostApprovalStatus.NEEDS_REVIEW) {
      return false;
    }

    // Check regeneration count limit
    const regenerationCount = post.regenerationCount ?? 0;
    return regenerationCount < config.maxRegenerations;
  }

  /**
   * Updates the quality threshold at runtime
   *
   * @param newThreshold - New threshold value (0-10)
   * @returns The updated threshold value
   * @throws Error if threshold is invalid
   */
  updateThreshold(newThreshold: number): number {
    setQualityThreshold(newThreshold);
    return getQualityGateConfig().threshold;
  }

  /**
   * Gets the current quality gate configuration
   *
   * @returns Current configuration
   */
  getConfig(): QualityGateConfig {
    return getQualityGateConfig();
  }

  /**
   * Generates feedback text based on the QA result and status
   *
   * @param qaResult - The QA evaluation result
   * @param status - The determined approval status
   * @returns Feedback message
   */
  private generateFeedback(
    qaResult: QAResult,
    status: PostApprovalStatus
  ): string {
    if (status === PostApprovalStatus.APPROVED) {
      return 'Post aprovado automaticamente pelo Quality Gate.';
    }

    // Find criteria that scored below 6
    const lowScoreCriteria = qaResult.criteriaBreakdown
      .filter((c) => c.score < 6)
      .map((c) => c.name);

    if (lowScoreCriteria.length > 0) {
      return `Post requer revisao. Criterios abaixo do esperado: ${lowScoreCriteria.join(', ')}.`;
    }

    return 'Post requer revisao. Score geral abaixo do threshold.';
  }
}

/**
 * Creates a new QualityGateService instance
 */
export function createQualityGateService(): QualityGateService {
  return new QualityGateService();
}
