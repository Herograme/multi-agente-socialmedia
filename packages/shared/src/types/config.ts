// Pipeline configuration types - Social Content Agent
// Note: App configuration types are in src/config/types.ts

import type { Platform } from './entities';

/**
 * Criteria weight for quality scoring
 */
export interface CriteriaWeight {
  name: string;
  weight: number;
  minAcceptable: number;
}

/**
 * Pipeline execution configuration
 */
export interface PipelineConfig {
  numPosts: number;
  platforms: Platform[];
  includeVisual: boolean;
  qualityThreshold: number;
  sources: string[];
}
