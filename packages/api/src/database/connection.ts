/**
 * SQLite Database Connection
 * Story 4.1 - Persistencia com SQLite
 *
 * Manages database connection lifecycle with singleton pattern,
 * WAL mode for performance, and graceful shutdown handling.
 */

import Database from 'better-sqlite3';
import { dirname, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';

interface DatabaseConfig {
  /** Path to the SQLite database file */
  path: string;
  /** Enable verbose logging */
  verbose?: boolean;
}

/** Singleton database instance */
let db: Database.Database | null = null;

/**
 * Gets or creates the database connection singleton.
 *
 * @param config - Optional configuration override
 * @returns Database connection instance
 */
export function getDatabase(config?: DatabaseConfig): Database.Database {
  if (db) {
    return db;
  }

  const dbPath = config?.path ?? process.env['DATABASE_PATH'] ?? './data/social-content.db';

  // Ensure directory exists (skip for in-memory databases)
  if (dbPath !== ':memory:') {
    const absolutePath = resolve(dbPath);
    const dir = dirname(absolutePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  db = new Database(dbPath, {
    verbose: config?.verbose ? console.log : undefined,
  });

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Performance optimizations
  if (dbPath !== ':memory:') {
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = 10000');
    db.pragma('temp_store = MEMORY');
  }

  return db;
}

/**
 * Creates a new in-memory database for testing.
 * Does not affect the singleton instance.
 *
 * @returns A new in-memory database instance
 */
export function getTestDatabase(): Database.Database {
  const testDb = new Database(':memory:');
  testDb.pragma('foreign_keys = ON');
  return testDb;
}

/**
 * Closes the singleton database connection.
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Resets the singleton (for testing purposes).
 * Closes the existing connection if open.
 */
export function resetDatabase(): void {
  closeDatabase();
}

/**
 * Registers handlers for graceful shutdown on SIGINT and SIGTERM.
 * Closes the database connection before process exit.
 */
export function registerShutdownHandler(): void {
  const shutdown = () => {
    console.log('Closing database connection...');
    closeDatabase();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

/**
 * Checks if the database connection is open.
 *
 * @returns true if connected, false otherwise
 */
export function isDatabaseConnected(): boolean {
  return db !== null && db.open;
}

export { Database };
