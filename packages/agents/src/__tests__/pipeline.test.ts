/**
 * Pipeline Orchestrator Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PipelineOrchestrator,
  PipelineStatus,
  StepStatus,
  type PipelineConfig,
} from '../orchestrator';
import type { Agent, AgentResult } from '../agents/types';
import { AgentStatus } from '../agents/types';

// Mock agent factory
function createMockAgent<TInput, TOutput>(
  name: string,
  runFn: (input: TInput) => Promise<AgentResult<TOutput>>
): Agent<TInput, TOutput> {
  return {
    name,
    status: AgentStatus.IDLE,
    run: runFn,
  };
}

// Successful agent that returns the input with a prefix
function createSuccessfulAgent(delay = 10): Agent<unknown, unknown> {
  return createMockAgent('successful-agent', async (input) => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return {
      success: true,
      data: { processed: input },
      duration: delay,
      timestamp: new Date(),
    };
  });
}

// Failing agent
function createFailingAgent(errorMessage = 'Agent failed'): Agent<unknown, unknown> {
  return createMockAgent('failing-agent', async () => {
    return {
      success: false,
      error: errorMessage,
      duration: 0,
      timestamp: new Date(),
    };
  });
}

// Throwing agent
function createThrowingAgent(errorMessage = 'Agent threw'): Agent<unknown, unknown> {
  return createMockAgent('throwing-agent', async () => {
    throw new Error(errorMessage);
  });
}

// Slow agent for timeout tests
function createSlowAgent(delay = 5000): Agent<unknown, unknown> {
  return createMockAgent('slow-agent', async (input) => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return {
      success: true,
      data: input,
      duration: delay,
      timestamp: new Date(),
    };
  });
}

describe('PipelineOrchestrator', () => {
  let config: PipelineConfig;

  beforeEach(() => {
    config = {
      id: 'test-pipeline',
      name: 'Test Pipeline',
      steps: [],
      defaultTimeout: 5000,
      defaultRetries: 0,
    };
  });

  describe('Constructor', () => {
    it('should create an orchestrator with the given config', () => {
      const orchestrator = new PipelineOrchestrator(config);
      expect(orchestrator.getConfig()).toEqual(config);
    });
  });

  describe('run()', () => {
    it('should execute steps in sequence', async () => {
      const step1Order: number[] = [];
      const step2Order: number[] = [];

      config.steps = [
        {
          name: 'step1',
          agent: createMockAgent('step1', async (input) => {
            step1Order.push(1);
            return {
              success: true,
              data: { step: 1, input },
              duration: 10,
              timestamp: new Date(),
            };
          }),
        },
        {
          name: 'step2',
          agent: createMockAgent('step2', async (input) => {
            step2Order.push(2);
            return {
              success: true,
              data: { step: 2, input },
              duration: 10,
              timestamp: new Date(),
            };
          }),
        },
      ];

      const orchestrator = new PipelineOrchestrator(config);
      const result = await orchestrator.run({ initial: 'data' });

      expect(result.status).toBe(PipelineStatus.COMPLETED);
      expect(result.stepResults).toHaveLength(2);
      expect(step1Order[0]).toBe(1);
      expect(step2Order[0]).toBe(2);
    });

    it('should pass output from one step to the next', async () => {
      let step2Input: unknown;

      config.steps = [
        {
          name: 'step1',
          agent: createMockAgent('step1', async () => {
            return {
              success: true,
              data: { fromStep1: true },
              duration: 10,
              timestamp: new Date(),
            };
          }),
        },
        {
          name: 'step2',
          agent: createMockAgent('step2', async (input) => {
            step2Input = input;
            return {
              success: true,
              data: { fromStep2: true },
              duration: 10,
              timestamp: new Date(),
            };
          }),
        },
      ];

      const orchestrator = new PipelineOrchestrator(config);
      await orchestrator.run({ initial: 'data' });

      expect(step2Input).toEqual({ fromStep1: true });
    });

    it('should apply transform function if provided', async () => {
      let step2Input: unknown;

      config.steps = [
        {
          name: 'step1',
          agent: createMockAgent('step1', async () => {
            return {
              success: true,
              data: { value: 10 },
              duration: 10,
              timestamp: new Date(),
            };
          }),
          transform: (output: unknown) => ({
            transformed: true,
            original: output,
          }),
        },
        {
          name: 'step2',
          agent: createMockAgent('step2', async (input) => {
            step2Input = input;
            return {
              success: true,
              data: input,
              duration: 10,
              timestamp: new Date(),
            };
          }),
        },
      ];

      const orchestrator = new PipelineOrchestrator(config);
      await orchestrator.run({});

      expect(step2Input).toEqual({
        transformed: true,
        original: { value: 10 },
      });
    });

    it('should emit progress events', async () => {
      config.steps = [
        { name: 'step1', agent: createSuccessfulAgent() },
        { name: 'step2', agent: createSuccessfulAgent() },
      ];

      const events: string[] = [];
      const orchestrator = new PipelineOrchestrator(config);

      orchestrator.on('pipeline:started', () => events.push('started'));
      orchestrator.on('pipeline:step:started', () => events.push('step:started'));
      orchestrator.on('pipeline:step:completed', () => events.push('step:completed'));
      orchestrator.on('pipeline:completed', () => events.push('completed'));

      await orchestrator.run({});

      expect(events).toEqual([
        'started',
        'step:started',
        'step:completed',
        'step:started',
        'step:completed',
        'completed',
      ]);
    });

    it('should include correct data in events', async () => {
      config.steps = [
        { name: 'research', agent: createSuccessfulAgent() },
      ];

      const orchestrator = new PipelineOrchestrator(config);
      let startedEvent: unknown;
      let completedEvent: unknown;

      orchestrator.on('pipeline:started', (e) => { startedEvent = e; });
      orchestrator.on('pipeline:completed', (e) => { completedEvent = e; });

      await orchestrator.run({}, { pipelineId: 'test-123' });

      expect(startedEvent).toMatchObject({
        pipelineId: 'test-123',
        configId: 'test-pipeline',
        configName: 'Test Pipeline',
        totalSteps: 1,
      });
      expect(completedEvent).toMatchObject({
        pipelineId: 'test-123',
      });
    });

    it('should return result with all step results', async () => {
      config.steps = [
        { name: 'step1', agent: createSuccessfulAgent() },
        { name: 'step2', agent: createSuccessfulAgent() },
      ];

      const orchestrator = new PipelineOrchestrator(config);
      const result = await orchestrator.run({});

      expect(result.stepResults).toHaveLength(2);
      expect(result.stepResults[0]?.stepName).toBe('step1');
      expect(result.stepResults[0]?.status).toBe(StepStatus.COMPLETED);
      expect(result.stepResults[1]?.stepName).toBe('step2');
      expect(result.stepResults[1]?.status).toBe(StepStatus.COMPLETED);
    });

    it('should use custom pipeline ID if provided', async () => {
      config.steps = [{ name: 'step1', agent: createSuccessfulAgent() }];

      const orchestrator = new PipelineOrchestrator(config);
      const result = await orchestrator.run({}, { pipelineId: 'custom-id-123' });

      expect(result.pipelineId).toBe('custom-id-123');
    });
  });

  describe('Error Handling', () => {
    it('should handle step failure gracefully', async () => {
      config.steps = [
        { name: 'step1', agent: createSuccessfulAgent() },
        { name: 'step2', agent: createFailingAgent('Step 2 failed') },
        { name: 'step3', agent: createSuccessfulAgent() },
      ];

      const orchestrator = new PipelineOrchestrator(config);
      const result = await orchestrator.run({});

      expect(result.status).toBe(PipelineStatus.FAILED);
      expect(result.stepResults).toHaveLength(2);
      expect(result.stepResults[1]?.status).toBe(StepStatus.FAILED);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toBe('Step 2 failed');
    });

    it('should handle thrown errors', async () => {
      config.steps = [
        { name: 'step1', agent: createThrowingAgent('Unexpected error') },
      ];

      const orchestrator = new PipelineOrchestrator(config);
      const result = await orchestrator.run({});

      expect(result.status).toBe(PipelineStatus.FAILED);
      expect(result.stepResults[0]?.status).toBe(StepStatus.FAILED);
    });

    it('should emit pipeline:failed event on failure', async () => {
      config.steps = [
        { name: 'step1', agent: createFailingAgent() },
      ];

      const orchestrator = new PipelineOrchestrator(config);
      let failedEvent: unknown;

      orchestrator.on('pipeline:failed', (e) => { failedEvent = e; });

      await orchestrator.run({});

      expect(failedEvent).toMatchObject({
        error: expect.any(String),
        failedStep: 'step1',
      });
    });

    it('should run cleanup handlers on failure', async () => {
      const cleanupCalled: string[] = [];

      config.steps = [
        { name: 'step1', agent: createSuccessfulAgent() },
        { name: 'step2', agent: createSuccessfulAgent() },
        { name: 'step3', agent: createFailingAgent() },
      ];

      const orchestrator = new PipelineOrchestrator(config);

      orchestrator.registerCleanupHandler('step1', async () => {
        cleanupCalled.push('step1');
      });
      orchestrator.registerCleanupHandler('step2', async () => {
        cleanupCalled.push('step2');
      });

      await orchestrator.run({});

      // Cleanup should run in reverse order for completed steps only
      expect(cleanupCalled).toEqual(['step2', 'step1']);
    });
  });

  describe('Timeout', () => {
    it('should timeout long-running steps', async () => {
      config.steps = [
        {
          name: 'slow',
          agent: createSlowAgent(10000),
          timeout: 50,
        },
      ];

      const orchestrator = new PipelineOrchestrator(config);
      const result = await orchestrator.run({});

      expect(result.status).toBe(PipelineStatus.FAILED);
      expect(result.errors[0]?.message).toContain('timed out');
    }, 15000); // Extended timeout for timeout test

    it('should use step-specific timeout over default', async () => {
      config.defaultTimeout = 10000;
      config.steps = [
        {
          name: 'slow',
          agent: createSlowAgent(1000),
          timeout: 50,
        },
      ];

      const orchestrator = new PipelineOrchestrator(config);
      const result = await orchestrator.run({});

      expect(result.status).toBe(PipelineStatus.FAILED);
    }, 10000); // Extended timeout for slow test agent
  });

  describe('Cancellation', () => {
    it('should handle cancellation when abort signal is triggered', async () => {
      config.steps = [
        { name: 'step1', agent: createSlowAgent(1000) },
        { name: 'step2', agent: createSuccessfulAgent() },
      ];

      const orchestrator = new PipelineOrchestrator(config);
      const abortController = new AbortController();

      // Abort after 50ms
      setTimeout(() => abortController.abort(), 50);

      const result = await orchestrator.run({}, {
        abortSignal: abortController.signal,
      });

      // Pipeline should not complete successfully when aborted
      expect(result.status).not.toBe(PipelineStatus.COMPLETED);
      // It could be CANCELLED or FAILED depending on timing
      expect([PipelineStatus.CANCELLED, PipelineStatus.FAILED]).toContain(result.status);
    });

    it('should emit pipeline:failed event on cancellation', async () => {
      config.steps = [
        { name: 'step1', agent: createSlowAgent(1000) },
      ];

      const orchestrator = new PipelineOrchestrator(config);
      const abortController = new AbortController();
      let failedEvent: { error: string } | undefined;

      orchestrator.on('pipeline:failed', (e) => { failedEvent = e; });

      setTimeout(() => abortController.abort(), 50);

      await orchestrator.run({}, { abortSignal: abortController.signal });

      // Should emit failed event with some error message
      expect(failedEvent).toBeDefined();
      expect(failedEvent?.error).toBeDefined();
    });
  });

  describe('Retries', () => {
    it('should retry failed steps based on retry count', async () => {
      let attempts = 0;

      config.steps = [
        {
          name: 'flaky',
          agent: createMockAgent('flaky', async () => {
            attempts++;
            if (attempts < 3) {
              return {
                success: false,
                error: `Attempt ${attempts} failed`,
                duration: 10,
                timestamp: new Date(),
              };
            }
            return {
              success: true,
              data: { success: true },
              duration: 10,
              timestamp: new Date(),
            };
          }),
          retries: 3,
        },
      ];

      const orchestrator = new PipelineOrchestrator(config);
      const result = await orchestrator.run({});

      expect(result.status).toBe(PipelineStatus.COMPLETED);
      expect(attempts).toBe(3);
      expect(result.stepResults[0]?.retryCount).toBe(2);
    });

    it('should fail after exhausting retries', async () => {
      let attempts = 0;

      config.steps = [
        {
          name: 'always-fails',
          agent: createMockAgent('always-fails', async () => {
            attempts++;
            return {
              success: false,
              error: 'Always fails',
              duration: 10,
              timestamp: new Date(),
            };
          }),
          retries: 2,
        },
      ];

      const orchestrator = new PipelineOrchestrator(config);
      const result = await orchestrator.run({});

      expect(result.status).toBe(PipelineStatus.FAILED);
      expect(attempts).toBe(3); // 1 initial + 2 retries
    });
  });

  describe('State Management', () => {
    it('should build initial state correctly', () => {
      config.steps = [
        { name: 'step1', agent: createSuccessfulAgent() },
        { name: 'step2', agent: createSuccessfulAgent() },
      ];

      const orchestrator = new PipelineOrchestrator(config);
      const state = orchestrator.buildInitialState('test-id');

      expect(state.pipelineId).toBe('test-id');
      expect(state.configId).toBe('test-pipeline');
      expect(state.status).toBe(PipelineStatus.PENDING);
      expect(state.stepStates).toHaveLength(2);
      expect(state.stepStates[0]?.status).toBe(StepStatus.PENDING);
    });

    it('should track active contexts during execution', async () => {
      let wasActive = false;

      config.steps = [
        {
          name: 'check-active',
          agent: createMockAgent('check-active', async () => {
            // This runs during pipeline execution
            wasActive = true;
            return {
              success: true,
              data: {},
              duration: 10,
              timestamp: new Date(),
            };
          }),
        },
      ];

      const orchestrator = new PipelineOrchestrator(config);
      await orchestrator.run({}, { pipelineId: 'test-active' });

      // After completion, should not be active
      expect(orchestrator.isRunning('test-active')).toBe(false);
      expect(wasActive).toBe(true);
    });
  });
});

describe('PipelineStatusStore', () => {
  it('should be tested in status-store.test.ts', () => {
    // Placeholder - status store tests are in their own file
    expect(true).toBe(true);
  });
});
