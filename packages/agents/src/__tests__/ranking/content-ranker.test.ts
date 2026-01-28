/**
 * ContentRanker unit tests
 * Story 2.4 - Content Ranking Algorithm
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ContentRanker } from '../../services/ranking/content-ranker';
import type { ContentToRank, RankingConfig } from '../../services/ranking/types';
import { DEFAULT_RANKING_CONFIG } from '../../services/ranking/types';

describe('ContentRanker', () => {
  let ranker: ContentRanker;

  beforeEach(() => {
    ranker = new ContentRanker(['typescript', 'react'], {
      thresholds: { minScore: 0.2, minLength: 50 },
    });
  });

  describe('ranking', () => {
    it('should rank content by combined score descending', () => {
      const contents: ContentToRank[] = [
        {
          id: '1',
          title: 'Python Tutorial',
          url: 'https://a.com',
          source: 'devto',
          publishedAt: new Date(),
        },
        {
          id: '2',
          title: 'TypeScript React Guide',
          url: 'https://b.com',
          source: 'devto',
          publishedAt: new Date(),
        },
        {
          id: '3',
          title: 'React Basics',
          url: 'https://c.com',
          source: 'devto',
          publishedAt: new Date(),
        },
      ];

      const result = ranker.rank(contents);

      // TypeScript React Guide should be first (matches both keywords)
      expect(result.items[0].id).toBe('2');
      expect(result.items[0].rank).toBe(1);

      // React Basics should be second (matches one keyword)
      expect(result.items[1].id).toBe('3');
      expect(result.items[1].rank).toBe(2);
    });

    it('should assign sequential ranks starting from 1', () => {
      const contents: ContentToRank[] = [
        {
          id: '1',
          title: 'TypeScript',
          url: 'https://a.com',
          source: 'devto',
          publishedAt: new Date(),
        },
        {
          id: '2',
          title: 'React',
          url: 'https://b.com',
          source: 'devto',
          publishedAt: new Date(),
        },
        {
          id: '3',
          title: 'TypeScript React',
          url: 'https://c.com',
          source: 'devto',
          publishedAt: new Date(),
        },
      ];

      const result = ranker.rank(contents);

      const ranks = result.items.map((item) => item.rank);
      expect(ranks).toContain(1);
      expect(ranks).toContain(2);
      expect(ranks).toContain(3);
    });
  });

  describe('filtering', () => {
    it('should filter out content below threshold', () => {
      const strictRanker = new ContentRanker(['typescript'], {
        thresholds: { minScore: 0.8, minLength: 50 },
      });

      const contents: ContentToRank[] = [
        {
          id: '1',
          title: 'Unrelated topic',
          url: 'https://a.com',
          source: 'devto',
          publishedAt: new Date(),
        },
        {
          id: '2',
          title: 'Another topic',
          url: 'https://b.com',
          source: 'devto',
          publishedAt: new Date(),
        },
      ];

      const result = strictRanker.rank(contents);

      expect(result.items.length).toBe(0);
      expect(result.metadata.filteredOut).toBe(2);
    });

    it('should include content at exactly the threshold', () => {
      // Create content that will be just at the threshold
      const contents: ContentToRank[] = [
        {
          id: '1',
          title: 'TypeScript React',
          content: 'word '.repeat(100),
          url: 'https://a.com',
          source: 'devto',
          publishedAt: new Date(),
        },
      ];

      const result = ranker.rank(contents);

      // This content should have a score above 0.2 threshold
      expect(result.items.length).toBe(1);
    });

    it('should use default threshold when not specified', () => {
      const defaultRanker = new ContentRanker(['typescript']);

      const contents: ContentToRank[] = [
        {
          id: '1',
          title: 'Unrelated',
          url: 'https://a.com',
          source: 'devto',
          publishedAt: new Date(),
        },
      ];

      const result = defaultRanker.rank(contents);

      // With default 0.3 threshold, unrelated content should be filtered
      expect(result.metadata.config.thresholds.minScore).toBe(0.3);
    });
  });

  describe('score breakdown', () => {
    it('should include score breakdown in results', () => {
      const contents: ContentToRank[] = [
        {
          id: '1',
          title: 'TypeScript Tips',
          url: 'https://a.com',
          source: 'devto',
          publishedAt: new Date(),
        },
      ];

      const result = ranker.rank(contents);

      expect(result.items[0].breakdown).toBeDefined();
      expect(result.items[0].breakdown.relevance).toBeDefined();
      expect(result.items[0].breakdown.relevance.keywordMatch).toBeDefined();
      expect(result.items[0].breakdown.relevance.topicSimilarity).toBeDefined();
      expect(result.items[0].breakdown.relevance.final).toBeDefined();
      expect(result.items[0].breakdown.quality).toBeDefined();
      expect(result.items[0].breakdown.quality.length).toBeDefined();
      expect(result.items[0].breakdown.quality.codePresence).toBeDefined();
      expect(result.items[0].breakdown.quality.freshness).toBeDefined();
      expect(result.items[0].breakdown.quality.final).toBeDefined();
      expect(result.items[0].breakdown.combined).toBeDefined();
    });

    it('should have combined score equal to breakdown.combined', () => {
      const contents: ContentToRank[] = [
        {
          id: '1',
          title: 'TypeScript React',
          content: 'Learn typescript and react development',
          url: 'https://a.com',
          source: 'devto',
          publishedAt: new Date(),
        },
      ];

      const result = ranker.rank(contents);

      expect(result.items[0].score).toBe(result.items[0].breakdown.combined);
    });
  });

  describe('metadata', () => {
    it('should calculate correct metadata', () => {
      const contents: ContentToRank[] = [
        {
          id: '1',
          title: 'TypeScript',
          url: 'https://a.com',
          source: 'devto',
          publishedAt: new Date(),
        },
        {
          id: '2',
          title: 'React',
          url: 'https://b.com',
          source: 'devto',
          publishedAt: new Date(),
        },
        {
          id: '3',
          title: 'Python',
          url: 'https://c.com',
          source: 'devto',
          publishedAt: new Date(),
        },
      ];

      const result = ranker.rank(contents);

      expect(result.metadata.totalProcessed).toBe(3);
      expect(result.metadata.totalReturned).toBeLessThanOrEqual(3);
      expect(result.metadata.filteredOut).toBe(
        result.metadata.totalProcessed - result.metadata.totalReturned
      );
      expect(result.metadata.averageScore).toBeGreaterThan(0);
      expect(result.metadata.config).toBeDefined();
      expect(result.metadata.timestamp).toBeInstanceOf(Date);
    });

    it('should calculate average score correctly', () => {
      const contents: ContentToRank[] = [
        {
          id: '1',
          title: 'TypeScript React',
          url: 'https://a.com',
          source: 'devto',
          publishedAt: new Date(),
        },
        {
          id: '2',
          title: 'TypeScript Basics',
          url: 'https://b.com',
          source: 'devto',
          publishedAt: new Date(),
        },
      ];

      const result = ranker.rank(contents);

      const expectedAverage =
        result.items.reduce((sum, item) => sum + item.score, 0) /
        result.items.length;

      expect(result.metadata.averageScore).toBeCloseTo(expectedAverage, 5);
    });

    it('should return 0 average score when all items filtered', () => {
      const strictRanker = new ContentRanker(['typescript'], {
        thresholds: { minScore: 1.0, minLength: 50 },
      });

      const contents: ContentToRank[] = [
        {
          id: '1',
          title: 'Unrelated',
          url: 'https://a.com',
          source: 'devto',
          publishedAt: new Date(),
        },
      ];

      const result = strictRanker.rank(contents);

      expect(result.metadata.averageScore).toBe(0);
    });

    it('should include config in metadata', () => {
      const customConfig: Partial<RankingConfig> = {
        weights: { relevance: 0.7, quality: 0.3 },
        thresholds: { minScore: 0.1, minLength: 50 },
      };

      const customRanker = new ContentRanker(['typescript'], customConfig);
      const result = customRanker.rank([]);

      expect(result.metadata.config.weights.relevance).toBe(0.7);
      expect(result.metadata.config.weights.quality).toBe(0.3);
      expect(result.metadata.config.thresholds.minScore).toBe(0.1);
    });
  });

  describe('configuration', () => {
    it('should use default config when none provided', () => {
      const defaultRanker = new ContentRanker(['typescript']);
      const config = defaultRanker.getConfig();

      expect(config.weights).toEqual(DEFAULT_RANKING_CONFIG.weights);
      expect(config.qualityWeights).toEqual(DEFAULT_RANKING_CONFIG.qualityWeights);
      expect(config.thresholds).toEqual(DEFAULT_RANKING_CONFIG.thresholds);
    });

    it('should merge partial config with defaults', () => {
      const partialRanker = new ContentRanker(['typescript'], {
        weights: { relevance: 0.8, quality: 0.2 },
      });

      const config = partialRanker.getConfig();

      // Custom weights
      expect(config.weights.relevance).toBe(0.8);
      expect(config.weights.quality).toBe(0.2);

      // Default values for unspecified options
      expect(config.qualityWeights).toEqual(DEFAULT_RANKING_CONFIG.qualityWeights);
      expect(config.thresholds).toEqual(DEFAULT_RANKING_CONFIG.thresholds);
    });

    it('should deeply merge nested config objects', () => {
      const partialRanker = new ContentRanker(['typescript'], {
        qualityWeights: { length: 0.5, codePresence: 0.3, freshness: 0.2 },
      });

      const config = partialRanker.getConfig();

      expect(config.qualityWeights.length).toBe(0.5);
      expect(config.qualityWeights.codePresence).toBe(0.3);
      expect(config.qualityWeights.freshness).toBe(0.2);
    });

    it('should return a copy of config via getConfig', () => {
      const config1 = ranker.getConfig();
      const config2 = ranker.getConfig();

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty content array', () => {
      const result = ranker.rank([]);

      expect(result.items).toHaveLength(0);
      expect(result.metadata.totalProcessed).toBe(0);
      expect(result.metadata.totalReturned).toBe(0);
      expect(result.metadata.filteredOut).toBe(0);
      expect(result.metadata.averageScore).toBe(0);
    });

    it('should handle content without optional fields', () => {
      const contents: ContentToRank[] = [
        {
          id: '1',
          title: 'TypeScript',
          url: 'https://a.com',
          source: 'devto',
          publishedAt: new Date(),
          // No content, no tags
        },
      ];

      const result = ranker.rank(contents);

      expect(result.items.length).toBeGreaterThanOrEqual(0);
      // Should not throw
    });

    it('should handle empty keywords', () => {
      const emptyRanker = new ContentRanker([], {
        thresholds: { minScore: 0, minLength: 50 },
      });

      const contents: ContentToRank[] = [
        {
          id: '1',
          title: 'Any Content',
          url: 'https://a.com',
          source: 'devto',
          publishedAt: new Date(),
        },
      ];

      const result = emptyRanker.rank(contents);

      // Should still process based on quality scores
      expect(result.metadata.totalProcessed).toBe(1);
    });

    it('should handle single item', () => {
      const contents: ContentToRank[] = [
        {
          id: '1',
          title: 'TypeScript Guide',
          url: 'https://a.com',
          source: 'devto',
          publishedAt: new Date(),
        },
      ];

      const result = ranker.rank(contents);

      if (result.items.length > 0) {
        expect(result.items[0].rank).toBe(1);
      }
    });

    it('should handle items with identical scores', () => {
      // Create items that should have similar scores
      const contents: ContentToRank[] = [
        {
          id: '1',
          title: 'TypeScript Guide',
          url: 'https://a.com',
          source: 'devto',
          publishedAt: new Date(),
        },
        {
          id: '2',
          title: 'TypeScript Guide',
          url: 'https://b.com',
          source: 'devto',
          publishedAt: new Date(),
        },
      ];

      const result = ranker.rank(contents);

      // Should have sequential ranks even if scores are identical
      const ranks = result.items.map((item) => item.rank);
      expect(new Set(ranks).size).toBe(ranks.length); // All unique
    });

    it('should preserve original content properties', () => {
      const originalContent: ContentToRank = {
        id: 'original-id',
        title: 'Original Title',
        content: 'Original content body',
        url: 'https://original.com',
        source: 'original-source',
        publishedAt: new Date('2024-01-01'),
        tags: ['tag1', 'tag2'],
      };

      const result = ranker.rank([originalContent]);

      if (result.items.length > 0) {
        const ranked = result.items[0];
        expect(ranked.id).toBe(originalContent.id);
        expect(ranked.title).toBe(originalContent.title);
        expect(ranked.content).toBe(originalContent.content);
        expect(ranked.url).toBe(originalContent.url);
        expect(ranked.source).toBe(originalContent.source);
        expect(ranked.publishedAt).toEqual(originalContent.publishedAt);
        expect(ranked.tags).toEqual(originalContent.tags);
      }
    });
  });

  describe('real-world scenarios', () => {
    it('should prioritize fresh, relevant content with code', () => {
      const today = new Date();
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);

      const contents: ContentToRank[] = [
        {
          id: '1',
          title: 'TypeScript React Tutorial',
          content: '```typescript\nconst app = () => {}\n```\n' + 'word '.repeat(500),
          url: 'https://a.com',
          source: 'devto',
          publishedAt: today,
        },
        {
          id: '2',
          title: 'TypeScript React Tutorial',
          content: '```typescript\nconst app = () => {}\n```\n' + 'word '.repeat(500),
          url: 'https://b.com',
          source: 'devto',
          publishedAt: monthAgo, // Same content but older
        },
      ];

      const result = ranker.rank(contents);

      // Fresh content should rank higher
      expect(result.items[0].id).toBe('1');
    });

    it('should balance relevance and quality', () => {
      const today = new Date();

      const contents: ContentToRank[] = [
        {
          // High relevance, low quality
          id: '1',
          title: 'TypeScript React JavaScript Node',
          content: 'short',
          url: 'https://a.com',
          source: 'devto',
          publishedAt: today,
        },
        {
          // Medium relevance, high quality
          id: '2',
          title: 'React Guide',
          content:
            '```tsx\nconst App = () => <div />\n```\n```ts\ntype Props = {}\n```\n' +
            'word '.repeat(1000),
          url: 'https://b.com',
          source: 'devto',
          publishedAt: today,
        },
      ];

      const result = ranker.rank(contents);

      // Both should be included with reasonable scores
      expect(result.items.length).toBe(2);

      // Quality content should still rank well despite lower keyword match
      const qualityContent = result.items.find((item) => item.id === '2');
      expect(qualityContent).toBeDefined();
      expect(qualityContent!.score).toBeGreaterThan(0.3);
    });
  });
});
