/**
 * LangGraph Nodes Tests
 * Tests for individual pipeline node implementations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  researcherNode,
  topicGeneratorNode,
  curatorNode,
  writerNode,
  imageDesignerNode,
  carouselBuilderNode,
  pdfMakerNode,
  qaAnalystNode,
  parallelVisualNode,
  createParallelVisualProcessor,
} from '../../../orchestrator/langgraph/nodes';
import { DEFAULT_PIPELINE_CONFIG } from '../../../orchestrator/langgraph/config';
import { LangGraphPipelineStatus } from '../../../orchestrator/langgraph/types';
import type { LangGraphPipelineState } from '../../../orchestrator/langgraph/types';

/**
 * Create a mock pipeline state for testing
 */
function createMockState(overrides: Partial<LangGraphPipelineState> = {}): LangGraphPipelineState {
  return {
    executionId: 'test-execution',
    threadId: 'thread_test-execution',
    status: LangGraphPipelineStatus.RUNNING,
    config: DEFAULT_PIPELINE_CONFIG,
    trends: [],
    topics: [],
    curatedContent: [],
    posts: [],
    images: [],
    carouselPaths: [],
    pdfPaths: [],
    qaResults: [],
    currentNode: '',
    startedAt: new Date(),
    errors: [],
    ...overrides,
  };
}

describe('researcherNode', () => {
  it('should return trends and update currentNode', async () => {
    const state = createMockState();
    const result = await researcherNode(state);

    expect(result.trends).toBeDefined();
    expect(result.trends!.length).toBeGreaterThan(0);
    expect(result.currentNode).toBe('researcher');
  });

  it('should return trends with required properties', async () => {
    const state = createMockState();
    const result = await researcherNode(state);

    const trend = result.trends![0];
    expect(trend).toHaveProperty('id');
    expect(trend).toHaveProperty('title');
    expect(trend).toHaveProperty('source');
    expect(trend).toHaveProperty('url');
    expect(trend).toHaveProperty('discoveredAt');
  });
});

describe('topicGeneratorNode', () => {
  it('should generate topics from trends', async () => {
    const state = createMockState({
      trends: [
        {
          id: 'trend-1',
          title: 'Test Trend',
          source: 'devto',
          url: 'https://dev.to',
          discoveredAt: new Date(),
        },
      ],
    });

    const result = await topicGeneratorNode(state);

    expect(result.topics).toBeDefined();
    expect(result.topics!.length).toBeGreaterThan(0);
    expect(result.currentNode).toBe('topic_generator');
  });

  it('should respect numPosts config', async () => {
    const state = createMockState({
      config: { ...DEFAULT_PIPELINE_CONFIG, numPosts: 2 },
      trends: [
        { id: '1', title: 'Trend 1', source: 'devto', url: 'https://dev.to/1', discoveredAt: new Date() },
        { id: '2', title: 'Trend 2', source: 'devto', url: 'https://dev.to/2', discoveredAt: new Date() },
        { id: '3', title: 'Trend 3', source: 'devto', url: 'https://dev.to/3', discoveredAt: new Date() },
      ],
    });

    const result = await topicGeneratorNode(state);

    expect(result.topics!.length).toBeLessThanOrEqual(2);
  });
});

describe('curatorNode', () => {
  it('should curate content for each topic', async () => {
    const state = createMockState({
      trends: [
        { id: 'trend-1', title: 'Trend', source: 'devto', url: 'https://dev.to', discoveredAt: new Date() },
      ],
      topics: [
        { id: 'topic-1', title: 'Topic', description: 'Desc', engagementPotential: 8, basedOnTrends: ['trend-1'] },
      ],
    });

    const result = await curatorNode(state);

    expect(result.curatedContent).toBeDefined();
    expect(result.curatedContent!.length).toBe(1);
    expect(result.currentNode).toBe('curator');
  });

  it('should include metadata in curated content', async () => {
    const state = createMockState({
      trends: [
        { id: 'trend-1', title: 'Trend', source: 'devto', url: 'https://dev.to', discoveredAt: new Date() },
      ],
      topics: [
        { id: 'topic-1', title: 'Topic', description: 'Desc', engagementPotential: 8, basedOnTrends: ['trend-1'] },
      ],
    });

    const result = await curatorNode(state);
    const content = result.curatedContent![0];

    expect(content?.metadata).toHaveProperty('wordCount');
    expect(content?.metadata).toHaveProperty('readingTime');
    expect(content?.metadata).toHaveProperty('language');
  });
});

describe('writerNode', () => {
  it('should generate posts for curated content', async () => {
    const state = createMockState({
      config: { ...DEFAULT_PIPELINE_CONFIG, platforms: ['instagram', 'linkedin'] },
      topics: [{ id: 'topic-1', title: 'Topic', description: 'Desc', engagementPotential: 8, basedOnTrends: [] }],
      curatedContent: [
        {
          id: 'curated-1',
          originalTrend: { id: 't1', title: 'T', source: 's', url: 'u', discoveredAt: new Date() },
          title: 'Title',
          summary: 'Summary',
          relevanceScore: 90,
          categories: [],
          tags: [],
          sourceId: 's',
          curatedAt: new Date(),
          metadata: { wordCount: 100, readingTime: 1, language: 'en' },
        },
      ],
    });

    const result = await writerNode(state);

    expect(result.posts).toBeDefined();
    expect(result.posts!.length).toBe(1);
    expect(result.posts![0]).toHaveProperty('textInstagram');
    expect(result.posts![0]).toHaveProperty('textLinkedIn');
    expect(result.currentNode).toBe('writer');
  });

  it('should include hashtags and code snippets', async () => {
    const state = createMockState({
      curatedContent: [
        {
          id: 'curated-1',
          originalTrend: { id: 't1', title: 'T', source: 's', url: 'u', discoveredAt: new Date() },
          title: 'Title',
          summary: 'Summary',
          relevanceScore: 90,
          categories: [],
          tags: [],
          sourceId: 's',
          curatedAt: new Date(),
          metadata: { wordCount: 100, readingTime: 1, language: 'en' },
        },
      ],
    });

    const result = await writerNode(state);
    const post = result.posts![0];

    expect(post?.hashtags).toBeDefined();
    expect(post?.hashtags.length).toBeGreaterThan(0);
    expect(post?.codeSnippets).toBeDefined();
  });
});

describe('imageDesignerNode', () => {
  it('should generate images for each post', async () => {
    const state = createMockState({
      posts: [
        { id: 'post-1', topicId: 't1', hashtags: [], codeSnippets: [], createdAt: new Date() },
        { id: 'post-2', topicId: 't2', hashtags: [], codeSnippets: [], createdAt: new Date() },
      ],
    });

    const result = await imageDesignerNode(state);

    expect(result.images).toBeDefined();
    expect(result.images!.length).toBe(2);
    expect(result.currentNode).toBe('image_designer');
  });

  it('should include required image properties', async () => {
    const state = createMockState({
      posts: [{ id: 'post-1', topicId: 't1', hashtags: [], codeSnippets: [], createdAt: new Date() }],
    });

    const result = await imageDesignerNode(state);
    const image = result.images![0];

    expect(image).toHaveProperty('id');
    expect(image).toHaveProperty('provider');
    expect(image).toHaveProperty('localPath');
    expect(image).toHaveProperty('size');
    expect(image).toHaveProperty('format');
  });
});

describe('carouselBuilderNode', () => {
  it('should create carousel paths for each post', async () => {
    const state = createMockState({
      posts: [
        { id: 'post-1', topicId: 't1', hashtags: [], codeSnippets: [], createdAt: new Date() },
      ],
    });

    const result = await carouselBuilderNode(state);

    expect(result.carouselPaths).toBeDefined();
    expect(result.carouselPaths!.length).toBe(1);
    expect(result.carouselPaths![0]!.length).toBeGreaterThan(0);
    expect(result.currentNode).toBe('carousel_builder');
  });
});

describe('pdfMakerNode', () => {
  it('should create PDF paths for LinkedIn posts', async () => {
    const state = createMockState({
      config: { ...DEFAULT_PIPELINE_CONFIG, platforms: ['linkedin'] },
      posts: [
        { id: 'post-1', topicId: 't1', hashtags: [], codeSnippets: [], createdAt: new Date() },
      ],
    });

    const result = await pdfMakerNode(state);

    expect(result.pdfPaths).toBeDefined();
    expect(result.pdfPaths!.length).toBe(1);
    expect(result.currentNode).toBe('pdf_maker');
  });

  it('should not create PDFs when LinkedIn not in platforms', async () => {
    const state = createMockState({
      config: { ...DEFAULT_PIPELINE_CONFIG, platforms: ['instagram'] },
      posts: [
        { id: 'post-1', topicId: 't1', hashtags: [], codeSnippets: [], createdAt: new Date() },
      ],
    });

    const result = await pdfMakerNode(state);

    expect(result.pdfPaths!.length).toBe(0);
  });
});

describe('qaAnalystNode', () => {
  it('should analyze all posts', async () => {
    const state = createMockState({
      posts: [
        { id: 'post-1', topicId: 't1', hashtags: [], codeSnippets: [], createdAt: new Date() },
        { id: 'post-2', topicId: 't2', hashtags: [], codeSnippets: [], createdAt: new Date() },
      ],
    });

    const result = await qaAnalystNode(state);

    expect(result.qaResults).toBeDefined();
    expect(result.qaResults!.length).toBe(2);
    expect(result.currentNode).toBe('qa_analyst');
  });

  it('should include scores and approval status', async () => {
    const state = createMockState({
      config: { ...DEFAULT_PIPELINE_CONFIG, qualityThreshold: 6.0 },
      posts: [
        { id: 'post-1', topicId: 't1', hashtags: [], codeSnippets: [], createdAt: new Date() },
      ],
    });

    const result = await qaAnalystNode(state);
    const qaResult = result.qaResults![0];

    expect(qaResult).toHaveProperty('postId');
    expect(qaResult).toHaveProperty('overallScore');
    expect(qaResult).toHaveProperty('approved');
    expect(qaResult).toHaveProperty('criteriaScores');
    expect(qaResult).toHaveProperty('feedback');
  });

  it('should approve posts above threshold', async () => {
    const state = createMockState({
      config: { ...DEFAULT_PIPELINE_CONFIG, qualityThreshold: 5.0 },
      posts: [
        { id: 'post-1', topicId: 't1', hashtags: [], codeSnippets: [], createdAt: new Date() },
      ],
    });

    const result = await qaAnalystNode(state);

    // With random scores 6-10, all should be above 5.0 threshold
    expect(result.qaResults![0]?.approved).toBe(true);
  });
});

describe('parallelVisualNode', () => {
  it('should execute carousel and PDF generation', async () => {
    const state = createMockState({
      config: { ...DEFAULT_PIPELINE_CONFIG, parallelVisual: true, platforms: ['linkedin'] },
      posts: [
        { id: 'post-1', topicId: 't1', hashtags: [], codeSnippets: [], createdAt: new Date() },
      ],
    });

    const result = await parallelVisualNode(state);

    expect(result.carouselPaths).toBeDefined();
    expect(result.pdfPaths).toBeDefined();
    expect(result.currentNode).toBe('parallel_visual');
  });

  it('should work with parallelVisual disabled', async () => {
    const state = createMockState({
      config: { ...DEFAULT_PIPELINE_CONFIG, parallelVisual: false, platforms: ['linkedin'] },
      posts: [
        { id: 'post-1', topicId: 't1', hashtags: [], codeSnippets: [], createdAt: new Date() },
      ],
    });

    const result = await parallelVisualNode(state);

    expect(result.carouselPaths).toBeDefined();
    expect(result.pdfPaths).toBeDefined();
  });
});

describe('createParallelVisualProcessor', () => {
  it('should create a custom parallel processor', async () => {
    const processor = createParallelVisualProcessor({
      forceSequential: false,
      timeout: 5000,
    });

    const state = createMockState({
      config: { ...DEFAULT_PIPELINE_CONFIG, parallelVisual: true, platforms: ['linkedin'] },
      posts: [
        { id: 'post-1', topicId: 't1', hashtags: [], codeSnippets: [], createdAt: new Date() },
      ],
    });

    const result = await processor(state);

    expect(result.carouselPaths).toBeDefined();
    expect(result.pdfPaths).toBeDefined();
  });

  it('should force sequential execution when configured', async () => {
    const processor = createParallelVisualProcessor({
      forceSequential: true,
    });

    const state = createMockState({
      config: { ...DEFAULT_PIPELINE_CONFIG, parallelVisual: true, platforms: ['linkedin'] },
      posts: [
        { id: 'post-1', topicId: 't1', hashtags: [], codeSnippets: [], createdAt: new Date() },
      ],
    });

    const result = await processor(state);

    expect(result).toBeDefined();
    expect(result.carouselPaths).toBeDefined();
  });
});
