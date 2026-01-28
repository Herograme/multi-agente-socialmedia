/**
 * Visual Pipeline API Tests
 * Story 3.7 - Integracao Pipeline Visual
 *
 * Integration tests for the visual pipeline endpoints
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';

// Mock the agents package before importing the routes
vi.mock('@social-content/agents', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@social-content/agents')>();

  // Define enum values locally to avoid hoisting issues
  const PipelineStatusEnum = {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
  } as const;

  const StepStatusEnum = {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    SKIPPED: 'skipped',
  } as const;

  // Mock status store
  const mockStatusStore = {
    create: vi.fn(),
    get: vi.fn().mockImplementation((id: string) => {
      if (id === 'non-existent') return null;
      if (id.includes('visual')) {
        return {
          pipelineId: id,
          configId: 'visual-pipeline',
          configName: 'Visual Content Pipeline',
          status: 'running',
          progress: {
            currentStep: 1,
            totalSteps: 3,
            percentComplete: 33,
            currentStepName: 'CarouselBuilder',
          },
          startedAt: new Date(),
          stepStates: [
            { name: 'ImageDesigner', index: 0, status: 'completed' },
            { name: 'CarouselBuilder', index: 1, status: 'running' },
            { name: 'PDFMaker', index: 2, status: 'pending' },
          ],
        };
      }
      return {
        pipelineId: id,
        configId: 'research-curate',
        configName: 'Research and Curate Pipeline',
        status: 'running',
        progress: {
          currentStep: 0,
          totalSteps: 2,
          percentComplete: 50,
          currentStepName: 'research',
        },
        startedAt: new Date(),
        stepStates: [
          { name: 'research', index: 0, status: 'completed' },
          { name: 'curate', index: 1, status: 'running' },
        ],
      };
    }),
    getAll: vi.fn().mockReturnValue([]),
    getByStatus: vi.fn().mockReturnValue([]),
    getStatusCounts: vi.fn().mockReturnValue({
      pending: 0,
      running: 1,
      completed: 5,
      failed: 1,
      cancelled: 0,
    }),
    update: vi.fn(),
    updateStatus: vi.fn(),
    updateProgress: vi.fn(),
    updateStepState: vi.fn(),
    complete: vi.fn(),
    fail: vi.fn(),
  };

  // Mock visual pipeline result
  const mockVisualPipelineResult = {
    postId: 'test-post-123',
    assets: [
      {
        id: 'asset-1',
        type: 'background',
        path: '/output/posts/test-post-123/background.png',
        filename: 'background.png',
        size: 102400,
        mimeType: 'image/png',
      },
      {
        id: 'asset-2',
        type: 'carousel_slide',
        path: '/output/posts/test-post-123/slide-0.png',
        filename: 'slide-0.png',
        size: 51200,
        mimeType: 'image/png',
        slideIndex: 0,
      },
    ],
    metadata: {
      processingTimeMs: 5000,
      generatedAt: new Date(),
      options: {},
      stepsExecuted: 3,
    },
  };

  // Mock runVisualPipeline
  const mockRunVisualPipeline = vi.fn().mockResolvedValue(mockVisualPipelineResult);

  // Mock file cleanup service
  const mockFileCleanupService = {
    trackFile: vi.fn(),
    trackFiles: vi.fn(),
    trackDirectory: vi.fn(),
    getTrackedCount: vi.fn().mockReturnValue(0),
    getTrackedFiles: vi.fn().mockReturnValue([]),
    cleanupTrackedFiles: vi.fn().mockResolvedValue({ success: [], failed: [] }),
    cleanupFiles: vi.fn().mockResolvedValue({ success: [], failed: [] }),
    commitFiles: vi.fn(),
    untrackFile: vi.fn(),
    isTracked: vi.fn().mockReturnValue(false),
    getFileDirectory: vi.fn().mockReturnValue('/tmp'),
    fileExists: vi.fn().mockResolvedValue(false),
  };

  // Mock research pipeline
  const mockResearchPipeline = {
    run: vi.fn().mockResolvedValue({
      pipelineId: 'test-pipeline-id',
      status: 'completed',
      duration: 1000,
      stepResults: [
        { stepName: 'research', status: 'completed', duration: 500 },
        { stepName: 'curate', status: 'completed', duration: 500 },
      ],
      finalOutput: { trends: [] },
      errors: [],
    }),
    buildInitialState: vi.fn().mockReturnValue({
      pipelineId: 'test-pipeline-id',
      configId: 'research-curate',
      configName: 'Research and Curate Pipeline',
      status: 'pending',
      progress: {
        currentStep: 0,
        totalSteps: 2,
        percentComplete: 0,
        currentStepName: 'research',
      },
      startedAt: new Date(),
      stepStates: [
        { name: 'research', index: 0, status: 'pending' },
        { name: 'curate', index: 1, status: 'pending' },
      ],
    }),
    on: vi.fn(),
  };

  return {
    ...actual,
    // Explicitly re-export enums (vitest mock hoisting issue)
    PipelineStatus: PipelineStatusEnum,
    StepStatus: StepStatusEnum,
    // Mock functions
    runVisualPipeline: mockRunVisualPipeline,
    createResearchCuratePipeline: vi.fn().mockReturnValue(mockResearchPipeline),
    getPipelineStatusStore: vi.fn().mockReturnValue(mockStatusStore),
    createFileCleanupService: vi.fn().mockReturnValue(mockFileCleanupService),
    getFileCleanupService: vi.fn().mockReturnValue(mockFileCleanupService),
  };
});

// Import routes after mocking
import { pipelineRoutes } from '../routes/pipeline';
import { postsRoutes } from '../routes/posts/index';
import { createAssetsRepository, setAssetsRepository, type AssetRecord } from '../repositories/assets.repository';

describe('Visual Pipeline API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(pipelineRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/pipeline/visual', () => {
    it('should start pipeline with postId', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pipeline/visual',
        payload: {
          postId: 'existing-post-123',
          options: {
            gerarCarousel: true,
            gerarPdf: true,
            numSlides: 5,
          },
        },
      });

      expect(response.statusCode).toBe(202);
      const body = JSON.parse(response.body);
      expect(body.pipelineId).toBeDefined();
      expect(body.status).toBe('started');
      expect(body.postId).toBe('existing-post-123');
    });

    it('should start pipeline with direct content', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pipeline/visual',
        payload: {
          content: {
            title: 'React 19 Features',
            text: 'React 19 introduces exciting new features including improved server components.',
            topic: 'react',
          },
        },
      });

      expect(response.statusCode).toBe(202);
      const body = JSON.parse(response.body);
      expect(body.pipelineId).toBeDefined();
      expect(body.status).toBe('started');
    });

    it('should reject request without postId or content', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pipeline/visual',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_INPUT');
      expect(body.error.message).toContain('Either postId or content');
    });

    it('should reject request with both postId and content', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pipeline/visual',
        payload: {
          postId: 'post-123',
          content: { title: 'Test', text: 'Test content' },
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_INPUT');
      expect(body.error.message).toContain('either postId or content, not both');
    });

    it('should validate content has title and text', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pipeline/visual',
        payload: {
          content: { title: 'Only title' },
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_CONTENT');
    });

    it('should validate numSlides range (1-10)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pipeline/visual',
        payload: {
          postId: 'post-123',
          options: { numSlides: 15 },
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_NUM_SLIDES');
    });

    it('should reject numSlides less than 1', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pipeline/visual',
        payload: {
          postId: 'post-123',
          options: { numSlides: 0 },
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_NUM_SLIDES');
    });

    it('should accept valid options', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pipeline/visual',
        payload: {
          postId: 'post-123',
          options: {
            gerarCarousel: true,
            gerarPdf: false,
            numSlides: 7,
            authorHandle: '@myhandle',
            ctaText: 'Follow for more!',
          },
        },
      });

      expect(response.statusCode).toBe(202);
    });
  });

  describe('GET /api/pipeline/visual/:id/status', () => {
    it('should return visual pipeline status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/pipeline/visual/visual-pipe-123/status',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.pipelineId).toBe('visual-pipe-123');
      expect(body.status).toBeDefined();
      expect(body.progress).toBeDefined();
    });

    it('should return 404 for non-existent visual pipeline', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/pipeline/visual/non-existent/status',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('PIPELINE_NOT_FOUND');
    });
  });

  describe('POST /api/pipeline/visual/:id/cancel', () => {
    it('should handle cancel request for non-running pipeline', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pipeline/visual/non-running/cancel',
      });

      // Will return 404 since no abort controller exists for this ID
      expect([200, 404]).toContain(response.statusCode);
    });
  });

  describe('GET /api/pipeline/visual/status', () => {
    it('should return all visual pipeline statuses', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/pipeline/visual/status',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body)).toBe(true);
    });

    it('should filter by status query param', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/pipeline/visual/status?status=running',
      });

      expect(response.statusCode).toBe(200);
    });
  });
});

describe('Posts Assets API', () => {
  let app: FastifyInstance;
  let testAssetsRepo: ReturnType<typeof createAssetsRepository>;

  beforeAll(async () => {
    // Create a test repository and set it as the global instance
    testAssetsRepo = createAssetsRepository();
    setAssetsRepository(testAssetsRepo);

    app = Fastify({ logger: false });
    await app.register(postsRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Clear the repository before each test
    testAssetsRepo.clear();
  });

  describe('GET /api/posts/:id/assets', () => {
    it('should return assets for existing post', async () => {
      // Seed test assets
      const testAssets: AssetRecord[] = [
        {
          id: 'asset-1',
          postId: 'test-post-123',
          type: 'image',
          path: '/output/posts/test-post-123/background.png',
          filename: 'background.png',
          size: 102400,
          mimeType: 'image/png',
          createdAt: new Date(),
        },
        {
          id: 'asset-2',
          postId: 'test-post-123',
          type: 'carousel',
          path: '/output/posts/test-post-123/slide-0.png',
          filename: 'slide-0.png',
          size: 51200,
          mimeType: 'image/png',
          createdAt: new Date(),
        },
      ];
      testAssetsRepo.seed(testAssets);

      const response = await app.inject({
        method: 'GET',
        url: '/api/posts/test-post-123/assets',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.postId).toBe('test-post-123');
      expect(body.assets).toBeInstanceOf(Array);
      expect(body.assets.length).toBe(2);
      expect(body.assets[0]).toHaveProperty('id');
      expect(body.assets[0]).toHaveProperty('type');
      expect(body.assets[0]).toHaveProperty('path');
      expect(body.total).toBe(2);
    });

    it('should return empty assets array for post without assets', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/posts/post-without-assets/assets',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.assets).toEqual([]);
      expect(body.total).toBe(0);
    });

    it('should filter assets by type', async () => {
      // Seed test assets
      const testAssets: AssetRecord[] = [
        {
          id: 'asset-1',
          postId: 'test-post-456',
          type: 'image',
          path: '/output/posts/test-post-456/background.png',
          filename: 'background.png',
          size: 102400,
          mimeType: 'image/png',
          createdAt: new Date(),
        },
        {
          id: 'asset-2',
          postId: 'test-post-456',
          type: 'pdf',
          path: '/output/posts/test-post-456/carousel.pdf',
          filename: 'carousel.pdf',
          size: 204800,
          mimeType: 'application/pdf',
          createdAt: new Date(),
        },
      ];
      testAssetsRepo.seed(testAssets);

      const response = await app.inject({
        method: 'GET',
        url: '/api/posts/test-post-456/assets?type=pdf',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.assets.length).toBe(1);
      expect(body.assets[0].type).toBe('pdf');
    });

    it('should support pagination', async () => {
      // Seed many test assets
      const testAssets: AssetRecord[] = Array.from({ length: 10 }, (_, i) => ({
        id: `asset-${i}`,
        postId: 'test-post-789',
        type: 'carousel' as const,
        path: `/output/posts/test-post-789/slide-${i}.png`,
        filename: `slide-${i}.png`,
        size: 51200,
        mimeType: 'image/png',
        createdAt: new Date(Date.now() - i * 1000), // Different creation times
      }));
      testAssetsRepo.seed(testAssets);

      const response = await app.inject({
        method: 'GET',
        url: '/api/posts/test-post-789/assets?limit=3&offset=2',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.assets.length).toBe(3);
      expect(body.total).toBe(10);
    });
  });

  describe('DELETE /api/posts/:id/assets', () => {
    it('should delete all assets for a post', async () => {
      // Seed test assets
      const testAssets: AssetRecord[] = [
        {
          id: 'asset-1',
          postId: 'delete-test-post',
          type: 'image',
          path: '/output/posts/delete-test-post/background.png',
          filename: 'background.png',
          size: 102400,
          mimeType: 'image/png',
          createdAt: new Date(),
        },
        {
          id: 'asset-2',
          postId: 'delete-test-post',
          type: 'pdf',
          path: '/output/posts/delete-test-post/carousel.pdf',
          filename: 'carousel.pdf',
          size: 204800,
          mimeType: 'application/pdf',
          createdAt: new Date(),
        },
      ];
      testAssetsRepo.seed(testAssets);

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/posts/delete-test-post/assets',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.deletedCount).toBe(2);

      // Verify assets are deleted
      const verifyResponse = await app.inject({
        method: 'GET',
        url: '/api/posts/delete-test-post/assets',
      });
      const verifyBody = JSON.parse(verifyResponse.body);
      expect(verifyBody.assets.length).toBe(0);
    });
  });

  describe('GET /api/posts/:id/assets/:assetId', () => {
    it('should return specific asset', async () => {
      const testAsset: AssetRecord = {
        id: 'specific-asset-123',
        postId: 'specific-test-post',
        type: 'image',
        path: '/output/posts/specific-test-post/background.png',
        filename: 'background.png',
        size: 102400,
        mimeType: 'image/png',
        createdAt: new Date(),
        metadata: JSON.stringify({ width: 1080, height: 1080 }),
      };
      testAssetsRepo.seed([testAsset]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/posts/specific-test-post/assets/specific-asset-123',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('specific-asset-123');
      expect(body.type).toBe('image');
      expect(body.metadata).toEqual({ width: 1080, height: 1080 });
    });

    it('should return 404 for non-existent asset', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/posts/some-post/assets/non-existent-asset',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('ASSET_NOT_FOUND');
    });

    it('should return 404 if asset belongs to different post', async () => {
      const testAsset: AssetRecord = {
        id: 'asset-wrong-post',
        postId: 'actual-post',
        type: 'image',
        path: '/output/posts/actual-post/background.png',
        filename: 'background.png',
        size: 102400,
        mimeType: 'image/png',
        createdAt: new Date(),
      };
      testAssetsRepo.seed([testAsset]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/posts/wrong-post/assets/asset-wrong-post',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('ASSET_NOT_FOUND');
    });
  });
});

describe('File Cleanup Service (Unit)', () => {
  it('should be exported from agents package', async () => {
    const { createFileCleanupService } = await import('@social-content/agents');
    expect(createFileCleanupService).toBeDefined();

    const cleanup = createFileCleanupService();
    expect(cleanup.trackFile).toBeDefined();
    expect(cleanup.cleanupTrackedFiles).toBeDefined();
    expect(cleanup.commitFiles).toBeDefined();
  });
});
