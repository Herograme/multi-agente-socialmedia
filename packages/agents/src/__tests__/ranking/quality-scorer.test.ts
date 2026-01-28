/**
 * QualityScorer unit tests
 * Story 2.4 - Content Ranking Algorithm
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { QualityScorer } from '../../services/ranking/scorers/quality-scorer';
import type { ContentToRank, QualityWeights } from '../../services/ranking/types';

describe('QualityScorer', () => {
  let scorer: QualityScorer;
  const defaultWeights: QualityWeights = {
    length: 0.3,
    codePresence: 0.3,
    freshness: 0.4,
  };

  beforeEach(() => {
    scorer = new QualityScorer(defaultWeights, 100);
  });

  describe('length scoring', () => {
    it('should give 0.2 score for content below minimum length', () => {
      const content: ContentToRank = {
        id: '1',
        title: 'Test',
        content: 'word '.repeat(50), // 50 words
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = scorer.score(content);
      expect(result.length).toBe(0.2);
    });

    it('should give 1.0 score for optimal word count (500-2000)', () => {
      const content: ContentToRank = {
        id: '2',
        title: 'Test',
        content: 'word '.repeat(1000), // 1000 words
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = scorer.score(content);
      expect(result.length).toBe(1.0);
    });

    it('should give 1.0 score at lower optimal boundary (500 words)', () => {
      const content: ContentToRank = {
        id: '3',
        title: 'Test',
        content: 'word '.repeat(500),
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = scorer.score(content);
      expect(result.length).toBe(1.0);
    });

    it('should give 1.0 score at upper optimal boundary (2000 words)', () => {
      const content: ContentToRank = {
        id: '4',
        title: 'Test',
        content: 'word '.repeat(2000),
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = scorer.score(content);
      expect(result.length).toBe(1.0);
    });

    it('should give 0.9 score for very long content (2000+ words)', () => {
      const content: ContentToRank = {
        id: '5',
        title: 'Test',
        content: 'word '.repeat(3000),
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = scorer.score(content);
      expect(result.length).toBe(0.9);
    });

    it('should scale linearly between minLength and 500 words', () => {
      const content300: ContentToRank = {
        id: '6',
        title: 'Test',
        content: 'word '.repeat(300),
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = scorer.score(content300);
      // 300 words is 50% of the way from 100 to 500
      // Score should be 0.2 + (0.8 * 0.5) = 0.6
      expect(result.length).toBeCloseTo(0.6, 1);
    });

    it('should give 0.5 score when content is missing', () => {
      const content: ContentToRank = {
        id: '7',
        title: 'Test',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = scorer.score(content);
      expect(result.length).toBe(0.5);
    });
  });

  describe('code presence scoring', () => {
    it('should give 0 score when no code blocks present', () => {
      const content: ContentToRank = {
        id: '8',
        title: 'Test',
        content: 'This is just plain text without any code.',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = scorer.score(content);
      expect(result.codePresence).toBe(0);
    });

    it('should give 0.5 score for one code block', () => {
      const content: ContentToRank = {
        id: '9',
        title: 'Test',
        content: 'Here is some code:\n```javascript\nconst x = 1;\n```',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = scorer.score(content);
      expect(result.codePresence).toBe(0.5);
    });

    it('should give 0.8 score for two code blocks', () => {
      const content: ContentToRank = {
        id: '10',
        title: 'Test',
        content: '```typescript\nconst x = 1;\n```\nSome text\n```js\nlet y = 2;\n```',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = scorer.score(content);
      expect(result.codePresence).toBe(0.8);
    });

    it('should give 1.0 score for three or more code blocks', () => {
      const content: ContentToRank = {
        id: '11',
        title: 'Test',
        content: '```ts\na\n```\n```js\nb\n```\n```py\nc\n```\n```rs\nd\n```',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = scorer.score(content);
      expect(result.codePresence).toBe(1.0);
    });

    it('should detect HTML code tags', () => {
      const content: ContentToRank = {
        id: '12',
        title: 'Test',
        content: 'Example: <code>const x = 1;</code> and <code>let y = 2;</code>',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = scorer.score(content);
      expect(result.codePresence).toBe(0.8);
    });

    it('should detect HTML pre tags', () => {
      const content: ContentToRank = {
        id: '13',
        title: 'Test',
        content: '<pre>function test() {\n  return 1;\n}</pre>',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = scorer.score(content);
      expect(result.codePresence).toBe(0.5);
    });

    it('should give 0 score when content is missing', () => {
      const content: ContentToRank = {
        id: '14',
        title: 'Test',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = scorer.score(content);
      expect(result.codePresence).toBe(0);
    });
  });

  describe('freshness scoring', () => {
    it('should give 1.0 score for content published today', () => {
      const content: ContentToRank = {
        id: '15',
        title: 'Test',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = scorer.score(content);
      expect(result.freshness).toBe(1.0);
    });

    it('should give 1.0 score for content published within 24 hours', () => {
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 12);

      const content: ContentToRank = {
        id: '16',
        title: 'Test',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: yesterday,
      };

      const result = scorer.score(content);
      expect(result.freshness).toBe(1.0);
    });

    it('should decay freshness for content 1-7 days old', () => {
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

      const content: ContentToRank = {
        id: '17',
        title: 'Test',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: fourDaysAgo,
      };

      const result = scorer.score(content);
      // Should be between 0.7 and 0.9
      expect(result.freshness).toBeLessThan(0.9);
      expect(result.freshness).toBeGreaterThan(0.7);
    });

    it('should decay freshness for content 7-30 days old', () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const content: ContentToRank = {
        id: '18',
        title: 'Test',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: twoWeeksAgo,
      };

      const result = scorer.score(content);
      // Should be between 0.4 and 0.7
      expect(result.freshness).toBeLessThan(0.7);
      expect(result.freshness).toBeGreaterThan(0.4);
    });

    it('should decay freshness for content older than 30 days', () => {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const content: ContentToRank = {
        id: '19',
        title: 'Test',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: sixtyDaysAgo,
      };

      const result = scorer.score(content);
      // Should be between 0.1 and 0.4
      expect(result.freshness).toBeLessThan(0.4);
      expect(result.freshness).toBeGreaterThanOrEqual(0.1);
    });

    it('should never go below 0.1 for very old content', () => {
      const veryOld = new Date();
      veryOld.setFullYear(veryOld.getFullYear() - 1);

      const content: ContentToRank = {
        id: '20',
        title: 'Test',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: veryOld,
      };

      const result = scorer.score(content);
      expect(result.freshness).toBeCloseTo(0.1, 5);
    });

    it('should handle future dates gracefully', () => {
      const future = new Date();
      future.setDate(future.getDate() + 7);

      const content: ContentToRank = {
        id: '21',
        title: 'Test',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: future,
      };

      const result = scorer.score(content);
      expect(result.freshness).toBe(1.0);
    });
  });

  describe('final score calculation', () => {
    it('should combine all scores with configured weights', () => {
      const content: ContentToRank = {
        id: '22',
        title: 'Test',
        content: 'word '.repeat(1000) + '\n```js\ncode\n```',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = scorer.score(content);

      // Verify weights are applied correctly
      const expectedFinal =
        result.length * 0.3 +
        result.codePresence * 0.3 +
        result.freshness * 0.4;

      expect(result.final).toBeCloseTo(expectedFinal, 5);
    });

    it('should return final score between 0 and 1', () => {
      const contents: ContentToRank[] = [
        {
          id: '23',
          title: 'Perfect',
          content: 'word '.repeat(1000) + '\n```ts\na\n```\n```js\nb\n```\n```py\nc\n```',
          url: 'https://a.com',
          source: 'devto',
          publishedAt: new Date(),
        },
        {
          id: '24',
          title: 'Minimal',
          content: 'short',
          url: 'https://b.com',
          source: 'devto',
          publishedAt: new Date(2020, 0, 1),
        },
      ];

      for (const content of contents) {
        const result = scorer.score(content);
        expect(result.final).toBeGreaterThanOrEqual(0);
        expect(result.final).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('configuration', () => {
    it('should use custom weights', () => {
      const customWeights: QualityWeights = {
        length: 0.5,
        codePresence: 0.3,
        freshness: 0.2,
      };
      const customScorer = new QualityScorer(customWeights, 50);

      const content: ContentToRank = {
        id: '25',
        title: 'Test',
        content: 'word '.repeat(1000),
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = customScorer.score(content);

      // Length should have more impact with 0.5 weight
      expect(result.final).toBeCloseTo(
        result.length * 0.5 + result.codePresence * 0.3 + result.freshness * 0.2,
        5
      );
    });

    it('should use custom minimum length', () => {
      const customScorer = new QualityScorer(defaultWeights, 200);

      const content: ContentToRank = {
        id: '26',
        title: 'Test',
        content: 'word '.repeat(150), // Below custom minLength of 200
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = customScorer.score(content);
      expect(result.length).toBe(0.2);
    });

    it('should return weights via getWeights', () => {
      const weights = scorer.getWeights();
      expect(weights).toEqual(defaultWeights);
    });

    it('should return minLength via getMinLength', () => {
      expect(scorer.getMinLength()).toBe(100);
    });
  });
});
