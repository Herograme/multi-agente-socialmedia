/**
 * Curador Agent exports
 */

// Types
export type {
  ContentSource,
  CuratedContent,
  CurationError,
  CurationResult,
  CuradorConfig,
  CuradorInput,
  CuradorOutput,
  StateChangeEvent,
  CodeSnippet,
  PlatformContent,
} from './types';

export { AgentState } from './types';

// Agent class
export { CuradorAgent, type CuradorDependencies } from './curador-agent';

// Factory
export { createCuradorAgent, createFullCuradorAgent, getDefaultConfig } from './factory';

// Content Generator
export { ContentGenerator, createContentGenerator } from './content-generator';
export type { ContentGenerationOptions, ContentGenerationResult } from './content-generator';
