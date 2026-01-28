/**
 * QA Analyst Node
 * Node wrapper for the QA agent in the LangGraph pipeline
 */

import { createLogger } from '@social-content/shared';
import type { LangGraphPipelineState, NodeFunction, QAResult } from '../types';
import { NODE_NAMES } from '../config';

const logger = createLogger('langgraph:qa-node');

/**
 * QA Analyst node function
 * Analyzes and scores generated posts for quality assurance
 */
export const qaAnalystNode: NodeFunction = async (
  state: LangGraphPipelineState
): Promise<Partial<LangGraphPipelineState>> => {
  logger.info('QA Analyst node starting', {
    executionId: state.executionId,
    postsCount: state.posts.length,
    qualityThreshold: state.config.qualityThreshold,
  });

  try {
    // TODO: Integrate with actual QAAgent when available
    // For now, generate placeholder QA results

    const qaResults: QAResult[] = state.posts.map((post) => {
      // Generate random scores for testing
      const contentScore = 6 + Math.random() * 4; // 6-10
      const engagementScore = 6 + Math.random() * 4;
      const technicalScore = 6 + Math.random() * 4;
      const hashtagScore = 6 + Math.random() * 4;

      const overallScore =
        (contentScore * 0.4 +
          engagementScore * 0.3 +
          technicalScore * 0.2 +
          hashtagScore * 0.1);

      return {
        postId: post.id,
        overallScore: Math.round(overallScore * 10) / 10,
        approved: overallScore >= state.config.qualityThreshold,
        criteriaScores: [
          {
            name: 'Content Quality',
            score: Math.round(contentScore * 10) / 10,
            weight: 0.4,
            feedback: 'Content is well-structured and informative',
          },
          {
            name: 'Engagement Potential',
            score: Math.round(engagementScore * 10) / 10,
            weight: 0.3,
            feedback: 'Good engagement hooks and call-to-action',
          },
          {
            name: 'Technical Accuracy',
            score: Math.round(technicalScore * 10) / 10,
            weight: 0.2,
            feedback: 'Technical content is accurate',
          },
          {
            name: 'Hashtag Relevance',
            score: Math.round(hashtagScore * 10) / 10,
            weight: 0.1,
            feedback: 'Hashtags are relevant and not excessive',
          },
        ],
        feedback: overallScore >= state.config.qualityThreshold
          ? 'Post meets quality standards and is approved for publishing'
          : 'Post needs improvement before publishing',
        suggestions: overallScore < state.config.qualityThreshold
          ? [
              'Consider adding more specific examples',
              'Improve the opening hook',
              'Add a stronger call-to-action',
            ]
          : [],
        analyzedAt: new Date(),
      };
    });

    const approvedCount = qaResults.filter((r) => r.approved).length;

    logger.info('QA Analyst node completed', {
      executionId: state.executionId,
      analyzed: qaResults.length,
      approved: approvedCount,
      rejected: qaResults.length - approvedCount,
    });

    return {
      qaResults,
      currentNode: NODE_NAMES.QA_ANALYST,
    };
  } catch (error) {
    logger.error('QA Analyst node failed', {
      executionId: state.executionId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};
