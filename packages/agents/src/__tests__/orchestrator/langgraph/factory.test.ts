/**
 * LangGraph Factory Tests
 * Tests for orchestrator factory functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DEFAULT_PIPELINE_CONFIG } from '../../../orchestrator/langgraph/config';
import { LangGraphPipelineStatus } from '../../../orchestrator/langgraph/types';

// Mock the pipeline graph before importing factory
vi.mock('../../../orchestrator/langgraph/pipeline-graph', () => {
  const LangGraphPipelineStatus = {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    PAUSED: 'paused',
  };
  return {
    createPipelineGraph: vi.fn().mockReturnValue({
      invoke: vi.fn().mockResolvedValue({
        executionId: 'test-exec',
        status: LangGraphPipelineStatus.COMPLETED,
        posts: [{ id: 'post-1' }],
        qaResults: [{ postId: 'post-1', overallScore: 8.0, approved: true }],
        errors: [],
      }),
    }),
    runPipeline: vi.fn().mockResolvedValue({
      executionId: 'test-exec',
      status: LangGraphPipelineStatus.COMPLETED,
      posts: [{ id: 'post-1' }],
      qaResults: [{ postId: 'post-1', overallScore: 8.0, approved: true }],
      stats: {
        totalGenerated: 1,
        totalApproved: 1,
        averageScore: 8.0,
        durationMs: 1000,
      },
      errors: [],
    }),
  };
});

// Import after mocking
import {
  createOrchestrator,
  createConfiguredGraph,
  createDefaultOrchestrator,
  createTestOrchestrator,
  generateExecutionId,
} from '../../../orchestrator/langgraph/factory';

describe('createOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create an orchestrator with default options', () => {
    const orchestrator = createOrchestrator();

    expect(orchestrator).toBeDefined();
    expect(typeof orchestrator.run).toBe('function');
    expect(typeof orchestrator.resume).toBe('function');
    expect(typeof orchestrator.getConfig).toBe('function');
  });

  it('should return default config', () => {
    const orchestrator = createOrchestrator();
    const config = orchestrator.getConfig();

    expect(config).toEqual(DEFAULT_PIPELINE_CONFIG);
  });

  it('should merge custom config with defaults', () => {
    const orchestrator = createOrchestrator({
      config: {
        numPosts: 5,
        qualityThreshold: 7.0,
      },
    });

    const config = orchestrator.getConfig();

    expect(config.numPosts).toBe(5);
    expect(config.qualityThreshold).toBe(7.0);
    expect(config.platforms).toEqual(DEFAULT_PIPELINE_CONFIG.platforms);
  });

  it('should run pipeline successfully', async () => {
    const orchestrator = createOrchestrator();
    const result = await orchestrator.run('test-execution');

    expect(result.status).toBe(LangGraphPipelineStatus.COMPLETED);
    expect(result.executionId).toBe('test-exec');
  });

  it('should throw error on invalid numPosts', () => {
    expect(() =>
      createOrchestrator({
        config: { numPosts: 0 },
      })
    ).toThrow('numPosts must be at least 1');
  });

  it('should throw error on invalid qualityThreshold', () => {
    expect(() =>
      createOrchestrator({
        config: { qualityThreshold: 15 },
      })
    ).toThrow('qualityThreshold must be between 0 and 10');
  });

  it('should throw error on negative maxRetries', () => {
    expect(() =>
      createOrchestrator({
        config: { maxRetries: -1 },
      })
    ).toThrow('maxRetries cannot be negative');
  });

  it('should throw error on too small timeout', () => {
    expect(() =>
      createOrchestrator({
        config: { timeoutMs: 500 },
      })
    ).toThrow('timeoutMs must be at least 1000ms');
  });

  it('should throw error on empty platforms', () => {
    expect(() =>
      createOrchestrator({
        config: { platforms: [] },
      })
    ).toThrow('At least one platform must be specified');
  });

  it('should throw error on resume without checkpointer', async () => {
    const orchestrator = createOrchestrator({
      enableCheckpoints: false,
    });

    await expect(orchestrator.resume('thread_123')).rejects.toThrow(
      'Checkpointer not enabled'
    );
  });
});

describe('createConfiguredGraph', () => {
  it('should create a configured graph', () => {
    const graph = createConfiguredGraph();

    expect(graph).toBeDefined();
  });

  it('should accept options', () => {
    const onNodeStart = vi.fn();
    const graph = createConfiguredGraph({
      onNodeStart,
      enableCheckpoints: true,
      enableLogging: true,
    });

    expect(graph).toBeDefined();
  });
});

describe('createDefaultOrchestrator', () => {
  it('should create orchestrator with default settings', () => {
    const orchestrator = createDefaultOrchestrator();

    expect(orchestrator).toBeDefined();
    expect(orchestrator.getConfig()).toEqual(DEFAULT_PIPELINE_CONFIG);
  });
});

describe('createTestOrchestrator', () => {
  it('should create orchestrator with test settings', () => {
    const orchestrator = createTestOrchestrator();
    const config = orchestrator.getConfig();

    expect(config.numPosts).toBe(1);
    expect(config.maxRetries).toBe(0);
    expect(config.timeoutMs).toBe(30000);
  });

  it('should allow config overrides', () => {
    const orchestrator = createTestOrchestrator({
      numPosts: 2,
      qualityThreshold: 5.0,
    });
    const config = orchestrator.getConfig();

    expect(config.numPosts).toBe(2);
    expect(config.qualityThreshold).toBe(5.0);
  });
});

describe('generateExecutionId', () => {
  it('should generate unique execution IDs', () => {
    const id1 = generateExecutionId();
    const id2 = generateExecutionId();

    expect(id1).not.toBe(id2);
  });

  it('should start with exec- prefix', () => {
    const id = generateExecutionId();

    expect(id.startsWith('exec-')).toBe(true);
  });

  it('should include timestamp', () => {
    const before = Date.now();
    const id = generateExecutionId();
    const after = Date.now();

    const parts = id.split('-');
    const timestamp = parseInt(parts[1]!, 10);

    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });
});
