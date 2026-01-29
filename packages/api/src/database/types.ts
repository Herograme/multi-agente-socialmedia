/**
 * Database Entity Types
 * Story 4.1 - Persistencia com SQLite
 *
 * TypeScript interfaces and enums for all database entities.
 */

// ============================================================
// Enums
// ============================================================

/**
 * Status of a pipeline execution
 */
export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Status of a generated post
 */
export enum PostStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEEDS_REVIEW = 'needs_review',
}

/**
 * Type of asset attached to a post
 */
export enum AssetType {
  IMAGE = 'image',
  CAROUSEL = 'carousel',
  PDF = 'pdf',
}

// ============================================================
// Execution Types
// ============================================================

/**
 * Configuration options for a pipeline execution
 */
export interface ExecutionConfig {
  /** Number of posts to generate */
  numPosts?: number;
  /** Target platforms */
  platforms?: ('instagram' | 'linkedin')[];
  /** Whether to include visual generation */
  includeVisual?: boolean;
  /** Minimum quality score threshold */
  qualityThreshold?: number;
  /** Trend sources to use */
  sources?: string[];
  /** Any additional configuration */
  [key: string]: unknown;
}

/**
 * Pipeline execution record
 */
export interface Execution {
  /** Unique execution identifier */
  id: string;
  /** When the execution started */
  started_at: string;
  /** When the execution finished (null if still running) */
  finished_at: string | null;
  /** Current execution status */
  status: ExecutionStatus;
  /** Execution configuration */
  config: ExecutionConfig;
  /** Record creation timestamp */
  created_at: string;
}

/**
 * Data required to create a new execution
 */
export interface CreateExecution {
  /** Optional custom ID (UUID generated if not provided) */
  id?: string;
  /** Execution configuration */
  config?: ExecutionConfig;
  /** Initial status (defaults to PENDING) */
  status?: ExecutionStatus;
}

/**
 * Data for updating an existing execution
 */
export interface UpdateExecution {
  /** Set finished timestamp */
  finished_at?: string;
  /** Update status */
  status?: ExecutionStatus;
  /** Update configuration */
  config?: ExecutionConfig;
}

// ============================================================
// Post Types
// ============================================================

/**
 * Generated post record
 */
export interface Post {
  /** Unique post identifier */
  id: string;
  /** ID of the execution that generated this post */
  execution_id: string;
  /** Post topic/title */
  topic: string;
  /** Instagram text content */
  text_ig: string | null;
  /** LinkedIn text content */
  text_linkedin: string | null;
  /** Post review status */
  status: PostStatus;
  /** Reason for rejection (Story 5.5) */
  rejection_reason: string | null;
  /** Record creation timestamp */
  created_at: string;
  /** Record update timestamp */
  updated_at: string | null;
}

/**
 * Data required to create a new post
 */
export interface CreatePost {
  /** Optional custom ID */
  id?: string;
  /** ID of the parent execution */
  execution_id: string;
  /** Post topic */
  topic: string;
  /** Instagram text */
  text_ig?: string;
  /** LinkedIn text */
  text_linkedin?: string;
  /** Initial status (defaults to PENDING) */
  status?: PostStatus;
}

/**
 * Data for updating an existing post
 */
export interface UpdatePost {
  /** Update topic */
  topic?: string;
  /** Update Instagram text */
  text_ig?: string;
  /** Update LinkedIn text */
  text_linkedin?: string;
  /** Update status */
  status?: PostStatus;
  /** Update rejection reason (Story 5.5) */
  rejection_reason?: string | null;
}

/**
 * Post with its associated assets
 */
export interface PostWithAssets extends Post {
  /** Assets attached to this post */
  assets: Asset[];
}

/**
 * Post with its QA score
 */
export interface PostWithScore extends Post {
  /** QA score for this post (null if not scored) */
  score: Score | null;
}

// ============================================================
// Asset Types
// ============================================================

/**
 * Asset record (image, carousel, PDF)
 */
export interface Asset {
  /** Unique asset identifier */
  id: string;
  /** ID of the post this asset belongs to */
  post_id: string;
  /** Asset type */
  type: AssetType;
  /** File path */
  path: string;
  /** File size in bytes */
  size: number;
  /** Additional metadata */
  metadata: Record<string, unknown>;
  /** Record creation timestamp */
  created_at: string;
}

/**
 * Data required to create a new asset
 */
export interface CreateAsset {
  /** Optional custom ID */
  id?: string;
  /** ID of the parent post */
  post_id: string;
  /** Asset type */
  type: AssetType;
  /** File path */
  path: string;
  /** File size in bytes (defaults to 0) */
  size?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Data for updating an existing asset
 */
export interface UpdateAsset {
  /** Update file path */
  path?: string;
  /** Update file size */
  size?: number;
  /** Update metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================
// Score Types
// ============================================================

/**
 * Breakdown of QA scoring criteria
 */
export interface CriteriaBreakdown {
  /** Clarity score (0-10) */
  clarity?: number;
  /** Relevance score (0-10) */
  relevance?: number;
  /** Engagement potential score (0-10) */
  engagement?: number;
  /** Grammar/spelling score (0-10) */
  grammar?: number;
  /** Code quality score (0-10) */
  code_quality?: number;
  /** Visual quality score (0-10) */
  visual_quality?: number;
  /** Additional criteria */
  [key: string]: number | undefined;
}

/**
 * QA score record for a post
 */
export interface Score {
  /** Unique score identifier */
  id: string;
  /** ID of the scored post */
  post_id: string;
  /** Overall quality score (0-10) */
  overall_score: number;
  /** Breakdown by criteria */
  criteria_breakdown: CriteriaBreakdown;
  /** QA feedback text */
  feedback: string | null;
  /** Whether the post is approved */
  approved: boolean;
  /** Record creation timestamp */
  created_at: string;
}

/**
 * Data required to create a new score
 */
export interface CreateScore {
  /** Optional custom ID */
  id?: string;
  /** ID of the post to score */
  post_id: string;
  /** Overall score (0-10) */
  overall_score: number;
  /** Criteria breakdown */
  criteria_breakdown?: CriteriaBreakdown;
  /** QA feedback */
  feedback?: string;
  /** Approval status (defaults to false) */
  approved?: boolean;
}

/**
 * Data for updating an existing score
 */
export interface UpdateScore {
  /** Update overall score */
  overall_score?: number;
  /** Update criteria breakdown */
  criteria_breakdown?: CriteriaBreakdown;
  /** Update feedback */
  feedback?: string;
  /** Update approval status */
  approved?: boolean;
}

// ============================================================
// Query Options
// ============================================================

/**
 * Options for paginated queries
 */
export interface FindOptions {
  /** Maximum number of results to return */
  limit?: number;
  /** Number of results to skip */
  offset?: number;
  /** Column to order by */
  orderBy?: string;
  /** Order direction */
  orderDir?: 'ASC' | 'DESC';
}

// ============================================================
// Row Types (internal database representations)
// ============================================================

/**
 * Raw execution row from database
 */
export interface ExecutionRow {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  config: string;
  created_at: string;
}

/**
 * Raw post row from database
 */
export interface PostRow {
  id: string;
  execution_id: string;
  topic: string;
  text_ig: string | null;
  text_linkedin: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string | null;
}

/**
 * Raw asset row from database
 */
export interface AssetRow {
  id: string;
  post_id: string;
  type: string;
  path: string;
  size: number;
  metadata: string;
  created_at: string;
}

/**
 * Raw score row from database
 */
export interface ScoreRow {
  id: string;
  post_id: string;
  overall_score: number;
  criteria_breakdown: string;
  feedback: string | null;
  approved: number;
  created_at: string;
}

// ============================================================
// Template Types (Story 5.7)
// ============================================================

/**
 * Raw template row from database
 */
export interface TemplateRow {
  id: string;
  name: string;
  description: string | null;
  theme: string;
  is_default: number;
  created_at: string;
  updated_at: string;
}

/**
 * Template entity (from database)
 */
export interface DbTemplate {
  /** Unique template identifier */
  id: string;
  /** Template name */
  name: string;
  /** Optional description */
  description: string | null;
  /** Theme configuration as JSON string */
  theme: string;
  /** Whether this is the default template */
  is_default: boolean;
  /** Record creation timestamp */
  created_at: string;
  /** Record update timestamp */
  updated_at: string;
}

/**
 * Data required to create a new template
 */
export interface CreateDbTemplate {
  /** Optional custom ID (UUID generated if not provided) */
  id?: string;
  /** Template name */
  name: string;
  /** Optional description */
  description?: string;
  /** Theme configuration as JSON string */
  theme: string;
  /** Whether this is the default template */
  is_default?: boolean;
}

/**
 * Data for updating an existing template
 */
export interface UpdateDbTemplate {
  /** Update name */
  name?: string;
  /** Update description */
  description?: string | null;
  /** Update theme as JSON string */
  theme?: string;
}
