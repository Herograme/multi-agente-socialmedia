/**
 * Content Ranking Types and Interfaces
 * Story 2.4 - Content Ranking Algorithm
 */

/**
 * Configuration for quality scoring weights
 */
export interface QualityWeights {
  /** Weight for content length indicator (0-1) */
  length: number;
  /** Weight for code presence indicator (0-1) */
  codePresence: number;
  /** Weight for freshness indicator (0-1) */
  freshness: number;
}

/**
 * Configuration for the ranking algorithm
 */
export interface RankingConfig {
  /** Weights for combining relevance and quality scores */
  weights: {
    /** Weight for relevance score (default: 0.5) */
    relevance: number;
    /** Weight for quality score (default: 0.5) */
    quality: number;
  };
  /** Weights for individual quality indicators */
  qualityWeights: QualityWeights;
  /** Threshold values for filtering */
  thresholds: {
    /** Minimum combined score to include in results (default: 0.3) */
    minScore: number;
    /** Minimum word count for content (default: 100) */
    minLength: number;
  };
}

/**
 * Content item to be ranked
 */
export interface ContentToRank {
  /** Unique identifier */
  id: string;
  /** Content title */
  title: string;
  /** Full content text (optional) */
  content?: string;
  /** Source URL */
  url: string;
  /** Source platform name */
  source: string;
  /** Publication date */
  publishedAt: Date;
  /** Associated tags/keywords (optional) */
  tags?: string[];
}

/**
 * Breakdown of relevance scoring components
 */
export interface RelevanceBreakdown {
  /** Score from keyword matching (0-1) */
  keywordMatch: number;
  /** Score from topic similarity using TF-IDF (0-1) */
  topicSimilarity: number;
  /** Final combined relevance score (0-1) */
  final: number;
}

/**
 * Breakdown of quality scoring components
 */
export interface QualityBreakdown {
  /** Score for content length (0-1) */
  length: number;
  /** Score for code block presence (0-1) */
  codePresence: number;
  /** Score for content freshness (0-1) */
  freshness: number;
  /** Final combined quality score (0-1) */
  final: number;
}

/**
 * Complete breakdown of all scoring components
 */
export interface ScoreBreakdown {
  /** Relevance score components */
  relevance: RelevanceBreakdown;
  /** Quality score components */
  quality: QualityBreakdown;
  /** Final combined score (0-1) */
  combined: number;
}

/**
 * Content item with ranking information
 */
export interface RankedContent extends ContentToRank {
  /** Final combined score (0-1) */
  score: number;
  /** Detailed breakdown of all scoring components */
  breakdown: ScoreBreakdown;
  /** Position in the ranked list (1-based) */
  rank: number;
}

/**
 * Result of the ranking operation
 */
export interface RankingResult {
  /** Ranked content items sorted by score descending */
  items: RankedContent[];
  /** Metadata about the ranking operation */
  metadata: {
    /** Total number of content items processed */
    totalProcessed: number;
    /** Number of items returned after filtering */
    totalReturned: number;
    /** Number of items filtered out due to low score */
    filteredOut: number;
    /** Average score of returned items */
    averageScore: number;
    /** Configuration used for ranking */
    config: RankingConfig;
    /** Timestamp of the ranking operation */
    timestamp: Date;
  };
}

/**
 * Default configuration values
 */
export const DEFAULT_RANKING_CONFIG: RankingConfig = {
  weights: {
    relevance: 0.5,
    quality: 0.5,
  },
  qualityWeights: {
    length: 0.3,
    codePresence: 0.3,
    freshness: 0.4,
  },
  thresholds: {
    minScore: 0.3,
    minLength: 100,
  },
};
