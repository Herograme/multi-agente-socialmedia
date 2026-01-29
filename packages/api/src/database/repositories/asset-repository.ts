/**
 * Asset Repository
 * Story 4.1 - Persistencia com SQLite
 *
 * Data access layer for post assets (images, carousels, PDFs).
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../connection';
import {
  Asset,
  CreateAsset,
  UpdateAsset,
  AssetType,
  AssetRow,
  FindOptions,
} from '../types';

/**
 * Repository for managing post assets.
 */
export class AssetRepository {
  private db: Database.Database;

  /**
   * Creates a new AssetRepository.
   *
   * @param db - Optional database connection (uses singleton if not provided)
   */
  constructor(db?: Database.Database) {
    this.db = db ?? getDatabase();
  }

  /**
   * Creates a new asset record.
   *
   * @param data - Asset data
   * @returns The created asset
   */
  create(data: CreateAsset): Asset {
    const id = data.id ?? uuidv4();
    const size = data.size ?? 0;
    const metadata = JSON.stringify(data.metadata ?? {});

    this.db
      .prepare(
        `
      INSERT INTO assets (id, post_id, type, path, size, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `
      )
      .run(id, data.post_id, data.type, data.path, size, metadata);

    return this.findById(id)!;
  }

  /**
   * Creates multiple assets in a single transaction.
   *
   * @param data - Array of asset data
   * @returns Array of created assets
   */
  createMany(data: CreateAsset[]): Asset[] {
    const insertStmt = this.db.prepare(`
      INSERT INTO assets (id, post_id, type, path, size, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const ids: string[] = [];

    this.db.transaction(() => {
      for (const asset of data) {
        const id = asset.id ?? uuidv4();
        const size = asset.size ?? 0;
        const metadata = JSON.stringify(asset.metadata ?? {});

        insertStmt.run(id, asset.post_id, asset.type, asset.path, size, metadata);
        ids.push(id);
      }
    })();

    return ids.map((id) => this.findById(id)!);
  }

  /**
   * Finds an asset by its ID.
   *
   * @param id - Asset ID
   * @returns The asset or null if not found
   */
  findById(id: string): Asset | null {
    const row = this.db
      .prepare(
        `
      SELECT * FROM assets WHERE id = ?
    `
      )
      .get(id) as AssetRow | undefined;

    return row ? this.mapRow(row) : null;
  }

  /**
   * Finds all assets for a post.
   *
   * @param postId - Post ID
   * @returns Array of assets
   */
  findByPostId(postId: string): Asset[] {
    const rows = this.db
      .prepare(
        `
      SELECT * FROM assets
      WHERE post_id = ?
      ORDER BY created_at ASC
    `
      )
      .all(postId) as AssetRow[];

    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Finds assets by post ID and type.
   *
   * @param postId - Post ID
   * @param type - Asset type
   * @returns Array of matching assets
   */
  findByType(postId: string, type: AssetType): Asset[] {
    const rows = this.db
      .prepare(
        `
      SELECT * FROM assets
      WHERE post_id = ? AND type = ?
      ORDER BY created_at ASC
    `
      )
      .all(postId, type) as AssetRow[];

    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Finds all assets with optional pagination.
   *
   * @param options - Query options
   * @returns Array of assets
   */
  findAll(options?: FindOptions): Asset[] {
    const limit = options?.limit ?? 100;
    const offset = options?.offset ?? 0;
    const orderBy = options?.orderBy ?? 'created_at';
    const orderDir = options?.orderDir ?? 'DESC';

    // Validate orderBy to prevent SQL injection
    const validColumns = ['id', 'post_id', 'type', 'path', 'size', 'created_at'];
    const safeOrderBy = validColumns.includes(orderBy) ? orderBy : 'created_at';

    const rows = this.db
      .prepare(
        `
      SELECT * FROM assets
      ORDER BY ${safeOrderBy} ${orderDir}
      LIMIT ? OFFSET ?
    `
      )
      .all(limit, offset) as AssetRow[];

    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Updates an existing asset.
   *
   * @param id - Asset ID
   * @param data - Data to update
   * @returns The updated asset or null if not found
   */
  update(id: string, data: UpdateAsset): Asset | null {
    const sets: string[] = [];
    const values: unknown[] = [];

    if (data.path !== undefined) {
      sets.push('path = ?');
      values.push(data.path);
    }

    if (data.size !== undefined) {
      sets.push('size = ?');
      values.push(data.size);
    }

    if (data.metadata !== undefined) {
      sets.push('metadata = ?');
      values.push(JSON.stringify(data.metadata));
    }

    if (sets.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = this.db
      .prepare(
        `
      UPDATE assets
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
   * Deletes an asset by ID.
   *
   * @param id - Asset ID
   * @returns true if deleted, false if not found
   */
  delete(id: string): boolean {
    const result = this.db
      .prepare(
        `
      DELETE FROM assets WHERE id = ?
    `
      )
      .run(id);

    return result.changes > 0;
  }

  /**
   * Deletes all assets for a post.
   *
   * @param postId - Post ID
   * @returns Number of deleted assets
   */
  deleteByPostId(postId: string): number {
    const result = this.db
      .prepare(
        `
      DELETE FROM assets WHERE post_id = ?
    `
      )
      .run(postId);

    return result.changes;
  }

  /**
   * Gets the total count of assets.
   *
   * @returns Total count
   */
  count(): number {
    const row = this.db
      .prepare('SELECT COUNT(*) as count FROM assets')
      .get() as { count: number };
    return row.count;
  }

  /**
   * Counts assets by post ID.
   *
   * @param postId - Post ID
   * @returns Count of assets
   */
  countByPostId(postId: string): number {
    const row = this.db
      .prepare('SELECT COUNT(*) as count FROM assets WHERE post_id = ?')
      .get(postId) as { count: number };
    return row.count;
  }

  /**
   * Calculates total size of assets for a post.
   *
   * @param postId - Post ID
   * @returns Total size in bytes
   */
  getTotalSizeByPostId(postId: string): number {
    const row = this.db
      .prepare('SELECT COALESCE(SUM(size), 0) as total FROM assets WHERE post_id = ?')
      .get(postId) as { total: number };
    return row.total;
  }

  /**
   * Finds assets by type across all posts.
   *
   * @param type - Asset type
   * @param limit - Maximum number of results
   * @returns Array of assets
   */
  findAllByType(type: AssetType, limit = 100): Asset[] {
    const rows = this.db
      .prepare(
        `
      SELECT * FROM assets
      WHERE type = ?
      ORDER BY created_at DESC
      LIMIT ?
    `
      )
      .all(type, limit) as AssetRow[];

    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Maps a database row to an Asset object.
   */
  private mapRow(row: AssetRow): Asset {
    return {
      id: row.id,
      post_id: row.post_id,
      type: row.type as AssetType,
      path: row.path,
      size: row.size,
      metadata: JSON.parse(row.metadata) as Record<string, unknown>,
      created_at: row.created_at,
    };
  }
}
