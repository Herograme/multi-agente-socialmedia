/**
 * Writer Node
 * Node wrapper for the Writer agent in the LangGraph pipeline
 */

import { createLogger } from '@social-content/shared';
import type { LangGraphPipelineState, NodeFunction, WriterOutput } from '../types';
import { NODE_NAMES } from '../config';

const logger = createLogger('langgraph:writer-node');

/**
 * Writer node function
 * Generates social media posts from curated content
 */
export const writerNode: NodeFunction = async (
  state: LangGraphPipelineState
): Promise<Partial<LangGraphPipelineState>> => {
  logger.info('Writer node starting', {
    executionId: state.executionId,
    curatedContentCount: state.curatedContent.length,
    platforms: state.config.platforms,
  });

  try {
    // TODO: Integrate with actual WriterAgent when available
    // For now, generate placeholder posts

    const posts: WriterOutput[] = state.curatedContent.map((content, index) => ({
      id: `post-${Date.now()}-${index}`,
      topicId: state.topics[index]?.id || '',
      textInstagram: state.config.platforms.includes('instagram')
        ? `Instagram Post: ${content.title}\n\n${content.summary}\n\n#tech #coding #development`
        : undefined,
      textLinkedIn: state.config.platforms.includes('linkedin')
        ? `LinkedIn Post: ${content.title}\n\n${content.summary}\n\nShare your thoughts in the comments!`
        : undefined,
      hashtags: ['tech', 'coding', 'development', 'programming'],
      codeSnippets: [
        {
          language: 'typescript',
          code: '// Example code snippet\nconst hello = "world";\nconsole.log(hello);',
          description: 'Sample TypeScript code',
        },
      ],
      createdAt: new Date(),
    }));

    logger.info('Writer node completed', {
      executionId: state.executionId,
      postsGenerated: posts.length,
    });

    return {
      posts,
      currentNode: NODE_NAMES.WRITER,
    };
  } catch (error) {
    logger.error('Writer node failed', {
      executionId: state.executionId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};
