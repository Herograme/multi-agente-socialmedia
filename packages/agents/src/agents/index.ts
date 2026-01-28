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
