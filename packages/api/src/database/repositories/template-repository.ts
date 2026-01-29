/**
 * Template Repository
 * Story 5.7 - Editor de Templates de Carrossel
 *
 * Data access layer for carousel templates.
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../connection';
import {
  DbTemplate,
  CreateDbTemplate,
  UpdateDbTemplate,
  TemplateRow,
  FindOptions,
} from '../types';

/**
 * Repository for managing carousel templates.
 */
export class TemplateRepository {
  private db: Database.Database;

  /**
   * Creates a new TemplateRepository.
   *
   * @param db - Optional database connection (uses singleton if not provided)
   */
  constructor(db?: Database.Database) {
    this.db = db ?? getDatabase();
  }

  /**
   * Creates a new template record.
   *
   * @param data - Template data
   * @returns The created template
   */
  create(data: CreateDbTemplate): DbTemplate {
    const id = data.id ?? uuidv4();
    const isDefault = data.is_default ? 1 : 0;

    this.db
      .prepare(
        `
      INSERT INTO templates (id, name, description, theme, is_default)
      VALUES (?, ?, ?, ?, ?)
    `
      )
      .run(
        id,
        data.name,
        data.description ?? null,
        data.theme,
        isDefault
      );

    return this.findById(id)!;
  }

  /**
   * Finds a template by its ID.
   *
   * @param id - Template ID
   * @returns The template or null if not found
   */
  findById(id: string): DbTemplate | null {
    const row = this.db
      .prepare(
        `
      SELECT * FROM templates WHERE id = ?
    `
      )
      .get(id) as TemplateRow | undefined;

    return row ? this.mapRow(row) : null;
  }

  /**
   * Finds a template by its name.
   *
   * @param name - Template name
   * @returns The template or null if not found
   */
  findByName(name: string): DbTemplate | null {
    const row = this.db
      .prepare(
        `
      SELECT * FROM templates WHERE name = ?
    `
      )
      .get(name) as TemplateRow | undefined;

    return row ? this.mapRow(row) : null;
  }

  /**
   * Finds the default template.
   *
   * @returns The default template or null if not found
   */
  findDefault(): DbTemplate | null {
    const row = this.db
      .prepare(
        `
      SELECT * FROM templates WHERE is_default = 1 LIMIT 1
    `
      )
      .get() as TemplateRow | undefined;

    return row ? this.mapRow(row) : null;
  }

  /**
   * Finds all templates with optional pagination.
   *
   * @param options - Query options
   * @returns Array of templates
   */
  findAll(options?: FindOptions): DbTemplate[] {
    const limit = options?.limit ?? 100;
    const offset = options?.offset ?? 0;
    const orderBy = options?.orderBy ?? 'created_at';
    const orderDir = options?.orderDir ?? 'DESC';

    // Validate orderBy to prevent SQL injection
    const validColumns = ['id', 'name', 'is_default', 'created_at', 'updated_at'];
    const safeOrderBy = validColumns.includes(orderBy) ? orderBy : 'created_at';

    const rows = this.db
      .prepare(
        `
      SELECT * FROM templates
      ORDER BY ${safeOrderBy} ${orderDir}
      LIMIT ? OFFSET ?
    `
      )
      .all(limit, offset) as TemplateRow[];

    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Updates an existing template.
   *
   * @param id - Template ID
   * @param data - Data to update
   * @returns The updated template or null if not found
   */
  update(id: string, data: UpdateDbTemplate): DbTemplate | null {
    const sets: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) {
      sets.push('name = ?');
      values.push(data.name);
    }

    if (data.description !== undefined) {
      sets.push('description = ?');
      values.push(data.description);
    }

    if (data.theme !== undefined) {
      sets.push('theme = ?');
      values.push(data.theme);
    }

    // Always update updated_at
    sets.push("updated_at = datetime('now')");

    if (sets.length === 1) {
      // Only updated_at was set, nothing to update
      return this.findById(id);
    }

    values.push(id);

    const result = this.db
      .prepare(
        `
      UPDATE templates
      SET ${sets.join(', ')}
      WHERE id = ?
    `
      )
      .run(...values);

    if (result.changes === 0) {
      return null;
    }

    return this.findById(id);
  }

  /**
   * Deletes a template by ID.
   *
   * @param id - Template ID
   * @returns true if deleted, false if not found
   * @throws Error if trying to delete default template
   */
  delete(id: string): boolean {
    // Check if this is the default template
    const template = this.findById(id);
    if (template?.is_default) {
      throw new Error('Cannot delete default template');
    }

    const result = this.db
      .prepare(
        `
      DELETE FROM templates WHERE id = ?
    `
      )
      .run(id);

    return result.changes > 0;
  }

  /**
   * Checks if a template name exists (excluding a specific ID).
   *
   * @param name - Template name to check
   * @param excludeId - Optional ID to exclude from check
   * @returns true if name exists
   */
  nameExists(name: string, excludeId?: string): boolean {
    const row = this.db
      .prepare(
        excludeId
          ? 'SELECT id FROM templates WHERE name = ? AND id != ?'
          : 'SELECT id FROM templates WHERE name = ?'
      )
      .get(excludeId ? [name, excludeId] : name) as { id: string } | undefined;

    return !!row;
  }

  /**
   * Gets the total count of templates.
   *
   * @returns Total count
   */
  count(): number {
    const row = this.db
      .prepare('SELECT COUNT(*) as count FROM templates')
      .get() as { count: number };
    return row.count;
  }

  /**
   * Maps a database row to a DbTemplate object.
   */
  private mapRow(row: TemplateRow): DbTemplate {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      theme: row.theme,
      is_default: row.is_default === 1,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
