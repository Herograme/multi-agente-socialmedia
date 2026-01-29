/**
 * Database Migration Runner
 * Story 4.1 - Persistencia com SQLite
 *
 * Executes SQL migrations in order, tracking executed migrations
 * to prevent duplicate runs.
 */

import Database from 'better-sqlite3';
import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDatabase } from './connection';

/** Migration record from the _migrations table */
export interface Migration {
  id: number;
  name: string;
  executed_at: string;
}

/**
 * Gets the migrations directory path.
 * Handles both ESM and CJS module resolution.
 */
function getMigrationsDir(): string {
  // Try __dirname (CJS) or fallback to import.meta.url (ESM)
  try {
    // ESM approach
    const currentFile = fileURLToPath(import.meta.url);
    return join(dirname(currentFile), 'migrations');
  } catch {
    // CJS fallback - will be resolved at runtime
    return join(__dirname, 'migrations');
  }
}

/**
 * Creates the _migrations tracking table if it doesn't exist.
 *
 * @param db - Database connection
 */
function ensureMigrationsTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      executed_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

/**
 * Runs all pending migrations.
 *
 * @param db - Optional database connection (uses singleton if not provided)
 * @param migrationsDir - Optional custom migrations directory
 */
export function runMigrations(
  db?: Database.Database,
  migrationsDir?: string
): void {
  const database = db ?? getDatabase();
  const dir = migrationsDir ?? getMigrationsDir();

  // Ensure _migrations table exists
  ensureMigrationsTable(database);

  // Get all SQL migration files sorted by name
  let files: string[];
  try {
    files = readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .sort();
  } catch (error) {
    console.warn(`Migrations directory not found: ${dir}`);
    return;
  }

  if (files.length === 0) {
    console.log('No migration files found');
    return;
  }

  // Get already executed migrations
  const executed = database
    .prepare('SELECT name FROM _migrations')
    .all() as Pick<Migration, 'name'>[];
  const executedNames = new Set(executed.map((m) => m.name));

  // Execute pending migrations in a transaction
  for (const file of files) {
    if (executedNames.has(file)) {
      continue;
    }

    console.log(`Running migration: ${file}`);

    const sql = readFileSync(join(dir, file), 'utf-8');

    database.transaction(() => {
      database.exec(sql);
      database
        .prepare('INSERT INTO _migrations (name) VALUES (?)')
        .run(file);
    })();

    console.log(`Migration completed: ${file}`);
  }
}

/**
 * Lists all executed migrations.
 *
 * @param db - Optional database connection
 * @returns Array of executed migration records
 */
export function getExecutedMigrations(db?: Database.Database): Migration[] {
  const database = db ?? getDatabase();

  try {
    return database
      .prepare('SELECT * FROM _migrations ORDER BY id')
      .all() as Migration[];
  } catch {
    // Table doesn't exist yet
    return [];
  }
}

/**
 * Checks if all available migrations have been executed.
 *
 * @param db - Optional database connection
 * @param migrationsDir - Optional custom migrations directory
 * @returns true if schema is up to date
 */
export function isSchemaUpToDate(
  db?: Database.Database,
  migrationsDir?: string
): boolean {
  const database = db ?? getDatabase();
  const dir = migrationsDir ?? getMigrationsDir();

  let files: string[];
  try {
    files = readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .sort();
  } catch {
    return true; // No migrations directory means nothing to run
  }

  const executed = getExecutedMigrations(database);
  return files.length === executed.length;
}

/**
 * Gets the count of pending migrations.
 *
 * @param db - Optional database connection
 * @param migrationsDir - Optional custom migrations directory
 * @returns Number of pending migrations
 */
export function getPendingMigrationsCount(
  db?: Database.Database,
  migrationsDir?: string
): number {
  const database = db ?? getDatabase();
  const dir = migrationsDir ?? getMigrationsDir();

  let files: string[];
  try {
    files = readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .sort();
  } catch {
    return 0;
  }

  const executed = getExecutedMigrations(database);
  const executedNames = new Set(executed.map((m) => m.name));

  return files.filter((f) => !executedNames.has(f)).length;
}

/**
 * Runs migrations for a test database using raw SQL.
 * This is useful when the migrations directory is not accessible during tests.
 *
 * @param db - Database connection
 */
export function runTestMigrations(db: Database.Database): void {
  // Create _migrations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      executed_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create executions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS executions (
      id TEXT PRIMARY KEY,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      finished_at TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
      config TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec('CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_executions_started_at ON executions(started_at)');

  // Create posts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      execution_id TEXT NOT NULL,
      topic TEXT NOT NULL,
      text_ig TEXT,
      text_linkedin TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_review')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
    )
  `);

  db.exec('CREATE INDEX IF NOT EXISTS idx_posts_execution_id ON posts(execution_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at)');

  // Create assets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('image', 'carousel', 'pdf')),
      path TEXT NOT NULL,
      size INTEGER NOT NULL DEFAULT 0,
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `);

  db.exec('CREATE INDEX IF NOT EXISTS idx_assets_post_id ON assets(post_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type)');

  // Create scores table
  db.exec(`
    CREATE TABLE IF NOT EXISTS scores (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL UNIQUE,
      overall_score REAL NOT NULL CHECK (overall_score >= 0 AND overall_score <= 10),
      criteria_breakdown TEXT NOT NULL DEFAULT '{}',
      feedback TEXT,
      approved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `);

  db.exec('CREATE INDEX IF NOT EXISTS idx_scores_post_id ON scores(post_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_scores_overall_score ON scores(overall_score)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_scores_approved ON scores(approved)');

  // Record the migration
  db.prepare("INSERT OR IGNORE INTO _migrations (name) VALUES ('001_initial_schema.sql')").run();
}
