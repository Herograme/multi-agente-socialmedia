/**
 * Dashboard Metrics Types
 * Story 5.3: Dashboard Principal com Metricas
 *
 * TypeScript interfaces for dashboard metrics and chart data.
 */

/**
 * Aggregated dashboard metrics
 */
export interface DashboardMetrics {
  /** Number of posts generated today */
  postsToday: number;
  /** Percentage change vs previous day */
  postsTodayChange: number;
  /** Average QA score (0-10) */
  averageScore: number;
  /** Percentage change vs previous period */
  averageScoreChange: number;
  /** Approval rate (0-100) */
  approvalRate: number;
  /** Percentage change vs previous period */
  approvalRateChange: number;
  /** Average generation time in milliseconds */
  avgGenerationTime: number;
  /** Percentage change vs previous period */
  avgGenerationTimeChange: number;
}

/**
 * Posts by day for chart visualization
 */
export interface PostsByDayData {
  /** Date in ISO format (YYYY-MM-DD) */
  date: string;
  /** Total post count */
  count: number;
  /** Instagram posts count */
  instagram: number;
  /** LinkedIn posts count */
  linkedin: number;
}

/**
 * Score distribution data for histogram
 */
export interface ScoreDistributionData {
  /** Score range label (e.g., "0-2", "2-4") */
  range: string;
  /** Number of posts in this range */
  count: number;
  /** Percentage of total */
  percentage: number;
}

/**
 * Chart data for dashboard
 */
export interface ChartData {
  /** Posts generated per day (last 7 days) */
  postsByDay: PostsByDayData[];
  /** Score distribution histogram */
  scoreDistribution: ScoreDistributionData[];
}

/**
 * Recent post preview for dashboard
 */
export interface RecentPost {
  /** Post ID */
  id: string;
  /** Post topic */
  topic: string;
  /** Target platform */
  platform: 'instagram' | 'linkedin';
  /** QA score (null if not scored) */
  score: number | null;
  /** Post status */
  status: 'pending' | 'approved' | 'rejected' | 'needs_review';
  /** Thumbnail URL (null if no visual) */
  thumbnailUrl: string | null;
  /** Creation timestamp */
  createdAt: Date;
}

/**
 * Pipeline execution status
 */
export type PipelineStatus = 'idle' | 'running' | 'error';

/**
 * Complete dashboard state
 */
export interface DashboardState {
  /** Aggregated metrics */
  metrics: DashboardMetrics | null;
  /** Chart data */
  chartData: ChartData | null;
  /** Recent posts list */
  recentPosts: RecentPost[];
  /** Current pipeline status */
  pipelineStatus: PipelineStatus;
  /** Current execution ID if running */
  currentExecutionId: string | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
}

/**
 * API response for metrics endpoint
 */
export interface MetricsResponse {
  metrics: DashboardMetrics;
  timestamp: string;
}

/**
 * API response for charts endpoint
 */
export interface ChartsResponse {
  chartData: ChartData;
  timestamp: string;
}
