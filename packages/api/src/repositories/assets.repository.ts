/**
 * Assets Repository
 * Story 3.7 - Integracao Pipeline Visual
 *
 * Data access layer for asset storage and retrieval.
 * Uses an in-memory store for now - can be replaced with database implementation.
 */

import { createLogger, generateId } from '@social-content/shared';

const logger = createLogger('repository:assets');

/**
 * Asset type in database
 */
export type AssetDbType = 'image' | 'carousel' | 'pdf';

/**
 * Asset record for database storage
 */
export interface AssetRecord {
  /** Unique asset identifier */
  id: string;
  /** Post this asset belongs to */
  postId: string;
  /** Type of asset */
  type: AssetDbType;
  /** Absolute path to the asset file */
  path: string;
  /** Filename only */
  filename: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  mimeType: string;
  /** When the asset was created */
  createdAt: Date;
  /** Additional metadata as JSON string */
  metadata?: string;
}

/**
 * Input for creating an asset
 */
export type AssetCreateInput = Omit<AssetRecord, 'id' | 'createdAt'>;

/**
 * Assets Repository Interface
 */
export interface IAssetsRepository {
  /** Find all assets by post ID */
  findByPostId(postId: string): Promise<AssetRecord[]>;
  /** Find assets by post ID and type */
  findByPostIdAndType(postId: string, type: AssetDbType): Promise<AssetRecord[]>;
  /** Find asset by ID */
  findById(id: string): Promise<AssetRecord | null>;
  /** Create a new asset */
  create(asset: AssetCreateInput): Promise<AssetRecord>;
  /** Create multiple assets */
  createMany(assets: AssetCreateInput[]): Promise<AssetRecord[]>;
  /** Delete an asset by ID */
  delete(id: string): Promise<boolean>;
  /** Delete all assets for a post */
  deleteByPostId(postId: string): Promise<number>;
  /** Update an asset */
  update(id: string, updates: Partial<AssetCreateInput>): Promise<AssetRecord | null>;
  /** Check if an asset exists */
  exists(id: string): Promise<boolean>;
  /** Get total count of assets */
  count(): Promise<number>;
  /** Get count of assets for a post */
  countByPostId(postId: string): Promise<number>;
}

/**
 * In-memory Assets Repository Implementation
 * This implementation stores assets in memory for development/testing.
 * Should be replaced with a proper database implementation for production.
 */
export class InMemoryAssetsRepository implements IAssetsRepository {
  private assets: Map<string, AssetRecord> = new Map();

  async findByPostId(postId: string): Promise<AssetRecord[]> {
    const results: AssetRecord[] = [];
    for (const asset of this.assets.values()) {
      if (asset.postId === postId) {
        results.push({ ...asset });
      }
    }
    // Sort by createdAt descending
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    logger.debug('Found assets by postId', { postId, count: results.length });
    return results;
  }

  async findByPostIdAndType(postId: string, type: AssetDbType): Promise<AssetRecord[]> {
    const results: AssetRecord[] = [];
    for (const asset of this.assets.values()) {
      if (asset.postId === postId && asset.type === type) {
        results.push({ ...asset });
      }
    }
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    logger.debug('Found assets by postId and type', { postId, type, count: results.length });
    return results;
  }

  async findById(id: string): Promise<AssetRecord | null> {
    const asset = this.assets.get(id);
    if (!asset) {
      return null;
    }
    return { ...asset };
  }

  async create(input: AssetCreateInput): Promise<AssetRecord> {
    const id = `asset-${generateId()}`;
    const now = new Date();

    const asset: AssetRecord = {
      id,
      ...input,
      createdAt: now,
    };

    this.assets.set(id, asset);
    logger.debug('Created asset', { id, postId: input.postId, type: input.type });

    return { ...asset };
  }

  async createMany(inputs: AssetCreateInput[]): Promise<AssetRecord[]> {
    const created: AssetRecord[] = [];
    const now = new Date();

    for (const input of inputs) {
      const id = `asset-${generateId()}`;

      const asset: AssetRecord = {
        id,
        ...input,
        createdAt: now,
      };

      this.assets.set(id, asset);
      created.push({ ...asset });
    }

    logger.debug('Created multiple assets', { count: created.length });
    return created;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.assets.delete(id);
    if (deleted) {
      logger.debug('Deleted asset', { id });
    }
    return deleted;
  }

  async deleteByPostId(postId: string): Promise<number> {
    let count = 0;
    for (const [id, asset] of this.assets.entries()) {
      if (asset.postId === postId) {
        this.assets.delete(id);
        count++;
      }
    }
    logger.debug('Deleted assets by postId', { postId, count });
    return count;
  }

  async update(id: string, updates: Partial<AssetCreateInput>): Promise<AssetRecord | null> {
    const existing = this.assets.get(id);
    if (!existing) {
      return null;
    }

    const updated: AssetRecord = {
      ...existing,
      ...updates,
    };

    this.assets.set(id, updated);
    logger.debug('Updated asset', { id });

    return { ...updated };
  }

  async exists(id: string): Promise<boolean> {
    return this.assets.has(id);
  }

  async count(): Promise<number> {
    return this.assets.size;
  }

  async countByPostId(postId: string): Promise<number> {
    let count = 0;
    for (const asset of this.assets.values()) {
      if (asset.postId === postId) {
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all assets (for testing)
   */
  clear(): void {
    this.assets.clear();
    logger.debug('Cleared all assets');
  }

  /**
   * Seed with test data (for testing)
   */
  seed(assets: AssetRecord[]): void {
    for (const asset of assets) {
      this.assets.set(asset.id, asset);
    }
    logger.debug('Seeded assets', { count: assets.length });
  }
}

// Singleton instance
let instance: IAssetsRepository | null = null;

/**
 * Get the assets repository singleton
 */
export function getAssetsRepository(): IAssetsRepository {
  if (!instance) {
    instance = new InMemoryAssetsRepository();
  }
  return instance;
}

/**
 * Create a new assets repository instance (for testing)
 */
export function createAssetsRepository(): InMemoryAssetsRepository {
  return new InMemoryAssetsRepository();
}

/**
 * Set the assets repository instance (for dependency injection)
 */
export function setAssetsRepository(repo: IAssetsRepository): void {
  instance = repo;
}
