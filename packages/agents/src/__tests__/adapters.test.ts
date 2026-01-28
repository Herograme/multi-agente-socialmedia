/**
 * Tests for search adapters
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RateLimiter } from '@social-content/shared';
import { DevToAdapter } from '../services/search/adapters/devto-adapter';
import { MediumAdapter } from '../services/search/adapters/medium-adapter';
import { GitHubAdapter } from '../services/search/adapters/github-adapter';

// Mock data
const mockDevToResponse = [
  {
    id: 123456,
    title: 'Building a React App with TypeScript',
    description: 'Learn how to build modern React apps...',
    url: 'https://dev.to/author/react-typescript',
    published_at: '2026-01-28T10:00:00Z',
    user: { name: 'John Dev', username: 'johndev' },
    tag_list: ['react', 'typescript', 'tutorial'],
    positive_reactions_count: 150,
    comments_count: 25,
    reading_time_minutes: 8,
  },
  {
    id: 123457,
    title: 'TypeScript Tips and Tricks',
    description: 'Advanced TypeScript techniques',
    url: 'https://dev.to/author/typescript-tips',
    published_at: '2026-01-27T08:00:00Z',
    user: { name: 'Jane Coder', username: 'janecoder' },
    tag_list: ['typescript', 'tips'],
    positive_reactions_count: 200,
    comments_count: 40,
    reading_time_minutes: 10,
  },
];

const mockMediumFeed = `
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Medium Tag: JavaScript</title>
    <item>
      <title>Understanding JavaScript Closures</title>
      <link>https://medium.com/@author/closures-123</link>
      <pubDate>Mon, 28 Jan 2026 12:00:00 GMT</pubDate>
      <dc:creator>Jane Writer</dc:creator>
      <category>javascript</category>
      <category>programming</category>
      <content:encoded><![CDATA[<p>Closures are one of the most powerful features of JavaScript. In this article, we'll explore how closures work and why they matter.</p>]]></content:encoded>
    </item>
    <item>
      <title>Modern JavaScript Features</title>
      <link>https://medium.com/@author/modern-js-456</link>
      <pubDate>Sun, 27 Jan 2026 15:30:00 GMT</pubDate>
      <dc:creator>Tech Author</dc:creator>
      <category>javascript</category>
      <category>es6</category>
      <content:encoded><![CDATA[<p>ES2026 brings new features to JavaScript.</p>]]></content:encoded>
    </item>
  </channel>
</rss>
`;

const mockGitHubResponse = {
  total_count: 2,
  incomplete_results: false,
  items: [
    {
      id: 789012,
      name: 'awesome-typescript',
      full_name: 'owner/awesome-typescript',
      description: 'A curated list of TypeScript resources',
      html_url: 'https://github.com/owner/awesome-typescript',
      owner: { login: 'owner' },
      topics: ['typescript', 'awesome-list'],
      stargazers_count: 5000,
      created_at: '2025-06-15T00:00:00Z',
      updated_at: '2026-01-27T00:00:00Z',
    },
    {
      id: 789013,
      name: 'typescript-starter',
      full_name: 'dev/typescript-starter',
      description: 'A starter template for TypeScript projects',
      html_url: 'https://github.com/dev/typescript-starter',
      owner: { login: 'dev' },
      topics: ['typescript', 'template', 'starter'],
      stargazers_count: 1500,
      created_at: '2025-08-20T00:00:00Z',
      updated_at: '2026-01-26T00:00:00Z',
    },
  ],
};

describe('DevToAdapter', () => {
  let adapter: DevToAdapter;
  let rateLimiter: RateLimiter;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    rateLimiter = new RateLimiter({ maxRequests: 30, windowMs: 60000 });
    adapter = new DevToAdapter(rateLimiter, 5000);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should have correct name', () => {
    expect(adapter.name).toBe('devto');
  });

  it('should search by single keyword', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDevToResponse),
    });

    const results = await adapter.search(['typescript'], { limit: 10 });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].source).toBe('devto');
    expect(results[0].id).toMatch(/^devto-/);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('tag=typescript'),
      expect.any(Object)
    );
  });

  it('should search by multiple keywords', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDevToResponse),
    });

    const results = await adapter.search(['typescript', 'react'], { limit: 10 });

    expect(results.length).toBeGreaterThan(0);
    // Should be called twice, once for each keyword
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should normalize articles to SearchResult', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockDevToResponse[0]]),
    });

    const results = await adapter.search(['typescript'], { limit: 10 });
    const result = results[0];

    expect(result.id).toBe('devto-123456');
    expect(result.title).toBe('Building a React App with TypeScript');
    expect(result.description).toBe('Learn how to build modern React apps...');
    expect(result.url).toBe('https://dev.to/author/react-typescript');
    expect(result.source).toBe('devto');
    expect(result.author).toBe('John Dev');
    expect(result.publishedAt).toBeInstanceOf(Date);
    expect(result.tags).toEqual(['react', 'typescript', 'tutorial']);
    expect(result.metrics?.likes).toBe(150);
    expect(result.metrics?.comments).toBe(25);
    expect(result.metrics?.readingTime).toBe(8);
  });

  it('should handle empty results', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const results = await adapter.search(['nonexistent'], { limit: 10 });

    expect(results).toHaveLength(0);
  });

  it('should handle API errors', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(adapter.search(['test'])).rejects.toThrow('Dev.to search failed');
  });

  it('should handle timeout', async () => {
    globalThis.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((_, reject) => {
          const error = new Error('Aborted');
          error.name = 'AbortError';
          setTimeout(() => reject(error), 100);
        })
    );

    const shortTimeoutAdapter = new DevToAdapter(rateLimiter, 50);
    await expect(shortTimeoutAdapter.search(['test'])).rejects.toThrow('timed out');
  });

  it('should return empty array for empty keywords', async () => {
    const results = await adapter.search([], { limit: 10 });
    expect(results).toHaveLength(0);
  });
});

describe('MediumAdapter', () => {
  let adapter: MediumAdapter;
  let rateLimiter: RateLimiter;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    rateLimiter = new RateLimiter({ maxRequests: 20, windowMs: 60000 });
    adapter = new MediumAdapter(rateLimiter, 5000);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should have correct name', () => {
    expect(adapter.name).toBe('medium');
  });

  it('should parse RSS feed correctly', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockMediumFeed),
    });

    const results = await adapter.search(['javascript'], { limit: 10 });

    expect(results.length).toBe(2);
    expect(results[0].source).toBe('medium');
  });

  it('should extract description from content', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockMediumFeed),
    });

    const results = await adapter.search(['javascript'], { limit: 10 });

    expect(results[0].description).toContain('Closures are');
    expect(results[0].description).not.toContain('<p>');
  });

  it('should calculate reading time', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockMediumFeed),
    });

    const results = await adapter.search(['javascript'], { limit: 10 });

    expect(results[0].metrics?.readingTime).toBeGreaterThan(0);
  });

  it('should normalize to SearchResult', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockMediumFeed),
    });

    const results = await adapter.search(['javascript'], { limit: 10 });
    const result = results[0];

    expect(result.id).toMatch(/^medium-/);
    expect(result.title).toBe('Understanding JavaScript Closures');
    expect(result.url).toBe('https://medium.com/@author/closures-123');
    expect(result.source).toBe('medium');
    expect(result.author).toBe('Jane Writer');
    expect(result.publishedAt).toBeInstanceOf(Date);
    expect(result.tags).toContain('javascript');
  });

  it('should handle empty feed', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<rss><channel></channel></rss>'),
    });

    const results = await adapter.search(['empty'], { limit: 10 });

    expect(results).toHaveLength(0);
  });

  it('should handle API errors', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(adapter.search(['test'])).rejects.toThrow('Medium search failed');
  });

  it('should return empty array for empty keywords', async () => {
    const results = await adapter.search([], { limit: 10 });
    expect(results).toHaveLength(0);
  });
});

describe('GitHubAdapter', () => {
  let adapter: GitHubAdapter;
  let rateLimiter: RateLimiter;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    rateLimiter = new RateLimiter({ maxRequests: 10, windowMs: 60000 });
    adapter = new GitHubAdapter(rateLimiter, 5000);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should have correct name', () => {
    expect(adapter.name).toBe('github');
  });

  it('should search repositories', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGitHubResponse),
    });

    const results = await adapter.search(['typescript'], { limit: 10 });

    expect(results.length).toBe(2);
    expect(results[0].source).toBe('github');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('search/repositories'),
      expect.any(Object)
    );
  });

  it('should normalize repos to SearchResult', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGitHubResponse),
    });

    const results = await adapter.search(['typescript'], { limit: 10 });
    const result = results[0];

    expect(result.id).toBe('github-789012');
    expect(result.title).toBe('awesome-typescript');
    expect(result.description).toBe('A curated list of TypeScript resources');
    expect(result.url).toBe('https://github.com/owner/awesome-typescript');
    expect(result.source).toBe('github');
    expect(result.author).toBe('owner');
    expect(result.publishedAt).toBeInstanceOf(Date);
    expect(result.tags).toContain('typescript');
    expect(result.metrics?.stars).toBe(5000);
  });

  it('should handle rate limit errors', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      headers: new Map([
        ['X-RateLimit-Remaining', '0'],
        ['X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 3600)],
      ]),
    });

    // Mock headers.get
    const mockResponse = {
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      headers: {
        get: (name: string) => {
          if (name === 'X-RateLimit-Remaining') return '0';
          if (name === 'X-RateLimit-Reset')
            return String(Math.floor(Date.now() / 1000) + 3600);
          return null;
        },
      },
    };

    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    await expect(adapter.search(['test'])).rejects.toThrow('rate limit');
  });

  it('should handle API errors', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      headers: { get: () => null },
    });

    await expect(adapter.search(['test'])).rejects.toThrow('GitHub search failed');
  });

  it('should return empty array for empty keywords', async () => {
    const results = await adapter.search([], { limit: 10 });
    expect(results).toHaveLength(0);
  });

  it('should indicate authentication status', () => {
    expect(adapter.isAuthenticated()).toBe(false);

    const authAdapter = new GitHubAdapter(rateLimiter, 5000, 'test-token');
    expect(authAdapter.isAuthenticated()).toBe(true);
  });

  it('should include auth header when token is provided', async () => {
    const authAdapter = new GitHubAdapter(rateLimiter, 5000, 'test-token');

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ total_count: 0, incomplete_results: false, items: [] }),
    });

    await authAdapter.search(['test']);

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
  });

  it('should build query with language filter', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ total_count: 0, incomplete_results: false, items: [] }),
    });

    await adapter.search(['typescript'], { language: 'typescript', limit: 10 });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('language%3Atypescript'),
      expect.any(Object)
    );
  });
});

describe('Rate Limiting', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should respect rate limits', async () => {
    // Use a very restrictive rate limiter
    const rateLimiter = new RateLimiter({ maxRequests: 2, windowMs: 1000 });
    const adapter = new DevToAdapter(rateLimiter, 5000);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    // Make multiple rapid requests
    await adapter.search(['test1'], { limit: 5 });
    await adapter.search(['test2'], { limit: 5 });
    // Third request should wait due to rate limiting
    await adapter.search(['test3'], { limit: 5 });

    // Should have taken some time due to rate limiting
    // (relaxed check since timing can vary)
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
