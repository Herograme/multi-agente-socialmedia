/**
 * ContentRanker - Main orchestrator for content ranking
 * Story 2.4 - Content Ranking Algorithm
 */

import type {
  RankingConfig,
  ContentToRank,
  RankedContent,
  RankingResult,
  ScoreBreakdown,
} from './types';
import { DEFAULT_RANKING_CONFIG } from './types';
import { RelevanceScorer } from './scorers/relevance-scorer';
import { QualityScorer } from './scorers/quality-scorer';
import { WeightedScorer } from './scorers/weighted-scorer';

/**
 * ContentRanker orchestrates the scoring and ranking of content items.
 * It combines relevance scoring (keyword/topic matching) with quality
 * scoring (length, code presence, freshness) using configurable weights.
 */
export class ContentRanker {
  private readonly config: RankingConfig;
  private readonly relevanceScorer: RelevanceScorer;
  private readonly qualityScorer: QualityScorer;
  private readonly weightedScorer: WeightedScorer;

  /**
   * Creates a new ContentRanker instance
   * @param targetKeywords - Keywords to match content against
   * @param config - Optional partial configuration (merged with defaults)
   */
  constructor(targetKeywords: string[], config?: Partial<RankingConfig>) {
    this.config = this.mergeConfig(config);
    this.relevanceScorer = new RelevanceScorer(targetKeywords);
    this.qualityScorer = new QualityScorer(
      this.config.qualityWeights,
      this.config.thresholds.minLength
    );
    this.weightedScorer = new WeightedScorer(this.config.weights);
  }

  /**
   * Ranks a list of content items by relevance and quality
   * @param contents - Content items to rank
   * @returns Ranking result with sorted items and metadata
   */
  rank(contents: ContentToRank[]): RankingResult {
    // Score all content items
    const scored = contents.map((content) => this.scoreContent(content));

    // Filter out items below the minimum score threshold
    const filtered = scored.filter(
      (item) => item.score >= this.config.thresholds.minScore
    );

    // Sort by score descending
    const sorted = filtered.sort((a, b) => b.score - a.score);

    // Assign ranks (1-based)
    const ranked: RankedContent[] = sorted.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    // Calculate metadata
    const averageScore =
      ranked.length > 0
        ? ranked.reduce((sum, item) => sum + item.score, 0) / ranked.length
        : 0;

    return {
      items: ranked,
      metadata: {
        totalProcessed: contents.length,
        totalReturned: ranked.length,
        filteredOut: contents.length - ranked.length,
        averageScore,
        config: this.config,
        timestamp: new Date(),
      },
    };
  }

  /**
   * Scores a single content item
   * @param content - Content item to score
   * @returns Content with score and breakdown (without rank)
   */
  private scoreContent(content: ContentToRank): Omit<RankedContent, 'rank'> {
    // Calculate relevance score
    const relevance = this.relevanceScorer.score(content);

    // Calculate quality score
    const quality = this.qualityScorer.score(content);

    // Combine scores using weighted scorer
    const combined = this.weightedScorer.combine(relevance.final, quality.final);

    const breakdown: ScoreBreakdown = {
      relevance,
      quality,
      combined,
    };

    return {
      ...content,
      score: combined,
      breakdown,
    };
  }

  /**
   * Merges partial config with defaults
   * @param partial - Partial configuration to merge
   * @returns Complete configuration
   */
  private mergeConfig(partial?: Partial<RankingConfig>): RankingConfig {
    if (!partial) {
      return { ...DEFAULT_RANKING_CONFIG };
    }

    return {
      weights: {
        ...DEFAULT_RANKING_CONFIG.weights,
        ...partial.weights,
      },
      qualityWeights: {
        ...DEFAULT_RANKING_CONFIG.qualityWeights,
        ...partial.qualityWeights,
      },
      thresholds: {
        ...DEFAULT_RANKING_CONFIG.thresholds,
        ...partial.thresholds,
      },
    };
  }

  /**
   * Returns the current configuration
   */
  getConfig(): RankingConfig {
    return { ...this.config };
  }
}
