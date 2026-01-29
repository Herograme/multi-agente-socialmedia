/**
 * ScoreRepository Tests
 * Story 4.1 - Persistencia com SQLite
 *
 * Tests for CRUD operations on scores.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { ScoreRepository } from '../../database/repositories/score-repository';
import { PostRepository } from '../../database/repositories/post-repository';
import { ExecutionRepository } from '../../database/repositories/execution-repository';
import { runTestMigrations } from '../../database/migrate';

describe('ScoreRepository', () => {
  let db: Database.Database;
  let repo: ScoreRepository;
  let postRepo: PostRepository;
  let executionRepo: ExecutionRepository;
  let postId: string;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    runTestMigrations(db);
    repo = new ScoreRepository(db);
    postRepo = new PostRepository(db);
    executionRepo = new ExecutionRepository(db);

    // Create parent execution and post
    const execution = executionRepo.create({});
    const post = postRepo.create({
      execution_id: execution.id,
      topic: 'Test Post',
    });
    postId = post.id;
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('should create score with required fields', () => {
      const score = repo.create({
        post_id: postId,
        overall_score: 8.5,
      });

      expect(score.id).toBeDefined();
      expect(score.post_id).toBe(postId);
      expect(score.overall_score).toBe(8.5);
      expect(score.criteria_breakdown).toEqual({});
      expect(score.feedback).toBeNull();
      expect(score.approved).toBe(false);
    });

    it('should create score with all fields', () => {
      const score = repo.create({
        post_id: postId,
        overall_score: 9.0,
        criteria_breakdown: {
          clarity: 9,
          relevance: 8,
          engagement: 10,
        },
        feedback: 'Great post!',
        approved: true,
      });

      expect(score.criteria_breakdown).toEqual({
        clarity: 9,
        relevance: 8,
        engagement: 10,
      });
      expect(score.feedback).toBe('Great post!');
      expect(score.approved).toBe(true);
    });

    it('should create score with custom id', () => {
      const score = repo.create({
        id: 'custom-score-id',
        post_id: postId,
        overall_score: 7.5,
      });

      expect(score.id).toBe('custom-score-id');
    });

    it('should fail if post_id does not exist', () => {
      expect(() => {
        repo.create({
          post_id: 'non-existent',
          overall_score: 8.0,
        });
      }).toThrow();
    });

    it('should enforce one score per post (unique constraint)', () => {
      repo.create({ post_id: postId, overall_score: 8.0 });

      expect(() => {
        repo.create({ post_id: postId, overall_score: 9.0 });
      }).toThrow();
    });

    it('should enforce score range (0-10)', () => {
      expect(() => {
        repo.create({ post_id: postId, overall_score: 11 });
      }).toThrow();

      // Create a new post for the second test
      const post2 = postRepo.create({
        execution_id: executionRepo.create({}).id,
        topic: 'Post 2',
      });

      expect(() => {
        repo.create({ post_id: post2.id, overall_score: -1 });
      }).toThrow();
    });
  });

  describe('findById', () => {
    it('should return null for non-existent id', () => {
      expect(repo.findById('non-existent')).toBeNull();
    });

    it('should return score by id', () => {
      const created = repo.create({
        post_id: postId,
        overall_score: 8.0,
      });
      const found = repo.findById(created.id);

      expect(found).toEqual(created);
    });
  });

  describe('findByPostId', () => {
    it('should return null when post has no score', () => {
      expect(repo.findByPostId(postId)).toBeNull();
    });

    it('should return score for post', () => {
      const created = repo.create({
        post_id: postId,
        overall_score: 8.5,
      });
      const found = repo.findByPostId(postId);

      expect(found).toEqual(created);
    });
  });

  describe('findAll', () => {
    it('should return empty array when no scores', () => {
      expect(repo.findAll()).toEqual([]);
    });

    it('should return all scores', () => {
      // Create multiple posts and scores
      const post2 = postRepo.create({
        execution_id: executionRepo.create({}).id,
        topic: 'Post 2',
      });

      repo.create({ post_id: postId, overall_score: 8.0 });
      repo.create({ post_id: post2.id, overall_score: 7.5 });

      expect(repo.findAll()).toHaveLength(2);
    });

    it('should respect limit and offset', () => {
      // Create multiple posts and scores
      for (let i = 0; i < 10; i++) {
        const post = postRepo.create({
          execution_id: executionRepo.create({}).id,
          topic: `Post ${i}`,
        });
        repo.create({ post_id: post.id, overall_score: 5 + i * 0.5 });
      }

      const result = repo.findAll({ limit: 3, offset: 2 });
      expect(result).toHaveLength(3);
    });
  });

  describe('update', () => {
    it('should update overall_score', () => {
      const created = repo.create({
        post_id: postId,
        overall_score: 7.0,
      });
      const updated = repo.update(created.id, { overall_score: 8.5 });

      expect(updated?.overall_score).toBe(8.5);
    });

    it('should update criteria_breakdown', () => {
      const created = repo.create({
        post_id: postId,
        overall_score: 8.0,
      });
      const updated = repo.update(created.id, {
        criteria_breakdown: { clarity: 9, grammar: 8 },
      });

      expect(updated?.criteria_breakdown).toEqual({ clarity: 9, grammar: 8 });
    });

    it('should update feedback', () => {
      const created = repo.create({
        post_id: postId,
        overall_score: 8.0,
      });
      const updated = repo.update(created.id, {
        feedback: 'Needs more detail',
      });

      expect(updated?.feedback).toBe('Needs more detail');
    });

    it('should update approved', () => {
      const created = repo.create({
        post_id: postId,
        overall_score: 8.0,
      });
      const updated = repo.update(created.id, { approved: true });

      expect(updated?.approved).toBe(true);
    });

    it('should return null for non-existent id', () => {
      const updated = repo.update('non-existent', { overall_score: 9.0 });
      expect(updated).toBeNull();
    });

    it('should update multiple fields', () => {
      const created = repo.create({
        post_id: postId,
        overall_score: 6.0,
      });
      const updated = repo.update(created.id, {
        overall_score: 8.5,
        feedback: 'Improved after revision',
        approved: true,
      });

      expect(updated?.overall_score).toBe(8.5);
      expect(updated?.feedback).toBe('Improved after revision');
      expect(updated?.approved).toBe(true);
    });
  });

  describe('delete', () => {
    it('should return false for non-existent id', () => {
      expect(repo.delete('non-existent')).toBe(false);
    });

    it('should delete score and return true', () => {
      const created = repo.create({
        post_id: postId,
        overall_score: 8.0,
      });
      const result = repo.delete(created.id);

      expect(result).toBe(true);
      expect(repo.findById(created.id)).toBeNull();
    });
  });

  describe('findAboveThreshold', () => {
    beforeEach(() => {
      // Create multiple posts and scores with varying scores
      for (let i = 0; i < 10; i++) {
        const post = postRepo.create({
          execution_id: executionRepo.create({}).id,
          topic: `Post ${i}`,
        });
        repo.create({ post_id: post.id, overall_score: i + 1 }); // Scores 1-10
      }
    });

    it('should return scores above threshold', () => {
      const result = repo.findAboveThreshold(7);
      expect(result).toHaveLength(4); // 7, 8, 9, 10
      expect(result.every((s) => s.overall_score >= 7)).toBe(true);
    });

    it('should order by score descending', () => {
      const result = repo.findAboveThreshold(5);
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].overall_score).toBeGreaterThanOrEqual(
          result[i + 1].overall_score
        );
      }
    });
  });

  describe('findBelowThreshold', () => {
    beforeEach(() => {
      // Create multiple posts and scores
      for (let i = 0; i < 10; i++) {
        const post = postRepo.create({
          execution_id: executionRepo.create({}).id,
          topic: `Post ${i}`,
        });
        repo.create({ post_id: post.id, overall_score: i + 1 });
      }
    });

    it('should return scores below threshold', () => {
      const result = repo.findBelowThreshold(5);
      expect(result).toHaveLength(4); // 1, 2, 3, 4
      expect(result.every((s) => s.overall_score < 5)).toBe(true);
    });
  });

  describe('getAverageScore', () => {
    it('should return 0 when no scores', () => {
      expect(repo.getAverageScore()).toBe(0);
    });

    it('should return correct average', () => {
      const post2 = postRepo.create({
        execution_id: executionRepo.create({}).id,
        topic: 'Post 2',
      });
      const post3 = postRepo.create({
        execution_id: executionRepo.create({}).id,
        topic: 'Post 3',
      });

      repo.create({ post_id: postId, overall_score: 6.0 });
      repo.create({ post_id: post2.id, overall_score: 8.0 });
      repo.create({ post_id: post3.id, overall_score: 10.0 });

      expect(repo.getAverageScore()).toBe(8.0);
    });
  });

  describe('count', () => {
    it('should return 0 when no scores', () => {
      expect(repo.count()).toBe(0);
    });

    it('should return correct count', () => {
      const post2 = postRepo.create({
        execution_id: executionRepo.create({}).id,
        topic: 'Post 2',
      });

      repo.create({ post_id: postId, overall_score: 8.0 });
      repo.create({ post_id: post2.id, overall_score: 7.5 });

      expect(repo.count()).toBe(2);
    });
  });

  describe('countByApproval', () => {
    it('should return zero counts when no scores', () => {
      const result = repo.countByApproval();
      expect(result.approved).toBe(0);
      expect(result.rejected).toBe(0);
    });

    it('should count approved and rejected', () => {
      const post2 = postRepo.create({
        execution_id: executionRepo.create({}).id,
        topic: 'Post 2',
      });
      const post3 = postRepo.create({
        execution_id: executionRepo.create({}).id,
        topic: 'Post 3',
      });

      repo.create({ post_id: postId, overall_score: 8.0, approved: true });
      repo.create({ post_id: post2.id, overall_score: 7.5, approved: true });
      repo.create({ post_id: post3.id, overall_score: 5.0, approved: false });

      const result = repo.countByApproval();
      expect(result.approved).toBe(2);
      expect(result.rejected).toBe(1);
    });
  });

  describe('findApproved', () => {
    it('should return only approved scores', () => {
      const post2 = postRepo.create({
        execution_id: executionRepo.create({}).id,
        topic: 'Post 2',
      });
      const post3 = postRepo.create({
        execution_id: executionRepo.create({}).id,
        topic: 'Post 3',
      });

      repo.create({ post_id: postId, overall_score: 8.0, approved: true });
      repo.create({ post_id: post2.id, overall_score: 7.5, approved: false });
      repo.create({ post_id: post3.id, overall_score: 9.0, approved: true });

      const result = repo.findApproved();
      expect(result).toHaveLength(2);
      expect(result.every((s) => s.approved)).toBe(true);
    });

    it('should order by score descending', () => {
      const post2 = postRepo.create({
        execution_id: executionRepo.create({}).id,
        topic: 'Post 2',
      });

      repo.create({ post_id: postId, overall_score: 7.0, approved: true });
      repo.create({ post_id: post2.id, overall_score: 9.0, approved: true });

      const result = repo.findApproved();
      expect(result[0].overall_score).toBe(9.0);
      expect(result[1].overall_score).toBe(7.0);
    });

    it('should respect limit', () => {
      for (let i = 0; i < 10; i++) {
        const post = postRepo.create({
          execution_id: executionRepo.create({}).id,
          topic: `Post ${i}`,
        });
        repo.create({ post_id: post.id, overall_score: 8.0, approved: true });
      }

      const result = repo.findApproved(5);
      expect(result).toHaveLength(5);
    });
  });

  describe('getStatistics', () => {
    it('should return zeros when no scores', () => {
      const stats = repo.getStatistics();

      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
      expect(stats.avg).toBe(0);
      expect(stats.count).toBe(0);
    });

    it('should return correct statistics', () => {
      const post2 = postRepo.create({
        execution_id: executionRepo.create({}).id,
        topic: 'Post 2',
      });
      const post3 = postRepo.create({
        execution_id: executionRepo.create({}).id,
        topic: 'Post 3',
      });

      repo.create({ post_id: postId, overall_score: 5.0 });
      repo.create({ post_id: post2.id, overall_score: 8.0 });
      repo.create({ post_id: post3.id, overall_score: 10.0 });

      const stats = repo.getStatistics();

      expect(stats.min).toBe(5.0);
      expect(stats.max).toBe(10.0);
      expect(stats.avg).toBeCloseTo(7.67, 1);
      expect(stats.count).toBe(3);
    });
  });
});
