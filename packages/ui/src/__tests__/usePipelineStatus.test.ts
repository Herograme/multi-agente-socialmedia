/**
 * Tests for usePipelineStatus hook - Story 5.2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AgentStatus } from '@social-content/shared';

// Mock the WebSocket store
const mockMessages: Array<{
  type: string;
  payload: unknown;
  timestamp: string;
}> = [];

const mockStore = {
  currentExecutionId: null as string | null,
  agentStatuses: {} as Record<string, AgentStatus>,
  messages: mockMessages,
  setCurrentExecution: vi.fn((id: string | null) => {
    mockStore.currentExecutionId = id;
  }),
  updateAgentStatus: vi.fn((agentId: string, status: AgentStatus) => {
    mockStore.agentStatuses = { ...mockStore.agentStatuses, [agentId]: status };
  }),
  resetPipelineState: vi.fn(() => {
    mockStore.currentExecutionId = null;
    mockStore.agentStatuses = {};
    mockStore.messages = [];
  }),
};

vi.mock('../stores/websocket.store', () => ({
  useWebSocketStore: () => mockStore,
}));

// Mock useWebSocket
const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();

vi.mock('../hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    isConnected: true,
    isFallbackMode: false,
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
  }),
}));

// Import after mocking
import { usePipelineStatus } from '../hooks/usePipelineStatus';

describe('usePipelineStatus', () => {
  beforeEach(() => {
    // Reset store state
    mockStore.currentExecutionId = null;
    mockStore.agentStatuses = {};
    mockStore.messages = [];
    vi.clearAllMocks();

    // Setup subscribe to return unsubscribe function
    mockSubscribe.mockReturnValue(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with idle status', () => {
      const { result } = renderHook(() => usePipelineStatus());

      expect(result.current.status).toBe('idle');
      expect(result.current.isRunning).toBe(false);
      expect(result.current.progress).toBe(0);
      expect(result.current.executionId).toBeNull();
    });

    it('should have all agents in initial state', () => {
      const { result } = renderHook(() => usePipelineStatus());

      expect(result.current.agents).toHaveLength(8); // 8 agents defined
      result.current.agents.forEach((agent) => {
        expect(agent.status).toBe(AgentStatus.IDLE);
        expect(agent.progress).toBe(0);
      });
    });

    it('should have empty logs initially', () => {
      const { result } = renderHook(() => usePipelineStatus());

      expect(result.current.logs).toHaveLength(0);
    });
  });

  describe('Event Subscriptions', () => {
    it('should subscribe to pipeline events on mount', () => {
      renderHook(() => usePipelineStatus());

      // Should subscribe to pipeline:start, agent:start, agent:progress, etc.
      expect(mockSubscribe).toHaveBeenCalled();
    });

    it('should unsubscribe on unmount', () => {
      const unsubscribeMock = vi.fn();
      mockSubscribe.mockReturnValue(unsubscribeMock);

      const { unmount } = renderHook(() => usePipelineStatus());
      unmount();

      // Unsubscribe functions should be called
      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });

  describe('Agent States', () => {
    it('should map agent IDs to display names', () => {
      const { result } = renderHook(() => usePipelineStatus());

      const researcher = result.current.agents.find((a) => a.id === 'researcher');
      expect(researcher?.name).toBe('Pesquisador');

      const curator = result.current.agents.find((a) => a.id === 'curator');
      expect(curator?.name).toBe('Curador');
    });

    it('should calculate progress based on completed agents', () => {
      // Set some agents as completed
      mockStore.agentStatuses = {
        researcher: AgentStatus.SUCCESS,
        curator: AgentStatus.SUCCESS,
      };

      const { result } = renderHook(() => usePipelineStatus());

      // 2 out of 8 agents complete = 25%
      expect(result.current.progress).toBe(25);
    });

    it('should detect running state when any agent is running', () => {
      mockStore.agentStatuses = {
        researcher: AgentStatus.RUNNING,
      };

      const { result } = renderHook(() => usePipelineStatus());

      expect(result.current.isRunning).toBe(true);
    });
  });

  describe('Pipeline Status', () => {
    it('should be idle when no execution', () => {
      mockStore.currentExecutionId = null;

      const { result } = renderHook(() => usePipelineStatus());

      expect(result.current.status).toBe('idle');
    });

    it('should be running when agents are running', () => {
      mockStore.currentExecutionId = 'exec-123';
      mockStore.agentStatuses = {
        researcher: AgentStatus.RUNNING,
      };

      const { result } = renderHook(() => usePipelineStatus());

      expect(result.current.status).toBe('running');
    });

    it('should be failed when any agent has error', () => {
      mockStore.currentExecutionId = 'exec-123';
      mockStore.agentStatuses = {
        researcher: AgentStatus.SUCCESS,
        curator: AgentStatus.ERROR,
      };

      const { result } = renderHook(() => usePipelineStatus());

      expect(result.current.status).toBe('failed');
    });
  });

  describe('Actions', () => {
    it('should reset pipeline state when startPipeline is called', () => {
      const { result } = renderHook(() => usePipelineStatus());

      act(() => {
        result.current.startPipeline();
      });

      expect(mockStore.resetPipelineState).toHaveBeenCalled();
    });

    it('should reset pipeline state when resetPipeline is called', () => {
      const { result } = renderHook(() => usePipelineStatus());

      act(() => {
        result.current.resetPipeline();
      });

      expect(mockStore.resetPipelineState).toHaveBeenCalled();
    });
  });

  describe('Connection Status', () => {
    it('should expose isConnected from WebSocket context', () => {
      const { result } = renderHook(() => usePipelineStatus());

      expect(result.current.isConnected).toBe(true);
    });

    it('should expose isFallbackMode from WebSocket context', () => {
      const { result } = renderHook(() => usePipelineStatus());

      expect(result.current.isFallbackMode).toBe(false);
    });
  });
});
