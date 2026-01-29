/**
 * Pipeline Results Service
 * Story 4.7 - Pipeline Completo End-to-End
 *
 * Service for persisting pipeline execution results to database
 */

import { createLogger } from '@social-content/shared';
import type { FullPipelineOutput, GeneratedPost } from '@social-content/agents';
import {
  getPostsRepository,
  type PostCreateInput,
  type IPostsRepository,
} from '../repositories/posts.repository';
import {
  getAssetsRepository,
  type AssetCreateInput,
  type IAssetsRepository,
} from '../repositories/assets.repository';
import {
  getScoresRepository,
  type ScoreCreateInput,
  type IScoresRepository,
} from '../repositories/scores.repository';

const logger = createLogger('service:pipeline-results');

/**
 * Pipeline Results Service
 * Handles persistence of generated posts, assets, and scores
 */
export class PipelineResultsService {
  private postsRepo: IPostsRepository;
  private assetsRepo: IAssetsRepository;
  private scoresRepo: IScoresRepository;

  constructor(
    postsRepo?: IPostsRepository,
    assetsRepo?: IAssetsRepository,
    scoresRepo?: IScoresRepository
  ) {
    this.postsRepo = postsRepo ?? getPostsRepository();
    this.assetsRepo = assetsRepo ?? getAssetsRepository();
    this.scoresRepo = scoresRepo ?? getScoresRepository();
  }

  /**
   * Save all results from a pipeline execution
   */
  async saveResults(executionId: string, result: FullPipelineOutput): Promise<SaveResultsSummary> {
    logger.info('Saving pipeline results', {
      executionId,
      postCount: result.posts.length,
    });

    const summary: SaveResultsSummary = {
      postsSaved: 0,
      assetsSaved: 0,
      scoresSaved: 0,
      errors: [],
    };

    for (const post of result.posts) {
      try {
        // Save post
        await this.savePost(executionId, post);
        summary.postsSaved++;

        // Save assets
        const assetCount = await this.saveAssets(post);
        summary.assetsSaved += assetCount;

        // Save score
        await this.saveScore(post);
        summary.scoresSaved++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error saving post', {
          executionId,
          postId: post.id,
          error: errorMsg,
        });
        summary.errors.push({
          postId: post.id,
          error: errorMsg,
        });
      }
    }

    logger.info('Pipeline results saved', {
      executionId,
      ...summary,
    });

    return summary;
  }

  /**
   * Save a single post
   */
  private async savePost(executionId: string, post: GeneratedPost): Promise<void> {
    const postInput: PostCreateInput = {
      id: post.id,
      executionId,
      topic: post.topic,
      textInstagram: post.textInstagram,
      textLinkedin: post.textLinkedin,
      status: post.status,
      metadata: JSON.stringify({
        qaFeedback: post.qaFeedback,
        score: post.score,
      }),
    };

    await this.postsRepo.create(postInput);
    logger.debug('Saved post', { postId: post.id, executionId });
  }

  /**
   * Save assets for a post
   */
  private async saveAssets(post: GeneratedPost): Promise<number> {
    let count = 0;

    // Save background image
    if (post.assets.backgroundPath) {
      const assetInput: AssetCreateInput = {
        postId: post.id,
        type: 'image',
        path: post.assets.backgroundPath,
        filename: post.assets.backgroundPath.split('/').pop() ?? 'background.png',
        size: 0, // Size would be filled by file service
        mimeType: 'image/png',
        metadata: JSON.stringify({ assetType: 'background' }),
      };
      await this.assetsRepo.create(assetInput);
      count++;
    }

    // Save carousel slides
    if (post.assets.carouselPaths) {
      for (let i = 0; i < post.assets.carouselPaths.length; i++) {
        const slidePath = post.assets.carouselPaths[i]!;
        const assetInput: AssetCreateInput = {
          postId: post.id,
          type: 'carousel',
          path: slidePath,
          filename: slidePath.split('/').pop() ?? `slide-${i + 1}.png`,
          size: 0,
          mimeType: 'image/png',
          metadata: JSON.stringify({ slideIndex: i }),
        };
        await this.assetsRepo.create(assetInput);
        count++;
      }
    }

    // Save PDF
    if (post.assets.pdfPath) {
      const assetInput: AssetCreateInput = {
        postId: post.id,
        type: 'pdf',
        path: post.assets.pdfPath,
        filename: post.assets.pdfPath.split('/').pop() ?? 'carousel.pdf',
        size: 0,
        mimeType: 'application/pdf',
      };
      await this.assetsRepo.create(assetInput);
      count++;
    }

    logger.debug('Saved assets', { postId: post.id, count });
    return count;
  }

  /**
   * Save score for a post
   */
  private async saveScore(post: GeneratedPost): Promise<void> {
    const scoreInput: ScoreCreateInput = {
      id: `${post.id}-score`,
      postId: post.id,
      overallScore: post.score,
      criteriaBreakdown: JSON.stringify({
        feedback: post.qaFeedback ?? [],
        status: post.status,
      }),
    };

    await this.scoresRepo.create(scoreInput);
    logger.debug('Saved score', { postId: post.id, score: post.score });
  }

  /**
   * Get posts for an execution
   */
  async getPostsByExecution(executionId: string): Promise<GeneratedPost[]> {
    const posts = await this.postsRepo.findByExecutionId(executionId);
    const result: GeneratedPost[] = [];

    for (const post of posts) {
      const assets = await this.assetsRepo.findByPostId(post.id);
      const score = await this.scoresRepo.findByPostId(post.id);

      // Parse metadata
      let qaFeedback: string[] = [];
      if (post.metadata) {
        try {
          const metadata = JSON.parse(post.metadata);
          qaFeedback = metadata.qaFeedback ?? [];
        } catch {
          // Ignore parse errors
        }
      }

      // Build assets object
      const postAssets: GeneratedPost['assets'] = {};
      for (const asset of assets) {
        if (asset.type === 'image') {
          postAssets.backgroundPath = asset.path;
        } else if (asset.type === 'carousel') {
          if (!postAssets.carouselPaths) {
            postAssets.carouselPaths = [];
          }
          postAssets.carouselPaths.push(asset.path);
        } else if (asset.type === 'pdf') {
          postAssets.pdfPath = asset.path;
        }
      }

      result.push({
        id: post.id,
        topic: post.topic,
        textInstagram: post.textInstagram,
        textLinkedin: post.textLinkedin,
        score: score?.overallScore ?? 0,
        status: post.status,
        assets: postAssets,
        qaFeedback,
      });
    }

    return result;
  }

  /**
   * Delete all results for an execution
   */
  async deleteByExecution(executionId: string): Promise<DeleteResultsSummary> {
    const posts = await this.postsRepo.findByExecutionId(executionId);
    const summary: DeleteResultsSummary = {
      postsDeleted: 0,
      assetsDeleted: 0,
      scoresDeleted: 0,
    };

    for (const post of posts) {
      // Delete assets
      summary.assetsDeleted += await this.assetsRepo.deleteByPostId(post.id);

      // Delete score
      if (await this.scoresRepo.deleteByPostId(post.id)) {
        summary.scoresDeleted++;
      }
    }

    // Delete posts
    summary.postsDeleted = await this.postsRepo.deleteByExecutionId(executionId);

    logger.info('Deleted pipeline results', {
      executionId,
      ...summary,
    });

    return summary;
  }
}

/**
 * Summary of save operation
 */
export interface SaveResultsSummary {
  postsSaved: number;
  assetsSaved: number;
  scoresSaved: number;
  errors: Array<{ postId: string; error: string }>;
}

/**
 * Summary of delete operation
 */
export interface DeleteResultsSummary {
  postsDeleted: number;
  assetsDeleted: number;
  scoresDeleted: number;
}

// Singleton instance
let instance: PipelineResultsService | null = null;

/**
 * Get the pipeline results service singleton
 */
export function getPipelineResultsService(): PipelineResultsService {
  if (!instance) {
    instance = new PipelineResultsService();
  }
  return instance;
}

/**
 * Create a new pipeline results service instance (for testing)
 */
export function createPipelineResultsService(
  postsRepo?: IPostsRepository,
  assetsRepo?: IAssetsRepository,
  scoresRepo?: IScoresRepository
): PipelineResultsService {
  return new PipelineResultsService(postsRepo, assetsRepo, scoresRepo);
}

/**
 * Set the pipeline results service instance (for dependency injection)
 */
export function setPipelineResultsService(service: PipelineResultsService): void {
  instance = service;
}
