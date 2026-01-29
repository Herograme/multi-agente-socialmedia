/**
 * Post Repository
 * Story 4.1 - Persistencia com SQLite
 *
 * Data access layer for generated posts.
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../connection';
import {
  Post,
  CreatePost,
  UpdatePost,
  PostStatus,
  PostRow,
  PostWithAssets,
  PostWithScore,
  Asset,
  Score,
  AssetRow,
  ScoreRow,
  AssetType,
  CriteriaBreakdown,
  FindOptions,
} from '../types';

/**
 * Repository for managing generated posts.
 */
export class PostRepository {
  private db: Database.Database;

  /**
   * Creates a new PostRepository.
   *
   * @param db - Optional database connection (uses singleton if not provided)
   */
  constructor(db?: Database.Database) {
    this.db = db ?? getDatabase();
  }

  /**
   * Creates a new post record.
   *
   * @param data - Post data
   * @returns The created post
   */
  create(data: CreatePost): Post {
    const id = data.id ?? uuidv4();
    const status = data.status ?? PostStatus.PENDING;

    this.db
      .prepare(
        `
      INSERT INTO posts (id, execution_id, topic, text_ig, text_linkedin, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        id,
        data.execution_id,
        data.topic,
        data.text_ig ?? null,
        data.text_linkedin ?? null,
        status
      );

    return this.findById(id)!;
  }

  /**
   * Finds a post by its ID.
   *
   * @param id - Post ID
   * @returns The post or null if not found
   */
  findById(id: string): Post | null {
    const row = this.db
      .prepare(
        `
      SELECT * FROM posts WHERE id = ?
    `
      )
      .get(id) as PostRow | undefined;

    return row ? this.mapRow(row) : null;
  }

  /**
   * Finds all posts for an execution.
   *
   * @param executionId - Execution ID
   * @returns Array of posts
   */
  findByExecutionId(executionId: string): Post[] {
    const rows = this.db
      .prepare(
        `
      SELECT * FROM posts
      WHERE execution_id = ?
      ORDER BY created_at DESC
    `
      )
      .all(executionId) as PostRow[];

    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Finds all posts with optional pagination.
   *
   * @param options - Query options
   * @returns Array of posts
   */
  findAll(options?: FindOptions): Post[] {
    const limit = options?.limit ?? 100;
    const offset = options?.offset ?? 0;
    const orderBy = options?.orderBy ?? 'created_at';
    const orderDir = options?.orderDir ?? 'DESC';

    // Validate orderBy to prevent SQL injection
    const validColumns = ['id', 'execution_id', 'topic', 'status', 'created_at'];
    const safeOrderBy = validColumns.includes(orderBy) ? orderBy : 'created_at';

    const rows = this.db
      .prepare(
        `
      SELECT * FROM posts
      ORDER BY ${safeOrderBy} ${orderDir}
      LIMIT ? OFFSET ?
    `
      )
      .all(limit, offset) as PostRow[];

    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Updates an existing post.
   *
   * @param id - Post ID
   * @param data - Data to update
   * @returns The updated post or null if not found
   */
  update(id: string, data: UpdatePost): Post | null {
    const sets: string[] = [];
    const values: unknown[] = [];

    if (data.topic !== undefined) {
      sets.push('topic = ?');
      values.push(data.topic);
    }

    if (data.text_ig !== undefined) {
      sets.push('text_ig = ?');
      values.push(data.text_ig);
    }

    if (data.text_linkedin !== undefined) {
      sets.push('text_linkedin = ?');
      values.push(data.text_linkedin);
    }

    if (data.status !== undefined) {
      sets.push('status = ?');
      values.push(data.status);
    }

    if (data.rejection_reason !== undefined) {
      sets.push('rejection_reason = ?');
      values.push(data.rejection_reason);
    }

    if (sets.length === 0) {
      return this.findById(id);
    }

    // Always update the updated_at timestamp
    sets.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    const result = this.db
      .prepare(
        `
      UPDATE posts
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
   * Deletes a post by ID.
   * Also deletes related assets and scores (cascade).
   *
   * @param id - Post ID
   * @returns true if deleted, false if not found
   */
  delete(id: string): boolean {
    const result = this.db
      .prepare(
        `
      DELETE FROM posts WHERE id = ?
    `
      )
      .run(id);

    return result.changes > 0;
  }

  /**
   * Finds posts by status.
   *
   * @param status - Post status to filter by
   * @returns Array of matching posts
   */
  findByStatus(status: PostStatus): Post[] {
    const rows = this.db
      .prepare(
        `
      SELECT * FROM posts
      WHERE status = ?
      ORDER BY created_at DESC
    `
      )
      .all(status) as PostRow[];

    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Finds a post with all its assets.
   *
   * @param id - Post ID
   * @returns Post with assets or null if not found
   */
  findWithAssets(id: string): PostWithAssets | null {
    const post = this.findById(id);
    if (!post) {
      return null;
    }

    const assetRows = this.db
      .prepare(
        `
      SELECT * FROM assets
      WHERE post_id = ?
      ORDER BY created_at ASC
    `
      )
      .all(id) as AssetRow[];

    const assets: Asset[] = assetRows.map((row) => ({
      id: row.id,
      post_id: row.post_id,
      type: row.type as AssetType,
      path: row.path,
      size: row.size,
      metadata: JSON.parse(row.metadata) as Record<string, unknown>,
      created_at: row.created_at,
    }));

    return {
      ...post,
      assets,
    };
  }

  /**
   * Finds a post with its QA score.
   *
   * @param id - Post ID
   * @returns Post with score or null if not found
   */
  findWithScore(id: string): PostWithScore | null {
    const post = this.findById(id);
    if (!post) {
      return null;
    }

    const scoreRow = this.db
      .prepare(
        `
      SELECT * FROM scores
      WHERE post_id = ?
    `
      )
      .get(id) as ScoreRow | undefined;

    const score: Score | null = scoreRow
      ? {
          id: scoreRow.id,
          post_id: scoreRow.post_id,
          overall_score: scoreRow.overall_score,
          criteria_breakdown: JSON.parse(scoreRow.criteria_breakdown) as CriteriaBreakdown,
          feedback: scoreRow.feedback,
          approved: scoreRow.approved === 1,
          created_at: scoreRow.created_at,
        }
      : null;

    return {
      ...post,
      score,
    };
  }

  /**
   * Gets the total count of posts.
   *
   * @returns Total count
   */
  count(): number {
    const row = this.db
      .prepare('SELECT COUNT(*) as count FROM posts')
      .get() as { count: number };
    return row.count;
  }

  /**
   * Counts posts by execution ID.
   *
   * @param executionId - Execution ID
   * @returns Count of posts
   */
  countByExecutionId(executionId: string): number {
    const row = this.db
      .prepare('SELECT COUNT(*) as count FROM posts WHERE execution_id = ?')
      .get(executionId) as { count: number };
    return row.count;
  }

  /**
   * Counts posts grouped by status.
   *
   * @returns Count for each status
   */
  countByStatus(): Record<PostStatus, number> {
    const rows = this.db
      .prepare(
        `
      SELECT status, COUNT(*) as count
      FROM posts
      GROUP BY status
    `
      )
      .all() as { status: string; count: number }[];

    const result: Record<string, number> = {
      [PostStatus.PENDING]: 0,
      [PostStatus.APPROVED]: 0,
      [PostStatus.REJECTED]: 0,
      [PostStatus.NEEDS_REVIEW]: 0,
    };

    for (const row of rows) {
      result[row.status] = row.count;
    }

    return result as Record<PostStatus, number>;
  }

  /**
   * Finds approved posts.
   *
   * @param limit - Maximum number of posts to return
   * @returns Array of approved posts
   */
  findApproved(limit = 100): Post[] {
    const rows = this.db
      .prepare(
        `
      SELECT * FROM posts
      WHERE status = ?
      ORDER BY created_at DESC
      LIMIT ?
    `
      )
      .all(PostStatus.APPROVED, limit) as PostRow[];

    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Maps a database row to a Post object.
   */
  private mapRow(row: PostRow): Post {
    return {
      id: row.id,
      execution_id: row.execution_id,
      topic: row.topic,
      text_ig: row.text_ig,
      text_linkedin: row.text_linkedin,
      status: row.status as PostStatus,
      rejection_reason: row.rejection_reason,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  // ============================================================
  // Approval Workflow Methods (Story 5.5)
  // ============================================================

  /**
   * Approves a post.
   *
   * @param id - Post ID
   * @returns The updated post or null if not found
   */
  approve(id: string): Post | null {
    return this.update(id, {
      status: PostStatus.APPROVED,
      rejection_reason: null,
    });
  }

  /**
   * Rejects a post with an optional reason.
   *
   * @param id - Post ID
   * @param reason - Optional rejection reason
   * @returns The updated post or null if not found
   */
  reject(id: string, reason?: string): Post | null {
    return this.update(id, {
      status: PostStatus.REJECTED,
      rejection_reason: reason ?? null,
    });
  }

  /**
   * Approves multiple posts at once.
   *
   * @param ids - Array of post IDs to approve
   * @returns Object with counts of updated and failed posts
   */
  bulkApprove(ids: string[]): { updated: number; failed: number } {
    let updated = 0;
    let failed = 0;

    const updateStmt = this.db.prepare(`
      UPDATE posts
      SET status = ?, rejection_reason = NULL, updated_at = ?
      WHERE id = ? AND status = ?
    `);

    const now = new Date().toISOString();

    for (const id of ids) {
      const result = updateStmt.run(
        PostStatus.APPROVED,
        now,
        id,
        PostStatus.PENDING
      );
      if (result.changes > 0) {
        updated++;
      } else {
        failed++;
      }
    }

    return { updated, failed };
  }

  /**
   * Rejects multiple posts at once.
   *
   * @param ids - Array of post IDs to reject
   * @param reason - Optional rejection reason for all posts
   * @returns Object with counts of updated and failed posts
   */
  bulkReject(ids: string[], reason?: string): { updated: number; failed: number } {
    let updated = 0;
    let failed = 0;

    const updateStmt = this.db.prepare(`
      UPDATE posts
      SET status = ?, rejection_reason = ?, updated_at = ?
      WHERE id = ? AND status = ?
    `);

    const now = new Date().toISOString();

    for (const id of ids) {
      const result = updateStmt.run(
        PostStatus.REJECTED,
        reason ?? null,
        now,
        id,
        PostStatus.PENDING
      );
      if (result.changes > 0) {
        updated++;
      } else {
        failed++;
      }
    }

    return { updated, failed };
  }

  /**
   * Counts posts with a specific status.
   *
   * @param status - Status to count
   * @returns Number of posts with that status
   */
  countByStatusValue(status: PostStatus): number {
    const row = this.db
      .prepare('SELECT COUNT(*) as count FROM posts WHERE status = ?')
      .get(status) as { count: number };
    return row.count;
  }

  /**
   * Resets a rejected post to pending for regeneration.
   *
   * @param id - Post ID
   * @returns The updated post or null if not found/not rejected
   */
  resetForRegeneration(id: string): Post | null {
    const result = this.db
      .prepare(`
        UPDATE posts
        SET status = ?, rejection_reason = NULL, updated_at = ?
        WHERE id = ? AND status = ?
      `)
      .run(PostStatus.PENDING, new Date().toISOString(), id, PostStatus.REJECTED);

    if (result.changes === 0) {
      return null;
    }

    return this.findById(id);
  }
}
