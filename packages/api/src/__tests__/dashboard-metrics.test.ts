/**
 * Dashboard Metrics Tests
 * Story 5.3: Dashboard Principal com Metricas
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import {
  getTestDatabase,
  runTestMigrations,
  createRepositories,
} from '../database';
import { resetMetricsService, getMetricsService } from '../services/metrics.service';
import { dashboardMetricsRoutes } from '../routes/metrics/dashboard';

describe('Dashboard Metrics API', () => {
  let app: FastifyInstance;
  let testDb: ReturnType<typeof getTestDatabase>;

  beforeAll(async () => {
    // Create test database
    testDb = getTestDatabase();
    runTestMigrations(testDb);

    // Configure metrics service to use test database
    const metricsService = getMetricsService();
    metricsService.setDatabase(testDb);

    // Create minimal Fastify app with only dashboard routes
    app = Fastify({ logger: false });
    const repositories = createRepositories(testDb);
    app.decorate('db', repositories);

    // Register only the dashboard metrics routes
    await app.register(dashboardMetricsRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    testDb.close();
  });

  beforeEach(() => {
    // Reset database between tests
    testDb.exec('DELETE FROM scores');
    testDb.exec('DELETE FROM assets');
    testDb.exec('DELETE FROM posts');
    testDb.exec('DELETE FROM executions');

    // Reset metrics service cache (but keep the database reference)
    getMetricsService().invalidateCache();
  });

  describe('GET /api/dashboard/metrics', () => {
    it('should return empty metrics when no data exists', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/dashboard/metrics',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body).toHaveProperty('metrics');
      expect(body).toHaveProperty('timestamp');
      expect(body.metrics).toHaveProperty('postsToday', 0);
      expect(body.metrics).toHaveProperty('averageScore', 0);
      expect(body.metrics).toHaveProperty('approvalRate', 0);
      expect(body.metrics).toHaveProperty('avgGenerationTime', 0);
    });

    it('should return correct postsToday count', async () => {
      // Create execution
      const executionId = uuidv4();
      const now = new Date().toISOString();

      testDb
        .prepare(
          `
        INSERT INTO executions (id, started_at, status, config, created_at)
        VALUES (?, ?, 'completed', '{}', ?)
      `
        )
        .run(executionId, now, now);

      // Create posts today with explicit ISO timestamp
      for (let i = 0; i < 5; i++) {
        testDb
          .prepare(
            `
          INSERT INTO posts (id, execution_id, topic, text_ig, status, created_at)
          VALUES (?, ?, ?, ?, 'approved', ?)
        `
          )
          .run(uuidv4(), executionId, `Topic ${i}`, `Content ${i}`, now);
      }

      const response = await app.inject({
        method: 'GET',
        url: '/api/dashboard/metrics',
      });

      const body = JSON.parse(response.body);
      expect(body.metrics.postsToday).toBe(5);
    });

    it('should calculate average score correctly', async () => {
      const executionId = uuidv4();
      testDb
        .prepare(
          `
        INSERT INTO executions (id, started_at, status, config)
        VALUES (?, datetime('now'), 'completed', '{}')
      `
        )
        .run(executionId);

      // Create posts with scores
      const scores = [6, 7, 8, 9, 10];
      for (let i = 0; i < scores.length; i++) {
        const postId = uuidv4();
        testDb
          .prepare(
            `
          INSERT INTO posts (id, execution_id, topic, text_ig, status, created_at)
          VALUES (?, ?, ?, ?, 'approved', datetime('now'))
        `
          )
          .run(postId, executionId, `Topic ${i}`, `Content ${i}`);

        testDb
          .prepare(
            `
          INSERT INTO scores (id, post_id, overall_score, criteria_breakdown, approved)
          VALUES (?, ?, ?, '{}', 1)
        `
          )
          .run(uuidv4(), postId, scores[i]);
      }

      const response = await app.inject({
        method: 'GET',
        url: '/api/dashboard/metrics',
      });

      const body = JSON.parse(response.body);
      // Average of 6,7,8,9,10 = 8
      expect(body.metrics.averageScore).toBe(8);
    });

    it('should calculate approval rate correctly', async () => {
      const executionId = uuidv4();
      testDb
        .prepare(
          `
        INSERT INTO executions (id, started_at, status, config)
        VALUES (?, datetime('now'), 'completed', '{}')
      `
        )
        .run(executionId);

      // Create 10 posts: 7 approved, 3 rejected
      for (let i = 0; i < 10; i++) {
        const status = i < 7 ? 'approved' : 'rejected';
        testDb
          .prepare(
            `
          INSERT INTO posts (id, execution_id, topic, text_ig, status, created_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
        `
          )
          .run(uuidv4(), executionId, `Topic ${i}`, `Content ${i}`, status);
      }

      const response = await app.inject({
        method: 'GET',
        url: '/api/dashboard/metrics',
      });

      const body = JSON.parse(response.body);
      expect(body.metrics.approvalRate).toBe(70);
    });
  });

  describe('GET /api/dashboard/charts', () => {
    it('should return empty chart data when no data exists', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/dashboard/charts',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body).toHaveProperty('chartData');
      expect(body.chartData).toHaveProperty('postsByDay');
      expect(body.chartData).toHaveProperty('scoreDistribution');
      expect(Array.isArray(body.chartData.postsByDay)).toBe(true);
      expect(Array.isArray(body.chartData.scoreDistribution)).toBe(true);
    });

    it('should return 7 days of postsByDay data', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/dashboard/charts',
      });

      const body = JSON.parse(response.body);
      expect(body.chartData.postsByDay.length).toBe(7);
    });

    it('should return all score ranges in distribution', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/dashboard/charts',
      });

      const body = JSON.parse(response.body);
      const ranges = body.chartData.scoreDistribution.map(
        (d: { range: string }) => d.range
      );

      expect(ranges).toContain('0-2');
      expect(ranges).toContain('2-4');
      expect(ranges).toContain('4-6');
      expect(ranges).toContain('6-8');
      expect(ranges).toContain('8-10');
    });

    it('should correctly count posts by platform', async () => {
      const executionId = uuidv4();
      testDb
        .prepare(
          `
        INSERT INTO executions (id, started_at, status, config)
        VALUES (?, datetime('now'), 'completed', '{}')
      `
        )
        .run(executionId);

      // Create 3 Instagram posts
      for (let i = 0; i < 3; i++) {
        testDb
          .prepare(
            `
          INSERT INTO posts (id, execution_id, topic, text_ig, status, created_at)
          VALUES (?, ?, ?, ?, 'approved', datetime('now'))
        `
          )
          .run(uuidv4(), executionId, `IG Topic ${i}`, `IG Content ${i}`);
      }

      // Create 2 LinkedIn posts
      for (let i = 0; i < 2; i++) {
        testDb
          .prepare(
            `
          INSERT INTO posts (id, execution_id, topic, text_linkedin, status, created_at)
          VALUES (?, ?, ?, ?, 'approved', datetime('now'))
        `
          )
          .run(uuidv4(), executionId, `LI Topic ${i}`, `LI Content ${i}`);
      }

      const response = await app.inject({
        method: 'GET',
        url: '/api/dashboard/charts',
      });

      const body = JSON.parse(response.body);

      // Find today's data
      const today = new Date().toISOString().split('T')[0];
      const todayData = body.chartData.postsByDay.find(
        (d: { date: string }) => d.date === today
      );

      expect(todayData).toBeDefined();
      expect(todayData.instagram).toBe(3);
      expect(todayData.linkedin).toBe(2);
      expect(todayData.count).toBe(5);
    });
  });

  describe('GET /api/dashboard/recent-posts', () => {
    it('should return empty array when no posts exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/dashboard/recent-posts',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body).toHaveProperty('posts');
      expect(Array.isArray(body.posts)).toBe(true);
      expect(body.posts.length).toBe(0);
    });

    it('should return recent posts with correct structure', async () => {
      const executionId = uuidv4();
      const postId = uuidv4();

      testDb
        .prepare(
          `
        INSERT INTO executions (id, started_at, status, config)
        VALUES (?, datetime('now'), 'completed', '{}')
      `
        )
        .run(executionId);

      testDb
        .prepare(
          `
        INSERT INTO posts (id, execution_id, topic, text_ig, status, created_at)
        VALUES (?, ?, 'Test Topic', 'Test Content', 'approved', datetime('now'))
      `
        )
        .run(postId, executionId);

      testDb
        .prepare(
          `
        INSERT INTO scores (id, post_id, overall_score, criteria_breakdown, approved)
        VALUES (?, ?, 8.5, '{}', 1)
      `
        )
        .run(uuidv4(), postId);

      const response = await app.inject({
        method: 'GET',
        url: '/api/dashboard/recent-posts',
      });

      const body = JSON.parse(response.body);

      expect(body.posts.length).toBe(1);
      expect(body.posts[0]).toHaveProperty('id', postId);
      expect(body.posts[0]).toHaveProperty('topic', 'Test Topic');
      expect(body.posts[0]).toHaveProperty('platform', 'instagram');
      expect(body.posts[0]).toHaveProperty('score', 8.5);
      expect(body.posts[0]).toHaveProperty('status', 'approved');
    });

    it('should respect limit parameter', async () => {
      const executionId = uuidv4();

      testDb
        .prepare(
          `
        INSERT INTO executions (id, started_at, status, config)
        VALUES (?, datetime('now'), 'completed', '{}')
      `
        )
        .run(executionId);

      // Create 10 posts
      for (let i = 0; i < 10; i++) {
        testDb
          .prepare(
            `
          INSERT INTO posts (id, execution_id, topic, text_ig, status, created_at)
          VALUES (?, ?, ?, ?, 'approved', datetime('now', '-' || ? || ' seconds'))
        `
          )
          .run(uuidv4(), executionId, `Topic ${i}`, `Content ${i}`, i);
      }

      const response = await app.inject({
        method: 'GET',
        url: '/api/dashboard/recent-posts?limit=3',
      });

      const body = JSON.parse(response.body);
      expect(body.posts.length).toBe(3);
    });

    it('should default to 5 posts', async () => {
      const executionId = uuidv4();

      testDb
        .prepare(
          `
        INSERT INTO executions (id, started_at, status, config)
        VALUES (?, datetime('now'), 'completed', '{}')
      `
        )
        .run(executionId);

      // Create 10 posts
      for (let i = 0; i < 10; i++) {
        testDb
          .prepare(
            `
          INSERT INTO posts (id, execution_id, topic, text_ig, status, created_at)
          VALUES (?, ?, ?, ?, 'approved', datetime('now'))
        `
          )
          .run(uuidv4(), executionId, `Topic ${i}`, `Content ${i}`);
      }

      const response = await app.inject({
        method: 'GET',
        url: '/api/dashboard/recent-posts',
      });

      const body = JSON.parse(response.body);
      expect(body.posts.length).toBe(5);
    });
  });
});
