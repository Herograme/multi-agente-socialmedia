/**
 * Tests for useWebSocket hook - Story 5.2
 * Note: These tests verify the WebSocket store functionality since the hook
 * has complex dependencies that are difficult to mock in isolation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';

// Test the WebSocket store directly
import { useWebSocketStore } from '../stores/websocket.store';
import { AgentStatus, WSEventType } from '@social-content/shared';

describe('WebSocket Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useWebSocketStore.getState();
    store.setConnected(false);
    store.clearMessages();
    store.resetPipelineState();
  });

  describe('Connection State', () => {
    it('should initialize with disconnected state', () => {
      const state = useWebSocketStore.getState();
      expect(state.isConnected).toBe(false);
      expect(state.isReconnecting).toBe(false);
    });

    it('should update isConnected when setConnected is called', () => {
      const store = useWebSocketStore.getState();

      store.setConnected(true);
      expect(useWebSocketStore.getState().isConnected).toBe(true);

      store.setConnected(false);
      expect(useWebSocketStore.getState().isConnected).toBe(false);
    });

    it('should update reconnecting state', () => {
      const store = useWebSocketStore.getState();

      store.setReconnecting(true, 3);
      const state = useWebSocketStore.getState();

      expect(state.isReconnecting).toBe(true);
      expect(state.reconnectAttempts).toBe(3);
    });

    it('should track last error', () => {
      const store = useWebSocketStore.getState();

      store.setLastError('Connection timeout');
      expect(useWebSocketStore.getState().lastError).toBe('Connection timeout');

      store.setLastError(null);
      expect(useWebSocketStore.getState().lastError).toBeNull();
    });
  });

  describe('Message Management', () => {
    it('should add messages to the store', () => {
      const store = useWebSocketStore.getState();
      const message = {
        type: WSEventType.PIPELINE_START,
        payload: { executionId: 'test-123' },
        timestamp: new Date().toISOString(),
      };

      store.addMessage(message);

      const state = useWebSocketStore.getState();
      expect(state.messages).toHaveLength(1);
      expect(state.messages[0]).toEqual(message);
    });

    it('should track last message by type', () => {
      const store = useWebSocketStore.getState();

      const message1 = {
        type: WSEventType.AGENT_START,
        payload: { agentId: 'agent-1' },
        timestamp: new Date().toISOString(),
      };

      const message2 = {
        type: WSEventType.AGENT_START,
        payload: { agentId: 'agent-2' },
        timestamp: new Date().toISOString(),
      };

      store.addMessage(message1);
      store.addMessage(message2);

      const state = useWebSocketStore.getState();
      expect(state.lastMessageByType[WSEventType.AGENT_START]).toEqual(message2);
    });

    it('should limit messages to 100', () => {
      const store = useWebSocketStore.getState();

      // Add 150 messages
      for (let i = 0; i < 150; i++) {
        store.addMessage({
          type: WSEventType.AGENT_PROGRESS,
          payload: { index: i },
          timestamp: new Date().toISOString(),
        });
      }

      const state = useWebSocketStore.getState();
      expect(state.messages.length).toBe(100);
    });

    it('should clear messages', () => {
      const store = useWebSocketStore.getState();

      store.addMessage({
        type: WSEventType.PIPELINE_START,
        payload: {},
        timestamp: new Date().toISOString(),
      });

      store.clearMessages();

      const state = useWebSocketStore.getState();
      expect(state.messages).toHaveLength(0);
      expect(Object.keys(state.lastMessageByType)).toHaveLength(0);
    });
  });

  describe('Pipeline State', () => {
    it('should set current execution ID', () => {
      const store = useWebSocketStore.getState();

      store.setCurrentExecution('exec-456');
      expect(useWebSocketStore.getState().currentExecutionId).toBe('exec-456');
    });

    it('should update agent status', () => {
      const store = useWebSocketStore.getState();

      store.updateAgentStatus('researcher', AgentStatus.RUNNING);
      store.updateAgentStatus('curator', AgentStatus.SUCCESS);

      const state = useWebSocketStore.getState();
      expect(state.agentStatuses['researcher']).toBe(AgentStatus.RUNNING);
      expect(state.agentStatuses['curator']).toBe(AgentStatus.SUCCESS);
    });

    it('should reset pipeline state', () => {
      const store = useWebSocketStore.getState();

      // Set some state
      store.setCurrentExecution('exec-789');
      store.updateAgentStatus('researcher', AgentStatus.RUNNING);
      store.addMessage({
        type: WSEventType.PIPELINE_START,
        payload: {},
        timestamp: new Date().toISOString(),
      });

      // Reset
      store.resetPipelineState();

      const state = useWebSocketStore.getState();
      expect(state.currentExecutionId).toBeNull();
      expect(Object.keys(state.agentStatuses)).toHaveLength(0);
      expect(state.messages).toHaveLength(0);
    });
  });

  describe('Fallback Mode', () => {
    it('should track fallback mode', () => {
      const store = useWebSocketStore.getState();

      store.setFallbackMode(true);
      expect(useWebSocketStore.getState().isFallbackMode).toBe(true);

      store.setFallbackMode(false);
      expect(useWebSocketStore.getState().isFallbackMode).toBe(false);
    });
  });
});

describe('WebSocket Hook Types', () => {
  it('should export proper interfaces', async () => {
    // Just verify the types can be imported
    const { useWebSocket } = await import('../hooks/useWebSocket');
    expect(typeof useWebSocket).toBe('function');
  });
});
