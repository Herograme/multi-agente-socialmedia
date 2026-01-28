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
//# sourceMappingURL=config.d.ts.map