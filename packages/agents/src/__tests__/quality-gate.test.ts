// Quality Gate Service Tests - Social Content Agent
// Story 4.6: Quality Gate e Threshold

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  QualityGateService,
  createQualityGateService,
  createQualityMetricsService,
  type IPostRepository,
  type PostForQualityGate,
} from '../services/quality-gate';
import {
  PostApprovalStatus,
  resetQualityGateConfig,
  setQualityThreshold,
  updateQualityGateConfig,
} from '@social-content/shared';

describe('QualityGateService', () => {
  let service: QualityGateService;

  beforeEach(() => {
    resetQualityGateConfig();
    service = createQualityGateService();
  });

  afterEach(() => {
    resetQualityGateConfig();
  });

  describe('getStatus', () => {
    it('should return APPROVED for score >= threshold', () => {
      expect(service.getStatus(6.0, 6.0)).toBe(PostApprovalStatus.APPROVED);
      expect(service.getStatus(6.1, 6.0)).toBe(PostApprovalStatus.APPROVED);
      expect(service.getStatus(10.0, 6.0)).toBe(PostApprovalStatus.APPROVED);
    });

    it('should return NEEDS_REVIEW for score < threshold', () => {
      expect(service.getStatus(5.9, 6.0)).toBe(PostApprovalStatus.NEEDS_REVIEW);
      expect(service.getStatus(0, 6.0)).toBe(PostApprovalStatus.NEEDS_REVIEW);
    });

    it('should handle custom threshold', () => {
      expect(service.getStatus(7.0, 8.0)).toBe(PostApprovalStatus.NEEDS_REVIEW);
      expect(service.getStatus(8.0, 8.0)).toBe(PostApprovalStatus.APPROVED);
    });

    it('should handle edge cases', () => {
      expect(service.getStatus(0, 0)).toBe(PostApprovalStatus.APPROVED);
      expect(service.getStatus(10, 10)).toBe(PostApprovalStatus.APPROVED);
    });

    it('should use config threshold when not provided', () => {
      setQualityThreshold(7.0);

      expect(service.getStatus(7.0)).toBe(PostApprovalStatus.APPROVED);
      expect(service.getStatus(6.9)).toBe(PostApprovalStatus.NEEDS_REVIEW);
    });
  });

  describe('evaluatePost', () => {
    const mockPost: PostForQualityGate = {
      id: 'post-1',
      regenerationCount: 0,
      approvalStatus: PostApprovalStatus.PENDING,
      createdAt: new Date(),
    };

    const mockQAResult = {
      overallScore: 7.5,
      criteriaBreakdown: [
        { name: 'clareza', score: 8 },
        { name: 'relevancia', score: 7 },
      ],
    };

    it('should return approved result for high score', () => {
      const result = service.evaluatePost(mockPost, mockQAResult);

      expect(result.approved).toBe(true);
      expect(result.status).toBe(PostApprovalStatus.APPROVED);
      expect(result.score).toBe(7.5);
      expect(result.threshold).toBe(6.0);
      expect(result.feedback).toContain('aprovado');
    });

    it('should return needs_review for low score', () => {
      const lowScoreResult = { ...mockQAResult, overallScore: 4.5 };
      const result = service.evaluatePost(mockPost, lowScoreResult);

      expect(result.approved).toBe(false);
      expect(result.status).toBe(PostApprovalStatus.NEEDS_REVIEW);
      expect(result.score).toBe(4.5);
    });

    it('should indicate canRegenerate when eligible', () => {
      const lowScoreResult = { ...mockQAResult, overallScore: 4.5 };
      const result = service.evaluatePost(mockPost, lowScoreResult);

      expect(result.canRegenerate).toBe(true);
    });

    it('should not allow regeneration after max attempts', () => {
      const postWithRegeneration = { ...mockPost, regenerationCount: 1 };
      const lowScoreResult = { ...mockQAResult, overallScore: 4.5 };
      const result = service.evaluatePost(postWithRegeneration, lowScoreResult);

      expect(result.canRegenerate).toBe(false);
    });

    it('should not allow regeneration when autoRegenerate is disabled', () => {
      updateQualityGateConfig({ autoRegenerate: false });

      const lowScoreResult = { ...mockQAResult, overallScore: 4.5 };
      const result = service.evaluatePost(mockPost, lowScoreResult);

      expect(result.canRegenerate).toBe(false);
    });

    it('should include low score criteria in feedback', () => {
      const lowScoreQA = {
        overallScore: 4.5,
        criteriaBreakdown: [
          { name: 'clareza', score: 4 },
          { name: 'relevancia', score: 5 },
          { name: 'engajamento', score: 7 },
        ],
      };
      const result = service.evaluatePost(mockPost, lowScoreQA);

      expect(result.feedback).toContain('clareza');
      expect(result.feedback).toContain('relevancia');
    });
  });

  describe('shouldRegenerate', () => {
    it('should return true for first regeneration attempt', () => {
      const post: PostForQualityGate = {
        id: 'post-1',
        approvalStatus: PostApprovalStatus.NEEDS_REVIEW,
        regenerationCount: 0,
        createdAt: new Date(),
      };

      expect(service.shouldRegenerate(post)).toBe(true);
    });

    it('should return false after max regenerations', () => {
      const post: PostForQualityGate = {
        id: 'post-1',
        approvalStatus: PostApprovalStatus.NEEDS_REVIEW,
        regenerationCount: 1,
        createdAt: new Date(),
      };

      expect(service.shouldRegenerate(post)).toBe(false);
    });

    it('should return false for approved posts', () => {
      const post: PostForQualityGate = {
        id: 'post-1',
        approvalStatus: PostApprovalStatus.APPROVED,
        regenerationCount: 0,
        createdAt: new Date(),
      };

      expect(service.shouldRegenerate(post)).toBe(false);
    });

    it('should return false for pending posts', () => {
      const post: PostForQualityGate = {
        id: 'post-1',
        approvalStatus: PostApprovalStatus.PENDING,
        regenerationCount: 0,
        createdAt: new Date(),
      };

      expect(service.shouldRegenerate(post)).toBe(false);
    });

    it('should return false when autoRegenerate is disabled', () => {
      updateQualityGateConfig({ autoRegenerate: false });

      const post: PostForQualityGate = {
        id: 'post-1',
        approvalStatus: PostApprovalStatus.NEEDS_REVIEW,
        regenerationCount: 0,
        createdAt: new Date(),
      };

      expect(service.shouldRegenerate(post)).toBe(false);
    });

    it('should handle undefined regenerationCount', () => {
      const post: PostForQualityGate = {
        id: 'post-1',
        approvalStatus: PostApprovalStatus.NEEDS_REVIEW,
        createdAt: new Date(),
      };

      expect(service.shouldRegenerate(post)).toBe(true);
    });

    it('should respect maxRegenerations setting', () => {
      updateQualityGateConfig({ maxRegenerations: 3 });

      const post: PostForQualityGate = {
        id: 'post-1',
        approvalStatus: PostApprovalStatus.NEEDS_REVIEW,
        regenerationCount: 2,
        createdAt: new Date(),
      };

      expect(service.shouldRegenerate(post)).toBe(true);
    });
  });

  describe('updateThreshold', () => {
    it('should update threshold with valid value', () => {
      const newThreshold = service.updateThreshold(7.5);

      expect(newThreshold).toBe(7.5);
      expect(service.getConfig().threshold).toBe(7.5);
    });

    it('should round to 0.1 precision', () => {
      const newThreshold = service.updateThreshold(7.55);

      expect(newThreshold).toBe(7.6);
    });

    it('should throw for invalid threshold', () => {
      expect(() => service.updateThreshold(-1)).toThrow();
      expect(() => service.updateThreshold(11)).toThrow();
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = service.getConfig();

      expect(config.threshold).toBe(6.0);
      expect(config.autoRegenerate).toBe(true);
      expect(config.maxRegenerations).toBe(1);
    });
  });
});

describe('QualityGateService with various scores', () => {
  let service: QualityGateService;
  const defaultThreshold = 6.0;

  beforeEach(() => {
    resetQualityGateConfig();
    service = createQualityGateService();
  });

  afterEach(() => {
    resetQualityGateConfig();
  });

  const testCases = [
    { score: 2.0, expected: PostApprovalStatus.NEEDS_REVIEW },
    { score: 5.9, expected: PostApprovalStatus.NEEDS_REVIEW },
    { score: 6.0, expected: PostApprovalStatus.APPROVED },
    { score: 6.1, expected: PostApprovalStatus.APPROVED },
    { score: 9.5, expected: PostApprovalStatus.APPROVED },
  ];

  testCases.forEach(({ score, expected }) => {
    it(`should return ${expected} for score ${score}`, () => {
      const result = service.getStatus(score, defaultThreshold);

      expect(result).toBe(expected);
    });
  });
});

describe('QualityMetricsService', () => {
  let mockRepository: IPostRepository;

  beforeEach(() => {
    resetQualityGateConfig();
  });

  afterEach(() => {
    resetQualityGateConfig();
  });

  describe('calculateMetrics', () => {
    it('should return empty metrics when no posts', async () => {
      mockRepository = {
        findByDateRange: async () => [],
        findByApprovalStatus: async () => [],
      };

      const service = createQualityMetricsService(mockRepository);
      const metrics = await service.calculateMetrics('7d');

      expect(metrics.totalPosts).toBe(0);
      expect(metrics.approvedCount).toBe(0);
      expect(metrics.needsReviewCount).toBe(0);
      expect(metrics.approvalRate).toBe(0);
      expect(metrics.averageScore).toBe(0);
      expect(metrics.period).toBe('7d');
    });

    it('should calculate correct metrics for posts', async () => {
      const posts: PostForQualityGate[] = [
        { id: '1', qaScore: 7.5, approvalStatus: PostApprovalStatus.APPROVED, createdAt: new Date() },
        { id: '2', qaScore: 8.0, approvalStatus: PostApprovalStatus.APPROVED, createdAt: new Date() },
        { id: '3', qaScore: 5.5, approvalStatus: PostApprovalStatus.NEEDS_REVIEW, createdAt: new Date() },
        { id: '4', qaScore: 4.0, approvalStatus: PostApprovalStatus.NEEDS_REVIEW, createdAt: new Date() },
      ];

      mockRepository = {
        findByDateRange: async () => posts,
        findByApprovalStatus: async () => [],
      };

      const service = createQualityMetricsService(mockRepository);
      const metrics = await service.calculateMetrics('7d');

      expect(metrics.totalPosts).toBe(4);
      expect(metrics.approvedCount).toBe(2);
      expect(metrics.needsReviewCount).toBe(2);
      expect(metrics.approvalRate).toBe(50);
      expect(metrics.averageScore).toBe(6.3); // (7.5+8.0+5.5+4.0)/4 = 6.25 rounded
    });

    it('should calculate correct score distribution', async () => {
      const posts: PostForQualityGate[] = [
        { id: '1', qaScore: 1.5, approvalStatus: PostApprovalStatus.NEEDS_REVIEW, createdAt: new Date() },
        { id: '2', qaScore: 3.0, approvalStatus: PostApprovalStatus.NEEDS_REVIEW, createdAt: new Date() },
        { id: '3', qaScore: 5.5, approvalStatus: PostApprovalStatus.NEEDS_REVIEW, createdAt: new Date() },
        { id: '4', qaScore: 7.0, approvalStatus: PostApprovalStatus.APPROVED, createdAt: new Date() },
        { id: '5', qaScore: 9.0, approvalStatus: PostApprovalStatus.APPROVED, createdAt: new Date() },
      ];

      mockRepository = {
        findByDateRange: async () => posts,
        findByApprovalStatus: async () => [],
      };

      const service = createQualityMetricsService(mockRepository);
      const metrics = await service.calculateMetrics('all');

      expect(metrics.scoreDistribution['0-2']).toBe(1);
      expect(metrics.scoreDistribution['2-4']).toBe(1);
      expect(metrics.scoreDistribution['4-6']).toBe(1);
      expect(metrics.scoreDistribution['6-8']).toBe(1);
      expect(metrics.scoreDistribution['8-10']).toBe(1);
    });

    it('should filter posts by period', async () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

      const posts: PostForQualityGate[] = [
        { id: '1', qaScore: 7.0, approvalStatus: PostApprovalStatus.APPROVED, createdAt: now },
        { id: '2', qaScore: 6.5, approvalStatus: PostApprovalStatus.APPROVED, createdAt: twoDaysAgo },
        { id: '3', qaScore: 8.0, approvalStatus: PostApprovalStatus.APPROVED, createdAt: tenDaysAgo },
      ];

      mockRepository = {
        findByDateRange: async (since: Date | null, until: Date) => {
          return posts.filter((p) => {
            if (since && p.createdAt < since) return false;
            if (p.createdAt > until) return false;
            return true;
          });
        },
        findByApprovalStatus: async () => [],
      };

      const service = createQualityMetricsService(mockRepository);

      // 24h should only include first post
      const metrics24h = await service.calculateMetrics('24h');
      expect(metrics24h.totalPosts).toBe(1);

      // 7d should include first two posts
      const metrics7d = await service.calculateMetrics('7d');
      expect(metrics7d.totalPosts).toBe(2);

      // all should include all posts
      const metricsAll = await service.calculateMetrics('all');
      expect(metricsAll.totalPosts).toBe(3);
    });

    it('should handle posts without qaScore', async () => {
      const posts: PostForQualityGate[] = [
        { id: '1', qaScore: 7.0, approvalStatus: PostApprovalStatus.APPROVED, createdAt: new Date() },
        { id: '2', approvalStatus: PostApprovalStatus.PENDING, createdAt: new Date() },
        { id: '3', qaScore: undefined, approvalStatus: PostApprovalStatus.PENDING, createdAt: new Date() },
      ];

      mockRepository = {
        findByDateRange: async () => posts,
        findByApprovalStatus: async () => [],
      };

      const service = createQualityMetricsService(mockRepository);
      const metrics = await service.calculateMetrics('all');

      // Average should only count posts with scores
      expect(metrics.totalPosts).toBe(3);
      expect(metrics.averageScore).toBe(7.0);
    });
  });
});
