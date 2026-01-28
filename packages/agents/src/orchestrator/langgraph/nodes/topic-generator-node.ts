/**
 * Topic Generator Node
 * Node wrapper for topic generation from trends in the LangGraph pipeline
 */

import { createLogger } from '@social-content/shared';
import type { LangGraphPipelineState, NodeFunction } from '../types';
import { NODE_NAMES } from '../config';

const logger = createLogger('langgraph:topic-generator-node');

/**
 * Topic generator node function
 * Analyzes trends and generates engaging topic suggestions
 */
export const topicGeneratorNode: NodeFunction = async (
  state: LangGraphPipelineState
): Promise<Partial<LangGraphPipelineState>> => {
  logger.info('Topic Generator node starting', {
    executionId: state.executionId,
    trendsCount: state.trends.length,
  });

  try {
    // TODO: Integrate with actual TopicGenerator agent when available
    // For now, generate placeholder topics from trends

    const topics = state.trends.slice(0, state.config.numPosts).map((trend, index) => ({
      id: `topic-${Date.now()}-${index}`,
      title: `Topic: ${trend.title}`,
      description: `Generated topic based on trend: ${trend.description || trend.title}`,
      engagementPotential: 7 + Math.random() * 3, // Random 7-10
      basedOnTrends: [trend.id],
    }));

    logger.info('Topic Generator node completed', {
      executionId: state.executionId,
      topicsGenerated: topics.length,
    });

    return {
      topics,
      currentNode: NODE_NAMES.TOPIC_GENERATOR,
    };
  } catch (error) {
    logger.error('Topic Generator node failed', {
      executionId: state.executionId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};
