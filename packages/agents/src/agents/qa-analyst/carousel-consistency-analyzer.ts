/**
 * Carousel Consistency Analyzer
 * Story 4.3 - Agente QA Analyst - Analise de Imagens
 *
 * Analyzes visual consistency across carousel slides,
 * comparing color palettes, layouts, and typography.
 */

import sharp from 'sharp';
import type {
  SlideConsistencyResult,
  VisualFeedback,
  ColorInfo,
} from './visual-types';
import { VisualIssueType, IssueSeverity } from './visual-types';

/**
 * Configuration for consistency analysis
 */
export interface ConsistencyAnalyzerConfig {
  /** Minimum color palette match ratio (0-1) */
  minColorMatch: number;
  /** Minimum layout similarity ratio (0-1) */
  minLayoutSimilarity: number;
  /** Maximum allowed color deviation */
  maxColorDeviation: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ConsistencyAnalyzerConfig = {
  minColorMatch: 0.7,
  minLayoutSimilarity: 0.6,
  maxColorDeviation: 50,
};

/**
 * Extracted visual features from a slide
 */
interface SlideFeatures {
  /** Dominant colors */
  dominantColors: ColorInfo[];
  /** Average brightness */
  brightness: number;
  /** Color distribution (histogram) */
  colorHistogram: number[];
  /** Edge density (text/element density) */
  edgeDensity: number;
}

/**
 * Analyzes visual consistency across carousel slides
 */
export class CarouselConsistencyAnalyzer {
  private config: ConsistencyAnalyzerConfig;

  constructor(config?: Partial<ConsistencyAnalyzerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Analyzes consistency across multiple slides
   *
   * @param imagePaths - Paths to carousel slide images
   * @returns Consistency analysis result
   */
  async analyze(imagePaths: string[]): Promise<SlideConsistencyResult> {
    if (imagePaths.length < 2) {
      return {
        isConsistent: true,
        score: 10,
        colorPaletteMatch: 1,
        fontConsistency: 1,
        layoutConsistency: 1,
        inconsistentSlides: [],
        details: [],
      };
    }

    // Extract features from each slide
    const slideFeatures = await Promise.all(
      imagePaths.map(path => this.extractFeatures(path))
    );

    // Compare slides against the first one (reference)
    const referenceFeatures = slideFeatures[0]!;
    const inconsistentSlides: number[] = [];
    const details: string[] = [];

    // Calculate color palette match
    const colorMatches: number[] = [];
    for (let i = 1; i < slideFeatures.length; i++) {
      const match = this.compareColorPalettes(referenceFeatures, slideFeatures[i]!);
      colorMatches.push(match);

      if (match < this.config.minColorMatch) {
        inconsistentSlides.push(i);
        details.push(`Slide ${i + 1}: Paleta de cores difere ${((1 - match) * 100).toFixed(0)}% do slide de referencia`);
      }
    }
    const colorPaletteMatch = this.average(colorMatches);

    // Calculate brightness consistency
    const brightnessVariance = this.calculateVariance(
      slideFeatures.map(f => f.brightness)
    );
    const brightnessSimilarity = Math.max(0, 1 - brightnessVariance / 100);

    for (let i = 1; i < slideFeatures.length; i++) {
      const brightnessDiff = Math.abs(
        slideFeatures[i]!.brightness - referenceFeatures.brightness
      );
      if (brightnessDiff > 30) {
        if (!inconsistentSlides.includes(i)) {
          inconsistentSlides.push(i);
        }
        details.push(`Slide ${i + 1}: Brilho difere significativamente`);
      }
    }

    // Calculate layout consistency based on edge density
    const layoutMatches: number[] = [];
    for (let i = 1; i < slideFeatures.length; i++) {
      const match = this.compareLayouts(referenceFeatures, slideFeatures[i]!);
      layoutMatches.push(match);

      if (match < this.config.minLayoutSimilarity) {
        if (!inconsistentSlides.includes(i)) {
          inconsistentSlides.push(i);
        }
        details.push(`Slide ${i + 1}: Layout difere do padrao do carrossel`);
      }
    }
    const layoutConsistency = this.average(layoutMatches);

    // Font consistency is approximated through edge patterns
    // (actual font detection would require OCR)
    const fontConsistency = (colorPaletteMatch + layoutConsistency) / 2;

    // Calculate overall score
    const score = this.calculateConsistencyScore(
      colorPaletteMatch,
      brightnessSimilarity,
      layoutConsistency
    );

    return {
      isConsistent: inconsistentSlides.length === 0 && score >= 7,
      score,
      colorPaletteMatch,
      fontConsistency,
      layoutConsistency,
      inconsistentSlides: inconsistentSlides.sort(),
      details,
    };
  }

  /**
   * Extracts visual features from an image
   */
  private async extractFeatures(imagePath: string): Promise<SlideFeatures> {
    // Resize for faster processing
    const { data, info } = await sharp(imagePath)
      .resize(100, 100, { fit: 'cover' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const channels = info.channels;

    // Extract dominant colors
    const colorCounts = new Map<string, ColorInfo>();
    let totalBrightness = 0;
    const colorHistogram = new Array(8).fill(0);

    for (let i = 0; i < data.length; i += channels) {
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;

      // Quantize colors
      const rq = Math.round(r / 32) * 32;
      const gq = Math.round(g / 32) * 32;
      const bq = Math.round(b / 32) * 32;

      const key = `${rq},${gq},${bq}`;
      const existing = colorCounts.get(key);

      if (existing) {
        existing.frequency++;
      } else {
        colorCounts.set(key, { r: rq, g: gq, b: bq, frequency: 1 });
      }

      // Calculate brightness
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;

      // Build histogram (8 bins)
      const bin = Math.min(7, Math.floor(brightness / 32));
      colorHistogram[bin]!++;
    }

    // Get dominant colors (top 5)
    const dominantColors = Array.from(colorCounts.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    const pixelCount = data.length / channels;
    const brightness = totalBrightness / pixelCount;

    // Calculate edge density using Sobel-like approximation
    const edgeDensity = await this.calculateEdgeDensity(imagePath);

    return {
      dominantColors,
      brightness,
      colorHistogram,
      edgeDensity,
    };
  }

  /**
   * Calculates edge density (approximation of text/element density)
   */
  private async calculateEdgeDensity(imagePath: string): Promise<number> {
    // Use sharp's convolve for edge detection
    const { data, info } = await sharp(imagePath)
      .resize(50, 50, { fit: 'cover' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let edgeSum = 0;
    const width = info.width;
    const height = info.height;

    // Simple gradient-based edge detection
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const current = data[idx]!;
        const right = data[idx + 1]!;
        const bottom = data[idx + width]!;

        const gx = Math.abs(current - right);
        const gy = Math.abs(current - bottom);
        edgeSum += Math.sqrt(gx * gx + gy * gy);
      }
    }

    return edgeSum / ((width - 2) * (height - 2));
  }

  /**
   * Compares color palettes between two slides
   */
  private compareColorPalettes(
    ref: SlideFeatures,
    slide: SlideFeatures
  ): number {
    let matchScore = 0;
    const refColors = ref.dominantColors;
    const slideColors = slide.dominantColors;

    for (const refColor of refColors) {
      // Find closest matching color in slide
      let minDistance = Infinity;
      for (const slideColor of slideColors) {
        const distance = this.colorDistance(refColor, slideColor);
        minDistance = Math.min(minDistance, distance);
      }

      // Convert distance to similarity (0-1)
      const similarity = Math.max(0, 1 - minDistance / this.config.maxColorDeviation);
      matchScore += similarity * (refColor.frequency / this.totalFrequency(refColors));
    }

    return Math.min(1, matchScore);
  }

  /**
   * Compares layouts between two slides
   */
  private compareLayouts(ref: SlideFeatures, slide: SlideFeatures): number {
    // Compare histograms using cosine similarity
    const histogramSimilarity = this.cosineSimilarity(
      ref.colorHistogram,
      slide.colorHistogram
    );

    // Compare edge densities
    const maxEdgeDensity = Math.max(ref.edgeDensity, slide.edgeDensity);
    const edgeSimilarity = maxEdgeDensity > 0
      ? 1 - Math.abs(ref.edgeDensity - slide.edgeDensity) / maxEdgeDensity
      : 1;

    return (histogramSimilarity + edgeSimilarity) / 2;
  }

  /**
   * Calculates Euclidean color distance
   */
  private colorDistance(c1: ColorInfo, c2: ColorInfo): number {
    return Math.sqrt(
      Math.pow(c1.r - c2.r, 2) +
      Math.pow(c1.g - c2.g, 2) +
      Math.pow(c1.b - c2.b, 2)
    );
  }

  /**
   * Calculates total frequency of colors
   */
  private totalFrequency(colors: ColorInfo[]): number {
    return colors.reduce((sum, c) => sum + c.frequency, 0);
  }

  /**
   * Calculates cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i]! * b[i]!;
      normA += a[i]! * a[i]!;
      normB += b[i]! * b[i]!;
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator > 0 ? dotProduct / denominator : 0;
  }

  /**
   * Calculates variance of an array
   */
  private calculateVariance(values: number[]): number {
    const mean = this.average(values);
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return this.average(squaredDiffs);
  }

  /**
   * Calculates average of an array
   */
  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Calculates overall consistency score
   */
  private calculateConsistencyScore(
    colorMatch: number,
    brightnessSimilarity: number,
    layoutSimilarity: number
  ): number {
    // Weighted average
    const score = (
      colorMatch * 0.4 +
      brightnessSimilarity * 0.3 +
      layoutSimilarity * 0.3
    ) * 10;

    return Math.round(score * 10) / 10;
  }

  /**
   * Gets the current configuration
   */
  getConfig(): ConsistencyAnalyzerConfig {
    return { ...this.config };
  }
}

/**
 * Factory function to create a CarouselConsistencyAnalyzer
 *
 * @param config - Optional configuration overrides
 * @returns Configured CarouselConsistencyAnalyzer instance
 */
export function createCarouselConsistencyAnalyzer(
  config?: Partial<ConsistencyAnalyzerConfig>
): CarouselConsistencyAnalyzer {
  return new CarouselConsistencyAnalyzer(config);
}
