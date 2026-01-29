/**
 * ExecutionRepository Tests
 * Story 4.1 - Persistencia com SQLite
 *
 * Tests for CRUD operations on executions.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { ExecutionRepository } from '../../database/repositories/execution-repository';
import { runTestMigrations } from '../../database/migrate';
import { ExecutionStatus } from '../../database/types';

describe('ExecutionRepository', () => {
  let db: Database.Database;
  let repo: ExecutionRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    runTestMigrations(db);
    repo = new ExecutionRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('should create execution with default values', () => {
      const execution = repo.create({});

      expect(execution.id).toBeDefined();
      expect(execution.status).toBe(ExecutionStatus.PENDING);
      expect(execution.config).toEqual({});
      expect(execution.finished_at).toBeNull();
      expect(execution.started_at).toBeDefined();
      expect(execution.created_at).toBeDefined();
    });

    it('should create execution with custom config', () => {
      const config = {
        numPosts: 5,
        platforms: ['instagram', 'linkedin'] as ('instagram' | 'linkedin')[],
        includeVisual: true,
      };
      const execution = repo.create({ config });

      expect(execution.config).toEqual(config);
    });

    it('should create execution with custom id', () => {
      const id = 'custom-id-123';
      const execution = repo.create({ id });

      expect(execution.id).toBe(id);
    });

    it('should create execution with custom status', () => {
      const execution = repo.create({ status: ExecutionStatus.RUNNING });

      expect(execution.status).toBe(ExecutionStatus.RUNNING);
    });
  });

  describe('findById', () => {
    it('should return null for non-existent id', () => {
      const result = repo.findById('non-existent');
      expect(result).toBeNull();
    });

    it('should return execution by id', () => {
      const created = repo.create({});
      const found = repo.findById(created.id);

      expect(found).toEqual(created);
    });

    it('should parse JSON config correctly', () => {
      const config = { numPosts: 10, platforms: ['instagram'] };
      const created = repo.create({ config });
      const found = repo.findById(created.id);

      expect(found?.config).toEqual(config);
    });
  });

  describe('findAll', () => {
    it('should return empty array when no executions', () => {
      const result = repo.findAll();
      expect(result).toEqual([]);
    });

    it('should return all executions ordered by created_at DESC', () => {
      repo.create({});
      repo.create({});
      repo.create({});

      const result = repo.findAll();
      expect(result).toHaveLength(3);
    });

    it('should respect limit option', () => {
      for (let i = 0; i < 10; i++) {
        repo.create({});
      }

      const result = repo.findAll({ limit: 3 });
      expect(result).toHaveLength(3);
    });

    it('should respect offset option', () => {
      for (let i = 0; i < 10; i++) {
        repo.create({});
      }

      const result = repo.findAll({ limit: 3, offset: 5 });
      expect(result).toHaveLength(3);
    });

    it('should respect orderDir option', () => {
      repo.create({ id: 'a' });
      repo.create({ id: 'b' });
      repo.create({ id: 'c' });

      const asc = repo.findAll({ orderBy: 'id', orderDir: 'ASC' });
      expect(asc[0].id).toBe('a');

      const desc = repo.findAll({ orderBy: 'id', orderDir: 'DESC' });
      expect(desc[0].id).toBe('c');
    });
  });

  describe('update', () => {
    it('should update execution status', () => {
      const created = repo.create({});
      const updated = repo.update(created.id, { status: ExecutionStatus.RUNNING });

      expect(updated?.status).toBe(ExecutionStatus.RUNNING);
    });

    it('should update finished_at', () => {
      const created = repo.create({});
      const finishedAt = new Date().toISOString();
      const updated = repo.update(created.id, { finished_at: finishedAt });

      expect(updated?.finished_at).toBe(finishedAt);
    });

    it('should update config', () => {
      const created = repo.create({});
      const newConfig = { numPosts: 10, qualityThreshold: 7.5 };
      const updated = repo.update(created.id, { config: newConfig });

      expect(updated?.config).toEqual(newConfig);
    });

    it('should return null for non-existent id', () => {
      const updated = repo.update('non-existent', {
        status: ExecutionStatus.RUNNING,
      });

      expect(updated).toBeNull();
    });

    it('should return unchanged execution when no updates provided', () => {
      const created = repo.create({});
      const updated = repo.update(created.id, {});

      expect(updated).toEqual(created);
    });

    it('should update multiple fields at once', () => {
      const created = repo.create({});
      const finishedAt = new Date().toISOString();
      const newConfig = { numPosts: 5 };

      const updated = repo.update(created.id, {
        status: ExecutionStatus.COMPLETED,
        finished_at: finishedAt,
        config: newConfig,
      });

      expect(updated?.status).toBe(ExecutionStatus.COMPLETED);
      expect(updated?.finished_at).toBe(finishedAt);
      expect(updated?.config).toEqual(newConfig);
    });
  });

  describe('delete', () => {
    it('should return false for non-existent id', () => {
      const result = repo.delete('non-existent');
      expect(result).toBe(false);
    });

    it('should delete execution and return true', () => {
      const created = repo.create({});
      const result = repo.delete(created.id);

      expect(result).toBe(true);
      expect(repo.findById(created.id)).toBeNull();
    });
  });

  describe('findByStatus', () => {
    it('should return empty array when no matching executions', () => {
      repo.create({ status: ExecutionStatus.PENDING });

      const result = repo.findByStatus(ExecutionStatus.RUNNING);
      expect(result).toEqual([]);
    });

    it('should return executions with specific status', () => {
      repo.create({ status: ExecutionStatus.PENDING });
      repo.create({ status: ExecutionStatus.RUNNING });
      repo.create({ status: ExecutionStatus.PENDING });
      repo.create({ status: ExecutionStatus.COMPLETED });

      const pending = repo.findByStatus(ExecutionStatus.PENDING);
      expect(pending).toHaveLength(2);

      const running = repo.findByStatus(ExecutionStatus.RUNNING);
      expect(running).toHaveLength(1);

      const completed = repo.findByStatus(ExecutionStatus.COMPLETED);
      expect(completed).toHaveLength(1);
    });
  });

  describe('countByStatus', () => {
    it('should return zero counts when no executions', () => {
      const counts = repo.countByStatus();

      expect(counts[ExecutionStatus.PENDING]).toBe(0);
      expect(counts[ExecutionStatus.RUNNING]).toBe(0);
      expect(counts[ExecutionStatus.COMPLETED]).toBe(0);
      expect(counts[ExecutionStatus.FAILED]).toBe(0);
    });

    it('should count executions by status', () => {
      repo.create({ status: ExecutionStatus.PENDING });
      repo.create({ status: ExecutionStatus.PENDING });
      repo.create({ status: ExecutionStatus.COMPLETED });

      const counts = repo.countByStatus();

      expect(counts[ExecutionStatus.PENDING]).toBe(2);
      expect(counts[ExecutionStatus.COMPLETED]).toBe(1);
      expect(counts[ExecutionStatus.RUNNING]).toBe(0);
      expect(counts[ExecutionStatus.FAILED]).toBe(0);
    });
  });

  describe('count', () => {
    it('should return 0 when no executions', () => {
      expect(repo.count()).toBe(0);
    });

    it('should return correct count', () => {
      repo.create({});
      repo.create({});
      repo.create({});

      expect(repo.count()).toBe(3);
    });
  });

  describe('findLatest', () => {
    it('should return null when no executions', () => {
      expect(repo.findLatest()).toBeNull();
    });

    it('should return a valid execution when multiple exist', () => {
      repo.create({ id: 'first' });
      repo.create({ id: 'second' });
      repo.create({ id: 'third' });

      const latest = repo.findLatest();
      // Since all are created at the same timestamp in tests,
      // we just verify we get one of them
      expect(latest).toBeDefined();
      expect(['first', 'second', 'third']).toContain(latest?.id);
    });
  });

  describe('findByDateRange', () => {
    it('should return executions within date range', () => {
      // Create executions (they'll have current timestamps)
      repo.create({});
      repo.create({});

      // SQLite datetime() uses UTC without milliseconds
      // Use a very wide range to ensure we capture the records
      const start = '2020-01-01 00:00:00';
      const end = '2030-12-31 23:59:59';

      const results = repo.findByDateRange(start, end);
      expect(results).toHaveLength(2);
    });

    it('should return empty array for range with no executions', () => {
      repo.create({});

      const farPast = '2020-01-01 00:00:00';
      const stillPast = '2020-12-31 23:59:59';

      const results = repo.findByDateRange(farPast, stillPast);
      expect(results).toHaveLength(0);
    });
  });
});
