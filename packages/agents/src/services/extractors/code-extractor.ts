/**
 * Code Extractor
 * Main class for extracting code snippets from HTML and Markdown content
 */

import { HtmlParser } from './parsers/html-parser';
import { MarkdownParser } from './parsers/markdown-parser';
import { LanguageDetector } from './language-detector';
import type {
  CodeSnippet,
  ExtractorOptions,
  ExtractionResult,
} from './types';

/**
 * Default options for the code extractor
 */
const DEFAULT_OPTIONS: Required<ExtractorOptions> = {
  minLines: 2,
  maxLines: 100,
  includeInline: false,
  deduplication: true,
  similarityThreshold: 0.9,
};

/**
 * Extracts code snippets from HTML and Markdown content
 */
export class CodeExtractor {
  private htmlParser: HtmlParser;
  private markdownParser: MarkdownParser;
  private languageDetector: LanguageDetector;
  private options: Required<ExtractorOptions>;

  constructor(options: ExtractorOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.htmlParser = new HtmlParser();
    this.markdownParser = new MarkdownParser();
    this.languageDetector = new LanguageDetector();
  }

  /**
   * Extract code snippets from content
   */
  async extract(content: string): Promise<ExtractionResult> {
    const format = this.detectFormat(content);
    let snippets: CodeSnippet[] = [];

    if (format === 'html') {
      snippets = await this.htmlParser.parse(content);
    } else if (format === 'markdown') {
      snippets = await this.markdownParser.parse(content);
    } else {
      // Mixed content - try both parsers
      const htmlSnippets = await this.htmlParser.parse(content);
      const mdSnippets = await this.markdownParser.parse(content);
      snippets = [...htmlSnippets, ...mdSnippets];
    }

    // Re-detect languages for snippets without confidence
    snippets = this.enhanceLanguageDetection(snippets);

    // Filter by line count
    snippets = this.filterByLineCount(snippets);

    // Deduplicate if enabled
    const originalCount = snippets.length;
    if (this.options.deduplication) {
      snippets = this.deduplicate(snippets);
    }

    // Sort by relevance (line count and confidence)
    snippets = this.sortByRelevance(snippets);

    return {
      snippets,
      metadata: {
        totalFound: originalCount,
        duplicatesRemoved: originalCount - snippets.length,
        format,
        extractedAt: new Date(),
      },
    };
  }

  /**
   * Detect the format of the content
   */
  private detectFormat(content: string): 'html' | 'markdown' | 'mixed' {
    // Check for HTML code blocks
    const hasHtmlCodeBlocks =
      /<pre[^>]*>[\s\S]*?<code[^>]*>|<code[^>]*>[\s\S]*?<\/code>/.test(content);

    // Check for Markdown code blocks
    const hasMarkdownCodeBlocks = /```[\s\S]*?```|^[ ]{4}[^\s]/m.test(content);

    if (hasHtmlCodeBlocks && hasMarkdownCodeBlocks) {
      return 'mixed';
    }
    if (hasHtmlCodeBlocks) {
      return 'html';
    }
    return 'markdown';
  }

  /**
   * Enhance language detection for snippets
   */
  private enhanceLanguageDetection(snippets: CodeSnippet[]): CodeSnippet[] {
    return snippets.map((snippet) => {
      // Only re-detect if confidence is low or language is plaintext
      if (
        snippet.metadata.confidence < 0.5 ||
        snippet.language === 'plaintext'
      ) {
        const detection = this.languageDetector.detect(snippet.code);
        if (detection.confidence > snippet.metadata.confidence) {
          return {
            ...snippet,
            language: detection.language,
            metadata: {
              ...snippet.metadata,
              confidence: detection.confidence,
            },
          };
        }
      }
      return snippet;
    });
  }

  /**
   * Filter snippets by line count
   */
  private filterByLineCount(snippets: CodeSnippet[]): CodeSnippet[] {
    return snippets.filter((snippet) => {
      const lineCount = snippet.lineCount;
      return lineCount >= this.options.minLines && lineCount <= this.options.maxLines;
    });
  }

  /**
   * Deduplicate similar snippets
   */
  private deduplicate(snippets: CodeSnippet[]): CodeSnippet[] {
    if (snippets.length <= 1) {
      return snippets;
    }

    const unique: CodeSnippet[] = [];
    const threshold = this.options.similarityThreshold;

    for (const snippet of snippets) {
      let isDuplicate = false;

      for (let i = 0; i < unique.length; i++) {
        const existing = unique[i];
        const similarity = this.calculateSimilarity(snippet.code, existing.code);

        if (similarity >= threshold) {
          isDuplicate = true;

          // Keep the snippet with more context/lines
          if (this.shouldReplace(existing, snippet)) {
            unique[i] = snippet;
          }
          break;
        }
      }

      if (!isDuplicate) {
        unique.push(snippet);
      }
    }

    return unique;
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    // Normalize whitespace for comparison
    const norm1 = str1.replace(/\s+/g, ' ').trim();
    const norm2 = str2.replace(/\s+/g, ' ').trim();

    // Quick check for exact match
    if (norm1 === norm2) {
      return 1.0;
    }

    // Quick check for very different lengths
    const lengthRatio =
      Math.min(norm1.length, norm2.length) /
      Math.max(norm1.length, norm2.length);
    if (lengthRatio < 0.5) {
      return lengthRatio;
    }

    // For longer strings, use a sampling approach for performance
    if (norm1.length > 1000 || norm2.length > 1000) {
      return this.calculateSimilarityLong(norm1, norm2);
    }

    // Calculate Levenshtein distance
    const distance = this.levenshteinDistance(norm1, norm2);
    const maxLength = Math.max(norm1.length, norm2.length);

    return 1 - distance / maxLength;
  }

  /**
   * Calculate similarity for long strings using line-based comparison
   */
  private calculateSimilarityLong(str1: string, str2: string): number {
    const lines1 = str1.split('\n').map((l) => l.trim()).filter((l) => l);
    const lines2 = str2.split('\n').map((l) => l.trim()).filter((l) => l);

    const set1 = new Set(lines1);
    const set2 = new Set(lines2);

    let common = 0;
    for (const line of set1) {
      if (set2.has(line)) {
        common++;
      }
    }

    const total = set1.size + set2.size - common;
    return total === 0 ? 1 : common / total;
  }

  /**
   * Levenshtein distance implementation
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;

    // Use two rows instead of full matrix for memory efficiency
    let prevRow = new Array(n + 1).fill(0).map((_, i) => i);
    let currRow = new Array(n + 1).fill(0);

    for (let i = 1; i <= m; i++) {
      currRow[0] = i;

      for (let j = 1; j <= n; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        currRow[j] = Math.min(
          prevRow[j] + 1, // deletion
          currRow[j - 1] + 1, // insertion
          prevRow[j - 1] + cost // substitution
        );
      }

      // Swap rows
      [prevRow, currRow] = [currRow, prevRow];
    }

    return prevRow[n];
  }

  /**
   * Determine if a new snippet should replace an existing one
   */
  private shouldReplace(existing: CodeSnippet, candidate: CodeSnippet): boolean {
    // Prefer snippet with more context
    const existingContext =
      (existing.context?.title ? 1 : 0) +
      (existing.context?.description ? 1 : 0);
    const candidateContext =
      (candidate.context?.title ? 1 : 0) +
      (candidate.context?.description ? 1 : 0);

    if (candidateContext > existingContext) {
      return true;
    }
    if (candidateContext < existingContext) {
      return false;
    }

    // Prefer snippet with higher confidence
    if (candidate.metadata.confidence > existing.metadata.confidence) {
      return true;
    }
    if (candidate.metadata.confidence < existing.metadata.confidence) {
      return false;
    }

    // Prefer longer snippet (more complete)
    return candidate.lineCount > existing.lineCount;
  }

  /**
   * Sort snippets by relevance
   */
  private sortByRelevance(snippets: CodeSnippet[]): CodeSnippet[] {
    return snippets.sort((a, b) => {
      // First by position (earlier snippets first)
      const posA = a.context?.position ?? 0;
      const posB = b.context?.position ?? 0;
      if (posA !== posB) {
        return posA - posB;
      }

      // Then by line count (prefer medium-sized snippets)
      const idealSize = 20;
      const sizeScoreA = -Math.abs(a.lineCount - idealSize);
      const sizeScoreB = -Math.abs(b.lineCount - idealSize);
      if (sizeScoreA !== sizeScoreB) {
        return sizeScoreB - sizeScoreA;
      }

      // Finally by confidence
      return b.metadata.confidence - a.metadata.confidence;
    });
  }

  /**
   * Get the language detector instance
   */
  getLanguageDetector(): LanguageDetector {
    return this.languageDetector;
  }

  /**
   * Get the current options
   */
  getOptions(): Required<ExtractorOptions> {
    return { ...this.options };
  }
}
