import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import {
  getAssetsRepository,
  type AssetRecord,
  type AssetDbType,
} from '../../repositories/assets.repository';

// Types for mock data
type PostStatus = 'pending' | 'approved' | 'rejected';

interface MockPost {
  id: string;
  executionId: string;
  topicId: string;
  textInstagram: string;
  textLinkedin: string;
  status: PostStatus;
  createdAt: Date;
  assets: unknown[];
  score: {
    id: string;
    postId: string;
    overallScore: number;
    criteriaBreakdown: Array<{
      name: string;
      score: number;
      weight: number;
    }>;
    feedback: string;
    approved: boolean;
    createdAt: Date;
  };
}

// Mock data for development - in production this would come from a database
const mockPosts = new Map<string, MockPost>([
  [
    'post-001',
    {
      id: 'post-001',
      executionId: 'exec-001',
      topicId: 'topic-001',
      textInstagram:
        'Voce sabia que TypeScript 5.4 traz novos recursos incriveis? Confira o carrossel para aprender mais sobre NoInfer e outras novidades! #TypeScript #JavaScript #Dev',
      textLinkedin:
        'TypeScript 5.4 acabou de ser lancado com recursos que vao transformar sua experiencia de desenvolvimento.\n\nDestaque para o NoInfer utility type que resolve problemas comuns de inferencia de tipos.\n\nDeslize para ver os principais recursos.',
      status: 'pending',
      createdAt: new Date('2026-01-28T10:00:00Z'),
      assets: [],
      score: {
        id: 'score-001',
        postId: 'post-001',
        overallScore: 85,
        criteriaBreakdown: [
          { name: 'Relevancia', score: 90, weight: 0.3 },
          { name: 'Clareza', score: 85, weight: 0.25 },
          { name: 'Engajamento', score: 80, weight: 0.25 },
          { name: 'Formatacao', score: 85, weight: 0.2 },
        ],
        feedback: 'Conteudo relevante e bem estruturado. Considere adicionar mais emojis para aumentar engajamento.',
        approved: true,
        createdAt: new Date('2026-01-28T10:05:00Z'),
      },
    },
  ],
]);

// Mock assets for development
const mockAssets = new Map([
  [
    'post-001',
    {
      carousel: [
        {
          id: 'asset-001',
          postId: 'post-001',
          type: 'carousel_slide' as const,
          path: '/assets/post-001/slide-1.png',
          sizeBytes: 102400,
          createdAt: new Date('2026-01-28T10:02:00Z'),
        },
        {
          id: 'asset-002',
          postId: 'post-001',
          type: 'carousel_slide' as const,
          path: '/assets/post-001/slide-2.png',
          sizeBytes: 98304,
          createdAt: new Date('2026-01-28T10:02:00Z'),
        },
        {
          id: 'asset-003',
          postId: 'post-001',
          type: 'carousel_slide' as const,
          path: '/assets/post-001/slide-3.png',
          sizeBytes: 110592,
          createdAt: new Date('2026-01-28T10:02:00Z'),
        },
      ],
      pdf: {
        id: 'asset-pdf-001',
        postId: 'post-001',
        type: 'pdf' as const,
        path: '/assets/post-001/document.pdf',
        sizeBytes: 524288,
        createdAt: new Date('2026-01-28T10:03:00Z'),
      },
    },
  ],
]);

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
  // Get the assets repository (Story 3.7)
  const assetsRepo = getAssetsRepository();

  // Get all posts
  fastify.get('/api/posts', async (request, _reply) => {
    const { page = 1, limit = 10, status } = request.query as {
      page?: number;
      limit?: number;
      status?: string;
    };

    let posts = Array.from(mockPosts.values());

    // Filter by status if provided
    if (status) {
      posts = posts.filter((p) => p.status === status);
    }

    // Pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedPosts = posts.slice(startIndex, endIndex);

    return {
      posts: paginatedPosts,
      total: posts.length,
      page: Number(page),
      limit: Number(limit),
    };
  });

  // Get single post with assets
  fastify.get<{ Params: { id: string } }>('/api/posts/:id', async (request, reply) => {
    const { id } = request.params;

    const post = mockPosts.get(id);
    if (!post) {
      return reply.status(404).send({ error: 'Post not found' });
    }

    const assets = mockAssets.get(id) || { carousel: [], pdf: null };

    return {
      post,
      assets,
    };
  });

  // Update post status
  fastify.patch<{ Params: { id: string }; Body: { status: 'approved' | 'rejected' } }>(
    '/api/posts/:id/status',
    async (request, reply) => {
      const { id } = request.params;
      const { status } = request.body;

      const post = mockPosts.get(id);
      if (!post) {
        return reply.status(404).send({ error: 'Post not found' });
      }

      // Update mock data
      post.status = status;
      mockPosts.set(id, post);

      return post;
    }
  );

  // Get asset file
  fastify.get<{ Params: { id: string } }>('/api/assets/:id', async (request, reply) => {
    const { id } = request.params;

    // Find asset across all posts (postId not used for mock data)
    for (const assets of mockAssets.values()) {
      // Check carousel assets
      const carouselAsset = assets.carousel.find((a) => a.id === id);
      if (carouselAsset) {
        // In production, serve actual file
        // For now, return a placeholder response
        reply.header('Content-Type', 'image/png');
        reply.header('Content-Length', carouselAsset.sizeBytes);
        return reply.send(Buffer.alloc(0)); // Placeholder
      }

      // Check PDF asset
      if (assets.pdf?.id === id) {
        reply.header('Content-Type', 'application/pdf');
        reply.header('Content-Length', assets.pdf.sizeBytes);
        return reply.send(Buffer.alloc(0)); // Placeholder
      }
    }

    return reply.status(404).send({ error: 'Asset not found' });
  });

  // Get asset thumbnail
  fastify.get<{ Params: { id: string } }>(
    '/api/assets/:id/thumbnail',
    async (_request, reply) => {
      // In production, generate/serve actual thumbnail based on _request.params.id
      reply.header('Content-Type', 'image/png');
      return reply.send(Buffer.alloc(0)); // Placeholder
    }
  );

  // Download carousel as ZIP
  fastify.get<{ Params: { id: string } }>(
    '/api/posts/:id/carousel/zip',
    async (request, reply) => {
      const { id } = request.params;

      const post = mockPosts.get(id);
      if (!post) {
        return reply.status(404).send({ error: 'Post not found' });
      }

      const assets = mockAssets.get(id);
      if (!assets?.carousel || assets.carousel.length === 0) {
        return reply.status(404).send({ error: 'No carousel assets found' });
      }

      // Set response headers for ZIP download
      reply.header('Content-Type', 'application/zip');
      reply.header(
        'Content-Disposition',
        `attachment; filename="carousel-${id}.zip"`
      );

      // In production, create actual ZIP file using archiver
      // For now, return a placeholder that indicates the endpoint works
      // The actual ZIP generation would look like:
      //
      // const archive = archiver('zip', { zlib: { level: 9 } });
      // archive.pipe(reply.raw);
      //
      // for (let i = 0; i < carouselAssets.length; i++) {
      //   const asset = carouselAssets[i];
      //   const filePath = path.join(process.cwd(), asset.path);
      //   archive.append(createReadStream(filePath), { name: `slide-${i + 1}.png` });
      // }
      //
      // await archive.finalize();

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
