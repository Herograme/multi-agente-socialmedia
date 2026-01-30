import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import {
  getAssetsRepository,
  type AssetRecord,
  type AssetDbType,
} from '../../repositories/assets.repository';
import { PostRepository } from '../../database/repositories/post-repository';
import { getDatabase } from '../../database/connection';
import { PostStatus } from '../../database/types';

/**
 * Asset response format (Story 3.7)
 */
interface AssetResponse {
  id: string;
  type: string;
  path: string;
  filename: string;
  size: number;
  mimeType: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * Error response format (Story 3.7)
 */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    timestamp: string;
    details?: Record<string, unknown>;
  };
}

export async function postsRoutes(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  // Get repositories
  const assetsRepo = getAssetsRepository();
  const db = getDatabase();
  const postRepo = new PostRepository(db);

  // Get all posts (using database)
  fastify.get('/api/posts', async (request, _reply) => {
    const { page = 1, limit = 10, status } = request.query as {
      page?: number;
      limit?: number;
      status?: string;
    };

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    let posts;
    let total;

    if (status && Object.values(PostStatus).includes(status as PostStatus)) {
      posts = postRepo.findByStatus(status as PostStatus);
      total = posts.length;
      posts = posts.slice(offset, offset + limitNum);
    } else {
      posts = postRepo.findAll({ limit: limitNum, offset });
      total = postRepo.count();
    }

    // Map to frontend expected format
    const mappedPosts = posts.map(post => ({
      id: post.id,
      executionId: post.execution_id,
      topicId: post.topic,
      textInstagram: post.text_ig,
      textLinkedin: post.text_linkedin,
      status: post.status,
      rejectionReason: post.rejection_reason,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
    }));

    return {
      posts: mappedPosts,
      total,
      page: pageNum,
      limit: limitNum,
    };
  });

  // Get single post with assets
  fastify.get<{ Params: { id: string } }>('/api/posts/:id', async (request, reply) => {
    const { id } = request.params;

    const post = postRepo.findWithAssets(id);
    if (!post) {
      return reply.status(404).send({ error: 'Post not found' });
    }

    // Map to frontend expected format
    const mappedPost = {
      id: post.id,
      executionId: post.execution_id,
      topicId: post.topic,
      textInstagram: post.text_ig,
      textLinkedin: post.text_linkedin,
      status: post.status,
      rejectionReason: post.rejection_reason,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
    };

    const assets = {
      carousel: post.assets?.filter(a => a.type === 'carousel') || [],
      pdf: post.assets?.find(a => a.type === 'pdf') || null,
    };

    return {
      post: mappedPost,
      assets,
    };
  });

  // Update post status
  fastify.patch<{ Params: { id: string }; Body: { status: 'approved' | 'rejected' } }>(
    '/api/posts/:id/status',
    async (request, reply) => {
      const { id } = request.params;
      const { status } = request.body;

      const post = postRepo.findById(id);
      if (!post) {
        return reply.status(404).send({ error: 'Post not found' });
      }

      const dbStatus = status === 'approved' ? PostStatus.APPROVED : PostStatus.REJECTED;
      const updated = postRepo.update(id, { status: dbStatus });

      if (!updated) {
        return reply.status(500).send({ error: 'Failed to update post' });
      }

      return {
        id: updated.id,
        executionId: updated.execution_id,
        topicId: updated.topic,
        textInstagram: updated.text_ig,
        textLinkedin: updated.text_linkedin,
        status: updated.status,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      };
    }
  );

  // Get asset file
  fastify.get<{ Params: { id: string } }>('/api/assets/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      const asset = await assetsRepo.findById(id);
      if (!asset) {
        return reply.status(404).send({ error: 'Asset not found' });
      }

      // Set appropriate content type based on asset type
      const contentType = asset.mimeType || 'application/octet-stream';
      reply.header('Content-Type', contentType);
      reply.header('Content-Length', asset.size);

      // In production, serve actual file from asset.path
      return reply.send(Buffer.alloc(0)); // Placeholder
    } catch {
      return reply.status(404).send({ error: 'Asset not found' });
    }
  });

  // Get asset thumbnail
  fastify.get<{ Params: { id: string } }>(
    '/api/assets/:id/thumbnail',
    async (_request, reply) => {
      // In production, generate/serve actual thumbnail
      reply.header('Content-Type', 'image/png');
      return reply.send(Buffer.alloc(0)); // Placeholder
    }
  );

  // Download carousel as ZIP
  fastify.get<{ Params: { id: string } }>(
    '/api/posts/:id/carousel/zip',
    async (request, reply) => {
      const { id } = request.params;

      const post = postRepo.findById(id);
      if (!post) {
        return reply.status(404).send({ error: 'Post not found' });
      }

      const assets = await assetsRepo.findByPostIdAndType(id, 'carousel');
      if (!assets || assets.length === 0) {
        return reply.status(404).send({ error: 'No carousel assets found' });
      }

      // Set response headers for ZIP download
      reply.header('Content-Type', 'application/zip');
      reply.header(
        'Content-Disposition',
        `attachment; filename="carousel-${id}.zip"`
      );

      // Placeholder response - minimal valid ZIP file
      const minimalZip = Buffer.from([
        0x50, 0x4b, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      ]);

      return reply.send(minimalZip);
    }
  );

  // ============================================
  // Assets Repository Routes (Story 3.7)
  // ============================================

  /**
   * GET /api/posts/:id/assets
   * Get all assets for a specific post from repository
   */
  fastify.get<{
    Params: { id: string };
    Querystring: { type?: AssetDbType; limit?: number; offset?: number };
  }>('/api/posts/:id/assets', async (
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: { type?: AssetDbType; limit?: number; offset?: number };
    }>,
    reply: FastifyReply
  ) => {
    const { id } = request.params;
    const { type } = request.query;
    const limit = Number(request.query.limit) || 100;
    const offset = Number(request.query.offset) || 0;

    request.log.debug({ postId: id, type, limit, offset }, 'Fetching post assets');

    try {
      let assets: AssetRecord[];

      if (type) {
        assets = await assetsRepo.findByPostIdAndType(id, type);
      } else {
        assets = await assetsRepo.findByPostId(id);
      }

      // Apply pagination
      const total = assets.length;
      const paginatedAssets = assets.slice(offset, offset + limit);

      // Map to response format
      const assetResponses: AssetResponse[] = paginatedAssets.map((asset) => ({
        id: asset.id,
        type: asset.type,
        path: asset.path,
        filename: asset.filename,
        size: asset.size,
        mimeType: asset.mimeType,
        createdAt: asset.createdAt.toISOString(),
        metadata: asset.metadata ? JSON.parse(asset.metadata) : undefined,
      }));

      return reply.status(200).send({
        postId: id,
        assets: assetResponses,
        total,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      request.log.error({ error: errorMessage }, 'Failed to fetch post assets');

      return reply.status(500).send({
        error: {
          code: 'ASSETS_FETCH_ERROR',
          message: `Failed to fetch assets: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        },
      } satisfies ErrorResponse);
    }
  });

  /**
   * DELETE /api/posts/:id/assets
   * Delete all assets for a specific post
   */
  fastify.delete<{
    Params: { id: string };
  }>('/api/posts/:id/assets', async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const { id } = request.params;

    request.log.info({ postId: id }, 'Deleting post assets');

    try {
      const deletedCount = await assetsRepo.deleteByPostId(id);

      return reply.status(200).send({
        success: true,
        deletedCount,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      request.log.error({ error: errorMessage }, 'Failed to delete post assets');

      return reply.status(500).send({
        error: {
          code: 'ASSETS_DELETE_ERROR',
          message: `Failed to delete assets: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        },
      } satisfies ErrorResponse);
    }
  });

  /**
   * GET /api/posts/:id/assets/:assetId
   * Get a specific asset by ID
   */
  fastify.get<{
    Params: { id: string; assetId: string };
  }>('/api/posts/:id/assets/:assetId', async (
    request: FastifyRequest<{ Params: { id: string; assetId: string } }>,
    reply: FastifyReply
  ) => {
    const { id: postId, assetId } = request.params;

    request.log.debug({ postId, assetId }, 'Fetching specific asset');

    try {
      const asset = await assetsRepo.findById(assetId);

      if (!asset) {
        return reply.status(404).send({
          error: {
            code: 'ASSET_NOT_FOUND',
            message: `Asset not found: ${assetId}`,
            timestamp: new Date().toISOString(),
          },
        } satisfies ErrorResponse);
      }

      // Verify the asset belongs to the correct post
      if (asset.postId !== postId) {
        return reply.status(404).send({
          error: {
            code: 'ASSET_NOT_FOUND',
            message: `Asset not found for post: ${postId}`,
            timestamp: new Date().toISOString(),
          },
        } satisfies ErrorResponse);
      }

      return reply.status(200).send({
        id: asset.id,
        type: asset.type,
        path: asset.path,
        filename: asset.filename,
        size: asset.size,
        mimeType: asset.mimeType,
        createdAt: asset.createdAt.toISOString(),
        metadata: asset.metadata ? JSON.parse(asset.metadata) : undefined,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      request.log.error({ error: errorMessage }, 'Failed to fetch asset');

      return reply.status(500).send({
        error: {
          code: 'ASSET_FETCH_ERROR',
          message: `Failed to fetch asset: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        },
      } satisfies ErrorResponse);
    }
  });
}
