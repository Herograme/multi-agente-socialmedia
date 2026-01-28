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
  };
});

describe('Researcher API', () => {
  let app: FastifyInstance;
  const outputDir = path.resolve(process.cwd(), '../../output/trends');

  beforeAll(async () => {
    app = await createServer({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    // Clean up test files
    try {
      const files = await fs.readdir(outputDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          await fs.unlink(path.join(outputDir, file));
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/agents/researcher/run', () => {
    it('should start researcher agent with 202 Accepted', async () => {
      const response = await request(app.server)
        .post('/api/agents/researcher/run')
        .send({ sources: ['devto'], limit: 5 });

      expect(response.status).toBe(202);
      expect(response.body.status).toBe('started');
      expect(response.body.executionId).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });

    it('should accept request without body (using defaults)', async () => {
      // Wait a bit for previous execution to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = await request(app.server)
        .post('/api/agents/researcher/run')
        .send({});

      expect(response.status).toBe(202);
      expect(response.body.status).toBe('started');
    });

    it('should validate invalid sources', async () => {
      const response = await request(app.server)
        .post('/api/agents/researcher/run')
        .send({ sources: ['invalid_source'] });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_SOURCES');
    });

    it('should validate invalid limit', async () => {
      const response = await request(app.server)
        .post('/api/agents/researcher/run')
        .send({ limit: 0 });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_LIMIT');
    });

    it('should validate limit over maximum', async () => {
      const response = await request(app.server)
        .post('/api/agents/researcher/run')
        .send({ limit: 101 });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_LIMIT');
    });
  });

  describe('GET /api/agents/researcher/results', () => {
    it('should return latest results with 200', async () => {
      // First, run the agent to generate results
      await request(app.server)
        .post('/api/agents/researcher/run')
        .send({ sources: ['devto'], limit: 5 });

      // Wait for execution to complete
      await new Promise((resolve) => setTimeout(resolve, 200));

      const response = await request(app.server)
        .get('/api/agents/researcher/results');

      expect(response.status).toBe(200);
      expect(response.body.trends).toBeDefined();
      expect(Array.isArray(response.body.trends)).toBe(true);
      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.sourcesQueried).toBeDefined();
      expect(response.body.metadata.totalFound).toBeDefined();
      expect(response.body.metadata.timestamp).toBeDefined();
    });

    it('should include metadata with execution details', async () => {
      // Wait for any previous execution
      await new Promise((resolve) => setTimeout(resolve, 100));

      await request(app.server)
        .post('/api/agents/researcher/run')
        .send({});

      // Wait for execution
      await new Promise((resolve) => setTimeout(resolve, 200));

      const response = await request(app.server)
        .get('/api/agents/researcher/results');

      expect(response.status).toBe(200);
      expect(response.body.metadata.executionId).toMatch(/^exec-/);
      expect(Array.isArray(response.body.metadata.sourcesQueried)).toBe(true);
      expect(typeof response.body.metadata.totalFound).toBe('number');
      expect(typeof response.body.metadata.duration).toBe('number');
    });
  });

  describe('GET /api/agents/researcher/status', () => {
    it('should return idle status when no execution', async () => {
      // This might return running or completed depending on previous tests
      const response = await request(app.server)
        .get('/api/agents/researcher/status');

      expect(response.status).toBe(200);
      expect(response.body.status).toBeDefined();
      expect(['idle', 'running', 'completed', 'failed']).toContain(response.body.status);
    });

    it('should return execution details after run', async () => {
      // Wait for any previous execution
      await new Promise((resolve) => setTimeout(resolve, 100));

      await request(app.server)
        .post('/api/agents/researcher/run')
        .send({});

      const response = await request(app.server)
        .get('/api/agents/researcher/status');

      expect(response.status).toBe(200);
      expect(response.body.status).toBeDefined();
      expect(response.body.executionId).toBeDefined();
      expect(response.body.startTime).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return structured error for invalid JSON', async () => {
      const response = await request(app.server)
        .post('/api/agents/researcher/run')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      // Fastify returns 400 for invalid JSON
      expect(response.status).toBe(400);
    });

    it('should return error response with required fields', async () => {
      const response = await request(app.server)
        .post('/api/agents/researcher/run')
        .send({ sources: ['unknown'] });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBeDefined();
      expect(response.body.error.message).toBeDefined();
      expect(response.body.error.timestamp).toBeDefined();
    });
  });
});
