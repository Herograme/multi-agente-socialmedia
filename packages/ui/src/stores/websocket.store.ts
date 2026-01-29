import { create } from 'zustand';
import type { WSMessage, AgentStatus } from '@social-content/shared';

// Extended AgentState for UI tracking
export interface AgentState {
  id: string;
  name: string;
  status: AgentStatus;
  progress: number;
  message?: string;
  duration?: number;
  error?: string;
}

// Log entry for pipeline events
export interface LogEntry {
  timestamp: string;
  agentId?: string;
  agentName?: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface WebSocketState {
  // Connection state
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;
  lastError: string | null;
  setConnected: (connected: boolean) => void;
  setReconnecting: (reconnecting: boolean, attempts?: number) => void;
  setLastError: (error: string | null) => void;

  // Messages
  messages: WSMessage[];
  lastMessageByType: Record<string, WSMessage>;
  addMessage: (message: WSMessage) => void;
  clearMessages: () => void;

  // Pipeline state
  currentExecutionId: string | null;
  agentStatuses: Record<string, AgentStatus>;
  setCurrentExecution: (executionId: string | null) => void;
  updateAgentStatus: (agentId: string, status: AgentStatus) => void;
  resetPipelineState: () => void;

  // Fallback mode
  isFallbackMode: boolean;
  setFallbackMode: (enabled: boolean) => void;
}

export const useWebSocketStore = create<WebSocketState>((set) => ({
  // Connection state
  isConnected: false,
  isReconnecting: false,
  reconnectAttempts: 0,
  lastError: null,
  setConnected: (connected) =>
    set({
      isConnected: connected,
      isReconnecting: false,
      lastError: connected ? null : undefined,
    }),
  setReconnecting: (reconnecting, attempts) =>
    set((state) => ({
      isReconnecting: reconnecting,
      reconnectAttempts: attempts ?? state.reconnectAttempts,
    })),
  setLastError: (error) => set({ lastError: error }),

  // Messages
  messages: [],
  lastMessageByType: {},
  addMessage: (message) =>
    set((state) => {
      const newMessages = [...state.messages, message].slice(-100); // Keep last 100
      const newLastByType = { ...state.lastMessageByType, [message.type]: message };
      return {
        messages: newMessages,
        lastMessageByType: newLastByType,
      };
    }),
  clearMessages: () => set({ messages: [], lastMessageByType: {} }),

  // Pipeline state
  currentExecutionId: null,
  agentStatuses: {},
  setCurrentExecution: (executionId) => set({ currentExecutionId: executionId }),
  updateAgentStatus: (agentId, status) =>
    set((state) => ({
      agentStatuses: { ...state.agentStatuses, [agentId]: status },
    })),
  resetPipelineState: () =>
    set({
      currentExecutionId: null,
      agentStatuses: {},
      messages: [],
      lastMessageByType: {},
    }),

  // Fallback mode
  isFallbackMode: false,
  setFallbackMode: (enabled) => set({ isFallbackMode: enabled }),
}));

// Selectors for common queries
export const selectIsConnected = (state: WebSocketState) => state.isConnected;
export const selectIsReconnecting = (state: WebSocketState) => state.isReconnecting;
export const selectCurrentExecutionId = (state: WebSocketState) => state.currentExecutionId;
export const selectAgentStatuses = (state: WebSocketState) => state.agentStatuses;
export const selectMessages = (state: WebSocketState) => state.messages;
export const selectIsFallbackMode = (state: WebSocketState) => state.isFallbackMode;
