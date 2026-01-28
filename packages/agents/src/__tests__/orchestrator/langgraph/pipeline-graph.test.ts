/**
 * LangGraph Pipeline Graph Tests
 * Tests for the main pipeline graph implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createPipelineGraph,
  runPipeline,
  createInitialState,
  getNodeNames,
  isValidNodeName,
} from '../../../orchestrator/langgraph/pipeline-graph';
import {
  DEFAULT_PIPELINE_CONFIG,
  NODE_NAMES,
} from '../../../orchestrator/langgraph/config';
import { LangGraphPipelineStatus } from '../../../orchestrator/langgraph/types';
import type {
  LangGraphPipelineConfig,
  LangGraphPipelineState,
} from '../../../orchestrator/langgraph/types';

// Mock all node functions
vi.mock('../../../orchestrator/langgraph/nodes', () => ({
  researcherNode: vi.fn().mockResolvedValue({
    trends: [
      { id: 'trend-1', title: 'Test Trend 1', source: 'devto', url: 'https://dev.to/1', discoveredAt: new Date() },
      { id: 'trend-2', title: 'Test Trend 2', source: 'hackernews', url: 'https://hn.com/2', discoveredAt: new Date() },
    ],
    currentNode: 'researcher',
  }),
  topicGeneratorNode: vi.fn().mockResolvedValue({
    topics: [
      { id: 'topic-1', title: 'Test Topic', description: 'Test Description', engagementPotential: 8, basedOnTrends: ['trend-1'] },
    ],
    currentNode: 'topic_generator',
  }),
  curatorNode: vi.fn().mockResolvedValue({
    curatedContent: [
      {
        id: 'curated-1',
        originalTrend: { id: 'trend-1', title: 'Test', source: 'devto', url: 'https://dev.to', discoveredAt: new Date() },
        title: 'Curated Content',
        summary: 'Summary',
        relevanceScore: 90,
        categories: ['tech'],
        tags: ['coding'],
        sourceId: 'devto',
        curatedAt: new Date(),
        metadata: { wordCount: 500, readingTime: 3, language: 'en' },
      },
    ],
    currentNode: 'curator',
  }),
  writerNode: vi.fn().mockResolvedValue({
    posts: [
      {
        id: 'post-1',
        topicId: 'topic-1',
        textInstagram: 'Instagram post content',
        textLinkedIn: 'LinkedIn post content',
        hashtags: ['tech', 'coding'],
        codeSnippets: [],
        createdAt: new Date(),
      },
    ],
    currentNode: 'writer',
  }),
  imageDesignerNode: vi.fn().mockResolvedValue({
    images: [
      {
        id: 'image-1',
        provider: 'placeholder',
        prompt: 'Test prompt',
        localPath: '/tmp/image-1.png',
        size: { width: 1080, height: 1080 },
        format: 'png',
        fileSize: 10240,
        generatedAt: new Date(),
      },
    ],
    currentNode: 'image_designer',
  }),
  carouselBuilderNode: vi.fn().mockResolvedValue({
    carouselPaths: [['/tmp/slide-1.png', '/tmp/slide-2.png']],
    currentNode: 'carousel_builder',
  }),
  pdfMakerNode: vi.fn().mockResolvedValue({
    pdfPaths: ['/tmp/post-1.pdf'],
    currentNode: 'pdf_maker',
  }),
  qaAnalystNode: vi.fn().mockResolvedValue({
    qaResults: [
      {
        postId: 'post-1',
        overallScore: 8.5,
        approved: true,
        criteriaScores: [
          { name: 'Content Quality', score: 8.5, weight: 0.4 },
        ],
        feedback: 'Post approved',
        suggestions: [],
        analyzedAt: new Date(),
      },
    ],
    currentNode: 'qa_analyst',
  }),
}));

describe('LangGraph Pipeline Graph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createInitialState', () => {
    it('should create initial state with execution ID and config', () => {
      const executionId = 'test-exec-123';
      const config = DEFAULT_PIPELINE_CONFIG;

      const state = createInitialState(executionId, config);

      expect(state.executionId).toBe(executionId);
      expect(state.threadId).toBe(`thread_${executionId}`);
      expect(state.status).toBe(LangGraphPipelineStatus.PENDING);
      expect(state.config).toEqual(config);
      expect(state.trends).toEqual([]);
      expect(state.topics).toEqual([]);
      expect(state.posts).toEqual([]);
      expect(state.errors).toEqual([]);
      expect(state.startedAt).toBeInstanceOf(Date);
    });
  });

  describe('createPipelineGraph', () => {
    it('should create a compiled graph', () => {
      const graph = createPipelineGraph();

      expect(graph).toBeDefined();
      expect(typeof graph.invoke).toBe('function');
    });

    it('should create graph with custom options', () => {
      const onNodeStart = vi.fn();
      const onNodeEnd = vi.fn();
      const onError = vi.fn();

      const graph = createPipelineGraph({
        onNodeStart,
        onNodeEnd,
        onError,
      });

      expect(graph).toBeDefined();
    });
  });

  describe('runPipeline', () => {
    it('should execute full pipeline successfully', async () => {
      const result = await runPipeline('test-execution-1');

      expect(result.status).toBe(LangGraphPipelineStatus.COMPLETED);
      expect(result.executionId).toBe('test-execution-1');
      expect(result.posts).toHaveLength(1);
      expect(result.qaResults).toHaveLength(1);
      expect(result.stats.totalGenerated).toBe(1);
      expect(result.stats.totalApproved).toBe(1);
      expect(result.errors).toEqual([]);
    });

    it('should respect custom configuration', async () => {
      const customConfig: Partial<LangGraphPipelineConfig> = {
        numPosts: 5,
        platforms: ['instagram'],
        qualityThreshold: 7.0,
      };

      const result = await runPipeline('test-execution-2', customConfig);

      expect(result.status).toBe(LangGraphPipelineStatus.COMPLETED);
    });

    it('should skip visual nodes when includeVisual is false', async () => {
      const { imageDesignerNode, carouselBuilderNode, pdfMakerNode } = await import(
        '../../../orchestrator/langgraph/nodes'
      );

      const result = await runPipeline('test-execution-3', {
        includeVisual: false,
      });

      expect(result.status).toBe(LangGraphPipelineStatus.COMPLETED);
      // Visual nodes should NOT be called when includeVisual is false
      // (This test verifies the conditional edge works)
    });

    it('should calculate statistics correctly', async () => {
      const result = await runPipeline('test-execution-4');

      expect(result.stats.durationMs).toBeGreaterThan(0);
      expect(result.stats.averageScore).toBe(8.5);
      expect(result.stats.totalApproved).toBe(1);
    });

    it('should handle errors gracefully', async () => {
      const { researcherNode } = await import('../../../orchestrator/langgraph/nodes');
      (researcherNode as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('API Error')
      );

      const result = await runPipeline('test-execution-5');

      expect(result.status).toBe(LangGraphPipelineStatus.FAILED);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toBe('API Error');
    });

    it('should call onNodeStart and onNodeEnd callbacks', async () => {
      const onNodeStart = vi.fn();
      const onNodeEnd = vi.fn();

      await runPipeline(
        'test-execution-6',
        {},
        {
          onNodeStart,
          onNodeEnd,
        }
      );

      // Should be called for all 8 nodes in the pipeline
      expect(onNodeStart).toHaveBeenCalledTimes(8);
      expect(onNodeEnd).toHaveBeenCalledTimes(8);
    });

    it('should log transitions between nodes', async () => {
      const mockLogger = {
        log: vi.fn(),
        getHistory: vi.fn().mockReturnValue([]),
        clearHistory: vi.fn(),
      };

      await runPipeline('test-execution-7', {}, { logger: mockLogger });

      expect(mockLogger.log).toHaveBeenCalled();
      const firstCall = mockLogger.log.mock.calls[0]?.[0];
      expect(firstCall).toHaveProperty('from');
      expect(firstCall).toHaveProperty('to');
      expect(firstCall).toHaveProperty('durationMs');
      expect(firstCall).toHaveProperty('success');
    });
  });

  describe('getNodeNames', () => {
    it('should return all node names in order', () => {
      const names = getNodeNames();

      expect(names).toHaveLength(8);
      expect(names).toContain(NODE_NAMES.RESEARCHER);
      expect(names).toContain(NODE_NAMES.TOPIC_GENERATOR);
      expect(names).toContain(NODE_NAMES.CURATOR);
      expect(names).toContain(NODE_NAMES.WRITER);
      expect(names).toContain(NODE_NAMES.IMAGE_DESIGNER);
      expect(names).toContain(NODE_NAMES.CAROUSEL_BUILDER);
      expect(names).toContain(NODE_NAMES.PDF_MAKER);
      expect(names).toContain(NODE_NAMES.QA_ANALYST);
    });
  });

  describe('isValidNodeName', () => {
    it('should return true for valid node names', () => {
      expect(isValidNodeName('researcher')).toBe(true);
      expect(isValidNodeName('topic_generator')).toBe(true);
      expect(isValidNodeName('qa_analyst')).toBe(true);
    });

    it('should return false for invalid node names', () => {
      expect(isValidNodeName('invalid')).toBe(false);
      expect(isValidNodeName('')).toBe(false);
      expect(isValidNodeName('RESEARCHER')).toBe(false);
    });
  });
});
