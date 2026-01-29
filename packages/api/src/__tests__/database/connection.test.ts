/**
 * Connection Tests
 * Story 4.1 - Persistencia com SQLite
 *
 * Tests for database connection management.
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  getTestDatabase,
  getDatabase,
  closeDatabase,
  resetDatabase,
  isDatabaseConnected,
} from '../../database/connection';

describe('Database Connection', () => {
  afterEach(() => {
    // Clean up singleton between tests
    resetDatabase();
  });

  describe('getTestDatabase', () => {
    it('should create an in-memory database', () => {
      const db = getTestDatabase();

      expect(db).toBeDefined();
      expect(db.open).toBe(true);

      // Verify foreign keys are enabled
      const result = db.pragma('foreign_keys') as { foreign_keys: number }[];
      expect(result[0].foreign_keys).toBe(1);

      db.close();
    });

    it('should create independent database instances', () => {
      const db1 = getTestDatabase();
      const db2 = getTestDatabase();

      // Create a table in db1
      db1.exec('CREATE TABLE test (id INTEGER PRIMARY KEY)');

      // Table should not exist in db2
      const tables = db2
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='test'")
        .all();
      expect(tables).toHaveLength(0);

      db1.close();
      db2.close();
    });
  });

  describe('getDatabase (singleton)', () => {
    it('should return the same instance on multiple calls', () => {
      // Use in-memory database for testing
      process.env['DATABASE_PATH'] = ':memory:';

      const db1 = getDatabase();
      const db2 = getDatabase();

      expect(db1).toBe(db2);
    });

    it('should have foreign keys enabled', () => {
      process.env['DATABASE_PATH'] = ':memory:';

      const db = getDatabase();
      const result = db.pragma('foreign_keys') as { foreign_keys: number }[];

      expect(result[0].foreign_keys).toBe(1);
    });
  });

  describe('closeDatabase', () => {
    it('should close the singleton connection', () => {
      process.env['DATABASE_PATH'] = ':memory:';

      const db = getDatabase();
      expect(db.open).toBe(true);

      closeDatabase();

      // Getting a new connection should work
      const db2 = getDatabase();
      expect(db2.open).toBe(true);
      expect(db2).not.toBe(db);
    });
  });

  describe('isDatabaseConnected', () => {
    it('should return false when not connected', () => {
      resetDatabase();
      expect(isDatabaseConnected()).toBe(false);
    });

    it('should return true when connected', () => {
      process.env['DATABASE_PATH'] = ':memory:';
      getDatabase();
      expect(isDatabaseConnected()).toBe(true);
    });

    it('should return false after closing', () => {
      process.env['DATABASE_PATH'] = ':memory:';
      getDatabase();
      closeDatabase();
      expect(isDatabaseConnected()).toBe(false);
    });
  });

  describe('resetDatabase', () => {
    it('should close connection and reset singleton', () => {
      process.env['DATABASE_PATH'] = ':memory:';

      const db1 = getDatabase();
      resetDatabase();
      const db2 = getDatabase();

      expect(db1).not.toBe(db2);
    });
  });
});
