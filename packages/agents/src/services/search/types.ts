/**
 * Content Search Service types
 * Used by Curador agent for multi-source content discovery
 */

/**
 * Available content sources for search
 */
export type SourceType = 'devto' | 'medium' | 'github';

/**
 * Search query parameters
 */
export interface SearchQuery {
  /** Keywords/topics to search */
  keywords: string[];
  /** Optional: filter to specific sources */
  sources?: SourceType[];
  /** Max results per source (default: 10) */
  limit?: number;
  /** Filter by language (e.g., 'pt', 'en') */
  language?: string;
}

/**
 * Normalized search result from any source
 */
export interface SearchResult {
  /** Unique identifier (prefixed by source) */
  id: string;
  /** Content title */
  title: string;
  /** Brief description or excerpt */
  description: string;
  /** URL to the content */
  url: string;
  /** Source platform */
  source: SourceType;
  /** Author name or username */
  author: string;
  /** Publication date */
  publishedAt: Date;
  /** Associated tags/topics */
  tags: string[];
  /** Platform-specific metrics */
  metrics?: {
    /** Likes/reactions count */
    likes?: number;
    /** Comments count */
    comments?: number;
    /** GitHub stars */
    stars?: number;
    /** Estimated reading time in minutes */
    readingTime?: number;
  };
}

/**
 * Complete search response with metadata
 */
export interface SearchResponse {
  /** Array of normalized search results */
  results: SearchResult[];
  /** Search metadata */
  metadata: {
    /** Original query */
    query: SearchQuery;
    /** Sources that were queried */
    sourcesQueried: SourceType[];
    /** Total results count */
    totalResults: number;
    /** Search duration in milliseconds */
    searchDuration: number;
    /** Timestamp of the search */
    timestamp: Date;
    /** Errors from failed sources */
    errors?: Array<{
      source: SourceType;
      error: string;
    }>;
  };
}

/**
 * Options passed to source adapters
 */
export interface AdapterOptions {
  /** Max results to return */
  limit?: number;
  /** Filter by language */
  language?: string;
}

/**
 * Base interface for source adapters
 */
export interface SourceAdapter {
  /** Source identifier */
  readonly name: SourceType;
  /** Search for content by keywords */
  search(keywords: string[], options?: AdapterOptions): Promise<SearchResult[]>;
}

/**
 * Configuration options for ContentSearchService
 */
export interface ContentSearchServiceOptions {
  /** Custom rate limiter configuration per source */
  rateLimits?: Partial<Record<SourceType, { requests: number; window: number }>>;
  /** Default limit per source if not specified in query */
  defaultLimit?: number;
  /** Timeout for individual adapter requests in ms */
  timeout?: number;
  /** GitHub personal access token for higher rate limits */
  githubToken?: string;
}

/**
 * Rate limit configuration per source
 */
export const DEFAULT_RATE_LIMITS: Record<SourceType, { requests: number; window: number }> = {
  devto: { requests: 30, window: 60000 },   // 30 req/min
  medium: { requests: 20, window: 60000 },  // 20 req/min
  github: { requests: 10, window: 60000 },  // 10 req/min (unauthenticated)
};

/**
 * Dev.to article response from API
 */
export interface DevToArticle {
  id: number;
  title: string;
  description: string;
  url: string;
  published_at: string;
  user: {
    name: string;
    username: string;
  };
  tag_list: string[];
  positive_reactions_count: number;
  comments_count: number;
  reading_time_minutes: number;
}

/**
 * Medium RSS item (parsed from feed)
 */
export interface MediumRSSItem {
  title: string;
  link: string;
  pubDate: string;
  creator: string;
  categories: string[];
  contentEncoded: string;
}

/**
 * GitHub repository from search API
 */
export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  owner: {
    login: string;
  };
  topics: string[];
  stargazers_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * GitHub search API response
 */
export interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepo[];
}
