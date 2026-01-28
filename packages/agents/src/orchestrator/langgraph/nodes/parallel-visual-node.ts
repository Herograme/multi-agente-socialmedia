/**
 * Parallel Visual Node
 * Handles parallel execution of carousel building and PDF generation
 */

import { createLogger } from '@social-content/shared';
import type { LangGraphPipelineState, NodeFunction } from '../types';
import { NODE_NAMES } from '../config';
import { carouselBuilderNode } from './visual-node';
import { pdfMakerNode } from './visual-node';

const logger = createLogger('langgraph:parallel-visual-node');

/**
 * Parallel visual processing node
 * Executes carousel and PDF generation in parallel when parallelVisual is enabled
 */
export const parallelVisualNode: NodeFunction = async (
  state: LangGraphPipelineState
): Promise<Partial<LangGraphPipelineState>> => {
  logger.info('Parallel Visual node starting', {
    executionId: state.executionId,
    postsCount: state.posts.length,
    parallelEnabled: state.config.parallelVisual,
  });

  try {
    if (state.config.parallelVisual) {
      // Execute carousel and PDF in parallel
      const [carouselResult, pdfResult] = await Promise.all([
        carouselBuilderNode(state),
        pdfMakerNode(state),
      ]);

      logger.info('Parallel Visual node completed', {
        executionId: state.executionId,
        carousels: carouselResult.carouselPaths?.length ?? 0,
        pdfs: pdfResult.pdfPaths?.length ?? 0,
      });

      return {
        carouselPaths: carouselResult.carouselPaths ?? [],
        pdfPaths: pdfResult.pdfPaths ?? [],
        currentNode: 'parallel_visual',
      };
    } else {
      // Sequential execution
      const carouselResult = await carouselBuilderNode(state);
      const updatedState = { ...state, ...carouselResult };
      const pdfResult = await pdfMakerNode(updatedState);

      logger.info('Sequential Visual node completed', {
        executionId: state.executionId,
        carousels: carouselResult.carouselPaths?.length ?? 0,
        pdfs: pdfResult.pdfPaths?.length ?? 0,
      });

      return {
        carouselPaths: carouselResult.carouselPaths ?? [],
        pdfPaths: pdfResult.pdfPaths ?? [],
        currentNode: 'parallel_visual',
      };
    }
  } catch (error) {
    logger.error('Parallel Visual node failed', {
      executionId: state.executionId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Factory to create a parallel visual processor with custom options
 */
export function createParallelVisualProcessor(options: {
  forceSequential?: boolean;
  timeout?: number;
}): NodeFunction {
  return async (state: LangGraphPipelineState): Promise<Partial<LangGraphPipelineState>> => {
    const useParallel = !options.forceSequential && state.config.parallelVisual;

    logger.info('Custom Parallel Visual processor starting', {
      executionId: state.executionId,
      useParallel,
      timeout: options.timeout,
    });

    const createTimeoutPromise = <T>(promise: Promise<T>, label: string): Promise<T> => {
      if (!options.timeout) return promise;

      return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(
            () => reject(new Error(`${label} timed out after ${options.timeout}ms`)),
            options.timeout
          )
        ),
      ]);
    };

    try {
      if (useParallel) {
        const [carouselResult, pdfResult] = await Promise.all([
          createTimeoutPromise(carouselBuilderNode(state), 'Carousel Builder'),
          createTimeoutPromise(pdfMakerNode(state), 'PDF Maker'),
        ]);

        return {
          carouselPaths: carouselResult.carouselPaths ?? [],
          pdfPaths: pdfResult.pdfPaths ?? [],
          currentNode: 'parallel_visual',
        };
      } else {
        const carouselResult = await createTimeoutPromise(
          carouselBuilderNode(state),
          'Carousel Builder'
        );
        const updatedState = { ...state, ...carouselResult };
        const pdfResult = await createTimeoutPromise(pdfMakerNode(updatedState), 'PDF Maker');

        return {
          carouselPaths: carouselResult.carouselPaths ?? [],
          pdfPaths: pdfResult.pdfPaths ?? [],
          currentNode: 'parallel_visual',
        };
      }
    } catch (error) {
      logger.error('Custom Parallel Visual processor failed', {
        executionId: state.executionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  };
}
