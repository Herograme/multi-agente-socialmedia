/**
 * Full Pipeline Integration Tests
 * Story 4.7 - Pipeline Completo End-to-End
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';

// Mock the agents package before importing the routes
vi.mock('@social-content/agents', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@social-content/agents')>();

  // Mock full pipeline execution
  const mockRunFullPipeline = vi.fn().mockImplementation(async (input, options, callbacks) => {
    // Simulate step progress
    const steps = ['Pesquisador', 'TopicGenerator', 'Curador', 'Writer', 'Visual', 'QAAnalyst'];
    for (let i = 0; i < steps.length; i++) {
      if (callbacks.abortSignal?.aborted) {
        throw new Error('Pipeline was cancelled');
      }
      callbacks.onStepStart?.(steps[i], i, steps.length);
      await new Promise((r) => setTimeout(r, 10));
      callbacks.onStepComplete?.(steps[i], {});
      callbacks.onProgress?.(Math.round(((i + 1) / steps.length) * 100), steps[i]);
    }

    return {
      executionId: 'test-exec-id',
      status: 'completed',
      summary: {
        totalGenerated: options.numPosts || 3,
        totalApproved: 2,
        totalNeedsReview: 1,
        averageScore: 7.5,
        scoreDistribution: { excellent: 1, good: 1, needsWork: 1 },
        assetsGenerated: { backgrounds: 3, carouselSlides: 15, pdfs: 3 },
      },
      posts: [
        {
          id: 'post-1',
          topic: 'Test Topic 1',
          textInstagram: 'Test Instagram text',
          textLinkedin: 'Test LinkedIn text',
          score: 8.5,
          status: 'approved',
          assets: {
            backgroundPath: '/output/post-1/bg.png',
            carouselPaths: ['/output/post-1/slide-1.png'],
            pdfPath: '/output/post-1/carousel.pdf',
          },
          qaFeedback: ['Good quality'],
        },
        {
          id: 'post-2',
          topic: 'Test Topic 2',
          textInstagram: 'Test Instagram text 2',
          score: 7.0,
          status: 'approved',
          assets: {},
          qaFeedback: [],
        },
        {
          id: 'post-3',
          topic: 'Test Topic 3',
          textLinkedin: 'Test LinkedIn text 3',
          score: 5.5,
          status: 'needs_review',
          assets: {},
          qaFeedback: ['Needs improvement'],
        },
      ],
      metadata: {
        startedAt: new Date(),
        completedAt: new Date(),
        durationMs: 1000,
        options,
      },
    };
  });

  return {
    ...actual,
    runFullPipeline: mockRunFullPipeline,
  };
});

// Mock the services to avoid side effects
vi.mock('../services/full-pipeline.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/full-pipeline.service')>();

  const mockService = {
    startFullPipeline: vi.fn().mockImplementation(async (_input, _options) => ({
      executionId: 'test-exec-id',
      status: 'running',
      message: 'Full pipeline started successfully',
      statusUrl: '/api/pipeline/status/test-exec-id',
    })),
    getStatus: vi.fn().mockImplementation(async (id) => {
      if (id === 'non-existent') return null;
      return {
        executionId: id,
        status: 'running',
        startedAt: new Date().toISOString(),
        currentStep: 'Writer',
        progress: 60,
        config: { numPosts: 3, platforms: 'both' },
      };
    }),
    cancel: vi.fn().mockImplementation(async (id) => {
      if (id === 'non-existent') return { success: false, error: 'not_found' };
      if (id === 'completed-id') return { success: false, error: 'not_running' };
      return { success: true };
    }),
    getAllExecutions: vi.fn().mockResolvedValue([]),
    getStats: vi.fn().mockResolvedValue({
      total: 10,
      completed: 8,
      failed: 1,
      cancelled: 1,
      averageDurationMs: 5000,
      averageScore: 7.2,
      totalPostsGenerated: 24,
    }),
    isRunning: vi.fn().mockReturnValue(true),
  };

  return {
    ...actual,
    getFullPipelineService: () => mockService,
  };
});

// Import routes after mocking
import { pipelineRoutes } from '../routes/pipeline';

describe('Full Pipeline API Routes', () => {
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

  describe('POST /api/pipeline/run', () => {
    it('should start pipeline with default options and return 202', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pipeline/run',
        payload: {},
      });

      expect(response.statusCode).toBe(202);
      const body = JSON.parse(response.body);
      expect(body.executionId).toBeDefined();
      expect(body.status).toBe('running');
      expect(body.statusUrl).toContain('/api/pipeline/status/');
    });

    it('should start pipeline with custom options', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pipeline/run',
        payload: {
          sources: { devto: true, hackernews: false, reddit: true },
          options: {
            numPosts: 5,
            platforms: 'instagram',
            includeVisual: true,
            qualityThreshold: 7.0,
            carouselSlides: 8,
            backgroundStyle: 'gradient',
          },
        },
      });

      expect(response.statusCode).toBe(202);
      const body = JSON.parse(response.body);
      expect(body.executionId).toBeDefined();
    });

    it('should reject invalid numPosts (too high)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pipeline/run',
        payload: {
          options: { numPosts: 15 },
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_NUM_POSTS');
    });

    it('should reject invalid numPosts (too low)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pipeline/run',
        payload: {
          options: { numPosts: 0 },
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_NUM_POSTS');
    });

    it('should reject invalid qualityThreshold (too high)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pipeline/run',
        payload: {
          options: { qualityThreshold: 12 },
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_QUALITY_THRESHOLD');
    });

    it('should reject invalid qualityThreshold (negative)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pipeline/run',
        payload: {
          options: { qualityThreshold: -1 },
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_QUALITY_THRESHOLD');
    });

    it('should reject invalid carouselSlides (too high)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pipeline/run',
        payload: {
          options: { carouselSlides: 20 },
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_CAROUSEL_SLIDES');
    });

    it('should reject invalid carouselSlides (too low)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pipeline/run',
        payload: {
          options: { carouselSlides: 0 },
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_CAROUSEL_SLIDES');
    });

    it('should accept valid platforms options', async () => {
      for (const platforms of ['instagram', 'linkedin', 'both']) {
        const response = await app.inject({
          method: 'POST',
          url: '/api/pipeline/run',
          payload: {
            options: { platforms },
          },
        });

        expect(response.statusCode).toBe(202);
      }
    });
  });

  describe('GET /api/pipeline/status/:executionId', () => {
    it('should return execution status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/pipeline/status/test-exec-id',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.executionId).toBe('test-exec-id');
      expect(body.status).toBeDefined();
      expect(body.progress).toBeDefined();
      expect(body.currentStep).toBeDefined();
    });

    it('should return 404 for non-existent execution', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/pipeline/status/non-existent',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('EXECUTION_NOT_FOUND');
    });
  });

  describe('POST /api/pipeline/:executionId/cancel', () => {
    it('should cancel running execution', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pipeline/executions/test-exec-id/cancel',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('cancelled');
      expect(body.executionId).toBe('test-exec-id');
    });

    it('should return 404 for non-existent execution', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pipeline/executions/non-existent/cancel',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('EXECUTION_NOT_FOUND');
    });

    it('should return 400 for non-running execution', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pipeline/executions/completed-id/cancel',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('EXECUTION_NOT_RUNNING');
    });
  });

  describe('GET /api/pipeline/executions', () => {
    it('should return list of executions', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/pipeline/executions',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body)).toBe(true);
    });

    it('should accept status filter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/pipeline/executions?status=running',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should accept pagination params', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/pipeline/executions?limit=10&offset=5',
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('GET /api/pipeline/executions/stats', () => {
    it('should return execution statistics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/pipeline/executions/stats',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.stats).toBeDefined();
      expect(body.stats.total).toBeDefined();
      expect(body.stats.completed).toBeDefined();
      expect(body.stats.failed).toBeDefined();
    });
  });
});

describe('Full Pipeline Service', () => {
  describe('Execution Repository', () => {
    it('should create and retrieve execution records', async () => {
      const { createExecutionsRepository } = await import('../repositories/executions.repository');
      const repo = createExecutionsRepository();

      const execution = await repo.create({
        status: 'running',
        startedAt: new Date(),
        config: JSON.stringify({ numPosts: 3 }),
        progress: 0,
      });

      expect(execution.id).toBeDefined();
      expect(execution.status).toBe('running');

      const found = await repo.findById(execution.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(execution.id);
    });

    it('should update execution status', async () => {
      const { createExecutionsRepository } = await import('../repositories/executions.repository');
      const repo = createExecutionsRepository();

      const execution = await repo.create({
        status: 'running',
        startedAt: new Date(),
        config: '{}',
      });

      const updated = await repo.updateStatus(execution.id, 'completed', {
        completedAt: new Date(),
        progress: 100,
        summary: JSON.stringify({ totalGenerated: 3 }),
      });

      expect(updated?.status).toBe('completed');
      expect(updated?.progress).toBe(100);
      expect(updated?.completedAt).toBeDefined();
    });

    it('should get execution statistics', async () => {
      const { createExecutionsRepository } = await import('../repositories/executions.repository');
      const repo = createExecutionsRepository();

      // Create some test executions
      await repo.create({
        status: 'completed',
        startedAt: new Date(Date.now() - 5000),
        completedAt: new Date(),
        config: '{}',
        summary: JSON.stringify({ averageScore: 7.5, totalGenerated: 3 }),
      });

      await repo.create({
        status: 'failed',
        startedAt: new Date(),
        config: '{}',
        error: 'Test error',
      });

      const stats = await repo.getStats();

      expect(stats.total).toBe(2);
      expect(stats.completed).toBe(1);
      expect(stats.failed).toBe(1);
    });

    it('should filter executions by status', async () => {
      const { createExecutionsRepository } = await import('../repositories/executions.repository');
      const repo = createExecutionsRepository();

      await repo.create({ status: 'completed', startedAt: new Date(), config: '{}' });
      await repo.create({ status: 'running', startedAt: new Date(), config: '{}' });
      await repo.create({ status: 'failed', startedAt: new Date(), config: '{}' });

      const running = await repo.findAll({ status: 'running' });
      expect(running.length).toBe(1);
      expect(running[0]?.status).toBe('running');
    });
  });

  describe('Posts Repository', () => {
    it('should create and retrieve posts', async () => {
      const { createPostsRepository } = await import('../repositories/posts.repository');
      const repo = createPostsRepository();

      const post = await repo.create({
        executionId: 'exec-1',
        topic: 'Test Topic',
        textInstagram: 'Instagram text',
        textLinkedin: 'LinkedIn text',
        status: 'approved',
      });

      expect(post.id).toBeDefined();
      expect(post.topic).toBe('Test Topic');

      const found = await repo.findByExecutionId('exec-1');
      expect(found.length).toBe(1);
    });
  });

  describe('Scores Repository', () => {
    it('should create and retrieve scores', async () => {
      const { createScoresRepository } = await import('../repositories/scores.repository');
      const repo = createScoresRepository();

      const score = await repo.create({
        postId: 'post-1',
        overallScore: 8.5,
        criteriaBreakdown: JSON.stringify({ feedback: ['Good quality'] }),
      });

      expect(score.id).toBeDefined();
      expect(score.overallScore).toBe(8.5);

      const found = await repo.findByPostId('post-1');
      expect(found).not.toBeNull();
      expect(found?.overallScore).toBe(8.5);
    });

    it('should calculate average score', async () => {
      const { createScoresRepository } = await import('../repositories/scores.repository');
      const repo = createScoresRepository();

      await repo.create({ postId: 'p1', overallScore: 8.0, criteriaBreakdown: '{}' });
      await repo.create({ postId: 'p2', overallScore: 7.0, criteriaBreakdown: '{}' });
      await repo.create({ postId: 'p3', overallScore: 6.0, criteriaBreakdown: '{}' });

      const avg = await repo.getAverageScore();
      expect(avg).toBe(7);
    });

    it('should get score distribution', async () => {
      const { createScoresRepository } = await import('../repositories/scores.repository');
      const repo = createScoresRepository();

      await repo.create({ postId: 'p1', overallScore: 9.0, criteriaBreakdown: '{}' }); // excellent
      await repo.create({ postId: 'p2', overallScore: 7.0, criteriaBreakdown: '{}' }); // good
      await repo.create({ postId: 'p3', overallScore: 5.0, criteriaBreakdown: '{}' }); // needsWork

      const dist = await repo.getScoreDistribution();
      expect(dist.excellent).toBe(1);
      expect(dist.good).toBe(1);
      expect(dist.needsWork).toBe(1);
    });
  });

  describe('Pipeline Results Service', () => {
    it('should save and retrieve pipeline results', async () => {
      const { createPipelineResultsService } = await import('../services/pipeline-results.service');
      const { createPostsRepository } = await import('../repositories/posts.repository');
      const { createAssetsRepository } = await import('../repositories/assets.repository');
      const { createScoresRepository } = await import('../repositories/scores.repository');

      const postsRepo = createPostsRepository();
      const assetsRepo = createAssetsRepository();
      const scoresRepo = createScoresRepository();

      const service = createPipelineResultsService(postsRepo, assetsRepo, scoresRepo);

      const result = {
        executionId: 'exec-test',
        status: 'completed' as const,
        summary: {
          totalGenerated: 1,
          totalApproved: 1,
          totalNeedsReview: 0,
          averageScore: 8.0,
          scoreDistribution: { excellent: 1, good: 0, needsWork: 0 },
          assetsGenerated: { backgrounds: 1, carouselSlides: 3, pdfs: 1 },
        },
        posts: [
          {
            id: 'post-test',
            topic: 'Test Topic',
            textInstagram: 'Test IG',
            textLinkedin: 'Test LI',
            score: 8.0,
            status: 'approved' as const,
            assets: {
              backgroundPath: '/output/bg.png',
              carouselPaths: ['/output/s1.png', '/output/s2.png'],
              pdfPath: '/output/doc.pdf',
            },
            qaFeedback: ['Good quality'],
          },
        ],
        metadata: {
          startedAt: new Date(),
          completedAt: new Date(),
          durationMs: 1000,
          options: { numPosts: 1 },
        },
      };

      const summary = await service.saveResults('exec-test', result);

      expect(summary.postsSaved).toBe(1);
      expect(summary.assetsSaved).toBe(4); // 1 bg + 2 slides + 1 pdf
      expect(summary.scoresSaved).toBe(1);
      expect(summary.errors).toHaveLength(0);

      // Verify posts were saved
      const posts = await service.getPostsByExecution('exec-test');
      expect(posts.length).toBe(1);
      expect(posts[0]?.topic).toBe('Test Topic');
      expect(posts[0]?.score).toBe(8.0);
    });
  });
});

describe('WebSocket Events', () => {
  describe('ExecutionEventBus', () => {
    it('should allow subscribing and unsubscribing', async () => {
      const { getExecutionEventBus } = await import('../websocket/pipeline-events');
      const bus = getExecutionEventBus();

      bus.subscribe('exec-1', 'client-1');
      expect(bus.hasSubscribers('exec-1')).toBe(true);
      expect(bus.getSubscribers('exec-1')).toContain('client-1');

      bus.unsubscribe('exec-1', 'client-1');
      expect(bus.hasSubscribers('exec-1')).toBe(false);
    });

    it('should emit events to subscribers', async () => {
      const { getExecutionEventBus, PipelineWSEvent } = await import('../websocket/pipeline-events');
      const bus = getExecutionEventBus();

      const receivedEvents: unknown[] = [];

      bus.on(PipelineWSEvent.EXECUTION_STARTED, (payload) => {
        receivedEvents.push(payload);
      });

      bus.emitExecutionEvent('exec-1', PipelineWSEvent.EXECUTION_STARTED, {
        executionId: 'exec-1',
        startedAt: new Date().toISOString(),
        options: { numPosts: 3 },
      });

      expect(receivedEvents.length).toBe(1);
      expect((receivedEvents[0] as { executionId: string }).executionId).toBe('exec-1');
    });
  });
});
