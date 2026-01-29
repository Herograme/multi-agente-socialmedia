/**
 * Post Approval API Tests
 * Story 5.5 - Fluxo de Aprovacao de Posts
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { createServer } from '../server';
import { runTestMigrations } from '../database/migrate';
import type { FastifyInstance } from 'fastify';

describe('Post Approval API', () => {
  let app: FastifyInstance;
  let db: Database.Database;

  beforeAll(async () => {
    // Create in-memory database
    db = new Database(':memory:');
    runTestMigrations(db);

    // Apply Story 5.5 migration
    db.exec(`
      ALTER TABLE posts ADD COLUMN rejection_reason TEXT;
      ALTER TABLE posts ADD COLUMN updated_at TEXT;
    `);

    // Create server with skipped database (we'll use our test db)
    app = await createServer({
      logger: false,
      skipDatabase: true,
      skipWebSocket: true,
    });
  });

  afterAll(async () => {
    await app.close();
    db.close();
  });

  beforeEach(() => {
    // Clear posts table
    db.exec('DELETE FROM posts');
    db.exec('DELETE FROM executions');

    // Create test execution
    db.prepare(`
      INSERT INTO executions (id, status, config) VALUES (?, ?, ?)
    `).run('exec-1', 'completed', '{}');

    // Create test posts
    db.prepare(`
      INSERT INTO posts (id, execution_id, topic, text_ig, status) VALUES (?, ?, ?, ?, ?)
    `).run('post-1', 'exec-1', 'Topic 1', 'Instagram text 1', 'pending');

    db.prepare(`
      INSERT INTO posts (id, execution_id, topic, text_ig, status) VALUES (?, ?, ?, ?, ?)
    `).run('post-2', 'exec-1', 'Topic 2', 'Instagram text 2', 'pending');

    db.prepare(`
      INSERT INTO posts (id, execution_id, topic, text_ig, status) VALUES (?, ?, ?, ?, ?)
    `).run('post-3', 'exec-1', 'Topic 3', 'Instagram text 3', 'approved');

    db.prepare(`
      INSERT INTO posts (id, execution_id, topic, text_ig, status, rejection_reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('post-4', 'exec-1', 'Topic 4', 'Instagram text 4', 'rejected', 'Bad quality');
  });

  describe('POST /api/posts/:id/approve', () => {
    it('should approve a pending post', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/posts/post-1/approve',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.status).toBe('approved');
      expect(data.post.status).toBe('approved');
    });

    it('should return 404 for non-existent post', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/posts/non-existent/approve',
      });

      expect(response.statusCode).toBe(404);
      const data = JSON.parse(response.payload);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 when trying to approve already approved post', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/posts/post-3/approve',
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.error.code).toBe('INVALID_STATUS');
    });
  });

  describe('POST /api/posts/:id/reject', () => {
    it('should reject a pending post', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/posts/post-1/reject',
        payload: { reason: 'Test rejection reason' },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.status).toBe('rejected');
      expect(data.post.status).toBe('rejected');
      expect(data.post.rejection_reason).toBe('Test rejection reason');
    });

    it('should reject a post without reason', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/posts/post-1/reject',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
    });

    it('should return 404 for non-existent post', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/posts/non-existent/reject',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 when trying to reject already rejected post', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/posts/post-4/reject',
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.error.code).toBe('INVALID_STATUS');
    });
  });

  describe('POST /api/posts/:id/regenerate', () => {
    it('should queue regeneration for rejected post', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/posts/post-4/regenerate',
      });

      expect(response.statusCode).toBe(202);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Regeneration queued');
      expect(data.post.status).toBe('pending');
    });

    it('should return 400 when trying to regenerate non-rejected post', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/posts/post-1/regenerate',
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.error.code).toBe('INVALID_STATUS');
    });

    it('should return 404 for non-existent post', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/posts/non-existent/regenerate',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/posts/bulk-approve', () => {
    it('should approve multiple posts', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/posts/bulk-approve',
        payload: { postIds: ['post-1', 'post-2'] },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.updated).toBe(2);
      expect(data.failed).toBe(0);
    });

    it('should return 400 for empty postIds array', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/posts/bulk-approve',
        payload: { postIds: [] },
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.error.code).toBe('INVALID_REQUEST');
    });

    it('should handle mixed valid/invalid posts', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/posts/bulk-approve',
        payload: { postIds: ['post-1', 'post-3', 'non-existent'] },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      // post-1 should succeed, post-3 is already approved (fails), non-existent (fails)
      expect(data.updated).toBe(1);
      expect(data.failed).toBe(2);
    });
  });

  describe('POST /api/posts/bulk-reject', () => {
    it('should reject multiple posts', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/posts/bulk-reject',
        payload: { postIds: ['post-1', 'post-2'], reason: 'Bulk rejection' },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.updated).toBe(2);
      expect(data.failed).toBe(0);
    });

    it('should reject without reason', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/posts/bulk-reject',
        payload: { postIds: ['post-1'] },
      });

      expect(response.statusCode).toBe(200);
    });

    it('should return 400 for empty postIds array', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/posts/bulk-reject',
        payload: { postIds: [] },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/posts/pending-count', () => {
    it('should return count of pending posts', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/posts/pending-count',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.count).toBe(2); // post-1 and post-2 are pending
    });
  });

  describe('GET /api/posts/status-counts', () => {
    it('should return counts for all statuses', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/posts/status-counts',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.all).toBe(4);
      expect(data.pending).toBe(2);
      expect(data.approved).toBe(1);
      expect(data.rejected).toBe(1);
    });
  });
});
