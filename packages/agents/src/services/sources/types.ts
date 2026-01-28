/**
 * Source fetcher types - used by Researcher agent
 */

import type { Trend } from '@social-content/shared';

/**
 * Options for fetching trends from a source
 */
export interface FetchOptions {
  limit?: number;
  timeout?: number;
}

/**
 * Base interface for all trend sources
 */
export interface TrendSource {
  name: string;
  fetch(options?: FetchOptions): Promise<Trend[]>;
}

/**
 * Raw article data from Dev.to RSS feed
 */
export interface DevToRawArticle {
  title: string;
  link: string;
  pubDate: string;
  creator?: string;
  categories?: string[];
  description?: string;
}

/**
 * Raw item data from Hacker News API
 */
export interface HackerNewsItem {
  id: number;
  title: string;
  url?: string;
  text?: string;
  score: number;
  time: number;
  by: string;
  type: 'story' | 'job' | 'poll' | 'comment';
}

/**
 * Raw entry data from Reddit RSS feed
 */
export interface RedditRawEntry {
  title: string;
  link: string;
  published: string;
  author?: string;
  content?: string;
}
