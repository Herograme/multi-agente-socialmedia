/**
 * Pipeline Status Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PipelineStatusStore,
  createPipelineStatusStore,
  PipelineStatus,
  StepStatus,
  type PipelineState,
} from '../orchestrator';

describe('PipelineStatusStore', () => {
  let store: PipelineStatusStore;

  beforeEach(() => {
    store = createPipelineStatusStore({ maxEntries: 10, ttlMs: 60000 });
  });

  const createTestState = (pipelineId: string): PipelineState => ({
    pipelineId,
    configId: 'test-config',
    configName: 'Test Pipeline',
    status: PipelineStatus.PENDING,
    progress: {
      currentStep: 0,
      totalSteps: 2,
      percentComplete: 0,
      currentStepName: 'step1',
    },
    startedAt: new Date(),
    stepStates: [
      { name: 'step1', index: 0, status: StepStatus.PENDING },
      { name: 'step2', index: 1, status: StepStatus.PENDING },
    ],
  });

  describe('create()', () => {
    it('should create a new pipeline state', () => {
      const state = createTestState('pipe-1');
      store.create(state);

      const retrieved = store.get('pipe-1');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.pipelineId).toBe('pipe-1');
    });

    it('should overwrite existing state with same ID', () => {
      const state1 = createTestState('pipe-1');
      state1.status = PipelineStatus.PENDING;
      store.create(state1);

      const state2 = createTestState('pipe-1');
      state2.status = PipelineStatus.RUNNING;
      store.create(state2);

      const retrieved = store.get('pipe-1');
      expect(retrieved?.status).toBe(PipelineStatus.RUNNING);
    });
  });

  describe('get()', () => {
    it('should return null for non-existent pipeline', () => {
      const result = store.get('non-existent');
      expect(result).toBeNull();
    });

    it('should return a copy of the state (not reference)', () => {
      const state = createTestState('pipe-1');
      store.create(state);

      const retrieved = store.get('pipe-1');
      if (retrieved) {
        retrieved.status = PipelineStatus.FAILED;
      }

      const retrievedAgain = store.get('pipe-1');
      expect(retrievedAgain?.status).toBe(PipelineStatus.PENDING);
    });
  });

  describe('update()', () => {
    it('should update existing pipeline state', () => {
      const state = createTestState('pipe-1');
      store.create(state);

      const updated = store.update('pipe-1', {
        status: PipelineStatus.RUNNING,
      });

      expect(updated?.status).toBe(PipelineStatus.RUNNING);
      expect(store.get('pipe-1')?.status).toBe(PipelineStatus.RUNNING);
    });

    it('should return null for non-existent pipeline', () => {
      const result = store.update('non-existent', {});
      expect(result).toBeNull();
    });
  });

  describe('updateStatus()', () => {
    it('should update status and set error', () => {
      const state = createTestState('pipe-1');
      store.create(state);

      store.updateStatus('pipe-1', PipelineStatus.FAILED, 'Something went wrong');

      const retrieved = store.get('pipe-1');
      expect(retrieved?.status).toBe(PipelineStatus.FAILED);
      expect(retrieved?.error).toBe('Something went wrong');
    });

    it('should set completedAt when status is completed or failed', () => {
      const state = createTestState('pipe-1');
      store.create(state);

      store.updateStatus('pipe-1', PipelineStatus.COMPLETED);

      const retrieved = store.get('pipe-1');
      expect(retrieved?.completedAt).toBeDefined();
    });
  });

  describe('updateProgress()', () => {
    it('should update progress and set status to running', () => {
      const state = createTestState('pipe-1');
      store.create(state);

      store.updateProgress('pipe-1', 1, 'step2');

      const retrieved = store.get('pipe-1');
      expect(retrieved?.status).toBe(PipelineStatus.RUNNING);
      expect(retrieved?.progress.currentStep).toBe(1);
      expect(retrieved?.progress.percentComplete).toBe(50);
      expect(retrieved?.progress.currentStepName).toBe('step2');
    });
  });

  describe('updateStepState()', () => {
    it('should update a specific step state', () => {
      const state = createTestState('pipe-1');
      store.create(state);

      store.updateStepState('pipe-1', 0, {
        status: StepStatus.COMPLETED,
        duration: 100,
      });

      const retrieved = store.get('pipe-1');
      expect(retrieved?.stepStates[0]?.status).toBe(StepStatus.COMPLETED);
      expect(retrieved?.stepStates[0]?.duration).toBe(100);
    });

    it('should return null for non-existent step index', () => {
      const state = createTestState('pipe-1');
      store.create(state);

      const result = store.updateStepState('pipe-1', 99, {
        status: StepStatus.COMPLETED,
      });

      expect(result).toBeNull();
    });
  });

  describe('complete()', () => {
    it('should mark pipeline as completed with final output', () => {
      const state = createTestState('pipe-1');
      store.create(state);

      const finalOutput = { result: 'success' };
      store.complete('pipe-1', finalOutput);

      const retrieved = store.get('pipe-1');
      expect(retrieved?.status).toBe(PipelineStatus.COMPLETED);
      expect(retrieved?.finalOutput).toEqual(finalOutput);
      expect(retrieved?.completedAt).toBeDefined();
      expect(retrieved?.progress.percentComplete).toBe(100);
    });

    it('should mark all steps as completed', () => {
      const state = createTestState('pipe-1');
      store.create(state);

      store.complete('pipe-1', {});

      const retrieved = store.get('pipe-1');
      expect(retrieved?.stepStates.every((s) => s.status === StepStatus.COMPLETED)).toBe(true);
    });
  });

  describe('fail()', () => {
    it('should mark pipeline as failed with error', () => {
      const state = createTestState('pipe-1');
      store.create(state);

      store.fail('pipe-1', 'Pipeline failed', 1);

      const retrieved = store.get('pipe-1');
      expect(retrieved?.status).toBe(PipelineStatus.FAILED);
      expect(retrieved?.error).toBe('Pipeline failed');
      expect(retrieved?.completedAt).toBeDefined();
    });

    it('should mark failed step and skip remaining', () => {
      const state = createTestState('pipe-1');
      store.create(state);

      store.fail('pipe-1', 'Step failed', 0);

      const retrieved = store.get('pipe-1');
      expect(retrieved?.stepStates[0]?.status).toBe(StepStatus.FAILED);
      expect(retrieved?.stepStates[1]?.status).toBe(StepStatus.SKIPPED);
    });
  });

  describe('delete()', () => {
    it('should delete a pipeline state', () => {
      const state = createTestState('pipe-1');
      store.create(state);

      const deleted = store.delete('pipe-1');

      expect(deleted).toBe(true);
      expect(store.get('pipe-1')).toBeNull();
    });

    it('should return false for non-existent pipeline', () => {
      const deleted = store.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('getAll()', () => {
    it('should return all pipeline states', () => {
      store.create(createTestState('pipe-1'));
      store.create(createTestState('pipe-2'));
      store.create(createTestState('pipe-3'));

      const all = store.getAll();
      expect(all).toHaveLength(3);
    });
  });

  describe('getByStatus()', () => {
    it('should filter pipelines by status', () => {
      const state1 = createTestState('pipe-1');
      state1.status = PipelineStatus.RUNNING;
      store.create(state1);

      const state2 = createTestState('pipe-2');
      state2.status = PipelineStatus.COMPLETED;
      store.create(state2);

      const state3 = createTestState('pipe-3');
      state3.status = PipelineStatus.RUNNING;
      store.create(state3);

      const running = store.getByStatus(PipelineStatus.RUNNING);
      expect(running).toHaveLength(2);

      const completed = store.getByStatus(PipelineStatus.COMPLETED);
      expect(completed).toHaveLength(1);
    });
  });

  describe('getStatusCounts()', () => {
    it('should return count of pipelines by status', () => {
      const state1 = createTestState('pipe-1');
      state1.status = PipelineStatus.RUNNING;
      store.create(state1);

      const state2 = createTestState('pipe-2');
      state2.status = PipelineStatus.COMPLETED;
      store.create(state2);

      const state3 = createTestState('pipe-3');
      state3.status = PipelineStatus.FAILED;
      store.create(state3);

      const counts = store.getStatusCounts();
      expect(counts[PipelineStatus.RUNNING]).toBe(1);
      expect(counts[PipelineStatus.COMPLETED]).toBe(1);
      expect(counts[PipelineStatus.FAILED]).toBe(1);
      expect(counts[PipelineStatus.PENDING]).toBe(0);
    });
  });

  describe('clear()', () => {
    it('should clear all entries', () => {
      store.create(createTestState('pipe-1'));
      store.create(createTestState('pipe-2'));

      store.clear();

      expect(store.size).toBe(0);
      expect(store.getAll()).toHaveLength(0);
    });
  });

  describe('Cleanup', () => {
    it('should enforce max entries limit', () => {
      // Create more than max entries
      for (let i = 0; i < 15; i++) {
        store.create(createTestState(`pipe-${i}`));
      }

      expect(store.size).toBeLessThanOrEqual(10);
    });
  });
});
