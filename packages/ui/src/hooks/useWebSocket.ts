/**
 * useWebSocket Hook - Story 5.2
 * Manages WebSocket connection for real-time pipeline updates
 * Features: reconnection with exponential backoff, heartbeat, fallback polling
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useWebSocketStore } from '../stores/websocket.store';
import { WS_URL, WS_CONFIG } from '../lib/constants';
import type { WSMessage, WSEventType } from '@social-content/shared';

type EventCallback<T = unknown> = (payload: T) => void;

export interface UseWebSocketOptions {
  autoConnect?: boolean;
  enableFallbackPolling?: boolean;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;
  lastMessage: WSMessage | null;
  lastError: string | null;
  isFallbackMode: boolean;
  subscribe: <T>(event: WSEventType | string, callback: EventCallback<T>) => () => void;
  unsubscribe: <T>(event: WSEventType | string, callback: EventCallback<T>) => void;
  send: (event: WSEventType | string, data?: unknown) => void;
  reconnect: () => void;
  disconnect: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { autoConnect = true, enableFallbackPolling = true } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listenersRef = useRef<Map<string, Set<EventCallback>>>(new Map());
  const reconnectAttemptsRef = useRef(0);
  const isIntentionalCloseRef = useRef(false);

  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);

  const {
    isConnected,
    isReconnecting,
    reconnectAttempts,
    lastError,
    isFallbackMode,
    setConnected,
    setReconnecting,
    setLastError,
    setFallbackMode,
    addMessage,
  } = useWebSocketStore();

  // Clear reconnect timeout
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Clear heartbeat interval
  const clearHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Clear polling interval
  const clearPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Start heartbeat to keep connection alive
  const startHeartbeat = useCallback(() => {
    clearHeartbeat();
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, WS_CONFIG.heartbeatInterval);
  }, [clearHeartbeat]);

  // Notify all listeners for an event
  const notifyListeners = useCallback((type: string, payload: unknown) => {
    const listeners = listenersRef.current.get(type);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`[WebSocket] Error in listener for ${type}:`, error);
        }
      });
    }
  }, []);

  // Polling fallback for when WebSocket is unavailable
  const startPolling = useCallback(() => {
    if (!enableFallbackPolling) return;

    clearPolling();
    setFallbackMode(true);

    const poll = async () => {
      try {
        const response = await fetch('/api/pipeline/status');
        if (response.ok) {
          const data = await response.json();
          // Process polling data similar to WebSocket message
          if (data && Array.isArray(data)) {
            data.forEach((status: unknown) => {
              const message: WSMessage = {
                type: 'pipeline:status',
                payload: status,
                timestamp: new Date().toISOString(),
              };
              setLastMessage(message);
              addMessage(message);
              notifyListeners('pipeline:status', status);
            });
          }
        }
      } catch (error) {
        console.error('[Polling] Error:', error);
      }
    };

    // Initial poll
    poll();

    // Setup interval
    pollingIntervalRef.current = setInterval(poll, WS_CONFIG.pollingInterval);
  }, [enableFallbackPolling, clearPolling, setFallbackMode, addMessage, notifyListeners]);

  // Stop polling when WebSocket reconnects
  const stopPolling = useCallback(() => {
    clearPolling();
    setFallbackMode(false);
  }, [clearPolling, setFallbackMode]);

  // Schedule reconnection with exponential backoff
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= WS_CONFIG.maxReconnectAttempts) {
      console.log('[WebSocket] Max reconnect attempts reached, switching to polling');
      setReconnecting(false, reconnectAttemptsRef.current);
      startPolling();
      return;
    }

    setReconnecting(true, reconnectAttemptsRef.current);

    const delay = Math.min(
      WS_CONFIG.initialReconnectDelay * Math.pow(2, reconnectAttemptsRef.current),
      WS_CONFIG.maxReconnectDelay
    );

    console.log(
      `[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${WS_CONFIG.maxReconnectAttempts})`
    );

    clearReconnectTimeout();
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current += 1;
      connect();
    }, delay);
  }, [clearReconnectTimeout, startPolling, setReconnecting]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      console.log('[WebSocket] Connecting to', WS_URL);
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        setConnected(true);
        setLastError(null);
        reconnectAttemptsRef.current = 0;
        isIntentionalCloseRef.current = false;
        startHeartbeat();
        stopPolling();
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          setLastMessage(message);
          addMessage(message);
          notifyListeners(message.type, message.payload);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        setConnected(false);
        clearHeartbeat();

        // Only attempt reconnection if not intentional close
        if (!isIntentionalCloseRef.current && event.code !== 1000) {
          scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        setLastError('Connection error');
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[WebSocket] Failed to connect:', error);
      setLastError(error instanceof Error ? error.message : 'Failed to connect');
      scheduleReconnect();
    }
  }, [
    setConnected,
    setLastError,
    addMessage,
    startHeartbeat,
    stopPolling,
    clearHeartbeat,
    scheduleReconnect,
    notifyListeners,
  ]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    isIntentionalCloseRef.current = true;
    clearReconnectTimeout();
    clearHeartbeat();
    clearPolling();

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }

    setConnected(false);
    setReconnecting(false, 0);
    setFallbackMode(false);
    reconnectAttemptsRef.current = 0;
  }, [clearReconnectTimeout, clearHeartbeat, clearPolling, setConnected, setReconnecting, setFallbackMode]);

  // Force reconnection
  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    isIntentionalCloseRef.current = false;
    setTimeout(() => connect(), 100);
  }, [disconnect, connect]);

  // Subscribe to an event
  const subscribe = useCallback(<T>(event: WSEventType | string, callback: EventCallback<T>) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(callback as EventCallback);

    // Return unsubscribe function
    return () => {
      listenersRef.current.get(event)?.delete(callback as EventCallback);
    };
  }, []);

  // Unsubscribe from an event
  const unsubscribe = useCallback(<T>(event: WSEventType | string, callback: EventCallback<T>) => {
    listenersRef.current.get(event)?.delete(callback as EventCallback);
  }, []);

  // Send a message
  const send = useCallback((event: WSEventType | string, data?: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: event, payload: data }));
    } else {
      console.warn('[WebSocket] Cannot send, not connected');
    }
  }, []);

  // Connect on mount if autoConnect is true
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
      listenersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isConnected,
    isReconnecting,
    reconnectAttempts,
    lastMessage,
    lastError,
    isFallbackMode,
    subscribe,
    unsubscribe,
    send,
    reconnect,
    disconnect,
  };
}
