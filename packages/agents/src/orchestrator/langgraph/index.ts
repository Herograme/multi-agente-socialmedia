/**
 * LangGraph Orchestrator Module
 * Barrel export for the LangGraph-based pipeline orchestrator
 */

// Types
export { LangGraphPipelineStatus } from './types';
export type {
  LangGraphPipelineConfig,
  LangGraphPipelineState,
  LangGraphPipelineResult,
  LangGraphPipelineError,
  WriterOutput as LangGraphWriterOutput,
  QAResult as LangGraphQAResult,
  CriteriaScore as LangGraphCriteriaScore,
  CodeSnippet as LangGraphCodeSnippet,
  PipelineStats as LangGraphPipelineStats,
  Platform as LangGraphPlatform,
  TransitionLog,
  CheckpointData,
  Checkpointer,
  TransitionLogger,
  GraphOptions,
  OrchestratorOptions,
  Orchestrator,
  NodeFunction,
  ConditionalRouter,
} from './types';

// Configuration
export {
  DEFAULT_PIPELINE_CONFIG,
  NODE_NAMES,
  NODE_ORDER,
  PARALLEL_NODE_GROUPS,
  ENTRY_NODE,
  DEFAULT_NODE_TIMEOUT,
  CHECKPOINT_CONFIG,
  LOGGING_CONFIG,
} from './config';
export type { NodeName } from './config';

// Pipeline Graph
export {
  createPipelineGraph,
  runPipeline,
  createInitialState,
  getNodeNames,
  isValidNodeName,
} from './pipeline-graph';

// Checkpointer
export {
  MemoryCheckpointer,
  LangGraphMemorySaverWrapper,
  createMemoryCheckpointer,
  createLangGraphCheckpointer,
  createMemorySaver,
  buildCheckpointData,
  validateCheckpointForResume,
} from './checkpointer';

// Logger
export {
  createTransitionLogger,
  summarizeState,
  createTransitionLog,
  formatDuration,
  ExecutionLogger,
} from './logger';

// Factory
export {
  createOrchestrator,
  createConfiguredGraph,
  createDefaultOrchestrator,
  createTestOrchestrator,
  generateExecutionId,
} from './factory';

// Nodes
export {
  researcherNode,
  topicGeneratorNode,
  curatorNode,
  writerNode,
  imageDesignerNode,
  carouselBuilderNode,
  pdfMakerNode,
  qaAnalystNode,
  parallelVisualNode,
  createParallelVisualProcessor,
} from './nodes';
