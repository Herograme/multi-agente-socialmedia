/**
 * ConnectionManager Tests
 *
 * Tests for the WebSocket connection manager functionality.
 *
 * @see Story 5.1 - WebSocket Server para Real-Time
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WebSocket } from 'ws';
import { ConnectionManager } from '../../websocket/connection-manager';
import { WSEventType } from '../../websocket/types';

// Mock WebSocket class
class MockWebSocket {
  readyState = WebSocket.OPEN;
  sentMessages: string[] = [];

  send(data: string): void {
    this.sentMessages.push(data);
  }

  close(_code?: number, _reason?: string): void {
    this.readyState = WebSocket.CLOSED;
  }

  ping(): void {
    // Mock ping
  }
}

describe('ConnectionManager', () => {
  let manager: ConnectionManager;

  beforeEach(() => {
    ConnectionManager.resetInstance();
    manager = ConnectionManager.getInstance();
  });

  afterEach(() => {
    ConnectionManager.resetInstance();
  });

  describe('singleton pattern', () => {
    it('should return same instance on multiple calls', () => {
      const instance1 = ConnectionManager.getInstance();
      const instance2 = ConnectionManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should reset instance properly', () => {
      const instance1 = ConnectionManager.getInstance();
      ConnectionManager.resetInstance();
      const instance2 = ConnectionManager.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('addConnection', () => {
    it('should add a connection', () => {
      const ws = new MockWebSocket() as unknown as WebSocket;
      manager.addConnection(ws, 'conn-1');

      expect(manager.getConnectionCount()).toBe(1);
      expect(manager.getConnection('conn-1')).toBeDefined();
    });

    it('should track multiple connections', () => {
      const ws1 = new MockWebSocket() as unknown as WebSocket;
      const ws2 = new MockWebSocket() as unknown as WebSocket;

      manager.addConnection(ws1, 'conn-1');
      manager.addConnection(ws2, 'conn-2');

      expect(manager.getConnectionCount()).toBe(2);
    });
  });

  describe('removeConnection', () => {
    it('should remove a connection', () => {
      const ws = new MockWebSocket() as unknown as WebSocket;
      manager.addConnection(ws, 'conn-1');
      manager.removeConnection('conn-1');

      expect(manager.getConnectionCount()).toBe(0);
      expect(manager.getConnection('conn-1')).toBeUndefined();
    });

    it('should close the websocket when removing', () => {
      const ws = new MockWebSocket();
      manager.addConnection(ws as unknown as WebSocket, 'conn-1');
      manager.removeConnection('conn-1');

      expect(ws.readyState).toBe(WebSocket.CLOSED);
    });

    it('should handle removing non-existent connection gracefully', () => {
      expect(() => manager.removeConnection('non-existent')).not.toThrow();
    });
  });

  describe('broadcast', () => {
    it('should send event to all connections', () => {
      const ws1 = new MockWebSocket();
      const ws2 = new MockWebSocket();
      manager.addConnection(ws1 as unknown as WebSocket, 'conn-1');
      manager.addConnection(ws2 as unknown as WebSocket, 'conn-2');

      manager.broadcast({
        type: WSEventType.PIPELINE_START,
        payload: { test: true },
        timestamp: new Date().toISOString(),
      });

      expect(ws1.sentMessages).toHaveLength(1);
      expect(ws2.sentMessages).toHaveLength(1);
    });

    it('should filter by executionId subscription', () => {
      const ws1 = new MockWebSocket();
      const ws2 = new MockWebSocket();
      manager.addConnection(ws1 as unknown as WebSocket, 'conn-1');
      manager.addConnection(ws2 as unknown as WebSocket, 'conn-2');
      manager.updateSubscriptions('conn-1', { executionId: 'exec-123' });

      manager.broadcast({
        type: WSEventType.AGENT_START,
        payload: { test: true },
        timestamp: new Date().toISOString(),
        executionId: 'exec-456', // Different execution
      });

      expect(ws1.sentMessages).toHaveLength(0); // Filtered out
      expect(ws2.sentMessages).toHaveLength(1); // No filter
    });

    it('should filter by event type subscription', () => {
      const ws1 = new MockWebSocket();
      const ws2 = new MockWebSocket();
      manager.addConnection(ws1 as unknown as WebSocket, 'conn-1');
      manager.addConnection(ws2 as unknown as WebSocket, 'conn-2');
      manager.updateSubscriptions('conn-1', { events: [WSEventType.PIPELINE_START] });

      manager.broadcast({
        type: WSEventType.AGENT_START, // Not subscribed
        payload: { test: true },
        timestamp: new Date().toISOString(),
      });

      expect(ws1.sentMessages).toHaveLength(0); // Filtered out
      expect(ws2.sentMessages).toHaveLength(1); // No filter
    });

    it('should allow matching executionId through filter', () => {
      const ws = new MockWebSocket();
      manager.addConnection(ws as unknown as WebSocket, 'conn-1');
      manager.updateSubscriptions('conn-1', { executionId: 'exec-123' });

      manager.broadcast({
        type: WSEventType.AGENT_START,
        payload: { test: true },
        timestamp: new Date().toISOString(),
        executionId: 'exec-123', // Same execution
      });

      expect(ws.sentMessages).toHaveLength(1);
    });

    it('should not send to closed connections', () => {
      const ws = new MockWebSocket();
      ws.readyState = WebSocket.CLOSED;
      manager.addConnection(ws as unknown as WebSocket, 'conn-1');

      manager.broadcast({
        type: WSEventType.PIPELINE_START,
        payload: { test: true },
        timestamp: new Date().toISOString(),
      });

      expect(ws.sentMessages).toHaveLength(0);
    });
  });

  describe('sendTo', () => {
    it('should send event to specific connection', () => {
      const ws1 = new MockWebSocket();
      const ws2 = new MockWebSocket();
      manager.addConnection(ws1 as unknown as WebSocket, 'conn-1');
      manager.addConnection(ws2 as unknown as WebSocket, 'conn-2');

      const result = manager.sendTo('conn-1', {
        type: WSEventType.HEARTBEAT,
        payload: { test: true },
        timestamp: new Date().toISOString(),
      });

      expect(result).toBe(true);
      expect(ws1.sentMessages).toHaveLength(1);
      expect(ws2.sentMessages).toHaveLength(0);
    });

    it('should return false for non-existent connection', () => {
      const result = manager.sendTo('non-existent', {
        type: WSEventType.HEARTBEAT,
        payload: { test: true },
        timestamp: new Date().toISOString(),
      });

      expect(result).toBe(false);
    });

    it('should return false for closed connection', () => {
      const ws = new MockWebSocket();
      ws.readyState = WebSocket.CLOSED;
      manager.addConnection(ws as unknown as WebSocket, 'conn-1');

      const result = manager.sendTo('conn-1', {
        type: WSEventType.HEARTBEAT,
        payload: { test: true },
        timestamp: new Date().toISOString(),
      });

      expect(result).toBe(false);
    });
  });

  describe('getConnections', () => {
    it('should return connection info list', () => {
      const ws = new MockWebSocket() as unknown as WebSocket;
      manager.addConnection(ws, 'conn-1');

      const connections = manager.getConnections();

      expect(connections).toHaveLength(1);
      expect(connections[0].id).toBe('conn-1');
      expect(connections[0].isAlive).toBe(true);
      expect(connections[0].connectedAt).toBeDefined();
      expect(connections[0].lastPing).toBeDefined();
    });
  });

  describe('markAlive/markDead', () => {
    it('should mark connection as alive', () => {
      const ws = new MockWebSocket() as unknown as WebSocket;
      manager.addConnection(ws, 'conn-1');

      manager.markDead('conn-1');
      expect(manager.getConnection('conn-1')?.isAlive).toBe(false);

      manager.markAlive('conn-1');
      expect(manager.getConnection('conn-1')?.isAlive).toBe(true);
    });

    it('should track latency when marking alive', () => {
      const ws = new MockWebSocket() as unknown as WebSocket;
      manager.addConnection(ws, 'conn-1');

      manager.markAlive('conn-1', 50);
      expect(manager.getLatency('conn-1')).toBe(50);
    });
  });

  describe('cleanupDeadConnections', () => {
    it('should remove dead connections', () => {
      const ws1 = new MockWebSocket() as unknown as WebSocket;
      const ws2 = new MockWebSocket() as unknown as WebSocket;
      manager.addConnection(ws1, 'conn-1');
      manager.addConnection(ws2, 'conn-2');

      manager.markDead('conn-1');
      const removed = manager.cleanupDeadConnections();

      expect(removed).toBe(1);
      expect(manager.getConnectionCount()).toBe(1);
      expect(manager.getConnection('conn-1')).toBeUndefined();
      expect(manager.getConnection('conn-2')).toBeDefined();
    });
  });

  describe('closeAll', () => {
    it('should close all connections', () => {
      const ws1 = new MockWebSocket();
      const ws2 = new MockWebSocket();
      manager.addConnection(ws1 as unknown as WebSocket, 'conn-1');
      manager.addConnection(ws2 as unknown as WebSocket, 'conn-2');

      manager.closeAll();

      expect(ws1.readyState).toBe(WebSocket.CLOSED);
      expect(ws2.readyState).toBe(WebSocket.CLOSED);
      expect(manager.getConnectionCount()).toBe(0);
    });
  });

  describe('subscriptions', () => {
    it('should update subscriptions', () => {
      const ws = new MockWebSocket() as unknown as WebSocket;
      manager.addConnection(ws, 'conn-1');

      manager.updateSubscriptions('conn-1', { executionId: 'exec-123' });

      const connection = manager.getConnection('conn-1');
      expect(connection?.subscriptions.executionId).toBe('exec-123');
    });

    it('should clear subscriptions', () => {
      const ws = new MockWebSocket() as unknown as WebSocket;
      manager.addConnection(ws, 'conn-1');

      manager.updateSubscriptions('conn-1', { executionId: 'exec-123' });
      manager.clearSubscriptions('conn-1');

      const connection = manager.getConnection('conn-1');
      expect(connection?.subscriptions).toEqual({});
    });

    it('should merge subscriptions', () => {
      const ws = new MockWebSocket() as unknown as WebSocket;
      manager.addConnection(ws, 'conn-1');

      manager.updateSubscriptions('conn-1', { executionId: 'exec-123' });
      manager.updateSubscriptions('conn-1', { events: [WSEventType.PIPELINE_START] });

      const connection = manager.getConnection('conn-1');
      expect(connection?.subscriptions.executionId).toBe('exec-123');
      expect(connection?.subscriptions.events).toContain(WSEventType.PIPELINE_START);
    });
  });
});
