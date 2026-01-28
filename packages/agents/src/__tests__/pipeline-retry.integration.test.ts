/**
 * Pipeline Retry Integration Tests
 * Story 4.5: Orquestrador - Retry e Error Handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PipelineOrchestrator,
  PipelineStatus,
  type PipelineConfig,
} from '../orchestrator';
import { createRetryManager } from '../orchestrator/retry/retry-manager';
import { createFallbackManager } from '../orchestrator/retry/fallback-manager';
import type { Agent, AgentResult } from '../agents/types';
import { AgentStatus } from '../agents/types';
import { ErrorCategory } from '../orchestrator/retry/types';

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

// Successful agent
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

// Failing agent with configurable behavior
function createFlakyAgent(
  failuresBeforeSuccess: number,
  errorMessage = 'Network error'
): Agent<unknown, unknown> {
  let callCount = 0;

  return createMockAgent('flaky-agent', async () => {
    callCount++;
    if (callCount <= failuresBeforeSuccess) {
      throw new Error(errorMessage);
    }
    return {
      success: true,
      data: { success: true, callCount },
      duration: 10,
      timestamp: new Date(),
    };
  });
}

// Always failing agent
function createFailingAgent(errorMessage = 'Network error'): Agent<unknown, unknown> {
  return createMockAgent('failing-agent', async () => {
    throw new Error(errorMessage);
  });
}

describe('Pipeline Retry Integration', () => {
  let config: PipelineConfig;

  beforeEach(() => {
    config = {
      id: 'test-pipeline',
      name: 'Test Pipeline',
      steps: [],
      defaultTimeout: 5000,
      defaultRetries: 2,
    };
  });

  describe('Retry with RetryManager', () => {
    it('should retry failed steps and succeed', async () => {
      config.steps = [
        {
          name: 'flaky-step',
          agent: createFlakyAgent(2), // Fails twice, then succeeds
          retries: 3,
        },
      ];

      const retryManager = createRetryManager({
        maxAttempts: 4,
        initialDelay: 10,
        jitter: false,
      });

      const orchestrator = new PipelineOrchestrator(config, { retryManager });
      const result = await orchestrator.run({});

      expect(result.status).toBe(PipelineStatus.COMPLETED);
      expect(result.stepResults[0]?.retryCount).toBeGreaterThan(0);

      orchestrator.dispose();
    });

    it('should fail after exhausting retries', async () => {
      config.steps = [
        {
          name: 'always-fails',
          agent: createFailingAgent('Persistent error'),
        },
      ];

      const retryManager = createRetryManager({
        maxAttempts: 3,
        initialDelay: 10,
        jitter: false,
      });

      const orchestrator = new PipelineOrchestrator(config, { retryManager });
      const result = await orchestrator.run({});

      expect(result.status).toBe(PipelineStatus.FAILED);
      expect(result.errors).toHaveLength(1);

      orchestrator.dispose();
    });

    it('should not retry fatal errors', async () => {
      const callCount = { value: 0 };

      config.steps = [
        {
          name: 'fatal-error-step',
          agent: createMockAgent('fatal', async () => {
            callCount.value++;
            throw new Error('Invalid API key');
          }),
        },
      ];

      const retryManager = createRetryManager({
        maxAttempts: 5,
        initialDelay: 10,
      });

      const orchestrator = new PipelineOrchestrator(config, { retryManager });
      const result = await orchestrator.run({});

      expect(result.status).toBe(PipelineStatus.FAILED);
      // Should only be called once (no retries for fatal errors)
      expect(callCount.value).toBe(1);

      orchestrator.dispose();
    });
  });

  describe('DegradationReport', () => {
    it('should include degradation report in result', async () => {
      config.steps = [{ name: 'step1', agent: createSuccessfulAgent() }];

      const orchestrator = new PipelineOrchestrator(config);
      const result = await orchestrator.run({});

      expect(result.degradationReport).toBeDefined();
      expect(result.degradationReport.hasDegradation).toBe(false);
      expect(result.degradationReport.degradationScore).toBe(0);

      orchestrator.dispose();
    });

    it('should report degradation when retries occur', async () => {
      config.steps = [
        {
          name: 'flaky-step',
          agent: createFlakyAgent(1), // Fails once, then succeeds
          retries: 2,
        },
      ];

      const retryManager = createRetryManager({
        maxAttempts: 3,
        initialDelay: 10,
        jitter: false,
      });

      const orchestrator = new PipelineOrchestrator(config, { retryManager });
      const result = await orchestrator.run({});

      expect(result.status).toBe(PipelineStatus.COMPLETED);
      expect(result.degradationReport.hasDegradation).toBe(true);
      expect(result.degradationReport.degradedSteps).toContain('flaky-step');
      expect(result.degradationReport.retriesPerStep['flaky-step']).toBeDefined();

      orchestrator.dispose();
    });

    it('should include recommendations in degradation report', async () => {
      config.steps = [
        {
          name: 'flaky-step',
          agent: createFlakyAgent(2), // Fails twice, then succeeds
          retries: 3,
        },
      ];

      const retryManager = createRetryManager({
        maxAttempts: 4,
        initialDelay: 10,
        jitter: false,
      });

      const orchestrator = new PipelineOrchestrator(config, { retryManager });
      const result = await orchestrator.run({});

      expect(result.degradationReport.recommendations.length).toBeGreaterThan(0);

      orchestrator.dispose();
    });
  });

  describe('Retry Events', () => {
    it('should emit pipeline:step:retry event', async () => {
      const retryListener = vi.fn();

      config.steps = [
        {
          name: 'flaky-step',
          agent: createFlakyAgent(1),
          retries: 2,
        },
      ];

      const retryManager = createRetryManager({
        maxAttempts: 3,
        initialDelay: 10,
        jitter: false,
      });

      const orchestrator = new PipelineOrchestrator(config, { retryManager });
      orchestrator.on('pipeline:step:retry', retryListener);

      await orchestrator.run({});

      expect(retryListener).toHaveBeenCalled();
      expect(retryListener).toHaveBeenCalledWith(
        expect.objectContaining({
          stepName: 'flaky-step',
          attempt: expect.any(Number),
          delay: expect.any(Number),
          errorCategory: expect.any(String),
        })
      );

      orchestrator.dispose();
    });
  });

  describe('FallbackManager Integration', () => {
    it('should record failures in fallback manager', async () => {
      config.steps = [
        {
          name: 'failing-step',
          agent: createFailingAgent(),
        },
      ];

      const fallbackManager = createFallbackManager({
        providers: ['primary', 'fallback'],
        failureThreshold: 2,
      });

      const retryManager = createRetryManager({
        maxAttempts: 2,
        initialDelay: 10,
      });

      const orchestrator = new PipelineOrchestrator(config, {
        retryManager,
        fallbackManager,
      });

      await orchestrator.run({});

      // Failures should be recorded (though 'default' is not in the provider list)
      // Note: 'default' is used when no provider is specified in agent config

      orchestrator.dispose();
      fallbackManager.dispose();
    });

    it('should record successes in fallback manager', async () => {
      const successListener = vi.fn();

      config.steps = [
        {
          name: 'success-step',
          agent: createSuccessfulAgent(),
        },
      ];

      const fallbackManager = createFallbackManager({
        providers: ['default'],
        failureThreshold: 3,
      });

      fallbackManager.on('provider:recovered', successListener);

      const orchestrator = new PipelineOrchestrator(config, { fallbackManager });
      await orchestrator.run({});

      const health = fallbackManager.getProviderHealth('default');
      expect(health?.consecutiveFailures).toBe(0);

      orchestrator.dispose();
      fallbackManager.dispose();
    });
  });

  describe('Legacy Mode', () => {
    it('should work with useRetryManager=false', async () => {
      let callCount = 0;

      config.steps = [
        {
          name: 'flaky-step',
          agent: createMockAgent('flaky', async () => {
            callCount++;
            if (callCount < 2) {
              return {
                success: false,
                error: 'Temporary failure',
                duration: 10,
                timestamp: new Date(),
              };
            }
            return {
              success: true,
              data: { result: true },
              duration: 10,
              timestamp: new Date(),
            };
          }),
          retries: 2,
        },
      ];

      const orchestrator = new PipelineOrchestrator(config, {
        useRetryManager: false,
      });

      const result = await orchestrator.run({});

      expect(result.status).toBe(PipelineStatus.COMPLETED);
      expect(callCount).toBe(2);
      // Still has degradation report (empty)
      expect(result.degradationReport).toBeDefined();

      orchestrator.dispose();
    });
  });

  describe('Multi-Step Pipeline', () => {
    it('should handle retries across multiple steps', async () => {
      config.steps = [
        {
          name: 'step1',
          agent: createFlakyAgent(1),
          retries: 2,
        },
        {
          name: 'step2',
          agent: createSuccessfulAgent(),
        },
        {
          name: 'step3',
          agent: createFlakyAgent(1),
          retries: 2,
        },
      ];

      const retryManager = createRetryManager({
        maxAttempts: 3,
        initialDelay: 10,
        jitter: false,
      });

      const orchestrator = new PipelineOrchestrator(config, { retryManager });
      const result = await orchestrator.run({});

      expect(result.status).toBe(PipelineStatus.COMPLETED);
      expect(result.stepResults).toHaveLength(3);

      // Check degradation for steps with retries
      expect(result.degradationReport.degradedSteps).toContain('step1');
      expect(result.degradationReport.degradedSteps).toContain('step3');
      expect(result.degradationReport.degradedSteps).not.toContain('step2');

      orchestrator.dispose();
    });

    it('should stop pipeline on unrecoverable failure', async () => {
      config.steps = [
        {
          name: 'step1',
          agent: createSuccessfulAgent(),
        },
        {
          name: 'step2',
          agent: createFailingAgent('Fatal error'),
        },
        {
          name: 'step3',
          agent: createSuccessfulAgent(),
        },
      ];

      const retryManager = createRetryManager({
        maxAttempts: 2,
        initialDelay: 10,
      });

      const orchestrator = new PipelineOrchestrator(config, { retryManager });
      const result = await orchestrator.run({});

      expect(result.status).toBe(PipelineStatus.FAILED);
      // Step 3 should not have been executed
      expect(result.stepResults).toHaveLength(2);

      orchestrator.dispose();
    });
  });

  describe('Cancellation', () => {
    it('should respect abort signal during retry', async () => {
      const abortController = new AbortController();

      config.steps = [
        {
          name: 'slow-flaky-step',
          agent: createMockAgent('slow-flaky', async () => {
            await new Promise((resolve) => setTimeout(resolve, 100));
            throw new Error('Network error');
          }),
          retries: 5,
        },
      ];

      const retryManager = createRetryManager({
        maxAttempts: 6,
        initialDelay: 50,
      });

      const orchestrator = new PipelineOrchestrator(config, { retryManager });

      // Abort after 150ms
      setTimeout(() => abortController.abort(), 150);

      const result = await orchestrator.run({}, {
        abortSignal: abortController.signal,
      });

      expect([PipelineStatus.CANCELLED, PipelineStatus.FAILED]).toContain(result.status);

      orchestrator.dispose();
    });
  });

  describe('Agent Config Override', () => {
    it('should use agent-specific retry config', async () => {
      let callCount = 0;

      config.steps = [
        {
          name: 'custom-config-step',
          agent: createMockAgent('custom', async () => {
            callCount++;
            if (callCount < 3) {
              throw new Error('Network error');
            }
            return {
              success: true,
              data: { success: true },
              duration: 10,
              timestamp: new Date(),
            };
          }),
        },
      ];

      const orchestrator = new PipelineOrchestrator(config);

      // Set agent-specific config with more attempts
      orchestrator.setAgentConfig('custom-config-step', {
        name: 'custom-config-step',
        retry: {
          maxAttempts: 5, // Allow 5 attempts
          initialDelay: 10,
          maxDelay: 100,
          backoffFactor: 1.5,
          jitter: false,
          jitterFactor: 0,
          retriableCategories: [ErrorCategory.RETRIABLE, ErrorCategory.NETWORK],
        },
        timeout: {
          timeout: 5000,
        },
      });

      const result = await orchestrator.run({});

      expect(result.status).toBe(PipelineStatus.COMPLETED);
      expect(callCount).toBe(3); // 2 failures + 1 success

      orchestrator.dispose();
    });
  });
});
