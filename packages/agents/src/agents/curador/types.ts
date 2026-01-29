/**
 * Curador Agent Types
 * Types and interfaces for content curation functionality
 */

import type { Trend } from '@social-content/shared';

/**
 * States of the agent lifecycle
 */
export enum AgentState {
  IDLE = 'idle',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
}

/**
 * Content source for curation
 */
export interface ContentSource {
  id: string;
  name: string;
  type: 'rss' | 'api' | 'scraper';
  url: string;
  enabled: boolean;
  priority: number; // 1-10, higher = more important
}

/**
 * Code snippet extracted from content
 */
export interface CodeSnippet {
  code: string;
  language?: string;
  context?: string;
}

/**
 * Platform-specific generated content
 */
export interface PlatformContent {
  instagram?: {
    caption: string;
    hashtags: string[];
    imagePrompt?: string;
  };
  linkedin?: {
    post: string;
    hashtags: string[];
  };
  twitter?: {
    thread: string[];
    hashtags: string[];
  };
}

/**
 * Curated and processed content
 */
export interface CuratedContent {
  id: string;
  originalTrend: Trend;
  title: string;
  summary: string;
  relevanceScore: number; // 0-100
  categories: string[];
  tags: string[];
  sourceId: string;
  curatedAt: Date;
  metadata: {
    wordCount: number;
    readingTime: number; // minutes
    language: string;
  };
  /** Platform-specific generated content */
  platformContent?: PlatformContent;
  /** Code snippets extracted from references */
  codeSnippets?: CodeSnippet[];
  /** Content generation source */
  generatedBy?: 'llm' | 'fallback';
  /** LLM provider used */
  llmProvider?: string;
}

/**
 * Error during curation process
 */
export interface CurationError {
  sourceId: string;
  trendId?: string;
  message: string;
  code: string;
}

/**
 * Result of curation operation
 */
export interface CurationResult {
  success: boolean;
  content: CuratedContent[];
  stats: {
    totalProcessed: number;
    totalCurated: number;
    totalFiltered: number;
    processingTimeMs: number;
  };
  errors: CurationError[];
  timestamp: Date;
}

/**
 * Curador agent configuration
 */
export interface CuradorConfig {
  sources: ContentSource[];
  minRelevanceScore: number; // Threshold to include content
  maxResults: number;
  categories: string[]; // Categories of interest
  rateLimitPerMinute: number;
}

/**
 * Input for the curador agent
 */
export interface CuradorInput {
  trends: Trend[];
  options?: {
    forceRefresh?: boolean;
    filterCategories?: string[];
    minScore?: number;
  };
}

/**
 * Output from the curador agent
 */
export interface CuradorOutput {
  result: CurationResult;
  state: AgentState;
}

/**
 * State change event payload
 */
export interface StateChangeEvent {
  previous: AgentState;
  current: AgentState;
}
