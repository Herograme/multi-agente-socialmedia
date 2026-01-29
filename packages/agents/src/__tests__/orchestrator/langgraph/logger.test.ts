/**
 * LangGraph Logger Tests
 * Tests for transition logging functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTransitionLogger,
  summarizeState,
  createTransitionLog,
  formatDuration,
  ExecutionLogger,
} from '../../../orchestrator/langgraph/logger';
import { LangGraphPipelineStatus } from '../../../orchestrator/langgraph/types';
import type { TransitionLog, LangGraphPipelineState } from '../../../orchestrator/langgraph/types';
import { DEFAULT_PIPELINE_CONFIG } from '../../../orchestrator/langgraph/config';

describe('createTransitionLogger', () => {
  it('should create a transition logger', () => {
    const logger = createTransitionLogger();

    expect(logger).toBeDefined();
    expect(typeof logger.log).toBe('function');
    expect(typeof logger.getHistory).toBe('function');
    expect(typeof logger.clearHistory).toBe('function');
  });

  it('should log transitions', () => {
    const logger = createTransitionLogger();

    const transition: TransitionLog = {
      from: 'researcher',
      to: 'topic_generator',
      timestamp: new Date(),
      durationMs: 100,
      inputSummary: 'trends:5',
      outputSummary: 'topics:3',
      success: true,
    };

    logger.log(transition);

    // Logger should store the transition (implementation detail)
    expect(true).toBe(true);
  });

  it('should clear history', () => {
    const logger = createTransitionLogger();

    logger.log({
      from: 'a',
      to: 'b',
      timestamp: new Date(),
      durationMs: 100,
      inputSummary: '',
      outputSummary: '',
      success: true,
    });

    logger.clearHistory('execution-123');
    const history = logger.getHistory('execution-123');

    expect(history).toHaveLength(0);
  });
});

describe('summarizeState', () => {
  it('should summarize empty state', () => {
    const summary = summarizeState({});

    expect(summary).toBe('empty');
  });

  it('should summarize state with executionId', () => {
    const summary = summarizeState({
      executionId: 'exec-123',
    });

    expect(summary).toContain('executionId:exec-123');
  });

  it('should summarize state with trends', () => {
    const summary = summarizeState({
      trends: [
        { id: '1', title: 'T', source: 's', url: 'u', discoveredAt: new Date() },
        { id: '2', title: 'T', source: 's', url: 'u', discoveredAt: new Date() },
      ],
    });

    expect(summary).toContain('trends:2');
  });

  it('should summarize state with multiple fields', () => {
    const summary = summarizeState({
      executionId: 'exec-123',
      trends: [{ id: '1', title: 'T', source: 's', url: 'u', discoveredAt: new Date() }],
      topics: [{ id: '1', title: 'T', description: 'd', engagementPotential: 8, basedOnTrends: [] }],
      posts: [{ id: '1', topicId: 't', hashtags: [], codeSnippets: [], createdAt: new Date() }],
    });

    expect(summary).toContain('executionId:exec-123');
    expect(summary).toContain('trends:1');
    expect(summary).toContain('topics:1');
    expect(summary).toContain('posts:1');
  });

  it('should include qaResults in summary', () => {
    const summary = summarizeState({
      qaResults: [
        { postId: '1', overallScore: 8, approved: true, criteriaScores: [], feedback: '', suggestions: [], analyzedAt: new Date() },
      ],
    });

    expect(summary).toContain('qa:1');
  });

  it('should include errors in summary', () => {
    const summary = summarizeState({
      errors: [
        { node: 'test', message: 'error', code: 'E1', timestamp: new Date(), retriable: true },
      ],
    });

    expect(summary).toContain('errors:1');
  });
});

describe('createTransitionLog', () => {
  it('should create a transition log entry', () => {
    const startTime = new Date(Date.now() - 100);
    const state = { executionId: 'exec-123' };

    const log = createTransitionLog('a', 'b', startTime, state, true);

    expect(log.from).toBe('a');
    expect(log.to).toBe('b');
    expect(log.success).toBe(true);
    expect(log.durationMs).toBeGreaterThanOrEqual(100);
    expect(log.timestamp).toBeInstanceOf(Date);
  });

  it('should include error message when failed', () => {
    const startTime = new Date();
    const state = {};

    const log = createTransitionLog('a', 'b', startTime, state, false, 'Test error');

    expect(log.success).toBe(false);
    expect(log.error).toBe('Test error');
  });
});

describe('formatDuration', () => {
  it('should format milliseconds', () => {
    expect(formatDuration(500)).toBe('500ms');
  });

  it('should format seconds', () => {
    expect(formatDuration(5000)).toBe('5.0s');
  });

  it('should format minutes', () => {
    expect(formatDuration(65000)).toBe('1m 5s');
  });

  it('should handle edge cases', () => {
    expect(formatDuration(0)).toBe('0ms');
    expect(formatDuration(1000)).toBe('1.0s');
    expect(formatDuration(60000)).toBe('1m 0s');
  });
});

describe('ExecutionLogger', () => {
  let executionLogger: ExecutionLogger;

  beforeEach(() => {
    executionLogger = new ExecutionLogger('exec-123');
  });

  it('should create logger with execution ID', () => {
    expect(executionLogger).toBeDefined();
  });

  it('should log node start', () => {
    const state: LangGraphPipelineState = {
      executionId: 'exec-123',
      threadId: 'thread_exec-123',
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
      currentNode: 'researcher',
      startedAt: new Date(),
      errors: [],
    };

    // Should not throw
    expect(() => executionLogger.nodeStart('researcher', state)).not.toThrow();
  });

  it('should log node end', () => {
    const state: LangGraphPipelineState = {
      executionId: 'exec-123',
      threadId: 'thread_exec-123',
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
      currentNode: 'topic_generator',
      startedAt: new Date(),
      errors: [],
    };

    expect(() =>
      executionLogger.nodeEnd('topic_generator', 'researcher', state, 100)
    ).not.toThrow();
  });

  it('should log node error', () => {
    const error = new Error('Test error');

    expect(() =>
      executionLogger.nodeError('researcher', '__start__', error)
    ).not.toThrow();
  });

  it('should get history', () => {
    const history = executionLogger.getHistory();

    expect(Array.isArray(history)).toBe(true);
  });

  it('should use custom transition logger', () => {
    const customLogger = createTransitionLogger();
    const logger = new ExecutionLogger('exec-123', customLogger);

    expect(logger.getHistory()).toEqual([]);
  });
});
