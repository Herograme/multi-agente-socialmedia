/**
 * QualityScorer - Calculates content quality based on length, code presence, and freshness
 * Story 2.4 - Content Ranking Algorithm
 */

import type { ContentToRank, QualityBreakdown, QualityWeights } from '../types';

/**
 * QualityScorer evaluates content quality using multiple indicators:
 * - Content length (word count)
 * - Code presence (code blocks/snippets)
 * - Freshness (age-based decay)
 */
export class QualityScorer {
  private readonly weights: QualityWeights;
  private readonly minLength: number;

  /**
   * Creates a new QualityScorer
   * @param weights - Weights for each quality indicator
   * @param minLength - Minimum word count threshold (default: 100)
   */
  constructor(weights: QualityWeights, minLength = 100) {
    this.weights = weights;
    this.minLength = minLength;
  }

  /**
   * Scores content quality
   * @param content - Content to score
   * @returns Breakdown of quality scores
   */
  score(content: ContentToRank): QualityBreakdown {
    const length = this.calculateLengthScore(content);
    const codePresence = this.calculateCodePresence(content);
    const freshness = this.calculateFreshness(content);

    // Weighted combination of all quality indicators
    const final =
      length * this.weights.length +
      codePresence * this.weights.codePresence +
      freshness * this.weights.freshness;

    return {
      length,
      codePresence,
      freshness,
      final,
    };
  }

  /**
   * Calculates length score based on word count
   * Optimal range: 500-2000 words
   * @param content - Content to analyze
   * @returns Score between 0 and 1
   */
  private calculateLengthScore(content: ContentToRank): number {
    if (!content.content) {
      return 0.5; // Neutral score when no content available
    }

    const wordCount = this.countWords(content.content);

    // Scoring ranges:
    // Below minLength: 0.2
    // minLength to 500: linear scale 0.2 to 1.0
    // 500 to 2000: optimal range, score = 1.0
    // Above 2000: slight penalty, cap at 0.9

    if (wordCount < this.minLength) {
      return 0.2;
    }

    if (wordCount < 500) {
      // Linear interpolation from 0.2 to 1.0
      const range = 500 - this.minLength;
      if (range <= 0) return 1.0;
      return 0.2 + (0.8 * (wordCount - this.minLength)) / range;
    }

    if (wordCount <= 2000) {
      return 1.0;
    }

    // Slightly penalize very long content (might be too verbose)
    return 0.9;
  }

  /**
   * Calculates code presence score based on code blocks
   * @param content - Content to analyze
   * @returns Score between 0 and 1
   */
  private calculateCodePresence(content: ContentToRank): number {
    if (!content.content) {
      return 0;
    }

    const codeBlockCount = this.countCodeBlocks(content.content);

    // Scoring based on number of code blocks:
    // 0 blocks: 0
    // 1 block: 0.5
    // 2 blocks: 0.8
    // 3+ blocks: 1.0

    if (codeBlockCount === 0) {
      return 0;
    }

    if (codeBlockCount === 1) {
      return 0.5;
    }

    if (codeBlockCount === 2) {
      return 0.8;
    }

    return 1.0;
  }

  /**
   * Calculates freshness score with decay based on content age
   * @param content - Content to analyze
   * @returns Score between 0.1 and 1
   */
  private calculateFreshness(content: ContentToRank): number {
    const now = new Date();
    const publishedAt = new Date(content.publishedAt);
    const ageInDays =
      (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);

    // Handle future dates (possibly timezone issues)
    if (ageInDays < 0) {
      return 1.0;
    }

    // Freshness decay function:
    // 0-1 days: 1.0
    // 1-7 days: 0.9 to 0.7 (linear decay)
    // 7-30 days: 0.7 to 0.4 (linear decay)
    // 30+ days: 0.4 to 0.1 (gradual decay, min 0.1)

    if (ageInDays <= 1) {
      return 1.0;
    }

    if (ageInDays <= 7) {
      // Linear decay from 0.9 to 0.7 over 6 days
      return 0.9 - (0.2 * (ageInDays - 1)) / 6;
    }

    if (ageInDays <= 30) {
      // Linear decay from 0.7 to 0.4 over 23 days
      return 0.7 - (0.3 * (ageInDays - 7)) / 23;
    }

    // Gradual decay from 0.4 to 0.1 over 60 days after day 30
    // Minimum score is 0.1 to still give old but relevant content some weight
    const daysAfter30 = Math.min(ageInDays - 30, 60);
    return Math.max(0.1, 0.4 - (0.3 * daysAfter30) / 60);
  }

  /**
   * Counts words in text
   * @param text - Text to count words in
   * @returns Word count
   */
  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  /**
   * Counts code blocks in text (markdown and HTML)
   * @param text - Text to search for code blocks
   * @returns Number of code blocks found
   */
  private countCodeBlocks(text: string): number {
    // Match markdown code blocks (```) and HTML code blocks (<code>, <pre>)
    const codeBlockRegex =
      /```[\s\S]*?```|<code>[\s\S]*?<\/code>|<pre>[\s\S]*?<\/pre>/gi;
    const matches = text.match(codeBlockRegex);
    return matches ? matches.length : 0;
  }

  /**
   * Returns the quality weights
   */
  getWeights(): QualityWeights {
    return { ...this.weights };
  }

  /**
   * Returns the minimum length threshold
   */
  getMinLength(): number {
    return this.minLength;
  }
}
