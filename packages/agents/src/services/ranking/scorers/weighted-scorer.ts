/**
 * WeightedScorer - Combines relevance and quality scores with configurable weights
 * Story 2.4 - Content Ranking Algorithm
 */

/**
 * Configuration for weighted scoring
 */
export interface WeightedScorerConfig {
  /** Weight for relevance score */
  relevance: number;
  /** Weight for quality score */
  quality: number;
}

/**
 * Breakdown of weighted score components
 */
export interface WeightedScoreBreakdown {
  /** Weighted relevance component */
  relevanceComponent: number;
  /** Weighted quality component */
  qualityComponent: number;
  /** Final combined score */
  combined: number;
  /** Normalized weights used */
  normalizedWeights: WeightedScorerConfig;
}

/**
 * WeightedScorer combines relevance and quality scores into a single score
 * using configurable weights that are normalized to sum to 1.
 */
export class WeightedScorer {
  private readonly weights: WeightedScorerConfig;

  /**
   * Creates a new WeightedScorer
   * @param weights - Configuration with relevance and quality weights
   */
  constructor(weights: WeightedScorerConfig) {
    // Normalize weights to sum to 1
    this.weights = this.normalizeWeights(weights);
  }

  /**
   * Combines relevance and quality scores using configured weights
   * @param relevanceScore - Relevance score (0-1)
   * @param qualityScore - Quality score (0-1)
   * @returns Combined score (0-1)
   */
  combine(relevanceScore: number, qualityScore: number): number {
    // Clamp inputs to valid range
    const clampedRelevance = this.clamp(relevanceScore, 0, 1);
    const clampedQuality = this.clamp(qualityScore, 0, 1);

    return (
      clampedRelevance * this.weights.relevance +
      clampedQuality * this.weights.quality
    );
  }

  /**
   * Combines scores and returns detailed breakdown
   * @param relevanceScore - Relevance score (0-1)
   * @param qualityScore - Quality score (0-1)
   * @returns Detailed breakdown of weighted scoring
   */
  combineWithBreakdown(
    relevanceScore: number,
    qualityScore: number
  ): WeightedScoreBreakdown {
    const clampedRelevance = this.clamp(relevanceScore, 0, 1);
    const clampedQuality = this.clamp(qualityScore, 0, 1);

    const relevanceComponent = clampedRelevance * this.weights.relevance;
    const qualityComponent = clampedQuality * this.weights.quality;
    const combined = relevanceComponent + qualityComponent;

    return {
      relevanceComponent,
      qualityComponent,
      combined,
      normalizedWeights: { ...this.weights },
    };
  }

  /**
   * Normalizes weights to sum to 1
   * @param weights - Original weights
   * @returns Normalized weights
   */
  private normalizeWeights(weights: WeightedScorerConfig): WeightedScorerConfig {
    const total = weights.relevance + weights.quality;

    // Handle edge case where both weights are 0
    if (total === 0) {
      return { relevance: 0.5, quality: 0.5 };
    }

    return {
      relevance: weights.relevance / total,
      quality: weights.quality / total,
    };
  }

  /**
   * Clamps a value between min and max
   * @param value - Value to clamp
   * @param min - Minimum value
   * @param max - Maximum value
   * @returns Clamped value
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Returns the normalized weights
   */
  getWeights(): WeightedScorerConfig {
    return { ...this.weights };
  }
}
