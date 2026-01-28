import { describe, it, expect } from 'vitest';
import type { Trend } from '@social-content/shared';
import {
  CuradorAgent,
  createCuradorAgent,
  getDefaultConfig,
  AgentState,
} from '../agents/curador';
import type { ContentSource, StateChangeEvent } from '../agents/curador';

describe('CuradorAgent', () => {
  describe('instantiation', () => {
    it('should create agent with default config', () => {
      const agent = createCuradorAgent();
      expect(agent).toBeInstanceOf(CuradorAgent);
      expect(agent.name).toBe('CuradorAgent');
    });

    it('should create agent with custom config', () => {
      const agent = createCuradorAgent({
        minRelevanceScore: 70,
        maxResults: 50,
      });
      expect(agent).toBeInstanceOf(CuradorAgent);
    });

    it('should have correct name', () => {
      const agent = createCuradorAgent();
      expect(agent.name).toBe('CuradorAgent');
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default configuration', () => {
      const config = getDefaultConfig();
      expect(config).toEqual({
        sources: [],
        minRelevanceScore: 50,
        maxResults: 20,
        categories: ['tech', 'programming', 'ai'],
        rateLimitPerMinute: 60,
      });
    });

    it('should return a copy, not the original', () => {
      const config1 = getDefaultConfig();
      const config2 = getDefaultConfig();
      config1.minRelevanceScore = 100;
      expect(config2.minRelevanceScore).toBe(50);
    });
  });

  describe('getConfig', () => {
    it('should return agent configuration', () => {
      const agent = createCuradorAgent({ minRelevanceScore: 75 });
      const config = agent.getConfig();
      expect(config.minRelevanceScore).toBe(75);
    });

    it('should return a copy, not the original', () => {
      const agent = createCuradorAgent();
      const config1 = agent.getConfig();
      const config2 = agent.getConfig();
      config1.minRelevanceScore = 100;
      expect(config2.minRelevanceScore).toBe(50);
    });
  });

  describe('lifecycle', () => {
    it('should start in IDLE state', () => {
      const agent = createCuradorAgent();
      expect(agent.getState()).toBe(AgentState.IDLE);
    });

    it('should transition to RUNNING on start()', () => {
      const agent = createCuradorAgent();
      agent.start();
      expect(agent.getState()).toBe(AgentState.RUNNING);
    });

    it('should transition to IDLE on stop()', () => {
      const agent = createCuradorAgent();
      agent.start();
      expect(agent.getState()).toBe(AgentState.RUNNING);
      agent.stop();
      expect(agent.getState()).toBe(AgentState.IDLE);
    });

    it('should not change state if already IDLE on stop()', () => {
      const agent = createCuradorAgent();
      const stateChanges: StateChangeEvent[] = [];
      agent.on('stateChange', (event: StateChangeEvent) => {
        stateChanges.push(event);
      });
      agent.stop();
      expect(agent.getState()).toBe(AgentState.IDLE);
      // Should still emit (state to state transition)
      expect(stateChanges.length).toBe(1);
    });

    it('should only start from IDLE state', () => {
      const agent = createCuradorAgent();
      agent.start(); // IDLE -> RUNNING
      const stateChanges: StateChangeEvent[] = [];
      agent.on('stateChange', (event: StateChangeEvent) => {
        stateChanges.push(event);
      });
      agent.start(); // Should not change if already RUNNING
      expect(stateChanges.length).toBe(0);
    });

    it('should reset to IDLE state', () => {
      const agent = createCuradorAgent();
      agent.start();
      expect(agent.getState()).toBe(AgentState.RUNNING);
      agent.reset();
      expect(agent.getState()).toBe(AgentState.IDLE);
    });
  });

  describe('stateChange event', () => {
    it('should emit stateChange event on start()', () => {
      const agent = createCuradorAgent();
      const stateChanges: StateChangeEvent[] = [];

      agent.on('stateChange', (event: StateChangeEvent) => {
        stateChanges.push(event);
      });

      agent.start();

      expect(stateChanges).toHaveLength(1);
      expect(stateChanges[0]).toEqual({
        previous: AgentState.IDLE,
        current: AgentState.RUNNING,
      });
    });

    it('should emit stateChange event on stop()', () => {
      const agent = createCuradorAgent();
      agent.start();

      const stateChanges: StateChangeEvent[] = [];
      agent.on('stateChange', (event: StateChangeEvent) => {
        stateChanges.push(event);
      });

      agent.stop();

      expect(stateChanges).toHaveLength(1);
      expect(stateChanges[0]).toEqual({
        previous: AgentState.RUNNING,
        current: AgentState.IDLE,
      });
    });

    it('should emit multiple stateChange events during run()', async () => {
      const agent = createCuradorAgent();
      const stateChanges: StateChangeEvent[] = [];

      agent.on('stateChange', (event: StateChangeEvent) => {
        stateChanges.push(event);
      });

      const trends: Trend[] = [];
      await agent.run({ trends });

      expect(stateChanges.length).toBeGreaterThanOrEqual(2);
      expect(stateChanges[0]).toEqual({
        previous: AgentState.IDLE,
        current: AgentState.RUNNING,
      });
      expect(stateChanges[1]).toEqual({
        previous: AgentState.RUNNING,
        current: AgentState.SUCCESS,
      });
    });
  });

  describe('run()', () => {
    it('should return successful result with empty trends', async () => {
      const agent = createCuradorAgent();
      const result = await agent.run({ trends: [] });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.result.success).toBe(true);
      expect(result.data?.result.content).toEqual([]);
      expect(result.data?.state).toBe(AgentState.SUCCESS);
    });

    it('should include stats in result', async () => {
      const agent = createCuradorAgent();
      const trends: Trend[] = [
        {
          id: '1',
          title: 'Test Trend',
          source: 'test',
          url: 'https://test.com',
          discoveredAt: new Date(),
        },
      ];
      const result = await agent.run({ trends });

      expect(result.data?.result.stats).toEqual({
        totalProcessed: 1,
        totalCurated: 0,
        totalFiltered: 0,
        processingTimeMs: expect.any(Number),
      });
    });

    it('should include duration in result', async () => {
      const agent = createCuradorAgent();
      const result = await agent.run({ trends: [] });

      expect(result.duration).toBeDefined();
      expect(typeof result.duration).toBe('number');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should include timestamp in result', async () => {
      const agent = createCuradorAgent();
      const result = await agent.run({ trends: [] });

      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should set state to SUCCESS after successful run', async () => {
      const agent = createCuradorAgent();
      await agent.run({ trends: [] });

      expect(agent.getState()).toBe(AgentState.SUCCESS);
    });

    it('should sync status with state', async () => {
      const agent = createCuradorAgent();
      expect(agent.status).toBe('idle');

      agent.start();
      expect(agent.status).toBe('running');

      agent.stop();
      expect(agent.status).toBe('idle');
    });
  });

  describe('createCuradorAgent factory', () => {
    it('should throw on invalid minRelevanceScore (negative)', () => {
      expect(() => createCuradorAgent({ minRelevanceScore: -1 })).toThrow(
        'minRelevanceScore must be between 0 and 100'
      );
    });

    it('should throw on invalid minRelevanceScore (over 100)', () => {
      expect(() => createCuradorAgent({ minRelevanceScore: 101 })).toThrow(
        'minRelevanceScore must be between 0 and 100'
      );
    });

    it('should throw on invalid maxResults', () => {
      expect(() => createCuradorAgent({ maxResults: 0 })).toThrow(
        'maxResults must be at least 1'
      );
    });

    it('should throw on invalid rateLimitPerMinute', () => {
      expect(() => createCuradorAgent({ rateLimitPerMinute: 0 })).toThrow(
        'rateLimitPerMinute must be at least 1'
      );
    });

    it('should accept valid minRelevanceScore at boundaries', () => {
      expect(() => createCuradorAgent({ minRelevanceScore: 0 })).not.toThrow();
      expect(() => createCuradorAgent({ minRelevanceScore: 100 })).not.toThrow();
    });

    it('should merge config with defaults', () => {
      const agent = createCuradorAgent({ maxResults: 100 });
      const config = agent.getConfig();
      expect(config.maxResults).toBe(100);
      expect(config.minRelevanceScore).toBe(50); // default
      expect(config.categories).toEqual(['tech', 'programming', 'ai']); // default
    });

    it('should validate sources if provided', () => {
      const validSource: ContentSource = {
        id: 'test-source',
        name: 'Test Source',
        type: 'rss',
        url: 'https://test.com/rss',
        enabled: true,
        priority: 5,
      };

      expect(() =>
        createCuradorAgent({ sources: [validSource] })
      ).not.toThrow();
    });

    it('should throw on invalid source (missing id)', () => {
      const invalidSource = {
        name: 'Test Source',
        type: 'rss',
        url: 'https://test.com/rss',
        enabled: true,
        priority: 5,
      } as ContentSource;

      expect(() => createCuradorAgent({ sources: [invalidSource] })).toThrow(
        'Source at index 0: id is required and must be a string'
      );
    });

    it('should throw on invalid source (invalid type)', () => {
      const invalidSource = {
        id: 'test',
        name: 'Test Source',
        type: 'invalid' as 'rss',
        url: 'https://test.com/rss',
        enabled: true,
        priority: 5,
      };

      expect(() => createCuradorAgent({ sources: [invalidSource] })).toThrow(
        "Source at index 0: type must be 'rss', 'api', or 'scraper'"
      );
    });

    it('should throw on invalid source priority', () => {
      const invalidSource: ContentSource = {
        id: 'test',
        name: 'Test Source',
        type: 'rss',
        url: 'https://test.com/rss',
        enabled: true,
        priority: 11, // Invalid: must be 1-10
      };

      expect(() => createCuradorAgent({ sources: [invalidSource] })).toThrow(
        'Source at index 0: priority must be a number between 1 and 10'
      );
    });
  });

  describe('integration with @social-content/shared types', () => {
    it('should accept Trend objects as input', async () => {
      const agent = createCuradorAgent();
      const trends: Trend[] = [
        {
          id: 'trend-1',
          title: 'React 19 Features',
          description: 'New features in React 19',
          source: 'devto',
          url: 'https://dev.to/react19',
          discoveredAt: new Date(),
        },
        {
          id: 'trend-2',
          title: 'TypeScript 5.4',
          source: 'hackernews',
          url: 'https://hn.com/ts54',
          discoveredAt: new Date(),
        },
      ];

      const result = await agent.run({ trends });

      expect(result.success).toBe(true);
      expect(result.data?.result.stats.totalProcessed).toBe(2);
    });

    it('should process trends with options', async () => {
      const agent = createCuradorAgent();
      const trends: Trend[] = [
        {
          id: 'trend-1',
          title: 'AI News',
          source: 'reddit',
          url: 'https://reddit.com/ai',
          discoveredAt: new Date(),
        },
      ];

      const result = await agent.run({
        trends,
        options: {
          forceRefresh: true,
          filterCategories: ['ai'],
          minScore: 60,
        },
      });

      expect(result.success).toBe(true);
    });
  });
});
