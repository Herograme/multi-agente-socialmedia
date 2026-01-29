/**
 * WebSocket Handlers Tests
 *
 * Tests for the WebSocket message handler functionality.
 *
 * @see Story 5.1 - WebSocket Server para Real-Time
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocket } from 'ws';
import { ConnectionManager } from '../../websocket/connection-manager';
import {
  handleMessage,
  clearRateLimits,
  clearRateLimitForConnection,
  getRateLimitInfo,
  validateMessage,
} from '../../websocket/handlers';
import { WSClientMessage, WSEventType } from '../../websocket/types';

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

// Mock logger
const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn(() => mockLogger),
} as unknown as import('fastify').FastifyBaseLogger;

describe('WebSocket Handlers', () => {
  let manager: ConnectionManager;
  let mockWs: MockWebSocket;

  beforeEach(() => {
    ConnectionManager.resetInstance();
    clearRateLimits();
    manager = ConnectionManager.getInstance();
    mockWs = new MockWebSocket();
    manager.addConnection(mockWs as unknown as WebSocket, 'conn-1');
    vi.clearAllMocks();
  });

  afterEach(() => {
    ConnectionManager.resetInstance();
    clearRateLimits();
  });

  describe('handleMessage', () => {
    describe('subscribe', () => {
      it('should handle subscribe message', () => {
        handleMessage(
          mockWs as unknown as WebSocket,
          'conn-1',
          { type: WSClientMessage.SUBSCRIBE, payload: { executionId: 'exec-123' } },
          mockLogger
        );

        const connection = manager.getConnection('conn-1');
        expect(connection?.subscriptions.executionId).toBe('exec-123');

        // Should send confirmation
        expect(mockWs.sentMessages).toHaveLength(1);
        const response = mockWs.sentMessages[0] as { type: string };
        expect(response.type).toBe(WSEventType.HEARTBEAT);
      });

      it('should handle subscribe with event filter', () => {
        handleMessage(
          mockWs as unknown as WebSocket,
          'conn-1',
          {
            type: WSClientMessage.SUBSCRIBE,
            payload: { events: [WSEventType.PIPELINE_START, WSEventType.PIPELINE_COMPLETE] },
          },
          mockLogger
        );

        const connection = manager.getConnection('conn-1');
        expect(connection?.subscriptions.events).toEqual([
          WSEventType.PIPELINE_START,
          WSEventType.PIPELINE_COMPLETE,
        ]);
      });

      it('should handle subscribe without payload', () => {
        handleMessage(
          mockWs as unknown as WebSocket,
          'conn-1',
          { type: WSClientMessage.SUBSCRIBE },
          mockLogger
        );

        // Should not throw
        expect(mockWs.sentMessages).toHaveLength(1);
      });
    });

    describe('unsubscribe', () => {
      it('should handle unsubscribe message', () => {
        // First subscribe
        manager.updateSubscriptions('conn-1', { executionId: 'exec-123' });

        handleMessage(
          mockWs as unknown as WebSocket,
          'conn-1',
          { type: WSClientMessage.UNSUBSCRIBE },
          mockLogger
        );

        const connection = manager.getConnection('conn-1');
        expect(connection?.subscriptions).toEqual({});

        // Should send confirmation
        expect(mockWs.sentMessages).toHaveLength(1);
      });
    });

    describe('ping', () => {
      it('should respond to ping with pong', () => {
        handleMessage(
          mockWs as unknown as WebSocket,
          'conn-1',
          { type: WSClientMessage.PING },
          mockLogger
        );

        expect(mockWs.sentMessages).toHaveLength(1);
        const response = mockWs.sentMessages[0] as { type: string; payload: { status: string } };
        expect(response.type).toBe(WSEventType.HEARTBEAT);
        expect(response.payload.status).toBe('pong');
      });

      it('should mark connection as alive on ping', () => {
        manager.markDead('conn-1');

        handleMessage(
          mockWs as unknown as WebSocket,
          'conn-1',
          { type: WSClientMessage.PING },
          mockLogger
        );

        const connection = manager.getConnection('conn-1');
        expect(connection?.isAlive).toBe(true);
      });
    });

    describe('get_status', () => {
      it('should return connection status', () => {
        handleMessage(
          mockWs as unknown as WebSocket,
          'conn-1',
          { type: WSClientMessage.GET_STATUS },
          mockLogger
        );

        expect(mockWs.sentMessages).toHaveLength(1);
        const response = mockWs.sentMessages[0] as {
          type: string;
          payload: { status: string; connectionId: string; totalConnections: number };
        };
        expect(response.type).toBe(WSEventType.HEARTBEAT);
        expect(response.payload.status).toBe('connected');
        expect(response.payload.connectionId).toBe('conn-1');
        expect(response.payload.totalConnections).toBe(1);
      });
    });

    describe('unknown message type', () => {
      it('should send error for unknown message type', () => {
        handleMessage(
          mockWs as unknown as WebSocket,
          'conn-1',
          { type: 'unknown_type' as WSClientMessage },
          mockLogger
        );

        expect(mockWs.sentMessages).toHaveLength(1);
        const response = mockWs.sentMessages[0] as { type: string; payload: { error: string } };
        expect(response.type).toBe(WSEventType.ERROR);
        expect(response.payload.error).toContain('Unknown message type');
      });
    });
  });

  describe('rate limiting', () => {
    it('should allow messages within rate limit', () => {
      for (let i = 0; i < 10; i++) {
        handleMessage(
          mockWs as unknown as WebSocket,
          'conn-1',
          { type: WSClientMessage.PING },
          mockLogger
        );
      }

      // All 10 should have been processed (10 pong responses)
      expect(mockWs.sentMessages).toHaveLength(10);
    });

    it('should block messages exceeding rate limit', () => {
      // Send more messages than the rate limit allows
      for (let i = 0; i < 70; i++) {
        handleMessage(
          mockWs as unknown as WebSocket,
          'conn-1',
          { type: WSClientMessage.PING },
          mockLogger
        );
      }

      // Should have 60 successful + 10 rate limit errors
      const errorMessages = mockWs.sentMessages.filter(
        (msg) => (msg as { type: string }).type === WSEventType.ERROR
      );
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    it('should track rate limit info per connection', () => {
      handleMessage(
        mockWs as unknown as WebSocket,
        'conn-1',
        { type: WSClientMessage.PING },
        mockLogger
      );

      const info = getRateLimitInfo('conn-1');
      expect(info).toBeDefined();
      expect(info?.count).toBe(1);
    });

    it('should clear rate limit for specific connection', () => {
      handleMessage(
        mockWs as unknown as WebSocket,
        'conn-1',
        { type: WSClientMessage.PING },
        mockLogger
      );

      clearRateLimitForConnection('conn-1');
      const info = getRateLimitInfo('conn-1');
      expect(info).toBeUndefined();
    });

    it('should clear all rate limits', () => {
      handleMessage(
        mockWs as unknown as WebSocket,
        'conn-1',
        { type: WSClientMessage.PING },
        mockLogger
      );

      clearRateLimits();
      const info = getRateLimitInfo('conn-1');
      expect(info).toBeUndefined();
    });
  });

  describe('validateMessage', () => {
    it('should validate correct message', () => {
      const result = validateMessage({ type: WSClientMessage.PING });
      expect(result).toEqual({ type: WSClientMessage.PING, payload: undefined });
    });

    it('should validate message with payload', () => {
      const result = validateMessage({
        type: WSClientMessage.SUBSCRIBE,
        payload: { executionId: 'exec-123' },
      });
      expect(result).toEqual({
        type: WSClientMessage.SUBSCRIBE,
        payload: { executionId: 'exec-123' },
      });
    });

    it('should reject null data', () => {
      expect(validateMessage(null)).toBeNull();
    });

    it('should reject non-object data', () => {
      expect(validateMessage('string')).toBeNull();
      expect(validateMessage(123)).toBeNull();
    });

    it('should reject message without type', () => {
      expect(validateMessage({ payload: {} })).toBeNull();
    });

    it('should reject message with non-string type', () => {
      expect(validateMessage({ type: 123 })).toBeNull();
    });

    it('should reject message with invalid type', () => {
      expect(validateMessage({ type: 'invalid_type' })).toBeNull();
    });

    it('should accept all valid message types', () => {
      expect(validateMessage({ type: WSClientMessage.SUBSCRIBE })).not.toBeNull();
      expect(validateMessage({ type: WSClientMessage.UNSUBSCRIBE })).not.toBeNull();
      expect(validateMessage({ type: WSClientMessage.PING })).not.toBeNull();
      expect(validateMessage({ type: WSClientMessage.GET_STATUS })).not.toBeNull();
    });
  });
});
