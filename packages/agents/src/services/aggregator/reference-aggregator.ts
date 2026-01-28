/**
 * Reference Aggregator Service
 * Aggregates, deduplicates, and enriches curated references from multiple sources
 */

import { createLogger } from '@social-content/shared';
import type {
  CuratedReference,
  EnrichedReference,
  ContentGroup,
  CuratedOutput,
  AggregatorOptions,
  RequiredAggregatorOptions,
  ReferenceMetadata,
  AggregationStats,
} from './types';
import { ContentType } from './types';

const logger = createLogger('service:aggregator');

/**
 * Default aggregator options
 */
const DEFAULT_OPTIONS: RequiredAggregatorOptions = {
  titleSimilarityThreshold: 0.85,
  includeRawMetadata: false,
  maxReferencesPerGroup: 0, // 0 means unlimited
};

/**
 * URL patterns for content type detection
 */
const TYPE_PATTERNS: Record<ContentType, RegExp[]> = {
  [ContentType.CODE]: [
    /github\.com/i,
    /gitlab\.com/i,
    /gist\./i,
    /codepen\.io/i,
    /codesandbox\.io/i,
    /bitbucket\.org/i,
  ],
  [ContentType.VIDEO]: [
    /youtube\.com/i,
    /youtu\.be/i,
    /vimeo\.com/i,
    /twitch\.tv/i,
    /dailymotion\.com/i,
  ],
  [ContentType.TUTORIAL]: [
    /tutorial/i,
    /how[\s-]to/i,
    /guide/i,
    /learn/i,
    /course/i,
    /step[\s-]by[\s-]step/i,
    /getting[\s-]started/i,
    /introduction[\s-]to/i,
  ],
  [ContentType.ARTICLE]: [
    /blog/i,
    /article/i,
    /post/i,
    /news/i,
    /medium\.com/i,
    /dev\.to/i,
  ],
  [ContentType.OTHER]: [],
};

/**
 * Source weights for relevance scoring
 */
const SOURCE_WEIGHTS: Record<string, number> = {
  hackernews: 30,
  github: 30,
  reddit: 25,
  devto: 20,
  medium: 18,
  default: 15,
};

/**
 * Content type bonus for relevance scoring
 */
const TYPE_BONUS: Record<ContentType, number> = {
  [ContentType.TUTORIAL]: 10,
  [ContentType.CODE]: 8,
  [ContentType.ARTICLE]: 6,
  [ContentType.VIDEO]: 5,
  [ContentType.OTHER]: 0,
};

/**
 * Tracking params to remove during URL normalization
 */
const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref',
  'source',
  'fbclid',
  'gclid',
  'msclkid',
];

/**
 * Normalize a URL for deduplication comparison
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Remove trailing slash from pathname
    let normalized = parsed.origin + parsed.pathname.replace(/\/$/, '');

    // Remove tracking params, keep essential query params
    const params = new URLSearchParams(parsed.search);
    TRACKING_PARAMS.forEach((p) => params.delete(p));

    const search = params.toString();
    if (search) {
      normalized += '?' + search;
    }

    return normalized.toLowerCase();
  } catch {
    // If URL parsing fails, do basic normalization
    return url.toLowerCase().trim().replace(/\/$/, '');
  }
}

/**
 * Normalize a title for comparison
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(str1: string, str2: string): number {
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
 * Calculate similarity ratio between two strings (0.0 - 1.0)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeTitle(str1);
  const normalized2 = normalizeTitle(str2);

  // Exact match
  if (normalized1 === normalized2) return 1.0;

  // Empty strings edge case
  const maxLen = Math.max(normalized1.length, normalized2.length);
  if (maxLen === 0) return 1.0;

  const distance = levenshteinDistance(normalized1, normalized2);
  return 1 - distance / maxLen;
}

/**
 * Detect content type based on URL and title
 */
export function detectContentType(url: string, title: string): ContentType {
  // Check URL patterns first (more reliable)
  for (const [type, patterns] of Object.entries(TYPE_PATTERNS)) {
    if (type === ContentType.OTHER) continue;

    for (const pattern of patterns) {
      if (pattern.test(url)) {
        return type as ContentType;
      }
    }
  }

  // Check title patterns
  for (const [type, patterns] of Object.entries(TYPE_PATTERNS)) {
    if (type === ContentType.OTHER) continue;

    for (const pattern of patterns) {
      if (pattern.test(title)) {
        return type as ContentType;
      }
    }
  }

  // Fallback to ARTICLE as default (most common type)
  return ContentType.ARTICLE;
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    // Try to extract domain from malformed URL
    const match = url.match(/(?:https?:\/\/)?([^/]+)/);
    return match?.[1] ?? 'unknown';
  }
}

/**
 * Generate favicon URL for a domain
 */
export function generateFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

/**
 * Estimate read time based on content or title length
 * Assumes ~200 words per minute reading speed
 */
export function estimateReadTime(
  title: string,
  rawMetadata?: Record<string, unknown>
): number | null {
  // Try to get content length from metadata
  const contentLength =
    (rawMetadata?.content_length as number) ||
    (rawMetadata?.contentLength as number) ||
    (rawMetadata?.body_length as number) ||
    (rawMetadata?.reading_time as number);

  if (typeof contentLength === 'number' && contentLength > 0) {
    // Assume ~5 chars per word, 200 WPM
    return Math.max(1, Math.ceil(contentLength / 5 / 200));
  }

  // Fallback: estimate based on title length (rough heuristic)
  // Longer titles often indicate more detailed content
  const titleWords = title.split(/\s+/).length;
  if (titleWords > 10) return 5; // Likely detailed article
  if (titleWords > 5) return 3;
  return 2; // Short title, likely quick read
}

/**
 * Extract author from various metadata formats
 */
export function extractAuthor(rawMetadata?: Record<string, unknown>): string | null {
  if (!rawMetadata) return null;

  // Try various common field names
  const authorFields = [
    'author',
    'by',
    'creator',
    'user',
    'username',
    'dc:creator',
    'writer',
  ];

  for (const field of authorFields) {
    const value = rawMetadata[field];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

/**
 * Extract publication date from metadata
 */
export function extractPublishedAt(rawMetadata?: Record<string, unknown>): Date | null {
  if (!rawMetadata) return null;

  // Try various common field names
  const dateFields = [
    'publishedAt',
    'published_at',
    'pubDate',
    'pub_date',
    'date',
    'created_at',
    'createdAt',
    'time',
  ];

  for (const field of dateFields) {
    const value = rawMetadata[field];
    if (value) {
      // Handle Unix timestamp (seconds)
      if (typeof value === 'number') {
        // If timestamp looks like seconds (before year 2100), convert to ms
        const ts = value < 4102444800 ? value * 1000 : value;
        return new Date(ts);
      }

      // Handle string date
      if (typeof value === 'string') {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }

      // Handle Date object
      if (value instanceof Date) {
        return value;
      }
    }
  }

  return null;
}

/**
 * Extract tags from metadata
 */
export function extractTags(rawMetadata?: Record<string, unknown>): string[] {
  if (!rawMetadata) return [];

  const tagFields = ['tags', 'categories', 'topics', 'labels', 'keywords'];

  for (const field of tagFields) {
    const value = rawMetadata[field];

    if (Array.isArray(value)) {
      return value.filter((t) => typeof t === 'string').map((t) => t.toLowerCase());
    }

    if (typeof value === 'string') {
      // Handle comma-separated tags
      return value
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);
    }
  }

  return [];
}

/**
 * Reference Aggregator class
 * Handles the full pipeline of aggregating curated references
 */
export class ReferenceAggregator {
  private options: RequiredAggregatorOptions;

  constructor(options?: AggregatorOptions) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    logger.debug('ReferenceAggregator initialized', {
      titleSimilarityThreshold: this.options.titleSimilarityThreshold,
      maxReferencesPerGroup: this.options.maxReferencesPerGroup,
    });
  }

  /**
   * Main aggregation pipeline
   * Processes input references through deduplication, enrichment, and grouping
   */
  async aggregate(references: CuratedReference[]): Promise<CuratedOutput> {
    const startTime = Date.now();
    logger.info('Starting aggregation pipeline', { inputCount: references.length });

    // Handle empty input
    if (references.length === 0) {
      return this.createEmptyOutput(startTime);
    }

    // Step 1: Deduplicate by URL
    const afterUrlDedup = this.deduplicateByUrl(references);
    const urlDuplicates = references.length - afterUrlDedup.length;

    // Step 2: Deduplicate by title similarity
    const afterTitleDedup = this.deduplicateByTitleSimilarity(afterUrlDedup);
    const titleDuplicates = afterUrlDedup.length - afterTitleDedup.length;

    // Step 3: Enrich metadata
    const enriched = afterTitleDedup.map((ref) => this.enrichMetadata(ref));

    // Step 4: Calculate relevance scores
    const scored = enriched.map((ref) => ({
      ...ref,
      relevanceScore: this.calculateRelevanceScore(ref),
    }));

    // Step 5: Group by content type
    const groups = this.groupByContentType(scored);

    // Step 6: Sort within groups by relevance
    const sortedGroups = groups.map((group) => ({
      ...group,
      references: this.sortByRelevance(group.references),
    }));

    // Step 7: Apply max references per group limit if configured
    const limitedGroups = this.applyGroupLimits(sortedGroups);

    // Calculate statistics
    const processingTimeMs = Date.now() - startTime;
    const statistics = this.calculateStatistics(
      limitedGroups,
      urlDuplicates,
      titleDuplicates,
      processingTimeMs
    );

    // Build final output
    const output: CuratedOutput = {
      groups: limitedGroups,
      totalReferences: limitedGroups.reduce((sum, g) => sum + g.count, 0),
      duplicatesRemoved: urlDuplicates + titleDuplicates,
      aggregatedAt: new Date(),
      sources: this.extractUniqueSources(references),
      statistics,
    };

    logger.info('Aggregation complete', {
      totalReferences: output.totalReferences,
      duplicatesRemoved: output.duplicatesRemoved,
      groupsCount: output.groups.length,
      processingTimeMs,
    });

    return output;
  }

  /**
   * Deduplicate references by normalized URL
   * Keeps the first occurrence of each unique URL
   */
  deduplicateByUrl(refs: CuratedReference[]): CuratedReference[] {
    const seen = new Map<string, CuratedReference>();

    for (const ref of refs) {
      const normalized = normalizeUrl(ref.url);

      if (!seen.has(normalized)) {
        seen.set(normalized, ref);
      } else {
        logger.debug('URL duplicate found', {
          url: ref.url,
          normalizedUrl: normalized,
        });
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Deduplicate references by title similarity
   * Uses Levenshtein distance with configurable threshold
   * Merges metadata from duplicates into the kept reference
   */
  deduplicateByTitleSimilarity(refs: CuratedReference[]): CuratedReference[] {
    const unique: CuratedReference[] = [];

    for (const ref of refs) {
      let isDuplicate = false;
      let mergeTarget: CuratedReference | null = null;

      for (const existing of unique) {
        const similarity = calculateSimilarity(ref.title, existing.title);

        if (similarity >= this.options.titleSimilarityThreshold) {
          isDuplicate = true;
          mergeTarget = existing;
          logger.debug('Title similarity duplicate found', {
            title1: ref.title,
            title2: existing.title,
            similarity: similarity.toFixed(3),
          });
          break;
        }
      }

      if (isDuplicate && mergeTarget) {
        // Merge metadata from duplicate into existing
        this.mergeMetadata(mergeTarget, ref);
      } else {
        unique.push(ref);
      }
    }

    return unique;
  }

  /**
   * Group enriched references by content type
   */
  groupByContentType(refs: EnrichedReference[]): ContentGroup[] {
    const grouped = new Map<ContentType, EnrichedReference[]>();

    // Initialize all content types
    for (const type of Object.values(ContentType)) {
      grouped.set(type, []);
    }

    // Group references
    for (const ref of refs) {
      const group = grouped.get(ref.contentType);
      if (group) {
        group.push(ref);
      }
    }

    // Build content groups (only include non-empty groups)
    const groups: ContentGroup[] = [];

    for (const [type, references] of grouped) {
      if (references.length > 0) {
        groups.push({
          type,
          references,
          count: references.length,
        });
      }
    }

    // Sort groups by count (descending)
    return groups.sort((a, b) => b.count - a.count);
  }

  /**
   * Enrich a curated reference with additional metadata
   */
  enrichMetadata(ref: CuratedReference): EnrichedReference {
    const domain = extractDomain(ref.url);

    const metadata: ReferenceMetadata = {
      author: extractAuthor(ref.rawMetadata),
      publishedAt: extractPublishedAt(ref.rawMetadata),
      sourceDomain: domain,
      faviconUrl: generateFaviconUrl(domain),
      estimatedReadTime: estimateReadTime(ref.title, ref.rawMetadata),
      tags: extractTags(ref.rawMetadata),
      language: this.detectLanguage(ref.rawMetadata),
    };

    return {
      id: ref.id,
      title: ref.title,
      url: ref.url,
      normalizedUrl: normalizeUrl(ref.url),
      source: ref.source,
      contentType: detectContentType(ref.url, ref.title),
      discoveredAt: ref.discoveredAt,
      metadata,
      relevanceScore: 0, // Will be calculated separately
    };
  }

  /**
   * Calculate relevance score for a reference
   * Score based on: recency, source weight, author, tags, content type
   */
  calculateRelevanceScore(ref: EnrichedReference): number {
    let score = 0;

    // Recency bonus (max 40 points)
    // Newer content gets higher score, decays over 80 hours
    const ageInHours = (Date.now() - ref.discoveredAt.getTime()) / (1000 * 60 * 60);
    score += Math.max(0, 40 - ageInHours * 0.5);

    // Source weight (max 30 points)
    score += SOURCE_WEIGHTS[ref.source] || SOURCE_WEIGHTS.default;

    // Has author bonus (10 points)
    if (ref.metadata.author) {
      score += 10;
    }

    // Has tags bonus (max 10 points, 2 points per tag)
    score += Math.min(ref.metadata.tags.length * 2, 10);

    // Content type bonus (max 10 points)
    score += TYPE_BONUS[ref.contentType];

    return Math.round(score);
  }

  /**
   * Sort references by relevance score (descending)
   */
  private sortByRelevance(refs: EnrichedReference[]): EnrichedReference[] {
    return [...refs].sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Apply max references per group limit
   */
  private applyGroupLimits(groups: ContentGroup[]): ContentGroup[] {
    if (this.options.maxReferencesPerGroup <= 0) {
      return groups;
    }

    return groups.map((group) => {
      const limited = group.references.slice(0, this.options.maxReferencesPerGroup);
      return {
        ...group,
        references: limited,
        count: limited.length,
      };
    });
  }

  /**
   * Merge metadata from a duplicate reference into the target
   */
  private mergeMetadata(target: CuratedReference, duplicate: CuratedReference): void {
    if (!target.rawMetadata) {
      target.rawMetadata = {};
    }

    // Merge raw metadata, preferring existing values
    if (duplicate.rawMetadata) {
      for (const [key, value] of Object.entries(duplicate.rawMetadata)) {
        if (!(key in target.rawMetadata)) {
          target.rawMetadata[key] = value;
        }
      }
    }
  }

  /**
   * Detect language from metadata
   */
  private detectLanguage(rawMetadata?: Record<string, unknown>): string {
    if (!rawMetadata) return 'en';

    const langFields = ['language', 'lang', 'locale'];

    for (const field of langFields) {
      const value = rawMetadata[field];
      if (typeof value === 'string' && value.trim()) {
        // Return first 2 chars (language code)
        return value.trim().substring(0, 2).toLowerCase();
      }
    }

    return 'en'; // Default to English
  }

  /**
   * Extract unique sources from references
   */
  private extractUniqueSources(refs: CuratedReference[]): string[] {
    const sources = new Set(refs.map((r) => r.source));
    return Array.from(sources).sort();
  }

  /**
   * Calculate aggregation statistics
   */
  private calculateStatistics(
    groups: ContentGroup[],
    urlDuplicates: number,
    titleDuplicates: number,
    processingTimeMs: number
  ): AggregationStats {
    // Count by source
    const bySource: Record<string, number> = {};
    for (const group of groups) {
      for (const ref of group.references) {
        bySource[ref.source] = (bySource[ref.source] || 0) + 1;
      }
    }

    // Count by content type
    const byContentType: Record<ContentType, number> = {
      [ContentType.ARTICLE]: 0,
      [ContentType.CODE]: 0,
      [ContentType.TUTORIAL]: 0,
      [ContentType.VIDEO]: 0,
      [ContentType.OTHER]: 0,
    };

    for (const group of groups) {
      byContentType[group.type] = group.count;
    }

    return {
      bySource,
      byContentType,
      urlDuplicates,
      titleDuplicates,
      processingTimeMs,
    };
  }

  /**
   * Create empty output for when no references are provided
   */
  private createEmptyOutput(startTime: number): CuratedOutput {
    return {
      groups: [],
      totalReferences: 0,
      duplicatesRemoved: 0,
      aggregatedAt: new Date(),
      sources: [],
      statistics: {
        bySource: {},
        byContentType: {
          [ContentType.ARTICLE]: 0,
          [ContentType.CODE]: 0,
          [ContentType.TUTORIAL]: 0,
          [ContentType.VIDEO]: 0,
          [ContentType.OTHER]: 0,
        },
        urlDuplicates: 0,
        titleDuplicates: 0,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }
}

/**
 * Factory function for creating ReferenceAggregator instances
 */
export function createReferenceAggregator(
  options?: AggregatorOptions
): ReferenceAggregator {
  return new ReferenceAggregator(options);
}
