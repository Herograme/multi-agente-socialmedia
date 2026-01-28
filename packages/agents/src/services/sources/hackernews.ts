/**
 * Hacker News trend source - fetches from Firebase API
 */

import type { Trend } from '@social-content/shared';
import { createLogger, generateId } from '@social-content/shared';
import type { TrendSource, FetchOptions, HackerNewsItem } from './types';

const logger = createLogger('sources:hackernews');

const HN_BASE_URL = 'https://hacker-news.firebaseio.com/v0';
const HN_TOP_STORIES_URL = `${HN_BASE_URL}/topstories.json`;
const DEFAULT_LIMIT = 20;
const DEFAULT_TIMEOUT = 10000;

/**
 * Fetch a single item from Hacker News
 */
async function fetchItem(id: number, timeout: number): Promise<HackerNewsItem | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${HN_BASE_URL}/item/${id}.json`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SocialContentAgent/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.warn('Failed to fetch HN item', { id, status: response.status });
      return null;
    }

    return (await response.json()) as HackerNewsItem;
  } catch (error) {
    logger.warn('Error fetching HN item', { id, error: (error as Error).message });
    return null;
  }
}

/**
 * Convert HN item to normalized Trend
 */
function normalizeItem(item: HackerNewsItem): Trend {
  const url = item.url ?? `https://news.ycombinator.com/item?id=${item.id}`;

  return {
    id: generateId(),
    title: item.title,
    description: item.text?.substring(0, 500),
    source: 'hackernews',
    url,
    discoveredAt: new Date(item.time * 1000),
  };
}

/**
 * Hacker News trend source implementation
 */
export class HackerNewsSource implements TrendSource {
  name = 'hackernews';

  async fetch(options: FetchOptions = {}): Promise<Trend[]> {
    const limit = options.limit ?? DEFAULT_LIMIT;
    const timeout = options.timeout ?? DEFAULT_TIMEOUT;

    logger.info('Fetching trends from Hacker News', { limit, timeout });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(HN_TOP_STORIES_URL, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'SocialContentAgent/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Hacker News API error: ${response.status} ${response.statusText}`);
      }

      const storyIds = (await response.json()) as number[];
      const limitedIds = storyIds.slice(0, limit);

      logger.debug('Fetched story IDs from HN', { total: storyIds.length, fetching: limitedIds.length });

      // Fetch items in parallel with rate limiting (batch of 5)
      const trends: Trend[] = [];
      const batchSize = 5;

      for (let i = 0; i < limitedIds.length; i += batchSize) {
        const batch = limitedIds.slice(i, i + batchSize);
        const items = await Promise.all(batch.map((id) => fetchItem(id, timeout)));

        for (const item of items) {
          if (item && item.type === 'story' && item.title) {
            trends.push(normalizeItem(item));
          }
        }

        // Small delay between batches to respect rate limits
        if (i + batchSize < limitedIds.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      logger.info('Successfully fetched Hacker News trends', { count: trends.length });

      return trends;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          logger.error('Hacker News request timed out', { timeout });
          throw new Error(`Hacker News request timed out after ${timeout}ms`);
        }
        logger.error('Failed to fetch Hacker News trends', { error: error.message });
        throw error;
      }
      throw new Error('Unknown error fetching Hacker News trends');
    }
  }
}

/**
 * Factory function for creating Hacker News source
 */
export function createHackerNewsSource(): TrendSource {
  return new HackerNewsSource();
}
