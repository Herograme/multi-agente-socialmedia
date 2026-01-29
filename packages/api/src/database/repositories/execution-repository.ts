/**
 * Execution Repository
 * Story 4.1 - Persistencia com SQLite
 *
 * Data access layer for pipeline executions.
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../connection';
import {
  Execution,
  CreateExecution,
  UpdateExecution,
  ExecutionStatus,
  ExecutionConfig,
  ExecutionRow,
  FindOptions,
} from '../types';

/**
 * Repository for managing pipeline executions.
 */
export class ExecutionRepository {
  private db: Database.Database;

  /**
   * Creates a new ExecutionRepository.
   *
   * @param db - Optional database connection (uses singleton if not provided)
   */
  constructor(db?: Database.Database) {
    this.db = db ?? getDatabase();
  }

  /**
   * Creates a new execution record.
   *
   * @param data - Execution data
   * @returns The created execution
   */
  create(data: CreateExecution): Execution {
    const id = data.id ?? uuidv4();
    const config = JSON.stringify(data.config ?? {});
    const status = data.status ?? ExecutionStatus.PENDING;

    this.db
      .prepare(
        `
      INSERT INTO executions (id, status, config)
      VALUES (?, ?, ?)
    `
      )
      .run(id, status, config);

    return this.findById(id)!;
  }

  /**
   * Finds an execution by its ID.
   *
   * @param id - Execution ID
   * @returns The execution or null if not found
   */
  findById(id: string): Execution | null {
    const row = this.db
      .prepare(
        `
      SELECT * FROM executions WHERE id = ?
    `
      )
      .get(id) as ExecutionRow | undefined;

    return row ? this.mapRow(row) : null;
  }

  /**
   * Finds all executions with optional pagination.
   *
   * @param options - Query options
   * @returns Array of executions
   */
  findAll(options?: FindOptions): Execution[] {
    const limit = options?.limit ?? 100;
    const offset = options?.offset ?? 0;
    const orderBy = options?.orderBy ?? 'created_at';
    const orderDir = options?.orderDir ?? 'DESC';

    // Validate orderBy to prevent SQL injection
    const validColumns = ['id', 'started_at', 'finished_at', 'status', 'created_at'];
    const safeOrderBy = validColumns.includes(orderBy) ? orderBy : 'created_at';

    const rows = this.db
      .prepare(
        `
      SELECT * FROM executions
      ORDER BY ${safeOrderBy} ${orderDir}
      LIMIT ? OFFSET ?
    `
      )
      .all(limit, offset) as ExecutionRow[];

    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Updates an existing execution.
   *
   * @param id - Execution ID
   * @param data - Data to update
   * @returns The updated execution or null if not found
   */
  update(id: string, data: UpdateExecution): Execution | null {
    const sets: string[] = [];
    const values: unknown[] = [];

    if (data.finished_at !== undefined) {
      sets.push('finished_at = ?');
      values.push(data.finished_at);
    }

    if (data.status !== undefined) {
      sets.push('status = ?');
      values.push(data.status);
    }

    if (data.config !== undefined) {
      sets.push('config = ?');
      values.push(JSON.stringify(data.config));
    }

    if (sets.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = this.db
      .prepare(
        `
      UPDATE executions
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
   * Deletes an execution by ID.
   * Also deletes related posts, assets, and scores (cascade).
   *
   * @param id - Execution ID
   * @returns true if deleted, false if not found
   */
  delete(id: string): boolean {
    const result = this.db
      .prepare(
        `
      DELETE FROM executions WHERE id = ?
    `
      )
      .run(id);

    return result.changes > 0;
  }

  /**
   * Finds executions by status.
   *
   * @param status - Execution status to filter by
   * @returns Array of matching executions
   */
  findByStatus(status: ExecutionStatus): Execution[] {
    const rows = this.db
      .prepare(
        `
      SELECT * FROM executions
      WHERE status = ?
      ORDER BY created_at DESC
    `
      )
      .all(status) as ExecutionRow[];

    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Counts executions grouped by status.
   *
   * @returns Count for each status
   */
  countByStatus(): Record<ExecutionStatus, number> {
    const rows = this.db
      .prepare(
        `
      SELECT status, COUNT(*) as count
      FROM executions
      GROUP BY status
    `
      )
      .all() as { status: string; count: number }[];

    const result: Record<string, number> = {
      [ExecutionStatus.PENDING]: 0,
      [ExecutionStatus.RUNNING]: 0,
      [ExecutionStatus.COMPLETED]: 0,
      [ExecutionStatus.FAILED]: 0,
    };

    for (const row of rows) {
      result[row.status] = row.count;
    }

    return result as Record<ExecutionStatus, number>;
  }

  /**
   * Gets the total count of executions.
   *
   * @returns Total count
   */
  count(): number {
    const row = this.db
      .prepare('SELECT COUNT(*) as count FROM executions')
      .get() as { count: number };
    return row.count;
  }

  /**
   * Finds the most recent execution.
   *
   * @returns The most recent execution or null
   */
  findLatest(): Execution | null {
    const row = this.db
      .prepare(
        `
      SELECT * FROM executions
      ORDER BY created_at DESC
      LIMIT 1
    `
      )
      .get() as ExecutionRow | undefined;

    return row ? this.mapRow(row) : null;
  }

  /**
   * Finds executions within a date range.
   *
   * @param startDate - Start of date range (ISO string)
   * @param endDate - End of date range (ISO string)
   * @returns Array of matching executions
   */
  findByDateRange(startDate: string, endDate: string): Execution[] {
    const rows = this.db
      .prepare(
        `
      SELECT * FROM executions
      WHERE created_at >= ? AND created_at <= ?
      ORDER BY created_at DESC
    `
      )
      .all(startDate, endDate) as ExecutionRow[];

    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Maps a database row to an Execution object.
   */
  private mapRow(row: ExecutionRow): Execution {
    return {
      id: row.id,
      started_at: row.started_at,
      finished_at: row.finished_at,
      status: row.status as ExecutionStatus,
      config: JSON.parse(row.config) as ExecutionConfig,
      created_at: row.created_at,
    };
  }
}
