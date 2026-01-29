# Story 5.1: WebSocket Server para Real-Time

> Epic 5: Dashboard UI

---

## Story

**Como** desenvolvedor,
**Quero** um servidor WebSocket integrado ao backend,
**Para que** a UI receba atualizacoes em tempo real.

---

## Status

`Ready for Review`

---

## Acceptance Criteria

| # | Criterio | Validacao |
|---|----------|-----------|
| AC1 | WebSocket server configurado no Fastify | Plugin `@fastify/websocket` instalado e funcionando em `/ws` |
| AC2 | Eventos definidos: `pipeline:start`, `agent:start`, `agent:complete`, `agent:error`, `pipeline:complete` | Tipos TypeScript criados, eventos emitidos corretamente |
| AC3 | Payload inclui: agent_id, status, progress, timestamp, data | Interface `WSEvent` validada, payloads tipados |
| AC4 | Suporte a multiplas conexoes simultaneas | ConnectionManager gerencia array de clientes conectados |
| AC5 | Heartbeat para manter conexoes vivas | Ping/pong a cada 30 segundos, desconexao apos timeout |
| AC6 | Reconexao automatica no cliente | Hook useWebSocket implementa retry com backoff exponencial |
| AC7 | Logging de conexoes/desconexoes | Logs estruturados no servidor para debug |
| AC8 | Testes de eventos WebSocket | `pnpm test` passa com cobertura de eventos WS |

---

## Tasks

- [x] **Task 1:** Configurar WebSocket no Fastify
  - [x] Instalar dependencia: `@fastify/websocket`
  - [x] Criar `packages/api/src/websocket/server.ts`
  - [x] Registrar plugin no servidor Fastify
  - [x] Configurar rota `/ws` para conexoes WebSocket
  - [x] Adicionar configuracao de maxPayload e ping/pong
  - [x] Integrar com logger do Fastify

- [x] **Task 2:** Definir tipos de eventos WebSocket
  - [x] Criar `packages/api/src/websocket/types.ts`
  - [x] Definir enum `WSEventType` com todos os eventos
  - [x] Criar interface `WSEvent` base
  - [x] Criar interface `PipelineStartEvent`
  - [x] Criar interface `AgentStartEvent`
  - [x] Criar interface `AgentProgressEvent`
  - [x] Criar interface `AgentCompleteEvent`
  - [x] Criar interface `AgentErrorEvent`
  - [x] Criar interface `PipelineCompleteEvent`
  - [x] Exportar tipos em `packages/shared/src/types/events.ts`

- [x] **Task 3:** Implementar ConnectionManager
  - [x] Criar `packages/api/src/websocket/connection-manager.ts`
  - [x] Implementar singleton pattern para gerenciamento
  - [x] Implementar `addConnection(ws: WebSocket, id: string)`
  - [x] Implementar `removeConnection(id: string)`
  - [x] Implementar `broadcast(event: WSEvent)`
  - [x] Implementar `sendTo(id: string, event: WSEvent)`
  - [x] Implementar `getConnections(): ConnectionInfo[]`
  - [x] Implementar `getConnectionCount(): number`
  - [x] Adicionar cleanup automatico de conexoes mortas

- [x] **Task 4:** Implementar sistema de heartbeat
  - [x] Criar `packages/api/src/websocket/heartbeat.ts`
  - [x] Configurar intervalo de ping (30 segundos)
  - [x] Implementar timeout de pong (10 segundos)
  - [x] Marcar conexoes como alive/dead
  - [x] Implementar cleanup de conexoes sem resposta
  - [x] Adicionar metricas de latencia por conexao

- [x] **Task 5:** Criar EventEmitter para pipeline
  - [x] Criar `packages/api/src/websocket/pipeline-emitter.ts`
  - [x] Implementar classe `PipelineEventEmitter`
  - [x] Implementar `emitPipelineStart(executionId, config)`
  - [x] Implementar `emitAgentStart(executionId, agentId, agentName)`
  - [x] Implementar `emitAgentProgress(executionId, agentId, progress, message)`
  - [x] Implementar `emitAgentComplete(executionId, agentId, duration, result)`
  - [x] Implementar `emitAgentError(executionId, agentId, error, willRetry)`
  - [x] Implementar `emitPipelineComplete(executionId, status, stats)`
  - [x] Integrar com ConnectionManager para broadcast

- [x] **Task 6:** Criar handlers de mensagens do cliente
  - [x] Criar `packages/api/src/websocket/handlers.ts`
  - [x] Implementar handler para `subscribe` (filtrar eventos)
  - [x] Implementar handler para `unsubscribe`
  - [x] Implementar handler para `ping` (heartbeat manual)
  - [x] Implementar handler para `getStatus` (status do pipeline)
  - [x] Adicionar validacao de mensagens recebidas
  - [x] Implementar rate limiting por conexao

- [x] **Task 7:** Criar barrel exports e integracao
  - [x] Criar `packages/api/src/websocket/index.ts`
  - [x] Exportar todos os modulos (server, types, manager, events)
  - [x] Adicionar inicializacao no servidor Fastify
  - [x] Integrar PipelineEventEmitter com PipelineService
  - [x] Atualizar `.env.example` com variaveis WS (WS_PORT, WS_HEARTBEAT_INTERVAL)

- [x] **Task 8:** Escrever testes unitarios
  - [x] Criar `packages/api/src/__tests__/websocket/` diretorio
  - [x] Criar `connection-manager.test.ts` - gerenciamento de conexoes
  - [x] Criar `heartbeat.test.ts` - sistema de ping/pong
  - [x] Criar `pipeline-events.test.ts` - emissao de eventos
  - [x] Criar `handlers.test.ts` - handlers de mensagens
  - [x] Criar `integration.test.ts` - fluxo completo de conexao
  - [x] Usar mock WebSocket para testes isolados
  - [x] Testar cenarios de erro (conexao perdida, timeout)

- [x] **Task 9:** Documentar uso do WebSocket
  - [x] Adicionar comentarios JSDoc em todos os metodos publicos
  - [x] Criar exemplo de uso no cliente (para Story 5.2)
  - [x] Documentar formato de mensagens no codigo

---

## Dev Notes

### Estrutura do WebSocket

```
packages/api/
├── src/
│   ├── websocket/
│   │   ├── server.ts           # Setup do Fastify WebSocket
│   │   ├── types.ts            # Tipos de eventos
│   │   ├── connection-manager.ts  # Gerenciamento de conexoes
│   │   ├── heartbeat.ts        # Sistema de ping/pong
│   │   ├── pipeline-events.ts  # Emissao de eventos do pipeline
│   │   ├── handlers.ts         # Handlers de mensagens do cliente
│   │   └── index.ts            # Barrel exports
│   ├── __tests__/
│   │   ├── websocket/
│   │   │   ├── connection-manager.test.ts
│   │   │   ├── heartbeat.test.ts
│   │   │   ├── pipeline-events.test.ts
│   │   │   ├── handlers.test.ts
│   │   │   └── integration.test.ts
```

### Tipos de Eventos WebSocket

```typescript
// websocket/types.ts

/**
 * Tipos de eventos WebSocket
 */
export enum WSEventType {
  // Pipeline events
  PIPELINE_START = 'pipeline:start',
  PIPELINE_COMPLETE = 'pipeline:complete',

  // Agent events
  AGENT_START = 'agent:start',
  AGENT_PROGRESS = 'agent:progress',
  AGENT_COMPLETE = 'agent:complete',
  AGENT_ERROR = 'agent:error',

  // Connection events
  CONNECTED = 'connected',
  HEARTBEAT = 'heartbeat',
  ERROR = 'error'
}

/**
 * Evento base WebSocket
 */
export interface WSEvent<T = unknown> {
  type: WSEventType;
  payload: T;
  timestamp: string;
  executionId?: string;
}

/**
 * Payload para pipeline:start
 */
export interface PipelineStartPayload {
  executionId: string;
  config: {
    numPosts: number;
    platforms: string[];
    includeVisual: boolean;
    qualityThreshold: number;
  };
  totalAgents: number;
}

/**
 * Payload para agent:start
 */
export interface AgentStartPayload {
  executionId: string;
  agentId: string;
  agentName: string;
  agentIndex: number;
  totalAgents: number;
}

/**
 * Payload para agent:progress
 */
export interface AgentProgressPayload {
  executionId: string;
  agentId: string;
  progress: number; // 0-100
  message: string;
  currentStep?: string;
  data?: unknown;
}

/**
 * Payload para agent:complete
 */
export interface AgentCompletePayload {
  executionId: string;
  agentId: string;
  agentName: string;
  duration: number; // ms
  success: boolean;
  result?: {
    itemsProcessed?: number;
    outputPath?: string;
    summary?: string;
  };
}

/**
 * Payload para agent:error
 */
export interface AgentErrorPayload {
  executionId: string;
  agentId: string;
  agentName: string;
  error: string;
  errorCode?: string;
  willRetry: boolean;
  retryCount?: number;
  maxRetries?: number;
}

/**
 * Payload para pipeline:complete
 */
export interface PipelineCompletePayload {
  executionId: string;
  status: 'completed' | 'failed' | 'cancelled';
  duration: number; // ms
  stats: {
    postsGenerated: number;
    postsApproved: number;
    averageScore: number;
    agentsExecuted: number;
    errorsCount: number;
  };
}

/**
 * Mensagens do cliente para servidor
 */
export enum WSClientMessage {
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  PING = 'ping',
  GET_STATUS = 'get_status'
}

/**
 * Payload de subscribe do cliente
 */
export interface SubscribePayload {
  executionId?: string; // Filtrar por execucao especifica
  events?: WSEventType[]; // Filtrar por tipos de evento
}

/**
 * Informacoes de conexao
 */
export interface ConnectionInfo {
  id: string;
  connectedAt: string;
  lastPing: string;
  subscriptions: SubscribePayload;
  isAlive: boolean;
}
```

### WebSocket Server Setup

```typescript
// websocket/server.ts

import { FastifyInstance, FastifyRequest } from 'fastify';
import websocket from '@fastify/websocket';
import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { ConnectionManager } from './connection-manager';
import { startHeartbeat, stopHeartbeat } from './heartbeat';
import { handleMessage } from './handlers';
import { WSEventType, WSEvent } from './types';

/**
 * Registra plugin WebSocket no Fastify
 */
export async function registerWebSocket(fastify: FastifyInstance): Promise<void> {
  // Registra plugin
  await fastify.register(websocket, {
    options: {
      maxPayload: 1048576, // 1MB
      clientTracking: true
    }
  });

  // Rota WebSocket
  fastify.get('/ws', { websocket: true }, (connection, request) => {
    const ws = connection.socket;
    const connectionId = uuidv4();
    const logger = fastify.log.child({ connectionId });

    logger.info('New WebSocket connection');

    // Registra conexao
    ConnectionManager.getInstance().addConnection(ws, connectionId);

    // Envia evento de conexao
    const connectedEvent: WSEvent = {
      type: WSEventType.CONNECTED,
      payload: { connectionId },
      timestamp: new Date().toISOString()
    };
    ws.send(JSON.stringify(connectedEvent));

    // Handler de mensagens
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(ws, connectionId, message, logger);
      } catch (error) {
        logger.error({ error }, 'Failed to parse WebSocket message');
        ws.send(JSON.stringify({
          type: WSEventType.ERROR,
          payload: { error: 'Invalid message format' },
          timestamp: new Date().toISOString()
        }));
      }
    });

    // Handler de fechamento
    ws.on('close', (code, reason) => {
      logger.info({ code, reason: reason.toString() }, 'WebSocket connection closed');
      ConnectionManager.getInstance().removeConnection(connectionId);
    });

    // Handler de erro
    ws.on('error', (error) => {
      logger.error({ error }, 'WebSocket error');
      ConnectionManager.getInstance().removeConnection(connectionId);
    });

    // Marca como alive para heartbeat
    (ws as any).isAlive = true;
    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });
  });

  // Inicia heartbeat
  startHeartbeat();

  // Cleanup no shutdown
  fastify.addHook('onClose', async () => {
    stopHeartbeat();
    ConnectionManager.getInstance().closeAll();
  });

  fastify.log.info('WebSocket server registered on /ws');
}
```

### Connection Manager

```typescript
// websocket/connection-manager.ts

import { WebSocket } from 'ws';
import { WSEvent, ConnectionInfo, SubscribePayload } from './types';

interface ManagedConnection {
  ws: WebSocket;
  id: string;
  connectedAt: Date;
  lastPing: Date;
  subscriptions: SubscribePayload;
  isAlive: boolean;
}

/**
 * Gerenciador de conexoes WebSocket (Singleton)
 */
export class ConnectionManager {
  private static instance: ConnectionManager;
  private connections: Map<string, ManagedConnection> = new Map();

  private constructor() {}

  /**
   * Obtem instancia unica
   */
  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  /**
   * Reseta instancia (para testes)
   */
  static resetInstance(): void {
    if (ConnectionManager.instance) {
      ConnectionManager.instance.closeAll();
      ConnectionManager.instance = undefined as any;
    }
  }

  /**
   * Adiciona nova conexao
   */
  addConnection(ws: WebSocket, id: string): void {
    const connection: ManagedConnection = {
      ws,
      id,
      connectedAt: new Date(),
      lastPing: new Date(),
      subscriptions: {},
      isAlive: true
    };

    this.connections.set(id, connection);
  }

  /**
   * Remove conexao
   */
  removeConnection(id: string): void {
    const connection = this.connections.get(id);
    if (connection) {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.close();
      }
      this.connections.delete(id);
    }
  }

  /**
   * Obtem conexao por ID
   */
  getConnection(id: string): ManagedConnection | undefined {
    return this.connections.get(id);
  }

  /**
   * Atualiza subscriptions de uma conexao
   */
  updateSubscriptions(id: string, subscriptions: SubscribePayload): void {
    const connection = this.connections.get(id);
    if (connection) {
      connection.subscriptions = { ...connection.subscriptions, ...subscriptions };
    }
  }

  /**
   * Envia evento para todas as conexoes
   */
  broadcast(event: WSEvent): void {
    const message = JSON.stringify(event);

    for (const connection of this.connections.values()) {
      if (connection.ws.readyState === WebSocket.OPEN) {
        // Verifica filtros de subscription
        if (this.shouldReceive(connection, event)) {
          connection.ws.send(message);
        }
      }
    }
  }

  /**
   * Envia evento para conexao especifica
   */
  sendTo(id: string, event: WSEvent): void {
    const connection = this.connections.get(id);
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify(event));
    }
  }

  /**
   * Obtem lista de conexoes ativas
   */
  getConnections(): ConnectionInfo[] {
    return Array.from(this.connections.values()).map(conn => ({
      id: conn.id,
      connectedAt: conn.connectedAt.toISOString(),
      lastPing: conn.lastPing.toISOString(),
      subscriptions: conn.subscriptions,
      isAlive: conn.isAlive
    }));
  }

  /**
   * Obtem numero de conexoes
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Obtem todas as conexoes (para heartbeat)
   */
  getAllConnections(): Map<string, ManagedConnection> {
    return this.connections;
  }

  /**
   * Marca conexao como alive
   */
  markAlive(id: string): void {
    const connection = this.connections.get(id);
    if (connection) {
      connection.isAlive = true;
      connection.lastPing = new Date();
    }
  }

  /**
   * Fecha todas as conexoes
   */
  closeAll(): void {
    for (const connection of this.connections.values()) {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.close(1000, 'Server shutdown');
      }
    }
    this.connections.clear();
  }

  /**
   * Verifica se conexao deve receber evento baseado em filtros
   */
  private shouldReceive(connection: ManagedConnection, event: WSEvent): boolean {
    const { subscriptions } = connection;

    // Se nao tem filtros, recebe tudo
    if (!subscriptions.executionId && !subscriptions.events) {
      return true;
    }

    // Filtro por execucao
    if (subscriptions.executionId && event.executionId) {
      if (subscriptions.executionId !== event.executionId) {
        return false;
      }
    }

    // Filtro por tipo de evento
    if (subscriptions.events && subscriptions.events.length > 0) {
      if (!subscriptions.events.includes(event.type)) {
        return false;
      }
    }

    return true;
  }
}
```

### Sistema de Heartbeat

```typescript
// websocket/heartbeat.ts

import { WebSocket } from 'ws';
import { ConnectionManager } from './connection-manager';

const HEARTBEAT_INTERVAL = parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000', 10);
const PONG_TIMEOUT = 10000; // 10 segundos

let heartbeatInterval: NodeJS.Timeout | null = null;

/**
 * Inicia sistema de heartbeat
 */
export function startHeartbeat(): void {
  if (heartbeatInterval) {
    return;
  }

  heartbeatInterval = setInterval(() => {
    const manager = ConnectionManager.getInstance();
    const connections = manager.getAllConnections();

    for (const [id, connection] of connections) {
      // Se nao respondeu ao ultimo ping, remove
      if (!connection.isAlive) {
        console.log(`[Heartbeat] Connection ${id} timed out, removing`);
        manager.removeConnection(id);
        continue;
      }

      // Marca como morto ate receber pong
      connection.isAlive = false;

      // Envia ping
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.ping();
      }
    }
  }, HEARTBEAT_INTERVAL);

  console.log(`[Heartbeat] Started with interval ${HEARTBEAT_INTERVAL}ms`);
}

/**
 * Para sistema de heartbeat
 */
export function stopHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    console.log('[Heartbeat] Stopped');
  }
}

/**
 * Verifica se heartbeat esta rodando
 */
export function isHeartbeatRunning(): boolean {
  return heartbeatInterval !== null;
}

/**
 * Obtem intervalo de heartbeat configurado
 */
export function getHeartbeatInterval(): number {
  return HEARTBEAT_INTERVAL;
}
```

### Pipeline Event Emitter

```typescript
// websocket/pipeline-events.ts

import { ConnectionManager } from './connection-manager';
import {
  WSEvent,
  WSEventType,
  PipelineStartPayload,
  AgentStartPayload,
  AgentProgressPayload,
  AgentCompletePayload,
  AgentErrorPayload,
  PipelineCompletePayload
} from './types';

/**
 * Lista de agentes do pipeline
 */
export const PIPELINE_AGENTS = [
  { id: 'researcher', name: 'Pesquisador' },
  { id: 'topic-generator', name: 'Gerador de Topicos' },
  { id: 'curator', name: 'Curador' },
  { id: 'writer', name: 'Redator' },
  { id: 'image-designer', name: 'Designer de Imagens' },
  { id: 'carousel-builder', name: 'Carousel Builder' },
  { id: 'pdf-maker', name: 'PDF Maker' },
  { id: 'qa-analyst', name: 'QA Analyst' }
];

/**
 * Emissor de eventos do pipeline
 */
export class PipelineEventEmitter {
  private static instance: PipelineEventEmitter;
  private connectionManager: ConnectionManager;

  private constructor() {
    this.connectionManager = ConnectionManager.getInstance();
  }

  /**
   * Obtem instancia unica
   */
  static getInstance(): PipelineEventEmitter {
    if (!PipelineEventEmitter.instance) {
      PipelineEventEmitter.instance = new PipelineEventEmitter();
    }
    return PipelineEventEmitter.instance;
  }

  /**
   * Emite evento de inicio do pipeline
   */
  emitPipelineStart(
    executionId: string,
    config: PipelineStartPayload['config']
  ): void {
    const event: WSEvent<PipelineStartPayload> = {
      type: WSEventType.PIPELINE_START,
      payload: {
        executionId,
        config,
        totalAgents: PIPELINE_AGENTS.length
      },
      timestamp: new Date().toISOString(),
      executionId
    };

    this.connectionManager.broadcast(event);
  }

  /**
   * Emite evento de inicio de agente
   */
  emitAgentStart(
    executionId: string,
    agentId: string,
    agentName: string
  ): void {
    const agentIndex = PIPELINE_AGENTS.findIndex(a => a.id === agentId);

    const event: WSEvent<AgentStartPayload> = {
      type: WSEventType.AGENT_START,
      payload: {
        executionId,
        agentId,
        agentName,
        agentIndex: agentIndex >= 0 ? agentIndex : 0,
        totalAgents: PIPELINE_AGENTS.length
      },
      timestamp: new Date().toISOString(),
      executionId
    };

    this.connectionManager.broadcast(event);
  }

  /**
   * Emite evento de progresso de agente
   */
  emitAgentProgress(
    executionId: string,
    agentId: string,
    progress: number,
    message: string,
    data?: unknown
  ): void {
    const event: WSEvent<AgentProgressPayload> = {
      type: WSEventType.AGENT_PROGRESS,
      payload: {
        executionId,
        agentId,
        progress: Math.min(100, Math.max(0, progress)), // Clamp 0-100
        message,
        data
      },
      timestamp: new Date().toISOString(),
      executionId
    };

    this.connectionManager.broadcast(event);
  }

  /**
   * Emite evento de conclusao de agente
   */
  emitAgentComplete(
    executionId: string,
    agentId: string,
    agentName: string,
    duration: number,
    result?: AgentCompletePayload['result']
  ): void {
    const event: WSEvent<AgentCompletePayload> = {
      type: WSEventType.AGENT_COMPLETE,
      payload: {
        executionId,
        agentId,
        agentName,
        duration,
        success: true,
        result
      },
      timestamp: new Date().toISOString(),
      executionId
    };

    this.connectionManager.broadcast(event);
  }

  /**
   * Emite evento de erro de agente
   */
  emitAgentError(
    executionId: string,
    agentId: string,
    agentName: string,
    error: string,
    willRetry: boolean,
    retryCount?: number,
    maxRetries?: number
  ): void {
    const event: WSEvent<AgentErrorPayload> = {
      type: WSEventType.AGENT_ERROR,
      payload: {
        executionId,
        agentId,
        agentName,
        error,
        willRetry,
        retryCount,
        maxRetries
      },
      timestamp: new Date().toISOString(),
      executionId
    };

    this.connectionManager.broadcast(event);
  }

  /**
   * Emite evento de conclusao do pipeline
   */
  emitPipelineComplete(
    executionId: string,
    status: 'completed' | 'failed' | 'cancelled',
    duration: number,
    stats: PipelineCompletePayload['stats']
  ): void {
    const event: WSEvent<PipelineCompletePayload> = {
      type: WSEventType.PIPELINE_COMPLETE,
      payload: {
        executionId,
        status,
        duration,
        stats
      },
      timestamp: new Date().toISOString(),
      executionId
    };

    this.connectionManager.broadcast(event);
  }
}
```

### Handlers de Mensagens

```typescript
// websocket/handlers.ts

import { WebSocket } from 'ws';
import { FastifyBaseLogger } from 'fastify';
import { ConnectionManager } from './connection-manager';
import { WSClientMessage, SubscribePayload, WSEventType, WSEvent } from './types';

interface ClientMessage {
  type: WSClientMessage;
  payload?: unknown;
}

// Rate limiting por conexao
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60; // mensagens por minuto
const RATE_WINDOW = 60000; // 1 minuto

/**
 * Processa mensagem recebida do cliente
 */
export function handleMessage(
  ws: WebSocket,
  connectionId: string,
  message: ClientMessage,
  logger: FastifyBaseLogger
): void {
  // Rate limiting
  if (!checkRateLimit(connectionId)) {
    const errorEvent: WSEvent = {
      type: WSEventType.ERROR,
      payload: { error: 'Rate limit exceeded', retryAfter: 60 },
      timestamp: new Date().toISOString()
    };
    ws.send(JSON.stringify(errorEvent));
    logger.warn({ connectionId }, 'Rate limit exceeded');
    return;
  }

  logger.debug({ message }, 'Received message from client');

  switch (message.type) {
    case WSClientMessage.SUBSCRIBE:
      handleSubscribe(connectionId, message.payload as SubscribePayload, logger);
      break;

    case WSClientMessage.UNSUBSCRIBE:
      handleUnsubscribe(connectionId, logger);
      break;

    case WSClientMessage.PING:
      handlePing(ws, connectionId, logger);
      break;

    case WSClientMessage.GET_STATUS:
      handleGetStatus(ws, connectionId, logger);
      break;

    default:
      const errorEvent: WSEvent = {
        type: WSEventType.ERROR,
        payload: { error: `Unknown message type: ${message.type}` },
        timestamp: new Date().toISOString()
      };
      ws.send(JSON.stringify(errorEvent));
      logger.warn({ type: message.type }, 'Unknown message type');
  }
}

/**
 * Handler para subscribe
 */
function handleSubscribe(
  connectionId: string,
  payload: SubscribePayload,
  logger: FastifyBaseLogger
): void {
  const manager = ConnectionManager.getInstance();
  manager.updateSubscriptions(connectionId, payload);
  logger.info({ connectionId, payload }, 'Client subscribed');
}

/**
 * Handler para unsubscribe
 */
function handleUnsubscribe(
  connectionId: string,
  logger: FastifyBaseLogger
): void {
  const manager = ConnectionManager.getInstance();
  manager.updateSubscriptions(connectionId, {});
  logger.info({ connectionId }, 'Client unsubscribed');
}

/**
 * Handler para ping manual
 */
function handlePing(
  ws: WebSocket,
  connectionId: string,
  logger: FastifyBaseLogger
): void {
  const manager = ConnectionManager.getInstance();
  manager.markAlive(connectionId);

  const pongEvent: WSEvent = {
    type: WSEventType.HEARTBEAT,
    payload: { status: 'pong', connectionId },
    timestamp: new Date().toISOString()
  };
  ws.send(JSON.stringify(pongEvent));
  logger.debug({ connectionId }, 'Responded to manual ping');
}

/**
 * Handler para get_status
 */
function handleGetStatus(
  ws: WebSocket,
  connectionId: string,
  logger: FastifyBaseLogger
): void {
  const manager = ConnectionManager.getInstance();
  const connection = manager.getConnection(connectionId);

  const statusEvent: WSEvent = {
    type: WSEventType.HEARTBEAT,
    payload: {
      status: 'connected',
      connectionId,
      connectedAt: connection?.connectedAt.toISOString(),
      subscriptions: connection?.subscriptions,
      totalConnections: manager.getConnectionCount()
    },
    timestamp: new Date().toISOString()
  };
  ws.send(JSON.stringify(statusEvent));
  logger.debug({ connectionId }, 'Sent connection status');
}

/**
 * Verifica rate limit para conexao
 */
function checkRateLimit(connectionId: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(connectionId);

  if (!limit || now > limit.resetAt) {
    rateLimits.set(connectionId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (limit.count >= RATE_LIMIT) {
    return false;
  }

  limit.count++;
  return true;
}

/**
 * Limpa rate limits (para testes)
 */
export function clearRateLimits(): void {
  rateLimits.clear();
}
```

### Integracao com Fastify

```typescript
// Adicionar ao server.ts

import { registerWebSocket } from './websocket';

async function buildServer() {
  const fastify = Fastify({ logger: true });

  // ... outras configuracoes ...

  // Registra WebSocket
  await registerWebSocket(fastify);

  // ... rotas e plugins ...

  return fastify;
}
```

### Integracao com PipelineService

```typescript
// Exemplo de uso no PipelineService

import { PipelineEventEmitter } from '../websocket/pipeline-events';

export class PipelineService {
  private eventEmitter = PipelineEventEmitter.getInstance();

  async run(config: PipelineConfig): Promise<Execution> {
    const execution = await this.createExecution(config);

    // Emite evento de inicio
    this.eventEmitter.emitPipelineStart(execution.id, config);

    const startTime = Date.now();

    try {
      // Executa agentes
      for (const agent of agents) {
        const agentStartTime = Date.now();

        this.eventEmitter.emitAgentStart(execution.id, agent.id, agent.name);

        try {
          const result = await agent.run();
          const duration = Date.now() - agentStartTime;

          this.eventEmitter.emitAgentComplete(
            execution.id,
            agent.id,
            agent.name,
            duration,
            { itemsProcessed: result.count }
          );
        } catch (error) {
          this.eventEmitter.emitAgentError(
            execution.id,
            agent.id,
            agent.name,
            error.message,
            true, // willRetry
            1,
            3
          );
        }
      }

      // Emite conclusao
      const duration = Date.now() - startTime;
      this.eventEmitter.emitPipelineComplete(execution.id, 'completed', duration, {
        postsGenerated: 5,
        postsApproved: 4,
        averageScore: 8.2,
        agentsExecuted: 8,
        errorsCount: 0
      });
    } catch (error) {
      this.eventEmitter.emitPipelineComplete(execution.id, 'failed', Date.now() - startTime, {
        postsGenerated: 0,
        postsApproved: 0,
        averageScore: 0,
        agentsExecuted: 0,
        errorsCount: 1
      });
    }

    return execution;
  }
}
```

---

## Testing

### Testes do ConnectionManager

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WebSocket } from 'ws';
import { ConnectionManager } from '../websocket/connection-manager';
import { WSEventType } from '../websocket/types';

// Mock WebSocket
class MockWebSocket {
  readyState = WebSocket.OPEN;
  sentMessages: string[] = [];

  send(data: string): void {
    this.sentMessages.push(data);
  }

  close(): void {
    this.readyState = WebSocket.CLOSED;
  }

  ping(): void {}
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

  describe('singleton', () => {
    it('should return same instance', () => {
      const instance1 = ConnectionManager.getInstance();
      const instance2 = ConnectionManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('addConnection', () => {
    it('should add connection', () => {
      const ws = new MockWebSocket() as unknown as WebSocket;
      manager.addConnection(ws, 'conn-1');

      expect(manager.getConnectionCount()).toBe(1);
      expect(manager.getConnection('conn-1')).toBeDefined();
    });
  });

  describe('removeConnection', () => {
    it('should remove connection', () => {
      const ws = new MockWebSocket() as unknown as WebSocket;
      manager.addConnection(ws, 'conn-1');
      manager.removeConnection('conn-1');

      expect(manager.getConnectionCount()).toBe(0);
      expect(manager.getConnection('conn-1')).toBeUndefined();
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
        timestamp: new Date().toISOString()
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
        executionId: 'exec-456'
      });

      expect(ws1.sentMessages).toHaveLength(0); // Filtered out
      expect(ws2.sentMessages).toHaveLength(1); // No filter
    });
  });

  describe('sendTo', () => {
    it('should send event to specific connection', () => {
      const ws1 = new MockWebSocket();
      const ws2 = new MockWebSocket();
      manager.addConnection(ws1 as unknown as WebSocket, 'conn-1');
      manager.addConnection(ws2 as unknown as WebSocket, 'conn-2');

      manager.sendTo('conn-1', {
        type: WSEventType.HEARTBEAT,
        payload: { test: true },
        timestamp: new Date().toISOString()
      });

      expect(ws1.sentMessages).toHaveLength(1);
      expect(ws2.sentMessages).toHaveLength(0);
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
    });
  });
});
```

### Testes do PipelineEventEmitter

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocket } from 'ws';
import { ConnectionManager } from '../websocket/connection-manager';
import { PipelineEventEmitter } from '../websocket/pipeline-events';
import { WSEventType } from '../websocket/types';

class MockWebSocket {
  readyState = WebSocket.OPEN;
  sentMessages: any[] = [];

  send(data: string): void {
    this.sentMessages.push(JSON.parse(data));
  }

  close(): void {
    this.readyState = WebSocket.CLOSED;
  }

  ping(): void {}
}

describe('PipelineEventEmitter', () => {
  let emitter: PipelineEventEmitter;
  let manager: ConnectionManager;
  let mockWs: MockWebSocket;

  beforeEach(() => {
    ConnectionManager.resetInstance();
    manager = ConnectionManager.getInstance();
    mockWs = new MockWebSocket();
    manager.addConnection(mockWs as unknown as WebSocket, 'conn-1');
    emitter = PipelineEventEmitter.getInstance();
  });

  afterEach(() => {
    ConnectionManager.resetInstance();
  });

  describe('emitPipelineStart', () => {
    it('should broadcast pipeline:start event', () => {
      emitter.emitPipelineStart('exec-123', {
        numPosts: 3,
        platforms: ['instagram'],
        includeVisual: true,
        qualityThreshold: 6.0
      });

      expect(mockWs.sentMessages).toHaveLength(1);
      expect(mockWs.sentMessages[0].type).toBe(WSEventType.PIPELINE_START);
      expect(mockWs.sentMessages[0].payload.executionId).toBe('exec-123');
      expect(mockWs.sentMessages[0].payload.totalAgents).toBe(8);
    });
  });

  describe('emitAgentStart', () => {
    it('should broadcast agent:start event', () => {
      emitter.emitAgentStart('exec-123', 'researcher', 'Pesquisador');

      expect(mockWs.sentMessages).toHaveLength(1);
      expect(mockWs.sentMessages[0].type).toBe(WSEventType.AGENT_START);
      expect(mockWs.sentMessages[0].payload.agentId).toBe('researcher');
      expect(mockWs.sentMessages[0].payload.agentIndex).toBe(0);
    });
  });

  describe('emitAgentProgress', () => {
    it('should broadcast agent:progress event with clamped progress', () => {
      emitter.emitAgentProgress('exec-123', 'researcher', 150, 'Testing');

      expect(mockWs.sentMessages).toHaveLength(1);
      expect(mockWs.sentMessages[0].type).toBe(WSEventType.AGENT_PROGRESS);
      expect(mockWs.sentMessages[0].payload.progress).toBe(100); // Clamped
    });
  });

  describe('emitAgentComplete', () => {
    it('should broadcast agent:complete event', () => {
      emitter.emitAgentComplete('exec-123', 'researcher', 'Pesquisador', 5000, {
        itemsProcessed: 10
      });

      expect(mockWs.sentMessages).toHaveLength(1);
      expect(mockWs.sentMessages[0].type).toBe(WSEventType.AGENT_COMPLETE);
      expect(mockWs.sentMessages[0].payload.duration).toBe(5000);
      expect(mockWs.sentMessages[0].payload.success).toBe(true);
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
      expect(mockWs.sentMessages[0].type).toBe(WSEventType.AGENT_ERROR);
      expect(mockWs.sentMessages[0].payload.willRetry).toBe(true);
      expect(mockWs.sentMessages[0].payload.retryCount).toBe(1);
    });
  });

  describe('emitPipelineComplete', () => {
    it('should broadcast pipeline:complete event', () => {
      emitter.emitPipelineComplete('exec-123', 'completed', 60000, {
        postsGenerated: 5,
        postsApproved: 4,
        averageScore: 8.2,
        agentsExecuted: 8,
        errorsCount: 0
      });

      expect(mockWs.sentMessages).toHaveLength(1);
      expect(mockWs.sentMessages[0].type).toBe(WSEventType.PIPELINE_COMPLETE);
      expect(mockWs.sentMessages[0].payload.status).toBe('completed');
      expect(mockWs.sentMessages[0].payload.stats.postsGenerated).toBe(5);
    });
  });
});
```

### Testes de Integracao WebSocket

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import WebSocket from 'ws';
import { registerWebSocket } from '../websocket';
import { ConnectionManager } from '../websocket/connection-manager';

describe('WebSocket Integration', () => {
  let fastify: FastifyInstance;
  let port: number;

  beforeAll(async () => {
    fastify = Fastify({ logger: false });
    await registerWebSocket(fastify);
    await fastify.listen({ port: 0 });
    const address = fastify.server.address();
    port = typeof address === 'object' ? address!.port : 0;
  });

  afterAll(async () => {
    await fastify.close();
  });

  beforeEach(() => {
    ConnectionManager.resetInstance();
  });

  it('should accept WebSocket connection', async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ws`);

    await new Promise<void>((resolve, reject) => {
      ws.on('open', () => {
        expect(ConnectionManager.getInstance().getConnectionCount()).toBe(1);
        ws.close();
        resolve();
      });
      ws.on('error', reject);
    });
  });

  it('should send connected event on connection', async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ws`);

    const message = await new Promise<any>((resolve, reject) => {
      ws.on('message', (data) => {
        resolve(JSON.parse(data.toString()));
        ws.close();
      });
      ws.on('error', reject);
    });

    expect(message.type).toBe('connected');
    expect(message.payload.connectionId).toBeDefined();
  });

  it('should remove connection on close', async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ws`);

    await new Promise<void>((resolve) => {
      ws.on('open', () => {
        expect(ConnectionManager.getInstance().getConnectionCount()).toBe(1);
        ws.close();
      });
      ws.on('close', () => {
        // Small delay for cleanup
        setTimeout(() => {
          expect(ConnectionManager.getInstance().getConnectionCount()).toBe(0);
          resolve();
        }, 100);
      });
    });
  });

  it('should respond to manual ping', async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ws`);

    await new Promise<void>((resolve, reject) => {
      let messageCount = 0;

      ws.on('message', (data) => {
        messageCount++;
        const message = JSON.parse(data.toString());

        if (messageCount === 1) {
          // Connected event
          ws.send(JSON.stringify({ type: 'ping' }));
        } else if (messageCount === 2) {
          // Pong response
          expect(message.type).toBe('heartbeat');
          expect(message.payload.status).toBe('pong');
          ws.close();
          resolve();
        }
      });

      ws.on('error', reject);
    });
  });
});
```

---

## References

- [PRD](../prd.md) - Epic 5: Dashboard UI, Story 5.1
- [Architecture](../architecture.md) - WebSocket Events specification
- [Story 4.1](./story-4.1.md) - Persistencia com SQLite (dependency)
- [@fastify/websocket Documentation](https://github.com/fastify/fastify-websocket)
- [ws (WebSocket) Documentation](https://github.com/websockets/ws)
- [WebSocket API Specification](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

---

## Dependencies

- **Story 4.1** - Persistencia com SQLite (necessario para salvar eventos)
- **Story 1.2** - Backend API Base (base do servidor Fastify)

---

## Related Stories

- **Story 5.2** - Hook de WebSocket no React (consome este servidor)
- **Story 5.4** - View de Execucao Real-Time (usa eventos para visualizacao)
- **Story 4.7** - Pipeline Completo End-to-End (integra emissao de eventos)

---

## Dev Agent Record

### File List

| Status | File | Changes |
|--------|------|---------|
| Created | `packages/api/src/websocket/types.ts` | WebSocket event types, payloads, client message types |
| Created | `packages/api/src/websocket/connection-manager.ts` | Singleton connection manager with subscription filtering |
| Created | `packages/api/src/websocket/heartbeat.ts` | Ping/pong heartbeat system with configurable intervals |
| Created | `packages/api/src/websocket/pipeline-emitter.ts` | Pipeline event emitter for broadcasting execution events |
| Created | `packages/api/src/websocket/handlers.ts` | Client message handlers with rate limiting |
| Created | `packages/api/src/websocket/server.ts` | Fastify WebSocket plugin registration and route setup |
| Modified | `packages/api/src/websocket/index.ts` | Barrel exports for all WebSocket modules |
| Modified | `packages/api/src/server.ts` | Added WebSocket registration to server startup |
| Modified | `packages/shared/src/types/events.ts` | Extended with connection types and client message types |
| Modified | `.env.example` | Added WS_HEARTBEAT_INTERVAL, WS_PONG_TIMEOUT, WS_RATE_LIMIT, WS_RATE_WINDOW |
| Created | `packages/api/src/__tests__/websocket/connection-manager.test.ts` | 23 tests for ConnectionManager |
| Created | `packages/api/src/__tests__/websocket/heartbeat.test.ts` | 15 tests for heartbeat system |
| Created | `packages/api/src/__tests__/websocket/pipeline-emitter.test.ts` | 23 tests for PipelineEventEmitter |
| Created | `packages/api/src/__tests__/websocket/handlers.test.ts` | 21 tests for message handlers |
| Created | `packages/api/src/__tests__/websocket/integration.test.ts` | 10 tests for end-to-end WebSocket flow |

### Debug Log

- Updated Fastify from v4 to v5 for @fastify/websocket compatibility
- Updated @fastify/cors from v9 to v10 for Fastify 5 compatibility
- Fixed closeAll method to handle null/undefined connections gracefully
- Fixed Fastify 5 WebSocket route handler signature (socket instead of connection.socket)

### Completion Notes

Implementation complete with:
- 92 passing tests covering all WebSocket functionality
- TypeScript strict mode compliance
- JSDoc documentation on all public methods
- Rate limiting (60 messages/minute per connection)
- Heartbeat system (30s ping interval, 10s pong timeout)
- Subscription-based event filtering by executionId and event type
- Comprehensive error handling and logging

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-29 | Story criada | River (SM Agent) |
| 2026-01-29 | Implementation complete - all tasks done | Dex (Dev Agent) |

---
