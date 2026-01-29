/**
 * Agent exports
 */

export type { Agent, AgentResult } from './types';
export { AgentStatus } from './types';
export { ResearcherAgent, createResearcherAgent } from './researcher';
export type { ResearcherInput, ResearcherOutput, SourceName } from './researcher';

// Curador Agent
export {
  CuradorAgent,
  createCuradorAgent,
  getDefaultConfig as getCuradorDefaultConfig,
  AgentState,
} from './curador';
export type {
  ContentSource,
  CuratedContent,
  CurationError,
  CurationResult,
  CuradorConfig,
  CuradorInput,
  CuradorOutput,
  StateChangeEvent,
} from './curador';

// ImageDesigner Agent
export {
  ImageDesignerAgent,
  createImageDesignerAgent,
  getDefaultConfig as getImageDesignerDefaultConfig,
  validatePartialConfig as validateImageDesignerPartialConfig,
  AgentState as ImageDesignerAgentState,
  ImageStyle,
  // Prompt generator utilities
  generateBackgroundPrompt,
  generateAlternativePrompt,
  getAlternativeStyle,
  extractTopicEssence,
  validatePromptSafety,
  getAllTemplates,
  getTemplateForStyle,
  TECH_COLORS,
  // Image validator utilities
  getImageMetadata,
  validateImageDimensions,
  validateImageFormat,
  validateImageSize,
  validateImage,
  isImageFile,
  getOutputPath,
  ensureOutputDirectory,
} from './image-designer';

export type {
  ImageMetadata,
  ImageDesignerInput,
  ImageDesignerOutput,
  ImageDesignerConfig,
  PromptTemplate,
  ImageValidationResult,
  StateChangeEvent as ImageDesignerStateChangeEvent,
  AttemptEvent,
  SupportedFormat,
} from './image-designer';

// PDFMaker Agent
export {
  PDFMakerAgent,
  createPDFMakerAgent,
  getDefaultConfig as getPDFMakerDefaultConfig,
  validatePartialConfig as validatePDFMakerPartialConfig,
  AgentState as PDFMakerAgentState,
  PDFRenderMode,
  PDFService,
  // Utils
  ensureOutputDirectory as ensurePDFOutputDirectory,
  ensureOutputDirectorySync as ensurePDFOutputDirectorySync,
  getOutputPath as getPDFOutputPath,
  getFileSize as getPDFFileSize,
  validateImagePaths,
  formatFileSize,
  isSupportedImageFormat,
  getImageFormat,
  resolveAbsolutePath,
  fileExists,
} from './pdf-maker';

export type {
  PDFMakerConfig,
  PDFMakerInput,
  PDFMakerOutput,
  PDFMetadata,
  StateChangeEvent as PDFMakerStateChangeEvent,
  PDFGenerationOptions,
  PDFGenerationResult,
  CompressionLevel,
  Dimensions,
  Margin,
  SupportedImageFormat,
} from './pdf-maker';

// CarouselBuilder Agent
export {
  CarouselBuilderAgent,
  createCarouselBuilderAgent,
  createMockRenderer,
  getDefaultConfig as getCarouselBuilderDefaultConfig,
  validatePartialConfig as validateCarouselBuilderPartialConfig,
  AgentState as CarouselBuilderAgentState,
  SlideType,
  // Content splitter utilities
  splitContent,
  extractTitle,
  splitIntoParagraphs,
  distributeContent,
  insertCodeSlides,
  detectCodeBlocks,
  calculateOptimalSlideCount,
  getDefaultSplitterConfig,
  // Code highlighter utilities
  highlightCode as highlightCarouselCode,
  highlightMultiple,
  normalizeLanguage,
  escapeHtml as escapeCarouselHtml,
  isSupportedLanguage,
  disposeHighlighter as disposeCarouselHighlighter,
  getLanguageAliases,
} from './carousel-builder';

export type {
  CarouselBuilderInput,
  CarouselBuilderOutput,
  CarouselConfig,
  CarouselSlide,
  CodeExample,
  ContentSplitResult,
  RenderOptions,
  RendererService,
  SlideMetadata,
  SplitSlide,
  SplitterConfig,
  StateChangeEvent as CarouselBuilderStateChangeEvent,
  CodeHighlightResult,
} from './carousel-builder';

// QAAnalyst Agent (Story 4.2 - Criterios de Qualidade)
export {
  QAAnalystAgent,
  createQAAnalystAgent,
  getDefaultConfig as getQAAnalystDefaultConfig,
  validatePartialConfig as validateQAAnalystPartialConfig,
  AgentState as QAAnalystAgentState,
  QACriterion,
  FeedbackSeverity,
  QAEvaluationError,
  // Evaluators
  TextEvaluator,
  CodeEvaluator,
  VisualEvaluator,
  ScoreCalculator,
  // Utility functions
  getDefaultTextWeights,
  getDefaultCodeWeights,
  getDefaultVisualWeights,
  getDefaultWeights as getQADefaultWeights,
  getImprovementSuggestions,
  getImageQualityThresholds,
  // Story 4.3 - Visual Analysis
  VisualIssueType,
  IssueSeverity,
  DEFAULT_HEURISTIC_CONFIG,
  DEFAULT_QA_VISUAL_CONFIG,
  // Visual Analyzers
  HeuristicAnalyzer,
  createHeuristicAnalyzer,
  ContrastAnalyzer,
  createContrastAnalyzer,
  MultimodalAnalyzer,
  createMultimodalAnalyzer,
  CodeSlideAnalyzer,
  createCodeSlideAnalyzer,
  CarouselConsistencyAnalyzer,
  createCarouselConsistencyAnalyzer,
  getDefaultHeuristicConfig,
  createProductionConfig,
} from './qa-analyst';

export type {
  QAAnalystInput,
  QAAnalystOutput,
  QAResult as QAAnalystResult,
  CriteriaScore as QAAnalystCriteriaScore,
  QAFeedback,
  QAAnalystConfig,
  CriteriaWeights,
  CodeSnippet as QACodeSnippet,
  VisualAsset,
  Platform as QAPlatform,
  StateChangeEvent as QAAnalystStateChangeEvent,
  EvaluationPhaseEvent,
  EvaluationCompletedEvent,
  LLMService,
  LLMGenerateOptions,
  LLMGenerateResult,
  LLMMessage,
  // Story 4.3 - Visual Analysis Types
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
  CodeSlideAnalyzerConfig,
  ConsistencyAnalyzerConfig,
} from './qa-analyst';
