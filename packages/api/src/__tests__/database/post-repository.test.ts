/**
 * PostRepository Tests
 * Story 4.1 - Persistencia com SQLite
 *
 * Tests for CRUD operations on posts.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { PostRepository } from '../../database/repositories/post-repository';
import { ExecutionRepository } from '../../database/repositories/execution-repository';
import { AssetRepository } from '../../database/repositories/asset-repository';
import { ScoreRepository } from '../../database/repositories/score-repository';
import { runTestMigrations } from '../../database/migrate';
import { PostStatus, AssetType } from '../../database/types';

describe('PostRepository', () => {
  let db: Database.Database;
  let repo: PostRepository;
  let executionRepo: ExecutionRepository;
  let assetRepo: AssetRepository;
  let scoreRepo: ScoreRepository;
  let executionId: string;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    runTestMigrations(db);
    repo = new PostRepository(db);
    executionRepo = new ExecutionRepository(db);
    assetRepo = new AssetRepository(db);
    scoreRepo = new ScoreRepository(db);

    // Create a parent execution for posts
    const execution = executionRepo.create({});
    executionId = execution.id;
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('should create post with required fields', () => {
      const post = repo.create({
        execution_id: executionId,
        topic: 'React 19 Features',
      });

      expect(post.id).toBeDefined();
      expect(post.execution_id).toBe(executionId);
      expect(post.topic).toBe('React 19 Features');
      expect(post.status).toBe(PostStatus.PENDING);
      expect(post.text_ig).toBeNull();
      expect(post.text_linkedin).toBeNull();
    });

    it('should create post with all fields', () => {
      const post = repo.create({
        execution_id: executionId,
        topic: 'TypeScript Tips',
        text_ig: 'Instagram caption here',
        text_linkedin: 'LinkedIn post here',
        status: PostStatus.APPROVED,
      });

      expect(post.text_ig).toBe('Instagram caption here');
      expect(post.text_linkedin).toBe('LinkedIn post here');
      expect(post.status).toBe(PostStatus.APPROVED);
    });

    it('should create post with custom id', () => {
      const post = repo.create({
        id: 'custom-post-id',
        execution_id: executionId,
        topic: 'Test Topic',
      });

      expect(post.id).toBe('custom-post-id');
    });

    it('should fail if execution_id does not exist', () => {
      expect(() => {
        repo.create({
          execution_id: 'non-existent',
          topic: 'Test',
        });
      }).toThrow();
    });
  });

  describe('findById', () => {
    it('should return null for non-existent id', () => {
      expect(repo.findById('non-existent')).toBeNull();
    });

    it('should return post by id', () => {
      const created = repo.create({
        execution_id: executionId,
        topic: 'Test Topic',
      });
      const found = repo.findById(created.id);

      expect(found).toEqual(created);
    });
  });

  describe('findByExecutionId', () => {
    it('should return empty array when no posts', () => {
      const result = repo.findByExecutionId(executionId);
      expect(result).toEqual([]);
    });

    it('should return posts for execution', () => {
      repo.create({ execution_id: executionId, topic: 'Topic 1' });
      repo.create({ execution_id: executionId, topic: 'Topic 2' });

      const result = repo.findByExecutionId(executionId);
      expect(result).toHaveLength(2);
    });

    it('should only return posts for specified execution', () => {
      // Create another execution
      const exec2 = executionRepo.create({});

      repo.create({ execution_id: executionId, topic: 'Exec1 Post' });
      repo.create({ execution_id: exec2.id, topic: 'Exec2 Post' });

      const result = repo.findByExecutionId(executionId);
      expect(result).toHaveLength(1);
      expect(result[0].topic).toBe('Exec1 Post');
    });
  });

  describe('findAll', () => {
    it('should return empty array when no posts', () => {
      expect(repo.findAll()).toEqual([]);
    });

    it('should return all posts', () => {
      repo.create({ execution_id: executionId, topic: 'Topic 1' });
      repo.create({ execution_id: executionId, topic: 'Topic 2' });

      expect(repo.findAll()).toHaveLength(2);
    });

    it('should respect limit and offset', () => {
      for (let i = 0; i < 10; i++) {
        repo.create({ execution_id: executionId, topic: `Topic ${i}` });
      }

      const result = repo.findAll({ limit: 3, offset: 2 });
      expect(result).toHaveLength(3);
    });
  });

  describe('update', () => {
    it('should update topic', () => {
      const created = repo.create({
        execution_id: executionId,
        topic: 'Original',
      });
      const updated = repo.update(created.id, { topic: 'Updated' });

      expect(updated?.topic).toBe('Updated');
    });

    it('should update text_ig', () => {
      const created = repo.create({
        execution_id: executionId,
        topic: 'Test',
      });
      const updated = repo.update(created.id, { text_ig: 'New IG text' });

      expect(updated?.text_ig).toBe('New IG text');
    });

    it('should update text_linkedin', () => {
      const created = repo.create({
        execution_id: executionId,
        topic: 'Test',
      });
      const updated = repo.update(created.id, {
        text_linkedin: 'New LinkedIn text',
      });

      expect(updated?.text_linkedin).toBe('New LinkedIn text');
    });

    it('should update status', () => {
      const created = repo.create({
        execution_id: executionId,
        topic: 'Test',
      });
      const updated = repo.update(created.id, { status: PostStatus.APPROVED });

      expect(updated?.status).toBe(PostStatus.APPROVED);
    });

    it('should return null for non-existent id', () => {
      const updated = repo.update('non-existent', { topic: 'New' });
      expect(updated).toBeNull();
    });

    it('should update multiple fields', () => {
      const created = repo.create({
        execution_id: executionId,
        topic: 'Test',
      });
      const updated = repo.update(created.id, {
        topic: 'New Topic',
        text_ig: 'IG text',
        status: PostStatus.NEEDS_REVIEW,
      });

      expect(updated?.topic).toBe('New Topic');
      expect(updated?.text_ig).toBe('IG text');
      expect(updated?.status).toBe(PostStatus.NEEDS_REVIEW);
    });
  });

  describe('delete', () => {
    it('should return false for non-existent id', () => {
      expect(repo.delete('non-existent')).toBe(false);
    });

    it('should delete post and return true', () => {
      const created = repo.create({
        execution_id: executionId,
        topic: 'Test',
      });
      const result = repo.delete(created.id);

      expect(result).toBe(true);
      expect(repo.findById(created.id)).toBeNull();
    });

    it('should cascade delete assets', () => {
      const post = repo.create({
        execution_id: executionId,
        topic: 'Test',
      });
      assetRepo.create({
        post_id: post.id,
        type: AssetType.IMAGE,
        path: '/test.png',
      });

      repo.delete(post.id);

      expect(assetRepo.findByPostId(post.id)).toHaveLength(0);
    });

    it('should cascade delete score', () => {
      const post = repo.create({
        execution_id: executionId,
        topic: 'Test',
      });
      scoreRepo.create({
        post_id: post.id,
        overall_score: 8.0,
      });

      repo.delete(post.id);

      expect(scoreRepo.findByPostId(post.id)).toBeNull();
    });
  });

  describe('findByStatus', () => {
    it('should return posts with specific status', () => {
      repo.create({
        execution_id: executionId,
        topic: 'Pending 1',
        status: PostStatus.PENDING,
      });
      repo.create({
        execution_id: executionId,
        topic: 'Approved',
        status: PostStatus.APPROVED,
      });
      repo.create({
        execution_id: executionId,
        topic: 'Pending 2',
        status: PostStatus.PENDING,
      });

      const pending = repo.findByStatus(PostStatus.PENDING);
      expect(pending).toHaveLength(2);

      const approved = repo.findByStatus(PostStatus.APPROVED);
      expect(approved).toHaveLength(1);
    });
  });

  describe('findWithAssets', () => {
    it('should return null for non-existent post', () => {
      expect(repo.findWithAssets('non-existent')).toBeNull();
    });

    it('should return post with empty assets array', () => {
      const post = repo.create({
        execution_id: executionId,
        topic: 'Test',
      });
      const result = repo.findWithAssets(post.id);

      expect(result).toBeDefined();
      expect(result?.assets).toEqual([]);
    });

    it('should return post with assets', () => {
      const post = repo.create({
        execution_id: executionId,
        topic: 'Test',
      });
      assetRepo.create({
        post_id: post.id,
        type: AssetType.IMAGE,
        path: '/image.png',
      });
      assetRepo.create({
        post_id: post.id,
        type: AssetType.CAROUSEL,
        path: '/slides/',
      });

      const result = repo.findWithAssets(post.id);

      expect(result?.assets).toHaveLength(2);
      expect(result?.assets[0].type).toBe(AssetType.IMAGE);
    });
  });

  describe('findWithScore', () => {
    it('should return null for non-existent post', () => {
      expect(repo.findWithScore('non-existent')).toBeNull();
    });

    it('should return post with null score when no score exists', () => {
      const post = repo.create({
        execution_id: executionId,
        topic: 'Test',
      });
      const result = repo.findWithScore(post.id);

      expect(result).toBeDefined();
      expect(result?.score).toBeNull();
    });

    it('should return post with score', () => {
      const post = repo.create({
        execution_id: executionId,
        topic: 'Test',
      });
      scoreRepo.create({
        post_id: post.id,
        overall_score: 8.5,
        criteria_breakdown: { clarity: 9, relevance: 8 },
        approved: true,
      });

      const result = repo.findWithScore(post.id);

      expect(result?.score).toBeDefined();
      expect(result?.score?.overall_score).toBe(8.5);
      expect(result?.score?.approved).toBe(true);
    });
  });

  describe('count', () => {
    it('should return 0 when no posts', () => {
      expect(repo.count()).toBe(0);
    });

    it('should return correct count', () => {
      repo.create({ execution_id: executionId, topic: 'Topic 1' });
      repo.create({ execution_id: executionId, topic: 'Topic 2' });

      expect(repo.count()).toBe(2);
    });
  });

  describe('countByExecutionId', () => {
    it('should return 0 for execution with no posts', () => {
      expect(repo.countByExecutionId(executionId)).toBe(0);
    });

    it('should return correct count for execution', () => {
      repo.create({ execution_id: executionId, topic: 'Topic 1' });
      repo.create({ execution_id: executionId, topic: 'Topic 2' });

      expect(repo.countByExecutionId(executionId)).toBe(2);
    });
  });

  describe('countByStatus', () => {
    it('should return zero counts when no posts', () => {
      const counts = repo.countByStatus();

      expect(counts[PostStatus.PENDING]).toBe(0);
      expect(counts[PostStatus.APPROVED]).toBe(0);
      expect(counts[PostStatus.REJECTED]).toBe(0);
      expect(counts[PostStatus.NEEDS_REVIEW]).toBe(0);
    });

    it('should count posts by status', () => {
      repo.create({
        execution_id: executionId,
        topic: 'P1',
        status: PostStatus.PENDING,
      });
      repo.create({
        execution_id: executionId,
        topic: 'P2',
        status: PostStatus.APPROVED,
      });
      repo.create({
        execution_id: executionId,
        topic: 'P3',
        status: PostStatus.APPROVED,
      });

      const counts = repo.countByStatus();

      expect(counts[PostStatus.PENDING]).toBe(1);
      expect(counts[PostStatus.APPROVED]).toBe(2);
    });
  });

  describe('findApproved', () => {
    it('should return only approved posts', () => {
      repo.create({
        execution_id: executionId,
        topic: 'Pending',
        status: PostStatus.PENDING,
      });
      repo.create({
        execution_id: executionId,
        topic: 'Approved 1',
        status: PostStatus.APPROVED,
      });
      repo.create({
        execution_id: executionId,
        topic: 'Approved 2',
        status: PostStatus.APPROVED,
      });

      const result = repo.findApproved();

      expect(result).toHaveLength(2);
      expect(result.every((p) => p.status === PostStatus.APPROVED)).toBe(true);
    });

    it('should respect limit', () => {
      for (let i = 0; i < 10; i++) {
        repo.create({
          execution_id: executionId,
          topic: `Approved ${i}`,
          status: PostStatus.APPROVED,
        });
      }

      const result = repo.findApproved(5);
      expect(result).toHaveLength(5);
    });
  });
});
