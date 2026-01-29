/**
 * Pipeline Definitions Export
 */

export {
  createResearchCuratePipeline,
  runResearchCuratePipeline,
  getResearchCurateConfig,
  RESEARCH_CURATE_CONFIG,
} from './research-curate';
export type { ResearchCurateInput, ResearchCurateOutput } from './research-curate';

// Visual Pipeline (Story 3.7)
export {
  createVisualPipeline,
  runVisualPipeline,
  createVisualPipelineConfig,
  getVisualPipelineConfig,
  VISUAL_PIPELINE_CONFIG,
  imageDesignerToCarouselAdapter,
  carouselToPDFAdapter,
  extractAssetsFromResult,
} from './visual';

export type {
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
} from './visual-pipeline.types';

export { DEFAULT_VISUAL_PIPELINE_CONFIG } from './visual-pipeline.types';

// Full Pipeline (Story 4.7)
export {
  createFullPipeline,
  runFullPipeline,
  createFullPipelineConfig,
  getFullPipelineConfig,
  FULL_PIPELINE_CONFIG,
} from './full';

export type {
  FullPipelineInput,
  FullPipelineOptions,
  FullPipelineOutput,
  FullPipelineCallbacks,
  ExecutionSummary,
  GeneratedPost,
  ExecutionRecord,
  ExecutionStatus,
  ExecutionFilters,
  ExecutionStats,
  PipelineStepProgress,
  FullPipelineConfig,
  FullPipelineStepName,
} from './full-pipeline.types';

export {
  DEFAULT_FULL_PIPELINE_OPTIONS,
  DEFAULT_FULL_PIPELINE_CONFIG,
  FULL_PIPELINE_STEPS,
} from './full-pipeline.types';
