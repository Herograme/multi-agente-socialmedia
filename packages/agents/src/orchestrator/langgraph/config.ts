/**
 * LangGraph Pipeline Configuration
 * Configuration constants and defaults for the LangGraph orchestrator
 */

import type { LangGraphPipelineConfig } from './types';

/**
 * Default pipeline configuration
 */
export const DEFAULT_PIPELINE_CONFIG: LangGraphPipelineConfig = {
  numPosts: 3,
  platforms: ['instagram', 'linkedin'],
  includeVisual: true,
  qualityThreshold: 6.0,
  maxRetries: 3,
  timeoutMs: 600000, // 10 minutes
  parallelVisual: true,
};

/**
 * Node names for the pipeline graph
 */
export const NODE_NAMES = {
  RESEARCHER: 'researcher',
  TOPIC_GENERATOR: 'topic_generator',
  CURATOR: 'curator',
  WRITER: 'writer',
  IMAGE_DESIGNER: 'image_designer',
  CAROUSEL_BUILDER: 'carousel_builder',
  PDF_MAKER: 'pdf_maker',
  QA_ANALYST: 'qa_analyst',
} as const;

/**
 * Node name type derived from NODE_NAMES
 */
export type NodeName = (typeof NODE_NAMES)[keyof typeof NODE_NAMES];

/**
 * Sequential node execution order
 */
export const NODE_ORDER: readonly NodeName[] = [
  NODE_NAMES.RESEARCHER,
  NODE_NAMES.TOPIC_GENERATOR,
  NODE_NAMES.CURATOR,
  NODE_NAMES.WRITER,
  // Visual nodes (some can be parallel)
  NODE_NAMES.IMAGE_DESIGNER,
  NODE_NAMES.CAROUSEL_BUILDER,
  NODE_NAMES.PDF_MAKER,
  // QA at the end
  NODE_NAMES.QA_ANALYST,
] as const;

/**
 * Nodes that can execute in parallel (visual generation)
 */
export const PARALLEL_NODE_GROUPS = [
  [NODE_NAMES.CAROUSEL_BUILDER, NODE_NAMES.PDF_MAKER],
] as const;

/**
 * Entry point of the graph
 */
export const ENTRY_NODE = NODE_NAMES.RESEARCHER;

/**
 * Timeout for individual nodes in milliseconds
 */
export const DEFAULT_NODE_TIMEOUT = 120000; // 2 minutes

/**
 * Configuration for checkpointing
 */
export const CHECKPOINT_CONFIG = {
  /** Whether to enable checkpointing by default */
  enabled: true,
  /** Interval to save checkpoints (after each node) */
  saveAfterEachNode: true,
  /** Maximum checkpoints to keep per execution */
  maxCheckpointsPerExecution: 10,
} as const;

/**
 * Logging configuration
 */
export const LOGGING_CONFIG = {
  /** Log level for orchestrator logs */
  level: 'info' as const,
  /** Include full state in logs (can be verbose) */
  includeFullState: false,
  /** Truncate long strings in logs */
  maxStringLength: 200,
} as const;
