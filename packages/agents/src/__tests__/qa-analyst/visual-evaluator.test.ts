/**
 * VisualEvaluator Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  VisualEvaluator,
  getDefaultVisualWeights,
  getImageQualityThresholds,
} from '../../agents/qa-analyst/visual-evaluator';
import { QACriterion } from '../../agents/qa-analyst/types';
import type { VisualAsset } from '../../agents/qa-analyst/types';

// Create a test PNG image buffer
function createTestPNG(width: number, height: number): Buffer {
  // PNG header
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrLength = Buffer.alloc(4);
  ihdrLength.writeUInt32BE(13, 0);

  const ihdrType = Buffer.from('IHDR');

  // Create a simple CRC (for test purposes, not cryptographically valid)
  const ihdrCrc = Buffer.alloc(4);

  // IEND chunk
  const iendLength = Buffer.alloc(4);
  iendLength.writeUInt32BE(0, 0);
  const iendType = Buffer.from('IEND');
  const iendCrc = Buffer.alloc(4);

  // Add some padding to meet minimum file size
  const padding = Buffer.alloc(60000);

  return Buffer.concat([
    signature,
    ihdrLength,
    ihdrType,
    ihdrData,
    ihdrCrc,
    iendLength,
    iendType,
    iendCrc,
    padding,
  ]);
}

// Create a test JPEG image buffer
function createTestJPEG(width: number, height: number): Buffer {
  // JPEG header with SOI marker
  const soi = Buffer.from([0xff, 0xd8, 0xff]);

  // APP0 marker
  const app0 = Buffer.from([
    0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
    0x00,
  ]);

  // SOF0 marker with dimensions
  const sof0Header = Buffer.from([0xff, 0xc0, 0x00, 0x0b, 0x08]);
  const heightBytes = Buffer.alloc(2);
  heightBytes.writeUInt16BE(height, 0);
  const widthBytes = Buffer.alloc(2);
  widthBytes.writeUInt16BE(width, 0);
  const sof0Trailer = Buffer.from([0x01, 0x01, 0x11, 0x00]);

  // EOI marker
  const eoi = Buffer.from([0xff, 0xd9]);

  // Add padding for file size
  const padding = Buffer.alloc(60000);

  return Buffer.concat([soi, app0, sof0Header, heightBytes, widthBytes, sof0Trailer, padding, eoi]);
}

describe('VisualEvaluator', () => {
  let evaluator: VisualEvaluator;
  let testDir: string;

  beforeEach(() => {
    evaluator = new VisualEvaluator();
    testDir = `/tmp/visual-evaluator-test-${Date.now()}`;
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  describe('evaluateLegibility', () => {
    it('should return 0 for non-existent file', async () => {
      const asset: VisualAsset = {
        path: '/nonexistent/image.png',
        type: 'image',
      };

      const result = await evaluator.evaluateLegibility(asset);

      expect(result.criterion).toBe(QACriterion.VISUAL_LEGIBILITY);
      expect(result.score).toBe(0);
      expect(result.feedback).toContain('nao encontrado');
    });

    it('should return high score for valid PNG with good dimensions', async () => {
      const imagePath = path.join(testDir, 'good-image.png');
      const pngBuffer = createTestPNG(1080, 1080);
      fs.writeFileSync(imagePath, pngBuffer);

      const asset: VisualAsset = {
        path: imagePath,
        type: 'image',
      };

      const result = await evaluator.evaluateLegibility(asset);

      expect(result.criterion).toBe(QACriterion.VISUAL_LEGIBILITY);
      expect(result.score).toBeGreaterThanOrEqual(8);
      expect(result.details).toContain('1080x1080');
    });

    it('should penalize small dimensions', async () => {
      const imagePath = path.join(testDir, 'small-image.png');
      const pngBuffer = createTestPNG(500, 500);
      fs.writeFileSync(imagePath, pngBuffer);

      const asset: VisualAsset = {
        path: imagePath,
        type: 'image',
      };

      const result = await evaluator.evaluateLegibility(asset);

      expect(result.score).toBeLessThan(10);
      expect(result.feedback).toContain('abaixo do minimo');
    });

    it('should penalize small files', async () => {
      const imagePath = path.join(testDir, 'tiny-file.png');
      // Create a very small PNG
      const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const ihdrData = Buffer.alloc(21);
      ihdrData.writeUInt32BE(13, 0);
      ihdrData.set(Buffer.from('IHDR'), 4);
      ihdrData.writeUInt32BE(1080, 8);
      ihdrData.writeUInt32BE(1080, 12);
      fs.writeFileSync(imagePath, Buffer.concat([signature, ihdrData]));

      const asset: VisualAsset = {
        path: imagePath,
        type: 'image',
      };

      const result = await evaluator.evaluateLegibility(asset);

      expect(result.score).toBeLessThan(10);
      expect(result.feedback).toContain('muito pequeno');
    });
  });

  describe('evaluateContrast', () => {
    it('should return 0 for non-existent file', async () => {
      const asset: VisualAsset = {
        path: '/nonexistent/image.png',
        type: 'image',
      };

      const result = await evaluator.evaluateContrast(asset);

      expect(result.criterion).toBe(QACriterion.VISUAL_CONTRAST);
      expect(result.score).toBe(0);
      expect(result.feedback).toContain('nao encontrado');
    });

    it('should give high score for PNG format', async () => {
      const imagePath = path.join(testDir, 'image.png');
      fs.writeFileSync(imagePath, createTestPNG(1080, 1080));

      const asset: VisualAsset = {
        path: imagePath,
        type: 'image',
      };

      const result = await evaluator.evaluateContrast(asset);

      expect(result.criterion).toBe(QACriterion.VISUAL_CONTRAST);
      expect(result.score).toBe(9.0);
      expect(result.details).toContain('PNG');
    });

    it('should give lower score for JPEG format', async () => {
      const imagePath = path.join(testDir, 'image.jpg');
      fs.writeFileSync(imagePath, createTestJPEG(1080, 1080));

      const asset: VisualAsset = {
        path: imagePath,
        type: 'image',
      };

      const result = await evaluator.evaluateContrast(asset);

      expect(result.score).toBe(7.5);
      expect(result.details).toContain('JPG');
    });

    it('should give medium-high score for WebP format', async () => {
      const imagePath = path.join(testDir, 'image.webp');
      // Create a simple WebP header
      const webp = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00, // file size
        0x57, 0x45, 0x42, 0x50, // WEBP
        0x56, 0x50, 0x38, 0x20, // VP8
      ]);
      const padding = Buffer.alloc(60000);
      fs.writeFileSync(imagePath, Buffer.concat([webp, padding]));

      const asset: VisualAsset = {
        path: imagePath,
        type: 'image',
      };

      const result = await evaluator.evaluateContrast(asset);

      expect(result.score).toBe(8.5);
    });
  });

  describe('evaluateComposition', () => {
    it('should return 0 for non-existent file', async () => {
      const asset: VisualAsset = {
        path: '/nonexistent/image.png',
        type: 'image',
      };

      const result = await evaluator.evaluateComposition(asset);

      expect(result.criterion).toBe(QACriterion.VISUAL_COMPOSITION);
      expect(result.score).toBe(0);
      expect(result.feedback).toContain('nao encontrado');
    });

    it('should give perfect score for 1:1 square images', async () => {
      const imagePath = path.join(testDir, 'square.png');
      fs.writeFileSync(imagePath, createTestPNG(1080, 1080));

      const asset: VisualAsset = {
        path: imagePath,
        type: 'image',
      };

      const result = await evaluator.evaluateComposition(asset);

      expect(result.criterion).toBe(QACriterion.VISUAL_COMPOSITION);
      expect(result.score).toBe(10.0);
      expect(result.details).toContain('quadrado');
    });

    it('should give high score for 4:5 portrait images', async () => {
      const imagePath = path.join(testDir, 'portrait.png');
      fs.writeFileSync(imagePath, createTestPNG(1080, 1350)); // 4:5 ratio

      const asset: VisualAsset = {
        path: imagePath,
        type: 'image',
      };

      const result = await evaluator.evaluateComposition(asset);

      expect(result.score).toBeGreaterThanOrEqual(9.0);
      expect(result.details).toContain('4:5');
    });

    it('should penalize extreme aspect ratios', async () => {
      const imagePath = path.join(testDir, 'extreme.png');
      fs.writeFileSync(imagePath, createTestPNG(3000, 500)); // Very wide

      const asset: VisualAsset = {
        path: imagePath,
        type: 'image',
      };

      const result = await evaluator.evaluateComposition(asset);

      expect(result.score).toBeLessThanOrEqual(5.0);
      expect(result.details).toContain('extremo');
    });
  });

  describe('evaluateAsset', () => {
    it('should evaluate all three visual criteria for a single asset', async () => {
      const imagePath = path.join(testDir, 'complete.png');
      fs.writeFileSync(imagePath, createTestPNG(1080, 1080));

      const asset: VisualAsset = {
        path: imagePath,
        type: 'image',
      };

      const results = await evaluator.evaluateAsset(asset);

      expect(results).toHaveLength(3);
      expect(results.map((r) => r.criterion)).toContain(QACriterion.VISUAL_LEGIBILITY);
      expect(results.map((r) => r.criterion)).toContain(QACriterion.VISUAL_CONTRAST);
      expect(results.map((r) => r.criterion)).toContain(QACriterion.VISUAL_COMPOSITION);
    });
  });

  describe('evaluateAll', () => {
    it('should return neutral scores with zero weight for empty assets', async () => {
      const results = await evaluator.evaluateAll([]);

      expect(results).toHaveLength(3);
      results.forEach((r) => {
        expect(r.score).toBe(10.0);
        expect(r.weight).toBe(0);
        expect(r.details).toContain('Nenhum asset visual');
      });
    });

    it('should evaluate multiple assets and return averaged scores', async () => {
      const imagePath1 = path.join(testDir, 'image1.png');
      const imagePath2 = path.join(testDir, 'image2.png');
      fs.writeFileSync(imagePath1, createTestPNG(1080, 1080));
      fs.writeFileSync(imagePath2, createTestPNG(1080, 1080));

      const assets: VisualAsset[] = [
        { path: imagePath1, type: 'image' },
        { path: imagePath2, type: 'image' },
      ];

      const results = await evaluator.evaluateAll(assets);

      expect(results).toHaveLength(3);
      results.forEach((r) => {
        expect(r.details).toContain('2 asset(s)');
      });
    });

    it('should handle mixed valid and invalid assets', async () => {
      const validPath = path.join(testDir, 'valid.png');
      fs.writeFileSync(validPath, createTestPNG(1080, 1080));

      const assets: VisualAsset[] = [
        { path: validPath, type: 'image' },
        { path: '/nonexistent/invalid.png', type: 'image' },
      ];

      const results = await evaluator.evaluateAll(assets);

      expect(results).toHaveLength(3);
      // Scores should be averaged, so lower than if all were valid
      const legibilityScore = results.find(
        (r) => r.criterion === QACriterion.VISUAL_LEGIBILITY
      )?.score;
      expect(legibilityScore).toBeLessThan(10);
    });
  });

  describe('getDefaultVisualWeights', () => {
    it('should return default visual weights', () => {
      const weights = getDefaultVisualWeights();

      expect(weights[QACriterion.VISUAL_LEGIBILITY]).toBe(0.4);
      expect(weights[QACriterion.VISUAL_CONTRAST]).toBe(0.3);
      expect(weights[QACriterion.VISUAL_COMPOSITION]).toBe(0.3);
    });

    it('should return a copy, not the original', () => {
      const weights1 = getDefaultVisualWeights();
      const weights2 = getDefaultVisualWeights();
      weights1[QACriterion.VISUAL_LEGIBILITY] = 0.8;
      expect(weights2[QACriterion.VISUAL_LEGIBILITY]).toBe(0.4);
    });
  });

  describe('getImageQualityThresholds', () => {
    it('should return image quality thresholds', () => {
      const thresholds = getImageQualityThresholds();

      expect(thresholds.minWidth).toBe(1080);
      expect(thresholds.minHeight).toBe(1080);
      expect(thresholds.minFileSize).toBe(50 * 1024);
      expect(thresholds.maxFileSize).toBe(10 * 1024 * 1024);
      expect(thresholds.allowedFormats).toContain('png');
      expect(thresholds.allowedFormats).toContain('jpg');
      expect(thresholds.allowedFormats).toContain('webp');
    });

    it('should return a copy, not the original', () => {
      const thresholds1 = getImageQualityThresholds();
      const thresholds2 = getImageQualityThresholds();
      thresholds1.minWidth = 2000;
      expect(thresholds2.minWidth).toBe(1080);
    });
  });
});
