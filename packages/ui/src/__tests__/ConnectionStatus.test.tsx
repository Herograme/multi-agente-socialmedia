/**
 * Tests for ConnectionStatus component - Story 5.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ConnectionStatus } from '../components/websocket/ConnectionStatus';
import { WebSocketProvider } from '../providers/WebSocketProvider';
import { useWebSocketStore } from '../stores/websocket.store';

// Mock the WebSocket global
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(_url: string) {
    // Don't auto-connect in tests
  }

  send = vi.fn();
  close = vi.fn();
}

// Wrapper component that provides WebSocket context
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <WebSocketProvider>{children}</WebSocketProvider>;
}

describe('ConnectionStatus', () => {
  beforeEach(() => {
    // Reset store state
    const store = useWebSocketStore.getState();
    store.setConnected(false);
    store.setReconnecting(false, 0);
    store.setLastError(null);
    store.setFallbackMode(false);

    // Mock WebSocket globally
    vi.stubGlobal('WebSocket', MockWebSocket);
  });

  describe('Connected State', () => {
    it('should render green status when connected', () => {
      // Set connected state in store
      useWebSocketStore.getState().setConnected(true);

      render(
        <TestWrapper>
          <ConnectionStatus />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-green-500/20');
    });

    it('should show "Conectado" label when showLabel is true and connected', () => {
      useWebSocketStore.getState().setConnected(true);

      render(
        <TestWrapper>
          <ConnectionStatus showLabel />
        </TestWrapper>
      );

      expect(screen.getByText('Conectado')).toBeInTheDocument();
    });
  });

  describe('Disconnected State', () => {
    it('should render red status when disconnected', () => {
      useWebSocketStore.getState().setConnected(false);
      useWebSocketStore.getState().setReconnecting(false, 0);

      render(
        <TestWrapper>
          <ConnectionStatus />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-red-500/20');
    });

    it('should show "Desconectado" label when showLabel is true and disconnected', () => {
      useWebSocketStore.getState().setConnected(false);
      useWebSocketStore.getState().setReconnecting(false, 0);

      render(
        <TestWrapper>
          <ConnectionStatus showLabel />
        </TestWrapper>
      );

      expect(screen.getByText('Desconectado')).toBeInTheDocument();
    });
  });

  describe('Reconnecting State', () => {
    it('should render yellow status when reconnecting', () => {
      useWebSocketStore.getState().setConnected(false);
      useWebSocketStore.getState().setReconnecting(true, 5);

      render(
        <TestWrapper>
          <ConnectionStatus />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-yellow-500/20');
    });

    it('should show reconnect attempts in label', () => {
      useWebSocketStore.getState().setConnected(false);
      useWebSocketStore.getState().setReconnecting(true, 5);

      render(
        <TestWrapper>
          <ConnectionStatus showLabel />
        </TestWrapper>
      );

      expect(screen.getByText('Reconectando (5/10)...')).toBeInTheDocument();
    });
  });

  describe('Fallback Mode', () => {
    it('should render orange status when in fallback mode', () => {
      useWebSocketStore.getState().setConnected(false);
      useWebSocketStore.getState().setFallbackMode(true);

      render(
        <TestWrapper>
          <ConnectionStatus />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-orange-500/20');
    });

    it('should show "Modo Polling" label in fallback mode', () => {
      useWebSocketStore.getState().setConnected(false);
      useWebSocketStore.getState().setFallbackMode(true);

      render(
        <TestWrapper>
          <ConnectionStatus showLabel />
        </TestWrapper>
      );

      expect(screen.getByText('Modo Polling')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label when connected', () => {
      useWebSocketStore.getState().setConnected(true);

      render(
        <TestWrapper>
          <ConnectionStatus />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Conectado');
    });

    it('should have proper aria-label when disconnected', () => {
      useWebSocketStore.getState().setConnected(false);

      render(
        <TestWrapper>
          <ConnectionStatus />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Desconectado');
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      render(
        <TestWrapper>
          <ConnectionStatus className="custom-class" />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
    });
  });
});
