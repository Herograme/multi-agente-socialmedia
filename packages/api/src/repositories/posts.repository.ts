/**
 * Posts Repository
 * Story 4.7 - Pipeline Completo End-to-End
 *
 * Data access layer for generated posts.
 * Uses an in-memory store - can be replaced with database implementation.
 */

import { createLogger, generateId } from '@social-content/shared';

const logger = createLogger('repository:posts');

/**
 * Post approval status
 */
export type PostStatus = 'approved' | 'needs_review' | 'rejected';

/**
 * Post record for database storage
 */
export interface PostRecord {
  /** Unique post identifier */
  id: string;
  /** Execution that generated this post */
  executionId: string;
  /** Topic/theme of the post */
  topic: string;
  /** Generated text for Instagram */
  textInstagram?: string;
  /** Generated text for LinkedIn */
  textLinkedin?: string;
  /** Approval status */
  status: PostStatus;
  /** When the post was created */
  createdAt: Date;
  /** Additional metadata as JSON string */
  metadata?: string;
}

/**
 * Input for creating a post
 */
export interface PostCreateInput {
  /** Optional custom id (auto-generated if not provided) */
  id?: string;
  /** Execution that generated this post */
  executionId: string;
  /** Topic/theme of the post */
  topic: string;
  /** Generated text for Instagram */
  textInstagram?: string;
  /** Generated text for LinkedIn */
  textLinkedin?: string;
  /** Approval status */
  status: PostStatus;
  /** Additional metadata as JSON string */
  metadata?: string;
}

/**
 * Posts Repository Interface
 */
export interface IPostsRepository {
  /** Create a new post */
  create(post: PostCreateInput): Promise<PostRecord>;
  /** Create multiple posts */
  createMany(posts: PostCreateInput[]): Promise<PostRecord[]>;
  /** Find post by ID */
  findById(id: string): Promise<PostRecord | null>;
  /** Find all posts by execution ID */
  findByExecutionId(executionId: string): Promise<PostRecord[]>;
  /** Find posts by status */
  findByStatus(status: PostStatus): Promise<PostRecord[]>;
  /** Update a post */
  update(id: string, updates: Partial<PostCreateInput>): Promise<PostRecord | null>;
  /** Delete a post */
  delete(id: string): Promise<boolean>;
  /** Delete all posts for an execution */
  deleteByExecutionId(executionId: string): Promise<number>;
  /** Check if a post exists */
  exists(id: string): Promise<boolean>;
  /** Get total count of posts */
  count(): Promise<number>;
  /** Get count of posts by execution ID */
  countByExecutionId(executionId: string): Promise<number>;
}

/**
 * In-memory Posts Repository Implementation
 */
export class InMemoryPostsRepository implements IPostsRepository {
  private posts: Map<string, PostRecord> = new Map();

  async create(input: PostCreateInput): Promise<PostRecord> {
    const id = input.id || `post-${generateId()}`;
    const now = new Date();

    const post: PostRecord = {
      id,
      ...input,
      createdAt: now,
    };

    this.posts.set(id, post);
    logger.debug('Created post', { id, executionId: input.executionId, topic: input.topic });

    return { ...post };
  }

  async createMany(inputs: PostCreateInput[]): Promise<PostRecord[]> {
    const created: PostRecord[] = [];
    const now = new Date();

    for (const input of inputs) {
      const id = input.id || `post-${generateId()}`;

      const post: PostRecord = {
        id,
        ...input,
        createdAt: now,
      };

      this.posts.set(id, post);
      created.push({ ...post });
    }

    logger.debug('Created multiple posts', { count: created.length });
    return created;
  }

  async findById(id: string): Promise<PostRecord | null> {
    const post = this.posts.get(id);
    if (!post) {
      return null;
    }
    return { ...post };
  }

  async findByExecutionId(executionId: string): Promise<PostRecord[]> {
    const results: PostRecord[] = [];
    for (const post of this.posts.values()) {
      if (post.executionId === executionId) {
        results.push({ ...post });
      }
    }
    // Sort by createdAt descending
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    logger.debug('Found posts by executionId', { executionId, count: results.length });
    return results;
  }

  async findByStatus(status: PostStatus): Promise<PostRecord[]> {
    const results: PostRecord[] = [];
    for (const post of this.posts.values()) {
      if (post.status === status) {
        results.push({ ...post });
      }
    }
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    logger.debug('Found posts by status', { status, count: results.length });
    return results;
  }

  async update(id: string, updates: Partial<PostCreateInput>): Promise<PostRecord | null> {
    const existing = this.posts.get(id);
    if (!existing) {
      return null;
    }

    const updated: PostRecord = {
      ...existing,
      ...updates,
    };

    this.posts.set(id, updated);
    logger.debug('Updated post', { id });

    return { ...updated };
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.posts.delete(id);
    if (deleted) {
      logger.debug('Deleted post', { id });
    }
    return deleted;
  }

  async deleteByExecutionId(executionId: string): Promise<number> {
    let count = 0;
    for (const [id, post] of this.posts.entries()) {
      if (post.executionId === executionId) {
        this.posts.delete(id);
        count++;
      }
    }
    logger.debug('Deleted posts by executionId', { executionId, count });
    return count;
  }

  async exists(id: string): Promise<boolean> {
    return this.posts.has(id);
  }

  async count(): Promise<number> {
    return this.posts.size;
  }

  async countByExecutionId(executionId: string): Promise<number> {
    let count = 0;
    for (const post of this.posts.values()) {
      if (post.executionId === executionId) {
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all posts (for testing)
   */
  clear(): void {
    this.posts.clear();
    logger.debug('Cleared all posts');
  }

  /**
   * Seed with test data (for testing)
   */
  seed(posts: PostRecord[]): void {
    for (const post of posts) {
      this.posts.set(post.id, post);
    }
    logger.debug('Seeded posts', { count: posts.length });
  }
}

// Singleton instance
let instance: IPostsRepository | null = null;

/**
 * Get the posts repository singleton
 */
export function getPostsRepository(): IPostsRepository {
  if (!instance) {
    instance = new InMemoryPostsRepository();
  }
  return instance;
}

/**
 * Create a new posts repository instance (for testing)
 */
export function createPostsRepository(): InMemoryPostsRepository {
  return new InMemoryPostsRepository();
}

/**
 * Set the posts repository instance (for dependency injection)
 */
export function setPostsRepository(repo: IPostsRepository): void {
  instance = repo;
}
