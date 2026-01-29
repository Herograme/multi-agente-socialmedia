/**
 * Score Repository
 * Story 4.1 - Persistencia com SQLite
 *
 * Data access layer for QA scores.
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../connection';
import {
  Score,
  CreateScore,
  UpdateScore,
  CriteriaBreakdown,
  ScoreRow,
  FindOptions,
} from '../types';

/**
 * Repository for managing QA scores.
 */
export class ScoreRepository {
  private db: Database.Database;

  /**
   * Creates a new ScoreRepository.
   *
   * @param db - Optional database connection (uses singleton if not provided)
   */
  constructor(db?: Database.Database) {
    this.db = db ?? getDatabase();
  }

  /**
   * Creates a new score record.
   *
   * @param data - Score data
   * @returns The created score
   */
  create(data: CreateScore): Score {
    const id = data.id ?? uuidv4();
    const criteriaBreakdown = JSON.stringify(data.criteria_breakdown ?? {});
    const approved = data.approved ? 1 : 0;

    this.db
      .prepare(
        `
      INSERT INTO scores (id, post_id, overall_score, criteria_breakdown, feedback, approved)
      VALUES (?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        id,
        data.post_id,
        data.overall_score,
        criteriaBreakdown,
        data.feedback ?? null,
        approved
      );

    return this.findById(id)!;
  }

  /**
   * Finds a score by its ID.
   *
   * @param id - Score ID
   * @returns The score or null if not found
   */
  findById(id: string): Score | null {
    const row = this.db
      .prepare(
        `
      SELECT * FROM scores WHERE id = ?
    `
      )
      .get(id) as ScoreRow | undefined;

    return row ? this.mapRow(row) : null;
  }

  /**
   * Finds a score by post ID.
   * Each post has at most one score.
   *
   * @param postId - Post ID
   * @returns The score or null if not found
   */
  findByPostId(postId: string): Score | null {
    const row = this.db
      .prepare(
        `
      SELECT * FROM scores WHERE post_id = ?
    `
      )
      .get(postId) as ScoreRow | undefined;

    return row ? this.mapRow(row) : null;
  }

  /**
   * Finds all scores with optional pagination.
   *
   * @param options - Query options
   * @returns Array of scores
   */
  findAll(options?: FindOptions): Score[] {
    const limit = options?.limit ?? 100;
    const offset = options?.offset ?? 0;
    const orderBy = options?.orderBy ?? 'created_at';
    const orderDir = options?.orderDir ?? 'DESC';

    // Validate orderBy to prevent SQL injection
    const validColumns = ['id', 'post_id', 'overall_score', 'approved', 'created_at'];
    const safeOrderBy = validColumns.includes(orderBy) ? orderBy : 'created_at';

    const rows = this.db
      .prepare(
        `
      SELECT * FROM scores
      ORDER BY ${safeOrderBy} ${orderDir}
      LIMIT ? OFFSET ?
    `
      )
      .all(limit, offset) as ScoreRow[];

    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Updates an existing score.
   *
   * @param id - Score ID
   * @param data - Data to update
   * @returns The updated score or null if not found
   */
  update(id: string, data: UpdateScore): Score | null {
    const sets: string[] = [];
    const values: unknown[] = [];

    if (data.overall_score !== undefined) {
      sets.push('overall_score = ?');
      values.push(data.overall_score);
    }

    if (data.criteria_breakdown !== undefined) {
      sets.push('criteria_breakdown = ?');
      values.push(JSON.stringify(data.criteria_breakdown));
    }

    if (data.feedback !== undefined) {
      sets.push('feedback = ?');
      values.push(data.feedback);
    }

    if (data.approved !== undefined) {
      sets.push('approved = ?');
      values.push(data.approved ? 1 : 0);
    }

    if (sets.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = this.db
      .prepare(
        `
      UPDATE scores
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
   * Deletes a score by ID.
   *
   * @param id - Score ID
   * @returns true if deleted, false if not found
   */
  delete(id: string): boolean {
    const result = this.db
      .prepare(
        `
      DELETE FROM scores WHERE id = ?
    `
      )
      .run(id);

    return result.changes > 0;
  }

  /**
   * Finds scores above a threshold.
   *
   * @param threshold - Minimum overall score
   * @returns Array of scores above the threshold
   */
  findAboveThreshold(threshold: number): Score[] {
    const rows = this.db
      .prepare(
        `
      SELECT * FROM scores
      WHERE overall_score >= ?
      ORDER BY overall_score DESC
    `
      )
      .all(threshold) as ScoreRow[];

    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Finds scores below a threshold.
   *
   * @param threshold - Maximum overall score
   * @returns Array of scores below the threshold
   */
  findBelowThreshold(threshold: number): Score[] {
    const rows = this.db
      .prepare(
        `
      SELECT * FROM scores
      WHERE overall_score < ?
      ORDER BY overall_score DESC
    `
      )
      .all(threshold) as ScoreRow[];

    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Gets the average overall score across all posts.
   *
   * @returns Average score or 0 if no scores exist
   */
  getAverageScore(): number {
    const row = this.db
      .prepare(
        `
      SELECT AVG(overall_score) as average FROM scores
    `
      )
      .get() as { average: number | null };

    return row.average ?? 0;
  }

  /**
   * Gets the total count of scores.
   *
   * @returns Total count
   */
  count(): number {
    const row = this.db
      .prepare('SELECT COUNT(*) as count FROM scores')
      .get() as { count: number };
    return row.count;
  }

  /**
   * Counts approved vs rejected scores.
   *
   * @returns Object with approved and rejected counts
   */
  countByApproval(): { approved: number; rejected: number } {
    const rows = this.db
      .prepare(
        `
      SELECT approved, COUNT(*) as count
      FROM scores
      GROUP BY approved
    `
      )
      .all() as { approved: number; count: number }[];

    const result = { approved: 0, rejected: 0 };

    for (const row of rows) {
      if (row.approved === 1) {
        result.approved = row.count;
      } else {
        result.rejected = row.count;
      }
    }

    return result;
  }

  /**
   * Finds approved scores.
   *
   * @param limit - Maximum number of results
   * @returns Array of approved scores
   */
  findApproved(limit = 100): Score[] {
    const rows = this.db
      .prepare(
        `
      SELECT * FROM scores
      WHERE approved = 1
      ORDER BY overall_score DESC
      LIMIT ?
    `
      )
      .all(limit) as ScoreRow[];

    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Gets score statistics.
   *
   * @returns Object with min, max, avg, and count
   */
  getStatistics(): {
    min: number;
    max: number;
    avg: number;
    count: number;
  } {
    const row = this.db
      .prepare(
        `
      SELECT
        MIN(overall_score) as min,
        MAX(overall_score) as max,
        AVG(overall_score) as avg,
        COUNT(*) as count
      FROM scores
    `
      )
      .get() as {
      min: number | null;
      max: number | null;
      avg: number | null;
      count: number;
    };

    return {
      min: row.min ?? 0,
      max: row.max ?? 0,
      avg: row.avg ?? 0,
      count: row.count,
    };
  }

  /**
   * Maps a database row to a Score object.
   */
  private mapRow(row: ScoreRow): Score {
    return {
      id: row.id,
      post_id: row.post_id,
      overall_score: row.overall_score,
      criteria_breakdown: JSON.parse(row.criteria_breakdown) as CriteriaBreakdown,
      feedback: row.feedback,
      approved: row.approved === 1,
      created_at: row.created_at,
    };
  }
}
