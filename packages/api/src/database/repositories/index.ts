/**
 * Repositories Barrel Export
 * Story 4.1 - Persistencia com SQLite
 *
 * Re-exports all repositories and provides a factory function.
 */

import Database from 'better-sqlite3';
import { ExecutionRepository } from './execution-repository';
import { PostRepository } from './post-repository';
import { AssetRepository } from './asset-repository';
import { ScoreRepository } from './score-repository';

/**
 * Container for all repository instances.
 */
export interface Repositories {
  executions: ExecutionRepository;
  posts: PostRepository;
  assets: AssetRepository;
  scores: ScoreRepository;
}

/**
 * Creates all repositories with the same database connection.
 *
 * @param db - Optional database connection (uses singleton if not provided)
 * @returns Object containing all repository instances
 */
export function createRepositories(db?: Database.Database): Repositories {
  return {
    executions: new ExecutionRepository(db),
    posts: new PostRepository(db),
    assets: new AssetRepository(db),
    scores: new ScoreRepository(db),
  };
}

// Re-export individual repositories
export { ExecutionRepository } from './execution-repository';
export { PostRepository } from './post-repository';
export { AssetRepository } from './asset-repository';
export { ScoreRepository } from './score-repository';
