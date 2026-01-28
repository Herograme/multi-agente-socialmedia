/**
 * Reddit trend source - fetches from RSS feed
 */

import type { Trend } from '@social-content/shared';
import { createLogger, generateId } from '@social-content/shared';
import type { TrendSource, FetchOptions, RedditRawEntry } from './types';

const logger = createLogger('sources:reddit');

const REDDIT_PROGRAMMING_RSS = 'https://www.reddit.com/r/programming/.rss';
const DEFAULT_LIMIT = 20;
const DEFAULT_TIMEOUT = 10000;

/**
 * Parse Atom/RSS XML to extract entries
 */
function parseAtomEntries(xml: string): RedditRawEntry[] {
  const entries: RedditRawEntry[] = [];

  // Extract all <entry>...</entry> blocks (Atom format used by Reddit)
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1] ?? '';

    // Extract fields from entry
    const title = extractTag(entryXml, 'title');
    const link = extractLink(entryXml);
    const published = extractTag(entryXml, 'published') ?? extractTag(entryXml, 'updated');
    const author = extractAuthor(entryXml);
    const content = extractTag(entryXml, 'content');

    if (title && link) {
      entries.push({
        title: cleanText(title),
        link: cleanText(link),
        published: published || new Date().toISOString(),
        author: author ? cleanText(author) : undefined,
        content: content ? cleanText(content).substring(0, 500) : undefined,
      });
    }
  }

  return entries;
}

/**
 * Extract content from an XML tag
 */
function extractTag(xml: string, tagName: string): string | null {
  // Handle tags with attributes
  const withAttrsRegex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const simpleRegex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i');

  const withAttrsMatch = xml.match(withAttrsRegex);
  if (withAttrsMatch?.[1]) return withAttrsMatch[1];

  const simpleMatch = xml.match(simpleRegex);
  if (simpleMatch?.[1]) return simpleMatch[1];

  return null;
}

/**
 * Extract link href from Atom format
 */
function extractLink(xml: string): string | null {
  // Reddit uses <link href="..."/> format
  const linkRegex = /<link[^>]*href="([^"]*)"[^>]*>/i;
  const match = xml.match(linkRegex);

  if (match?.[1]) return match[1];

  // Fallback to regular <link>text</link>
  return extractTag(xml, 'link');
}

/**
 * Extract author name from Atom format
 */
function extractAuthor(xml: string): string | null {
  const authorBlock = extractTag(xml, 'author');
  if (!authorBlock) return null;

  const name = extractTag(authorBlock, 'name');
  return name;
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
 * Convert raw Reddit entry to normalized Trend
 */
function normalizeEntry(entry: RedditRawEntry): Trend {
  return {
    id: generateId(),
    title: entry.title,
    description: entry.content,
    source: 'reddit',
    url: entry.link,
    discoveredAt: new Date(entry.published),
  };
}

/**
 * Reddit trend source implementation
 */
export class RedditSource implements TrendSource {
  name = 'reddit';

  async fetch(options: FetchOptions = {}): Promise<Trend[]> {
    const limit = options.limit ?? DEFAULT_LIMIT;
    const timeout = options.timeout ?? DEFAULT_TIMEOUT;

    logger.info('Fetching trends from Reddit r/programming', { limit, timeout });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(REDDIT_PROGRAMMING_RSS, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'SocialContentAgent/1.0 (research bot)',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
      }

      const xml = await response.text();
      const entries = parseAtomEntries(xml);

      logger.debug('Parsed entries from Reddit', { count: entries.length });

      const trends = entries.slice(0, limit).map(normalizeEntry);

      logger.info('Successfully fetched Reddit trends', { count: trends.length });

      return trends;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          logger.error('Reddit request timed out', { timeout });
          throw new Error(`Reddit request timed out after ${timeout}ms`);
        }
        logger.error('Failed to fetch Reddit trends', { error: error.message });
        throw error;
      }
      throw new Error('Unknown error fetching Reddit trends');
    }
  }
}

/**
 * Factory function for creating Reddit source
 */
export function createRedditSource(): TrendSource {
  return new RedditSource();
}
