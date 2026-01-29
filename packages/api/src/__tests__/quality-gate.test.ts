// Quality Gate API Tests - Social Content Agent
// Story 4.6: Quality Gate e Threshold

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createServer } from '../server';
import { resetQualityGateConfig } from '@social-content/shared';

describe('Quality Gate API Endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createServer({ logger: false, skipDatabase: true });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    resetQualityGateConfig();
  });

  describe('GET /api/config/threshold', () => {
    it('should return current threshold configuration', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/config/threshold',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body).toHaveProperty('threshold', 6.0);
      expect(body).toHaveProperty('autoRegenerate', true);
      expect(body).toHaveProperty('maxRegenerations', 1);
    });
  });

  describe('PUT /api/config/threshold', () => {
    it('should update threshold with valid value', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/config/threshold',
        payload: { threshold: 7.5 },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(true);
      expect(body.threshold).toBe(7.5);
      expect(body.message).toContain('7.5');
    });

    it('should round threshold to 0.1 precision', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/config/threshold',
        payload: { threshold: 7.55 },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.threshold).toBe(7.6);
    });

    it('should return error for missing threshold', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/config/threshold',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);

      expect(body.error).toBe('Invalid threshold');
    });

    it('should return error for threshold below 0', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/config/threshold',
        payload: { threshold: -1 },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);

      expect(body.error).toBe('Invalid threshold');
      expect(body.message).toContain('between 0 and 10');
    });

    it('should return error for threshold above 10', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/config/threshold',
        payload: { threshold: 11 },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);

      expect(body.error).toBe('Invalid threshold');
    });

    it('should return error for non-numeric threshold', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/config/threshold',
        payload: { threshold: 'high' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);

      expect(body.error).toBe('Invalid threshold');
      expect(body.message).toContain('must be a number');
    });

    it('should persist updated threshold', async () => {
      // Update threshold
      await app.inject({
        method: 'PUT',
        url: '/api/config/threshold',
        payload: { threshold: 8.0 },
      });

      // Verify it persisted
      const response = await app.inject({
        method: 'GET',
        url: '/api/config/threshold',
      });

      const body = JSON.parse(response.body);
      expect(body.threshold).toBe(8.0);
    });
  });

  describe('PUT /api/config/quality-gate', () => {
    it('should update multiple config fields', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/config/quality-gate',
        payload: {
          threshold: 7.0,
          autoRegenerate: false,
          maxRegenerations: 2,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.threshold).toBe(7.0);
      expect(body.autoRegenerate).toBe(false);
      expect(body.maxRegenerations).toBe(2);
    });

    it('should allow partial updates', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/config/quality-gate',
        payload: { autoRegenerate: false },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.threshold).toBe(6.0);
      expect(body.autoRegenerate).toBe(false);
    });

    it('should validate maxRegenerations range', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/config/quality-gate',
        payload: { maxRegenerations: 6 },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);

      expect(body.error).toBe('Invalid maxRegenerations');
    });
  });

  describe('GET /api/metrics/quality', () => {
    it('should return quality metrics for default period', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/metrics/quality',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body).toHaveProperty('totalPosts');
      expect(body).toHaveProperty('approvedCount');
      expect(body).toHaveProperty('needsReviewCount');
      expect(body).toHaveProperty('approvalRate');
      expect(body).toHaveProperty('averageScore');
      expect(body).toHaveProperty('scoreDistribution');
      expect(body).toHaveProperty('period', '7d');
      expect(body).toHaveProperty('cached');
    });

    it('should accept period parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/metrics/quality?period=24h',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.period).toBe('24h');
    });

    it('should accept all valid periods', async () => {
      const periods = ['24h', '7d', '30d', 'all'];

      for (const period of periods) {
        const response = await app.inject({
          method: 'GET',
          url: `/api/metrics/quality?period=${period}`,
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.period).toBe(period);
      }
    });

    it('should return error for invalid period', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/metrics/quality?period=invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);

      expect(body.error).toBe('Invalid period');
    });

    it('should return score distribution with correct buckets', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/metrics/quality',
      });

      const body = JSON.parse(response.body);

      expect(body.scoreDistribution).toHaveProperty('0-2');
      expect(body.scoreDistribution).toHaveProperty('2-4');
      expect(body.scoreDistribution).toHaveProperty('4-6');
      expect(body.scoreDistribution).toHaveProperty('6-8');
      expect(body.scoreDistribution).toHaveProperty('8-10');
    });

    it('should use cached result within TTL', async () => {
      // First request
      const response1 = await app.inject({
        method: 'GET',
        url: '/api/metrics/quality',
      });

      // Second request should be cached
      const response2 = await app.inject({
        method: 'GET',
        url: '/api/metrics/quality',
      });

      // Parse first response to ensure it's valid (we don't need the value)
      JSON.parse(response1.body);
      const body2 = JSON.parse(response2.body);

      // Second request should indicate cached
      expect(body2.cached).toBe(true);
    });
  });

  describe('GET /api/metrics/quality/distribution', () => {
    it('should return distribution data', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/metrics/quality/distribution',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body).toHaveProperty('distribution');
      expect(body).toHaveProperty('totalPosts');
      expect(body).toHaveProperty('labels');
      expect(body).toHaveProperty('calculatedAt');
      expect(body.labels).toEqual(['0-2', '2-4', '4-6', '6-8', '8-10']);
    });
  });

  describe('DELETE /api/metrics/quality/cache', () => {
    it('should clear metrics cache', async () => {
      // First, make a request to populate cache
      await app.inject({
        method: 'GET',
        url: '/api/metrics/quality',
      });

      // Clear cache
      const clearResponse = await app.inject({
        method: 'DELETE',
        url: '/api/metrics/quality/cache',
      });

      expect(clearResponse.statusCode).toBe(200);
      const body = JSON.parse(clearResponse.body);
      expect(body.success).toBe(true);

      // Next request should not be cached
      const response = await app.inject({
        method: 'GET',
        url: '/api/metrics/quality',
      });

      const metricsBody = JSON.parse(response.body);
      expect(metricsBody.cached).toBe(false);
    });
  });
});
