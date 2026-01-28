/**
 * Pipeline Adapters
 * Transform outputs between different agents in the pipeline
 */

import type { ResearcherOutput } from '../agents/researcher';
import type { CuradorInput } from '../agents/curador/types';
import type { PipelineAdapter } from './types';

/**
 * Adapter: Researcher output -> Curador input
 * Transforms research trends into curator input format
 */
export const researcherToCuradorAdapter: PipelineAdapter<ResearcherOutput, CuradorInput> = {
  name: 'researcher-to-curador',
  transform(researcherOutput: ResearcherOutput): CuradorInput {
    return {
      trends: researcherOutput.trends,
      options: {
        forceRefresh: false,
        minScore: 50,
      },
    };
  },
};

/**
 * Create a custom adapter
 */
export function createAdapter<TFrom, TTo>(
  name: string,
  transformFn: (input: TFrom) => TTo
): PipelineAdapter<TFrom, TTo> {
  return {
    name,
    transform: transformFn,
  };
}

/**
 * Identity adapter (passes through unchanged)
 */
export function identityAdapter<T>(): PipelineAdapter<T, T> {
  return {
    name: 'identity',
    transform: (input: T) => input,
  };
}

/**
 * Compose multiple adapters
 */
export function composeAdapters<A, B, C>(
  first: PipelineAdapter<A, B>,
  second: PipelineAdapter<B, C>
): PipelineAdapter<A, C> {
  return {
    name: `${first.name} -> ${second.name}`,
    transform: (input: A) => second.transform(first.transform(input)),
  };
}
