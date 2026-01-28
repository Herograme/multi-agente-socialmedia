/**
 * Research-Curate Pipeline Definition
 * Combines Researcher and Curador agents into a single pipeline
 */

import {
  createResearcherAgent,
  createCuradorAgent,
  type ResearcherInput,
  type ResearcherOutput,
  type CuradorInput,
  type CuradorOutput,
} from '../../agents';
import { PipelineOrchestrator } from '../pipeline';
import type { PipelineConfig, PipelineStep, PipelineResult, PipelineRunOptions } from '../types';
import { researcherToCuradorAdapter } from '../adapters';

/**
 * Research-Curate pipeline configuration
 */
export const RESEARCH_CURATE_CONFIG: PipelineConfig = {
  id: 'research-curate',
  name: 'Research and Curate Pipeline',
  description: 'Discovers trends from multiple sources and curates them into content',
  steps: [],
  defaultTimeout: 60000,
  defaultRetries: 1,
};

/**
 * Input for the research-curate pipeline
 */
export interface ResearchCurateInput {
  sources?: Array<'devto' | 'hackernews' | 'reddit'>;
  limit?: number;
  timeout?: number;
}

/**
 * Output from the research-curate pipeline
 */
export interface ResearchCurateOutput {
  research: ResearcherOutput;
  curation: CuradorOutput;
}

/**
 * Create a configured Research-Curate pipeline
 */
export function createResearchCuratePipeline(): PipelineOrchestrator {
  const researcherAgent = createResearcherAgent();
  const curadorAgent = createCuradorAgent();

  const researchStep: PipelineStep<ResearcherInput, ResearcherOutput> = {
    name: 'research',
    agent: researcherAgent as unknown as PipelineStep<ResearcherInput, ResearcherOutput>['agent'],
    timeout: 30000,
    retries: 2,
    transform: (output: ResearcherOutput) => researcherToCuradorAdapter.transform(output),
  };

  const curateStep: PipelineStep<CuradorInput, CuradorOutput> = {
    name: 'curate',
    agent: curadorAgent as unknown as PipelineStep<CuradorInput, CuradorOutput>['agent'],
    timeout: 60000,
    retries: 1,
  };

  const config: PipelineConfig = {
    ...RESEARCH_CURATE_CONFIG,
    steps: [
      researchStep as unknown as PipelineStep<unknown, unknown>,
      curateStep as unknown as PipelineStep<unknown, unknown>,
    ],
  };

  return new PipelineOrchestrator(config);
}

/**
 * Run the research-curate pipeline
 */
export async function runResearchCuratePipeline(
  input: ResearchCurateInput = {},
  options?: PipelineRunOptions
): Promise<PipelineResult> {
  const pipeline = createResearchCuratePipeline();

  const researcherInput: ResearcherInput = {
    sources: input.sources ?? ['devto', 'hackernews', 'reddit'],
    limit: input.limit ?? 50,
    timeout: input.timeout ?? 10000,
  };

  return pipeline.run(researcherInput, options);
}

/**
 * Get the pipeline configuration
 */
export function getResearchCurateConfig(): PipelineConfig {
  return { ...RESEARCH_CURATE_CONFIG };
}
