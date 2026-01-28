/**
 * Researcher Agent - Discovers tech trends from multiple sources
 */

import type { Trend } from '@social-content/shared';
import { createLogger, RateLimiter } from '@social-content/shared';
import type { Agent, AgentResult } from './types';
import { AgentStatus } from './types';
import {
  TrendSource,
  DevToSource,
  HackerNewsSource,
  RedditSource,
} from '../services/sources';

const logger = createLogger('agent:researcher');

/**
 * Available source names
 */
export type SourceName = 'devto' | 'hackernews' | 'reddit';

/**
 * Input configuration for the Researcher agent
 */
export interface ResearcherInput {
  /** Sources to query (default: all) */
  sources?: SourceName[];
  /** Maximum trends to return (default: 50) */
  limit?: number;
  /** Timeout per source in ms (default: 10000) */
  timeout?: number;
}

/**
 * Output from the Researcher agent
 */
export interface ResearcherOutput {
  /** Deduplicated and sorted trends */
  trends: Trend[];
  /** Execution metadata */
  metadata: {
    sourcesQueried: string[];
    totalFound: number;
    deduplicatedCount: number;
    timestamp: Date;
  };
}

/**
 * Normalize a title for deduplication comparison
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  // Create matrix
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0) as number[]
  );

  // Initialize first row and column
  for (let i = 0; i <= m; i++) {
    const row = dp[i];
    if (row) row[0] = i;
  }
  for (let j = 0; j <= n; j++) {
    const row = dp[0];
    if (row) row[j] = j;
  }

  // Fill the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const char1 = str1[i - 1];
      const char2 = str2[j - 1];
      const cost = char1 === char2 ? 0 : 1;

      const row = dp[i];
      const prevRow = dp[i - 1];
      if (row && prevRow) {
        const del = (prevRow[j] ?? 0) + 1;
        const ins = (row[j - 1] ?? 0) + 1;
        const sub = (prevRow[j - 1] ?? 0) + cost;
        row[j] = Math.min(del, ins, sub);
      }
    }
  }

  const lastRow = dp[m];
  return lastRow?.[n] ?? 0;
}

/**
 * Check if two titles are similar (for deduplication)
 */
function areTitlesSimilar(title1: string, title2: string): boolean {
  const normalized1 = normalizeTitle(title1);
  const normalized2 = normalizeTitle(title2);

  // Exact match
  if (normalized1 === normalized2) return true;

  // One contains the other
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return true;
  }

  // Levenshtein distance (allow 20% difference)
  const maxLen = Math.max(normalized1.length, normalized2.length);
  if (maxLen === 0) return true;

  const distance = levenshteinDistance(normalized1, normalized2);
  const similarity = 1 - distance / maxLen;

  return similarity >= 0.8;
}

/**
 * Deduplicate trends by similar titles
 */
function deduplicateTrends(trends: Trend[]): Trend[] {
  const unique: Trend[] = [];

  for (const trend of trends) {
    const isDuplicate = unique.some((existing) =>
      areTitlesSimilar(existing.title, trend.title)
    );

    if (!isDuplicate) {
      unique.push(trend);
    }
  }

  return unique;
}

/**
 * Sort trends by discovery date (most recent first)
 */
function sortTrendsByDate(trends: Trend[]): Trend[] {
  return [...trends].sort(
    (a, b) => b.discoveredAt.getTime() - a.discoveredAt.getTime()
  );
}

/**
 * Create source instance by name
 */
function createSource(name: SourceName): TrendSource {
  switch (name) {
    case 'devto':
      return new DevToSource();
    case 'hackernews':
      return new HackerNewsSource();
    case 'reddit':
      return new RedditSource();
    default:
      throw new Error(`Unknown source: ${name}`);
  }
}

/**
 * Researcher Agent implementation
 * Discovers and aggregates tech trends from multiple sources
 */
export class ResearcherAgent implements Agent<ResearcherInput, ResearcherOutput> {
  readonly name = 'researcher';
  status: AgentStatus = AgentStatus.IDLE;

  private rateLimiter: RateLimiter;

  constructor() {
    // Rate limit: 10 requests per second across all sources
    this.rateLimiter = new RateLimiter({
      maxRequests: 10,
      windowMs: 1000,
    });
  }

  /**
   * Run the researcher agent to discover trends
   */
  async run(input: ResearcherInput = {}): Promise<AgentResult<ResearcherOutput>> {
    const startTime = Date.now();
    this.status = AgentStatus.RUNNING;

    const {
      sources = ['devto', 'hackernews', 'reddit'],
      limit = 50,
      timeout = 10000,
    } = input;

    logger.info('Starting trend research', { sources, limit, timeout });

    try {
      // Fetch trends from all sources in parallel
      const sourceInstances = sources.map(createSource);
      const results = await Promise.allSettled(
        sourceInstances.map(async (source) => {
          await this.rateLimiter.acquire();
          logger.debug('Fetching from source', { source: source.name });
          return source.fetch({ limit: Math.ceil(limit / sources.length), timeout });
        })
      );

      // Collect all successful results
      const allTrends: Trend[] = [];
      const queriedSources: string[] = [];

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const sourceName = sources[i];

        if (!result || !sourceName) continue;

        if (result.status === 'fulfilled') {
          allTrends.push(...result.value);
          queriedSources.push(sourceName);
          logger.debug('Source returned trends', {
            source: sourceName,
            count: result.value.length,
          });
        } else {
          const errorReason = result.reason;
          logger.warn('Source failed', {
            source: sourceName,
            error: errorReason instanceof Error ? errorReason.message : 'Unknown error',
          });
        }
      }

      const totalFound = allTrends.length;

      // Deduplicate and sort
      const deduplicated = deduplicateTrends(allTrends);
      const sorted = sortTrendsByDate(deduplicated);
      const limited = sorted.slice(0, limit);

      const output: ResearcherOutput = {
        trends: limited,
        metadata: {
          sourcesQueried: queriedSources,
          totalFound,
          deduplicatedCount: totalFound - deduplicated.length,
          timestamp: new Date(),
        },
      };

      this.status = AgentStatus.SUCCESS;
      const duration = Date.now() - startTime;

      logger.info('Trend research complete', {
        trendsFound: limited.length,
        sourcesQueried: queriedSources.length,
        deduplicatedCount: totalFound - deduplicated.length,
        duration,
      });

      return {
        success: true,
        data: output,
        duration,
        timestamp: new Date(),
      };
    } catch (error) {
      this.status = AgentStatus.ERROR;
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Trend research failed', { error: errorMessage, duration });

      return {
        success: false,
        error: errorMessage,
        duration,
        timestamp: new Date(),
      };
    }
  }
}

/**
 * Factory function for creating Researcher agent
 */
export function createResearcherAgent(): ResearcherAgent {
  return new ResearcherAgent();
}

// Export helper functions for testing
export {
  normalizeTitle,
  areTitlesSimilar,
  deduplicateTrends,
  sortTrendsByDate,
};
