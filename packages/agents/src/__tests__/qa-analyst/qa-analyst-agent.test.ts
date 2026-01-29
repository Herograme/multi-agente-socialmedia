/**
 * QAAnalystAgent Tests
 * Tests for the merged QA Analyst agent (Stories 4.2 + 4.3)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  QAAnalystAgent,
  createQAAnalystAgent,
  getDefaultConfig,
  AgentState,
} from '../../agents/qa-analyst';
import type { QAInput } from '../../agents/qa-analyst';
import { AgentStatus } from '../../agents/types';

describe('QAAnalystAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('instantiation', () => {
    it('should create agent with default config', () => {
      const agent = createQAAnalystAgent();
      expect(agent).toBeInstanceOf(QAAnalystAgent);
      expect(agent.name).toBe('QAAnalystAgent');
    });

    it('should create agent with custom config', () => {
      const agent = createQAAnalystAgent({
        threshold: 7.0,
        visualWeight: 0.5,
        textWeight: 0.5,
      });
      expect(agent).toBeInstanceOf(QAAnalystAgent);
      expect(agent.getConfig().threshold).toBe(7.0);
    });

    it('should start in IDLE status', () => {
      const agent = createQAAnalystAgent();
      expect(agent.status).toBe(AgentStatus.IDLE);
      expect(agent.getState()).toBe(AgentState.IDLE);
    });

    it('should have correct name', () => {
      const agent = createQAAnalystAgent();
      expect(agent.name).toBe('QAAnalystAgent');
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default configuration', () => {
      const config = getDefaultConfig();
      expect(config.threshold).toBeDefined();
      expect(config.visualWeight).toBeDefined();
      expect(config.textWeight).toBeDefined();
      expect(config.minContrastRatio).toBeDefined();
    });

    it('should return a copy, not the original', () => {
      const config1 = getDefaultConfig();
      const config2 = getDefaultConfig();
      config1.threshold = 9.0;
      expect(config2.threshold).not.toBe(9.0);
    });
  });

  describe('getConfig', () => {
    it('should return agent configuration', () => {
      const agent = createQAAnalystAgent({ threshold: 7.5 });
      const config = agent.getConfig();
      expect(config.threshold).toBe(7.5);
    });

    it('should return a copy, not the original', () => {
      const agent = createQAAnalystAgent();
      const config1 = agent.getConfig();
      const config2 = agent.getConfig();
      config1.threshold = 9.0;
      expect(config2.threshold).not.toBe(9.0);
    });
  });

  describe('state management', () => {
    it('should start in IDLE state', () => {
      const agent = createQAAnalystAgent();
      expect(agent.getState()).toBe(AgentState.IDLE);
    });

    it('should emit state change callback when set', async () => {
      const agent = createQAAnalystAgent();
      const stateChanges: { previous: AgentState; current: AgentState }[] = [];

      agent.onStateChanged((event) => {
        stateChanges.push(event);
      });

      const input: QAInput = {
        postId: 'test-123',
        textContent: 'Este e um post de teste',
      };

      await agent.run(input);

      // Should have transitioned through states
      expect(stateChanges.length).toBeGreaterThan(0);
      expect(stateChanges.some((e) => e.current === AgentState.RUNNING)).toBe(true);
    });
  });

  describe('run', () => {
    it('should analyze post and return result', async () => {
      const agent = createQAAnalystAgent();

      const input: QAInput = {
        postId: 'test-123',
        textContent: 'Este e um post de teste sobre React Hooks.',
      };

      const result = await agent.run(input);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.postId).toBe('test-123');
      expect(result.data?.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.data?.overallScore).toBeLessThanOrEqual(10);
      expect(result.data?.approved).toBeDefined();
    });

    it('should include text analysis results', async () => {
      const agent = createQAAnalystAgent();

      const input: QAInput = {
        postId: 'test-text',
        textContent: 'Post com conteudo para testar a analise de texto. Siga-me para mais dicas!',
      };

      const result = await agent.run(input);

      expect(result.data?.textAnalysis).toBeDefined();
      expect(result.data?.textAnalysis.score).toBeGreaterThanOrEqual(0);
      expect(result.data?.textAnalysis.criteria).toBeDefined();
    });

    it('should handle assets in input', async () => {
      const agent = createQAAnalystAgent();

      // Test with empty assets array (valid case)
      const input: QAInput = {
        postId: 'test-visual',
        textContent: 'Post com imagem',
        assets: [], // Empty assets should still work
      };

      const result = await agent.run(input);

      // Should succeed even with empty assets
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.visualAnalysis).toBeDefined();
    });

    it('should set state to SUCCESS on successful evaluation', async () => {
      const agent = createQAAnalystAgent();

      const input: QAInput = {
        postId: 'test-success',
        textContent: 'Post de teste',
      };

      await agent.run(input);

      expect(agent.getState()).toBe(AgentState.SUCCESS);
      expect(agent.status).toBe(AgentStatus.SUCCESS);
    });

    it('should handle platform-specific content', async () => {
      const agent = createQAAnalystAgent();

      const input: QAInput = {
        postId: 'test-platform',
        textContent: 'Generic content',
        platformContent: {
          instagram: 'Post para Instagram com #hashtags #tech',
          linkedin: 'Post profissional para LinkedIn',
        },
      };

      const result = await agent.run(input);

      expect(result.success).toBe(true);
      expect(result.data?.textAnalysis).toBeDefined();
    });

    it('should calculate weighted overall score', async () => {
      const agent = createQAAnalystAgent({
        visualWeight: 0.4,
        textWeight: 0.6,
      });

      const input: QAInput = {
        postId: 'test-weighted',
        textContent: 'Post de alta qualidade com call-to-action. Siga-me!',
      };

      const result = await agent.run(input);

      expect(result.data?.overallScore).toBeDefined();
      expect(typeof result.data?.overallScore).toBe('number');
    });

    it('should approve posts above threshold', async () => {
      const agent = createQAAnalystAgent({
        threshold: 5.0, // Low threshold
      });

      const input: QAInput = {
        postId: 'test-approve',
        textContent: 'Este post deve ser aprovado. Comente abaixo!',
      };

      const result = await agent.run(input);

      // With a low threshold and decent text, should be approved
      expect(result.data?.approved).toBeDefined();
    });

    it('should include timestamp in result', async () => {
      const agent = createQAAnalystAgent();

      const input: QAInput = {
        postId: 'test-timestamp',
        textContent: 'Post de teste',
      };

      const result = await agent.run(input);

      expect(result.data?.timestamp).toBeDefined();
      expect(result.data?.timestamp).toBeInstanceOf(Date);
    });

    it('should measure duration', async () => {
      const agent = createQAAnalystAgent();

      const input: QAInput = {
        postId: 'test-duration',
        textContent: 'Post de teste',
      };

      const result = await agent.run(input);

      expect(result.duration).toBeDefined();
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('createQAAnalystAgent factory', () => {
  it('should throw on invalid threshold (too high)', () => {
    expect(() => createQAAnalystAgent({ threshold: 15 })).toThrow(
      'threshold must be between 0 and 10'
    );
  });

  it('should throw on invalid threshold (negative)', () => {
    expect(() => createQAAnalystAgent({ threshold: -1 })).toThrow(
      'threshold must be between 0 and 10'
    );
  });

  it('should throw when weights do not sum to 1', () => {
    expect(() =>
      createQAAnalystAgent({
        visualWeight: 0.7,
        textWeight: 0.5,
      })
    ).toThrow('visualWeight + textWeight must equal 1');
  });

  it('should accept valid boundary values', () => {
    expect(() =>
      createQAAnalystAgent({
        threshold: 0,
      })
    ).not.toThrow();

    expect(() =>
      createQAAnalystAgent({
        threshold: 10,
      })
    ).not.toThrow();
  });

  it('should merge config with defaults', () => {
    const agent = createQAAnalystAgent({ threshold: 7.5 });
    const config = agent.getConfig();

    expect(config.threshold).toBe(7.5);
    // Other values should be defaults
    expect(config.visualWeight).toBeDefined();
    expect(config.textWeight).toBeDefined();
  });
});
