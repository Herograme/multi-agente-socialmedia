/**
 * Executions Repository
 * Story 4.7 - Pipeline Completo End-to-End
 *
 * Data access layer for pipeline execution records.
 * Uses an in-memory store - can be replaced with database implementation.
 */

import { createLogger, generateId } from '@social-content/shared';
import type {
  ExecutionRecord,
  ExecutionStatus,
  ExecutionFilters,
  ExecutionStats,
} from '@social-content/agents';

const logger = createLogger('repository:executions');

/**
 * Input for creating an execution record
 */
export type ExecutionCreateInput = Omit<ExecutionRecord, 'id'>;

/**
 * Executions Repository Interface
 */
export interface IExecutionsRepository {
  /** Create a new execution record */
  create(execution: ExecutionCreateInput): Promise<ExecutionRecord>;
  /** Find execution by ID */
  findById(id: string): Promise<ExecutionRecord | null>;
  /** Find all executions with optional filters */
  findAll(filters?: ExecutionFilters): Promise<ExecutionRecord[]>;
  /** Update execution status with optional metadata */
  updateStatus(
    id: string,
    status: ExecutionStatus,
    metadata?: Partial<Omit<ExecutionRecord, 'id' | 'status'>>
  ): Promise<ExecutionRecord | null>;
  /** Get aggregated execution statistics */
  getStats(): Promise<ExecutionStats>;
  /** Check if an execution exists */
  exists(id: string): Promise<boolean>;
  /** Get count of executions */
  count(): Promise<number>;
  /** Delete an execution record */
  delete(id: string): Promise<boolean>;
}

/**
 * In-memory Executions Repository Implementation
 * This implementation stores executions in memory for development/testing.
 * Should be replaced with a proper database implementation for production.
 */
export class InMemoryExecutionsRepository implements IExecutionsRepository {
  private executions: Map<string, ExecutionRecord> = new Map();

  async create(input: ExecutionCreateInput): Promise<ExecutionRecord> {
    const id = `exec-${generateId()}`;

    const execution: ExecutionRecord = {
      id,
      ...input,
    };

    this.executions.set(id, execution);
    logger.debug('Created execution record', { id, status: input.status });

    return { ...execution };
  }

  async findById(id: string): Promise<ExecutionRecord | null> {
    const execution = this.executions.get(id);
    if (!execution) {
      return null;
    }
    return { ...execution };
  }

  async findAll(filters?: ExecutionFilters): Promise<ExecutionRecord[]> {
    let results = Array.from(this.executions.values());

    // Apply filters
    if (filters?.status) {
      results = results.filter((e) => e.status === filters.status);
    }

    if (filters?.startedAfter) {
      results = results.filter((e) => e.startedAt >= filters.startedAfter!);
    }

    if (filters?.startedBefore) {
      results = results.filter((e) => e.startedAt <= filters.startedBefore!);
    }

    // Sort by startedAt descending (most recent first)
    results.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

    // Apply pagination
    if (filters?.offset) {
      results = results.slice(filters.offset);
    }

    if (filters?.limit) {
      results = results.slice(0, filters.limit);
    }

    logger.debug('Found executions', { count: results.length, filters });
    return results.map((e) => ({ ...e }));
  }

  async updateStatus(
    id: string,
    status: ExecutionStatus,
    metadata?: Partial<Omit<ExecutionRecord, 'id' | 'status'>>
  ): Promise<ExecutionRecord | null> {
    const existing = this.executions.get(id);
    if (!existing) {
      return null;
    }

    const updated: ExecutionRecord = {
      ...existing,
      status,
      ...(metadata || {}),
    };

    this.executions.set(id, updated);
    logger.debug('Updated execution status', { id, status, metadata: !!metadata });

    return { ...updated };
  }

  async getStats(): Promise<ExecutionStats> {
    const all = Array.from(this.executions.values());

    const completed = all.filter((e) => e.status === 'completed');
    const failed = all.filter((e) => e.status === 'failed');
    const cancelled = all.filter((e) => e.status === 'cancelled');

    // Calculate average duration from completed executions
    const completedWithDuration = completed.filter((e) => e.completedAt);
    const totalDuration = completedWithDuration.reduce((sum, e) => {
      return sum + (e.completedAt!.getTime() - e.startedAt.getTime());
    }, 0);
    const averageDurationMs = completedWithDuration.length > 0
      ? totalDuration / completedWithDuration.length
      : 0;

    // Calculate average score and total posts from summaries
    let totalScore = 0;
    let scoreCount = 0;
    let totalPosts = 0;

    for (const execution of completed) {
      if (execution.summary) {
        try {
          const summary = JSON.parse(execution.summary);
          if (summary.averageScore) {
            totalScore += summary.averageScore;
            scoreCount++;
          }
          if (summary.totalGenerated) {
            totalPosts += summary.totalGenerated;
          }
        } catch {
          // Ignore parse errors
        }
      }
    }

    const stats: ExecutionStats = {
      total: all.length,
      completed: completed.length,
      failed: failed.length,
      cancelled: cancelled.length,
      averageDurationMs: Math.round(averageDurationMs),
      averageScore: scoreCount > 0 ? Math.round((totalScore / scoreCount) * 100) / 100 : 0,
      totalPostsGenerated: totalPosts,
    };

    logger.debug('Calculated execution stats', { ...stats });
    return stats;
  }

  async exists(id: string): Promise<boolean> {
    return this.executions.has(id);
  }

  async count(): Promise<number> {
    return this.executions.size;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.executions.delete(id);
    if (deleted) {
      logger.debug('Deleted execution record', { id });
    }
    return deleted;
  }

  /**
   * Clear all executions (for testing)
   */
  clear(): void {
    this.executions.clear();
    logger.debug('Cleared all executions');
  }

  /**
   * Seed with test data (for testing)
   */
  seed(executions: ExecutionRecord[]): void {
    for (const execution of executions) {
      this.executions.set(execution.id, execution);
    }
    logger.debug('Seeded executions', { count: executions.length });
  }
}

// Singleton instance
let instance: IExecutionsRepository | null = null;

/**
 * Get the executions repository singleton
 */
export function getExecutionsRepository(): IExecutionsRepository {
  if (!instance) {
    instance = new InMemoryExecutionsRepository();
  }
  return instance;
}

/**
 * Create a new executions repository instance (for testing)
 */
export function createExecutionsRepository(): InMemoryExecutionsRepository {
  return new InMemoryExecutionsRepository();
}

/**
 * Set the executions repository instance (for dependency injection)
 */
export function setExecutionsRepository(repo: IExecutionsRepository): void {
  instance = repo;
}
