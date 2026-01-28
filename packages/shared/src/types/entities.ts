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
