/**
 * PipelineEventEmitter Tests
 *
 * Tests for the pipeline event emission functionality.
 *
 * @see Story 5.1 - WebSocket Server para Real-Time
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WebSocket } from 'ws';
import { ConnectionManager } from '../../websocket/connection-manager';
import {
  PipelineEventEmitter,
  getPipelineEventEmitter,
  PIPELINE_AGENTS,
} from '../../websocket/pipeline-emitter';
import { WSEventType } from '../../websocket/types';

// Mock WebSocket class
class MockWebSocket {
  readyState = WebSocket.OPEN;
  sentMessages: unknown[] = [];

  send(data: string): void {
    this.sentMessages.push(JSON.parse(data));
  }

  close(_code?: number, _reason?: string): void {
    this.readyState = WebSocket.CLOSED;
  }

  ping(): void {
    // Mock ping
  }
}

describe('PipelineEventEmitter', () => {
  let emitter: PipelineEventEmitter;
  let manager: ConnectionManager;
  let mockWs: MockWebSocket;

  beforeEach(() => {
    ConnectionManager.resetInstance();
    PipelineEventEmitter.resetInstance();
    manager = ConnectionManager.getInstance();
    mockWs = new MockWebSocket();
    manager.addConnection(mockWs as unknown as WebSocket, 'conn-1');
    emitter = PipelineEventEmitter.getInstance();
  });

  afterEach(() => {
    ConnectionManager.resetInstance();
    PipelineEventEmitter.resetInstance();
  });

  describe('singleton pattern', () => {
    it('should return same instance', () => {
      const emitter1 = PipelineEventEmitter.getInstance();
      const emitter2 = PipelineEventEmitter.getInstance();
      expect(emitter1).toBe(emitter2);
    });

    it('should reset instance properly', () => {
      const emitter1 = PipelineEventEmitter.getInstance();
      PipelineEventEmitter.resetInstance();
      const emitter2 = PipelineEventEmitter.getInstance();
      expect(emitter1).not.toBe(emitter2);
    });

    it('should have getPipelineEventEmitter helper', () => {
      const emitterFromHelper = getPipelineEventEmitter();
      expect(emitterFromHelper).toBe(emitter);
    });
  });

  describe('PIPELINE_AGENTS', () => {
    it('should have correct number of agents', () => {
      expect(PIPELINE_AGENTS.length).toBe(8);
    });

    it('should include researcher agent', () => {
      const researcher = PIPELINE_AGENTS.find((a) => a.id === 'researcher');
      expect(researcher).toBeDefined();
      expect(researcher?.name).toBe('Pesquisador');
    });
  });

  describe('emitPipelineStart', () => {
    it('should broadcast pipeline:start event', () => {
      emitter.emitPipelineStart('exec-123', {
        numPosts: 3,
        platforms: ['instagram'],
        includeVisual: true,
        qualityThreshold: 6.0,
      });

      expect(mockWs.sentMessages).toHaveLength(1);
      const event = mockWs.sentMessages[0] as { type: string; payload: Record<string, unknown> };
      expect(event.type).toBe(WSEventType.PIPELINE_START);
      expect(event.payload.executionId).toBe('exec-123');
      expect(event.payload.totalAgents).toBe(8);
    });

    it('should include config in payload', () => {
      emitter.emitPipelineStart('exec-123', {
        numPosts: 5,
        platforms: ['instagram', 'linkedin'],
        includeVisual: false,
        qualityThreshold: 7.0,
      });

      const event = mockWs.sentMessages[0] as { payload: { config: Record<string, unknown> } };
      expect(event.payload.config.numPosts).toBe(5);
      expect(event.payload.config.platforms).toEqual(['instagram', 'linkedin']);
      expect(event.payload.config.includeVisual).toBe(false);
      expect(event.payload.config.qualityThreshold).toBe(7.0);
    });
  });

  describe('emitAgentStart', () => {
    it('should broadcast agent:start event', () => {
      emitter.emitAgentStart('exec-123', 'researcher', 'Pesquisador');

      expect(mockWs.sentMessages).toHaveLength(1);
      const event = mockWs.sentMessages[0] as { type: string; payload: Record<string, unknown> };
      expect(event.type).toBe(WSEventType.AGENT_START);
      expect(event.payload.agentId).toBe('researcher');
      expect(event.payload.agentName).toBe('Pesquisador');
      expect(event.payload.agentIndex).toBe(0);
    });

    it('should find correct agent index', () => {
      emitter.emitAgentStart('exec-123', 'curator', 'Curador');

      const event = mockWs.sentMessages[0] as { payload: { agentIndex: number } };
      expect(event.payload.agentIndex).toBe(2); // curator is at index 2
    });

    it('should default to index 0 for unknown agents', () => {
      emitter.emitAgentStart('exec-123', 'unknown-agent', 'Unknown');

      const event = mockWs.sentMessages[0] as { payload: { agentIndex: number } };
      expect(event.payload.agentIndex).toBe(0);
    });
  });

  describe('emitAgentProgress', () => {
    it('should broadcast agent:progress event', () => {
      emitter.emitAgentProgress('exec-123', 'researcher', 50, 'Processing...');

      expect(mockWs.sentMessages).toHaveLength(1);
      const event = mockWs.sentMessages[0] as { type: string; payload: Record<string, unknown> };
      expect(event.type).toBe(WSEventType.AGENT_PROGRESS);
      expect(event.payload.agentId).toBe('researcher');
      expect(event.payload.progress).toBe(50);
      expect(event.payload.message).toBe('Processing...');
    });

    it('should clamp progress to 0-100', () => {
      emitter.emitAgentProgress('exec-123', 'researcher', 150, 'Testing');

      const event = mockWs.sentMessages[0] as { payload: { progress: number } };
      expect(event.payload.progress).toBe(100); // Clamped to max

      mockWs.sentMessages = [];
      emitter.emitAgentProgress('exec-123', 'researcher', -50, 'Testing');

      const event2 = mockWs.sentMessages[0] as { payload: { progress: number } };
      expect(event2.payload.progress).toBe(0); // Clamped to min
    });

    it('should include optional data', () => {
      emitter.emitAgentProgress('exec-123', 'researcher', 50, 'Processing...', { extra: 'data' });

      const event = mockWs.sentMessages[0] as { payload: { data: unknown } };
      expect(event.payload.data).toEqual({ extra: 'data' });
    });
  });

  describe('emitAgentComplete', () => {
    it('should broadcast agent:complete event', () => {
      emitter.emitAgentComplete('exec-123', 'researcher', 'Pesquisador', 5000, {
        itemsProcessed: 10,
      });

      expect(mockWs.sentMessages).toHaveLength(1);
      const event = mockWs.sentMessages[0] as { type: string; payload: Record<string, unknown> };
      expect(event.type).toBe(WSEventType.AGENT_COMPLETE);
      expect(event.payload.agentId).toBe('researcher');
      expect(event.payload.duration).toBe(5000);
      expect(event.payload.success).toBe(true);
    });

    it('should include result in payload', () => {
      emitter.emitAgentComplete('exec-123', 'researcher', 'Pesquisador', 5000, {
        itemsProcessed: 10,
        summary: 'Found 10 articles',
      });

      const event = mockWs.sentMessages[0] as { payload: { result: Record<string, unknown> } };
      expect(event.payload.result?.itemsProcessed).toBe(10);
      expect(event.payload.result?.summary).toBe('Found 10 articles');
    });
  });

  describe('emitAgentError', () => {
    it('should broadcast agent:error event', () => {
      emitter.emitAgentError(
        'exec-123',
        'researcher',
        'Pesquisador',
        'API timeout',
        true,
        1,
        3
      );

      expect(mockWs.sentMessages).toHaveLength(1);
      const event = mockWs.sentMessages[0] as { type: string; payload: Record<string, unknown> };
      expect(event.type).toBe(WSEventType.AGENT_ERROR);
      expect(event.payload.agentId).toBe('researcher');
      expect(event.payload.error).toBe('API timeout');
      expect(event.payload.willRetry).toBe(true);
      expect(event.payload.retryCount).toBe(1);
      expect(event.payload.maxRetries).toBe(3);
    });

    it('should handle non-retry errors', () => {
      emitter.emitAgentError(
        'exec-123',
        'researcher',
        'Pesquisador',
        'Fatal error',
        false
      );

      const event = mockWs.sentMessages[0] as { payload: { willRetry: boolean; retryCount?: number } };
      expect(event.payload.willRetry).toBe(false);
      expect(event.payload.retryCount).toBeUndefined();
    });
  });

  describe('emitPipelineComplete', () => {
    it('should broadcast pipeline:complete event', () => {
      emitter.emitPipelineComplete('exec-123', 'completed', 60000, {
        postsGenerated: 5,
        postsApproved: 4,
        averageScore: 8.2,
        agentsExecuted: 8,
        errorsCount: 0,
      });

      expect(mockWs.sentMessages).toHaveLength(1);
      const event = mockWs.sentMessages[0] as { type: string; payload: Record<string, unknown> };
      expect(event.type).toBe(WSEventType.PIPELINE_COMPLETE);
      expect(event.payload.executionId).toBe('exec-123');
      expect(event.payload.status).toBe('completed');
      expect(event.payload.duration).toBe(60000);
    });

    it('should include stats in payload', () => {
      emitter.emitPipelineComplete('exec-123', 'completed', 60000, {
        postsGenerated: 5,
        postsApproved: 4,
        averageScore: 8.2,
        agentsExecuted: 8,
        errorsCount: 0,
      });

      const event = mockWs.sentMessages[0] as { payload: { stats: Record<string, unknown> } };
      expect(event.payload.stats.postsGenerated).toBe(5);
      expect(event.payload.stats.postsApproved).toBe(4);
      expect(event.payload.stats.averageScore).toBe(8.2);
      expect(event.payload.stats.agentsExecuted).toBe(8);
      expect(event.payload.stats.errorsCount).toBe(0);
    });

    it('should handle failed status', () => {
      emitter.emitPipelineComplete('exec-123', 'failed', 30000, {
        postsGenerated: 0,
        postsApproved: 0,
        averageScore: 0,
        agentsExecuted: 2,
        errorsCount: 1,
      });

      const event = mockWs.sentMessages[0] as { payload: { status: string } };
      expect(event.payload.status).toBe('failed');
    });

    it('should handle cancelled status', () => {
      emitter.emitPipelineComplete('exec-123', 'cancelled', 15000, {
        postsGenerated: 2,
        postsApproved: 1,
        averageScore: 7.0,
        agentsExecuted: 4,
        errorsCount: 0,
      });

      const event = mockWs.sentMessages[0] as { payload: { status: string } };
      expect(event.payload.status).toBe('cancelled');
    });
  });

  describe('event timestamps', () => {
    it('should include ISO timestamp in all events', () => {
      const beforeTime = new Date().toISOString();

      emitter.emitPipelineStart('exec-123', {
        numPosts: 3,
        platforms: ['instagram'],
        includeVisual: true,
        qualityThreshold: 6.0,
      });

      const afterTime = new Date().toISOString();
      const event = mockWs.sentMessages[0] as { timestamp: string };

      expect(event.timestamp).toBeDefined();
      expect(event.timestamp >= beforeTime).toBe(true);
      expect(event.timestamp <= afterTime).toBe(true);
    });
  });

  describe('executionId filtering', () => {
    it('should include executionId in events', () => {
      emitter.emitAgentStart('exec-123', 'researcher', 'Pesquisador');

      const event = mockWs.sentMessages[0] as { executionId: string };
      expect(event.executionId).toBe('exec-123');
    });
  });
});
