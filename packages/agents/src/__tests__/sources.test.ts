/**
 * Tests for trend source implementations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DevToSource } from '../services/sources/devto';
import { HackerNewsSource } from '../services/sources/hackernews';
import { RedditSource } from '../services/sources/reddit';

// Mock RSS feed responses
const mockDevToRSS = `
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>DEV Community</title>
    <item>
      <title>React 19 New Features</title>
      <link>https://dev.to/post/123</link>
      <pubDate>Mon, 28 Jan 2025 10:00:00 GMT</pubDate>
      <description>A comprehensive guide to React 19</description>
      <dc:creator>devauthor</dc:creator>
      <category>react</category>
      <category>javascript</category>
    </item>
    <item>
      <title>TypeScript Best Practices</title>
      <link>https://dev.to/post/456</link>
      <pubDate>Sun, 27 Jan 2025 15:30:00 GMT</pubDate>
      <description>Learn TypeScript tips</description>
    </item>
  </channel>
</rss>
`;

const mockRedditAtom = `
<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>programming</title>
  <entry>
    <title>Rust vs Go Performance</title>
    <link href="https://reddit.com/r/programming/1" />
    <updated>2025-01-28T09:00:00Z</updated>
    <author><name>/u/rustfan</name></author>
    <content type="html">&lt;p&gt;A detailed comparison&lt;/p&gt;</content>
  </entry>
  <entry>
    <title>New Python Features</title>
    <link href="https://reddit.com/r/programming/2" />
    <updated>2025-01-27T14:00:00Z</updated>
    <content type="html">Python 3.13 is here</content>
  </entry>
</feed>
`;

// Mock HN API responses
const mockHNTopStories = [12345, 12346, 12347];

const mockHNItems: Record<number, object> = {
  12345: {
    id: 12345,
    title: 'Show HN: My new project',
    url: 'https://example.com/project',
    score: 150,
    time: 1706436000,
    by: 'hnuser',
    type: 'story',
  },
  12346: {
    id: 12346,
    title: 'Ask HN: Best practices for startups',
    score: 100,
    time: 1706432000,
    by: 'startup_guy',
    type: 'story',
  },
  12347: {
    id: 12347,
    title: 'A comment',
    score: 10,
    time: 1706430000,
    by: 'commenter',
    type: 'comment', // Should be filtered out
  },
};

describe('DevToSource', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should fetch and parse RSS feed correctly', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockDevToRSS),
    });

    const source = new DevToSource();
    const trends = await source.fetch({ limit: 10 });

    expect(trends).toHaveLength(2);
    expect(trends[0].title).toBe('React 19 New Features');
    expect(trends[0].source).toBe('devto');
    expect(trends[0].url).toBe('https://dev.to/post/123');
    expect(trends[0]).toHaveProperty('id');
    expect(trends[0]).toHaveProperty('discoveredAt');
  });

  it('should respect limit option', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockDevToRSS),
    });

    const source = new DevToSource();
    const trends = await source.fetch({ limit: 1 });

    expect(trends).toHaveLength(1);
  });

  it('should throw error on failed fetch', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const source = new DevToSource();

    await expect(source.fetch()).rejects.toThrow('Dev.to API error');
  });

  it('should have correct source name', () => {
    const source = new DevToSource();
    expect(source.name).toBe('devto');
  });
});

describe('HackerNewsSource', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should fetch and parse HN stories correctly', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('topstories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockHNTopStories),
        });
      }
      const idMatch = url.match(/item\/(\d+)/);
      if (idMatch) {
        const id = parseInt(idMatch[1], 10);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockHNItems[id] || null),
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });

    const source = new HackerNewsSource();
    const trends = await source.fetch({ limit: 10 });

    // Should filter out the comment, only return stories
    expect(trends).toHaveLength(2);
    expect(trends[0].title).toBe('Show HN: My new project');
    expect(trends[0].source).toBe('hackernews');
    expect(trends[0].url).toBe('https://example.com/project');
  });

  it('should create HN URL for items without URL', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('topstories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([12346]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockHNItems[12346]),
      });
    });

    const source = new HackerNewsSource();
    const trends = await source.fetch({ limit: 1 });

    expect(trends[0].url).toBe('https://news.ycombinator.com/item?id=12346');
  });

  it('should have correct source name', () => {
    const source = new HackerNewsSource();
    expect(source.name).toBe('hackernews');
  });
});

describe('RedditSource', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should fetch and parse Atom feed correctly', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockRedditAtom),
    });

    const source = new RedditSource();
    const trends = await source.fetch({ limit: 10 });

    expect(trends).toHaveLength(2);
    expect(trends[0].title).toBe('Rust vs Go Performance');
    expect(trends[0].source).toBe('reddit');
    expect(trends[0].url).toBe('https://reddit.com/r/programming/1');
  });

  it('should respect limit option', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockRedditAtom),
    });

    const source = new RedditSource();
    const trends = await source.fetch({ limit: 1 });

    expect(trends).toHaveLength(1);
  });

  it('should throw error on failed fetch', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    });

    const source = new RedditSource();

    await expect(source.fetch()).rejects.toThrow('Reddit API error');
  });

  it('should have correct source name', () => {
    const source = new RedditSource();
    expect(source.name).toBe('reddit');
  });
});
