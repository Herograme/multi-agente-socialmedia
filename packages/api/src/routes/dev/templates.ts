/**
 * Development Template Preview Routes
 * Story 3.3 - Templates HTML/CSS para Slides
 *
 * Provides endpoints for previewing carousel templates during development.
 * These routes are only available in non-production environments.
 */

import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { join } from 'path';
import {
  renderTemplate,
  isValidTemplateType,
  getTemplateTypes,
  highlightCode,
  type TemplateType,
  type TemplateVariables,
} from '@social-content/agents';

/**
 * Example data for each template type
 */
const EXAMPLE_DATA: Record<TemplateType, TemplateVariables> = {
  cover: {
    title: '5 Dicas de TypeScript que vao mudar seu codigo',
    subtitle: 'Do basico ao avancado',
    handle: '@devmaster',
    backgroundImage: '',
    overlayOpacity: '0.7',
  },
  content: {
    title: '1. Use Type Guards',
    content:
      'Type guards sao funcoes que verificam o tipo em runtime, permitindo que o TypeScript infira o tipo correto dentro do bloco condicional.',
    code: 'function isString(value: unknown): value is string {\n  return typeof value === "string";\n}',
    handle: '@devmaster',
    slideNumber: '2/5',
    backgroundImage: '',
    overlayOpacity: '0.8',
  },
  code: {
    title: 'Utility Types Avancados',
    language: 'typescript',
    code: `type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

// Uso
interface User {
  name: string;
  settings: {
    theme: string;
    notifications: boolean;
  };
}

const partial: DeepPartial<User> = {
  settings: { theme: 'dark' }
};`,
    handle: '@devmaster',
    backgroundImage: '',
    overlayOpacity: '0.85',
  },
  cta: {
    cta: 'Gostou das dicas? Salve esse post!',
    handle: '@devmaster',
    socialIcons: true,
    backgroundImage: '',
    overlayOpacity: '0.7',
  },
};

/**
 * Development templates routes plugin
 * Only registered in non-production environments
 */
export const devTemplatesRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Only enable in development
  if (process.env['NODE_ENV'] === 'production') {
    fastify.log.info('Dev templates routes disabled in production');
    return;
  }

  /**
   * GET /dev/templates
   * List all available templates with usage instructions
   */
  fastify.get('/dev/templates', async (_request, _reply) => {
    return {
      templates: getTemplateTypes(),
      usage: 'GET /dev/templates/:templateName',
      example: 'GET /dev/templates/cover?title=Meu%20Titulo',
      note: 'Query params can override any template variable',
    };
  });

  /**
   * GET /dev/templates/:templateName
   * Render a template with example data or custom query params
   */
  fastify.get<{
    Params: { templateName: string };
    Querystring: Record<string, string>;
  }>('/dev/templates/:templateName', async (request, reply) => {
    const { templateName } = request.params;
    const queryParams = request.query;

    // Validate template type
    if (!isValidTemplateType(templateName)) {
      return reply.status(404).send({
        error: `Template '${templateName}' not found`,
        available: getTemplateTypes(),
      });
    }

    const templateType = templateName as TemplateType;
    const exampleData = EXAMPLE_DATA[templateType];

    // Merge example data with query param overrides
    const variables: TemplateVariables = {
      ...exampleData,
      ...queryParams,
      // Convert string 'true'/'false' to boolean for socialIcons
      socialIcons:
        queryParams['socialIcons'] !== undefined
          ? queryParams['socialIcons'] === 'true'
          : exampleData.socialIcons,
    };

    try {
      // For code template, generate highlighted code
      if (templateType === 'code' && variables.code) {
        const highlighted = await highlightCode(variables.code, {
          language: (variables.language as 'typescript') || 'typescript',
          theme: 'dracula',
        });
        variables.highlightedCode = highlighted.html;
        variables.shikiStyles = highlighted.css;
      }

      // Templates are in the project root, not in packages/api
      const templatesDir = join(process.cwd(), '..', '..', 'templates', 'carousel');
      const html = await renderTemplate(templateType, variables, templatesDir);

      reply.header('Content-Type', 'text/html; charset=utf-8');
      return reply.send(html);
    } catch (error) {
      fastify.log.error(error, 'Failed to render template');
      return reply.status(500).send({
        error: 'Failed to render template',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};
