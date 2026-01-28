/**
 * WeightedScorer unit tests
 * Story 2.4 - Content Ranking Algorithm
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WeightedScorer } from '../../services/ranking/scorers/weighted-scorer';

describe('WeightedScorer', () => {
  describe('weight normalization', () => {
    it('should normalize weights to sum to 1', () => {
      const scorer = new WeightedScorer({ relevance: 3, quality: 7 });
      const weights = scorer.getWeights();

      expect(weights.relevance).toBeCloseTo(0.3, 5);
      expect(weights.quality).toBeCloseTo(0.7, 5);
      expect(weights.relevance + weights.quality).toBeCloseTo(1, 5);
    });

    it('should handle equal weights', () => {
      const scorer = new WeightedScorer({ relevance: 1, quality: 1 });
      const weights = scorer.getWeights();

      expect(weights.relevance).toBe(0.5);
      expect(weights.quality).toBe(0.5);
    });

    it('should handle zero weights by defaulting to 50/50', () => {
      const scorer = new WeightedScorer({ relevance: 0, quality: 0 });
      const weights = scorer.getWeights();

      expect(weights.relevance).toBe(0.5);
      expect(weights.quality).toBe(0.5);
    });

    it('should handle one zero weight', () => {
      const scorer = new WeightedScorer({ relevance: 0, quality: 1 });
      const weights = scorer.getWeights();

      expect(weights.relevance).toBe(0);
      expect(weights.quality).toBe(1);
    });
  });

  describe('combine', () => {
    let scorer: WeightedScorer;

    beforeEach(() => {
      scorer = new WeightedScorer({ relevance: 0.5, quality: 0.5 });
    });

    it('should combine scores with equal weights', () => {
      const result = scorer.combine(0.8, 0.6);
      expect(result).toBeCloseTo(0.7, 5);
    });

    it('should return 0 when both scores are 0', () => {
      const result = scorer.combine(0, 0);
      expect(result).toBe(0);
    });

    it('should return 1 when both scores are 1', () => {
      const result = scorer.combine(1, 1);
      expect(result).toBe(1);
    });

    it('should apply unequal weights correctly', () => {
      const unequalScorer = new WeightedScorer({ relevance: 0.7, quality: 0.3 });
      const result = unequalScorer.combine(1, 0);

      // With normalized weights: 0.7/(0.7+0.3) = 0.7, 0.3/(0.7+0.3) = 0.3
      expect(result).toBeCloseTo(0.7, 5);
    });

    it('should clamp relevance score above 1', () => {
      const result = scorer.combine(1.5, 0.5);
      // 1.5 clamped to 1, so result = 0.5 * 1 + 0.5 * 0.5 = 0.75
      expect(result).toBeCloseTo(0.75, 5);
    });

    it('should clamp quality score above 1', () => {
      const result = scorer.combine(0.5, 1.5);
      // 1.5 clamped to 1, so result = 0.5 * 0.5 + 0.5 * 1 = 0.75
      expect(result).toBeCloseTo(0.75, 5);
    });

    it('should clamp negative scores to 0', () => {
      const result = scorer.combine(-0.5, 0.5);
      // -0.5 clamped to 0, so result = 0.5 * 0 + 0.5 * 0.5 = 0.25
      expect(result).toBeCloseTo(0.25, 5);
    });

    it('should handle both scores out of range', () => {
      const result = scorer.combine(-0.5, 1.5);
      // -0.5 clamped to 0, 1.5 clamped to 1, so result = 0.5 * 0 + 0.5 * 1 = 0.5
      expect(result).toBeCloseTo(0.5, 5);
    });
  });

  describe('combineWithBreakdown', () => {
    let scorer: WeightedScorer;

    beforeEach(() => {
      scorer = new WeightedScorer({ relevance: 0.6, quality: 0.4 });
    });

    it('should return detailed breakdown', () => {
      const breakdown = scorer.combineWithBreakdown(0.8, 0.6);

      expect(breakdown.relevanceComponent).toBeCloseTo(0.8 * 0.6, 5);
      expect(breakdown.qualityComponent).toBeCloseTo(0.6 * 0.4, 5);
      expect(breakdown.combined).toBeCloseTo(0.8 * 0.6 + 0.6 * 0.4, 5);
      expect(breakdown.normalizedWeights.relevance).toBeCloseTo(0.6, 5);
      expect(breakdown.normalizedWeights.quality).toBeCloseTo(0.4, 5);
    });

    it('should clamp values in breakdown', () => {
      const breakdown = scorer.combineWithBreakdown(1.5, -0.2);

      expect(breakdown.relevanceComponent).toBeCloseTo(1 * 0.6, 5);
      expect(breakdown.qualityComponent).toBeCloseTo(0 * 0.4, 5);
      expect(breakdown.combined).toBeCloseTo(0.6, 5);
    });

    it('should include normalized weights in breakdown', () => {
      const unequalScorer = new WeightedScorer({ relevance: 2, quality: 3 });
      const breakdown = unequalScorer.combineWithBreakdown(0.5, 0.5);

      expect(breakdown.normalizedWeights.relevance).toBeCloseTo(0.4, 5);
      expect(breakdown.normalizedWeights.quality).toBeCloseTo(0.6, 5);
    });
  });

  describe('getWeights', () => {
    it('should return a copy of weights', () => {
      const scorer = new WeightedScorer({ relevance: 0.6, quality: 0.4 });
      const weights1 = scorer.getWeights();
      const weights2 = scorer.getWeights();

      // Should return equal values
      expect(weights1).toEqual(weights2);

      // Should not be the same object reference
      expect(weights1).not.toBe(weights2);

      // Modifying returned object should not affect scorer
      weights1.relevance = 0.9;
      expect(scorer.getWeights().relevance).toBeCloseTo(0.6, 5);
    });
  });

  describe('edge cases', () => {
    it('should handle very small weights', () => {
      const scorer = new WeightedScorer({ relevance: 0.001, quality: 0.999 });
      const weights = scorer.getWeights();

      expect(weights.relevance + weights.quality).toBeCloseTo(1, 5);
    });

    it('should handle very large weights', () => {
      const scorer = new WeightedScorer({ relevance: 1000000, quality: 1000000 });
      const weights = scorer.getWeights();

      expect(weights.relevance).toBe(0.5);
      expect(weights.quality).toBe(0.5);
    });

    it('should produce consistent results', () => {
      const scorer = new WeightedScorer({ relevance: 0.5, quality: 0.5 });

      // Same inputs should produce same outputs
      const result1 = scorer.combine(0.7, 0.3);
      const result2 = scorer.combine(0.7, 0.3);

      expect(result1).toBe(result2);
    });
  });
});
