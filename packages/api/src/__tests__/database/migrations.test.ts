/**
 * Migrations Tests
 * Story 4.1 - Persistencia com SQLite
 *
 * Tests for database migration functionality.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import {
  runTestMigrations,
  getExecutedMigrations,
} from '../../database/migrate';

describe('Database Migrations', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
  });

  afterEach(() => {
    db.close();
  });

  describe('runTestMigrations', () => {
    it('should create _migrations table', () => {
      runTestMigrations(db);

      const tables = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='_migrations'"
        )
        .all();

      expect(tables).toHaveLength(1);
    });

    it('should create executions table', () => {
      runTestMigrations(db);

      const tables = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='executions'"
        )
        .all();

      expect(tables).toHaveLength(1);
    });

    it('should create posts table', () => {
      runTestMigrations(db);

      const tables = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='posts'"
        )
        .all();

      expect(tables).toHaveLength(1);
    });

    it('should create assets table', () => {
      runTestMigrations(db);

      const tables = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='assets'"
        )
        .all();

      expect(tables).toHaveLength(1);
    });

    it('should create scores table', () => {
      runTestMigrations(db);

      const tables = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='scores'"
        )
        .all();

      expect(tables).toHaveLength(1);
    });

    it('should be idempotent (can run multiple times)', () => {
      runTestMigrations(db);
      runTestMigrations(db);

      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all();

      // Should have: _migrations, executions, posts, assets, scores
      expect(tables.length).toBeGreaterThanOrEqual(5);
    });

    it('should record migration in _migrations table', () => {
      runTestMigrations(db);

      const migrations = db.prepare('SELECT * FROM _migrations ORDER BY id').all();

      expect(migrations.length).toBeGreaterThanOrEqual(1);
      expect((migrations[0] as { name: string }).name).toBe('001_initial_schema.sql');
    });
  });

  describe('getExecutedMigrations', () => {
    it('should return empty array when no migrations run', () => {
      const migrations = getExecutedMigrations(db);
      expect(migrations).toEqual([]);
    });

    it('should return executed migrations after running', () => {
      runTestMigrations(db);

      const migrations = getExecutedMigrations(db);

      expect(migrations.length).toBeGreaterThanOrEqual(1);
      expect(migrations[0].name).toBe('001_initial_schema.sql');
      expect(migrations[0].id).toBeDefined();
      expect(migrations[0].executed_at).toBeDefined();
    });
  });

  describe('Schema Validation', () => {
    beforeEach(() => {
      runTestMigrations(db);
    });

    it('executions table should have correct columns', () => {
      const columns = db.pragma('table_info(executions)') as {
        name: string;
        type: string;
        notnull: number;
      }[];

      const columnNames = columns.map((c) => c.name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('started_at');
      expect(columnNames).toContain('finished_at');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('config');
      expect(columnNames).toContain('created_at');
    });

    it('posts table should have correct columns', () => {
      const columns = db.pragma('table_info(posts)') as {
        name: string;
        type: string;
        notnull: number;
      }[];

      const columnNames = columns.map((c) => c.name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('execution_id');
      expect(columnNames).toContain('topic');
      expect(columnNames).toContain('text_ig');
      expect(columnNames).toContain('text_linkedin');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('created_at');
    });

    it('assets table should have correct columns', () => {
      const columns = db.pragma('table_info(assets)') as {
        name: string;
        type: string;
        notnull: number;
      }[];

      const columnNames = columns.map((c) => c.name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('post_id');
      expect(columnNames).toContain('type');
      expect(columnNames).toContain('path');
      expect(columnNames).toContain('size');
      expect(columnNames).toContain('metadata');
      expect(columnNames).toContain('created_at');
    });

    it('scores table should have correct columns', () => {
      const columns = db.pragma('table_info(scores)') as {
        name: string;
        type: string;
        notnull: number;
      }[];

      const columnNames = columns.map((c) => c.name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('post_id');
      expect(columnNames).toContain('overall_score');
      expect(columnNames).toContain('criteria_breakdown');
      expect(columnNames).toContain('feedback');
      expect(columnNames).toContain('approved');
      expect(columnNames).toContain('created_at');
    });

    it('should enforce execution status constraint', () => {
      expect(() => {
        db.prepare(
          "INSERT INTO executions (id, status, config) VALUES ('test', 'invalid', '{}')"
        ).run();
      }).toThrow();
    });

    it('should enforce post status constraint', () => {
      // First create an execution
      db.prepare(
        "INSERT INTO executions (id, status, config) VALUES ('exec1', 'pending', '{}')"
      ).run();

      expect(() => {
        db.prepare(
          "INSERT INTO posts (id, execution_id, topic, status) VALUES ('post1', 'exec1', 'Test', 'invalid')"
        ).run();
      }).toThrow();
    });

    it('should enforce asset type constraint', () => {
      // Create execution and post first
      db.prepare(
        "INSERT INTO executions (id, status, config) VALUES ('exec1', 'pending', '{}')"
      ).run();
      db.prepare(
        "INSERT INTO posts (id, execution_id, topic, status) VALUES ('post1', 'exec1', 'Test', 'pending')"
      ).run();

      expect(() => {
        db.prepare(
          "INSERT INTO assets (id, post_id, type, path, size) VALUES ('asset1', 'post1', 'invalid', '/path', 0)"
        ).run();
      }).toThrow();
    });

    it('should enforce score range constraint', () => {
      // Create execution and post first
      db.prepare(
        "INSERT INTO executions (id, status, config) VALUES ('exec1', 'pending', '{}')"
      ).run();
      db.prepare(
        "INSERT INTO posts (id, execution_id, topic, status) VALUES ('post1', 'exec1', 'Test', 'pending')"
      ).run();

      expect(() => {
        db.prepare(
          "INSERT INTO scores (id, post_id, overall_score) VALUES ('score1', 'post1', 15)"
        ).run();
      }).toThrow();

      expect(() => {
        db.prepare(
          "INSERT INTO scores (id, post_id, overall_score) VALUES ('score2', 'post1', -1)"
        ).run();
      }).toThrow();
    });
  });

  describe('Foreign Key Relationships', () => {
    beforeEach(() => {
      runTestMigrations(db);
    });

    it('should enforce posts -> executions foreign key', () => {
      expect(() => {
        db.prepare(
          "INSERT INTO posts (id, execution_id, topic) VALUES ('post1', 'nonexistent', 'Test')"
        ).run();
      }).toThrow();
    });

    it('should enforce assets -> posts foreign key', () => {
      expect(() => {
        db.prepare(
          "INSERT INTO assets (id, post_id, type, path) VALUES ('asset1', 'nonexistent', 'image', '/path')"
        ).run();
      }).toThrow();
    });

    it('should enforce scores -> posts foreign key', () => {
      expect(() => {
        db.prepare(
          "INSERT INTO scores (id, post_id, overall_score) VALUES ('score1', 'nonexistent', 8.0)"
        ).run();
      }).toThrow();
    });

    it('should cascade delete posts when execution is deleted', () => {
      // Create execution and posts
      db.prepare(
        "INSERT INTO executions (id, status, config) VALUES ('exec1', 'pending', '{}')"
      ).run();
      db.prepare(
        "INSERT INTO posts (id, execution_id, topic) VALUES ('post1', 'exec1', 'Test')"
      ).run();
      db.prepare(
        "INSERT INTO posts (id, execution_id, topic) VALUES ('post2', 'exec1', 'Test 2')"
      ).run();

      // Delete execution
      db.prepare("DELETE FROM executions WHERE id = 'exec1'").run();

      // Posts should be deleted
      const posts = db.prepare('SELECT * FROM posts').all();
      expect(posts).toHaveLength(0);
    });

    it('should cascade delete assets when post is deleted', () => {
      // Create execution, post, and assets
      db.prepare(
        "INSERT INTO executions (id, status, config) VALUES ('exec1', 'pending', '{}')"
      ).run();
      db.prepare(
        "INSERT INTO posts (id, execution_id, topic) VALUES ('post1', 'exec1', 'Test')"
      ).run();
      db.prepare(
        "INSERT INTO assets (id, post_id, type, path) VALUES ('asset1', 'post1', 'image', '/path1')"
      ).run();
      db.prepare(
        "INSERT INTO assets (id, post_id, type, path) VALUES ('asset2', 'post1', 'carousel', '/path2')"
      ).run();

      // Delete post
      db.prepare("DELETE FROM posts WHERE id = 'post1'").run();

      // Assets should be deleted
      const assets = db.prepare('SELECT * FROM assets').all();
      expect(assets).toHaveLength(0);
    });

    it('should cascade delete score when post is deleted', () => {
      // Create execution, post, and score
      db.prepare(
        "INSERT INTO executions (id, status, config) VALUES ('exec1', 'pending', '{}')"
      ).run();
      db.prepare(
        "INSERT INTO posts (id, execution_id, topic) VALUES ('post1', 'exec1', 'Test')"
      ).run();
      db.prepare(
        "INSERT INTO scores (id, post_id, overall_score) VALUES ('score1', 'post1', 8.0)"
      ).run();

      // Delete post
      db.prepare("DELETE FROM posts WHERE id = 'post1'").run();

      // Score should be deleted
      const scores = db.prepare('SELECT * FROM scores').all();
      expect(scores).toHaveLength(0);
    });
  });
});
