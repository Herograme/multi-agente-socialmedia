/**
 * Database Module Barrel Export
 * Story 4.1 - Persistencia com SQLite
 *
 * Main entry point for database functionality.
 * Re-exports connection, migrations, types, and repositories.
 */

// Connection management
export {
  getDatabase,
  getTestDatabase,
  closeDatabase,
  resetDatabase,
  registerShutdownHandler,
  isDatabaseConnected,
  Database,
} from './connection';

// Migration utilities
export {
  runMigrations,
  runTestMigrations,
  getExecutedMigrations,
  isSchemaUpToDate,
  getPendingMigrationsCount,
  type Migration,
} from './migrate';

// Entity types
export {
  // Enums
  ExecutionStatus,
  PostStatus,
  AssetType,
  // Execution types
  type ExecutionConfig,
  type Execution,
  type CreateExecution,
  type UpdateExecution,
  // Post types
  type Post,
  type CreatePost,
  type UpdatePost,
  type PostWithAssets,
  type PostWithScore,
  // Asset types
  type Asset,
  type CreateAsset,
  type UpdateAsset,
  // Score types
  type CriteriaBreakdown,
  type Score,
  type CreateScore,
  type UpdateScore,
  // Query options
  type FindOptions,
  // Row types (internal)
  type ExecutionRow,
  type PostRow,
  type AssetRow,
  type ScoreRow,
} from './types';

// Repositories
export {
  createRepositories,
  type Repositories,
  ExecutionRepository,
  PostRepository,
  AssetRepository,
  ScoreRepository,
} from './repositories';
