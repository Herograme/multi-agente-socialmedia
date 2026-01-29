/**
 * Heartbeat System Tests
 *
 * Tests for the WebSocket heartbeat/ping-pong functionality.
 *
 * @see Story 5.1 - WebSocket Server para Real-Time
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocket } from 'ws';
import { ConnectionManager } from '../../websocket/connection-manager';
import {
  startHeartbeat,
  stopHeartbeat,
  handlePong,
  isHeartbeatRunning,
  getHeartbeatInterval,
  getPongTimeout,
  getHeartbeatMetrics,
  resetHeartbeatMetrics,
} from '../../websocket/heartbeat';

// Mock WebSocket class
class MockWebSocket {
  readyState = WebSocket.OPEN;
  sentMessages: string[] = [];
  pingCalled = false;

  send(data: string): void {
    this.sentMessages.push(data);
  }

  close(_code?: number, _reason?: string): void {
    this.readyState = WebSocket.CLOSED;
  }

  ping(): void {
    this.pingCalled = true;
  }
}

describe('Heartbeat System', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    ConnectionManager.resetInstance();
    stopHeartbeat();
    resetHeartbeatMetrics();
  });

  afterEach(() => {
    stopHeartbeat();
    ConnectionManager.resetInstance();
    vi.useRealTimers();
  });

  describe('startHeartbeat', () => {
    it('should start the heartbeat system', () => {
      expect(isHeartbeatRunning()).toBe(false);
      startHeartbeat();
      expect(isHeartbeatRunning()).toBe(true);
    });

    it('should not start multiple heartbeats', () => {
      startHeartbeat();
      startHeartbeat(); // Should be a no-op
      expect(isHeartbeatRunning()).toBe(true);
    });

    it('should send pings at configured interval', () => {
      const ws = new MockWebSocket();
      const manager = ConnectionManager.getInstance();
      manager.addConnection(ws as unknown as WebSocket, 'conn-1');

      startHeartbeat();

      // Advance time by heartbeat interval
      vi.advanceTimersByTime(getHeartbeatInterval());

      expect(ws.pingCalled).toBe(true);
    });

    it('should mark connections as dead before sending ping', () => {
      const ws = new MockWebSocket();
      const manager = ConnectionManager.getInstance();
      manager.addConnection(ws as unknown as WebSocket, 'conn-1');

      startHeartbeat();
      vi.advanceTimersByTime(getHeartbeatInterval());

      const connection = manager.getConnection('conn-1');
      expect(connection?.isAlive).toBe(false);
    });

    it('should remove connections that did not respond', () => {
      const ws = new MockWebSocket();
      const manager = ConnectionManager.getInstance();
      manager.addConnection(ws as unknown as WebSocket, 'conn-1');

      startHeartbeat();

      // First heartbeat - marks as dead
      vi.advanceTimersByTime(getHeartbeatInterval());
      expect(manager.getConnection('conn-1')).toBeDefined();

      // Second heartbeat - should remove (no pong received)
      vi.advanceTimersByTime(getHeartbeatInterval());
      expect(manager.getConnection('conn-1')).toBeUndefined();
    });

    it('should keep connections that respond with pong', () => {
      const ws = new MockWebSocket();
      const manager = ConnectionManager.getInstance();
      manager.addConnection(ws as unknown as WebSocket, 'conn-1');

      startHeartbeat();

      // First heartbeat
      vi.advanceTimersByTime(getHeartbeatInterval());

      // Simulate pong response
      handlePong('conn-1');

      // Second heartbeat
      vi.advanceTimersByTime(getHeartbeatInterval());

      expect(manager.getConnection('conn-1')).toBeDefined();
    });
  });

  describe('stopHeartbeat', () => {
    it('should stop the heartbeat system', () => {
      startHeartbeat();
      expect(isHeartbeatRunning()).toBe(true);

      stopHeartbeat();
      expect(isHeartbeatRunning()).toBe(false);
    });

    it('should be safe to call when not running', () => {
      expect(() => stopHeartbeat()).not.toThrow();
    });
  });

  describe('handlePong', () => {
    it('should mark connection as alive', () => {
      const ws = new MockWebSocket();
      const manager = ConnectionManager.getInstance();
      manager.addConnection(ws as unknown as WebSocket, 'conn-1');
      manager.markDead('conn-1');

      handlePong('conn-1');

      expect(manager.getConnection('conn-1')?.isAlive).toBe(true);
    });

    it('should update metrics', () => {
      const ws = new MockWebSocket();
      const manager = ConnectionManager.getInstance();
      manager.addConnection(ws as unknown as WebSocket, 'conn-1');

      const metricsBefore = getHeartbeatMetrics();
      handlePong('conn-1');
      const metricsAfter = getHeartbeatMetrics();

      expect(metricsAfter.totalPongsReceived).toBe(metricsBefore.totalPongsReceived + 1);
    });
  });

  describe('configuration', () => {
    it('should return configured heartbeat interval', () => {
      const interval = getHeartbeatInterval();
      expect(interval).toBeGreaterThan(0);
      expect(typeof interval).toBe('number');
    });

    it('should return configured pong timeout', () => {
      const timeout = getPongTimeout();
      expect(timeout).toBeGreaterThan(0);
      expect(typeof timeout).toBe('number');
    });
  });

  describe('metrics', () => {
    it('should track metrics correctly', () => {
      const ws = new MockWebSocket();
      const manager = ConnectionManager.getInstance();
      manager.addConnection(ws as unknown as WebSocket, 'conn-1');

      startHeartbeat();
      vi.advanceTimersByTime(getHeartbeatInterval());

      const metrics = getHeartbeatMetrics();
      expect(metrics.totalPingsSent).toBeGreaterThan(0);
      expect(metrics.lastHeartbeatAt).toBeDefined();
    });

    it('should reset metrics', () => {
      const ws = new MockWebSocket();
      const manager = ConnectionManager.getInstance();
      manager.addConnection(ws as unknown as WebSocket, 'conn-1');

      startHeartbeat();
      vi.advanceTimersByTime(getHeartbeatInterval());
      handlePong('conn-1');

      resetHeartbeatMetrics();
      const metrics = getHeartbeatMetrics();

      expect(metrics.totalPingsSent).toBe(0);
      expect(metrics.totalPongsReceived).toBe(0);
      expect(metrics.totalTimeouts).toBe(0);
      expect(metrics.lastHeartbeatAt).toBeNull();
    });

    it('should track timeouts', () => {
      const ws = new MockWebSocket();
      const manager = ConnectionManager.getInstance();
      manager.addConnection(ws as unknown as WebSocket, 'conn-1');

      startHeartbeat();

      // Two heartbeats without pong = timeout
      vi.advanceTimersByTime(getHeartbeatInterval() * 2);

      const metrics = getHeartbeatMetrics();
      expect(metrics.totalTimeouts).toBe(1);
    });
  });
});
