/**
 * Heuristic Image Analyzer
 * Story 4.3 - Agente QA Analyst - Analise de Imagens
 *
 * Performs programmatic analysis of image quality without requiring
 * external AI/ML services. Validates dimensions, file size, format,
 * and aspect ratio.
 */

import sharp from 'sharp';
import * as fs from 'node:fs/promises';
import type {
  HeuristicAnalysisConfig,
  SlideAnalysisResult,
  VisualFeedback,
} from './visual-types';
import {
  VisualIssueType,
  IssueSeverity,
  DEFAULT_HEURISTIC_CONFIG,
} from './visual-types';

/**
 * Analyzes images using heuristic/programmatic methods
 */
export class HeuristicAnalyzer {
  private config: HeuristicAnalysisConfig;

  constructor(config?: Partial<HeuristicAnalysisConfig>) {
    this.config = { ...DEFAULT_HEURISTIC_CONFIG, ...config };
  }

  /**
   * Analyzes a single image
   *
   * @param imagePath - Path to the image file
   * @param slideIndex - Index of the slide (for carousels)
   * @returns Analysis result for the slide
   */
  async analyzeImage(
    imagePath: string,
    slideIndex: number = 0
  ): Promise<SlideAnalysisResult> {
    const issues: VisualFeedback[] = [];

    // Get file stats
    const stats = await fs.stat(imagePath);
    const fileSize = stats.size;

    // Get image metadata using sharp
    const metadata = await sharp(imagePath).metadata();

    const dimensions = {
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
    };

    const format = metadata.format ?? 'unknown';

    // Validate dimensions
    const dimensionIssues = this.validateDimensions(dimensions, slideIndex);
    issues.push(...dimensionIssues);

    // Validate file size
    const sizeIssues = this.validateFileSize(fileSize, slideIndex);
    issues.push(...sizeIssues);

    // Validate format
    const formatIssues = this.validateFormat(format, slideIndex);
    issues.push(...formatIssues);

    // Calculate scores
    const dimensionScore = this.calculateDimensionScore(dimensions);
    const fileSizeScore = this.calculateFileSizeScore(fileSize);
    const formatScore = this.config.allowedFormats.includes(format) ? 10 : 0;

    // Basic readability score (heuristic without OCR)
    const readabilityScore = Math.min(dimensionScore, fileSizeScore, formatScore);

    return {
      slideIndex,
      path: imagePath,
      dimensions,
      fileSize,
      format,
      hasCode: false, // Will be determined by CodeSlideAnalyzer
      contrastRatio: 0, // Will be calculated by ContrastAnalyzer
      readabilityScore,
      issues,
    };
  }

  /**
   * Analyzes multiple images (carousel)
   *
   * @param imagePaths - Array of image paths
   * @returns Array of analysis results
   */
  async analyzeMultiple(imagePaths: string[]): Promise<SlideAnalysisResult[]> {
    const results: SlideAnalysisResult[] = [];

    for (let i = 0; i < imagePaths.length; i++) {
      const result = await this.analyzeImage(imagePaths[i]!, i);
      results.push(result);
    }

    return results;
  }

  /**
   * Validates image dimensions against configuration
   */
  private validateDimensions(
    dimensions: { width: number; height: number },
    slideIndex: number
  ): VisualFeedback[] {
    const issues: VisualFeedback[] = [];
    const { width, height } = dimensions;
    const { minWidth, minHeight, maxWidth, maxHeight } = this.config;

    // Check minimum dimensions
    if (width < minWidth || height < minHeight) {
      issues.push({
        type: VisualIssueType.WRONG_DIMENSIONS,
        severity: IssueSeverity.ERROR,
        message: `Imagem muito pequena: ${width}x${height}px`,
        suggestion: `Redimensione para pelo menos ${minWidth}x${minHeight}px`,
        slideIndex,
      });
    }

    // Check maximum dimensions
    if (width > maxWidth || height > maxHeight) {
      issues.push({
        type: VisualIssueType.WRONG_DIMENSIONS,
        severity: IssueSeverity.WARNING,
        message: `Imagem muito grande: ${width}x${height}px`,
        suggestion: `Considere reduzir para no maximo ${maxWidth}x${maxHeight}px`,
        slideIndex,
      });
    }

    // Check aspect ratio for Instagram compatibility
    const aspectRatio = width / height;
    if (aspectRatio < 0.8 || aspectRatio > 1.91) {
      issues.push({
        type: VisualIssueType.WRONG_DIMENSIONS,
        severity: IssueSeverity.WARNING,
        message: `Aspect ratio ${aspectRatio.toFixed(2)} pode nao ser ideal para Instagram`,
        suggestion: 'Use aspect ratio entre 0.8 (4:5) e 1.91 (1.91:1) para melhor exibicao',
        slideIndex,
      });
    }

    return issues;
  }

  /**
   * Validates file size against configuration
   */
  private validateFileSize(fileSize: number, slideIndex: number): VisualFeedback[] {
    const issues: VisualFeedback[] = [];
    const { minFileSize, maxFileSize } = this.config;

    if (fileSize < minFileSize) {
      issues.push({
        type: VisualIssueType.FILE_TOO_SMALL,
        severity: IssueSeverity.WARNING,
        message: `Arquivo muito pequeno (${this.formatBytes(fileSize)})`,
        suggestion: 'Imagem pode estar com compressao excessiva. Verifique a qualidade.',
        slideIndex,
      });
    }

    if (fileSize > maxFileSize) {
      issues.push({
        type: VisualIssueType.FILE_TOO_LARGE,
        severity: IssueSeverity.ERROR,
        message: `Arquivo muito grande (${this.formatBytes(fileSize)})`,
        suggestion: `Reduza para menos de ${this.formatBytes(maxFileSize)}`,
        slideIndex,
      });
    }

    return issues;
  }

  /**
   * Validates image format against configuration
   */
  private validateFormat(format: string, slideIndex: number): VisualFeedback[] {
    const issues: VisualFeedback[] = [];

    if (!this.config.allowedFormats.includes(format)) {
      issues.push({
        type: VisualIssueType.INVALID_FORMAT,
        severity: IssueSeverity.ERROR,
        message: `Formato '${format}' nao suportado`,
        suggestion: `Use um dos formatos: ${this.config.allowedFormats.join(', ')}`,
        slideIndex,
      });
    }

    return issues;
  }

  /**
   * Calculates dimension score (0-10)
   */
  private calculateDimensionScore(dimensions: { width: number; height: number }): number {
    const { width, height } = dimensions;
    const { minWidth, minHeight, maxWidth, maxHeight } = this.config;

    // Penalize if smaller than minimum
    if (width < minWidth || height < minHeight) {
      const widthRatio = width / minWidth;
      const heightRatio = height / minHeight;
      return Math.max(0, Math.min(widthRatio, heightRatio) * 10);
    }

    // Slightly penalize if too large
    if (width > maxWidth || height > maxHeight) {
      return 8;
    }

    // Ideal: close to 1080x1080 for Instagram
    const targetSize = 1080;
    const widthDeviation = Math.abs(width - targetSize);
    const heightDeviation = Math.abs(height - targetSize);
    const totalDeviation = widthDeviation + heightDeviation;

    // Score decreases as deviation increases
    const deviationScore = Math.max(0, 10 - totalDeviation / 200);

    return Math.min(10, deviationScore);
  }

  /**
   * Calculates file size score (0-10)
   */
  private calculateFileSizeScore(fileSize: number): number {
    const { minFileSize, maxFileSize } = this.config;

    // Below minimum - penalize
    if (fileSize < minFileSize) {
      return (fileSize / minFileSize) * 6; // Max 6 if below minimum
    }

    // Above maximum - penalize
    if (fileSize > maxFileSize) {
      return 4;
    }

    // Ideal range: 100KB to 2MB
    const idealMin = 100000;
    const idealMax = 2000000;

    if (fileSize >= idealMin && fileSize <= idealMax) {
      return 10;
    }

    // Below ideal but above minimum
    if (fileSize < idealMin) {
      return 6 + ((fileSize - minFileSize) / (idealMin - minFileSize)) * 4;
    }

    // Above ideal but below maximum
    return 6 + ((maxFileSize - fileSize) / (maxFileSize - idealMax)) * 4;
  }

  /**
   * Formats bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  }

  /**
   * Gets the current configuration
   */
  getConfig(): HeuristicAnalysisConfig {
    return { ...this.config };
  }
}

/**
 * Factory function to create a HeuristicAnalyzer
 *
 * @param config - Optional configuration overrides
 * @returns Configured HeuristicAnalyzer instance
 */
export function createHeuristicAnalyzer(
  config?: Partial<HeuristicAnalysisConfig>
): HeuristicAnalyzer {
  return new HeuristicAnalyzer(config);
}
