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
} from './pipelines';
export type { ResearchCurateInput, ResearchCurateOutput } from './pipelines';
