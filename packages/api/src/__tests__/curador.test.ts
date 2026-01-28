import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createServer } from '../server';
import type { FastifyInstance } from 'fastify';
import { promises as fs } from 'fs';
import path from 'path';

// Mock the agents module
vi.mock('@social-content/agents', () => {
  const mockTrends = [
    {
      id: 'trend-1',
      title: 'React 19 New Features',
      description: 'Exploring the latest features in React 19',
      source: 'devto',
      url: 'https://dev.to/post/1',
      discoveredAt: new Date('2025-01-28T10:00:00Z'),
    },
    {
      id: 'trend-2',
      title: 'TypeScript 5.4 Released',
      description: 'New features in TypeScript 5.4',
      source: 'hackernews',
      url: 'https://news.ycombinator.com/item?id=123',
      discoveredAt: new Date('2025-01-28T09:00:00Z'),
    },
    {
      id: 'trend-3',
      title: 'Rust vs Go Performance',
      description: 'A comparison of Rust and Go performance',
      source: 'reddit',
      url: 'https://reddit.com/r/programming/post/1',
      discoveredAt: new Date('2025-01-28T08:00:00Z'),
    },
  ];

  const mockCuratedContent = [
    {
      id: 'curated-1',
      originalTrend: mockTrends[0],
      title: 'React 19 New Features',
      summary: 'Exploring the latest features in React 19',
      relevanceScore: 85,
      categories: ['tech', 'frontend'],
      tags: ['react', 'javascript'],
      sourceId: 'devto',
      curatedAt: new Date('2025-01-28T11:00:00Z'),
      metadata: {
        wordCount: 100,
        readingTime: 1,
        language: 'pt-BR',
      },
    },
  ];

  return {
    createResearcherAgent: vi.fn(() => ({
      name: 'researcher',
      status: 'idle',
      run: vi.fn().mockResolvedValue({
        success: true,
        data: {
          trends: mockTrends,
          metadata: {
            sourcesQueried: ['devto', 'hackernews', 'reddit'],
            totalFound: 3,
            deduplicatedCount: 0,
            timestamp: new Date('2025-01-28T10:00:00Z'),
          },
        },
        duration: 1500,
        timestamp: new Date(),
      }),
    })),
    createCuradorAgent: vi.fn(() => ({
      name: 'curador',
      status: 'idle',
      run: vi.fn().mockResolvedValue({
        success: true,
        data: {
          result: {
            success: true,
            content: mockCuratedContent,
            stats: {
              totalProcessed: 3,
              totalCurated: 1,
              totalFiltered: 2,
              processingTimeMs: 500,
            },
            errors: [],
            timestamp: new Date('2025-01-28T11:00:00Z'),
          },
          state: 'success',
        },
        duration: 500,
        timestamp: new Date(),
      }),
    })),
  };
});

/**
 * Helper to wait for curador to be ready (not running)
 */
async function waitForCuradorReady(app: FastifyInstance, maxWait = 2000): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWait) {
    const response = await request(app.server).get('/api/agents/curador/status');
    if (response.body.status !== 'running') {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * Helper to wait for researcher to be ready
 */
async function waitForResearcherReady(app: FastifyInstance, maxWait = 2000): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWait) {
    const response = await request(app.server).get('/api/agents/researcher/status');
    if (response.body.status !== 'running') {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * Helper to run researcher and wait for completion
 */
async function runResearcherAndWait(app: FastifyInstance): Promise<void> {
  await waitForResearcherReady(app);
  await request(app.server).post('/api/agents/researcher/run').send({});
  await waitForResearcherReady(app);
}

describe('Curador API', () => {
  let app: FastifyInstance;
  const outputDirCurated = path.resolve(process.cwd(), '../../output/curated');
  const outputDirTrends = path.resolve(process.cwd(), '../../output/trends');

  beforeAll(async () => {
    app = await createServer({ logger: false });
    await app.ready();

    // Ensure researcher has results before running curador tests
    await runResearcherAndWait(app);
  });

  afterAll(async () => {
    await app.close();
    // Clean up test files in curated directory
    try {
      const files = await fs.readdir(outputDirCurated);
      for (const file of files) {
        if (file.endsWith('.json')) {
          await fs.unlink(path.join(outputDirCurated, file));
        }
      }
    } catch {
      // Ignore cleanup errors
    }
    // Clean up test files in trends directory
    try {
      const files = await fs.readdir(outputDirTrends);
      for (const file of files) {
        if (file.endsWith('.json')) {
          await fs.unlink(path.join(outputDirTrends, file));
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/agents/curador/run', () => {
    it('should start curador agent with 202 Accepted', async () => {
      // Wait for curador to be available
      await waitForCuradorReady(app);

      const response = await request(app.server)
        .post('/api/agents/curador/run')
        .send({ useLatestTrends: true, platforms: ['instagram'] });

      expect(response.status).toBe(202);
      expect(response.body.status).toBe('started');
      expect(response.body.executionId).toBeDefined();
      expect(response.body.executionId).toMatch(/^exec-curador-/);
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.message).toBeDefined();

      // Wait for completion
      await waitForCuradorReady(app);
    });

    it('should accept request with specific platforms', async () => {
      // Wait for curador to be available
      await waitForCuradorReady(app);

      const response = await request(app.server)
        .post('/api/agents/curador/run')
        .send({ platforms: ['instagram', 'linkedin'] });

      expect(response.status).toBe(202);
      expect(response.body.status).toBe('started');

      // Wait for completion
      await waitForCuradorReady(app);
    });

    it('should validate invalid platforms', async () => {
      const response = await request(app.server)
        .post('/api/agents/curador/run')
        .send({ platforms: ['invalid_platform'] });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_PLATFORMS');
    });

    it('should validate invalid language type', async () => {
      const response = await request(app.server)
        .post('/api/agents/curador/run')
        .send({ language: 123 });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_LANGUAGE');
    });
  });

  describe('GET /api/agents/curador/results', () => {
    it('should return latest results with 200', async () => {
      // Ensure curador has run
      await waitForCuradorReady(app);
      await request(app.server)
        .post('/api/agents/curador/run')
        .send({ useLatestTrends: true });
      await waitForCuradorReady(app);

      const response = await request(app.server)
        .get('/api/agents/curador/results');

      expect(response.status).toBe(200);
      expect(response.body.curatedContent).toBeDefined();
      expect(Array.isArray(response.body.curatedContent)).toBe(true);
      expect(response.body.metadata).toBeDefined();
    });

    it('should include metadata with execution details', async () => {
      const response = await request(app.server)
        .get('/api/agents/curador/results');

      expect(response.status).toBe(200);
      expect(response.body.metadata.executionId).toMatch(/^exec-curador-/);
      expect(typeof response.body.metadata.trendsProcessed).toBe('number');
      expect(typeof response.body.metadata.contentGenerated).toBe('number');
      expect(Array.isArray(response.body.metadata.platforms)).toBe(true);
      expect(response.body.metadata.timestamp).toBeDefined();
      expect(typeof response.body.metadata.duration).toBe('number');
    });

    it('should include source execution info', async () => {
      const response = await request(app.server)
        .get('/api/agents/curador/results');

      expect(response.status).toBe(200);
      expect(response.body.sourceExecution).toBeDefined();
      expect(response.body.sourceExecution.trendsUsed).toBeDefined();
    });

    it('should return 404 for non-existent executionId', async () => {
      const response = await request(app.server)
        .get('/api/agents/curador/results')
        .query({ executionId: 'exec-curador-nonexistent' });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NO_RESULTS_FOUND');
    });
  });

  describe('GET /api/agents/curador/status', () => {
    it('should return current execution status', async () => {
      const response = await request(app.server)
        .get('/api/agents/curador/status');

      expect(response.status).toBe(200);
      expect(response.body.status).toBeDefined();
      expect(['idle', 'running', 'completed', 'failed']).toContain(response.body.status);
    });

    it('should return execution details after run', async () => {
      // Wait for any running execution
      await waitForCuradorReady(app);

      await request(app.server)
        .post('/api/agents/curador/run')
        .send({});

      const response = await request(app.server)
        .get('/api/agents/curador/status');

      expect(response.status).toBe(200);
      expect(response.body.status).toBeDefined();
      expect(response.body.executionId).toBeDefined();
      expect(response.body.startedAt).toBeDefined();

      // Wait for completion
      await waitForCuradorReady(app);
    });

    it('should show progress during/after execution', async () => {
      // Get status after executions have run
      const response = await request(app.server)
        .get('/api/agents/curador/status');

      expect(response.status).toBe(200);
      if (response.body.status === 'running' || response.body.status === 'completed') {
        expect(response.body.progress).toBeDefined();
        expect(response.body.progress.trendsTotal).toBeDefined();
        expect(response.body.progress.trendsProcessed).toBeDefined();
        expect(response.body.progress.percentComplete).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should return structured error for invalid JSON', async () => {
      const response = await request(app.server)
        .post('/api/agents/curador/run')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      // Fastify returns 400 for invalid JSON
      expect(response.status).toBe(400);
    });

    it('should return error response with required fields', async () => {
      const response = await request(app.server)
        .post('/api/agents/curador/run')
        .send({ platforms: ['unknown'] });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBeDefined();
      expect(response.body.error.message).toBeDefined();
      expect(response.body.error.timestamp).toBeDefined();
    });
  });

  describe('Integration with Researcher', () => {
    it('should use trends from researcher results', async () => {
      // Wait for curador to be ready
      await waitForCuradorReady(app);

      // Run curador
      const curadorResponse = await request(app.server)
        .post('/api/agents/curador/run')
        .send({ useLatestTrends: true });

      expect(curadorResponse.status).toBe(202);

      // Wait for curador to complete
      await waitForCuradorReady(app);

      // Check results
      const resultsResponse = await request(app.server)
        .get('/api/agents/curador/results');

      expect(resultsResponse.status).toBe(200);
      expect(resultsResponse.body.sourceExecution).toBeDefined();
      expect(resultsResponse.body.sourceExecution.trendsUsed).toBeGreaterThan(0);
    });
  });

  describe('Platform Content Generation', () => {
    it('should generate content for specified platforms', async () => {
      const response = await request(app.server)
        .get('/api/agents/curador/results');

      expect(response.status).toBe(200);
      expect(response.body.curatedContent.length).toBeGreaterThan(0);

      const content = response.body.curatedContent[0];
      expect(content.platforms).toBeDefined();
      expect(content.trendId).toBeDefined();
      expect(content.trendTitle).toBeDefined();
      expect(content.curatedAt).toBeDefined();
    });
  });
});
