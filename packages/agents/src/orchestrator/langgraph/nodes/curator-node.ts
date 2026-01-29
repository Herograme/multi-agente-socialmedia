/**
 * Curator Node
 * Node wrapper for the Curator agent in the LangGraph pipeline
 */

import { createLogger } from '@social-content/shared';
import type { LangGraphPipelineState, NodeFunction } from '../types';
import { NODE_NAMES } from '../config';

const logger = createLogger('langgraph:curator-node');

/**
 * Curator node function
 * Curates and enriches content for each topic
 */
export const curatorNode: NodeFunction = async (
  state: LangGraphPipelineState
): Promise<Partial<LangGraphPipelineState>> => {
  logger.info('Curator node starting', {
    executionId: state.executionId,
    topicsCount: state.topics.length,
  });

  try {
    // TODO: Integrate with actual CuradorAgent when available
    // For now, generate placeholder curated content

    const curatedContent = state.topics.map((topic, index) => ({
      id: `curated-${Date.now()}-${index}`,
      originalTrend: state.trends[0]!,
      title: topic.title,
      summary: topic.description,
      relevanceScore: 85 + Math.random() * 15, // 85-100
      categories: ['technology', 'programming'],
      tags: ['tech', 'coding', 'development'],
      sourceId: 'devto',
      curatedAt: new Date(),
      metadata: {
        wordCount: 500,
        readingTime: 3,
        language: 'en',
      },
    }));

    logger.info('Curator node completed', {
      executionId: state.executionId,
      curatedCount: curatedContent.length,
    });

    return {
      curatedContent,
      currentNode: NODE_NAMES.CURATOR,
    };
  } catch (error) {
    logger.error('Curator node failed', {
      executionId: state.executionId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};
