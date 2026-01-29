/**
 * LangGraph Checkpointer Tests
 * Tests for checkpoint persistence functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MemoryCheckpointer,
  createMemoryCheckpointer,
  createLangGraphCheckpointer,
  createMemorySaver,
  buildCheckpointData,
  validateCheckpointForResume,
} from '../../../orchestrator/langgraph/checkpointer';
import { LangGraphPipelineStatus } from '../../../orchestrator/langgraph/types';
import type { CheckpointData } from '../../../orchestrator/langgraph/types';

describe('MemoryCheckpointer', () => {
  let checkpointer: MemoryCheckpointer;

  beforeEach(() => {
    checkpointer = new MemoryCheckpointer();
  });

  describe('save and load', () => {
    it('should save and load checkpoint correctly', async () => {
      const data: CheckpointData = {
        threadId: 'thread_1',
        state: {
          executionId: 'exec_1',
          status: LangGraphPipelineStatus.RUNNING,
          trends: [
            {
              id: 'trend-1',
              title: 'Test Trend',
              source: 'devto',
              url: 'https://dev.to/test',
              discoveredAt: new Date(),
            },
          ],
        },
        timestamp: new Date(),
        node: 'researcher',
        version: 1,
      };

      await checkpointer.save(data);
      const loaded = await checkpointer.load('thread_1');

      expect(loaded).not.toBeNull();
      expect(loaded?.threadId).toBe('thread_1');
      expect(loaded?.state.executionId).toBe('exec_1');
      expect(loaded?.state.trends).toHaveLength(1);
      expect(loaded?.node).toBe('researcher');
      expect(loaded?.version).toBe(1);
    });

    it('should return null for non-existent checkpoint', async () => {
      const loaded = await checkpointer.load('non_existent');
      expect(loaded).toBeNull();
    });

    it('should overwrite checkpoint on same threadId', async () => {
      const data1: CheckpointData = {
        threadId: 'thread_1',
        state: { executionId: 'exec_1' },
        timestamp: new Date(),
        node: 'researcher',
        version: 1,
      };

      const data2: CheckpointData = {
        threadId: 'thread_1',
        state: { executionId: 'exec_1', status: LangGraphPipelineStatus.COMPLETED },
        timestamp: new Date(),
        node: 'qa_analyst',
        version: 2,
      };

      await checkpointer.save(data1);
      await checkpointer.save(data2);
      const loaded = await checkpointer.load('thread_1');

      expect(loaded?.node).toBe('qa_analyst');
      expect(loaded?.version).toBe(2);
      expect(checkpointer.size).toBe(1);
    });
  });

  describe('list', () => {
    it('should list checkpoints by executionId', async () => {
      await checkpointer.save({
        threadId: 'thread_1',
        state: { executionId: 'exec_1' },
        timestamp: new Date(),
        node: 'node1',
        version: 1,
      });

      await checkpointer.save({
        threadId: 'thread_2',
        state: { executionId: 'exec_1' },
        timestamp: new Date(),
        node: 'node2',
        version: 1,
      });

      await checkpointer.save({
        threadId: 'thread_3',
        state: { executionId: 'exec_2' },
        timestamp: new Date(),
        node: 'node1',
        version: 1,
      });

      const list = await checkpointer.list('exec_1');

      expect(list).toHaveLength(2);
      expect(list.every((cp) => cp.state.executionId === 'exec_1')).toBe(true);
    });

    it('should return empty array for non-existent executionId', async () => {
      const list = await checkpointer.list('non_existent');
      expect(list).toHaveLength(0);
    });

    it('should sort checkpoints by timestamp descending', async () => {
      const now = Date.now();

      await checkpointer.save({
        threadId: 'thread_1',
        state: { executionId: 'exec_1' },
        timestamp: new Date(now - 1000),
        node: 'old',
        version: 1,
      });

      await checkpointer.save({
        threadId: 'thread_2',
        state: { executionId: 'exec_1' },
        timestamp: new Date(now),
        node: 'new',
        version: 1,
      });

      const list = await checkpointer.list('exec_1');

      expect(list[0]?.node).toBe('new');
      expect(list[1]?.node).toBe('old');
    });
  });

  describe('delete', () => {
    it('should delete checkpoint by threadId', async () => {
      await checkpointer.save({
        threadId: 'thread_1',
        state: {},
        timestamp: new Date(),
        node: 'test',
        version: 1,
      });

      expect(checkpointer.size).toBe(1);

      await checkpointer.delete('thread_1');
      const loaded = await checkpointer.load('thread_1');

      expect(loaded).toBeNull();
      expect(checkpointer.size).toBe(0);
    });

    it('should not throw when deleting non-existent checkpoint', async () => {
      await expect(checkpointer.delete('non_existent')).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all checkpoints', async () => {
      await checkpointer.save({
        threadId: 'thread_1',
        state: {},
        timestamp: new Date(),
        node: 'test1',
        version: 1,
      });

      await checkpointer.save({
        threadId: 'thread_2',
        state: {},
        timestamp: new Date(),
        node: 'test2',
        version: 1,
      });

      expect(checkpointer.size).toBe(2);

      await checkpointer.clear();

      expect(checkpointer.size).toBe(0);
    });
  });
});

describe('createMemoryCheckpointer', () => {
  it('should create a new MemoryCheckpointer instance', () => {
    const checkpointer = createMemoryCheckpointer();

    expect(checkpointer).toBeInstanceOf(MemoryCheckpointer);
    expect(checkpointer.size).toBe(0);
  });
});

describe('createLangGraphCheckpointer', () => {
  it('should create a LangGraph compatible checkpointer wrapper', () => {
    const wrapper = createLangGraphCheckpointer();

    expect(wrapper).toBeDefined();
    expect(wrapper.getMemorySaver()).toBeDefined();
    expect(typeof wrapper.saveMetadata).toBe('function');
    expect(typeof wrapper.loadMetadata).toBe('function');
  });

  it('should save and load metadata', async () => {
    const wrapper = createLangGraphCheckpointer();

    await wrapper.saveMetadata({
      threadId: 'thread_1',
      state: { executionId: 'exec_1' },
      timestamp: new Date(),
      node: 'test',
      version: 1,
    });

    const loaded = await wrapper.loadMetadata('thread_1');

    expect(loaded).not.toBeNull();
    expect(loaded?.state.executionId).toBe('exec_1');
  });
});

describe('createMemorySaver', () => {
  it('should create a LangGraph MemorySaver', () => {
    const saver = createMemorySaver();

    expect(saver).toBeDefined();
  });
});

describe('buildCheckpointData', () => {
  it('should build checkpoint data with all fields', () => {
    const state = {
      executionId: 'exec_1',
      status: LangGraphPipelineStatus.RUNNING,
    };

    const data = buildCheckpointData('thread_1', state, 'researcher', 1);

    expect(data.threadId).toBe('thread_1');
    expect(data.state).toEqual(state);
    expect(data.node).toBe('researcher');
    expect(data.version).toBe(1);
    expect(data.timestamp).toBeInstanceOf(Date);
  });

  it('should use default version when not provided', () => {
    const data = buildCheckpointData('thread_1', {}, 'test');

    expect(data.version).toBe(1);
  });
});

describe('validateCheckpointForResume', () => {
  it('should return true for valid checkpoint', () => {
    const checkpoint: CheckpointData = {
      threadId: 'thread_1',
      state: { executionId: 'exec_1' },
      timestamp: new Date(),
      node: 'researcher',
      version: 1,
    };

    expect(validateCheckpointForResume(checkpoint)).toBe(true);
  });

  it('should return false for null checkpoint', () => {
    expect(validateCheckpointForResume(null)).toBe(false);
  });

  it('should return false for checkpoint without executionId', () => {
    const checkpoint: CheckpointData = {
      threadId: 'thread_1',
      state: {},
      timestamp: new Date(),
      node: 'researcher',
      version: 1,
    };

    expect(validateCheckpointForResume(checkpoint)).toBe(false);
  });
});
