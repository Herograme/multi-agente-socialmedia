/**
 * QA Analyst Agent exports
 * Story 4.2 - Agente QA Analyst - Criterios de Qualidade
 * Story 4.3 - Agente QA Analyst - Analise de Imagens
 */

// ==========================================
// Existing Types (Story 4.2)
// ==========================================

export type {
  QAAnalystInput,
  QAAnalystOutput,
  QAResult,
  CriteriaScore,
  QAFeedback,
  QAAnalystConfig,
  CriteriaWeights,
  CodeSnippet,
  VisualAsset,
  Platform,
  StateChangeEvent,
  EvaluationPhaseEvent,
  EvaluationCompletedEvent,
  LLMService,
  LLMGenerateOptions,
  LLMGenerateResult,
  LLMMessage,
} from './types';

export {
  QACriterion,
  FeedbackSeverity,
  AgentState,
  QAEvaluationError,
} from './types';

// ==========================================
// Existing Evaluators (Story 4.2)
// ==========================================

export { TextEvaluator } from './text-evaluator';
export { CodeEvaluator } from './code-evaluator';
export { VisualEvaluator } from './visual-evaluator';
export {
  ScoreCalculator,
  getDefaultTextWeights,
  getDefaultCodeWeights,
  getDefaultVisualWeights,
  getDefaultWeights,
  getImprovementSuggestions,
  getImageQualityThresholds,
} from './score-calculator';

// ==========================================
// Visual Analysis Types (Story 4.3)
// ==========================================

export type {
  VisualAnalysisInput,
  VisualAnalysisResult,
  VisualScore,
  VisualFeedback,
  SlideConsistencyResult,
  SlideAnalysisResult,
  HeuristicAnalysisConfig,
  MultimodalAnalysisConfig,
  QAAnalystVisualConfig,
  QAResultWithVisuals,
  QAInput,
  TextAnalysisResult,
  ColorInfo,
  ContrastAnalysisResult,
  CodeSlideAnalysisResult,
  LLMVisionResponse,
} from './visual-types';

export {
  VisualIssueType,
  IssueSeverity,
  DEFAULT_HEURISTIC_CONFIG,
  DEFAULT_QA_VISUAL_CONFIG,
} from './visual-types';

// ==========================================
// Agent Class (supports both stories)
// ==========================================

export { QAAnalystAgent } from './qa-analyst-agent';

// ==========================================
// Factory (Story 4.3)
// ==========================================

export {
  createQAAnalystAgent,
  getDefaultConfig,
  getDefaultHeuristicConfig,
  validatePartialConfig,
  createProductionConfig,
} from './factory';

// ==========================================
// Visual Analyzers (Story 4.3)
// ==========================================

export { HeuristicAnalyzer, createHeuristicAnalyzer } from './heuristic-analyzer';
export { ContrastAnalyzer, createContrastAnalyzer } from './contrast-analyzer';
export { MultimodalAnalyzer, createMultimodalAnalyzer } from './multimodal-analyzer';
export { CodeSlideAnalyzer, createCodeSlideAnalyzer } from './code-slide-analyzer';
export type { CodeSlideAnalyzerConfig } from './code-slide-analyzer';
export {
  CarouselConsistencyAnalyzer,
  createCarouselConsistencyAnalyzer,
} from './carousel-consistency-analyzer';
export type { ConsistencyAnalyzerConfig } from './carousel-consistency-analyzer';
