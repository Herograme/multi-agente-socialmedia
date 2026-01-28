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
} from './types';

export { AgentState } from './types';

// Agent class
export { CuradorAgent } from './curador-agent';

// Factory
export { createCuradorAgent, getDefaultConfig } from './factory';
