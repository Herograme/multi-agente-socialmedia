/**
 * Contrast Analyzer
 * Story 4.3 - Agente QA Analyst - Analise de Imagens
 *
 * Analyzes image contrast and readability using WCAG guidelines.
 * Extracts dominant colors and calculates contrast ratios.
 */

import sharp from 'sharp';
import type {
  VisualFeedback,
  ColorInfo,
  ContrastAnalysisResult,
} from './visual-types';
import { VisualIssueType, IssueSeverity } from './visual-types';

/**
 * WCAG contrast thresholds
 */
const WCAG_AA_THRESHOLD = 4.5;
const WCAG_AAA_THRESHOLD = 7.0;

/**
 * Analyzes contrast and readability of images
 */
export class ContrastAnalyzer {
  private minContrastRatio: number;

  constructor(minContrastRatio: number = WCAG_AA_THRESHOLD) {
    this.minContrastRatio = minContrastRatio;
  }

  /**
   * Analyzes contrast of an image
   *
   * @param imagePath - Path to the image file
   * @param slideIndex - Index of the slide (for carousels)
   * @returns Contrast analysis result
   */
  async analyzeContrast(
    imagePath: string,
    slideIndex: number = 0
  ): Promise<ContrastAnalysisResult> {
    const issues: VisualFeedback[] = [];

    // Extract dominant colors
    const dominantColors = await this.extractDominantColors(imagePath);

    // Need at least 2 colors to calculate contrast
    if (dominantColors.length < 2) {
      return {
        contrastRatio: 1,
        dominantColors,
        passesWCAG_AA: false,
        passesWCAG_AAA: false,
        issues: [{
          type: VisualIssueType.LOW_CONTRAST,
          severity: IssueSeverity.WARNING,
          message: 'Nao foi possivel determinar cores dominantes',
          suggestion: 'Verifique se a imagem tem variacao de cores suficiente',
          slideIndex,
        }],
        score: 5,
      };
    }

    // Calculate contrast between most frequent colors (likely background and text)
    const contrastRatio = this.calculateContrastRatio(
      dominantColors[0]!, // Most frequent (likely background)
      dominantColors[1]!  // Second most frequent (likely text)
    );

    // Check WCAG compliance
    const passesWCAG_AA = contrastRatio >= WCAG_AA_THRESHOLD;
    const passesWCAG_AAA = contrastRatio >= WCAG_AAA_THRESHOLD;

    // Generate issues based on contrast ratio
    if (!passesWCAG_AA) {
      issues.push({
        type: VisualIssueType.LOW_CONTRAST,
        severity: IssueSeverity.ERROR,
        message: `Contraste insuficiente: ${contrastRatio.toFixed(2)}:1 (minimo: ${WCAG_AA_THRESHOLD}:1)`,
        suggestion: 'Aumente o contraste entre texto e fundo. Use overlay mais escuro ou texto mais claro.',
        slideIndex,
      });
    } else if (!passesWCAG_AAA) {
      issues.push({
        type: VisualIssueType.LOW_CONTRAST,
        severity: IssueSeverity.WARNING,
        message: `Contraste pode ser melhorado: ${contrastRatio.toFixed(2)}:1`,
        suggestion: `Para acessibilidade ideal (WCAG AAA), use contraste de ${WCAG_AAA_THRESHOLD}:1 ou maior.`,
        slideIndex,
      });
    }

    // Calculate score
    const score = this.calculateContrastScore(contrastRatio);

    return {
      contrastRatio,
      dominantColors,
      passesWCAG_AA,
      passesWCAG_AAA,
      issues,
      score,
    };
  }

  /**
   * Extracts dominant colors from an image
   *
   * @param imagePath - Path to the image file
   * @returns Array of dominant colors sorted by frequency
   */
  private async extractDominantColors(imagePath: string): Promise<ColorInfo[]> {
    // Resize to speed up processing (100x100 is enough for color analysis)
    const { data, info } = await sharp(imagePath)
      .resize(100, 100, { fit: 'cover' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const colorCounts = new Map<string, ColorInfo>();

    // Count frequency of each color (grouped by buckets)
    const channels = info.channels;
    for (let i = 0; i < data.length; i += channels) {
      // Quantize to reduce color space (bucket by 16)
      const r = Math.round(data[i]! / 16) * 16;
      const g = Math.round(data[i + 1]! / 16) * 16;
      const b = Math.round(data[i + 2]! / 16) * 16;

      const key = `${r},${g},${b}`;
      const existing = colorCounts.get(key);

      if (existing) {
        existing.frequency++;
      } else {
        colorCounts.set(key, { r, g, b, frequency: 1 });
      }
    }

    // Sort by frequency and return top 5
    return Array.from(colorCounts.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
  }

  /**
   * Calculates WCAG contrast ratio between two colors
   *
   * @param color1 - First color
   * @param color2 - Second color
   * @returns Contrast ratio (1-21)
   */
  private calculateContrastRatio(color1: ColorInfo, color2: ColorInfo): number {
    const lum1 = this.calculateLuminance(color1);
    const lum2 = this.calculateLuminance(color2);

    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Calculates relative luminance per WCAG formula
   *
   * @param color - Color to calculate luminance for
   * @returns Relative luminance (0-1)
   */
  private calculateLuminance(color: ColorInfo): number {
    const normalize = (value: number): number => {
      const sRGB = value / 255;
      return sRGB <= 0.03928
        ? sRGB / 12.92
        : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    };

    const r = normalize(color.r);
    const g = normalize(color.g);
    const b = normalize(color.b);

    // WCAG luminance formula
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Calculates contrast score (0-10)
   *
   * Score mapping:
   * - 21:1 = score 10 (maximum theoretical contrast)
   * - 7:1 = score 8 (WCAG AAA)
   * - 4.5:1 = score 6 (WCAG AA)
   * - 3:1 = score 4
   * - 1:1 = score 0
   */
  private calculateContrastScore(contrastRatio: number): number {
    if (contrastRatio >= 21) return 10;
    if (contrastRatio >= 7) return 8 + ((contrastRatio - 7) / 14) * 2;
    if (contrastRatio >= 4.5) return 6 + ((contrastRatio - 4.5) / 2.5) * 2;
    if (contrastRatio >= 3) return 4 + ((contrastRatio - 3) / 1.5) * 2;
    return Math.max(0, (contrastRatio - 1) / 2 * 4);
  }

  /**
   * Gets a readable description of contrast level
   */
  getContrastDescription(contrastRatio: number): string {
    if (contrastRatio >= 7) return 'Excelente (WCAG AAA)';
    if (contrastRatio >= 4.5) return 'Bom (WCAG AA)';
    if (contrastRatio >= 3) return 'Marginal';
    return 'Insuficiente';
  }

  /**
   * Converts color to hex string
   */
  colorToHex(color: ColorInfo): string {
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  }
}

/**
 * Factory function to create a ContrastAnalyzer
 *
 * @param minContrastRatio - Minimum acceptable contrast ratio
 * @returns Configured ContrastAnalyzer instance
 */
export function createContrastAnalyzer(
  minContrastRatio?: number
): ContrastAnalyzer {
  return new ContrastAnalyzer(minContrastRatio);
}
