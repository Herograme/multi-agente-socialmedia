# Story 5.2: Hook de WebSocket no React

> Epic 5: Dashboard UI

---

## Story

**Como** desenvolvedor,
**Quero** um hook React para consumir WebSocket,
**Para que** componentes recebam updates de forma reativa.

---

## Status

`Ready for Review`

---

## Acceptance Criteria

| # | Criterio | Validacao |
|---|----------|-----------|
| AC1 | Hook `useWebSocket` implementado | Hook existe e pode ser importado de `@/hooks/useWebSocket` |
| AC2 | Gerencia conexao, reconexao e cleanup | Conexao estabelecida no mount, cleanup no unmount, reconexao automatica apos desconexao |
| AC3 | Retorna: `isConnected`, `lastMessage`, `subscribe(event, callback)` | Interface do hook retorna todas as propriedades especificadas |
| AC4 | Integracao com Zustand store para estado global | Estado de conexao e mensagens sincronizados com store global |
| AC5 | Hook `usePipelineStatus` especifico para pipeline | Hook derivado que filtra eventos de pipeline e retorna status estruturado |
| AC6 | Indicador visual de conexao na UI | Componente exibe status de conexao (conectado/desconectado/reconectando) |
| AC7 | Fallback graceful se WebSocket indisponivel | Sistema funciona sem WebSocket, usando polling ou dados estaticos |
| AC8 | Testes do hook com mock WebSocket | Testes unitarios cobrindo conexao, reconexao, eventos e cleanup |

---

## Tasks

- [x] **Task 1:** Criar hook useWebSocket base
  - [x] Criar `packages/ui/src/hooks/useWebSocket.ts`
  - [x] Implementar conexao WebSocket com URL configuravel via env
  - [x] Implementar estado `isConnected` com tracking de conexao
  - [x] Implementar `lastMessage` para ultima mensagem recebida
  - [x] Implementar `subscribe(event, callback)` para listeners tipados
  - [x] Implementar `unsubscribe(event, callback)` para remover listeners
  - [x] Implementar `send(event, data)` para enviar mensagens

- [x] **Task 2:** Implementar logica de reconexao automatica
  - [x] Detectar desconexao via eventos `close` e `error`
  - [x] Implementar backoff exponencial (1s, 2s, 4s, 8s, max 30s)
  - [x] Limitar tentativas de reconexao (max 10 tentativas)
  - [x] Resetar contador de tentativas apos conexao bem-sucedida
  - [x] Expor estado `reconnectAttempts` e `isReconnecting`
  - [x] Implementar `reconnect()` manual para forcar reconexao

- [x] **Task 3:** Implementar cleanup e gerenciamento de lifecycle
  - [x] Fechar conexao no unmount do componente
  - [x] Limpar todos os listeners no unmount
  - [x] Cancelar tentativas de reconexao pendentes no unmount
  - [x] Implementar `disconnect()` para desconexao manual
  - [x] Usar `useRef` para evitar re-renders desnecessarios
  - [x] Implementar heartbeat/ping para manter conexao viva

- [x] **Task 4:** Integrar com Zustand store
  - [x] Criar slice de WebSocket no store (`packages/ui/src/stores/websocket.store.ts`)
  - [x] Sincronizar `isConnected` com store global
  - [x] Armazenar ultimas mensagens por tipo de evento
  - [x] Expor seletores para acessar estado do WebSocket
  - [x] Criar action para atualizar status da conexao
  - [x] Criar action para processar mensagens recebidas

- [x] **Task 5:** Criar hook usePipelineStatus
  - [x] Criar `packages/ui/src/hooks/usePipelineStatus.ts`
  - [x] Filtrar eventos de pipeline (`pipeline:*`, `agent:*`)
  - [x] Manter estado do pipeline atual (executionId, status, agentes)
  - [x] Calcular progresso geral do pipeline
  - [x] Expor lista de logs de eventos
  - [x] Integrar com store para persistir estado entre navegacoes
  - [x] Retornar `currentExecution`, `agentStatuses`, `logs`, `progress`

- [x] **Task 6:** Criar indicador visual de conexao
  - [x] Criar `packages/ui/src/components/websocket/ConnectionStatus.tsx`
  - [x] Exibir icone/badge de status (verde=conectado, vermelho=desconectado, amarelo=reconectando)
  - [x] Mostrar tooltip com detalhes (tentativas, ultimo erro)
  - [x] Adicionar botao de reconexao manual quando desconectado
  - [x] Posicionar no header ou footer do layout
  - [x] Animar transicoes de estado

- [x] **Task 7:** Implementar fallback para WebSocket indisponivel
  - [x] Detectar quando WebSocket nao esta disponivel
  - [x] Implementar polling como fallback (GET /api/pipeline/status)
  - [x] Configurar intervalo de polling (default 5s)
  - [x] Exibir aviso de modo degradado na UI
  - [x] Desabilitar polling quando WebSocket reconectar
  - [x] Manter mesma interface de hook independente do transporte

- [x] **Task 8:** Criar testes unitarios
  - [x] Criar `packages/ui/src/__tests__/useWebSocket.test.ts`
  - [x] Testar conexao inicial com mock WebSocket
  - [x] Testar reconexao automatica apos desconexao
  - [x] Testar subscribe/unsubscribe de eventos
  - [x] Testar cleanup no unmount
  - [x] Testar integracao com store
  - [x] Testar usePipelineStatus com eventos de pipeline
  - [x] Testar fallback de polling
  - [x] Testar indicador de conexao

- [x] **Task 9:** Documentar uso e integrar no projeto
  - [x] Adicionar export no barrel `packages/ui/src/hooks/index.ts`
  - [x] Atualizar tipos compartilhados se necessario
  - [x] Adicionar ConnectionStatus no Layout principal
  - [x] Criar exemplo de uso em componente existente
  - [x] Verificar lint e typecheck passando

---

## Dev Notes

### Estrutura de Arquivos

```
packages/ui/src/
├── hooks/
│   ├── index.ts
│   ├── useWebSocket.ts
│   └── usePipelineStatus.ts
├── stores/
│   ├── app.store.ts
│   └── websocket.store.ts
├── components/
│   ├── websocket/
│   │   ├── index.ts
│   │   └── ConnectionStatus.tsx
│   └── layout/
│       └── Layout.tsx (modificar para incluir ConnectionStatus)
├── lib/
│   └── constants.ts (adicionar WS_URL)
└── __tests__/
    └── useWebSocket.test.ts
```

### Interfaces TypeScript

```typescript
// packages/shared/src/types/websocket.ts

export enum WSEventType {
  PIPELINE_START = 'pipeline:start',
  PIPELINE_COMPLETE = 'pipeline:complete',
  AGENT_START = 'agent:start',
  AGENT_PROGRESS = 'agent:progress',
  AGENT_COMPLETE = 'agent:complete',
  AGENT_ERROR = 'agent:error',
  HEARTBEAT = 'heartbeat',
  PONG = 'pong',
}

export interface WSMessage<T = unknown> {
  type: WSEventType;
  payload: T;
  timestamp: string;
}

export interface PipelineStartPayload {
  executionId: string;
  config: {
    numPosts: number;
    platforms: string[];
    includeVisual: boolean;
    qualityThreshold: number;
  };
}

export interface AgentStartPayload {
  executionId: string;
  agentId: string;
  agentName: string;
}

export interface AgentProgressPayload {
  executionId: string;
  agentId: string;
  progress: number; // 0-100
  message: string;
}

export interface AgentCompletePayload {
  executionId: string;
  agentId: string;
  duration: number;
  result?: unknown;
}

export interface AgentErrorPayload {
  executionId: string;
  agentId: string;
  error: string;
  willRetry: boolean;
}

export interface PipelineCompletePayload {
  executionId: string;
  status: 'completed' | 'failed';
  postsGenerated: number;
  averageScore: number;
  duration: number;
}
```

### Hook useWebSocket

```typescript
// packages/ui/src/hooks/useWebSocket.ts

import { useEffect, useRef, useCallback, useState } from 'react';
import { useWebSocketStore } from '@/stores/websocket.store';
import type { WSMessage, WSEventType } from '@social-content/shared';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;
const HEARTBEAT_INTERVAL = 30000;

type EventCallback<T = unknown> = (payload: T) => void;

interface UseWebSocketReturn {
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;
  lastMessage: WSMessage | null;
  subscribe: <T>(event: WSEventType, callback: EventCallback<T>) => () => void;
  unsubscribe: <T>(event: WSEventType, callback: EventCallback<T>) => void;
  send: (event: WSEventType, data?: unknown) => void;
  reconnect: () => void;
  disconnect: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const listenersRef = useRef<Map<WSEventType, Set<EventCallback>>>(new Map());

  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);

  const { setConnected, addMessage } = useWebSocketStore();

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    clearHeartbeat();
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, HEARTBEAT_INTERVAL);
  }, [clearHeartbeat]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        setIsConnected(true);
        setIsReconnecting(false);
        setReconnectAttempts(0);
        setConnected(true);
        startHeartbeat();
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          setLastMessage(message);
          addMessage(message);

          // Notify subscribers
          const listeners = listenersRef.current.get(message.type);
          if (listeners) {
            listeners.forEach((callback) => callback(message.payload));
          }
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        setIsConnected(false);
        setConnected(false);
        clearHeartbeat();

        // Attempt reconnection if not intentional close
        if (event.code !== 1000 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[WebSocket] Failed to connect:', error);
      scheduleReconnect();
    }
  }, [reconnectAttempts, setConnected, addMessage, startHeartbeat, clearHeartbeat]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log('[WebSocket] Max reconnect attempts reached');
      setIsReconnecting(false);
      return;
    }

    setIsReconnecting(true);
    const delay = Math.min(
      INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts),
      MAX_RECONNECT_DELAY
    );

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1})`);

    clearReconnectTimeout();
    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectAttempts((prev) => prev + 1);
      connect();
    }, delay);
  }, [reconnectAttempts, clearReconnectTimeout, connect]);

  const disconnect = useCallback(() => {
    clearReconnectTimeout();
    clearHeartbeat();
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsReconnecting(false);
    setConnected(false);
  }, [clearReconnectTimeout, clearHeartbeat, setConnected]);

  const reconnect = useCallback(() => {
    disconnect();
    setReconnectAttempts(0);
    connect();
  }, [disconnect, connect]);

  const subscribe = useCallback(<T>(event: WSEventType, callback: EventCallback<T>) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(callback as EventCallback);

    // Return unsubscribe function
    return () => {
      listenersRef.current.get(event)?.delete(callback as EventCallback);
    };
  }, []);

  const unsubscribe = useCallback(<T>(event: WSEventType, callback: EventCallback<T>) => {
    listenersRef.current.get(event)?.delete(callback as EventCallback);
  }, []);

  const send = useCallback((event: WSEventType, data?: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: event, payload: data }));
    } else {
      console.warn('[WebSocket] Cannot send, not connected');
    }
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
      listenersRef.current.clear();
    };
  }, []);

  return {
    isConnected,
    isReconnecting,
    reconnectAttempts,
    lastMessage,
    subscribe,
    unsubscribe,
    send,
    reconnect,
    disconnect,
  };
}
```

### Zustand Store para WebSocket

```typescript
// packages/ui/src/stores/websocket.store.ts

import { create } from 'zustand';
import type { WSMessage, WSEventType, AgentStatus } from '@social-content/shared';

interface WebSocketState {
  // Connection state
  isConnected: boolean;
  setConnected: (connected: boolean) => void;

  // Messages
  messages: WSMessage[];
  lastMessageByType: Map<WSEventType, WSMessage>;
  addMessage: (message: WSMessage) => void;
  clearMessages: () => void;

  // Pipeline state
  currentExecutionId: string | null;
  agentStatuses: Record<string, AgentStatus>;
  setCurrentExecution: (executionId: string | null) => void;
  updateAgentStatus: (agentId: string, status: AgentStatus) => void;
  resetPipelineState: () => void;
}

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  // Connection
  isConnected: false,
  setConnected: (connected) => set({ isConnected: connected }),

  // Messages
  messages: [],
  lastMessageByType: new Map(),
  addMessage: (message) => {
    set((state) => {
      const newMessages = [...state.messages, message].slice(-100); // Keep last 100
      const newLastByType = new Map(state.lastMessageByType);
      newLastByType.set(message.type, message);
      return {
        messages: newMessages,
        lastMessageByType: newLastByType,
      };
    });
  },
  clearMessages: () => set({ messages: [], lastMessageByType: new Map() }),

  // Pipeline
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
    }),
}));
```

### Hook usePipelineStatus

```typescript
// packages/ui/src/hooks/usePipelineStatus.ts

import { useEffect, useMemo, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { useWebSocketStore } from '@/stores/websocket.store';
import {
  WSEventType,
  AgentStatus,
  PipelineStartPayload,
  AgentStartPayload,
  AgentProgressPayload,
  AgentCompletePayload,
  AgentErrorPayload,
  PipelineCompletePayload,
} from '@social-content/shared';

interface AgentState {
  id: string;
  name: string;
  status: AgentStatus;
  progress: number;
  message?: string;
  duration?: number;
  error?: string;
}

interface PipelineState {
  executionId: string | null;
  isRunning: boolean;
  status: 'idle' | 'running' | 'completed' | 'failed';
  agents: AgentState[];
  progress: number;
  logs: LogEntry[];
}

interface LogEntry {
  timestamp: string;
  agentId?: string;
  agentName?: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface UsePipelineStatusReturn extends PipelineState {
  startPipeline: () => void;
  resetPipeline: () => void;
}

const AGENT_ORDER = [
  'researcher',
  'topic-generator',
  'curator',
  'writer',
  'image-designer',
  'carousel-builder',
  'pdf-maker',
  'qa-analyst',
];

export function usePipelineStatus(): UsePipelineStatusReturn {
  const { subscribe, isConnected } = useWebSocket();
  const {
    currentExecutionId,
    agentStatuses,
    messages,
    setCurrentExecution,
    updateAgentStatus,
    resetPipelineState,
  } = useWebSocketStore();

  // Subscribe to pipeline events
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    unsubscribers.push(
      subscribe<PipelineStartPayload>(WSEventType.PIPELINE_START, (payload) => {
        setCurrentExecution(payload.executionId);
      })
    );

    unsubscribers.push(
      subscribe<AgentStartPayload>(WSEventType.AGENT_START, (payload) => {
        updateAgentStatus(payload.agentId, AgentStatus.RUNNING);
      })
    );

    unsubscribers.push(
      subscribe<AgentProgressPayload>(WSEventType.AGENT_PROGRESS, (payload) => {
        // Progress updates are handled via messages
      })
    );

    unsubscribers.push(
      subscribe<AgentCompletePayload>(WSEventType.AGENT_COMPLETE, (payload) => {
        updateAgentStatus(payload.agentId, AgentStatus.SUCCESS);
      })
    );

    unsubscribers.push(
      subscribe<AgentErrorPayload>(WSEventType.AGENT_ERROR, (payload) => {
        updateAgentStatus(payload.agentId, AgentStatus.ERROR);
      })
    );

    unsubscribers.push(
      subscribe<PipelineCompletePayload>(WSEventType.PIPELINE_COMPLETE, (payload) => {
        // Pipeline complete
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [subscribe, setCurrentExecution, updateAgentStatus]);

  // Compute derived state
  const agents = useMemo((): AgentState[] => {
    return AGENT_ORDER.map((agentId) => {
      const status = agentStatuses[agentId] || AgentStatus.IDLE;
      const lastProgressMsg = messages
        .filter(
          (m) =>
            m.type === WSEventType.AGENT_PROGRESS &&
            (m.payload as AgentProgressPayload).agentId === agentId
        )
        .pop();

      const lastCompleteMsg = messages
        .filter(
          (m) =>
            m.type === WSEventType.AGENT_COMPLETE &&
            (m.payload as AgentCompletePayload).agentId === agentId
        )
        .pop();

      const lastErrorMsg = messages
        .filter(
          (m) =>
            m.type === WSEventType.AGENT_ERROR &&
            (m.payload as AgentErrorPayload).agentId === agentId
        )
        .pop();

      return {
        id: agentId,
        name: formatAgentName(agentId),
        status,
        progress:
          status === AgentStatus.SUCCESS
            ? 100
            : (lastProgressMsg?.payload as AgentProgressPayload)?.progress || 0,
        message: (lastProgressMsg?.payload as AgentProgressPayload)?.message,
        duration: (lastCompleteMsg?.payload as AgentCompletePayload)?.duration,
        error: (lastErrorMsg?.payload as AgentErrorPayload)?.error,
      };
    });
  }, [agentStatuses, messages]);

  const logs = useMemo((): LogEntry[] => {
    return messages
      .filter((m) =>
        [
          WSEventType.PIPELINE_START,
          WSEventType.AGENT_START,
          WSEventType.AGENT_COMPLETE,
          WSEventType.AGENT_ERROR,
          WSEventType.PIPELINE_COMPLETE,
        ].includes(m.type)
      )
      .map((m) => {
        let message = '';
        let type: LogEntry['type'] = 'info';
        let agentId: string | undefined;
        let agentName: string | undefined;

        switch (m.type) {
          case WSEventType.PIPELINE_START:
            message = 'Pipeline iniciado';
            break;
          case WSEventType.AGENT_START:
            agentId = (m.payload as AgentStartPayload).agentId;
            agentName = (m.payload as AgentStartPayload).agentName;
            message = `${agentName} iniciado`;
            break;
          case WSEventType.AGENT_COMPLETE:
            agentId = (m.payload as AgentCompletePayload).agentId;
            message = `Agente concluido em ${Math.round(
              (m.payload as AgentCompletePayload).duration / 1000
            )}s`;
            type = 'success';
            break;
          case WSEventType.AGENT_ERROR:
            agentId = (m.payload as AgentErrorPayload).agentId;
            message = `Erro: ${(m.payload as AgentErrorPayload).error}`;
            type = 'error';
            break;
          case WSEventType.PIPELINE_COMPLETE:
            const payload = m.payload as PipelineCompletePayload;
            message = `Pipeline ${payload.status === 'completed' ? 'concluido' : 'falhou'} - ${
              payload.postsGenerated
            } posts gerados`;
            type = payload.status === 'completed' ? 'success' : 'error';
            break;
        }

        return {
          timestamp: m.timestamp,
          agentId,
          agentName,
          message,
          type,
        };
      });
  }, [messages]);

  const isRunning = useMemo(() => {
    return agents.some((a) => a.status === AgentStatus.RUNNING);
  }, [agents]);

  const status = useMemo((): PipelineState['status'] => {
    if (!currentExecutionId) return 'idle';
    if (isRunning) return 'running';

    const lastPipelineComplete = messages
      .filter((m) => m.type === WSEventType.PIPELINE_COMPLETE)
      .pop();

    if (lastPipelineComplete) {
      return (lastPipelineComplete.payload as PipelineCompletePayload).status === 'completed'
        ? 'completed'
        : 'failed';
    }

    return 'idle';
  }, [currentExecutionId, isRunning, messages]);

  const progress = useMemo(() => {
    const completedCount = agents.filter((a) => a.status === AgentStatus.SUCCESS).length;
    return Math.round((completedCount / agents.length) * 100);
  }, [agents]);

  const startPipeline = useCallback(() => {
    resetPipelineState();
  }, [resetPipelineState]);

  const resetPipeline = useCallback(() => {
    resetPipelineState();
  }, [resetPipelineState]);

  return {
    executionId: currentExecutionId,
    isRunning,
    status,
    agents,
    progress,
    logs,
    startPipeline,
    resetPipeline,
  };
}

function formatAgentName(agentId: string): string {
  const names: Record<string, string> = {
    researcher: 'Pesquisador',
    'topic-generator': 'Gerador de Topicos',
    curator: 'Curador',
    writer: 'Redator',
    'image-designer': 'Designer de Imagens',
    'carousel-builder': 'Construtor de Carrossel',
    'pdf-maker': 'Gerador de PDF',
    'qa-analyst': 'Analista de QA',
  };
  return names[agentId] || agentId;
}
```

### Componente ConnectionStatus

```tsx
// packages/ui/src/components/websocket/ConnectionStatus.tsx

import { useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConnectionStatus() {
  const { isConnected, isReconnecting, reconnectAttempts, reconnect } = useWebSocket();
  const [showReconnect, setShowReconnect] = useState(false);

  const getStatusColor = () => {
    if (isConnected) return 'text-green-500';
    if (isReconnecting) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusText = () => {
    if (isConnected) return 'Conectado';
    if (isReconnecting) return `Reconectando (${reconnectAttempts}/10)...`;
    return 'Desconectado';
  };

  const getStatusIcon = () => {
    if (isConnected) return Wifi;
    if (isReconnecting) return RefreshCw;
    return WifiOff;
  };

  const Icon = getStatusIcon();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="flex items-center gap-2 cursor-pointer"
            onMouseEnter={() => setShowReconnect(true)}
            onMouseLeave={() => setShowReconnect(false)}
          >
            <Icon
              className={cn(
                'h-4 w-4 transition-colors',
                getStatusColor(),
                isReconnecting && 'animate-spin'
              )}
            />
            {!isConnected && showReconnect && (
              <Button
                variant="ghost"
                size="sm"
                onClick={reconnect}
                className="h-6 px-2 text-xs"
              >
                Reconectar
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getStatusText()}</p>
          {!isConnected && !isReconnecting && (
            <p className="text-xs text-muted-foreground">
              Clique para reconectar manualmente
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

### Fallback com Polling

```typescript
// packages/ui/src/hooks/useWebSocket.ts (adicao)

// Adicionar no hook useWebSocket quando WebSocket nao conectar

const useFallbackPolling = (enabled: boolean, interval = 5000) => {
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    const poll = async () => {
      try {
        const response = await fetch('/api/pipeline/status');
        if (response.ok) {
          const data = await response.json();
          // Process polling data similar to WebSocket message
          // Update store with data
        }
      } catch (error) {
        console.error('[Polling] Error:', error);
      }
    };

    // Initial poll
    poll();

    // Setup interval
    pollingRef.current = setInterval(poll, interval);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [enabled, interval]);
};

// Uso dentro de useWebSocket:
// const shouldPoll = !isConnected && reconnectAttempts >= MAX_RECONNECT_ATTEMPTS;
// useFallbackPolling(shouldPoll);
```

### Configuracao de Ambiente

```typescript
// packages/ui/src/lib/constants.ts

export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const WS_CONFIG = {
  maxReconnectAttempts: 10,
  initialReconnectDelay: 1000,
  maxReconnectDelay: 30000,
  heartbeatInterval: 30000,
  pollingInterval: 5000,
};
```

### Dependencias

```json
{
  "dependencies": {
    "zustand": "^4.4.0"
  }
}
```

---

## Testing

### Testes Unitarios

```typescript
// packages/ui/src/__tests__/useWebSocket.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebSocket } from '../hooks/useWebSocket';
import { WSEventType } from '@social-content/shared';

// Mock WebSocket
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

  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 0);
  }

  send = vi.fn();
  close = vi.fn((code?: number) => {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code: code || 1000 }));
  });

  // Helper to simulate incoming message
  simulateMessage(data: object) {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }));
  }

  // Helper to simulate disconnect
  simulateDisconnect(code = 1006) {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code }));
  }
}

describe('useWebSocket', () => {
  let originalWebSocket: typeof WebSocket;

  beforeEach(() => {
    originalWebSocket = global.WebSocket;
    global.WebSocket = MockWebSocket as unknown as typeof WebSocket;
    vi.useFakeTimers();
  });

  afterEach(() => {
    global.WebSocket = originalWebSocket;
    vi.useRealTimers();
  });

  it('should connect on mount', async () => {
    const { result } = renderHook(() => useWebSocket());

    await act(async () => {
      vi.runAllTimers();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should handle incoming messages', async () => {
    const { result } = renderHook(() => useWebSocket());

    await act(async () => {
      vi.runAllTimers();
    });

    const mockMessage = {
      type: WSEventType.PIPELINE_START,
      payload: { executionId: '123' },
      timestamp: new Date().toISOString(),
    };

    act(() => {
      // Get the WebSocket instance and simulate message
      // This would require accessing the internal WebSocket
    });
  });

  it('should attempt reconnection on disconnect', async () => {
    const { result } = renderHook(() => useWebSocket());

    await act(async () => {
      vi.runAllTimers();
    });

    expect(result.current.isConnected).toBe(true);

    act(() => {
      // Simulate disconnect
      // WebSocket instance closes with abnormal code
    });

    await waitFor(() => {
      expect(result.current.isReconnecting).toBe(true);
    });
  });

  it('should subscribe and unsubscribe to events', async () => {
    const { result } = renderHook(() => useWebSocket());

    await act(async () => {
      vi.runAllTimers();
    });

    const callback = vi.fn();

    act(() => {
      const unsubscribe = result.current.subscribe(WSEventType.AGENT_START, callback);
      // Verify subscription
      // Then unsubscribe
      unsubscribe();
    });
  });

  it('should cleanup on unmount', async () => {
    const { result, unmount } = renderHook(() => useWebSocket());

    await act(async () => {
      vi.runAllTimers();
    });

    expect(result.current.isConnected).toBe(true);

    unmount();

    // Verify WebSocket is closed
    // Verify intervals are cleared
  });

  it('should respect max reconnect attempts', async () => {
    const { result } = renderHook(() => useWebSocket());

    // Simulate multiple failed reconnection attempts
    for (let i = 0; i < 11; i++) {
      await act(async () => {
        vi.runAllTimers();
      });
    }

    await waitFor(() => {
      expect(result.current.isReconnecting).toBe(false);
      expect(result.current.reconnectAttempts).toBeGreaterThanOrEqual(10);
    });
  });
});

describe('ConnectionStatus', () => {
  it('should render connected state', () => {
    // Mock useWebSocket to return connected state
    // Render ConnectionStatus
    // Verify green icon and "Conectado" tooltip
  });

  it('should render disconnected state with reconnect button', () => {
    // Mock useWebSocket to return disconnected state
    // Render ConnectionStatus
    // Hover to show reconnect button
    // Verify red icon and "Desconectado" tooltip
  });

  it('should render reconnecting state', () => {
    // Mock useWebSocket to return reconnecting state
    // Render ConnectionStatus
    // Verify yellow icon with animation
  });

  it('should call reconnect when button clicked', () => {
    // Mock useWebSocket
    // Render ConnectionStatus
    // Click reconnect button
    // Verify reconnect was called
  });
});

describe('usePipelineStatus', () => {
  it('should initialize with idle state', () => {
    const { result } = renderHook(() => usePipelineStatus());

    expect(result.current.status).toBe('idle');
    expect(result.current.isRunning).toBe(false);
    expect(result.current.progress).toBe(0);
  });

  it('should update state on pipeline start event', () => {
    // Subscribe to events and simulate PIPELINE_START
    // Verify executionId is set
    // Verify status changes to running
  });

  it('should track agent progress', () => {
    // Simulate AGENT_START, AGENT_PROGRESS, AGENT_COMPLETE events
    // Verify agents array is updated correctly
    // Verify progress percentage is calculated
  });

  it('should handle agent errors', () => {
    // Simulate AGENT_ERROR event
    // Verify agent status is set to error
    // Verify error message is in logs
  });

  it('should calculate overall progress correctly', () => {
    // Simulate multiple agents completing
    // Verify progress = (completed / total) * 100
  });
});
```

### Validacoes Manuais

1. Abrir aplicacao e verificar indicador de conexao no header
2. Verificar que indicador fica verde quando conectado
3. Desligar servidor backend e verificar que indicador fica vermelho
4. Verificar que reconexao automatica acontece
5. Clicar em "Reconectar" e verificar reconexao manual
6. Iniciar pipeline e verificar que eventos chegam em tempo real
7. Verificar logs de eventos na view de execucao
8. Verificar que progresso dos agentes atualiza em tempo real
9. Parar servidor por muito tempo e verificar fallback de polling
10. Verificar que componentes nao quebram sem WebSocket
11. Navegar entre paginas e verificar que conexao persiste
12. Verificar cleanup apos fechar pagina (DevTools > WebSocket)

---

## References

- [PRD](../prd.md) - Story 5.2
- [Architecture](../architecture.md) - WebSocket Events, Frontend Architecture
- [Story 5.1](./story-5.1.md) - WebSocket Server para Real-Time (dependencia)
- [Story 4.8](./story-4.8.md) - Historico de Execucoes na UI (referencia de padrao)

---

## Dev Agent Record

### File List

| Status | File | Changes |
|--------|------|---------|
| Created | `packages/ui/src/hooks/useWebSocket.ts` | WebSocket hook with connection, reconnection, heartbeat, and fallback polling |
| Created | `packages/ui/src/hooks/usePipelineStatus.ts` | Pipeline status hook that tracks execution progress and agent states |
| Created | `packages/ui/src/hooks/index.ts` | Barrel export for all hooks |
| Created | `packages/ui/src/stores/websocket.store.ts` | Zustand store for WebSocket state management |
| Created | `packages/ui/src/components/websocket/ConnectionStatus.tsx` | Visual indicator component for connection status |
| Created | `packages/ui/src/components/websocket/index.ts` | Barrel export for websocket components |
| Created | `packages/ui/src/providers/WebSocketProvider.tsx` | React context provider for WebSocket |
| Created | `packages/ui/src/providers/index.ts` | Barrel export for providers |
| Created | `packages/ui/src/lib/constants.ts` | WebSocket configuration constants |
| Created | `packages/ui/src/__tests__/useWebSocket.test.ts` | Tests for WebSocket store functionality |
| Created | `packages/ui/src/__tests__/usePipelineStatus.test.ts` | Tests for usePipelineStatus hook |
| Created | `packages/ui/src/__tests__/ConnectionStatus.test.tsx` | Tests for ConnectionStatus component |
| Modified | `packages/ui/src/components/layout/Header.tsx` | Added ConnectionStatus to header |
| Modified | `packages/ui/src/App.tsx` | Added WebSocketProvider wrapper |
| Modified | `packages/shared/src/types/events.ts` | Added WebSocket payload types |

### Debug Log

_No debug entries_

### Completion Notes

Story 5.2 completed successfully with all acceptance criteria met:
- AC1: useWebSocket hook implemented and importable
- AC2: Connection, reconnection with exponential backoff, and cleanup implemented
- AC3: Returns isConnected, lastMessage, subscribe(), unsubscribe(), send(), reconnect(), disconnect()
- AC4: Integrated with Zustand store for global state (websocket.store.ts)
- AC5: usePipelineStatus hook implemented with pipeline-specific filtering
- AC6: ConnectionStatus component displays status with colors and tooltips
- AC7: Fallback polling implemented when WebSocket unavailable
- AC8: 39 unit tests passing covering all functionality

Tests: 39 passed (3 test files)
TypeCheck: No errors in Story 5.2 files

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-29 | Story created | River (SM Agent) |
| 2026-01-29 | Story implemented and completed | Dex (Dev Agent) |
