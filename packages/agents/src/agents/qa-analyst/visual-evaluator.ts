/**
 * VisualEvaluator - Evaluates visual asset quality using heuristics
 */

import * as fs from 'fs';
import type { CriteriaScore, VisualAsset } from './types';
import { QACriterion } from './types';

/**
 * Default weights for visual criteria
 */
const DEFAULT_VISUAL_WEIGHTS = {
  [QACriterion.VISUAL_LEGIBILITY]: 0.4,
  [QACriterion.VISUAL_CONTRAST]: 0.3,
  [QACriterion.VISUAL_COMPOSITION]: 0.3,
};

/**
 * Image quality thresholds
 */
const IMAGE_QUALITY_THRESHOLDS = {
  minWidth: 1080,
  minHeight: 1080,
  minFileSize: 50 * 1024, // 50KB
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFormats: ['png', 'jpg', 'jpeg', 'webp'],
};

/**
 * Image dimensions interface
 */
interface ImageDimensions {
  width: number;
  height: number;
  type?: string;
}

/**
 * Simple image dimensions detection from file header
 * Supports PNG, JPEG, and WebP
 */
function getImageDimensions(filePath: string): ImageDimensions | null {
  try {
    const buffer = Buffer.alloc(30);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 30, 0);
    fs.closeSync(fd);

    // PNG
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return {
        width: buffer.readUInt32BE(16),
        height: buffer.readUInt32BE(20),
        type: 'png',
      };
    }

    // JPEG
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      // For JPEG, we need to scan through the file for the SOF marker
      const fileBuffer = fs.readFileSync(filePath);
      let offset = 2;

      while (offset < fileBuffer.length) {
        // Find marker
        if (fileBuffer[offset] !== 0xff) {
          offset++;
          continue;
        }

        const marker = fileBuffer[offset + 1];

        // SOF0, SOF1, SOF2 markers contain dimensions
        if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
          return {
            height: fileBuffer.readUInt16BE(offset + 5),
            width: fileBuffer.readUInt16BE(offset + 7),
            type: 'jpeg',
          };
        }

        // Skip to next marker
        const length = fileBuffer.readUInt16BE(offset + 2);
        offset += length + 2;
      }

      // Fallback dimensions for JPEG if parsing fails
      return { width: 1080, height: 1080, type: 'jpeg' };
    }

    // WebP (RIFF header)
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      // VP8 chunk - lossy
      if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x20) {
        const width = (buffer[26] | (buffer[27] << 8)) & 0x3fff;
        const height = (buffer[28] | (buffer[29] << 8)) & 0x3fff;
        return { width, height, type: 'webp' };
      }

      // VP8L chunk - lossless or VP8X - extended
      // Default to 1080x1080 for complex WebP formats
      return { width: 1080, height: 1080, type: 'webp' };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * VisualEvaluator class for evaluating visual asset quality
 */
export class VisualEvaluator {
  /**
   * Evaluate image legibility
   * Heuristics: adequate dimensions, correct format
   */
  async evaluateLegibility(asset: VisualAsset): Promise<CriteriaScore> {
    if (!fs.existsSync(asset.path)) {
      return {
        criterion: QACriterion.VISUAL_LEGIBILITY,
        score: 0,
        weight: DEFAULT_VISUAL_WEIGHTS[QACriterion.VISUAL_LEGIBILITY],
        feedback: `Arquivo nao encontrado: ${asset.path}`,
      };
    }

    const dimensions = getImageDimensions(asset.path);
    const stats = fs.statSync(asset.path);

    let score = 10.0;
    const issues: string[] = [];

    // Check dimensions
    if (dimensions) {
      if (dimensions.width < IMAGE_QUALITY_THRESHOLDS.minWidth) {
        score -= 3;
        issues.push(
          `Largura ${dimensions.width}px abaixo do minimo ${IMAGE_QUALITY_THRESHOLDS.minWidth}px`
        );
      }

      if (dimensions.height < IMAGE_QUALITY_THRESHOLDS.minHeight) {
        score -= 3;
        issues.push(
          `Altura ${dimensions.height}px abaixo do minimo ${IMAGE_QUALITY_THRESHOLDS.minHeight}px`
        );
      }
    } else {
      score -= 2;
      issues.push('Nao foi possivel determinar dimensoes da imagem');
    }

    // Check file size
    if (stats.size < IMAGE_QUALITY_THRESHOLDS.minFileSize) {
      score -= 2;
      issues.push('Arquivo muito pequeno - pode indicar baixa qualidade');
    }

    if (stats.size > IMAGE_QUALITY_THRESHOLDS.maxFileSize) {
      score -= 1;
      issues.push('Arquivo muito grande - pode afetar carregamento');
    }

    const width = dimensions?.width ?? 'N/A';
    const height = dimensions?.height ?? 'N/A';

    return {
      criterion: QACriterion.VISUAL_LEGIBILITY,
      score: Math.max(0, Number(score.toFixed(1))),
      weight: DEFAULT_VISUAL_WEIGHTS[QACriterion.VISUAL_LEGIBILITY],
      feedback: issues.length > 0 ? issues.join('; ') : undefined,
      details: `Dimensoes: ${width}x${height}, Tamanho: ${(stats.size / 1024).toFixed(0)}KB`,
    };
  }

  /**
   * Evaluate image contrast
   * Simplified heuristic based on format and size
   */
  async evaluateContrast(asset: VisualAsset): Promise<CriteriaScore> {
    if (!fs.existsSync(asset.path)) {
      return {
        criterion: QACriterion.VISUAL_CONTRAST,
        score: 0,
        weight: DEFAULT_VISUAL_WEIGHTS[QACriterion.VISUAL_CONTRAST],
        feedback: `Arquivo nao encontrado: ${asset.path}`,
      };
    }

    const ext = asset.path.split('.').pop()?.toLowerCase();

    // PNG generally has better contrast for text
    let score = 8.0;

    if (ext === 'png') {
      score = 9.0;
    } else if (ext === 'jpg' || ext === 'jpeg') {
      score = 7.5; // Compression may affect contrast
    } else if (ext === 'webp') {
      score = 8.5;
    }

    return {
      criterion: QACriterion.VISUAL_CONTRAST,
      score: Number(score.toFixed(1)),
      weight: DEFAULT_VISUAL_WEIGHTS[QACriterion.VISUAL_CONTRAST],
      details: `Formato ${ext?.toUpperCase()} detectado`,
    };
  }

  /**
   * Evaluate image composition
   * Heuristic based on aspect ratio
   */
  async evaluateComposition(asset: VisualAsset): Promise<CriteriaScore> {
    if (!fs.existsSync(asset.path)) {
      return {
        criterion: QACriterion.VISUAL_COMPOSITION,
        score: 0,
        weight: DEFAULT_VISUAL_WEIGHTS[QACriterion.VISUAL_COMPOSITION],
        feedback: `Arquivo nao encontrado: ${asset.path}`,
      };
    }

    const dimensions = getImageDimensions(asset.path);
    const width = dimensions?.width ?? 1;
    const height = dimensions?.height ?? 1;
    const ratio = width / height;

    let score = 8.0;
    let details = '';

    // Ideal aspect ratios for social media
    if (Math.abs(ratio - 1.0) < 0.01) {
      score = 10.0; // 1:1 perfect for Instagram
      details = 'Formato quadrado ideal para Instagram';
    } else if (Math.abs(ratio - 0.8) < 0.05) {
      score = 9.5; // 4:5 great for Instagram
      details = 'Formato 4:5 otimo para Instagram feed';
    } else if (Math.abs(ratio - 1.91) < 0.1) {
      score = 9.0; // 1.91:1 ideal for LinkedIn
      details = 'Formato panoramico bom para LinkedIn';
    } else if (ratio > 2 || ratio < 0.5) {
      score = 5.0;
      details = 'Aspect ratio extremo pode causar problemas de visualizacao';
    } else {
      details = `Aspect ratio ${ratio.toFixed(2)} aceitavel`;
    }

    return {
      criterion: QACriterion.VISUAL_COMPOSITION,
      score: Number(score.toFixed(1)),
      weight: DEFAULT_VISUAL_WEIGHTS[QACriterion.VISUAL_COMPOSITION],
      details,
    };
  }

  /**
   * Evaluate all visual criteria for a single asset
   */
  async evaluateAsset(asset: VisualAsset): Promise<CriteriaScore[]> {
    const [legibility, contrast, composition] = await Promise.all([
      this.evaluateLegibility(asset),
      this.evaluateContrast(asset),
      this.evaluateComposition(asset),
    ]);

    return [legibility, contrast, composition];
  }

  /**
   * Evaluate all assets and return average scores
   */
  async evaluateAll(assets: VisualAsset[]): Promise<CriteriaScore[]> {
    if (assets.length === 0) {
      // No visual assets - return neutral scores with zero weight
      return [
        {
          criterion: QACriterion.VISUAL_LEGIBILITY,
          score: 10.0,
          weight: 0,
          details: 'Nenhum asset visual para avaliar',
        },
        {
          criterion: QACriterion.VISUAL_CONTRAST,
          score: 10.0,
          weight: 0,
          details: 'Nenhum asset visual para avaliar',
        },
        {
          criterion: QACriterion.VISUAL_COMPOSITION,
          score: 10.0,
          weight: 0,
          details: 'Nenhum asset visual para avaliar',
        },
      ];
    }

    const allScores: CriteriaScore[][] = await Promise.all(
      assets.map((asset) => this.evaluateAsset(asset))
    );

    // Calculate average per criterion
    const avgScores: Map<QACriterion, CriteriaScore[]> = new Map();

    for (const scores of allScores) {
      for (const score of scores) {
        if (!avgScores.has(score.criterion)) {
          avgScores.set(score.criterion, []);
        }
        avgScores.get(score.criterion)!.push(score);
      }
    }

    return Array.from(avgScores.entries()).map(([criterion, scores]) => {
      const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
      const feedbacks = scores.filter((s) => s.feedback).map((s) => s.feedback!);

      return {
        criterion,
        score: Number(avgScore.toFixed(1)),
        weight: scores[0].weight,
        feedback: feedbacks.length > 0 ? feedbacks[0] : undefined,
        details: `Media de ${assets.length} asset(s)`,
      };
    });
  }
}

/**
 * Get default visual weights
 */
export function getDefaultVisualWeights(): typeof DEFAULT_VISUAL_WEIGHTS {
  return { ...DEFAULT_VISUAL_WEIGHTS };
}

/**
 * Get image quality thresholds
 */
export function getImageQualityThresholds(): typeof IMAGE_QUALITY_THRESHOLDS {
  return { ...IMAGE_QUALITY_THRESHOLDS };
}
