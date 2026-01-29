/**
 * Templates API Routes
 * Story 5.7 - Editor de Templates de Carrossel
 *
 * REST API endpoints for template management.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createLogger } from '@social-content/shared';
import type {
  CreateTemplateInput,
  UpdateTemplateInput,
  ExportedTemplate,
  TemplateSlideType,
} from '@social-content/shared';
import {
  getTemplateService,
  TemplateNotFoundError,
  CannotDeleteDefaultTemplateError,
  TemplateNameExistsError,
  InvalidImportError,
} from '../services/template.service';

const logger = createLogger('routes:templates');

// Request body/param types
interface IdParams {
  id: string;
}

interface PreviewQuery {
  type?: TemplateSlideType;
}

/**
 * Registers template routes on the Fastify instance.
 */
export async function templatesRoutes(fastify: FastifyInstance): Promise<void> {
  const service = getTemplateService();

  /**
   * GET /api/templates - List all templates
   */
  fastify.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      logger.debug('GET /api/templates');
      const templates = await service.listTemplates();
      return reply.send({ templates, total: templates.length });
    } catch (error) {
      logger.error('Error listing templates', { error });
      return reply.status(500).send({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list templates',
          timestamp: new Date().toISOString(),
        },
      });
    }
  });

  /**
   * GET /api/templates/:id - Get template by ID
   */
  fastify.get<{ Params: IdParams }>(
    '/:id',
    async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        logger.debug('GET /api/templates/:id', { id });

        const template = await service.getTemplate(id);
        return reply.send(template);
      } catch (error) {
        if (error instanceof TemplateNotFoundError) {
          return reply.status(404).send({
            error: {
              code: error.code,
              message: error.message,
              timestamp: new Date().toISOString(),
            },
          });
        }
        logger.error('Error getting template', { error });
        return reply.status(500).send({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to get template',
            timestamp: new Date().toISOString(),
          },
        });
      }
    }
  );

  /**
   * POST /api/templates - Create new template
   */
  fastify.post<{ Body: CreateTemplateInput }>(
    '/',
    async (request: FastifyRequest<{ Body: CreateTemplateInput }>, reply: FastifyReply) => {
      try {
        const input = request.body;
        logger.debug('POST /api/templates', { name: input.name });

        // Validate required fields
        if (!input.name || typeof input.name !== 'string' || input.name.trim() === '') {
          return reply.status(400).send({
            error: {
              code: 'INVALID_NAME',
              message: 'Template name is required',
              timestamp: new Date().toISOString(),
            },
          });
        }

        if (!input.theme) {
          return reply.status(400).send({
            error: {
              code: 'INVALID_THEME',
              message: 'Template theme is required',
              timestamp: new Date().toISOString(),
            },
          });
        }

        const template = await service.createTemplate(input);
        return reply.status(201).send(template);
      } catch (error) {
        if (error instanceof TemplateNameExistsError) {
          return reply.status(409).send({
            error: {
              code: error.code,
              message: error.message,
              timestamp: new Date().toISOString(),
            },
          });
        }
        logger.error('Error creating template', { error });
        return reply.status(500).send({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create template',
            timestamp: new Date().toISOString(),
          },
        });
      }
    }
  );

  /**
   * PUT /api/templates/:id - Update template
   */
  fastify.put<{ Params: IdParams; Body: UpdateTemplateInput }>(
    '/:id',
    async (
      request: FastifyRequest<{ Params: IdParams; Body: UpdateTemplateInput }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const input = request.body;
        logger.debug('PUT /api/templates/:id', { id });

        const template = await service.updateTemplate(id, input);
        return reply.send(template);
      } catch (error) {
        if (error instanceof TemplateNotFoundError) {
          return reply.status(404).send({
            error: {
              code: error.code,
              message: error.message,
              timestamp: new Date().toISOString(),
            },
          });
        }
        if (error instanceof TemplateNameExistsError) {
          return reply.status(409).send({
            error: {
              code: error.code,
              message: error.message,
              timestamp: new Date().toISOString(),
            },
          });
        }
        logger.error('Error updating template', { error });
        return reply.status(500).send({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update template',
            timestamp: new Date().toISOString(),
          },
        });
      }
    }
  );

  /**
   * DELETE /api/templates/:id - Delete template
   */
  fastify.delete<{ Params: IdParams }>(
    '/:id',
    async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        logger.debug('DELETE /api/templates/:id', { id });

        await service.deleteTemplate(id);
        return reply.send({ success: true });
      } catch (error) {
        if (error instanceof TemplateNotFoundError) {
          return reply.status(404).send({
            error: {
              code: error.code,
              message: error.message,
              timestamp: new Date().toISOString(),
            },
          });
        }
        if (error instanceof CannotDeleteDefaultTemplateError) {
          return reply.status(403).send({
            error: {
              code: error.code,
              message: error.message,
              timestamp: new Date().toISOString(),
            },
          });
        }
        logger.error('Error deleting template', { error });
        return reply.status(500).send({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to delete template',
            timestamp: new Date().toISOString(),
          },
        });
      }
    }
  );

  /**
   * GET /api/templates/:id/export - Export template as JSON
   */
  fastify.get<{ Params: IdParams }>(
    '/:id/export',
    async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        logger.debug('GET /api/templates/:id/export', { id });

        const exported = await service.exportTemplate(id);
        return reply.send(exported);
      } catch (error) {
        if (error instanceof TemplateNotFoundError) {
          return reply.status(404).send({
            error: {
              code: error.code,
              message: error.message,
              timestamp: new Date().toISOString(),
            },
          });
        }
        logger.error('Error exporting template', { error });
        return reply.status(500).send({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to export template',
            timestamp: new Date().toISOString(),
          },
        });
      }
    }
  );

  /**
   * POST /api/templates/import - Import template from JSON
   */
  fastify.post<{ Body: ExportedTemplate }>(
    '/import',
    async (request: FastifyRequest<{ Body: ExportedTemplate }>, reply: FastifyReply) => {
      try {
        const json = request.body;
        logger.debug('POST /api/templates/import', { name: json.template?.name });

        const template = await service.importTemplate(json);
        return reply.status(201).send(template);
      } catch (error) {
        if (error instanceof InvalidImportError) {
          return reply.status(400).send({
            error: {
              code: error.code,
              message: error.message,
              timestamp: new Date().toISOString(),
            },
          });
        }
        if (error instanceof TemplateNameExistsError) {
          return reply.status(409).send({
            error: {
              code: error.code,
              message: error.message,
              timestamp: new Date().toISOString(),
            },
          });
        }
        logger.error('Error importing template', { error });
        return reply.status(500).send({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to import template',
            timestamp: new Date().toISOString(),
          },
        });
      }
    }
  );

  /**
   * POST /api/templates/:id/duplicate - Duplicate template
   */
  fastify.post<{ Params: IdParams; Body: { name?: string } }>(
    '/:id/duplicate',
    async (
      request: FastifyRequest<{ Params: IdParams; Body: { name?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const { name } = request.body || {};
        logger.debug('POST /api/templates/:id/duplicate', { id, newName: name });

        const template = await service.duplicateTemplate(id, name);
        return reply.status(201).send(template);
      } catch (error) {
        if (error instanceof TemplateNotFoundError) {
          return reply.status(404).send({
            error: {
              code: error.code,
              message: error.message,
              timestamp: new Date().toISOString(),
            },
          });
        }
        if (error instanceof TemplateNameExistsError) {
          return reply.status(409).send({
            error: {
              code: error.code,
              message: error.message,
              timestamp: new Date().toISOString(),
            },
          });
        }
        logger.error('Error duplicating template', { error });
        return reply.status(500).send({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to duplicate template',
            timestamp: new Date().toISOString(),
          },
        });
      }
    }
  );

  /**
   * GET /api/templates/:id/preview - Generate template preview
   * Note: This is a placeholder that returns template data for client-side rendering
   */
  fastify.get<{ Params: IdParams; Querystring: PreviewQuery }>(
    '/:id/preview',
    async (
      request: FastifyRequest<{ Params: IdParams; Querystring: PreviewQuery }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const { type = 'cover' } = request.query;
        logger.debug('GET /api/templates/:id/preview', { id, type });

        const template = await service.getTemplate(id);

        // Return template with sample data for client-side rendering
        const sampleData = getSampleData(type);

        return reply.send({
          template,
          slideType: type,
          sampleData,
        });
      } catch (error) {
        if (error instanceof TemplateNotFoundError) {
          return reply.status(404).send({
            error: {
              code: error.code,
              message: error.message,
              timestamp: new Date().toISOString(),
            },
          });
        }
        logger.error('Error generating preview', { error });
        return reply.status(500).send({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to generate preview',
            timestamp: new Date().toISOString(),
          },
        });
      }
    }
  );
}

/**
 * Returns sample data for preview based on slide type.
 */
function getSampleData(type: TemplateSlideType): Record<string, unknown> {
  switch (type) {
    case 'cover':
      return {
        title: '5 Dicas de TypeScript',
        subtitle: 'Para desenvolvedores',
        handle: '@dev',
      };
    case 'content':
      return {
        title: '1. Use Type Guards',
        content: 'Type guards permitem verificar tipos em runtime de forma segura.',
        slideNumber: '2/5',
        handle: '@dev',
      };
    case 'code':
      return {
        title: 'Exemplo de Type Guard',
        language: 'typescript',
        code: `function isString(value: unknown): value is string {
  return typeof value === 'string';
}`,
        handle: '@dev',
      };
    case 'cta':
      return {
        cta: 'Gostou? Salve e compartilhe!',
        handle: '@dev',
      };
    default:
      return {};
  }
}
