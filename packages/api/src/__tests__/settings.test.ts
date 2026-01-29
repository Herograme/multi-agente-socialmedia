/**
 * Settings API Tests
 * Story 5.6: Pagina de Configuracoes
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import type { Settings, SettingsResponse } from '@social-content/shared';
import { DEFAULT_SETTINGS } from '@social-content/shared';

// Mock the quality metrics service to avoid dependency issues
vi.mock('../routes/metrics/quality', () => ({
  qualityMetricsRoutes: async () => {},
}));

vi.mock('../routes/metrics/dashboard', () => ({
  dashboardMetricsRoutes: async () => {},
}));

// TODO: Fix vitest workspace module resolution for shared imports
describe.skip('Settings API Endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    // Dynamic import to allow mocks to be set up first
    const { createServer } = await import('../server');
    const { resetDatabase } = await import('../database');

    // Reset database before tests
    resetDatabase();

    app = await createServer({
      logger: false,
      skipWebSocket: true,
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    const { resetDatabase } = await import('../database');
    resetDatabase();
  });

  beforeEach(async () => {
    // Reset settings before each test
    const { getDatabase } = await import('../database');
    const db = getDatabase();
    try {
      db.exec("DELETE FROM config WHERE key = 'app_settings'");
    } catch {
      // Table may not exist yet
    }
  });

  describe('GET /api/settings', () => {
    it('should return default settings when none configured', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/settings',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as SettingsResponse;

      expect(body).toHaveProperty('settings');
      expect(body).toHaveProperty('isDefault');
      expect(body.isDefault).toBe(true);
      expect(body.settings).toHaveProperty('sources');
      expect(body.settings).toHaveProperty('llm');
      expect(body.settings).toHaveProperty('image');
      expect(body.settings).toHaveProperty('quality');
      expect(body.settings).toHaveProperty('output');
    });

    it('should return default threshold of 6.0', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/settings',
      });

      const body = JSON.parse(response.body) as SettingsResponse;
      expect(body.settings.quality.threshold).toBe(6.0);
    });

    it('should return all default sources enabled', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/settings',
      });

      const body = JSON.parse(response.body) as SettingsResponse;
      expect(body.settings.sources.devto).toBe(true);
      expect(body.settings.sources.hackernews).toBe(true);
      expect(body.settings.sources.reddit).toBe(true);
    });
  });

  describe('PUT /api/settings', () => {
    it('should update settings successfully', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/settings',
        payload: {
          settings: {
            quality: { threshold: 7.0, autoRegenerate: true, maxRegenerations: 2 },
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as SettingsResponse;
      expect(body.settings.quality.threshold).toBe(7.0);
      expect(body.settings.quality.maxRegenerations).toBe(2);
      expect(body.isDefault).toBe(false);
    });

    it('should reject invalid threshold (> 10)', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/settings',
        payload: {
          settings: {
            quality: { threshold: 15 },
          },
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject invalid threshold (< 0)', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/settings',
        payload: {
          settings: {
            quality: { threshold: -1 },
          },
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should merge partial updates with existing settings', async () => {
      // First, set sources
      await app.inject({
        method: 'PUT',
        url: '/api/settings',
        payload: {
          settings: {
            sources: { devto: true, hackernews: true, reddit: false },
          },
        },
      });

      // Then, update only quality
      const response = await app.inject({
        method: 'PUT',
        url: '/api/settings',
        payload: {
          settings: {
            quality: { threshold: 8.0, autoRegenerate: false, maxRegenerations: 1 },
          },
        },
      });

      const body = JSON.parse(response.body) as SettingsResponse;

      // Sources should maintain the previous value
      expect(body.settings.sources.reddit).toBe(false);
      // Quality should have the new value
      expect(body.settings.quality.threshold).toBe(8.0);
    });

    it('should persist settings between requests', async () => {
      // Update settings
      await app.inject({
        method: 'PUT',
        url: '/api/settings',
        payload: {
          settings: {
            llm: {
              primaryProvider: 'gemini',
              fallbackOrder: ['groq'],
            },
          },
        },
      });

      // Get settings
      const response = await app.inject({
        method: 'GET',
        url: '/api/settings',
      });

      const body = JSON.parse(response.body) as SettingsResponse;
      expect(body.settings.llm.primaryProvider).toBe('gemini');
      expect(body.settings.llm.fallbackOrder).toEqual(['groq']);
    });

    it('should reject empty settings object', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/settings',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });

    it('should update image settings correctly', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/settings',
        payload: {
          settings: {
            image: {
              provider: 'leonardo',
              enabled: false,
              preferredStyle: 'minimalist, clean',
              aspectRatio: '16:9',
            },
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as SettingsResponse;
      expect(body.settings.image.provider).toBe('leonardo');
      expect(body.settings.image.enabled).toBe(false);
      expect(body.settings.image.aspectRatio).toBe('16:9');
    });

    it('should update output settings correctly', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/settings',
        payload: {
          settings: {
            output: {
              directory: './custom-output',
              enableCarousel: true,
              enablePdf: false,
              slidesPerCarousel: 6,
              imageResolution: '1200x1200',
            },
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as SettingsResponse;
      expect(body.settings.output.directory).toBe('./custom-output');
      expect(body.settings.output.enablePdf).toBe(false);
      expect(body.settings.output.slidesPerCarousel).toBe(6);
      expect(body.settings.output.imageResolution).toBe('1200x1200');
    });
  });

  describe('POST /api/settings/reset', () => {
    it('should reset settings to defaults', async () => {
      // First, modify settings
      await app.inject({
        method: 'PUT',
        url: '/api/settings',
        payload: {
          settings: {
            quality: { threshold: 9.0, autoRegenerate: false, maxRegenerations: 5 },
          },
        },
      });

      // Then reset
      const response = await app.inject({
        method: 'POST',
        url: '/api/settings/reset',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as SettingsResponse;

      expect(body.isDefault).toBe(true);
      expect(body.settings.quality.threshold).toBe(DEFAULT_SETTINGS.quality.threshold);
      expect(body.settings.quality.autoRegenerate).toBe(DEFAULT_SETTINGS.quality.autoRegenerate);
    });

    it('should maintain defaults after reset on subsequent GET', async () => {
      // Modify settings
      await app.inject({
        method: 'PUT',
        url: '/api/settings',
        payload: {
          settings: {
            sources: { devto: false, hackernews: false, reddit: true },
          },
        },
      });

      // Reset
      await app.inject({
        method: 'POST',
        url: '/api/settings/reset',
      });

      // Verify with GET
      const response = await app.inject({
        method: 'GET',
        url: '/api/settings',
      });

      const body = JSON.parse(response.body) as SettingsResponse;
      expect(body.isDefault).toBe(true);
      expect(body.settings.sources).toEqual(DEFAULT_SETTINGS.sources);
    });
  });

  describe('GET /api/settings/sources', () => {
    it('should return only sources settings', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/settings/sources',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as { sources: Settings['sources'] };
      expect(body.sources).toHaveProperty('devto');
      expect(body.sources).toHaveProperty('hackernews');
      expect(body.sources).toHaveProperty('reddit');
    });
  });

  describe('GET /api/settings/quality', () => {
    it('should return only quality settings', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/settings/quality',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as { quality: Settings['quality'] };
      expect(body.quality).toHaveProperty('threshold');
      expect(body.quality).toHaveProperty('autoRegenerate');
      expect(body.quality).toHaveProperty('maxRegenerations');
    });
  });
});
