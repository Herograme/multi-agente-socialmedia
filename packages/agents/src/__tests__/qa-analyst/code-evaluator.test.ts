/**
 * CodeEvaluator Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CodeEvaluator, getDefaultCodeWeights } from '../../agents/qa-analyst/code-evaluator';
import { QACriterion } from '../../agents/qa-analyst/types';
import type { LLMService, CodeSnippet } from '../../agents/qa-analyst/types';

// Mock LLM Service
const createMockLLMService = (
  score: number = 8.0,
  reasoning: string = 'Good code',
  issues?: string[]
) => ({
  generate: vi.fn().mockResolvedValue({
    content: JSON.stringify({ score, reasoning, issues }),
  }),
});

describe('CodeEvaluator', () => {
  let mockLLMService: LLMService;
  let evaluator: CodeEvaluator;

  beforeEach(() => {
    mockLLMService = createMockLLMService();
    evaluator = new CodeEvaluator(mockLLMService);
    vi.clearAllMocks();
  });

  describe('detectLanguage', () => {
    it('should detect TypeScript', () => {
      const code = `
        interface User {
          name: string;
          age: number;
        }
        const user: User = { name: 'John', age: 30 };
      `;
      expect(evaluator.detectLanguage(code)).toBe('typescript');
    });

    it('should detect JavaScript', () => {
      const code = `
        const greeting = 'Hello';
        function sayHello(name) {
          console.log(greeting + ' ' + name);
        }
        const arrow = () => { return 42; };
      `;
      expect(evaluator.detectLanguage(code)).toBe('javascript');
    });

    it('should detect Python', () => {
      const code = `
        import os
        def hello():
            print("Hello")
      `;
      expect(evaluator.detectLanguage(code)).toBe('python');
    });

    it('should detect Java', () => {
      const code = `
        public class Main {
          public static void main(String[] args) {
            System.out.println("Hello");
          }
        }
      `;
      expect(evaluator.detectLanguage(code)).toBe('java');
    });

    it('should detect Rust', () => {
      const code = `
        fn main() {
          let mut x = 5;
          impl MyTrait for MyStruct {}
        }
      `;
      expect(evaluator.detectLanguage(code)).toBe('rust');
    });

    it('should detect Go', () => {
      const code = `
        package main
        func main() {
          x := 5
        }
      `;
      expect(evaluator.detectLanguage(code)).toBe('go');
    });

    it('should default to JavaScript for unknown code', () => {
      const code = 'some random text that is not code';
      expect(evaluator.detectLanguage(code)).toBe('javascript');
    });
  });

  describe('evaluateCodeSyntax', () => {
    it('should return high score for empty snippets array', async () => {
      const result = await evaluator.evaluateCodeSyntax([]);

      expect(result.criterion).toBe(QACriterion.CODE_SYNTAX);
      expect(result.score).toBe(10.0);
      expect(result.details).toBe('Nenhum codigo para avaliar');
      expect(mockLLMService.generate).not.toHaveBeenCalled();
    });

    it('should evaluate single snippet', async () => {
      const snippets: CodeSnippet[] = [
        { code: 'const x = 5;', language: 'javascript' },
      ];

      const result = await evaluator.evaluateCodeSyntax(snippets);

      expect(result.criterion).toBe(QACriterion.CODE_SYNTAX);
      expect(result.score).toBe(8.0);
      expect(result.weight).toBeGreaterThan(0);
      expect(mockLLMService.generate).toHaveBeenCalledTimes(1);
    });

    it('should evaluate multiple snippets and average scores', async () => {
      const snippets: CodeSnippet[] = [
        { code: 'const x = 5;', language: 'javascript' },
        { code: 'const y = 10;', language: 'javascript' },
      ];

      const result = await evaluator.evaluateCodeSyntax(snippets);

      expect(result.details).toContain('2 snippet(s)');
      expect(mockLLMService.generate).toHaveBeenCalledTimes(2);
    });

    it('should include feedback for low scores', async () => {
      const lowScoreLLM = createMockLLMService(5.0, 'Syntax errors', ['Missing semicolon']);
      const lowScoreEvaluator = new CodeEvaluator(lowScoreLLM);

      const snippets: CodeSnippet[] = [{ code: 'const x = 5' }];
      const result = await lowScoreEvaluator.evaluateCodeSyntax(snippets);

      expect(result.feedback).toContain('Missing semicolon');
    });

    it('should auto-detect language when not provided', async () => {
      const snippets: CodeSnippet[] = [
        { code: 'const x: number = 5;' }, // TypeScript-like
      ];

      await evaluator.evaluateCodeSyntax(snippets);

      expect(mockLLMService.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringMatching(/typescript|javascript/i),
            }),
          ]),
        })
      );
    });
  });

  describe('evaluateCodeExplanation', () => {
    it('should return high score for empty snippets array', async () => {
      const result = await evaluator.evaluateCodeExplanation([], 'Some text');

      expect(result.criterion).toBe(QACriterion.CODE_EXPLANATION);
      expect(result.score).toBe(10.0);
      expect(result.details).toBe('Nenhum codigo para avaliar');
      expect(mockLLMService.generate).not.toHaveBeenCalled();
    });

    it('should evaluate code explanation', async () => {
      const snippets: CodeSnippet[] = [{ code: 'const x = 5;', language: 'javascript' }];

      const result = await evaluator.evaluateCodeExplanation(
        snippets,
        'This code declares a variable'
      );

      expect(result.criterion).toBe(QACriterion.CODE_EXPLANATION);
      expect(result.score).toBe(8.0);
      expect(result.weight).toBeGreaterThan(0);
    });

    it('should use snippet context when provided', async () => {
      const snippets: CodeSnippet[] = [
        {
          code: 'const x = 5;',
          language: 'javascript',
          context: 'Specific context for this snippet',
        },
      ];

      await evaluator.evaluateCodeExplanation(snippets, 'Surrounding text');

      expect(mockLLMService.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('Specific context for this snippet'),
            }),
          ]),
        })
      );
    });

    it('should fallback to surrounding text when no context', async () => {
      const snippets: CodeSnippet[] = [{ code: 'const x = 5;' }];

      await evaluator.evaluateCodeExplanation(snippets, 'Surrounding text used as context');

      expect(mockLLMService.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('Surrounding text used as context'),
            }),
          ]),
        })
      );
    });

    it('should include feedback for low explanation scores', async () => {
      const lowScoreLLM = createMockLLMService(5.0, 'No explanation provided');
      const lowScoreEvaluator = new CodeEvaluator(lowScoreLLM);

      const snippets: CodeSnippet[] = [{ code: 'const x = 5;' }];
      const result = await lowScoreEvaluator.evaluateCodeExplanation(snippets, '');

      expect(result.feedback).toBe('Codigo precisa de explicacao mais clara');
    });
  });

  describe('evaluateAll', () => {
    it('should evaluate both syntax and explanation', async () => {
      const snippets: CodeSnippet[] = [{ code: 'const x = 5;', language: 'javascript' }];

      const results = await evaluator.evaluateAll(snippets, 'Some surrounding text');

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.criterion)).toContain(QACriterion.CODE_SYNTAX);
      expect(results.map((r) => r.criterion)).toContain(QACriterion.CODE_EXPLANATION);
    });

    it('should call LLM for each criterion per snippet', async () => {
      const snippets: CodeSnippet[] = [{ code: 'const x = 5;' }];

      await evaluator.evaluateAll(snippets, 'Text');

      // 1 snippet * 2 criteria = 2 calls
      expect(mockLLMService.generate).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('should return fallback score on JSON parse error', async () => {
      const badLLM = {
        generate: vi.fn().mockResolvedValue({
          content: 'invalid json',
        }),
      };
      const badEvaluator = new CodeEvaluator(badLLM);

      const snippets: CodeSnippet[] = [{ code: 'const x = 5;' }];
      const result = await badEvaluator.evaluateCodeSyntax(snippets);

      expect(result.score).toBe(5.0);
    });

    it('should clamp scores between 0 and 10', async () => {
      const highScoreLLM = createMockLLMService(15.0, 'Perfect');
      const highScoreEvaluator = new CodeEvaluator(highScoreLLM);

      const snippets: CodeSnippet[] = [{ code: 'const x = 5;' }];
      const result = await highScoreEvaluator.evaluateCodeSyntax(snippets);

      expect(result.score).toBe(10);
    });
  });

  describe('getDefaultCodeWeights', () => {
    it('should return default code weights', () => {
      const weights = getDefaultCodeWeights();

      expect(weights[QACriterion.CODE_SYNTAX]).toBe(0.5);
      expect(weights[QACriterion.CODE_EXPLANATION]).toBe(0.5);
    });

    it('should return a copy, not the original', () => {
      const weights1 = getDefaultCodeWeights();
      const weights2 = getDefaultCodeWeights();
      weights1[QACriterion.CODE_SYNTAX] = 0.8;
      expect(weights2[QACriterion.CODE_SYNTAX]).toBe(0.5);
    });
  });
});
