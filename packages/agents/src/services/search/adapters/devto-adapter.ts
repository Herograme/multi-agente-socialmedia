/**
 * Dev.to API Adapter - Searches Dev.to articles by tag/keyword
 * API Documentation: https://developers.forem.com/api
 */

import { RateLimiter, createLogger } from '@social-content/shared';
import type {
  SourceAdapter,
  SourceType,
  SearchResult,
  AdapterOptions,
  DevToArticle,
} from '../types';

const logger = createLogger('search:devto');

const DEVTO_API_BASE = 'https://dev.to/api';
const DEFAULT_LIMIT = 10;
const DEFAULT_TIMEOUT = 10000;

/**
 * Normalize Dev.to article to SearchResult format
 */
function normalizeArticle(article: DevToArticle): SearchResult {
  return {
    id: `devto-${article.id}`,
    title: article.title,
    description: article.description || '',
    url: article.url,
    source: 'devto',
    author: article.user?.name || article.user?.username || 'Unknown',
    publishedAt: new Date(article.published_at),
    tags: article.tag_list || [],
    metrics: {
      likes: article.positive_reactions_count,
      comments: article.comments_count,
      readingTime: article.reading_time_minutes,
    },
  };
}

/**
 * Dev.to API Adapter
 *
 * @example
 * const adapter = new DevToAdapter(rateLimiter);
 * const results = await adapter.search(['typescript', 'react'], { limit: 10 });
 */
export class DevToAdapter implements SourceAdapter {
  readonly name: SourceType = 'devto';
  private rateLimiter: RateLimiter;
  private timeout: number;

  constructor(rateLimiter: RateLimiter, timeout: number = DEFAULT_TIMEOUT) {
    this.rateLimiter = rateLimiter;
    this.timeout = timeout;
  }

  /**
   * Search Dev.to articles by keywords (treated as tags)
   */
  async search(keywords: string[], options: AdapterOptions = {}): Promise<SearchResult[]> {
    const limit = options.limit ?? DEFAULT_LIMIT;

    if (keywords.length === 0) {
      logger.warn('No keywords provided for Dev.to search');
      return [];
    }

    logger.info('Searching Dev.to', { keywords, limit });

    try {
      // Search by each keyword and aggregate results
      const allResults: SearchResult[] = [];
      const seenIds = new Set<string>();

      for (const keyword of keywords) {
        await this.rateLimiter.acquire();

        const articles = await this.fetchByTag(keyword, limit);

        for (const article of articles) {
          const result = normalizeArticle(article);
          if (!seenIds.has(result.id)) {
            seenIds.add(result.id);
            allResults.push(result);
          }
        }
      }

      // Sort by date and limit results
      const sorted = allResults.sort(
        (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()
      );

      const limited = sorted.slice(0, limit);

      logger.info('Dev.to search completed', {
        keywords,
        totalFound: allResults.length,
        returned: limited.length,
      });

      return limited;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Dev.to search failed', { error: errorMessage, keywords });
      throw new Error(`Dev.to search failed: ${errorMessage}`);
    }
  }

  /**
   * Fetch articles by a single tag
   */
  private async fetchByTag(tag: string, perPage: number): Promise<DevToArticle[]> {
    const url = `${DEVTO_API_BASE}/articles?tag=${encodeURIComponent(tag)}&per_page=${perPage}`;

    logger.debug('Fetching Dev.to articles', { tag, url });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'SocialContentAgent/1.0',
          Accept: 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Dev.to API error: ${response.status} ${response.statusText}`);
      }

      const articles = (await response.json()) as DevToArticle[];

      logger.debug('Dev.to articles fetched', { tag, count: articles.length });

      return articles;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Dev.to request timed out after ${this.timeout}ms`);
      }

      throw error;
    }
  }

  /**
   * Search articles by multiple tags (AND condition)
   */
  async searchByTags(tags: string[], options: AdapterOptions = {}): Promise<SearchResult[]> {
    const limit = options.limit ?? DEFAULT_LIMIT;

    if (tags.length === 0) {
      return [];
    }

    await this.rateLimiter.acquire();

    const tagsParam = tags.map((t) => encodeURIComponent(t)).join(',');
    const url = `${DEVTO_API_BASE}/articles?tags=${tagsParam}&per_page=${limit}`;

    logger.debug('Fetching Dev.to articles by multiple tags', { tags, url });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'SocialContentAgent/1.0',
          Accept: 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Dev.to API error: ${response.status} ${response.statusText}`);
      }

      const articles = (await response.json()) as DevToArticle[];

      return articles.map(normalizeArticle);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Dev.to request timed out after ${this.timeout}ms`);
      }

      throw error;
    }
  }
}

/**
 * Factory function for creating Dev.to adapter
 */
export function createDevToAdapter(
  rateLimiter: RateLimiter,
  timeout?: number
): DevToAdapter {
  return new DevToAdapter(rateLimiter, timeout);
}
