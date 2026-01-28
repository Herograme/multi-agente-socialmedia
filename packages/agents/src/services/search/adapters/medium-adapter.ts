/**
 * Medium RSS Adapter - Parses Medium RSS feeds by topic
 * Feed URL pattern: https://medium.com/feed/tag/{topic}
 */

import { RateLimiter, createLogger } from '@social-content/shared';
import type {
  SourceAdapter,
  SourceType,
  SearchResult,
  AdapterOptions,
  MediumRSSItem,
} from '../types';

const logger = createLogger('search:medium');

const MEDIUM_FEED_BASE = 'https://medium.com/feed/tag';
const DEFAULT_LIMIT = 10;
const DEFAULT_TIMEOUT = 10000;

/**
 * Generate a hash from a string (for unique IDs)
 */
function generateHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Extract text content from HTML
 */
function extractTextFromHtml(html: string): string {
  // Remove HTML tags and decode entities
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Extract description from HTML content (first paragraph or truncated text)
 */
function extractDescription(html: string, maxLength: number = 200): string {
  const text = extractTextFromHtml(html);
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Calculate estimated reading time in minutes
 */
function calculateReadingTime(content: string): number {
  const words = extractTextFromHtml(content).split(/\s+/).length;
  // Average reading speed: 200 words per minute
  return Math.ceil(words / 200);
}

/**
 * Parse RSS XML to extract Medium items
 */
function parseRssItems(xml: string): MediumRSSItem[] {
  const items: MediumRSSItem[] = [];

  // Extract all <item>...</item> blocks
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1] ?? '';

    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link') ?? extractTag(itemXml, 'guid');
    const pubDate = extractTag(itemXml, 'pubDate');
    const creator = extractTag(itemXml, 'dc:creator') ?? extractTag(itemXml, 'author');
    const contentEncoded =
      extractTag(itemXml, 'content:encoded') ?? extractTag(itemXml, 'description');

    // Extract categories
    const categories: string[] = [];
    const categoryRegex = /<category>([\s\S]*?)<\/category>/gi;
    let catMatch;
    while ((catMatch = categoryRegex.exec(itemXml)) !== null) {
      const catText = catMatch[1];
      if (catText) {
        categories.push(cleanText(catText));
      }
    }

    if (title && link) {
      items.push({
        title: cleanText(title),
        link: cleanText(link),
        pubDate: pubDate ? cleanText(pubDate) : new Date().toISOString(),
        creator: creator ? cleanText(creator) : 'Unknown',
        categories,
        contentEncoded: contentEncoded ?? '',
      });
    }
  }

  return items;
}

/**
 * Extract content from an XML tag (handles CDATA)
 */
function extractTag(xml: string, tagName: string): string | null {
  // Handle CDATA content
  const cdataRegex = new RegExp(
    `<${tagName}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>`,
    'i'
  );
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch?.[1]) return cdataMatch[1];

  // Handle regular content
  const regularRegex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const regularMatch = xml.match(regularRegex);
  if (regularMatch?.[1]) return regularMatch[1];

  return null;
}

/**
 * Clean HTML entities and whitespace from text
 */
function cleanText(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Normalize Medium RSS item to SearchResult format
 */
function normalizeMediumItem(item: MediumRSSItem): SearchResult {
  const readingTime = calculateReadingTime(item.contentEncoded);

  return {
    id: `medium-${generateHash(item.link)}`,
    title: item.title,
    description: extractDescription(item.contentEncoded),
    url: item.link,
    source: 'medium',
    author: item.creator,
    publishedAt: new Date(item.pubDate),
    tags: item.categories,
    metrics: {
      readingTime,
    },
  };
}

/**
 * Medium RSS Adapter
 *
 * @example
 * const adapter = new MediumAdapter(rateLimiter);
 * const results = await adapter.search(['javascript', 'programming'], { limit: 10 });
 */
export class MediumAdapter implements SourceAdapter {
  readonly name: SourceType = 'medium';
  private rateLimiter: RateLimiter;
  private timeout: number;

  constructor(rateLimiter: RateLimiter, timeout: number = DEFAULT_TIMEOUT) {
    this.rateLimiter = rateLimiter;
    this.timeout = timeout;
  }

  /**
   * Search Medium by keywords (treated as topics)
   */
  async search(keywords: string[], options: AdapterOptions = {}): Promise<SearchResult[]> {
    const limit = options.limit ?? DEFAULT_LIMIT;

    if (keywords.length === 0) {
      logger.warn('No keywords provided for Medium search');
      return [];
    }

    logger.info('Searching Medium', { keywords, limit });

    try {
      // Fetch RSS feeds for each keyword and aggregate results
      const allResults: SearchResult[] = [];
      const seenIds = new Set<string>();

      for (const keyword of keywords) {
        await this.rateLimiter.acquire();

        const items = await this.fetchByTopic(keyword);

        for (const item of items) {
          const result = normalizeMediumItem(item);
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

      logger.info('Medium search completed', {
        keywords,
        totalFound: allResults.length,
        returned: limited.length,
      });

      return limited;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Medium search failed', { error: errorMessage, keywords });
      throw new Error(`Medium search failed: ${errorMessage}`);
    }
  }

  /**
   * Fetch RSS feed for a single topic
   */
  private async fetchByTopic(topic: string): Promise<MediumRSSItem[]> {
    // Normalize topic (lowercase, replace spaces with hyphens)
    const normalizedTopic = topic.toLowerCase().replace(/\s+/g, '-');
    const url = `${MEDIUM_FEED_BASE}/${encodeURIComponent(normalizedTopic)}`;

    logger.debug('Fetching Medium RSS feed', { topic, url });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'SocialContentAgent/1.0',
          Accept: 'application/rss+xml, application/xml, text/xml',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Medium RSS error: ${response.status} ${response.statusText}`);
      }

      const xml = await response.text();
      const items = parseRssItems(xml);

      logger.debug('Medium RSS feed parsed', { topic, count: items.length });

      return items;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Medium request timed out after ${this.timeout}ms`);
      }

      throw error;
    }
  }
}

/**
 * Factory function for creating Medium adapter
 */
export function createMediumAdapter(
  rateLimiter: RateLimiter,
  timeout?: number
): MediumAdapter {
  return new MediumAdapter(rateLimiter, timeout);
}
