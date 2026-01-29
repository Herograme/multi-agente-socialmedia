/**
 * TextEvaluator Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TextEvaluator, getDefaultTextWeights } from '../../agents/qa-analyst/text-evaluator';
import { QACriterion } from '../../agents/qa-analyst/types';
import type { LLMService } from '../../agents/qa-analyst/types';

// Mock LLM Service
const createMockLLMService = (score: number = 8.0, reasoning: string = 'Good quality') => ({
  generate: vi.fn().mockResolvedValue({
    content: JSON.stringify({ score, reasoning }),
  }),
});

describe('TextEvaluator', () => {
  let mockLLMService: LLMService;
  let evaluator: TextEvaluator;

  beforeEach(() => {
    mockLLMService = createMockLLMService();
    evaluator = new TextEvaluator(mockLLMService);
    vi.clearAllMocks();
  });

  describe('evaluateClarity', () => {
    it('should return CriteriaScore for clarity', async () => {
      const result = await evaluator.evaluateClarity('Test text', 'instagram');

      expect(result.criterion).toBe(QACriterion.CLARITY);
      expect(result.score).toBe(8.0);
      expect(result.weight).toBeGreaterThan(0);
      expect(mockLLMService.generate).toHaveBeenCalledTimes(1);
    });

    it('should include platform in prompt', async () => {
      await evaluator.evaluateClarity('Test text', 'linkedin');

      expect(mockLLMService.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('linkedin'),
            }),
          ]),
        })
      );
    });

    it('should not include feedback for high scores', async () => {
      const result = await evaluator.evaluateClarity('Test text', 'instagram');

      expect(result.feedback).toBeUndefined();
    });

    it('should include feedback for low scores', async () => {
      const lowScoreLLM = createMockLLMService(5.0, 'Text is unclear');
      const lowScoreEvaluator = new TextEvaluator(lowScoreLLM);

      const result = await lowScoreEvaluator.evaluateClarity('Confusing text', 'instagram');

      expect(result.score).toBe(5.0);
      expect(result.feedback).toBe('Text is unclear');
    });
  });

  describe('evaluateRelevance', () => {
    it('should return CriteriaScore for relevance', async () => {
      const result = await evaluator.evaluateRelevance('Test text', 'instagram', 'React');

      expect(result.criterion).toBe(QACriterion.RELEVANCE);
      expect(result.score).toBe(8.0);
      expect(result.weight).toBeGreaterThan(0);
    });

    it('should use default topic when not provided', async () => {
      await evaluator.evaluateRelevance('Test text', 'instagram');

      expect(mockLLMService.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('tecnologia e desenvolvimento'),
            }),
          ]),
        })
      );
    });

    it('should use provided topic', async () => {
      await evaluator.evaluateRelevance('Test text', 'instagram', 'Machine Learning');

      expect(mockLLMService.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('Machine Learning'),
            }),
          ]),
        })
      );
    });
  });

  describe('evaluateEngagement', () => {
    it('should return CriteriaScore for engagement', async () => {
      const result = await evaluator.evaluateEngagement('Test text', 'instagram');

      expect(result.criterion).toBe(QACriterion.ENGAGEMENT);
      expect(result.score).toBe(8.0);
      expect(result.weight).toBeGreaterThan(0);
    });

    it('should include details from reasoning', async () => {
      const result = await evaluator.evaluateEngagement('Test text', 'instagram');

      expect(result.details).toBe('Good quality');
    });
  });

  describe('evaluateGrammar', () => {
    it('should return CriteriaScore for grammar', async () => {
      const result = await evaluator.evaluateGrammar('Texto em portugues correto');

      expect(result.criterion).toBe(QACriterion.GRAMMAR);
      expect(result.score).toBe(8.0);
      expect(result.weight).toBeGreaterThan(0);
    });

    it('should return feedback for low grammar score', async () => {
      const lowScoreLLM = createMockLLMService(5.0, 'Several grammar errors found');
      const lowScoreEvaluator = new TextEvaluator(lowScoreLLM);

      const result = await lowScoreEvaluator.evaluateGrammar('Texto com erros de gramatica');

      expect(result.criterion).toBe(QACriterion.GRAMMAR);
      expect(result.score).toBe(5.0);
      expect(result.feedback).toBeDefined();
      expect(result.feedback).toBe('Several grammar errors found');
    });
  });

  describe('evaluateAll', () => {
    it('should evaluate all text criteria', async () => {
      const results = await evaluator.evaluateAll('Test', 'instagram', 'React');

      expect(results).toHaveLength(4);
      expect(results.map((r) => r.criterion)).toContain(QACriterion.CLARITY);
      expect(results.map((r) => r.criterion)).toContain(QACriterion.RELEVANCE);
      expect(results.map((r) => r.criterion)).toContain(QACriterion.ENGAGEMENT);
      expect(results.map((r) => r.criterion)).toContain(QACriterion.GRAMMAR);
    });

    it('should call LLM 4 times (one per criterion)', async () => {
      await evaluator.evaluateAll('Test', 'instagram', 'React');

      expect(mockLLMService.generate).toHaveBeenCalledTimes(4);
    });

    it('should use low temperature for consistency', async () => {
      await evaluator.evaluateAll('Test', 'instagram');

      expect(mockLLMService.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.3,
        })
      );
    });
  });

  describe('error handling', () => {
    it('should return fallback score on JSON parse error', async () => {
      const badLLM = {
        generate: vi.fn().mockResolvedValue({
          content: 'invalid json',
        }),
      };
      const badEvaluator = new TextEvaluator(badLLM);

      const result = await badEvaluator.evaluateClarity('Test', 'instagram');

      expect(result.score).toBe(5.0);
      expect(result.details).toBe('Avaliacao automatica nao conclusiva');
    });

    it('should clamp scores between 0 and 10', async () => {
      const highScoreLLM = createMockLLMService(15.0, 'Very high');
      const highScoreEvaluator = new TextEvaluator(highScoreLLM);

      const result = await highScoreEvaluator.evaluateClarity('Test', 'instagram');

      expect(result.score).toBe(10);
    });

    it('should clamp negative scores to 0', async () => {
      const negativeScoreLLM = createMockLLMService(-5.0, 'Negative');
      const negativeScoreEvaluator = new TextEvaluator(negativeScoreLLM);

      const result = await negativeScoreEvaluator.evaluateClarity('Test', 'instagram');

      expect(result.score).toBe(0);
    });
  });

  describe('getDefaultTextWeights', () => {
    it('should return default text weights', () => {
      const weights = getDefaultTextWeights();

      expect(weights[QACriterion.CLARITY]).toBe(0.25);
      expect(weights[QACriterion.RELEVANCE]).toBe(0.3);
      expect(weights[QACriterion.ENGAGEMENT]).toBe(0.25);
      expect(weights[QACriterion.GRAMMAR]).toBe(0.2);
    });

    it('should return a copy, not the original', () => {
      const weights1 = getDefaultTextWeights();
      const weights2 = getDefaultTextWeights();
      weights1[QACriterion.CLARITY] = 0.5;
      expect(weights2[QACriterion.CLARITY]).toBe(0.25);
    });
  });
});
