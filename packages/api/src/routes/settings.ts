/**
 * Settings API Routes
 * Story 5.6: Pagina de Configuracoes
 *
 * RESTful endpoints for managing application settings.
 */

import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { PartialSettingsSchema } from '@social-content/shared';
import { SettingsService } from '../services/settings.service';
import { getDatabase } from '../database';

interface UpdateSettingsBody {
  settings: unknown;
}

/**
 * Settings routes
 * Prefix: /api/settings
 */
export const settingsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Create settings service with database connection
  const db = getDatabase();
  const settingsService = new SettingsService(db);

  /**
   * GET /api/settings
   * Returns current settings
   */
  fastify.get('/', async (_request, reply) => {
    try {
      const result = await settingsService.getSettings();
      return result;
    } catch (error) {
      fastify.log.error({ error }, 'Failed to get settings');
      return reply.status(500).send({
        error: 'Failed to retrieve settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * PUT /api/settings
   * Updates settings (partial update supported)
   */
  fastify.put<{ Body: UpdateSettingsBody }>('/', async (request, reply) => {
    const { settings } = request.body;

    if (!settings || typeof settings !== 'object') {
      return reply.status(400).send({
        error: 'Invalid request',
        message: 'Request body must contain a settings object',
      });
    }

    // Validate with Zod
    const validation = PartialSettingsSchema.safeParse(settings);
    if (!validation.success) {
      return reply.status(400).send({
        error: 'Validation failed',
        details: validation.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    try {
      const result = await settingsService.updateSettings(validation.data);

      fastify.log.info({
        event: 'settings_updated',
        changes: Object.keys(validation.data),
      });

      return result;
    } catch (error) {
      fastify.log.error({ error }, 'Failed to update settings');
      return reply.status(500).send({
        error: 'Failed to update settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/settings/reset
   * Resets all settings to defaults
   */
  fastify.post('/reset', async (_request, reply) => {
    try {
      const result = await settingsService.resetToDefaults();

      fastify.log.info({ event: 'settings_reset' });

      return result;
    } catch (error) {
      fastify.log.error({ error }, 'Failed to reset settings');
      return reply.status(500).send({
        error: 'Failed to reset settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/settings/sources
   * Returns only sources settings
   */
  fastify.get('/sources', async (_request, reply) => {
    try {
      const sources = await settingsService.getSources();
      return { sources };
    } catch (error) {
      fastify.log.error({ error }, 'Failed to get sources settings');
      return reply.status(500).send({
        error: 'Failed to retrieve sources settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/settings/quality
   * Returns only quality settings
   */
  fastify.get('/quality', async (_request, reply) => {
    try {
      const quality = await settingsService.getQuality();
      return { quality };
    } catch (error) {
      fastify.log.error({ error }, 'Failed to get quality settings');
      return reply.status(500).send({
        error: 'Failed to retrieve quality settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};
