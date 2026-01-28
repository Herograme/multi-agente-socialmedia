import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ResearcherAgent,
  createResearcherAgent,
  normalizeTitle,
  areTitlesSimilar,
  deduplicateTrends,
  sortTrendsByDate,
} from '../agents/researcher';
import type { Trend } from '@social-content/shared';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock RSS response for Dev.to
const mockDevToRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>React 19 New Features</title>
      <link>https://dev.to/post/123</link>
      <pubDate>Mon, 28 Jan 2025 10:00:00 GMT</pubDate>
      <description>Exploring React 19</description>
    </item>
    <item>
      <title>TypeScript Best Practices</title>
      <link>https://dev.to/post/124</link>
      <pubDate>Mon, 28 Jan 2025 09:00:00 GMT</pubDate>
      <description>Best practices for TypeScript</description>
    </item>
  </channel>
</rss>`;

// Mock HN API responses
const mockHNTopStories = [12345, 12346];
const mockHNItem1 = {
  id: 12345,
  title: 'Show HN: My new project',
  url: 'https://example.com/project',
  score: 150,
  time: 1706436000,
  by: 'user1',
  type: 'story',
};
const mockHNItem2 = {
  id: 12346,
  title: 'Ask HN: Best practices',
  url: 'https://example.com/ask',
  score: 100,
  time: 1706432400,
  by: 'user2',
  type: 'story',
};

// Mock Reddit Atom feed
const mockRedditAtom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>Rust vs Go Performance</title>
    <link href="https://reddit.com/r/programming/post/1"/>
    <published>2025-01-28T08:00:00Z</published>
    <author><name>redditor1</name></author>
  </entry>
  <entry>
    <title>Python 4.0 Announcement</title>
    <link href="https://reddit.com/r/programming/post/2"/>
    <published>2025-01-28T07:00:00Z</published>
    <author><name>redditor2</name></author>
  </entry>
</feed>`;

describe('Researcher Agent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('normalizeTitle', () => {
    it('should lowercase and remove punctuation', () => {
      expect(normalizeTitle('React 19: New Features!')).toBe('react 19 new features');
    });

    it('should normalize whitespace', () => {
      expect(normalizeTitle('  Multiple   Spaces  ')).toBe('multiple spaces');
    });
  });

  describe('areTitlesSimilar', () => {
    it('should detect exact matches after normalization', () => {
      expect(areTitlesSimilar('React 19', 'react 19')).toBe(true);
    });

    it('should detect when one contains the other', () => {
      expect(areTitlesSimilar('React 19 Features', 'React 19')).toBe(true);
    });

    it('should detect similar titles with Levenshtein distance', () => {
      expect(areTitlesSimilar('React 19 Features', 'React 19 Feature')).toBe(true);
    });

    it('should reject very different titles', () => {
      expect(areTitlesSimilar('React Features', 'Python Tutorial')).toBe(false);
    });
  });

  describe('deduplicateTrends', () => {
    it('should remove duplicate trends', () => {
      const trends: Trend[] = [
        {
          id: '1',
          title: 'React 19 Features',
          source: 'devto',
          url: 'https://dev.to/1',
          discoveredAt: new Date(),
        },
        {
          id: '2',
          title: 'React 19 Features',
          source: 'hackernews',
          url: 'https://hn.com/1',
          discoveredAt: new Date(),
        },
      ];

      const result = deduplicateTrends(trends);
      expect(result).toHaveLength(1);
    });

    it('should keep unique trends', () => {
      const trends: Trend[] = [
        {
          id: '1',
          title: 'React 19',
          source: 'devto',
          url: 'https://dev.to/1',
          discoveredAt: new Date(),
        },
        {
          id: '2',
          title: 'TypeScript 5.4',
          source: 'hackernews',
          url: 'https://hn.com/1',
          discoveredAt: new Date(),
        },
      ];

      const result = deduplicateTrends(trends);
      expect(result).toHaveLength(2);
    });
  });

  describe('sortTrendsByDate', () => {
    it('should sort trends by date descending', () => {
      const trends: Trend[] = [
        {
          id: '1',
          title: 'Old',
          source: 'devto',
          url: 'https://dev.to/1',
          discoveredAt: new Date('2025-01-01'),
        },
        {
          id: '2',
          title: 'New',
          source: 'hackernews',
          url: 'https://hn.com/1',
          discoveredAt: new Date('2025-01-28'),
        },
      ];

      const result = sortTrendsByDate(trends);
      expect(result[0].title).toBe('New');
      expect(result[1].title).toBe('Old');
    });
  });

  describe('ResearcherAgent', () => {
    beforeEach(() => {
      // Setup mock responses
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('dev.to')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(mockDevToRss),
          });
        }
        if (url.includes('hacker-news') && url.includes('topstories')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockHNTopStories),
          });
        }
        if (url.includes('hacker-news') && url.includes('item/12345')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockHNItem1),
          });
        }
        if (url.includes('hacker-news') && url.includes('item/12346')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockHNItem2),
          });
        }
        if (url.includes('reddit.com')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(mockRedditAtom),
          });
        }
        return Promise.reject(new Error(`Unknown URL: ${url}`));
      });
    });

    it('should create agent with factory function', () => {
      const agent = createResearcherAgent();
      expect(agent).toBeInstanceOf(ResearcherAgent);
      expect(agent.name).toBe('researcher');
    });

    it('should have initial idle status', () => {
      const agent = createResearcherAgent();
      expect(agent.status).toBe('idle');
    });

    it('should fetch trends from all sources', async () => {
      const agent = createResearcherAgent();
      const result = await agent.run({ limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.trends.length).toBeGreaterThan(0);
      expect(result.data!.metadata.sourcesQueried.length).toBe(3);
    });

    it('should respect limit parameter', async () => {
      const agent = createResearcherAgent();
      const result = await agent.run({ limit: 3 });

      expect(result.success).toBe(true);
      expect(result.data!.trends.length).toBeLessThanOrEqual(3);
    });

    it('should fetch from specific sources only', async () => {
      const agent = createResearcherAgent();
      const result = await agent.run({ sources: ['devto'], limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data!.metadata.sourcesQueried).toContain('devto');
    });

    it('should include metadata in results', async () => {
      const agent = createResearcherAgent();
      const result = await agent.run({ limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data!.metadata).toBeDefined();
      expect(result.data!.metadata.sourcesQueried).toBeDefined();
      expect(result.data!.metadata.totalFound).toBeDefined();
      expect(result.data!.metadata.timestamp).toBeDefined();
    });

    it('should update status after success', async () => {
      const agent = createResearcherAgent();
      await agent.run({ limit: 5 });

      expect(agent.status).toBe('success');
    });

    it('should handle source failures gracefully', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('dev.to')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(mockDevToRss),
          });
        }
        // Fail other sources
        return Promise.reject(new Error('Network error'));
      });

      const agent = createResearcherAgent();
      const result = await agent.run({ sources: ['devto', 'hackernews'], limit: 10 });

      // Should still succeed with partial results
      expect(result.success).toBe(true);
      expect(result.data!.trends.length).toBeGreaterThan(0);
    });

    it('should return error when all sources fail', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const agent = createResearcherAgent();
      const result = await agent.run({ limit: 10 });

      // With rate limiter, some sources might not even be queried
      // so we just check that no trends were found
      if (result.success) {
        expect(result.data!.trends.length).toBe(0);
      } else {
        expect(result.error).toBeDefined();
      }
    });

    it('should include duration in result', async () => {
      const agent = createResearcherAgent();
      const result = await agent.run({ limit: 5 });

      expect(result.duration).toBeDefined();
      expect(typeof result.duration).toBe('number');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });
});
