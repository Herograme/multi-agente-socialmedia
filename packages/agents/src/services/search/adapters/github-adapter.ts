/**
 * GitHub Search Adapter - Searches GitHub repositories by query
 * API Documentation: https://docs.github.com/en/rest/search
 *
 * Rate limits:
 * - Unauthenticated: 10 requests/minute
 * - Authenticated: 30 requests/minute
 */

import { RateLimiter, createLogger } from '@social-content/shared';
import type {
  SourceAdapter,
  SourceType,
  SearchResult,
  AdapterOptions,
  GitHubRepo,
  GitHubSearchResponse,
} from '../types';

const logger = createLogger('search:github');

const GITHUB_API_BASE = 'https://api.github.com';
const DEFAULT_LIMIT = 10;
const DEFAULT_TIMEOUT = 10000;

/**
 * Normalize GitHub repository to SearchResult format
 */
function normalizeRepo(repo: GitHubRepo): SearchResult {
  return {
    id: `github-${repo.id}`,
    title: repo.name,
    description: repo.description || '',
    url: repo.html_url,
    source: 'github',
    author: repo.owner?.login || 'Unknown',
    publishedAt: new Date(repo.created_at),
    tags: repo.topics || [],
    metrics: {
      stars: repo.stargazers_count,
    },
  };
}

/**
 * Build GitHub search query from keywords and options
 */
function buildSearchQuery(keywords: string[], language?: string): string {
  const parts = keywords.map((k) => k.trim()).filter((k) => k.length > 0);

  if (language) {
    parts.push(`language:${language}`);
  }

  return parts.join(' ');
}

/**
 * GitHub Search Adapter
 *
 * @example
 * const adapter = new GitHubAdapter(rateLimiter);
 * const results = await adapter.search(['typescript', 'react'], { limit: 10 });
 */
export class GitHubAdapter implements SourceAdapter {
  readonly name: SourceType = 'github';
  private rateLimiter: RateLimiter;
  private timeout: number;
  private token?: string;

  constructor(
    rateLimiter: RateLimiter,
    timeout: number = DEFAULT_TIMEOUT,
    token?: string
  ) {
    this.rateLimiter = rateLimiter;
    this.timeout = timeout;
    this.token = token;
  }

  /**
   * Search GitHub repositories by keywords
   */
  async search(keywords: string[], options: AdapterOptions = {}): Promise<SearchResult[]> {
    const limit = options.limit ?? DEFAULT_LIMIT;

    if (keywords.length === 0) {
      logger.warn('No keywords provided for GitHub search');
      return [];
    }

    logger.info('Searching GitHub repositories', { keywords, limit });

    try {
      await this.rateLimiter.acquire();

      const query = buildSearchQuery(keywords, options.language);
      const repos = await this.searchRepositories(query, limit);

      const results = repos.map(normalizeRepo);

      logger.info('GitHub search completed', {
        keywords,
        found: results.length,
      });

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('GitHub search failed', { error: errorMessage, keywords });
      throw new Error(`GitHub search failed: ${errorMessage}`);
    }
  }

  /**
   * Search repositories via GitHub API
   */
  private async searchRepositories(
    query: string,
    perPage: number
  ): Promise<GitHubRepo[]> {
    const url = `${GITHUB_API_BASE}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${perPage}`;

    logger.debug('Fetching GitHub repositories', { query, url });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: HeadersInit = {
        'User-Agent': 'SocialContentAgent/1.0',
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      };

      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      const response = await fetch(url, {
        signal: controller.signal,
        headers,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 403) {
          const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
          const rateLimitReset = response.headers.get('X-RateLimit-Reset');

          if (rateLimitRemaining === '0' && rateLimitReset) {
            const resetTime = new Date(parseInt(rateLimitReset, 10) * 1000);
            throw new Error(
              `GitHub rate limit exceeded. Resets at ${resetTime.toISOString()}`
            );
          }
        }

        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as GitHubSearchResponse;

      logger.debug('GitHub search response', {
        totalCount: data.total_count,
        returned: data.items.length,
        incomplete: data.incomplete_results,
      });

      return data.items;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`GitHub request timed out after ${this.timeout}ms`);
      }

      throw error;
    }
  }

  /**
   * Search repositories by topic
   */
  async searchByTopic(topic: string, options: AdapterOptions = {}): Promise<SearchResult[]> {
    const limit = options.limit ?? DEFAULT_LIMIT;

    logger.info('Searching GitHub by topic', { topic, limit });

    await this.rateLimiter.acquire();

    const query = `topic:${topic}`;
    const repos = await this.searchRepositories(query, limit);

    return repos.map(normalizeRepo);
  }

  /**
   * Search code snippets (optional feature)
   * Note: Code search requires authentication
   */
  async searchCode(
    query: string,
    options: AdapterOptions = {}
  ): Promise<SearchResult[]> {
    if (!this.token) {
      logger.warn('GitHub code search requires authentication');
      return [];
    }

    const limit = options.limit ?? DEFAULT_LIMIT;
    const url = `${GITHUB_API_BASE}/search/code?q=${encodeURIComponent(query)}&per_page=${limit}`;

    logger.debug('Searching GitHub code', { query, url });

    await this.rateLimiter.acquire();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'SocialContentAgent/1.0',
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          Authorization: `Bearer ${this.token}`,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      interface CodeSearchItem {
        name: string;
        path: string;
        html_url: string;
        repository: {
          id: number;
          full_name: string;
          owner: {
            login: string;
          };
        };
      }

      interface CodeSearchResponse {
        items: CodeSearchItem[];
      }

      const data = (await response.json()) as CodeSearchResponse;

      // Normalize code search results to SearchResult format
      return data.items.map((item) => ({
        id: `github-code-${item.repository.id}-${item.path.replace(/\//g, '-')}`,
        title: item.name,
        description: `Code in ${item.repository.full_name}`,
        url: item.html_url,
        source: 'github' as SourceType,
        author: item.repository.owner.login,
        publishedAt: new Date(),
        tags: [],
        metrics: {},
      }));
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`GitHub request timed out after ${this.timeout}ms`);
      }

      throw error;
    }
  }

  /**
   * Check if the adapter has authentication configured
   */
  isAuthenticated(): boolean {
    return !!this.token;
  }
}

/**
 * Factory function for creating GitHub adapter
 */
export function createGitHubAdapter(
  rateLimiter: RateLimiter,
  timeout?: number,
  token?: string
): GitHubAdapter {
  return new GitHubAdapter(rateLimiter, timeout, token);
}
