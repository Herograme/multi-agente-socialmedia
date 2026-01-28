/**
 * RelevanceScorer - Calculates content relevance based on keyword matching and topic similarity
 * Story 2.4 - Content Ranking Algorithm
 */

import type { ContentToRank, RelevanceBreakdown } from '../types';

/**
 * RelevanceScorer calculates how relevant content is to target keywords.
 * It uses keyword matching and simplified TF-IDF topic similarity.
 */
export class RelevanceScorer {
  private readonly targetKeywords: string[];

  /**
   * Creates a new RelevanceScorer
   * @param keywords - Target keywords to match content against
   */
  constructor(keywords: string[]) {
    // Normalize keywords to lowercase for case-insensitive matching
    this.targetKeywords = keywords.map((k) => k.toLowerCase().trim()).filter((k) => k.length > 0);
  }

  /**
   * Scores content relevance
   * @param content - Content to score
   * @returns Breakdown of relevance scores
   */
  score(content: ContentToRank): RelevanceBreakdown {
    const keywordMatch = this.calculateKeywordMatch(content);
    const topicSimilarity = this.calculateTopicSimilarity(content);

    // Weighted average: keyword match is more important (60%) than topic similarity (40%)
    const final = keywordMatch * 0.6 + topicSimilarity * 0.4;

    return {
      keywordMatch,
      topicSimilarity,
      final,
    };
  }

  /**
   * Calculates keyword match score based on how many target keywords appear in content
   * @param content - Content to analyze
   * @returns Score between 0 and 1
   */
  private calculateKeywordMatch(content: ContentToRank): number {
    if (this.targetKeywords.length === 0) {
      return 0;
    }

    // Combine all text fields for matching
    const text = this.combineTextFields(content).toLowerCase();

    // Count how many keywords are present
    const matches = this.targetKeywords.filter((keyword) => text.includes(keyword));

    return matches.length / this.targetKeywords.length;
  }

  /**
   * Calculates topic similarity using Jaccard similarity (simplified TF-IDF approach)
   * @param content - Content to analyze
   * @returns Score between 0 and 1
   */
  private calculateTopicSimilarity(content: ContentToRank): number {
    if (this.targetKeywords.length === 0) {
      return 0;
    }

    // Tokenize content
    const contentTerms = this.tokenize(
      `${content.title} ${content.content || ''}`
    );

    if (contentTerms.length === 0) {
      return 0;
    }

    // Create set of target terms
    const targetTerms = new Set(this.targetKeywords);

    // Calculate Jaccard similarity: intersection / union (using sets to avoid duplicates)
    const contentTermsSet = new Set(contentTerms);
    const intersectionSet = new Set(
      [...contentTermsSet].filter((term) => targetTerms.has(term))
    );

    // Create union of both sets
    const union = new Set([...contentTermsSet, ...this.targetKeywords]);

    return intersectionSet.size / union.size;
  }

  /**
   * Combines all text fields from content into a single string
   * @param content - Content to extract text from
   * @returns Combined text string
   */
  private combineTextFields(content: ContentToRank): string {
    const parts: string[] = [content.title];

    if (content.content) {
      parts.push(content.content);
    }

    if (content.tags && content.tags.length > 0) {
      parts.push(content.tags.join(' '));
    }

    return parts.join(' ');
  }

  /**
   * Tokenizes text into individual terms
   * @param text - Text to tokenize
   * @returns Array of lowercase terms (length > 2)
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((term) => term.length > 2);
  }

  /**
   * Returns the target keywords
   */
  getTargetKeywords(): string[] {
    return [...this.targetKeywords];
  }
}
