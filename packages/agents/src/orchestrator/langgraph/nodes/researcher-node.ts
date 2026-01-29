/**
 * Researcher Node
 * Node wrapper for the Researcher agent in the LangGraph pipeline
 */

import { createLogger } from '@social-content/shared';
import type { LangGraphPipelineState, NodeFunction } from '../types';
import { NODE_NAMES } from '../config';

const logger = createLogger('langgraph:researcher-node');

/**
 * Researcher node function
 * Discovers trends from configured sources (DevTo, HackerNews, Reddit)
 */
export const researcherNode: NodeFunction = async (
  state: LangGraphPipelineState
): Promise<Partial<LangGraphPipelineState>> => {
  logger.info('Researcher node starting', {
    executionId: state.executionId,
    config: {
      platforms: state.config.platforms,
      numPosts: state.config.numPosts,
    },
  });

  try {
    // TODO: Integrate with actual ResearcherAgent when available
    // For now, return placeholder data for testing the graph structure
    // const researcher = createResearcherAgent();
    // const result = await researcher.run({
    //   sources: ['devto', 'hackernews', 'reddit'],
    //   maxResults: 50
    // });

    // Placeholder trends for graph structure testing
    const trends = [
      {
        id: `trend-${Date.now()}-1`,
        title: 'Sample Trend 1',
        description: 'This is a placeholder trend for pipeline testing',
        source: 'devto',
        url: 'https://dev.to/sample',
        discoveredAt: new Date(),
      },
      {
        id: `trend-${Date.now()}-2`,
        title: 'Sample Trend 2',
        description: 'Another placeholder trend for pipeline testing',
        source: 'hackernews',
        url: 'https://news.ycombinator.com/sample',
        discoveredAt: new Date(),
      },
    ];

    logger.info('Researcher node completed', {
      executionId: state.executionId,
      trendsFound: trends.length,
    });

    return {
      trends,
      currentNode: NODE_NAMES.RESEARCHER,
    };
  } catch (error) {
    logger.error('Researcher node failed', {
      executionId: state.executionId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};
