/**
 * LangGraph Pipeline Types
 * Type definitions for the LangGraph-based orchestrator
 */

import type { Trend, Topic } from '@social-content/shared';
import type { CuratedContent } from '../../agents/curador/types';
import type { GeneratedImage } from '../../services/image-gen/types';

/**
 * Pipeline execution status
 */
export enum LangGraphPipelineStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused',
}

/**
 * Platform types supported by the pipeline
 */
export type Platform = 'instagram' | 'linkedin';

/**
 * Configuration for the pipeline
 */
export interface LangGraphPipelineConfig {
  /** Number of posts to generate */
  numPosts: number;
  /** Target platforms */
  platforms: Platform[];
  /** Whether to include visual content generation */
  includeVisual: boolean;
  /** Minimum quality threshold for QA approval */
  qualityThreshold: number;
  /** Maximum retry attempts per node */
  maxRetries: number;
  /** Overall pipeline timeout in milliseconds */
  timeoutMs: number;
  /** Whether to run visual nodes in parallel */
  parallelVisual: boolean;
}

/**
 * Writer output for a single post
 */
export interface WriterOutput {
  id: string;
  topicId: string;
  textInstagram?: string;
  textLinkedIn?: string;
  hashtags: string[];
  codeSnippets: CodeSnippet[];
  createdAt: Date;
}

/**
 * Code snippet included in post
 */
export interface CodeSnippet {
  language: string;
  code: string;
  description?: string;
}

/**
 * QA analysis result for a post
 */
export interface QAResult {
  postId: string;
  overallScore: number;
  approved: boolean;
  criteriaScores: CriteriaScore[];
  feedback: string;
  suggestions: string[];
  analyzedAt: Date;
}

/**
 * Score for a specific quality criterion
 */
export interface CriteriaScore {
  name: string;
  score: number;
  weight: number;
  feedback?: string;
}

/**
 * Error that occurred during pipeline execution
 */
export interface LangGraphPipelineError {
  /** Node where the error occurred */
  node: string;
  /** Error message */
  message: string;
  /** Error code for categorization */
  code: string;
  /** When the error occurred */
  timestamp: Date;
  /** Whether this error can be retried */
  retriable: boolean;
  /** Stack trace if available */
  stack?: string;
}

/**
 * State shared between all nodes in the graph
 */
export interface LangGraphPipelineState {
  // Identification
  /** Unique execution identifier */
  executionId: string;
  /** Thread ID for checkpointing */
  threadId: string;
  /** Current execution status */
  status: LangGraphPipelineStatus;

  // Configuration
  /** Pipeline configuration */
  config: LangGraphPipelineConfig;

  // Data populated by each node
  /** Trends discovered by researcher */
  trends: Trend[];
  /** Topics generated from trends */
  topics: Topic[];
  /** Curated content for each topic */
  curatedContent: CuratedContent[];
  /** Generated posts */
  posts: WriterOutput[];
  /** Generated images */
  images: GeneratedImage[];
  /** Carousel slide paths grouped by post */
  carouselPaths: string[][];
  /** PDF document paths */
  pdfPaths: string[];
  /** QA results for each post */
  qaResults: QAResult[];

  // Metadata
  /** Currently executing node name */
  currentNode: string;
  /** Pipeline start time */
  startedAt: Date;
  /** Pipeline completion time */
  completedAt?: Date;
  /** Errors encountered during execution */
  errors: LangGraphPipelineError[];

  // Checkpointing
  /** Last checkpoint identifier */
  lastCheckpoint?: string;
  /** Additional checkpoint data */
  checkpointData?: Record<string, unknown>;
}

/**
 * Transition log entry for tracking node transitions
 */
export interface TransitionLog {
  /** Previous node (or '__start__' for first node) */
  from: string;
  /** Current node */
  to: string;
  /** When the transition occurred */
  timestamp: Date;
  /** Duration of the node execution in ms */
  durationMs: number;
  /** Summary of node input */
  inputSummary: string;
  /** Summary of node output */
  outputSummary: string;
  /** Whether the node succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * Data stored in checkpoints for resume capability
 */
export interface CheckpointData {
  /** Thread identifier */
  threadId: string;
  /** Partial pipeline state at checkpoint time */
  state: Partial<LangGraphPipelineState>;
  /** When the checkpoint was created */
  timestamp: Date;
  /** Node that was just completed */
  node: string;
  /** Checkpoint version for compatibility */
  version: number;
}

/**
 * Result of pipeline execution
 */
export interface LangGraphPipelineResult {
  /** Execution identifier */
  executionId: string;
  /** Final execution status */
  status: LangGraphPipelineStatus;
  /** Generated posts */
  posts: WriterOutput[];
  /** QA results for posts */
  qaResults: QAResult[];
  /** Execution statistics */
  stats: PipelineStats;
  /** Errors encountered */
  errors: LangGraphPipelineError[];
}

/**
 * Execution statistics
 */
export interface PipelineStats {
  /** Total posts generated */
  totalGenerated: number;
  /** Posts approved by QA */
  totalApproved: number;
  /** Average quality score */
  averageScore: number;
  /** Total execution time in ms */
  durationMs: number;
}

/**
 * Checkpointer interface for persistence
 */
export interface Checkpointer {
  /** Save a checkpoint */
  save(data: CheckpointData): Promise<void>;
  /** Load a checkpoint by thread ID */
  load(threadId: string): Promise<CheckpointData | null>;
  /** List all checkpoints for an execution */
  list(executionId: string): Promise<CheckpointData[]>;
  /** Delete a checkpoint */
  delete(threadId: string): Promise<void>;
}

/**
 * Transition logger interface
 */
export interface TransitionLogger {
  /** Log a transition */
  log(transition: TransitionLog): void;
  /** Get transition history for an execution */
  getHistory(executionId: string): TransitionLog[];
  /** Clear history for an execution */
  clearHistory(executionId: string): void;
}

/**
 * Options for creating the pipeline graph
 */
export interface GraphOptions {
  /** Custom checkpointer implementation */
  checkpointer?: Checkpointer;
  /** Custom transition logger */
  logger?: TransitionLogger;
  /** Callback when a node starts */
  onNodeStart?: (node: string, state: LangGraphPipelineState) => void;
  /** Callback when a node ends */
  onNodeEnd?: (node: string, state: LangGraphPipelineState, duration: number) => void;
  /** Callback when an error occurs */
  onError?: (node: string, error: Error) => void;
}

/**
 * Options for running the orchestrator
 */
export interface OrchestratorOptions {
  /** Pipeline configuration overrides */
  config?: Partial<LangGraphPipelineConfig>;
  /** Enable checkpoint persistence */
  enableCheckpoints?: boolean;
  /** Enable transition logging */
  enableLogging?: boolean;
  /** Node start callback */
  onNodeStart?: (node: string, state: unknown) => void;
  /** Node end callback */
  onNodeEnd?: (node: string, state: unknown, duration: number) => void;
  /** Error callback */
  onError?: (node: string, error: Error) => void;
}

/**
 * Orchestrator interface
 */
export interface Orchestrator {
  /** Run the full pipeline */
  run(executionId: string): Promise<LangGraphPipelineResult>;
  /** Resume a pipeline from checkpoint */
  resume(threadId: string): Promise<LangGraphPipelineResult>;
  /** Get current configuration */
  getConfig(): LangGraphPipelineConfig;
}

/**
 * Node function signature
 */
export type NodeFunction = (
  state: LangGraphPipelineState
) => Promise<Partial<LangGraphPipelineState>>;

/**
 * Conditional routing function signature
 */
export type ConditionalRouter = (
  state: LangGraphPipelineState
) => string;
