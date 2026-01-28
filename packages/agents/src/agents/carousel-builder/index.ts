/**
 * CarouselBuilder Agent exports
 * Story 3.5 - Agente Carousel Builder
 */

// Types
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
  StateChangeEvent,
} from './types';

export { AgentState, SlideType } from './types';

// Agent class
export { CarouselBuilderAgent } from './carousel-builder-agent';

// Factory
export {
  createCarouselBuilderAgent,
  createMockRenderer,
  getDefaultConfig,
  validatePartialConfig,
} from './factory';

// Content splitter utilities
export {
  calculateOptimalSlideCount,
  detectCodeBlocks,
  distributeContent,
  extractTitle,
  getDefaultSplitterConfig,
  splitContent,
  splitIntoParagraphs,
  insertCodeSlides,
} from './content-splitter';

// Code highlighter utilities
export {
  disposeHighlighter,
  escapeHtml,
  getLanguageAliases,
  highlightCode,
  highlightMultiple,
  isSupportedLanguage,
  normalizeLanguage,
} from './code-highlighter';

export type { CodeHighlightResult } from './code-highlighter';
