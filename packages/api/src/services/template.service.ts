/**
 * Template Service
 * Story 5.7 - Editor de Templates de Carrossel
 *
 * Business logic layer for template management.
 */

import { createLogger } from '@social-content/shared';
import type {
  Template,
  TemplateTheme,
  CreateTemplateInput,
  UpdateTemplateInput,
  ExportedTemplate,
} from '@social-content/shared';
import { TemplateRepository } from '../database/repositories/template-repository';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('service:template');

/**
 * Error thrown when trying to delete the default template
 */
export class CannotDeleteDefaultTemplateError extends Error {
  code = 'CANNOT_DELETE_DEFAULT';

  constructor() {
    super('Cannot delete default template');
    this.name = 'CannotDeleteDefaultTemplateError';
  }
}

/**
 * Error thrown when template is not found
 */
export class TemplateNotFoundError extends Error {
  code = 'TEMPLATE_NOT_FOUND';

  constructor(id: string) {
    super(`Template not found: ${id}`);
    this.name = 'TemplateNotFoundError';
  }
}

/**
 * Error thrown when template name already exists
 */
export class TemplateNameExistsError extends Error {
  code = 'TEMPLATE_NAME_EXISTS';

  constructor(name: string) {
    super(`Template name already exists: ${name}`);
    this.name = 'TemplateNameExistsError';
  }
}

/**
 * Error thrown when import JSON is invalid
 */
export class InvalidImportError extends Error {
  code = 'INVALID_IMPORT';

  constructor(reason: string) {
    super(`Invalid import: ${reason}`);
    this.name = 'InvalidImportError';
  }
}

/**
 * Template Service class
 */
export class TemplateService {
  private repository: TemplateRepository;

  /**
   * Creates a new TemplateService.
   *
   * @param repository - Optional repository instance
   */
  constructor(repository?: TemplateRepository) {
    this.repository = repository ?? new TemplateRepository();
  }

  /**
   * Lists all templates.
   *
   * @returns Array of templates
   */
  async listTemplates(): Promise<Template[]> {
    logger.debug('Listing all templates');
    const dbTemplates = this.repository.findAll({ orderBy: 'name', orderDir: 'ASC' });
    return dbTemplates.map((t) => this.mapDbToTemplate(t));
  }

  /**
   * Gets a template by ID.
   *
   * @param id - Template ID
   * @returns Template or throws if not found
   */
  async getTemplate(id: string): Promise<Template> {
    logger.debug('Getting template', { id });
    const dbTemplate = this.repository.findById(id);

    if (!dbTemplate) {
      throw new TemplateNotFoundError(id);
    }

    return this.mapDbToTemplate(dbTemplate);
  }

  /**
   * Creates a new template.
   *
   * @param input - Template creation input
   * @returns Created template
   */
  async createTemplate(input: CreateTemplateInput): Promise<Template> {
    logger.info('Creating template', { name: input.name });

    // Check if name already exists
    if (this.repository.nameExists(input.name)) {
      throw new TemplateNameExistsError(input.name);
    }

    const id = uuidv4();
    const themeJson = JSON.stringify(input.theme);

    const dbTemplate = this.repository.create({
      id,
      name: input.name,
      description: input.description,
      theme: themeJson,
      is_default: false,
    });

    logger.info('Template created', { id, name: input.name });
    return this.mapDbToTemplate(dbTemplate);
  }

  /**
   * Updates an existing template.
   *
   * @param id - Template ID
   * @param input - Update input
   * @returns Updated template
   */
  async updateTemplate(id: string, input: UpdateTemplateInput): Promise<Template> {
    logger.info('Updating template', { id });

    // Check if template exists
    const existing = this.repository.findById(id);
    if (!existing) {
      throw new TemplateNotFoundError(id);
    }

    // Check if new name already exists (if name is being changed)
    if (input.name && input.name !== existing.name && this.repository.nameExists(input.name, id)) {
      throw new TemplateNameExistsError(input.name);
    }

    // Merge theme if partial update
    let themeJson: string | undefined;
    if (input.theme) {
      const existingTheme = JSON.parse(existing.theme) as TemplateTheme;
      const mergedTheme = this.mergeTheme(existingTheme, input.theme);
      themeJson = JSON.stringify(mergedTheme);
    }

    const dbTemplate = this.repository.update(id, {
      name: input.name,
      description: input.description,
      theme: themeJson,
    });

    if (!dbTemplate) {
      throw new TemplateNotFoundError(id);
    }

    logger.info('Template updated', { id });
    return this.mapDbToTemplate(dbTemplate);
  }

  /**
   * Deletes a template.
   *
   * @param id - Template ID
   */
  async deleteTemplate(id: string): Promise<void> {
    logger.info('Deleting template', { id });

    // Check if template exists
    const existing = this.repository.findById(id);
    if (!existing) {
      throw new TemplateNotFoundError(id);
    }

    // Check if it's the default template
    if (existing.is_default) {
      throw new CannotDeleteDefaultTemplateError();
    }

    this.repository.delete(id);
    logger.info('Template deleted', { id });
  }

  /**
   * Exports a template as JSON.
   *
   * @param id - Template ID
   * @returns Exported template JSON
   */
  async exportTemplate(id: string): Promise<ExportedTemplate> {
    logger.debug('Exporting template', { id });

    const template = await this.getTemplate(id);

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      template: {
        name: template.name,
        description: template.description,
        theme: template.theme,
      },
    };
  }

  /**
   * Imports a template from JSON.
   *
   * @param json - Exported template JSON
   * @returns Created template
   */
  async importTemplate(json: ExportedTemplate): Promise<Template> {
    logger.info('Importing template', { name: json.template?.name });

    // Validate import
    this.validateImport(json);

    // Check for duplicate name and generate unique if needed
    let name = json.template.name;
    let suffix = 1;
    while (this.repository.nameExists(name)) {
      name = `${json.template.name} (${suffix})`;
      suffix++;
    }

    // Create the template
    return this.createTemplate({
      name,
      description: json.template.description,
      theme: json.template.theme,
    });
  }

  /**
   * Duplicates an existing template.
   *
   * @param id - Template ID to duplicate
   * @param newName - Optional new name for the duplicate
   * @returns Duplicated template
   */
  async duplicateTemplate(id: string, newName?: string): Promise<Template> {
    logger.info('Duplicating template', { id, newName });

    const existing = await this.getTemplate(id);

    // Generate unique name if not provided
    let name = newName || `${existing.name} (Copy)`;
    let suffix = 1;
    while (this.repository.nameExists(name)) {
      name = newName ? `${newName} (${suffix})` : `${existing.name} (Copy ${suffix})`;
      suffix++;
    }

    return this.createTemplate({
      name,
      description: existing.description,
      theme: existing.theme,
    });
  }

  /**
   * Gets the default template.
   *
   * @returns Default template
   */
  async getDefaultTemplate(): Promise<Template> {
    const dbTemplate = this.repository.findDefault();
    if (!dbTemplate) {
      // This should never happen if migrations ran correctly
      throw new Error('Default template not found');
    }
    return this.mapDbToTemplate(dbTemplate);
  }

  /**
   * Validates import JSON structure.
   */
  private validateImport(json: ExportedTemplate): void {
    if (!json) {
      throw new InvalidImportError('Empty import data');
    }

    if (json.version !== '1.0') {
      throw new InvalidImportError(`Unsupported version: ${json.version}`);
    }

    if (!json.template) {
      throw new InvalidImportError('Missing template data');
    }

    if (!json.template.name || typeof json.template.name !== 'string') {
      throw new InvalidImportError('Invalid or missing template name');
    }

    if (!json.template.theme) {
      throw new InvalidImportError('Missing theme data');
    }

    // Validate theme structure
    const theme = json.template.theme;
    if (!theme.colors || !theme.fonts || !theme.overlay || !theme.branding) {
      throw new InvalidImportError('Invalid theme structure');
    }
  }

  /**
   * Merges partial theme with existing theme.
   */
  private mergeTheme(existing: TemplateTheme, partial: Partial<TemplateTheme>): TemplateTheme {
    return {
      colors: partial.colors ? { ...existing.colors, ...partial.colors } : existing.colors,
      fonts: partial.fonts ? { ...existing.fonts, ...partial.fonts } : existing.fonts,
      overlay: partial.overlay ? { ...existing.overlay, ...partial.overlay } : existing.overlay,
      branding: partial.branding ? { ...existing.branding, ...partial.branding } : existing.branding,
    };
  }

  /**
   * Maps database template to domain template.
   */
  private mapDbToTemplate(db: {
    id: string;
    name: string;
    description: string | null;
    theme: string;
    is_default: boolean;
    created_at: string;
    updated_at: string;
  }): Template {
    return {
      id: db.id,
      name: db.name,
      description: db.description ?? undefined,
      theme: JSON.parse(db.theme) as TemplateTheme,
      isDefault: db.is_default,
      createdAt: new Date(db.created_at),
      updatedAt: new Date(db.updated_at),
    };
  }
}

// Singleton instance
let serviceInstance: TemplateService | null = null;

/**
 * Gets the template service singleton instance.
 */
export function getTemplateService(): TemplateService {
  if (!serviceInstance) {
    serviceInstance = new TemplateService();
  }
  return serviceInstance;
}

/**
 * Creates a new template service instance (for testing).
 */
export function createTemplateService(repository?: TemplateRepository): TemplateService {
  return new TemplateService(repository);
}
