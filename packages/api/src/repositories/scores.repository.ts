/**
 * Scores Repository
 * Story 4.7 - Pipeline Completo End-to-End
 *
 * Data access layer for QA scores.
 * Uses an in-memory store - can be replaced with database implementation.
 */

import { createLogger, generateId } from '@social-content/shared';

const logger = createLogger('repository:scores');

/**
 * Score record for database storage
 */
export interface ScoreRecord {
  /** Unique score identifier */
  id: string;
  /** Post this score belongs to */
  postId: string;
  /** Overall quality score (0-10) */
  overallScore: number;
  /** Criteria breakdown as JSON string */
  criteriaBreakdown: string;
  /** When the score was created */
  createdAt: Date;
}

/**
 * Input for creating a score
 */
export interface ScoreCreateInput {
  /** Optional custom id (auto-generated if not provided) */
  id?: string;
  /** Post this score belongs to */
  postId: string;
  /** Overall quality score (0-10) */
  overallScore: number;
  /** Criteria breakdown as JSON string */
  criteriaBreakdown: string;
}

/**
 * Parsed criteria breakdown
 */
export interface CriteriaBreakdown {
  /** Feedback comments from QA */
  feedback?: string[];
  /** Individual criteria scores */
  criteria?: {
    name: string;
    score: number;
    weight: number;
  }[];
  /** Text quality score */
  textScore?: number;
  /** Visual quality score */
  visualScore?: number;
  /** Engagement potential score */
  engagementScore?: number;
}

/**
 * Scores Repository Interface
 */
export interface IScoresRepository {
  /** Create a new score */
  create(score: ScoreCreateInput): Promise<ScoreRecord>;
  /** Create multiple scores */
  createMany(scores: ScoreCreateInput[]): Promise<ScoreRecord[]>;
  /** Find score by ID */
  findById(id: string): Promise<ScoreRecord | null>;
  /** Find score by post ID */
  findByPostId(postId: string): Promise<ScoreRecord | null>;
  /** Find all scores for multiple posts */
  findByPostIds(postIds: string[]): Promise<ScoreRecord[]>;
  /** Update a score */
  update(id: string, updates: Partial<ScoreCreateInput>): Promise<ScoreRecord | null>;
  /** Delete a score */
  delete(id: string): Promise<boolean>;
  /** Delete score by post ID */
  deleteByPostId(postId: string): Promise<boolean>;
  /** Check if a score exists for a post */
  existsForPost(postId: string): Promise<boolean>;
  /** Get total count of scores */
  count(): Promise<number>;
  /** Get average score across all posts */
  getAverageScore(): Promise<number>;
  /** Get scores distribution */
  getScoreDistribution(): Promise<{ excellent: number; good: number; needsWork: number }>;
}

/**
 * In-memory Scores Repository Implementation
 */
export class InMemoryScoresRepository implements IScoresRepository {
  private scores: Map<string, ScoreRecord> = new Map();

  async create(input: ScoreCreateInput): Promise<ScoreRecord> {
    const id = input.id || `score-${generateId()}`;
    const now = new Date();

    const score: ScoreRecord = {
      id,
      ...input,
      createdAt: now,
    };

    this.scores.set(id, score);
    logger.debug('Created score', { id, postId: input.postId, overallScore: input.overallScore });

    return { ...score };
  }

  async createMany(inputs: ScoreCreateInput[]): Promise<ScoreRecord[]> {
    const created: ScoreRecord[] = [];
    const now = new Date();

    for (const input of inputs) {
      const id = input.id || `score-${generateId()}`;

      const score: ScoreRecord = {
        id,
        ...input,
        createdAt: now,
      };

      this.scores.set(id, score);
      created.push({ ...score });
    }

    logger.debug('Created multiple scores', { count: created.length });
    return created;
  }

  async findById(id: string): Promise<ScoreRecord | null> {
    const score = this.scores.get(id);
    if (!score) {
      return null;
    }
    return { ...score };
  }

  async findByPostId(postId: string): Promise<ScoreRecord | null> {
    for (const score of this.scores.values()) {
      if (score.postId === postId) {
        return { ...score };
      }
    }
    return null;
  }

  async findByPostIds(postIds: string[]): Promise<ScoreRecord[]> {
    const postIdSet = new Set(postIds);
    const results: ScoreRecord[] = [];

    for (const score of this.scores.values()) {
      if (postIdSet.has(score.postId)) {
        results.push({ ...score });
      }
    }

    logger.debug('Found scores by postIds', { count: results.length });
    return results;
  }

  async update(id: string, updates: Partial<ScoreCreateInput>): Promise<ScoreRecord | null> {
    const existing = this.scores.get(id);
    if (!existing) {
      return null;
    }

    const updated: ScoreRecord = {
      ...existing,
      ...updates,
    };

    this.scores.set(id, updated);
    logger.debug('Updated score', { id });

    return { ...updated };
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.scores.delete(id);
    if (deleted) {
      logger.debug('Deleted score', { id });
    }
    return deleted;
  }

  async deleteByPostId(postId: string): Promise<boolean> {
    for (const [id, score] of this.scores.entries()) {
      if (score.postId === postId) {
        this.scores.delete(id);
        logger.debug('Deleted score by postId', { id, postId });
        return true;
      }
    }
    return false;
  }

  async existsForPost(postId: string): Promise<boolean> {
    for (const score of this.scores.values()) {
      if (score.postId === postId) {
        return true;
      }
    }
    return false;
  }

  async count(): Promise<number> {
    return this.scores.size;
  }

  async getAverageScore(): Promise<number> {
    if (this.scores.size === 0) {
      return 0;
    }

    let total = 0;
    for (const score of this.scores.values()) {
      total += score.overallScore;
    }

    return Math.round((total / this.scores.size) * 100) / 100;
  }

  async getScoreDistribution(): Promise<{ excellent: number; good: number; needsWork: number }> {
    const distribution = {
      excellent: 0, // >= 8.0
      good: 0,      // >= 6.0 && < 8.0
      needsWork: 0, // < 6.0
    };

    for (const score of this.scores.values()) {
      if (score.overallScore >= 8.0) {
        distribution.excellent++;
      } else if (score.overallScore >= 6.0) {
        distribution.good++;
      } else {
        distribution.needsWork++;
      }
    }

    return distribution;
  }

  /**
   * Clear all scores (for testing)
   */
  clear(): void {
    this.scores.clear();
    logger.debug('Cleared all scores');
  }

  /**
   * Seed with test data (for testing)
   */
  seed(scores: ScoreRecord[]): void {
    for (const score of scores) {
      this.scores.set(score.id, score);
    }
    logger.debug('Seeded scores', { count: scores.length });
  }
}

// Singleton instance
let instance: IScoresRepository | null = null;

/**
 * Get the scores repository singleton
 */
export function getScoresRepository(): IScoresRepository {
  if (!instance) {
    instance = new InMemoryScoresRepository();
  }
  return instance;
}

/**
 * Create a new scores repository instance (for testing)
 */
export function createScoresRepository(): InMemoryScoresRepository {
  return new InMemoryScoresRepository();
}

/**
 * Set the scores repository instance (for dependency injection)
 */
export function setScoresRepository(repo: IScoresRepository): void {
  instance = repo;
}
