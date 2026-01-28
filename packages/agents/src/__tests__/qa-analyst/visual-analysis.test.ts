/**
 * QA Analyst Visual Analysis Tests
 * Story 4.3 - Agente QA Analyst - Analise de Imagens
 *
 * Comprehensive tests for visual analysis functionality including
 * heuristic analyzer, contrast analyzer, code slide analyzer,
 * carousel consistency analyzer, and multimodal analyzer.
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import sharp from 'sharp';
import {
  HeuristicAnalyzer,
  createHeuristicAnalyzer,
  ContrastAnalyzer,
  createContrastAnalyzer,
  CodeSlideAnalyzer,
  createCodeSlideAnalyzer,
  CarouselConsistencyAnalyzer,
  createCarouselConsistencyAnalyzer,
  MultimodalAnalyzer,
  createMultimodalAnalyzer,
  QAAnalystAgent,
  createQAAnalystAgent,
  VisualIssueType,
  IssueSeverity,
  DEFAULT_HEURISTIC_CONFIG,
  DEFAULT_QA_VISUAL_CONFIG,
} from '../../agents/qa-analyst';
import type {
  MultimodalAnalysisConfig,
  HeuristicAnalysisConfig,
} from '../../agents/qa-analyst';

// Test fixtures directory
const fixturesDir = path.join(process.cwd(), 'src/__tests__/qa-analyst/fixtures');

/**
 * Helper to create test images with sharp
 */
async function createTestImage(
  filePath: string,
  options: {
    width: number;
    height: number;
    background: { r: number; g: number; b: number };
    overlay?: { r: number; g: number; b: number; width: number; left: number };
  }
): Promise<void> {
  let image = sharp({
    create: {
      width: options.width,
      height: options.height,
      channels: 3,
      background: options.background,
    },
  });

  if (options.overlay) {
    const overlayBuffer = await sharp({
      create: {
        width: options.overlay.width,
        height: options.height,
        channels: 3,
        background: {
          r: options.overlay.r,
          g: options.overlay.g,
          b: options.overlay.b,
        },
      },
    })
      .png()
      .toBuffer();

    image = image.composite([
      {
        input: overlayBuffer,
        left: options.overlay.left,
        top: 0,
      },
    ]);
  }

  await image.png().toFile(filePath);
}

describe('HeuristicAnalyzer', () => {
  const goodImagePath = path.join(fixturesDir, 'good-slide.png');
  const smallImagePath = path.join(fixturesDir, 'small-slide.png');
  const largeImagePath = path.join(fixturesDir, 'large-slide.png');

  beforeAll(async () => {
    await fs.mkdir(fixturesDir, { recursive: true });

    // Create good image (1080x1080)
    await createTestImage(goodImagePath, {
      width: 1080,
      height: 1080,
      background: { r: 30, g: 30, b: 50 },
    });

    // Create small image (500x500)
    await createTestImage(smallImagePath, {
      width: 500,
      height: 500,
      background: { r: 30, g: 30, b: 50 },
    });

    // Create large image (5000x5000)
    await createTestImage(largeImagePath, {
      width: 5000,
      height: 5000,
      background: { r: 30, g: 30, b: 50 },
    });
  });

  afterAll(async () => {
    await fs.rm(fixturesDir, { recursive: true, force: true });
  });

  describe('analyzeImage', () => {
    it('should pass for good quality image', async () => {
      const analyzer = createHeuristicAnalyzer();
      const result = await analyzer.analyzeImage(goodImagePath);

      expect(result.dimensions.width).toBe(1080);
      expect(result.dimensions.height).toBe(1080);
      expect(result.format).toBe('png');
      expect(
        result.issues.filter((i) => i.severity === IssueSeverity.ERROR)
      ).toHaveLength(0);
    });

    it('should detect small dimensions', async () => {
      const analyzer = createHeuristicAnalyzer();
      const result = await analyzer.analyzeImage(smallImagePath);

      const dimensionIssue = result.issues.find(
        (i) => i.type === VisualIssueType.WRONG_DIMENSIONS
      );
      expect(dimensionIssue).toBeDefined();
      expect(dimensionIssue?.severity).toBe(IssueSeverity.ERROR);
      expect(dimensionIssue?.message).toContain('500x500');
    });

    it('should warn about large dimensions', async () => {
      const analyzer = createHeuristicAnalyzer();
      const result = await analyzer.analyzeImage(largeImagePath);

      const dimensionIssue = result.issues.find(
        (i) => i.type === VisualIssueType.WRONG_DIMENSIONS
      );
      expect(dimensionIssue).toBeDefined();
      expect(dimensionIssue?.severity).toBe(IssueSeverity.WARNING);
    });

    it('should calculate readability score', async () => {
      const analyzer = createHeuristicAnalyzer();
      const result = await analyzer.analyzeImage(goodImagePath);

      expect(result.readabilityScore).toBeGreaterThanOrEqual(0);
      expect(result.readabilityScore).toBeLessThanOrEqual(10);
    });

    it('should set correct slide index', async () => {
      const analyzer = createHeuristicAnalyzer();
      const result = await analyzer.analyzeImage(goodImagePath, 5);

      expect(result.slideIndex).toBe(5);
    });
  });

  describe('analyzeMultiple', () => {
    it('should analyze carousel images', async () => {
      const analyzer = createHeuristicAnalyzer();
      const results = await analyzer.analyzeMultiple([goodImagePath, goodImagePath]);

      expect(results).toHaveLength(2);
      expect(results[0]!.slideIndex).toBe(0);
      expect(results[1]!.slideIndex).toBe(1);
    });

    it('should handle empty array', async () => {
      const analyzer = createHeuristicAnalyzer();
      const results = await analyzer.analyzeMultiple([]);

      expect(results).toHaveLength(0);
    });
  });

  describe('custom config', () => {
    it('should use custom min dimensions', async () => {
      const analyzer = createHeuristicAnalyzer({
        minWidth: 2000,
        minHeight: 2000,
      });
      const result = await analyzer.analyzeImage(goodImagePath);

      const dimensionIssue = result.issues.find(
        (i) => i.type === VisualIssueType.WRONG_DIMENSIONS
      );
      expect(dimensionIssue).toBeDefined();
    });

    it('should return config via getConfig', () => {
      const customConfig: Partial<HeuristicAnalysisConfig> = {
        minWidth: 800,
        minHeight: 800,
      };
      const analyzer = createHeuristicAnalyzer(customConfig);
      const config = analyzer.getConfig();

      expect(config.minWidth).toBe(800);
      expect(config.minHeight).toBe(800);
      expect(config.maxWidth).toBe(DEFAULT_HEURISTIC_CONFIG.maxWidth);
    });
  });
});

describe('ContrastAnalyzer', () => {
  const highContrastPath = path.join(fixturesDir, 'high-contrast.png');
  const lowContrastPath = path.join(fixturesDir, 'low-contrast.png');

  beforeAll(async () => {
    await fs.mkdir(fixturesDir, { recursive: true });

    // High contrast image (black and white)
    await createTestImage(highContrastPath, {
      width: 100,
      height: 100,
      background: { r: 0, g: 0, b: 0 },
      overlay: { r: 255, g: 255, b: 255, width: 50, left: 50 },
    });

    // Low contrast image (similar grays)
    await createTestImage(lowContrastPath, {
      width: 100,
      height: 100,
      background: { r: 100, g: 100, b: 100 },
      overlay: { r: 120, g: 120, b: 120, width: 50, left: 50 },
    });
  });

  afterAll(async () => {
    await fs.rm(fixturesDir, { recursive: true, force: true });
  });

  describe('analyzeContrast', () => {
    it('should detect high contrast', async () => {
      const analyzer = createContrastAnalyzer();
      const result = await analyzer.analyzeContrast(highContrastPath);

      expect(result.contrastRatio).toBeGreaterThan(10);
      expect(result.passesWCAG_AA).toBe(true);
      expect(result.passesWCAG_AAA).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(8);
    });

    it('should detect low contrast', async () => {
      const analyzer = createContrastAnalyzer();
      const result = await analyzer.analyzeContrast(lowContrastPath);

      expect(result.contrastRatio).toBeLessThan(4.5);
      expect(result.passesWCAG_AA).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]!.type).toBe(VisualIssueType.LOW_CONTRAST);
    });

    it('should return dominant colors', async () => {
      const analyzer = createContrastAnalyzer();
      const result = await analyzer.analyzeContrast(highContrastPath);

      expect(result.dominantColors.length).toBeGreaterThan(0);
      expect(result.dominantColors[0]).toHaveProperty('r');
      expect(result.dominantColors[0]).toHaveProperty('g');
      expect(result.dominantColors[0]).toHaveProperty('b');
      expect(result.dominantColors[0]).toHaveProperty('frequency');
    });

    it('should set correct slide index', async () => {
      const analyzer = createContrastAnalyzer();
      const result = await analyzer.analyzeContrast(highContrastPath, 3);

      expect(result.issues.every((i) => i.slideIndex === 3 || i.slideIndex === undefined)).toBe(
        true
      );
    });
  });

  describe('utility methods', () => {
    it('should provide contrast description', () => {
      const analyzer = createContrastAnalyzer();

      expect(analyzer.getContrastDescription(8)).toBe('Excelente (WCAG AAA)');
      expect(analyzer.getContrastDescription(5)).toBe('Bom (WCAG AA)');
      expect(analyzer.getContrastDescription(3.5)).toBe('Marginal');
      expect(analyzer.getContrastDescription(2)).toBe('Insuficiente');
    });

    it('should convert color to hex', () => {
      const analyzer = createContrastAnalyzer();
      const hex = analyzer.colorToHex({ r: 255, g: 128, b: 0, frequency: 100 });

      expect(hex).toBe('#ff8000');
    });
  });
});

describe('CodeSlideAnalyzer', () => {
  const codeImagePath = path.join(fixturesDir, 'code-slide.png');
  const normalImagePath = path.join(fixturesDir, 'normal-slide.png');

  beforeAll(async () => {
    await fs.mkdir(fixturesDir, { recursive: true });

    // Create a dark code-like image
    await createTestImage(codeImagePath, {
      width: 1080,
      height: 1080,
      background: { r: 30, g: 30, b: 45 },
      overlay: { r: 100, g: 150, b: 200, width: 200, left: 100 },
    });

    // Create normal bright image
    await createTestImage(normalImagePath, {
      width: 1080,
      height: 1080,
      background: { r: 240, g: 240, b: 240 },
    });
  });

  afterAll(async () => {
    await fs.rm(fixturesDir, { recursive: true, force: true });
  });

  describe('analyzeCodeSlide', () => {
    it('should analyze slide without code metadata', async () => {
      const analyzer = createCodeSlideAnalyzer();
      const result = await analyzer.analyzeCodeSlide(normalImagePath, 0, false);

      expect(result.hasCode).toBe(false);
      expect(result.score).toBe(10);
      expect(result.issues).toHaveLength(0);
    });

    it('should analyze slide with code metadata', async () => {
      const analyzer = createCodeSlideAnalyzer();
      const result = await analyzer.analyzeCodeSlide(codeImagePath, 0, true);

      expect(result.hasCode).toBe(true);
      expect(result.score).toBeLessThanOrEqual(10);
    });

    it('should return proper structure', async () => {
      const analyzer = createCodeSlideAnalyzer();
      const result = await analyzer.analyzeCodeSlide(codeImagePath, 2, true);

      expect(result).toHaveProperty('hasCode');
      expect(result).toHaveProperty('hasSyntaxHighlighting');
      expect(result).toHaveProperty('fontSizeAdequate');
      expect(result).toHaveProperty('hasOverflow');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('issues');
    });
  });

  describe('configuration', () => {
    it('should use custom config', () => {
      const analyzer = createCodeSlideAnalyzer({
        maxLinesPerSlide: 10,
        requireSyntaxHighlight: false,
      });
      const config = analyzer.getConfig();

      expect(config.maxLinesPerSlide).toBe(10);
      expect(config.requireSyntaxHighlight).toBe(false);
    });
  });
});

describe('CarouselConsistencyAnalyzer', () => {
  const slide1Path = path.join(fixturesDir, 'carousel-1.png');
  const slide2Path = path.join(fixturesDir, 'carousel-2.png');
  const slide3DiffPath = path.join(fixturesDir, 'carousel-3-diff.png');

  beforeAll(async () => {
    await fs.mkdir(fixturesDir, { recursive: true });

    // Create consistent slides (same colors)
    await createTestImage(slide1Path, {
      width: 1080,
      height: 1080,
      background: { r: 30, g: 30, b: 50 },
    });

    await createTestImage(slide2Path, {
      width: 1080,
      height: 1080,
      background: { r: 35, g: 32, b: 52 },
    });

    // Create inconsistent slide (different colors)
    await createTestImage(slide3DiffPath, {
      width: 1080,
      height: 1080,
      background: { r: 200, g: 100, b: 50 },
    });
  });

  afterAll(async () => {
    await fs.rm(fixturesDir, { recursive: true, force: true });
  });

  describe('analyze', () => {
    it('should return consistent for single slide', async () => {
      const analyzer = createCarouselConsistencyAnalyzer();
      const result = await analyzer.analyze([slide1Path]);

      expect(result.isConsistent).toBe(true);
      expect(result.score).toBe(10);
      expect(result.inconsistentSlides).toHaveLength(0);
    });

    it('should detect consistent carousel', async () => {
      const analyzer = createCarouselConsistencyAnalyzer();
      const result = await analyzer.analyze([slide1Path, slide2Path]);

      expect(result.colorPaletteMatch).toBeGreaterThan(0.5);
      expect(result.score).toBeGreaterThan(5);
    });

    it('should detect inconsistent slides', async () => {
      const analyzer = createCarouselConsistencyAnalyzer();
      const result = await analyzer.analyze([slide1Path, slide2Path, slide3DiffPath]);

      expect(result.inconsistentSlides.length).toBeGreaterThan(0);
      expect(result.details.length).toBeGreaterThan(0);
    });

    it('should return proper structure', async () => {
      const analyzer = createCarouselConsistencyAnalyzer();
      const result = await analyzer.analyze([slide1Path, slide2Path]);

      expect(result).toHaveProperty('isConsistent');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('colorPaletteMatch');
      expect(result).toHaveProperty('fontConsistency');
      expect(result).toHaveProperty('layoutConsistency');
      expect(result).toHaveProperty('inconsistentSlides');
      expect(result).toHaveProperty('details');
    });
  });

  describe('configuration', () => {
    it('should use custom config', () => {
      const analyzer = createCarouselConsistencyAnalyzer({
        minColorMatch: 0.9,
      });
      const config = analyzer.getConfig();

      expect(config.minColorMatch).toBe(0.9);
    });
  });
});

describe('MultimodalAnalyzer', () => {
  const mockConfig: MultimodalAnalysisConfig = {
    provider: 'gemini',
    apiKey: 'test-api-key',
    model: 'gemini-pro-vision',
    maxTokens: 1000,
    temperature: 0.3,
    rateLimitPerMinute: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isAvailable', () => {
    it('should return false without API key', async () => {
      const analyzer = createMultimodalAnalyzer({ ...mockConfig, apiKey: '' });
      const available = await analyzer.isAvailable();

      expect(available).toBe(false);
    });

    it('should return true with API key', async () => {
      const analyzer = createMultimodalAnalyzer(mockConfig);
      const available = await analyzer.isAvailable();

      expect(available).toBe(true);
    });
  });

  describe('cache', () => {
    it('should start with empty cache', () => {
      const analyzer = createMultimodalAnalyzer(mockConfig);

      expect(analyzer.getCacheSize()).toBe(0);
    });

    it('should clear cache', () => {
      const analyzer = createMultimodalAnalyzer(mockConfig);
      analyzer.clearCache();

      expect(analyzer.getCacheSize()).toBe(0);
    });
  });

  describe('analyze (mocked)', () => {
    it('should handle API errors', async () => {
      const analyzer = createMultimodalAnalyzer(mockConfig);

      // Mock fetch to return error
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        text: async () => 'API Error',
      });

      await expect(
        analyzer.analyze(['/fake/path.png'], 'post-123', false)
      ).rejects.toThrow();

      global.fetch = originalFetch;
    });
  });
});

describe('QAAnalystAgent Integration', () => {
  const testImagePath = path.join(fixturesDir, 'test-slide.png');

  beforeAll(async () => {
    await fs.mkdir(fixturesDir, { recursive: true });

    await createTestImage(testImagePath, {
      width: 1080,
      height: 1080,
      background: { r: 30, g: 30, b: 50 },
      overlay: { r: 255, g: 255, b: 255, width: 200, left: 100 },
    });
  });

  afterAll(async () => {
    await fs.rm(fixturesDir, { recursive: true, force: true });
  });

  describe('run', () => {
    it('should analyze text-only post', async () => {
      const agent = createQAAnalystAgent();
      const result = await agent.run({
        postId: 'post-123',
        textContent: 'Este e um post de teste com conteudo relevante. Siga para mais!',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.postId).toBe('post-123');
      expect(result.data!.textAnalysis).toBeDefined();
      expect(result.data!.visualAnalysis).toBeDefined();
      expect(result.data!.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.data!.overallScore).toBeLessThanOrEqual(10);
    });

    it('should analyze post with visual assets', async () => {
      const agent = createQAAnalystAgent();
      const result = await agent.run({
        postId: 'post-456',
        textContent: 'Post com imagem. Confira!',
        assets: [
          {
            id: '1',
            postId: 'post-456',
            type: 'carousel_slide' as const,
            path: testImagePath,
            sizeBytes: 100000,
            createdAt: new Date(),
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data!.visualAnalysis.slides.length).toBe(1);
      expect(result.data!.visualAnalysis.analysisMethod).toBe('heuristic');
    });

    it('should calculate weighted overall score', async () => {
      const agent = createQAAnalystAgent({
        visualWeight: 0.5,
        textWeight: 0.5,
      });

      const result = await agent.run({
        postId: 'post-789',
        textContent: 'Texto de teste com CTA. Siga para mais conteudo!',
        assets: [
          {
            id: '1',
            postId: 'post-789',
            type: 'carousel_slide' as const,
            path: testImagePath,
            sizeBytes: 100000,
            createdAt: new Date(),
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data!.overallScore).toBeDefined();
    });

    it('should handle empty assets gracefully', async () => {
      const agent = createQAAnalystAgent();
      const result = await agent.run({
        postId: 'post-empty',
        textContent: 'Post sem imagens',
        assets: [],
      });

      expect(result.success).toBe(true);
      expect(result.data!.visualAnalysis.slides).toHaveLength(0);
      expect(result.data!.visualAnalysis.passed).toBe(true);
    });
  });

  describe('analyzeText', () => {
    it('should analyze text length', async () => {
      const agent = createQAAnalystAgent();
      const result = await agent.analyzeText({
        postId: 'test',
        textContent: 'Texto muito curto',
      });

      expect(result.criteria['length']).toBeDefined();
    });

    it('should analyze call-to-action', async () => {
      const agent = createQAAnalystAgent();
      const result = await agent.analyzeText({
        postId: 'test',
        textContent: 'Confira este conteudo incrivel! Siga para mais dicas?',
      });

      expect(result.criteria['callToAction']).toBeGreaterThan(5);
    });

    it('should analyze readability', async () => {
      const agent = createQAAnalystAgent();
      const result = await agent.analyzeText({
        postId: 'test',
        textContent: 'Texto simples. Frases curtas. Facil de ler.',
      });

      expect(result.criteria['readability']).toBeGreaterThan(5);
    });

    it('should analyze hashtags for Instagram', async () => {
      const agent = createQAAnalystAgent();
      const result = await agent.analyzeText({
        postId: 'test',
        textContent: 'Content',
        platformContent: {
          instagram: 'Post legal #tech #dev #coding #javascript #react',
        },
      });

      expect(result.criteria['hashtags']).toBeDefined();
    });
  });

  describe('analyzeVisuals', () => {
    it('should analyze carousel', async () => {
      const agent = createQAAnalystAgent();
      const result = await agent.analyzeVisuals({
        postId: 'carousel-test',
        assets: [
          {
            id: '1',
            postId: 'carousel-test',
            type: 'carousel_slide' as const,
            path: testImagePath,
            sizeBytes: 100000,
            createdAt: new Date(),
          },
          {
            id: '2',
            postId: 'carousel-test',
            type: 'carousel_slide' as const,
            path: testImagePath,
            sizeBytes: 100000,
            createdAt: new Date(),
          },
        ],
        isCarousel: true,
      });

      expect(result.slides).toHaveLength(2);
      expect(result.carouselConsistency).toBeDefined();
    });

    it('should return scores breakdown', async () => {
      const agent = createQAAnalystAgent();
      const result = await agent.analyzeVisuals({
        postId: 'score-test',
        assets: [
          {
            id: '1',
            postId: 'score-test',
            type: 'carousel_slide' as const,
            path: testImagePath,
            sizeBytes: 100000,
            createdAt: new Date(),
          },
        ],
        isCarousel: false,
      });

      expect(result.score.overall).toBeDefined();
      expect(result.score.dimensions).toBeDefined();
      expect(result.score.contrast).toBeDefined();
      expect(result.score.readability).toBeDefined();
    });
  });

  describe('state management', () => {
    it('should track state changes', async () => {
      const agent = createQAAnalystAgent();
      const stateChanges: string[] = [];

      agent.onStateChanged((event) => {
        stateChanges.push(`${event.previous} -> ${event.current}`);
      });

      await agent.run({
        postId: 'state-test',
        textContent: 'Test content',
      });

      expect(stateChanges.length).toBeGreaterThan(0);
      expect(stateChanges[0]).toContain('running');
    });

    it('should return current state', async () => {
      const agent = createQAAnalystAgent();

      expect(agent.getState()).toBe('idle');

      await agent.run({
        postId: 'state-test',
        textContent: 'Test content',
      });

      expect(agent.getState()).toBe('success');
    });
  });

  describe('configuration', () => {
    it('should use custom threshold', async () => {
      const agent = createQAAnalystAgent({
        threshold: 9.0,
      });

      const result = await agent.run({
        postId: 'threshold-test',
        textContent: 'Test content. Siga para mais!',
      });

      expect(result.data!.threshold).toBe(9.0);
    });

    it('should return config', () => {
      const agent = createQAAnalystAgent({
        threshold: 7.5,
        minContrastRatio: 5.0,
      });

      const config = agent.getConfig();

      expect(config.threshold).toBe(7.5);
      expect(config.minContrastRatio).toBe(5.0);
    });
  });
});

describe('Factory functions', () => {
  describe('createQAAnalystAgent', () => {
    it('should create agent with defaults', () => {
      const agent = createQAAnalystAgent();

      expect(agent).toBeDefined();
      expect(agent.name).toBe('QAAnalystAgent');
    });

    it('should throw on invalid threshold', () => {
      expect(() =>
        createQAAnalystAgent({ threshold: -1 })
      ).toThrow('threshold must be between 0 and 10');

      expect(() =>
        createQAAnalystAgent({ threshold: 15 })
      ).toThrow('threshold must be between 0 and 10');
    });

    it('should throw on invalid weights', () => {
      expect(() =>
        createQAAnalystAgent({
          visualWeight: 0.5,
          textWeight: 0.3, // Doesn't sum to 1
        })
      ).toThrow('visualWeight + textWeight must equal 1');
    });

    it('should throw on invalid multimodal config', () => {
      expect(() =>
        createQAAnalystAgent({
          multimodal: {
            provider: 'invalid' as any,
            apiKey: 'key',
            model: 'model',
            maxTokens: 1000,
            temperature: 0.5,
            rateLimitPerMinute: 10,
          },
        })
      ).toThrow('multimodal.provider must be one of');
    });
  });
});

describe('Default configurations', () => {
  it('should have valid default heuristic config', () => {
    expect(DEFAULT_HEURISTIC_CONFIG.minWidth).toBe(1080);
    expect(DEFAULT_HEURISTIC_CONFIG.minHeight).toBe(1080);
    expect(DEFAULT_HEURISTIC_CONFIG.maxFileSize).toBe(10485760);
    expect(DEFAULT_HEURISTIC_CONFIG.allowedFormats).toContain('png');
  });

  it('should have valid default QA visual config', () => {
    expect(DEFAULT_QA_VISUAL_CONFIG.threshold).toBe(6.0);
    expect(DEFAULT_QA_VISUAL_CONFIG.minContrastRatio).toBe(4.5);
    expect(DEFAULT_QA_VISUAL_CONFIG.visualWeight + DEFAULT_QA_VISUAL_CONFIG.textWeight).toBe(1);
  });
});
