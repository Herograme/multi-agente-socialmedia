/**
 * Pipeline Orchestrator Module
 * Export all pipeline-related functionality
 */

// Core types
export {
  PipelineStatus,
  StepStatus,
} from './types';
export type {
  PipelineConfig,
  PipelineContext,
  PipelineError,
  PipelineResult,
  PipelineRunOptions,
  PipelineState,
  PipelineStep,
  StepResult,
  StepState,
  PipelineEvents,
  PipelineAdapter,
} from './types';

// Pipeline orchestrator
export {
  PipelineOrchestrator,
  PipelineTimeoutError,
  PipelineStepError,
  PipelineCancelledError,
} from './pipeline';
export type { CleanupHandler } from './pipeline';

// Status store
export {
  PipelineStatusStore,
  getPipelineStatusStore,
  createPipelineStatusStore,
} from './status-store';
export type { StatusStoreOptions } from './status-store';

// Adapters
export {
  researcherToCuradorAdapter,
  createAdapter,
  identityAdapter,
  composeAdapters,
} from './adapters';

// Pipeline definitions
export {
  createResearchCuratePipeline,
  runResearchCuratePipeline,
  getResearchCurateConfig,
  RESEARCH_CURATE_CONFIG,
  // Visual Pipeline (Story 3.7)
  createVisualPipeline,
  runVisualPipeline,
  createVisualPipelineConfig,
  getVisualPipelineConfig,
  VISUAL_PIPELINE_CONFIG,
  imageDesignerToCarouselAdapter,
  carouselToPDFAdapter,
  extractAssetsFromResult,
  DEFAULT_VISUAL_PIPELINE_CONFIG,
} from './pipelines';
export type {
  ResearchCurateInput,
  ResearchCurateOutput,
  // Visual Pipeline types (Story 3.7)
  VisualPipelineInput,
  VisualPipelineContent,
  VisualPipelineOptions,
  VisualPipelineOutput,
  VisualPipelineMetadata,
  VisualPipelineStatus,
  VisualPipelineConfig,
  GeneratedAsset,
  AssetType,
  AssetRecord,
  CleanupResult,
  CleanupFailure,
  CodeBlock,
} from './pipelines';
