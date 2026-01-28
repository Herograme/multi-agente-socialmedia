// Entity types - Social Content Agent

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PostStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum AssetType {
  BACKGROUND_IMAGE = 'background_image',
  CAROUSEL_SLIDE = 'carousel_slide',
  PDF = 'pdf',
}

export enum Platform {
  INSTAGRAM = 'instagram',
  LINKEDIN = 'linkedin',
}

export interface Execution {
  id: string;
  startedAt: Date;
  finishedAt?: Date;
  status: ExecutionStatus;
  config: ExecutionConfig;
  postsGenerated: number;
  averageScore?: number;
}

export interface ExecutionConfig {
  numPosts: number;
  platforms: Platform[];
  includeVisual: boolean;
  qualityThreshold: number;
  sources: string[];
}

// Re-export PostApprovalStatus from quality.ts for backwards compatibility
export { PostApprovalStatus } from './quality';
import { PostApprovalStatus } from './quality';

export interface Post {
  id: string;
  executionId: string;
  topicId: string;
  textInstagram?: string;
  textLinkedin?: string;
  status: PostStatus;
  createdAt: Date;
  assets: Asset[];
  score?: Score;
  /** QA score for quality gate evaluation (Story 4.6) */
  qaScore?: number;
  /** Approval status from quality gate (Story 4.6) */
  approvalStatus?: PostApprovalStatus;
  /** Number of regeneration attempts (Story 4.6) */
  regenerationCount?: number;
}

export interface Asset {
  id: string;
  postId: string;
  type: AssetType;
  path: string;
  sizeBytes: number;
  createdAt: Date;
}

export interface Score {
  id: string;
  postId: string;
  overallScore: number;
  criteriaBreakdown: CriteriaScore[];
  feedback: string;
  approved: boolean;
  createdAt: Date;
}

export interface CriteriaScore {
  name: string;
  score: number;
  weight: number;
  feedback?: string;
}

// Extended execution types for history UI (Story 4.8)

/**
 * Execution with duration calculated
 */
export interface ExecutionWithDuration extends Execution {
  /** Duration in milliseconds */
  duration: number;
  /** Number of approved posts */
  postsApproved: number;
}

/**
 * Post summary for execution detail view
 */
export interface PostSummary {
  id: string;
  topic: string;
  platform: Platform;
  score: number | null;
  status: PostStatus;
  hasVisual: boolean;
}

/**
 * Extended execution with posts for detail view
 */
export interface ExecutionWithPosts extends ExecutionWithDuration {
  posts: PostSummary[];
}

/**
 * Aggregated statistics for execution history
 */
export interface ExecutionStats {
  totalExecutions: number;
  totalPosts: number;
  averageScore: number;
  successRate: number;
  scoreOverTime: Array<{
    date: string;
    averageScore: number;
    count: number;
  }>;
  postsByPeriod: Array<{
    date: string;
    count: number;
  }>;
}

/**
 * Filter parameters for execution list
 */
export interface ExecutionFilters {
  period: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
}
