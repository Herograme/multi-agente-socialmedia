/**
 * ScoreCalculator Tests
 */

import { describe, it, expect } from 'vitest';
import {
  ScoreCalculator,
  getDefaultWeights,
  getImprovementSuggestions,
} from '../../agents/qa-analyst/score-calculator';
import { QACriterion, FeedbackSeverity } from '../../agents/qa-analyst/types';
import type { CriteriaScore } from '../../agents/qa-analyst/types';

describe('ScoreCalculator', () => {
  describe('calculateWeightedScore', () => {
    it('should calculate weighted average', () => {
      const calculator = new ScoreCalculator();
      const scores: CriteriaScore[] = [
        { criterion: QACriterion.CLARITY, score: 8.0, weight: 0.5 },
        { criterion: QACriterion.RELEVANCE, score: 6.0, weight: 0.5 },
      ];

      const result = calculator.calculateWeightedScore(scores);

      expect(result).toBe(7.0);
    });

    it('should handle empty scores array', () => {
      const calculator = new ScoreCalculator();
      const result = calculator.calculateWeightedScore([]);

      expect(result).toBe(0);
    });

    it('should handle single score', () => {
      const calculator = new ScoreCalculator();
      const scores: CriteriaScore[] = [{ criterion: QACriterion.CLARITY, score: 8.5, weight: 1.0 }];

      const result = calculator.calculateWeightedScore(scores);

      expect(result).toBe(8.5);
    });

    it('should use score weight when > 0', () => {
      const calculator = new ScoreCalculator();
      const scores: CriteriaScore[] = [
        { criterion: QACriterion.CLARITY, score: 10.0, weight: 0.8 },
        { criterion: QACriterion.RELEVANCE, score: 5.0, weight: 0.2 },
      ];

      const result = calculator.calculateWeightedScore(scores);

      // (10 * 0.8 + 5 * 0.2) / 1.0 = 9.0
      expect(result).toBe(9.0);
    });

    it('should fallback to default weight when score weight is 0', () => {
      const calculator = new ScoreCalculator({
        [QACriterion.CLARITY]: 0.6,
        [QACriterion.RELEVANCE]: 0.4,
      });
      const scores: CriteriaScore[] = [
        { criterion: QACriterion.CLARITY, score: 10.0, weight: 0 },
        { criterion: QACriterion.RELEVANCE, score: 5.0, weight: 0 },
      ];

      const result = calculator.calculateWeightedScore(scores);

      // (10 * 0.6 + 5 * 0.4) / 1.0 = 8.0
      expect(result).toBe(8.0);
    });

    it('should round to one decimal place', () => {
      const calculator = new ScoreCalculator();
      const scores: CriteriaScore[] = [
        { criterion: QACriterion.CLARITY, score: 7.333, weight: 0.5 },
        { criterion: QACriterion.RELEVANCE, score: 8.666, weight: 0.5 },
      ];

      const result = calculator.calculateWeightedScore(scores);

      // Average: 7.9995, rounded to 8.0
      expect(result).toBeCloseTo(8.0, 1);
    });

    it('should handle scores with mixed weights', () => {
      const calculator = new ScoreCalculator();
      const scores: CriteriaScore[] = [
        { criterion: QACriterion.CLARITY, score: 9.0, weight: 0.3 },
        { criterion: QACriterion.RELEVANCE, score: 7.0, weight: 0.5 },
        { criterion: QACriterion.ENGAGEMENT, score: 5.0, weight: 0.2 },
      ];

      const result = calculator.calculateWeightedScore(scores);

      // (9 * 0.3 + 7 * 0.5 + 5 * 0.2) / 1.0 = 7.2
      expect(result).toBe(7.2);
    });
  });

  describe('generateFeedback', () => {
    it('should generate feedback for scores below threshold', () => {
      const calculator = new ScoreCalculator();
      const scores: CriteriaScore[] = [
        { criterion: QACriterion.CLARITY, score: 5.5, weight: 0.3 },
        { criterion: QACriterion.GRAMMAR, score: 8.0, weight: 0.3 },
      ];

      const feedback = calculator.generateFeedback(scores, 7.0);

      expect(feedback).toHaveLength(1);
      expect(feedback[0].criterion).toBe(QACriterion.CLARITY);
    });

    it('should not generate feedback for scores at or above threshold', () => {
      const calculator = new ScoreCalculator();
      const scores: CriteriaScore[] = [
        { criterion: QACriterion.CLARITY, score: 7.0, weight: 0.3 },
        { criterion: QACriterion.GRAMMAR, score: 8.0, weight: 0.3 },
      ];

      const feedback = calculator.generateFeedback(scores, 7.0);

      expect(feedback).toHaveLength(0);
    });

    it('should assign CRITICAL severity for scores < 3', () => {
      const calculator = new ScoreCalculator();
      const scores: CriteriaScore[] = [{ criterion: QACriterion.CLARITY, score: 2.0, weight: 0.25 }];

      const feedback = calculator.generateFeedback(scores, 7.0);

      expect(feedback[0].severity).toBe(FeedbackSeverity.CRITICAL);
    });

    it('should assign HIGH severity for scores 3-4.9', () => {
      const calculator = new ScoreCalculator();
      const scores: CriteriaScore[] = [{ criterion: QACriterion.CLARITY, score: 4.5, weight: 0.25 }];

      const feedback = calculator.generateFeedback(scores, 7.0);

      expect(feedback[0].severity).toBe(FeedbackSeverity.HIGH);
    });

    it('should assign MEDIUM severity for scores 5-5.9', () => {
      const calculator = new ScoreCalculator();
      const scores: CriteriaScore[] = [{ criterion: QACriterion.CLARITY, score: 5.5, weight: 0.25 }];

      const feedback = calculator.generateFeedback(scores, 7.0);

      expect(feedback[0].severity).toBe(FeedbackSeverity.MEDIUM);
    });

    it('should assign LOW severity for scores 6-6.9', () => {
      const calculator = new ScoreCalculator();
      const scores: CriteriaScore[] = [{ criterion: QACriterion.CLARITY, score: 6.5, weight: 0.25 }];

      const feedback = calculator.generateFeedback(scores, 7.0);

      expect(feedback[0].severity).toBe(FeedbackSeverity.LOW);
    });

    it('should sort feedback by severity (most critical first)', () => {
      const calculator = new ScoreCalculator();
      const scores: CriteriaScore[] = [
        { criterion: QACriterion.CLARITY, score: 6.0, weight: 0.25 },
        { criterion: QACriterion.GRAMMAR, score: 2.0, weight: 0.25 },
        { criterion: QACriterion.ENGAGEMENT, score: 4.0, weight: 0.25 },
      ];

      const feedback = calculator.generateFeedback(scores, 7.0);

      expect(feedback).toHaveLength(3);
      expect(feedback[0].severity).toBe(FeedbackSeverity.CRITICAL);
      expect(feedback[1].severity).toBe(FeedbackSeverity.HIGH);
      expect(feedback[2].severity).toBe(FeedbackSeverity.LOW);
    });

    it('should use score feedback when available', () => {
      const calculator = new ScoreCalculator();
      const scores: CriteriaScore[] = [
        {
          criterion: QACriterion.CLARITY,
          score: 5.0,
          weight: 0.25,
          feedback: 'Custom feedback from evaluator',
        },
      ];

      const feedback = calculator.generateFeedback(scores, 7.0);

      expect(feedback[0].suggestion).toBe('Custom feedback from evaluator');
    });

    it('should use default suggestion when no score feedback', () => {
      const calculator = new ScoreCalculator();
      const scores: CriteriaScore[] = [{ criterion: QACriterion.CLARITY, score: 5.0, weight: 0.25 }];

      const feedback = calculator.generateFeedback(scores, 7.0);

      expect(feedback[0].suggestion).toBeDefined();
      expect(feedback[0].suggestion.length).toBeGreaterThan(0);
    });

    it('should include example suggestion when available', () => {
      const calculator = new ScoreCalculator();
      const scores: CriteriaScore[] = [{ criterion: QACriterion.CLARITY, score: 5.0, weight: 0.25 }];

      const feedback = calculator.generateFeedback(scores, 7.0);

      expect(feedback[0].example).toBeDefined();
    });
  });

  describe('determineApproval', () => {
    it('should approve when score >= threshold', () => {
      const calculator = new ScoreCalculator();

      expect(calculator.determineApproval(6.5, 6.0)).toBe(true);
      expect(calculator.determineApproval(6.0, 6.0)).toBe(true);
      expect(calculator.determineApproval(10.0, 6.0)).toBe(true);
    });

    it('should reject when score < threshold', () => {
      const calculator = new ScoreCalculator();

      expect(calculator.determineApproval(5.9, 6.0)).toBe(false);
      expect(calculator.determineApproval(0, 6.0)).toBe(false);
    });

    it('should work with different thresholds', () => {
      const calculator = new ScoreCalculator();

      expect(calculator.determineApproval(7.0, 7.5)).toBe(false);
      expect(calculator.determineApproval(7.5, 7.5)).toBe(true);
      expect(calculator.determineApproval(8.0, 7.5)).toBe(true);
    });
  });

  describe('generateSummary', () => {
    it('should generate approval summary with no feedback', () => {
      const calculator = new ScoreCalculator();
      const summary = calculator.generateSummary(8.5, true, []);

      expect(summary).toContain('aprovado');
      expect(summary).toContain('8.5');
      expect(summary).toContain('excelente');
    });

    it('should generate approval summary with feedback', () => {
      const calculator = new ScoreCalculator();
      const feedback = [
        {
          criterion: QACriterion.CLARITY,
          score: 6.5,
          severity: FeedbackSeverity.LOW,
          suggestion: 'Test',
        },
      ];

      const summary = calculator.generateSummary(7.0, true, feedback);

      expect(summary).toContain('aprovado');
      expect(summary).toContain('1 ponto');
    });

    it('should generate rejection summary with critical issues', () => {
      const calculator = new ScoreCalculator();
      const feedback = [
        {
          criterion: QACriterion.CLARITY,
          score: 2.0,
          severity: FeedbackSeverity.CRITICAL,
          suggestion: 'Test',
        },
        {
          criterion: QACriterion.GRAMMAR,
          score: 2.5,
          severity: FeedbackSeverity.CRITICAL,
          suggestion: 'Test',
        },
      ];

      const summary = calculator.generateSummary(3.0, false, feedback);

      expect(summary).toContain('reprovado');
      expect(summary).toContain('critico');
      expect(summary).toContain('2');
    });

    it('should generate rejection summary with high issues', () => {
      const calculator = new ScoreCalculator();
      const feedback = [
        {
          criterion: QACriterion.CLARITY,
          score: 4.0,
          severity: FeedbackSeverity.HIGH,
          suggestion: 'Test',
        },
      ];

      const summary = calculator.generateSummary(4.5, false, feedback);

      expect(summary).toContain('reprovado');
      expect(summary).toContain('importante');
    });

    it('should generate generic rejection summary', () => {
      const calculator = new ScoreCalculator();
      const feedback = [
        {
          criterion: QACriterion.CLARITY,
          score: 6.0,
          severity: FeedbackSeverity.LOW,
          suggestion: 'Test',
        },
      ];

      const summary = calculator.generateSummary(5.5, false, feedback);

      expect(summary).toContain('reprovado');
      expect(summary).toContain('Revise');
    });
  });

  describe('getWeights', () => {
    it('should return current weights', () => {
      const customWeights = {
        [QACriterion.CLARITY]: 0.5,
        [QACriterion.RELEVANCE]: 0.5,
      };
      const calculator = new ScoreCalculator(customWeights);

      const weights = calculator.getWeights();

      expect(weights[QACriterion.CLARITY]).toBe(0.5);
      expect(weights[QACriterion.RELEVANCE]).toBe(0.5);
    });

    it('should return a copy, not the original', () => {
      const calculator = new ScoreCalculator();
      const weights1 = calculator.getWeights();
      const weights2 = calculator.getWeights();

      weights1[QACriterion.CLARITY] = 0.9;

      expect(weights2[QACriterion.CLARITY]).toBe(0.15);
    });
  });
});

describe('getDefaultWeights', () => {
  it('should return default weights for all criteria', () => {
    const weights = getDefaultWeights();

    expect(weights[QACriterion.CLARITY]).toBe(0.15);
    expect(weights[QACriterion.RELEVANCE]).toBe(0.2);
    expect(weights[QACriterion.ENGAGEMENT]).toBe(0.15);
    expect(weights[QACriterion.GRAMMAR]).toBe(0.1);
    expect(weights[QACriterion.CODE_SYNTAX]).toBe(0.1);
    expect(weights[QACriterion.CODE_EXPLANATION]).toBe(0.1);
    expect(weights[QACriterion.VISUAL_LEGIBILITY]).toBe(0.08);
    expect(weights[QACriterion.VISUAL_CONTRAST]).toBe(0.06);
    expect(weights[QACriterion.VISUAL_COMPOSITION]).toBe(0.06);
  });

  it('should sum to approximately 1.0', () => {
    const weights = getDefaultWeights();
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);

    expect(total).toBeCloseTo(1.0, 2);
  });

  it('should return a copy, not the original', () => {
    const weights1 = getDefaultWeights();
    const weights2 = getDefaultWeights();

    weights1[QACriterion.CLARITY] = 0.9;

    expect(weights2[QACriterion.CLARITY]).toBe(0.15);
  });
});

describe('getImprovementSuggestions', () => {
  it('should return suggestions for all criteria', () => {
    const criteria = Object.values(QACriterion);

    for (const criterion of criteria) {
      const suggestions = getImprovementSuggestions(criterion);
      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
    }
  });

  it('should return array of strings', () => {
    const suggestions = getImprovementSuggestions(QACriterion.CLARITY);

    expect(Array.isArray(suggestions)).toBe(true);
    suggestions.forEach((s) => {
      expect(typeof s).toBe('string');
    });
  });

  it('should return a copy, not the original', () => {
    const suggestions1 = getImprovementSuggestions(QACriterion.CLARITY);
    const suggestions2 = getImprovementSuggestions(QACriterion.CLARITY);

    suggestions1[0] = 'Modified';

    expect(suggestions2[0]).not.toBe('Modified');
  });

  it('should return meaningful suggestions for each criterion', () => {
    expect(getImprovementSuggestions(QACriterion.CLARITY)[0]).toContain('Simplifique');
    expect(getImprovementSuggestions(QACriterion.RELEVANCE)[0]).toContain('praticos');
    expect(getImprovementSuggestions(QACriterion.ENGAGEMENT)[0]).toContain('hook');
    expect(getImprovementSuggestions(QACriterion.GRAMMAR)[0]).toContain('concordancia');
    expect(getImprovementSuggestions(QACriterion.CODE_SYNTAX)[0]).toContain('compila');
    expect(getImprovementSuggestions(QACriterion.CODE_EXPLANATION)[0]).toContain('comentarios');
    expect(getImprovementSuggestions(QACriterion.VISUAL_LEGIBILITY)[0]).toContain('resolucao');
    expect(getImprovementSuggestions(QACriterion.VISUAL_CONTRAST)[0]).toContain('contraste');
    expect(getImprovementSuggestions(QACriterion.VISUAL_COMPOSITION)[0]).toContain('aspect ratio');
  });
});
