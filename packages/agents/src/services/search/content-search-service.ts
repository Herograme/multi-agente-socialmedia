/**
 * Content Search Service - Multi-source content discovery
 * Used by Curador agent to find relevant articles and repositories
 */

import { RateLimiter } from '@social-content/shared';
import { createLogger } from '@social-content/shared';
import type {
  SourceType,
  SearchQuery,
  SearchResult,
  SearchResponse,
  SourceAdapter,
  ContentSearchServiceOptions,
} from './types';
import { DevToAdapter } from './adapters/devto-adapter';
import { MediumAdapter } from './adapters/medium-adapter';
import { GitHubAdapter } from './adapters/github-adapter';

const logger = createLogger('search:service');

/**
 * ContentSearchService - Orchestrates multi-source content search
 *
 * @example
 * const service = new ContentSearchService();
 * const results = await service.search({
 *   keywords: ['typescript', 'react'],
 *   sources: ['devto', 'github'],
 *   limit: 10,
 * });
 */
export class ContentSearchService {
  private adapters: Map<SourceType, SourceAdapter>;
  private rateLimiters: Map<SourceType, RateLimiter>;
  private defaultLimit: number;
  private timeout: number;

  constructor(options: ContentSearchServiceOptions = {}) {
    this.adapters = new Map();
    this.rateLimiters = new Map();
    this.defaultLimit = options.defaultLimit ?? 10;
    this.timeout = options.timeout ?? 10000;

    // Initialize rate limiters
    this.initializeRateLimiters(options.rateLimits);

    // Register default adapters
    this.registerAdapter(new DevToAdapter(this.rateLimiters.get('devto')!, this.timeout));
    this.registerAdapter(new MediumAdapter(this.rateLimiters.get('medium')!, this.timeout));
    this.registerAdapter(
      new GitHubAdapter(this.rateLimiters.get('github')!, this.timeout, options.githubToken)
    );

    logger.info('ContentSearchService initialized', {
      adapters: Array.from(this.adapters.keys()),
    });
  }

  /**
   * Initialize rate limiters for each source
   */
  private initializeRateLimiters(
    customLimits?: Partial<Record<SourceType, { requests: number; window: number }>>
  ): void {
    const sources: SourceType[] = ['devto', 'medium', 'github'];
    const defaultLimits: Record<SourceType, { requests: number; window: number }> = {
      devto: { requests: 30, window: 60000 },
      medium: { requests: 20, window: 60000 },
      github: { requests: 10, window: 60000 },
    };

    for (const source of sources) {
      const config = customLimits?.[source] ?? defaultLimits[source];
      this.rateLimiters.set(
        source,
        new RateLimiter({
          maxRequests: config.requests,
          windowMs: config.window,
        })
      );
    }
  }

  /**
   * Register a source adapter
   */
  registerAdapter(adapter: SourceAdapter): void {
    this.adapters.set(adapter.name, adapter);
    logger.debug('Adapter registered', { adapter: adapter.name });
  }

  /**
   * Get a registered adapter by name
   */
  getAdapter(name: SourceType): SourceAdapter | undefined {
    return this.adapters.get(name);
  }

  /**
   * Search for content across multiple sources
   */
  async search(query: SearchQuery): Promise<SearchResponse> {
    const startTime = Date.now();
    const sources = query.sources ?? (Array.from(this.adapters.keys()) as SourceType[]);
    const limit = query.limit ?? this.defaultLimit;
    const errors: Array<{ source: SourceType; error: string }> = [];

    logger.info('Starting search', {
      keywords: query.keywords,
      sources,
      limit,
    });

    // Search all sources in parallel
    const searchPromises = sources
      .filter((source) => this.adapters.has(source))
      .map(async (source) => {
        try {
          const adapter = this.adapters.get(source)!;
          const results = await adapter.search(query.keywords, {
            limit,
            language: query.language,
          });
          return { source, results };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error(`Search failed for ${source}`, { error: errorMessage });
          errors.push({ source, error: errorMessage });
          return { source, results: [] };
        }
      });

    const settledResults = await Promise.all(searchPromises);

    // Aggregate all results
    const allResults = settledResults.flatMap((r) => r.results);

    // Deduplicate and sort
    const deduplicated = this.deduplicateResults(allResults);
    const sorted = this.sortByRelevance(deduplicated);

    const searchDuration = Date.now() - startTime;

    logger.info('Search completed', {
      totalResults: sorted.length,
      duration: searchDuration,
      sources,
      errors: errors.length,
    });

    return {
      results: sorted,
      metadata: {
        query,
        sourcesQueried: sources,
        totalResults: sorted.length,
        searchDuration,
        timestamp: new Date(),
        errors: errors.length > 0 ? errors : undefined,
      },
    };
  }

  /**
   * Search a single source
   */
  async searchSource(
    source: SourceType,
    keywords: string[],
    limit?: number
  ): Promise<SearchResult[]> {
    const adapter = this.adapters.get(source);
    if (!adapter) {
      throw new Error(`Unknown source: ${source}`);
    }

    return adapter.search(keywords, { limit: limit ?? this.defaultLimit });
  }

  /**
   * Remove duplicate results based on normalized title
   */
  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Map<string, SearchResult>();

    for (const result of results) {
      const key = this.normalizeTitle(result.title);
      if (!seen.has(key)) {
        seen.set(key, result);
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Normalize title for comparison (lowercase, alphanumeric only)
   */
  private normalizeTitle(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  /**
   * Sort results by relevance (most recent first)
   */
  private sortByRelevance(results: SearchResult[]): SearchResult[] {
    return results.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }

  /**
   * Get available sources
   */
  getAvailableSources(): SourceType[] {
    return Array.from(this.adapters.keys()) as SourceType[];
  }

  /**
   * Check if a source is available
   */
  hasSource(source: SourceType): boolean {
    return this.adapters.has(source);
  }
}

/**
 * Factory function to create ContentSearchService
 */
export function createContentSearchService(
  options?: ContentSearchServiceOptions
): ContentSearchService {
  return new ContentSearchService(options);
}
