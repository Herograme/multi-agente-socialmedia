/**
 * AssetRepository Tests
 * Story 4.1 - Persistencia com SQLite
 *
 * Tests for CRUD operations on assets.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { AssetRepository } from '../../database/repositories/asset-repository';
import { PostRepository } from '../../database/repositories/post-repository';
import { ExecutionRepository } from '../../database/repositories/execution-repository';
import { runTestMigrations } from '../../database/migrate';
import { AssetType } from '../../database/types';

describe('AssetRepository', () => {
  let db: Database.Database;
  let repo: AssetRepository;
  let postRepo: PostRepository;
  let executionRepo: ExecutionRepository;
  let postId: string;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    runTestMigrations(db);
    repo = new AssetRepository(db);
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
    it('should create asset with required fields', () => {
      const asset = repo.create({
        post_id: postId,
        type: AssetType.IMAGE,
        path: '/assets/image.png',
      });

      expect(asset.id).toBeDefined();
      expect(asset.post_id).toBe(postId);
      expect(asset.type).toBe(AssetType.IMAGE);
      expect(asset.path).toBe('/assets/image.png');
      expect(asset.size).toBe(0);
      expect(asset.metadata).toEqual({});
    });

    it('should create asset with all fields', () => {
      const asset = repo.create({
        post_id: postId,
        type: AssetType.CAROUSEL,
        path: '/assets/slides/',
        size: 5120,
        metadata: { slides: 5, format: 'jpg' },
      });

      expect(asset.size).toBe(5120);
      expect(asset.metadata).toEqual({ slides: 5, format: 'jpg' });
    });

    it('should create asset with custom id', () => {
      const asset = repo.create({
        id: 'custom-asset-id',
        post_id: postId,
        type: AssetType.PDF,
        path: '/assets/doc.pdf',
      });

      expect(asset.id).toBe('custom-asset-id');
    });

    it('should fail if post_id does not exist', () => {
      expect(() => {
        repo.create({
          post_id: 'non-existent',
          type: AssetType.IMAGE,
          path: '/test.png',
        });
      }).toThrow();
    });
  });

  describe('createMany', () => {
    it('should create multiple assets in a transaction', () => {
      const assets = repo.createMany([
        { post_id: postId, type: AssetType.IMAGE, path: '/image1.png' },
        { post_id: postId, type: AssetType.IMAGE, path: '/image2.png' },
        { post_id: postId, type: AssetType.PDF, path: '/doc.pdf' },
      ]);

      expect(assets).toHaveLength(3);
      expect(assets[0].path).toBe('/image1.png');
      expect(assets[2].type).toBe(AssetType.PDF);
    });

    it('should rollback all if one fails', () => {
      const initialCount = repo.count();

      expect(() => {
        repo.createMany([
          { post_id: postId, type: AssetType.IMAGE, path: '/valid.png' },
          { post_id: 'invalid', type: AssetType.IMAGE, path: '/fail.png' },
        ]);
      }).toThrow();

      expect(repo.count()).toBe(initialCount);
    });
  });

  describe('findById', () => {
    it('should return null for non-existent id', () => {
      expect(repo.findById('non-existent')).toBeNull();
    });

    it('should return asset by id', () => {
      const created = repo.create({
        post_id: postId,
        type: AssetType.IMAGE,
        path: '/test.png',
      });
      const found = repo.findById(created.id);

      expect(found).toEqual(created);
    });
  });

  describe('findByPostId', () => {
    it('should return empty array when no assets', () => {
      expect(repo.findByPostId(postId)).toEqual([]);
    });

    it('should return assets for post', () => {
      repo.create({ post_id: postId, type: AssetType.IMAGE, path: '/img1.png' });
      repo.create({ post_id: postId, type: AssetType.IMAGE, path: '/img2.png' });

      const result = repo.findByPostId(postId);
      expect(result).toHaveLength(2);
    });

    it('should only return assets for specified post', () => {
      // Create another post
      const post2 = postRepo.create({
        execution_id: executionRepo.create({}).id,
        topic: 'Post 2',
      });

      repo.create({ post_id: postId, type: AssetType.IMAGE, path: '/post1.png' });
      repo.create({ post_id: post2.id, type: AssetType.IMAGE, path: '/post2.png' });

      const result = repo.findByPostId(postId);
      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('/post1.png');
    });
  });

  describe('findByType', () => {
    it('should return assets of specific type for post', () => {
      repo.create({ post_id: postId, type: AssetType.IMAGE, path: '/img.png' });
      repo.create({ post_id: postId, type: AssetType.CAROUSEL, path: '/slides/' });
      repo.create({ post_id: postId, type: AssetType.IMAGE, path: '/img2.png' });
      repo.create({ post_id: postId, type: AssetType.PDF, path: '/doc.pdf' });

      const images = repo.findByType(postId, AssetType.IMAGE);
      expect(images).toHaveLength(2);

      const carousels = repo.findByType(postId, AssetType.CAROUSEL);
      expect(carousels).toHaveLength(1);

      const pdfs = repo.findByType(postId, AssetType.PDF);
      expect(pdfs).toHaveLength(1);
    });
  });

  describe('findAll', () => {
    it('should return empty array when no assets', () => {
      expect(repo.findAll()).toEqual([]);
    });

    it('should return all assets', () => {
      repo.create({ post_id: postId, type: AssetType.IMAGE, path: '/img1.png' });
      repo.create({ post_id: postId, type: AssetType.IMAGE, path: '/img2.png' });

      expect(repo.findAll()).toHaveLength(2);
    });

    it('should respect limit and offset', () => {
      for (let i = 0; i < 10; i++) {
        repo.create({ post_id: postId, type: AssetType.IMAGE, path: `/img${i}.png` });
      }

      const result = repo.findAll({ limit: 3, offset: 2 });
      expect(result).toHaveLength(3);
    });
  });

  describe('update', () => {
    it('should update path', () => {
      const created = repo.create({
        post_id: postId,
        type: AssetType.IMAGE,
        path: '/old.png',
      });
      const updated = repo.update(created.id, { path: '/new.png' });

      expect(updated?.path).toBe('/new.png');
    });

    it('should update size', () => {
      const created = repo.create({
        post_id: postId,
        type: AssetType.IMAGE,
        path: '/test.png',
      });
      const updated = repo.update(created.id, { size: 2048 });

      expect(updated?.size).toBe(2048);
    });

    it('should update metadata', () => {
      const created = repo.create({
        post_id: postId,
        type: AssetType.IMAGE,
        path: '/test.png',
      });
      const updated = repo.update(created.id, {
        metadata: { width: 1920, height: 1080 },
      });

      expect(updated?.metadata).toEqual({ width: 1920, height: 1080 });
    });

    it('should return null for non-existent id', () => {
      const updated = repo.update('non-existent', { path: '/new.png' });
      expect(updated).toBeNull();
    });

    it('should update multiple fields', () => {
      const created = repo.create({
        post_id: postId,
        type: AssetType.IMAGE,
        path: '/old.png',
      });
      const updated = repo.update(created.id, {
        path: '/new.png',
        size: 4096,
        metadata: { optimized: true },
      });

      expect(updated?.path).toBe('/new.png');
      expect(updated?.size).toBe(4096);
      expect(updated?.metadata).toEqual({ optimized: true });
    });
  });

  describe('delete', () => {
    it('should return false for non-existent id', () => {
      expect(repo.delete('non-existent')).toBe(false);
    });

    it('should delete asset and return true', () => {
      const created = repo.create({
        post_id: postId,
        type: AssetType.IMAGE,
        path: '/test.png',
      });
      const result = repo.delete(created.id);

      expect(result).toBe(true);
      expect(repo.findById(created.id)).toBeNull();
    });
  });

  describe('deleteByPostId', () => {
    it('should return 0 when no assets to delete', () => {
      expect(repo.deleteByPostId(postId)).toBe(0);
    });

    it('should delete all assets for post', () => {
      repo.create({ post_id: postId, type: AssetType.IMAGE, path: '/img1.png' });
      repo.create({ post_id: postId, type: AssetType.IMAGE, path: '/img2.png' });
      repo.create({ post_id: postId, type: AssetType.PDF, path: '/doc.pdf' });

      const deleted = repo.deleteByPostId(postId);

      expect(deleted).toBe(3);
      expect(repo.findByPostId(postId)).toHaveLength(0);
    });

    it('should only delete assets for specified post', () => {
      // Create another post
      const post2 = postRepo.create({
        execution_id: executionRepo.create({}).id,
        topic: 'Post 2',
      });

      repo.create({ post_id: postId, type: AssetType.IMAGE, path: '/post1.png' });
      repo.create({ post_id: post2.id, type: AssetType.IMAGE, path: '/post2.png' });

      repo.deleteByPostId(postId);

      expect(repo.findByPostId(postId)).toHaveLength(0);
      expect(repo.findByPostId(post2.id)).toHaveLength(1);
    });
  });

  describe('count', () => {
    it('should return 0 when no assets', () => {
      expect(repo.count()).toBe(0);
    });

    it('should return correct count', () => {
      repo.create({ post_id: postId, type: AssetType.IMAGE, path: '/img1.png' });
      repo.create({ post_id: postId, type: AssetType.IMAGE, path: '/img2.png' });

      expect(repo.count()).toBe(2);
    });
  });

  describe('countByPostId', () => {
    it('should return 0 for post with no assets', () => {
      expect(repo.countByPostId(postId)).toBe(0);
    });

    it('should return correct count for post', () => {
      repo.create({ post_id: postId, type: AssetType.IMAGE, path: '/img1.png' });
      repo.create({ post_id: postId, type: AssetType.IMAGE, path: '/img2.png' });

      expect(repo.countByPostId(postId)).toBe(2);
    });
  });

  describe('getTotalSizeByPostId', () => {
    it('should return 0 for post with no assets', () => {
      expect(repo.getTotalSizeByPostId(postId)).toBe(0);
    });

    it('should return total size of assets', () => {
      repo.create({
        post_id: postId,
        type: AssetType.IMAGE,
        path: '/img1.png',
        size: 1024,
      });
      repo.create({
        post_id: postId,
        type: AssetType.IMAGE,
        path: '/img2.png',
        size: 2048,
      });
      repo.create({
        post_id: postId,
        type: AssetType.PDF,
        path: '/doc.pdf',
        size: 5120,
      });

      expect(repo.getTotalSizeByPostId(postId)).toBe(8192);
    });
  });

  describe('findAllByType', () => {
    it('should return all assets of specified type', () => {
      // Create multiple posts
      const post2 = postRepo.create({
        execution_id: executionRepo.create({}).id,
        topic: 'Post 2',
      });

      repo.create({ post_id: postId, type: AssetType.IMAGE, path: '/img1.png' });
      repo.create({ post_id: post2.id, type: AssetType.IMAGE, path: '/img2.png' });
      repo.create({ post_id: postId, type: AssetType.PDF, path: '/doc.pdf' });

      const images = repo.findAllByType(AssetType.IMAGE);
      expect(images).toHaveLength(2);

      const pdfs = repo.findAllByType(AssetType.PDF);
      expect(pdfs).toHaveLength(1);
    });

    it('should respect limit', () => {
      for (let i = 0; i < 10; i++) {
        repo.create({
          post_id: postId,
          type: AssetType.IMAGE,
          path: `/img${i}.png`,
        });
      }

      const result = repo.findAllByType(AssetType.IMAGE, 5);
      expect(result).toHaveLength(5);
    });
  });
});
