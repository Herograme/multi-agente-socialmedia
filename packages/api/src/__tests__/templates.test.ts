/**
 * Templates API Tests
 * Story 5.7 - Editor de Templates de Carrossel
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createServer } from '../server';
import type { FastifyInstance } from 'fastify';
import { DEFAULT_TEMPLATE_THEME } from '@social-content/shared';

// TODO: Fix vitest workspace module resolution for DEFAULT_TEMPLATE_THEME
describe.skip('Templates API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createServer({ logger: false, skipWebSocket: true });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/templates', () => {
    it('should return all templates including default', async () => {
      const response = await request(app.server).get('/api/templates');

      expect(response.status).toBe(200);
      expect(response.body.templates).toBeDefined();
      expect(Array.isArray(response.body.templates)).toBe(true);
      expect(response.body.templates.length).toBeGreaterThanOrEqual(1);

      // Check that default template exists
      const defaultTemplate = response.body.templates.find((t: { isDefault: boolean }) => t.isDefault);
      expect(defaultTemplate).toBeDefined();
      expect(defaultTemplate.name).toBe('Default Dark');
    });

    it('should return total count', async () => {
      const response = await request(app.server).get('/api/templates');

      expect(response.status).toBe(200);
      expect(response.body.total).toBeDefined();
      expect(typeof response.body.total).toBe('number');
    });
  });

  describe('GET /api/templates/:id', () => {
    it('should return template by id', async () => {
      const response = await request(app.server).get('/api/templates/default');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('default');
      expect(response.body.name).toBe('Default Dark');
      expect(response.body.isDefault).toBe(true);
      expect(response.body.theme).toBeDefined();
      expect(response.body.theme.colors).toBeDefined();
      expect(response.body.theme.fonts).toBeDefined();
      expect(response.body.theme.branding).toBeDefined();
    });

    it('should return 404 for non-existent template', async () => {
      const response = await request(app.server).get('/api/templates/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('TEMPLATE_NOT_FOUND');
    });
  });

  describe('POST /api/templates', () => {
    it('should create a new template', async () => {
      const newTemplate = {
        name: 'Test Template',
        description: 'A test template',
        theme: DEFAULT_TEMPLATE_THEME,
      };

      const response = await request(app.server)
        .post('/api/templates')
        .send(newTemplate);

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe('Test Template');
      expect(response.body.description).toBe('A test template');
      expect(response.body.isDefault).toBe(false);
      expect(response.body.theme).toBeDefined();
    });

    it('should return 400 for missing name', async () => {
      const response = await request(app.server)
        .post('/api/templates')
        .send({ theme: DEFAULT_TEMPLATE_THEME });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_NAME');
    });

    it('should return 400 for missing theme', async () => {
      const response = await request(app.server)
        .post('/api/templates')
        .send({ name: 'Missing Theme' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_THEME');
    });

    it('should return 409 for duplicate name', async () => {
      const template = {
        name: 'Duplicate Test',
        theme: DEFAULT_TEMPLATE_THEME,
      };

      // Create first
      await request(app.server).post('/api/templates').send(template);

      // Try to create duplicate
      const response = await request(app.server)
        .post('/api/templates')
        .send(template);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('TEMPLATE_NAME_EXISTS');
    });
  });

  describe('PUT /api/templates/:id', () => {
    let createdTemplateId: string;

    beforeEach(async () => {
      // Create a template to update
      const response = await request(app.server)
        .post('/api/templates')
        .send({
          name: `Update Test ${Date.now()}`,
          theme: DEFAULT_TEMPLATE_THEME,
        });
      createdTemplateId = response.body.id;
    });

    it('should update template name', async () => {
      const response = await request(app.server)
        .put(`/api/templates/${createdTemplateId}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
    });

    it('should update template theme', async () => {
      const response = await request(app.server)
        .put(`/api/templates/${createdTemplateId}`)
        .send({
          theme: {
            colors: {
              bgPrimary: '#ffffff',
            },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.theme.colors.bgPrimary).toBe('#ffffff');
    });

    it('should return 404 for non-existent template', async () => {
      const response = await request(app.server)
        .put('/api/templates/non-existent')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/templates/:id', () => {
    it('should prevent deletion of default template', async () => {
      const response = await request(app.server).delete('/api/templates/default');

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('CANNOT_DELETE_DEFAULT');
    });

    it('should delete non-default template', async () => {
      // Create a template
      const createResponse = await request(app.server)
        .post('/api/templates')
        .send({
          name: `Delete Test ${Date.now()}`,
          theme: DEFAULT_TEMPLATE_THEME,
        });

      const templateId = createResponse.body.id;

      // Delete it
      const response = await request(app.server).delete(`/api/templates/${templateId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify it's gone
      const getResponse = await request(app.server).get(`/api/templates/${templateId}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent template', async () => {
      const response = await request(app.server).delete('/api/templates/non-existent');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/templates/:id/export', () => {
    it('should export template as JSON', async () => {
      const response = await request(app.server).get('/api/templates/default/export');

      expect(response.status).toBe(200);
      expect(response.body.version).toBe('1.0');
      expect(response.body.exportedAt).toBeDefined();
      expect(response.body.template).toBeDefined();
      expect(response.body.template.name).toBe('Default Dark');
      expect(response.body.template.theme).toBeDefined();
    });

    it('should return 404 for non-existent template', async () => {
      const response = await request(app.server).get('/api/templates/non-existent/export');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/templates/import', () => {
    it('should import template from JSON', async () => {
      const exportedTemplate = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        template: {
          name: `Imported Template ${Date.now()}`,
          description: 'An imported template',
          theme: DEFAULT_TEMPLATE_THEME,
        },
      };

      const response = await request(app.server)
        .post('/api/templates/import')
        .send(exportedTemplate);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(exportedTemplate.template.name);
      expect(response.body.isDefault).toBe(false);
    });

    it('should handle duplicate name by adding suffix', async () => {
      // Create original
      const name = `Import Dup Test ${Date.now()}`;
      await request(app.server)
        .post('/api/templates')
        .send({ name, theme: DEFAULT_TEMPLATE_THEME });

      // Import with same name
      const exportedTemplate = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        template: {
          name,
          theme: DEFAULT_TEMPLATE_THEME,
        },
      };

      const response = await request(app.server)
        .post('/api/templates/import')
        .send(exportedTemplate);

      expect(response.status).toBe(201);
      expect(response.body.name).toContain(name);
      expect(response.body.name).not.toBe(name);
    });

    it('should return 400 for invalid version', async () => {
      const response = await request(app.server)
        .post('/api/templates/import')
        .send({
          version: '2.0',
          template: { name: 'Test', theme: DEFAULT_TEMPLATE_THEME },
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_IMPORT');
    });

    it('should return 400 for missing template data', async () => {
      const response = await request(app.server)
        .post('/api/templates/import')
        .send({ version: '1.0' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_IMPORT');
    });
  });

  describe('POST /api/templates/:id/duplicate', () => {
    it('should duplicate template', async () => {
      const response = await request(app.server)
        .post('/api/templates/default/duplicate')
        .send({});

      expect(response.status).toBe(201);
      expect(response.body.name).toContain('Default Dark');
      expect(response.body.name).toContain('Copy');
      expect(response.body.isDefault).toBe(false);
    });

    it('should duplicate template with custom name', async () => {
      const customName = `Custom Duplicate ${Date.now()}`;
      const response = await request(app.server)
        .post('/api/templates/default/duplicate')
        .send({ name: customName });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(customName);
    });

    it('should return 404 for non-existent template', async () => {
      const response = await request(app.server)
        .post('/api/templates/non-existent/duplicate')
        .send({});

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/templates/:id/preview', () => {
    it('should return preview data', async () => {
      const response = await request(app.server).get('/api/templates/default/preview');

      expect(response.status).toBe(200);
      expect(response.body.template).toBeDefined();
      expect(response.body.slideType).toBe('cover');
      expect(response.body.sampleData).toBeDefined();
    });

    it('should support different slide types', async () => {
      const types = ['cover', 'content', 'code', 'cta'];

      for (const type of types) {
        const response = await request(app.server)
          .get(`/api/templates/default/preview?type=${type}`);

        expect(response.status).toBe(200);
        expect(response.body.slideType).toBe(type);
      }
    });

    it('should return 404 for non-existent template', async () => {
      const response = await request(app.server).get('/api/templates/non-existent/preview');

      expect(response.status).toBe(404);
    });
  });
});
