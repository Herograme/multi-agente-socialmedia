/**
 * RelevanceScorer unit tests
 * Story 2.4 - Content Ranking Algorithm
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RelevanceScorer } from '../../services/ranking/scorers/relevance-scorer';
import type { ContentToRank } from '../../services/ranking/types';

describe('RelevanceScorer', () => {
  let scorer: RelevanceScorer;

  beforeEach(() => {
    scorer = new RelevanceScorer(['typescript', 'react', 'testing']);
  });

  describe('keyword matching', () => {
    it('should return 1.0 keyword match when all keywords are present', () => {
      const content: ContentToRank = {
        id: '1',
        title: 'TypeScript React Testing Guide',
        content: 'Learn typescript with react and testing best practices',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = scorer.score(content);
      expect(result.keywordMatch).toBe(1.0);
    });

    it('should return 0.0 keyword match when no keywords are present', () => {
      const content: ContentToRank = {
        id: '2',
        title: 'Python Django Tutorial',
        content: 'Learn python web development',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = scorer.score(content);
      expect(result.keywordMatch).toBe(0.0);
    });

    it('should handle partial keyword matches', () => {
      const content: ContentToRank = {
        id: '3',
        title: 'TypeScript Best Practices',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = scorer.score(content);
      // Only 'typescript' matches out of 3 keywords
      expect(result.keywordMatch).toBeCloseTo(0.33, 1);
    });

    it('should be case insensitive', () => {
      const content: ContentToRank = {
        id: '4',
        title: 'TYPESCRIPT REACT TESTING',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = scorer.score(content);
      expect(result.keywordMatch).toBe(1.0);
    });

    it('should match keywords in tags', () => {
      const content: ContentToRank = {
        id: '5',
        title: 'Web Development Guide',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
        tags: ['typescript', 'react'],
      };

      const result = scorer.score(content);
      expect(result.keywordMatch).toBeCloseTo(0.67, 1);
    });

    it('should match keywords in content body', () => {
      const content: ContentToRank = {
        id: '6',
        title: 'Web Development Guide',
        content: 'This article covers typescript and react fundamentals',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = scorer.score(content);
      expect(result.keywordMatch).toBeCloseTo(0.67, 1);
    });
  });

  describe('topic similarity', () => {
    it('should calculate topic similarity using Jaccard index', () => {
      const content: ContentToRank = {
        id: '7',
        title: 'TypeScript and React Testing',
        content: 'Learn how to test react components with typescript',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = scorer.score(content);
      // Should have some topic similarity due to overlapping terms
      expect(result.topicSimilarity).toBeGreaterThan(0);
      expect(result.topicSimilarity).toBeLessThanOrEqual(1);
    });

    it('should return 0 topic similarity for completely unrelated content', () => {
      const content: ContentToRank = {
        id: '8',
        title: 'Cooking Recipes',
        content: 'How to make delicious pasta with tomato sauce',
        url: 'https://example.com',
        source: 'food',
        publishedAt: new Date(),
      };

      const result = scorer.score(content);
      expect(result.topicSimilarity).toBe(0);
    });

    it('should handle content without body text', () => {
      const content: ContentToRank = {
        id: '9',
        title: 'TypeScript',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = scorer.score(content);
      expect(result.topicSimilarity).toBeGreaterThan(0);
    });
  });

  describe('final score calculation', () => {
    it('should combine keyword match (60%) and topic similarity (40%)', () => {
      const content: ContentToRank = {
        id: '10',
        title: 'TypeScript React Testing Tutorial',
        content: 'Complete guide to typescript react testing',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = scorer.score(content);

      // Verify weights are applied correctly
      const expectedFinal = result.keywordMatch * 0.6 + result.topicSimilarity * 0.4;
      expect(result.final).toBeCloseTo(expectedFinal, 5);
    });

    it('should return final score between 0 and 1', () => {
      const contents: ContentToRank[] = [
        {
          id: '11',
          title: 'TypeScript React Testing',
          content: 'typescript react testing guide',
          url: 'https://a.com',
          source: 'devto',
          publishedAt: new Date(),
        },
        {
          id: '12',
          title: 'Python Django',
          content: 'python django tutorial',
          url: 'https://b.com',
          source: 'devto',
          publishedAt: new Date(),
        },
      ];

      for (const content of contents) {
        const result = scorer.score(content);
        expect(result.final).toBeGreaterThanOrEqual(0);
        expect(result.final).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty keywords', () => {
      const emptyScorer = new RelevanceScorer([]);
      const content: ContentToRank = {
        id: '13',
        title: 'TypeScript Guide',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = emptyScorer.score(content);
      expect(result.keywordMatch).toBe(0);
      expect(result.topicSimilarity).toBe(0);
      expect(result.final).toBe(0);
    });

    it('should handle empty content fields', () => {
      const content: ContentToRank = {
        id: '14',
        title: '',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = scorer.score(content);
      expect(result.keywordMatch).toBe(0);
      expect(result.topicSimilarity).toBe(0);
    });

    it('should handle keywords with whitespace', () => {
      const whitespaceScorer = new RelevanceScorer(['  typescript  ', 'react', '']);
      const keywords = whitespaceScorer.getTargetKeywords();

      // Empty strings should be filtered out
      expect(keywords).toHaveLength(2);
      expect(keywords).toContain('typescript');
      expect(keywords).toContain('react');
    });

    it('should handle special characters in content', () => {
      const content: ContentToRank = {
        id: '15',
        title: 'TypeScript!!! @React #Testing',
        content: 'Learn $typescript & react... testing?',
        url: 'https://example.com',
        source: 'devto',
        publishedAt: new Date(),
      };

      const result = scorer.score(content);
      expect(result.keywordMatch).toBe(1.0);
    });
  });

  describe('getTargetKeywords', () => {
    it('should return a copy of target keywords', () => {
      const keywords = scorer.getTargetKeywords();
      expect(keywords).toEqual(['typescript', 'react', 'testing']);

      // Modifying returned array should not affect scorer
      keywords.push('newkeyword');
      expect(scorer.getTargetKeywords()).toEqual(['typescript', 'react', 'testing']);
    });
  });
});
