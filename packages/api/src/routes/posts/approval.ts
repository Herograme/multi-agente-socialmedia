/**
 * Post Approval Routes
 * Story 5.5 - Fluxo de Aprovacao de Posts
 *
 * API endpoints for approving, rejecting, and regenerating posts.
 */

import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { PostRepository } from '../../database/repositories/post-repository';
import { getDatabase } from '../../database/connection';
import { PostStatus } from '../../database/types';

/**
 * Request body for rejecting a post
 */
interface RejectBody {
  reason?: string;
}

/**
 * Request body for bulk approve
 */
interface BulkApproveBody {
  postIds: string[];
}

/**
 * Request body for bulk reject
 */
interface BulkRejectBody {
  postIds: string[];
  reason?: string;
}

/**
 * Error response format
 */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    timestamp: string;
  };
}

/**
 * Creates an error response object
 */
function createErrorResponse(code: string, message: string): ErrorResponse {
  return {
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Post Approval Routes Plugin
 */
export async function approvalRoutes(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
): Promise<void> {
  const db = getDatabase();
  const postRepo = new PostRepository(db);

  /**
   * POST /api/posts/:id/approve
   * Approve a single post
   */
  fastify.post<{ Params: { id: string } }>(
    '/api/posts/:id/approve',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;

      request.log.info({ postId: id }, 'Approving post');

      try {
        const post = postRepo.findById(id);

        if (!post) {
          return reply.status(404).send(
            createErrorResponse('NOT_FOUND', 'Post not found')
          );
        }

        if (post.status !== PostStatus.PENDING && post.status !== PostStatus.NEEDS_REVIEW) {
          return reply.status(400).send(
            createErrorResponse(
              'INVALID_STATUS',
              `Cannot approve post with status: ${post.status}. Only pending or needs_review posts can be approved.`
            )
          );
        }

        const updated = postRepo.approve(id);

        if (!updated) {
          return reply.status(500).send(
            createErrorResponse('UPDATE_FAILED', 'Failed to approve post')
          );
        }

        return reply.status(200).send({
          success: true,
          status: 'approved',
          post: updated,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        request.log.error({ error: errorMessage }, 'Failed to approve post');

        return reply.status(500).send(
          createErrorResponse('APPROVE_FAILED', `Failed to approve post: ${errorMessage}`)
        );
      }
    }
  );

  /**
   * POST /api/posts/:id/reject
   * Reject a single post with optional reason
   */
  fastify.post<{ Params: { id: string }; Body: RejectBody }>(
    '/api/posts/:id/reject',
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: RejectBody }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const { reason } = request.body || {};

      request.log.info({ postId: id, reason }, 'Rejecting post');

      try {
        const post = postRepo.findById(id);

        if (!post) {
          return reply.status(404).send(
            createErrorResponse('NOT_FOUND', 'Post not found')
          );
        }

        if (post.status !== PostStatus.PENDING && post.status !== PostStatus.NEEDS_REVIEW) {
          return reply.status(400).send(
            createErrorResponse(
              'INVALID_STATUS',
              `Cannot reject post with status: ${post.status}. Only pending or needs_review posts can be rejected.`
            )
          );
        }

        const updated = postRepo.reject(id, reason);

        if (!updated) {
          return reply.status(500).send(
            createErrorResponse('UPDATE_FAILED', 'Failed to reject post')
          );
        }

        return reply.status(200).send({
          success: true,
          status: 'rejected',
          post: updated,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        request.log.error({ error: errorMessage }, 'Failed to reject post');

        return reply.status(500).send(
          createErrorResponse('REJECT_FAILED', `Failed to reject post: ${errorMessage}`)
        );
      }
    }
  );

  /**
   * POST /api/posts/:id/regenerate
   * Queue regeneration of a rejected post
   */
  fastify.post<{ Params: { id: string } }>(
    '/api/posts/:id/regenerate',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;

      request.log.info({ postId: id }, 'Regenerating post');

      try {
        const post = postRepo.findById(id);

        if (!post) {
          return reply.status(404).send(
            createErrorResponse('NOT_FOUND', 'Post not found')
          );
        }

        if (post.status !== PostStatus.REJECTED) {
          return reply.status(400).send(
            createErrorResponse(
              'INVALID_STATUS',
              `Cannot regenerate post with status: ${post.status}. Only rejected posts can be regenerated.`
            )
          );
        }

        // Reset the post status to pending for regeneration
        const updated = postRepo.resetForRegeneration(id);

        if (!updated) {
          return reply.status(500).send(
            createErrorResponse('UPDATE_FAILED', 'Failed to queue post for regeneration')
          );
        }

        // TODO: Trigger actual regeneration via orchestrator/pipeline
        // For now, we just reset the status to pending
        // await orchestrator.regeneratePost(id);

        return reply.status(202).send({
          success: true,
          message: 'Regeneration queued',
          post: updated,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        request.log.error({ error: errorMessage }, 'Failed to regenerate post');

        return reply.status(500).send(
          createErrorResponse('REGENERATE_FAILED', `Failed to regenerate post: ${errorMessage}`)
        );
      }
    }
  );

  /**
   * POST /api/posts/bulk-approve
   * Approve multiple posts at once
   */
  fastify.post<{ Body: BulkApproveBody }>(
    '/api/posts/bulk-approve',
    async (
      request: FastifyRequest<{ Body: BulkApproveBody }>,
      reply: FastifyReply
    ) => {
      const { postIds } = request.body || { postIds: [] };

      if (!Array.isArray(postIds) || postIds.length === 0) {
        return reply.status(400).send(
          createErrorResponse('INVALID_REQUEST', 'postIds must be a non-empty array')
        );
      }

      request.log.info({ count: postIds.length }, 'Bulk approving posts');

      try {
        const results = postRepo.bulkApprove(postIds);

        return reply.status(200).send({
          success: true,
          updated: results.updated,
          failed: results.failed,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        request.log.error({ error: errorMessage }, 'Failed to bulk approve posts');

        return reply.status(500).send(
          createErrorResponse('BULK_APPROVE_FAILED', `Failed to bulk approve posts: ${errorMessage}`)
        );
      }
    }
  );

  /**
   * POST /api/posts/bulk-reject
   * Reject multiple posts at once
   */
  fastify.post<{ Body: BulkRejectBody }>(
    '/api/posts/bulk-reject',
    async (
      request: FastifyRequest<{ Body: BulkRejectBody }>,
      reply: FastifyReply
    ) => {
      const { postIds, reason } = request.body || { postIds: [] };

      if (!Array.isArray(postIds) || postIds.length === 0) {
        return reply.status(400).send(
          createErrorResponse('INVALID_REQUEST', 'postIds must be a non-empty array')
        );
      }

      request.log.info({ count: postIds.length, reason }, 'Bulk rejecting posts');

      try {
        const results = postRepo.bulkReject(postIds, reason);

        return reply.status(200).send({
          success: true,
          updated: results.updated,
          failed: results.failed,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        request.log.error({ error: errorMessage }, 'Failed to bulk reject posts');

        return reply.status(500).send(
          createErrorResponse('BULK_REJECT_FAILED', `Failed to bulk reject posts: ${errorMessage}`)
        );
      }
    }
  );

  /**
   * GET /api/posts/pending-count
   * Get count of pending posts
   */
  fastify.get(
    '/api/posts/pending-count',
    async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      request.log.debug('Fetching pending posts count');

      try {
        const count = postRepo.countByStatusValue(PostStatus.PENDING);

        return reply.status(200).send({ count });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        request.log.error({ error: errorMessage }, 'Failed to fetch pending count');

        return reply.status(500).send(
          createErrorResponse('COUNT_FAILED', `Failed to fetch pending count: ${errorMessage}`)
        );
      }
    }
  );

  /**
   * GET /api/posts/status-counts
   * Get counts for all post statuses
   */
  fastify.get(
    '/api/posts/status-counts',
    async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      request.log.debug('Fetching post status counts');

      try {
        const counts = postRepo.countByStatus();
        const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

        return reply.status(200).send({
          all: total,
          pending: counts[PostStatus.PENDING] || 0,
          approved: counts[PostStatus.APPROVED] || 0,
          rejected: counts[PostStatus.REJECTED] || 0,
          needs_review: counts[PostStatus.NEEDS_REVIEW] || 0,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        request.log.error({ error: errorMessage }, 'Failed to fetch status counts');

        return reply.status(500).send(
          createErrorResponse('COUNT_FAILED', `Failed to fetch status counts: ${errorMessage}`)
        );
      }
    }
  );
}
