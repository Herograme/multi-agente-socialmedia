/**
 * Code Slide Analyzer
 * Story 4.3 - Agente QA Analyst - Analise de Imagens
 *
 * Analyzes slides containing code to verify proper formatting,
 * syntax highlighting, and readability.
 */

import sharp from 'sharp';
import type {
  VisualFeedback,
  CodeSlideAnalysisResult,
} from './visual-types';
import { VisualIssueType, IssueSeverity } from './visual-types';

/**
 * Common syntax highlighting color ranges
 * Used to detect if syntax highlighting was applied
 */
const SYNTAX_HIGHLIGHT_COLORS = {
  // Common keyword colors (blues, purples)
  keywords: [
    { r: [80, 150], g: [80, 150], b: [180, 255] },
    { r: [150, 200], g: [100, 150], b: [200, 255] },
  ],
  // String colors (greens, oranges)
  strings: [
    { r: [80, 150], g: [180, 255], b: [80, 150] },
    { r: [200, 255], g: [150, 200], b: [80, 130] },
  ],
  // Comment colors (grays)
  comments: [
    { r: [80, 130], g: [80, 130], b: [80, 130] },
    { r: [100, 150], g: [100, 150], b: [100, 150] },
  ],
};

/**
 * Minimum percentage of varied colors to indicate syntax highlighting
 */
const MIN_HIGHLIGHT_COLOR_VARIETY = 3;

/**
 * Configuration for code slide analysis
 */
export interface CodeSlideAnalyzerConfig {
  /** Minimum font size ratio (font height / image height) */
  minFontSizeRatio: number;
  /** Maximum lines of code per slide for readability */
  maxLinesPerSlide: number;
  /** Whether to require syntax highlighting */
  requireSyntaxHighlight: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: CodeSlideAnalyzerConfig = {
  minFontSizeRatio: 0.02, // Font should be at least 2% of image height
  maxLinesPerSlide: 15,
  requireSyntaxHighlight: true,
};

/**
 * Analyzes code slides for formatting and readability
 */
export class CodeSlideAnalyzer {
  private config: CodeSlideAnalyzerConfig;

  constructor(config?: Partial<CodeSlideAnalyzerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Analyzes a slide for code content and formatting
   *
   * @param imagePath - Path to the slide image
   * @param slideIndex - Index of the slide
   * @param hasCodeMetadata - Whether metadata indicates code presence
   * @returns Code slide analysis result
   */
  async analyzeCodeSlide(
    imagePath: string,
    slideIndex: number,
    hasCodeMetadata: boolean = false
  ): Promise<CodeSlideAnalysisResult> {
    const issues: VisualFeedback[] = [];

    // Get image metadata
    const metadata = await sharp(imagePath).metadata();
    const height = metadata.height ?? 1080;

    // Check for syntax highlighting colors
    const colorAnalysis = await this.analyzeColors(imagePath);
    const hasSyntaxHighlighting = colorAnalysis.hasSyntaxHighlighting;

    // Determine if this is a code slide
    const hasCode = hasCodeMetadata || colorAnalysis.looksLikeCode;

    if (!hasCode) {
      return {
        hasCode: false,
        hasSyntaxHighlighting: false,
        fontSizeAdequate: true,
        hasOverflow: false,
        score: 10,
        issues: [],
      };
    }

    // Check syntax highlighting if code is present
    if (this.config.requireSyntaxHighlight && !hasSyntaxHighlighting) {
      issues.push({
        type: VisualIssueType.MISSING_SYNTAX_HIGHLIGHT,
        severity: IssueSeverity.WARNING,
        message: 'Codigo sem syntax highlighting detectado',
        suggestion: 'Aplique syntax highlighting para melhor legibilidade do codigo',
        slideIndex,
      });
    }

    // Estimate font size adequacy based on color distribution
    const fontSizeAdequate = colorAnalysis.estimatedLineHeight >= height * this.config.minFontSizeRatio;

    if (!fontSizeAdequate) {
      issues.push({
        type: VisualIssueType.POOR_READABILITY,
        severity: IssueSeverity.WARNING,
        message: 'Fonte do codigo pode estar muito pequena',
        suggestion: `Aumente o tamanho da fonte para melhor legibilidade em dispositivos moveis`,
        slideIndex,
      });
    }

    // Check for potential overflow (too many estimated lines)
    const estimatedLines = colorAnalysis.estimatedLineCount;
    const hasOverflow = estimatedLines > this.config.maxLinesPerSlide;

    if (hasOverflow) {
      issues.push({
        type: VisualIssueType.TEXT_OVERFLOW,
        severity: IssueSeverity.WARNING,
        message: `Codigo pode ter muitas linhas (${estimatedLines} estimadas)`,
        suggestion: `Considere dividir em multiplos slides ou mostrar apenas o trecho mais relevante`,
        slideIndex,
      });
    }

    // Calculate score
    const score = this.calculateCodeScore(
      hasSyntaxHighlighting,
      fontSizeAdequate,
      hasOverflow
    );

    return {
      hasCode: true,
      hasSyntaxHighlighting,
      language: colorAnalysis.detectedLanguage,
      fontSizeAdequate,
      hasOverflow,
      score,
      issues,
    };
  }

  /**
   * Analyzes image colors for code detection and highlighting
   */
  private async analyzeColors(imagePath: string): Promise<{
    hasSyntaxHighlighting: boolean;
    looksLikeCode: boolean;
    estimatedLineHeight: number;
    estimatedLineCount: number;
    detectedLanguage?: string;
  }> {
    // Sample the image at reduced resolution
    const { data, info } = await sharp(imagePath)
      .resize(200, 200, { fit: 'inside' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const colorCounts = new Map<string, number>();
    const channels = info.channels;

    // Count unique colors
    for (let i = 0; i < data.length; i += channels) {
      const r = Math.round(data[i]! / 32) * 32;
      const g = Math.round(data[i + 1]! / 32) * 32;
      const b = Math.round(data[i + 2]! / 32) * 32;
      const key = `${r},${g},${b}`;
      colorCounts.set(key, (colorCounts.get(key) ?? 0) + 1);
    }

    // Check for syntax highlighting color patterns
    let keywordColors = 0;
    let stringColors = 0;
    let commentColors = 0;
    let darkBackground = false;

    for (const [key, count] of colorCounts) {
      const [r, g, b] = key.split(',').map(Number) as [number, number, number];

      // Check for dark background
      if (r < 60 && g < 60 && b < 80 && count > data.length / channels * 0.3) {
        darkBackground = true;
      }

      // Check for keyword-like colors
      if (this.isInColorRange(r, g, b, SYNTAX_HIGHLIGHT_COLORS.keywords)) {
        keywordColors += count;
      }

      // Check for string-like colors
      if (this.isInColorRange(r, g, b, SYNTAX_HIGHLIGHT_COLORS.strings)) {
        stringColors += count;
      }

      // Check for comment-like colors
      if (this.isInColorRange(r, g, b, SYNTAX_HIGHLIGHT_COLORS.comments)) {
        commentColors += count;
      }
    }

    const totalPixels = data.length / channels;
    const highlightPixelRatio = (keywordColors + stringColors + commentColors) / totalPixels;

    // Determine if syntax highlighting is present
    const uniqueHighlightCategories =
      (keywordColors > totalPixels * 0.01 ? 1 : 0) +
      (stringColors > totalPixels * 0.01 ? 1 : 0) +
      (commentColors > totalPixels * 0.01 ? 1 : 0);

    const hasSyntaxHighlighting =
      darkBackground &&
      highlightPixelRatio > 0.05 &&
      uniqueHighlightCategories >= 2;

    // Check if it looks like code (dark bg with varied text colors)
    const looksLikeCode = darkBackground && colorCounts.size > 5;

    // Estimate line metrics (very rough heuristic)
    const estimatedLineHeight = info.height! / 20; // Assume ~20 lines visible
    const estimatedLineCount = Math.round(info.height! / estimatedLineHeight);

    return {
      hasSyntaxHighlighting,
      looksLikeCode,
      estimatedLineHeight,
      estimatedLineCount,
      detectedLanguage: undefined, // Would need OCR for accurate detection
    };
  }

  /**
   * Checks if RGB values fall within color ranges
   */
  private isInColorRange(
    r: number,
    g: number,
    b: number,
    ranges: Array<{ r: number[]; g: number[]; b: number[] }>
  ): boolean {
    return ranges.some(range =>
      r >= range.r[0]! && r <= range.r[1]! &&
      g >= range.g[0]! && g <= range.g[1]! &&
      b >= range.b[0]! && b <= range.b[1]!
    );
  }

  /**
   * Calculates code formatting score
   */
  private calculateCodeScore(
    hasSyntaxHighlighting: boolean,
    fontSizeAdequate: boolean,
    hasOverflow: boolean
  ): number {
    let score = 10;

    if (!hasSyntaxHighlighting) {
      score -= 2;
    }

    if (!fontSizeAdequate) {
      score -= 2;
    }

    if (hasOverflow) {
      score -= 2;
    }

    return Math.max(0, score);
  }

  /**
   * Gets the current configuration
   */
  getConfig(): CodeSlideAnalyzerConfig {
    return { ...this.config };
  }
}

/**
 * Factory function to create a CodeSlideAnalyzer
 *
 * @param config - Optional configuration overrides
 * @returns Configured CodeSlideAnalyzer instance
 */
export function createCodeSlideAnalyzer(
  config?: Partial<CodeSlideAnalyzerConfig>
): CodeSlideAnalyzer {
  return new CodeSlideAnalyzer(config);
}
