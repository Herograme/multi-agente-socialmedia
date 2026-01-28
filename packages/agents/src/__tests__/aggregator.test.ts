/**
 * Tests for ReferenceAggregator service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ReferenceAggregator,
  normalizeUrl,
  normalizeTitle,
  levenshteinDistance,
  calculateSimilarity,
  detectContentType,
  extractDomain,
  generateFaviconUrl,
  estimateReadTime,
  extractAuthor,
  extractPublishedAt,
  extractTags,
} from '../services/aggregator/reference-aggregator';
import { ContentType } from '../services/aggregator/types';
import type { CuratedReference } from '../services/aggregator/types';

// Test fixtures
const createReference = (
  id: string,
  title: string,
  url: string,
  source: string,
  discoveredAt: Date = new Date(),
  rawMetadata?: Record<string, unknown>
): CuratedReference => ({
  id,
  title,
  url,
  source,
  discoveredAt,
  rawMetadata,
});

describe('ReferenceAggregator', () => {
  let aggregator: ReferenceAggregator;

  beforeEach(() => {
    aggregator = new ReferenceAggregator();
  });

  describe('normalizeUrl', () => {
    it('should remove trailing slash', () => {
      expect(normalizeUrl('https://example.com/')).toBe('https://example.com');
      expect(normalizeUrl('https://example.com/path/')).toBe(
        'https://example.com/path'
      );
    });

    it('should normalize URLs to lowercase', () => {
      expect(normalizeUrl('https://Example.COM/Path')).toBe(
        'https://example.com/path'
      );
    });

    it('should remove UTM tracking parameters', () => {
      expect(
        normalizeUrl('https://example.com?utm_source=twitter&utm_medium=social')
      ).toBe('https://example.com');
    });

    it('should remove common tracking params but keep essential params', () => {
      expect(
        normalizeUrl('https://example.com/search?q=test&utm_campaign=test&page=1')
      ).toBe('https://example.com/search?q=test&page=1');
    });

    it('should handle URLs with different protocols', () => {
      expect(normalizeUrl('http://example.com/path')).toBe(
        'http://example.com/path'
      );
      expect(normalizeUrl('https://example.com/path')).toBe(
        'https://example.com/path'
      );
    });

    it('should handle malformed URLs gracefully', () => {
      expect(normalizeUrl('not-a-valid-url')).toBe('not-a-valid-url');
      expect(normalizeUrl('example.com/path')).toBe('example.com/path');
    });
  });

  describe('normalizeTitle', () => {
    it('should convert to lowercase', () => {
      expect(normalizeTitle('Hello World')).toBe('hello world');
    });

    it('should remove punctuation', () => {
      expect(normalizeTitle("Hello, World! How's it going?")).toBe(
        'hello world hows it going'
      );
    });

    it('should normalize whitespace', () => {
      expect(normalizeTitle('Hello    World   Test')).toBe('hello world test');
    });

    it('should trim whitespace', () => {
      expect(normalizeTitle('  Hello World  ')).toBe('hello world');
    });
  });

  describe('levenshteinDistance', () => {
    it('should return 0 for identical strings', () => {
      expect(levenshteinDistance('hello', 'hello')).toBe(0);
    });

    it('should return string length for empty comparison', () => {
      expect(levenshteinDistance('hello', '')).toBe(5);
      expect(levenshteinDistance('', 'hello')).toBe(5);
    });

    it('should calculate correct distance for different strings', () => {
      expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
      expect(levenshteinDistance('hello', 'hallo')).toBe(1);
    });
  });

  describe('calculateSimilarity', () => {
    it('should return 1.0 for identical strings', () => {
      expect(calculateSimilarity('hello world', 'hello world')).toBe(1.0);
    });

    it('should return 1.0 for strings that normalize to the same', () => {
      expect(calculateSimilarity('Hello World!', 'hello world')).toBe(1.0);
    });

    it('should return high similarity for similar strings', () => {
      const similarity = calculateSimilarity(
        'React 19 New Features',
        'React 19: New Features Guide'
      );
      expect(similarity).toBeGreaterThan(0.7);
    });

    it('should return low similarity for different strings', () => {
      const similarity = calculateSimilarity(
        'React Tutorial',
        'Python Machine Learning'
      );
      expect(similarity).toBeLessThan(0.5);
    });
  });

  describe('detectContentType', () => {
    it('should detect GitHub as CODE', () => {
      expect(detectContentType('https://github.com/user/repo', 'My Project')).toBe(
        ContentType.CODE
      );
    });

    it('should detect GitLab as CODE', () => {
      expect(detectContentType('https://gitlab.com/user/repo', 'My Project')).toBe(
        ContentType.CODE
      );
    });

    it('should detect YouTube as VIDEO', () => {
      expect(
        detectContentType('https://youtube.com/watch?v=123', 'Tutorial Video')
      ).toBe(ContentType.VIDEO);
    });

    it('should detect youtu.be short links as VIDEO', () => {
      expect(detectContentType('https://youtu.be/abc123', 'Tutorial Video')).toBe(
        ContentType.VIDEO
      );
    });

    it('should detect tutorial keywords in title as TUTORIAL', () => {
      expect(
        detectContentType('https://example.com/page', 'How to Build a CLI')
      ).toBe(ContentType.TUTORIAL);
      expect(
        detectContentType('https://example.com/page', 'Step-by-Step Guide')
      ).toBe(ContentType.TUTORIAL);
    });

    it('should detect blog/article keywords as ARTICLE', () => {
      expect(
        detectContentType('https://myblog.com/post', 'Understanding React')
      ).toBe(ContentType.ARTICLE);
    });

    it('should fallback to ARTICLE for unknown types', () => {
      expect(
        detectContentType('https://unknown.com/page', 'Some Random Content')
      ).toBe(ContentType.ARTICLE);
    });
  });

  describe('extractDomain', () => {
    it('should extract domain from valid URL', () => {
      expect(extractDomain('https://dev.to/article/123')).toBe('dev.to');
      expect(extractDomain('https://www.example.com/path')).toBe('www.example.com');
    });

    it('should handle malformed URLs', () => {
      expect(extractDomain('not-a-url')).toBe('not-a-url');
    });
  });

  describe('generateFaviconUrl', () => {
    it('should generate Google favicon URL', () => {
      expect(generateFaviconUrl('dev.to')).toBe(
        'https://www.google.com/s2/favicons?domain=dev.to&sz=32'
      );
    });
  });

  describe('estimateReadTime', () => {
    it('should use content_length from metadata if available', () => {
      const readTime = estimateReadTime('Short Title', { content_length: 10000 });
      expect(readTime).toBeGreaterThan(0);
    });

    it('should estimate based on title length if no metadata', () => {
      expect(estimateReadTime('Short')).toBe(2);
      expect(estimateReadTime('A Medium Length Title Here With More Words')).toBe(3);
      expect(
        estimateReadTime(
          'A Very Long Title That Suggests A Detailed Article With Lots of Content'
        )
      ).toBe(5);
    });
  });

  describe('extractAuthor', () => {
    it('should extract author from various field names', () => {
      expect(extractAuthor({ author: 'John Doe' })).toBe('John Doe');
      expect(extractAuthor({ by: 'johndoe' })).toBe('johndoe');
      expect(extractAuthor({ creator: 'Jane Smith' })).toBe('Jane Smith');
    });

    it('should return null if no author found', () => {
      expect(extractAuthor({})).toBeNull();
      expect(extractAuthor(undefined)).toBeNull();
    });
  });

  describe('extractPublishedAt', () => {
    it('should parse string dates', () => {
      const date = extractPublishedAt({ publishedAt: '2026-01-28T10:00:00Z' });
      expect(date).toBeInstanceOf(Date);
      expect(date?.getFullYear()).toBe(2026);
    });

    it('should handle Unix timestamps in seconds', () => {
      // 2026-01-28 timestamp in seconds
      const date = extractPublishedAt({ time: 1769616000 });
      expect(date).toBeInstanceOf(Date);
    });

    it('should return null if no date found', () => {
      expect(extractPublishedAt({})).toBeNull();
      expect(extractPublishedAt(undefined)).toBeNull();
    });
  });

  describe('extractTags', () => {
    it('should extract tags array', () => {
      expect(extractTags({ tags: ['react', 'javascript'] })).toEqual([
        'react',
        'javascript',
      ]);
    });

    it('should handle comma-separated string', () => {
      expect(extractTags({ tags: 'react, javascript, web' })).toEqual([
        'react',
        'javascript',
        'web',
      ]);
    });

    it('should return empty array if no tags', () => {
      expect(extractTags({})).toEqual([]);
      expect(extractTags(undefined)).toEqual([]);
    });
  });

  describe('deduplicateByUrl', () => {
    it('should remove exact URL duplicates', () => {
      const refs = [
        createReference('1', 'Title 1', 'https://example.com/article', 'devto'),
        createReference('2', 'Title 2', 'https://example.com/article', 'hackernews'),
      ];

      const result = aggregator.deduplicateByUrl(refs);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1'); // Keeps first occurrence
    });

    it('should normalize URLs before comparison', () => {
      const refs = [
        createReference('1', 'Title 1', 'https://example.com/article/', 'devto'),
        createReference('2', 'Title 2', 'https://example.com/article', 'hackernews'),
      ];

      const result = aggregator.deduplicateByUrl(refs);

      expect(result).toHaveLength(1);
    });

    it('should ignore tracking parameters', () => {
      const refs = [
        createReference(
          '1',
          'Title 1',
          'https://example.com/article?utm_source=twitter',
          'devto'
        ),
        createReference(
          '2',
          'Title 2',
          'https://example.com/article?utm_source=facebook',
          'hackernews'
        ),
      ];

      const result = aggregator.deduplicateByUrl(refs);

      expect(result).toHaveLength(1);
    });

    it('should keep distinct URLs', () => {
      const refs = [
        createReference('1', 'Title 1', 'https://example.com/article-1', 'devto'),
        createReference('2', 'Title 2', 'https://example.com/article-2', 'hackernews'),
      ];

      const result = aggregator.deduplicateByUrl(refs);

      expect(result).toHaveLength(2);
    });
  });

  describe('deduplicateByTitleSimilarity', () => {
    it('should detect similar titles above threshold', () => {
      const refs = [
        createReference(
          '1',
          'React 19 New Features Guide',
          'https://dev.to/article1',
          'devto'
        ),
        createReference(
          '2',
          'React 19: New Features Guide',
          'https://hackernews.com/article2',
          'hackernews'
        ),
      ];

      const result = aggregator.deduplicateByTitleSimilarity(refs);

      expect(result).toHaveLength(1);
    });

    it('should keep distinct titles below threshold', () => {
      const refs = [
        createReference(
          '1',
          'React Tutorial for Beginners',
          'https://dev.to/article1',
          'devto'
        ),
        createReference(
          '2',
          'Python Machine Learning Guide',
          'https://hackernews.com/article2',
          'hackernews'
        ),
      ];

      const result = aggregator.deduplicateByTitleSimilarity(refs);

      expect(result).toHaveLength(2);
    });

    it('should merge metadata from duplicates', () => {
      const refs = [
        createReference(
          '1',
          'React 19 New Features',
          'https://dev.to/article1',
          'devto',
          new Date(),
          { author: 'johndoe' }
        ),
        createReference(
          '2',
          'React 19 New Features',
          'https://hackernews.com/article2',
          'hackernews',
          new Date(),
          { tags: ['react', 'javascript'] }
        ),
      ];

      const result = aggregator.deduplicateByTitleSimilarity(refs);

      expect(result).toHaveLength(1);
      expect(result[0].rawMetadata?.author).toBe('johndoe');
      expect(result[0].rawMetadata?.tags).toEqual(['react', 'javascript']);
    });

    it('should handle empty titles', () => {
      const refs = [
        createReference('1', '', 'https://dev.to/article1', 'devto'),
        createReference('2', '', 'https://hackernews.com/article2', 'hackernews'),
      ];

      const result = aggregator.deduplicateByTitleSimilarity(refs);

      expect(result).toHaveLength(1);
    });
  });

  describe('groupByContentType', () => {
    it('should group references by detected type', () => {
      const aggregator = new ReferenceAggregator();
      const refs = [
        createReference(
          '1',
          'React Tutorial',
          'https://github.com/user/repo',
          'github'
        ),
        createReference(
          '2',
          'Node.js Guide',
          'https://youtube.com/watch?v=123',
          'youtube'
        ),
        createReference('3', 'Blog Post', 'https://dev.to/post', 'devto'),
      ];

      // First enrich the references
      const enriched = refs.map((ref) => aggregator.enrichMetadata(ref));
      const groups = aggregator.groupByContentType(enriched);

      // Should have groups for CODE, VIDEO, and ARTICLE
      expect(groups.length).toBeGreaterThanOrEqual(1);

      const codeGroup = groups.find((g) => g.type === ContentType.CODE);
      const videoGroup = groups.find((g) => g.type === ContentType.VIDEO);
      const articleGroup = groups.find((g) => g.type === ContentType.ARTICLE);

      expect(codeGroup?.count).toBe(1);
      expect(videoGroup?.count).toBe(1);
      expect(articleGroup?.count).toBe(1);
    });

    it('should only include non-empty groups', () => {
      const aggregator = new ReferenceAggregator();
      const refs = [
        createReference('1', 'Blog Post', 'https://dev.to/post', 'devto'),
      ];

      const enriched = refs.map((ref) => aggregator.enrichMetadata(ref));
      const groups = aggregator.groupByContentType(enriched);

      // Should only have ARTICLE group
      expect(groups).toHaveLength(1);
      expect(groups[0].type).toBe(ContentType.ARTICLE);
    });
  });

  describe('enrichMetadata', () => {
    it('should extract author from raw metadata', () => {
      const ref = createReference(
        '1',
        'Test Article',
        'https://dev.to/post',
        'devto',
        new Date(),
        { author: 'John Doe' }
      );

      const enriched = aggregator.enrichMetadata(ref);

      expect(enriched.metadata.author).toBe('John Doe');
    });

    it('should generate favicon URL', () => {
      const ref = createReference(
        '1',
        'Test Article',
        'https://dev.to/post',
        'devto'
      );

      const enriched = aggregator.enrichMetadata(ref);

      expect(enriched.metadata.faviconUrl).toContain('dev.to');
    });

    it('should extract source domain', () => {
      const ref = createReference(
        '1',
        'Test Article',
        'https://www.example.com/article',
        'devto'
      );

      const enriched = aggregator.enrichMetadata(ref);

      expect(enriched.metadata.sourceDomain).toBe('www.example.com');
    });

    it('should normalize URL', () => {
      const ref = createReference(
        '1',
        'Test Article',
        'https://example.com/article/',
        'devto'
      );

      const enriched = aggregator.enrichMetadata(ref);

      expect(enriched.normalizedUrl).toBe('https://example.com/article');
    });

    it('should detect content type', () => {
      const ref = createReference(
        '1',
        'How to Build a CLI',
        'https://example.com/tutorial',
        'devto'
      );

      const enriched = aggregator.enrichMetadata(ref);

      expect(enriched.contentType).toBe(ContentType.TUTORIAL);
    });
  });

  describe('calculateRelevanceScore', () => {
    it('should give higher score to recent content', () => {
      const recentRef = createReference(
        '1',
        'Test',
        'https://dev.to/post1',
        'devto',
        new Date() // Just created
      );
      const oldRef = createReference(
        '2',
        'Test',
        'https://dev.to/post2',
        'devto',
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days old
      );

      const enrichedRecent = aggregator.enrichMetadata(recentRef);
      const enrichedOld = aggregator.enrichMetadata(oldRef);

      const recentScore = aggregator.calculateRelevanceScore(enrichedRecent);
      const oldScore = aggregator.calculateRelevanceScore(enrichedOld);

      expect(recentScore).toBeGreaterThan(oldScore);
    });

    it('should give higher score to hackernews source', () => {
      const hnRef = createReference(
        '1',
        'Test',
        'https://example.com/post1',
        'hackernews',
        new Date()
      );
      const defaultRef = createReference(
        '2',
        'Test',
        'https://example.com/post2',
        'unknown',
        new Date()
      );

      const enrichedHn = aggregator.enrichMetadata(hnRef);
      const enrichedDefault = aggregator.enrichMetadata(defaultRef);

      const hnScore = aggregator.calculateRelevanceScore(enrichedHn);
      const defaultScore = aggregator.calculateRelevanceScore(enrichedDefault);

      expect(hnScore).toBeGreaterThan(defaultScore);
    });

    it('should give bonus for having author', () => {
      const withAuthor = createReference(
        '1',
        'Test',
        'https://dev.to/post1',
        'devto',
        new Date(),
        { author: 'John' }
      );
      const withoutAuthor = createReference(
        '2',
        'Test',
        'https://dev.to/post2',
        'devto',
        new Date()
      );

      const enrichedWithAuthor = aggregator.enrichMetadata(withAuthor);
      const enrichedWithoutAuthor = aggregator.enrichMetadata(withoutAuthor);

      const scoreWithAuthor = aggregator.calculateRelevanceScore(enrichedWithAuthor);
      const scoreWithoutAuthor =
        aggregator.calculateRelevanceScore(enrichedWithoutAuthor);

      expect(scoreWithAuthor).toBeGreaterThan(scoreWithoutAuthor);
    });

    it('should give bonus for tutorials', () => {
      const tutorialRef = createReference(
        '1',
        'How to Build a CLI',
        'https://example.com/tutorial',
        'devto',
        new Date()
      );
      const articleRef = createReference(
        '2',
        'News About Tech',
        'https://news.com/article',
        'devto',
        new Date()
      );

      const enrichedTutorial = aggregator.enrichMetadata(tutorialRef);
      const enrichedArticle = aggregator.enrichMetadata(articleRef);

      const tutorialScore = aggregator.calculateRelevanceScore(enrichedTutorial);
      const articleScore = aggregator.calculateRelevanceScore(enrichedArticle);

      expect(tutorialScore).toBeGreaterThan(articleScore);
    });
  });

  describe('aggregate (full pipeline)', () => {
    it('should process empty input', async () => {
      const result = await aggregator.aggregate([]);

      expect(result.totalReferences).toBe(0);
      expect(result.duplicatesRemoved).toBe(0);
      expect(result.groups).toHaveLength(0);
      expect(result.sources).toHaveLength(0);
    });

    it('should process single reference', async () => {
      const refs = [
        createReference(
          '1',
          'React Tutorial',
          'https://dev.to/react-tutorial',
          'devto',
          new Date(),
          { author: 'johndoe', tags: ['react', 'javascript'] }
        ),
      ];

      const result = await aggregator.aggregate(refs);

      expect(result.totalReferences).toBe(1);
      expect(result.duplicatesRemoved).toBe(0);
      expect(result.groups.length).toBeGreaterThan(0);
      expect(result.sources).toContain('devto');
    });

    it('should aggregate multiple sources', async () => {
      const refs = [
        createReference(
          '1',
          'React 19 Features',
          'https://dev.to/react-19',
          'devto',
          new Date(),
          { author: 'johndoe', tags: ['react'] }
        ),
        createReference(
          '2',
          'Node.js Best Practices',
          'https://hackernews.com/nodejs',
          'hackernews',
          new Date(),
          { by: 'janedoe' }
        ),
        createReference(
          '3',
          'Python Tutorial',
          'https://reddit.com/r/python',
          'reddit',
          new Date()
        ),
      ];

      const result = await aggregator.aggregate(refs);

      expect(result.totalReferences).toBe(3);
      expect(result.sources.sort()).toEqual(['devto', 'hackernews', 'reddit']);
      expect(result.statistics.bySource).toHaveProperty('devto', 1);
      expect(result.statistics.bySource).toHaveProperty('hackernews', 1);
      expect(result.statistics.bySource).toHaveProperty('reddit', 1);
    });

    it('should remove URL duplicates and report in statistics', async () => {
      const refs = [
        createReference('1', 'Article 1', 'https://example.com/article', 'devto'),
        createReference('2', 'Article 2', 'https://example.com/article', 'hackernews'),
        createReference(
          '3',
          'Different Article',
          'https://example.com/different',
          'reddit'
        ),
      ];

      const result = await aggregator.aggregate(refs);

      expect(result.totalReferences).toBe(2);
      expect(result.duplicatesRemoved).toBe(1);
      expect(result.statistics.urlDuplicates).toBe(1);
    });

    it('should remove title similarity duplicates and report in statistics', async () => {
      const refs = [
        createReference(
          '1',
          'React 19 New Features Guide',
          'https://dev.to/article1',
          'devto'
        ),
        createReference(
          '2',
          'React 19: New Features Guide',
          'https://hackernews.com/article2',
          'hackernews'
        ),
        createReference(
          '3',
          'Completely Different Topic',
          'https://reddit.com/article3',
          'reddit'
        ),
      ];

      const result = await aggregator.aggregate(refs);

      expect(result.totalReferences).toBe(2);
      expect(result.statistics.titleDuplicates).toBe(1);
    });

    it('should order by relevance within groups', async () => {
      // Create references with different relevance factors
      const refs = [
        createReference(
          '1',
          'Old Article',
          'https://dev.to/old',
          'unknown',
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days old, unknown source
        ),
        createReference(
          '2',
          'Recent Article with Author',
          'https://hackernews.com/recent',
          'hackernews',
          new Date(), // Recent, good source
          { author: 'johndoe', tags: ['react', 'web', 'javascript'] }
        ),
      ];

      const result = await aggregator.aggregate(refs);

      // Find the article group
      const articleGroup = result.groups.find((g) => g.type === ContentType.ARTICLE);
      expect(articleGroup).toBeDefined();
      expect(articleGroup!.references[0].source).toBe('hackernews'); // Higher relevance
    });

    it('should include correct statistics', async () => {
      const refs = [
        createReference(
          '1',
          'GitHub Project',
          'https://github.com/user/repo',
          'github'
        ),
        createReference('2', 'YouTube Video', 'https://youtube.com/watch', 'youtube'),
        createReference('3', 'Blog Post', 'https://dev.to/post', 'devto'),
      ];

      const result = await aggregator.aggregate(refs);

      expect(result.statistics.byContentType[ContentType.CODE]).toBe(1);
      expect(result.statistics.byContentType[ContentType.VIDEO]).toBe(1);
      expect(result.statistics.byContentType[ContentType.ARTICLE]).toBe(1);
      expect(result.statistics.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should respect maxReferencesPerGroup option', async () => {
      const aggregatorWithLimit = new ReferenceAggregator({
        maxReferencesPerGroup: 2,
      });

      const refs = [
        createReference('1', 'First Unique Article Title', 'https://dev.to/post1', 'devto'),
        createReference('2', 'Second Different Article Title', 'https://dev.to/post2', 'devto'),
        createReference('3', 'Third Separate Article Title', 'https://dev.to/post3', 'devto'),
        createReference('4', 'Fourth Distinct Article Title', 'https://dev.to/post4', 'devto'),
      ];

      const result = await aggregatorWithLimit.aggregate(refs);

      const articleGroup = result.groups.find((g) => g.type === ContentType.ARTICLE);
      expect(articleGroup?.count).toBe(2);
    });

    it('should use custom title similarity threshold', async () => {
      // With default 0.85 threshold, these should be duplicates
      const strictAggregator = new ReferenceAggregator({
        titleSimilarityThreshold: 0.95,
      });

      const refs = [
        createReference(
          '1',
          'React 19 New Features',
          'https://dev.to/article1',
          'devto'
        ),
        createReference(
          '2',
          'React 19 Features Guide',
          'https://hackernews.com/article2',
          'hackernews'
        ),
      ];

      const result = await strictAggregator.aggregate(refs);

      // With 0.95 threshold, these should be kept as separate
      expect(result.totalReferences).toBe(2);
    });
  });
});
