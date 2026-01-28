/**
 * Tests for ContentSearchService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ContentSearchService } from '../services/search/content-search-service';
import type { SourceType } from '../services/search/types';

describe('ContentSearchService', () => {
  let service: ContentSearchService;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    service = new ContentSearchService();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('initialization', () => {
    it('should initialize with default adapters', () => {
      expect(service.hasSource('devto')).toBe(true);
      expect(service.hasSource('medium')).toBe(true);
      expect(service.hasSource('github')).toBe(true);
    });

    it('should return available sources', () => {
      const sources = service.getAvailableSources();
      expect(sources).toContain('devto');
      expect(sources).toContain('medium');
      expect(sources).toContain('github');
    });

    it('should accept custom options', () => {
      const customService = new ContentSearchService({
        defaultLimit: 20,
        timeout: 5000,
        githubToken: 'test-token',
      });
      expect(customService.getAvailableSources()).toHaveLength(3);
    });
  });

  describe('search', () => {
    it('should search all sources in parallel', async () => {
      // Mock all API calls
      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('dev.to')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve([
                {
                  id: 123,
                  title: 'TypeScript Guide',
                  description: 'A guide',
                  url: 'https://dev.to/post/123',
                  published_at: '2026-01-27T10:00:00Z',
                  user: { name: 'Author', username: 'author' },
                  tag_list: ['typescript'],
                  positive_reactions_count: 50,
                  comments_count: 10,
                  reading_time_minutes: 5,
                },
              ]),
          });
        }
        if (url.includes('medium.com')) {
          return Promise.resolve({
            ok: true,
            text: () =>
              Promise.resolve(`
              <rss><channel>
                <item>
                  <title>JavaScript Tips</title>
                  <link>https://medium.com/post/1</link>
                  <pubDate>Mon, 28 Jan 2026 08:00:00 GMT</pubDate>
                  <dc:creator>Writer</dc:creator>
                  <content:encoded><![CDATA[Content here]]></content:encoded>
                </item>
              </channel></rss>
            `),
          });
        }
        if (url.includes('github.com')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                total_count: 1,
                incomplete_results: false,
                items: [
                  {
                    id: 789,
                    name: 'typescript-lib',
                    full_name: 'owner/typescript-lib',
                    description: 'A TypeScript library',
                    html_url: 'https://github.com/owner/typescript-lib',
                    owner: { login: 'owner' },
                    topics: ['typescript'],
                    stargazers_count: 100,
                    created_at: '2025-01-01T00:00:00Z',
                    updated_at: '2026-01-27T00:00:00Z',
                  },
                ],
              }),
          });
        }
        return Promise.resolve({ ok: false, status: 404 });
      });

      const response = await service.search({
        keywords: ['typescript'],
        limit: 5,
      });

      expect(response.results.length).toBeGreaterThan(0);
      expect(response.metadata.sourcesQueried).toHaveLength(3);
      expect(response.metadata.searchDuration).toBeGreaterThanOrEqual(0);
    });

    it('should filter by specific sources', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id: 123,
              title: 'Test Article',
              description: 'Test',
              url: 'https://dev.to/test',
              published_at: '2026-01-27T10:00:00Z',
              user: { name: 'Test', username: 'test' },
              tag_list: [],
              positive_reactions_count: 10,
              comments_count: 5,
              reading_time_minutes: 3,
            },
          ]),
      });

      const response = await service.search({
        keywords: ['test'],
        sources: ['devto'],
        limit: 5,
      });

      expect(response.metadata.sourcesQueried).toEqual(['devto']);
    });

    it('should deduplicate results with similar titles', async () => {
      // Create a mock that returns articles with same title from different sources
      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('dev.to')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve([
                {
                  id: 1,
                  title: 'TypeScript Best Practices',
                  description: 'A guide',
                  url: 'https://dev.to/typescript',
                  published_at: '2026-01-27T10:00:00Z',
                  user: { name: 'Author1', username: 'author1' },
                  tag_list: [],
                  positive_reactions_count: 10,
                  comments_count: 5,
                  reading_time_minutes: 5,
                },
              ]),
          });
        }
        if (url.includes('medium.com')) {
          return Promise.resolve({
            ok: true,
            text: () =>
              Promise.resolve(`
              <rss><channel>
                <item>
                  <title>TypeScript Best Practices</title>
                  <link>https://medium.com/typescript</link>
                  <pubDate>Mon, 26 Jan 2026 08:00:00 GMT</pubDate>
                  <dc:creator>Author2</dc:creator>
                  <content:encoded><![CDATA[Content]]></content:encoded>
                </item>
              </channel></rss>
            `),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ total_count: 0, incomplete_results: false, items: [] }),
        });
      });

      const response = await service.search({
        keywords: ['typescript'],
        sources: ['devto', 'medium'],
      });

      // Should deduplicate based on title
      const titles = response.results.map((r) => r.title);
      const uniqueTitles = [...new Set(titles)];
      expect(uniqueTitles.length).toBe(titles.length);
    });

    it('should sort results by date (most recent first)', async () => {
      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('dev.to')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve([
                {
                  id: 1,
                  title: 'Old Article',
                  description: 'Old',
                  url: 'https://dev.to/old',
                  published_at: '2025-01-01T10:00:00Z',
                  user: { name: 'Author', username: 'author' },
                  tag_list: [],
                  positive_reactions_count: 10,
                  comments_count: 5,
                  reading_time_minutes: 5,
                },
                {
                  id: 2,
                  title: 'New Article',
                  description: 'New',
                  url: 'https://dev.to/new',
                  published_at: '2026-01-27T10:00:00Z',
                  user: { name: 'Author', username: 'author' },
                  tag_list: [],
                  positive_reactions_count: 10,
                  comments_count: 5,
                  reading_time_minutes: 5,
                },
              ]),
          });
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('<rss><channel></channel></rss>'),
          json: () =>
            Promise.resolve({ total_count: 0, incomplete_results: false, items: [] }),
        });
      });

      const response = await service.search({
        keywords: ['test'],
        sources: ['devto'],
      });

      expect(response.results[0].title).toBe('New Article');
      expect(response.results[1].title).toBe('Old Article');
    });

    it('should handle source failures gracefully', async () => {
      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('dev.to')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve([
                {
                  id: 1,
                  title: 'Working Article',
                  description: 'Works',
                  url: 'https://dev.to/works',
                  published_at: '2026-01-27T10:00:00Z',
                  user: { name: 'Author', username: 'author' },
                  tag_list: [],
                  positive_reactions_count: 10,
                  comments_count: 5,
                  reading_time_minutes: 5,
                },
              ]),
          });
        }
        // Make Medium fail
        if (url.includes('medium.com')) {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
          });
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ total_count: 0, incomplete_results: false, items: [] }),
        });
      });

      const response = await service.search({
        keywords: ['test'],
        sources: ['devto', 'medium'],
      });

      // Should still return results from working source
      expect(response.results.length).toBeGreaterThan(0);
      // Should include error metadata
      expect(response.metadata.errors).toBeDefined();
      expect(response.metadata.errors?.some((e) => e.source === 'medium')).toBe(true);
    });

    it('should return search metadata', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
        text: () => Promise.resolve('<rss><channel></channel></rss>'),
      });

      const query = {
        keywords: ['typescript'],
        sources: ['devto' as SourceType],
        limit: 10,
      };

      const response = await service.search(query);

      expect(response.metadata.query).toEqual(query);
      expect(response.metadata.sourcesQueried).toEqual(['devto']);
      expect(response.metadata.totalResults).toBe(0);
      expect(response.metadata.searchDuration).toBeGreaterThanOrEqual(0);
      expect(response.metadata.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('searchSource', () => {
    it('should search a single source', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id: 1,
              title: 'Test',
              description: 'Test',
              url: 'https://dev.to/test',
              published_at: '2026-01-27T10:00:00Z',
              user: { name: 'Author', username: 'author' },
              tag_list: [],
              positive_reactions_count: 10,
              comments_count: 5,
              reading_time_minutes: 5,
            },
          ]),
      });

      const results = await service.searchSource('devto', ['test'], 5);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].source).toBe('devto');
    });

    it('should throw error for unknown source', async () => {
      await expect(
        service.searchSource('unknown' as SourceType, ['test'])
      ).rejects.toThrow('Unknown source: unknown');
    });
  });
});
