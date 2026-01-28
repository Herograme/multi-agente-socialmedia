/**
 * Types for the Reference Aggregator service
 * Handles aggregation and deduplication of curated references from multiple sources
 */

/**
 * Content type classification for references
 */
export enum ContentType {
  ARTICLE = 'article',
  CODE = 'code',
  TUTORIAL = 'tutorial',
  VIDEO = 'video',
  OTHER = 'other',
}

/**
 * Input reference from curators (before aggregation)
 */
export interface CuratedReference {
  id: string;
  title: string;
  url: string;
  source: string; // 'devto' | 'hackernews' | 'reddit' | etc
  discoveredAt: Date;
  rawMetadata?: Record<string, unknown>;
}

/**
 * Metadata structure for enriched references
 */
export interface ReferenceMetadata {
  author: string | null;
  publishedAt: Date | null;
  sourceDomain: string;
  faviconUrl: string;
  estimatedReadTime: number | null; // in minutes
  tags: string[];
  language: string;
}

/**
 * Enriched reference after aggregation processing
 */
export interface EnrichedReference {
  id: string;
  title: string;
  url: string;
  normalizedUrl: string;
  source: string;
  contentType: ContentType;
  discoveredAt: Date;
  metadata: ReferenceMetadata;
  relevanceScore: number;
}

/**
 * Grouped output structure by content type
 */
export interface ContentGroup {
  type: ContentType;
  references: EnrichedReference[];
  count: number;
}

/**
 * Aggregation statistics
 */
export interface AggregationStats {
  bySource: Record<string, number>;
  byContentType: Record<ContentType, number>;
  urlDuplicates: number;
  titleDuplicates: number;
  processingTimeMs: number;
}

/**
 * Final curated output from the aggregation pipeline
 */
export interface CuratedOutput {
  groups: ContentGroup[];
  totalReferences: number;
  duplicatesRemoved: number;
  aggregatedAt: Date;
  sources: string[];
  statistics: AggregationStats;
}

/**
 * Configuration options for the ReferenceAggregator
 */
export interface AggregatorOptions {
  /** Similarity threshold for title deduplication (0.0 - 1.0), default 0.85 */
  titleSimilarityThreshold?: number;
  /** Whether to include raw metadata in enriched references, default false */
  includeRawMetadata?: boolean;
  /** Maximum references per content group, default unlimited (0) */
  maxReferencesPerGroup?: number;
}

/**
 * Internal type for required options (after defaults applied)
 */
export interface RequiredAggregatorOptions {
  titleSimilarityThreshold: number;
  includeRawMetadata: boolean;
  maxReferencesPerGroup: number;
}
