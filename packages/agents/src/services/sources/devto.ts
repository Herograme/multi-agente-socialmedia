/**
 * Dev.to trend source - fetches from RSS feed
 */

import type { Trend } from '@social-content/shared';
import { createLogger, generateId } from '@social-content/shared';
import type { TrendSource, FetchOptions, DevToRawArticle } from './types';

const logger = createLogger('sources:devto');

const DEVTO_FEED_URL = 'https://dev.to/feed';
const DEFAULT_LIMIT = 20;
const DEFAULT_TIMEOUT = 10000;

/**
 * Parse RSS XML to extract items
 * Simple XML parsing without external dependencies
 */
function parseRssItems(xml: string): DevToRawArticle[] {
  const items: DevToRawArticle[] = [];

  // Extract all <item>...</item> blocks
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1] ?? '';

    // Extract fields from item
    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link');
    const pubDate = extractTag(itemXml, 'pubDate');
    const creator = extractTag(itemXml, 'dc:creator') ?? extractTag(itemXml, 'author');
    const description = extractTag(itemXml, 'description');

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
        creator: creator ? cleanText(creator) : undefined,
        categories: categories.length > 0 ? categories : undefined,
        description: description ? cleanText(description) : undefined,
      });
    }
  }

  return items;
}

/**
 * Extract content from an XML tag
 */
function extractTag(xml: string, tagName: string): string | null {
  // Handle CDATA and regular content
  const cdataRegex = new RegExp(`<${tagName}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>`, 'i');
  const regularRegex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i');

  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch?.[1]) return cdataMatch[1];

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
    .replace(/<[^>]+>/g, '') // Remove any remaining HTML tags
    .trim();
}

/**
 * Convert raw Dev.to article to normalized Trend
 */
function normalizeArticle(article: DevToRawArticle): Trend {
  return {
    id: generateId(),
    title: article.title,
    description: article.description,
    source: 'devto',
    url: article.link,
    discoveredAt: new Date(article.pubDate),
  };
}

/**
 * Dev.to trend source implementation
 */
export class DevToSource implements TrendSource {
  name = 'devto';

  async fetch(options: FetchOptions = {}): Promise<Trend[]> {
    const limit = options.limit ?? DEFAULT_LIMIT;
    const timeout = options.timeout ?? DEFAULT_TIMEOUT;

    logger.info('Fetching trends from Dev.to', { limit, timeout });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(DEVTO_FEED_URL, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'SocialContentAgent/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Dev.to API error: ${response.status} ${response.statusText}`);
      }

      const xml = await response.text();
      const articles = parseRssItems(xml);

      logger.debug('Parsed articles from Dev.to', { count: articles.length });

      const trends = articles.slice(0, limit).map(normalizeArticle);

      logger.info('Successfully fetched Dev.to trends', { count: trends.length });

      return trends;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          logger.error('Dev.to request timed out', { timeout });
          throw new Error(`Dev.to request timed out after ${timeout}ms`);
        }
        logger.error('Failed to fetch Dev.to trends', { error: error.message });
        throw error;
      }
      throw new Error('Unknown error fetching Dev.to trends');
    }
  }
}

/**
 * Factory function for creating Dev.to source
 */
export function createDevToSource(): TrendSource {
  return new DevToSource();
}
