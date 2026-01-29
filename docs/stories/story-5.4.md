# Story 5.4: View de Execucao Real-Time

> Epic 5: Dashboard UI

---

## Story

**Como** usuario,
**Quero** acompanhar a execucao do pipeline ao vivo,
**Para que** eu veja exatamente o que esta acontecendo.

---

## Status

`Ready for Review`

---

## Acceptance Criteria

| # | Criterio | Validacao |
|---|----------|-----------|
| AC1 | Pagina `/execution` ou modal de execucao | Pagina/modal renderiza corretamente quando pipeline esta executando |
| AC2 | Visualizacao do pipeline como fluxo: agentes conectados | Diagrama de fluxo mostrando os 8 agentes conectados em sequencia |
| AC3 | Cada agente mostra: icone, nome, status (waiting/running/done/error) | Icone + nome + badge de status visivel para cada agente |
| AC4 | Animacao de "pulsing" no agente ativo | CSS animation pulsante no agente com status "running" |
| AC5 | Tempo decorrido em cada agente | Timer mostrando duracao de cada etapa em formato "Xm Ys" |
| AC6 | Log de eventos em tempo real (estilo terminal) | Area de log estilo terminal com scroll automatico e timestamps |
| AC7 | Preview parcial de outputs conforme sao gerados | Cards/preview mostrando outputs intermediarios (tendencias, topicos, etc) |
| AC8 | Botao de cancelar execucao | Botao "Cancelar" funcional que interrompe o pipeline |
| AC9 | Transicao automatica para posts quando finaliza | Redirect automatico para `/posts` ou exibicao dos posts gerados |

---

## Tasks

- [x] **Task 1:** Criar pagina Execution e rota
  - [x] Criar `packages/ui/src/routes/Execution.tsx`
  - [x] Adicionar rota `/execution` e `/execution/:id` no router
  - [x] Adicionar item "Execucao" no Sidebar com icone (Play)
  - [x] Implementar layout base com areas: pipeline flow, logs, preview

- [x] **Task 2:** Implementar componente PipelineFlow
  - [x] Criar `packages/ui/src/components/execution/PipelineFlow.tsx`
  - [x] Definir array de agentes com configuracao: id, name, icon, position
  - [x] Renderizar fluxo horizontal/vertical com conectores (linhas/setas)
  - [x] Suportar diferentes tamanhos de tela (responsivo)

- [x] **Task 3:** Implementar componente AgentNode
  - [x] Criar `packages/ui/src/components/execution/AgentNode.tsx`
  - [x] Exibir icone do agente (Lucide icons)
  - [x] Exibir nome do agente
  - [x] Exibir badge de status: waiting (cinza), running (azul pulsante), done (verde), error (vermelho)
  - [x] Exibir tempo decorrido quando status != waiting
  - [x] Implementar animacao CSS "pulsing" para status running

- [x] **Task 4:** Implementar componente LogViewer
  - [x] Criar `packages/ui/src/components/execution/LogViewer.tsx`
  - [x] Estilo terminal dark (fundo escuro, fonte monospace)
  - [x] Cada entrada de log com timestamp formatado
  - [x] Cores diferentes para tipos de mensagem: info (branco), success (verde), warning (amarelo), error (vermelho)
  - [x] Auto-scroll para o fim quando novos logs chegam
  - [x] Botao para pausar/retomar auto-scroll
  - [x] Limitar buffer a ultimos 500 logs

- [x] **Task 5:** Implementar componente OutputPreview
  - [x] Criar `packages/ui/src/components/execution/OutputPreview.tsx`
  - [x] Exibir preview de tendencias encontradas (lista simples)
  - [x] Exibir preview de topicos selecionados (cards)
  - [x] Exibir preview de posts gerados (texto truncado)
  - [x] Exibir preview de imagens geradas (thumbnail)
  - [x] Atualizar dinamicamente conforme outputs chegam

- [x] **Task 6:** Integrar com WebSocket
  - [x] Usar hook `useWebSocket` da Story 5.2
  - [x] Escutar eventos: `pipeline:start`, `agent:start`, `agent:progress`, `agent:complete`, `agent:error`, `pipeline:complete`
  - [x] Atualizar estado dos agentes em tempo real
  - [x] Adicionar logs conforme eventos chegam
  - [x] Atualizar previews de output conforme dados chegam

- [x] **Task 7:** Implementar logica de cancelamento
  - [x] Criar componente `CancelButton.tsx` (integrado no ExecutionHeader)
  - [x] Chamar `POST /api/pipeline/cancel/:executionId`
  - [x] Atualizar UI para refletir cancelamento
  - [x] Exibir confirmacao antes de cancelar

- [x] **Task 8:** Implementar transicao pos-execucao
  - [x] Detectar evento `pipeline:complete`
  - [x] Mostrar resumo final: posts gerados, score medio, duracao total
  - [x] Botao "Ver Posts" para navegar para `/posts?execution={id}`
  - [x] Opcao de auto-redirect apos 5 segundos (configuravel)

- [x] **Task 9:** Implementar ExecutionHeader
  - [x] Criar `packages/ui/src/components/execution/ExecutionHeader.tsx`
  - [x] Exibir titulo "Pipeline em Execucao" ou "Execucao Finalizada"
  - [x] Exibir timer global da execucao
  - [x] Exibir configuracao usada (numPosts, platforms)
  - [x] Botao Cancelar posicionado no header

- [x] **Task 10:** Criar testes
  - [x] Testes para PipelineFlow component
  - [x] Testes para AgentNode component (todos os estados)
  - [x] Testes para LogViewer component
  - [x] Testes para OutputPreview component
  - [x] Testes para integracao WebSocket
  - [x] Testes para logica de cancelamento
  - [x] Testes para transicao pos-execucao

---

## Dev Notes

### Estrutura de Componentes

```
packages/ui/src/
├── routes/
│   ├── Execution.tsx
│   └── ...
├── components/
│   ├── execution/
│   │   ├── index.ts
│   │   ├── PipelineFlow.tsx
│   │   ├── AgentNode.tsx
│   │   ├── AgentConnector.tsx
│   │   ├── LogViewer.tsx
│   │   ├── OutputPreview.tsx
│   │   ├── ExecutionHeader.tsx
│   │   ├── ExecutionSummary.tsx
│   │   ├── CancelButton.tsx
│   │   └── ExecutionSkeleton.tsx
│   └── ...
├── hooks/
│   ├── useExecution.ts
│   ├── useWebSocket.ts (from Story 5.2)
│   └── ...
```

### Interfaces TypeScript

```typescript
// packages/shared/src/types/execution.ts

export type AgentId =
  | 'researcher'
  | 'topic-generator'
  | 'curator'
  | 'writer'
  | 'image-designer'
  | 'carousel-builder'
  | 'pdf-maker'
  | 'qa-analyst';

export type AgentNodeStatus = 'waiting' | 'running' | 'done' | 'error' | 'skipped';

export interface AgentNodeState {
  id: AgentId;
  name: string;
  status: AgentNodeStatus;
  startedAt?: Date;
  finishedAt?: Date;
  duration?: number; // milliseconds
  progress?: number; // 0-100
  error?: string;
  output?: unknown;
}

export interface PipelineState {
  executionId: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt?: Date;
  finishedAt?: Date;
  config: ExecutionConfig;
  agents: Record<AgentId, AgentNodeState>;
  logs: LogEntry[];
  outputs: PipelineOutputs;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'success' | 'warning' | 'error';
  agentId?: AgentId;
  message: string;
  data?: unknown;
}

export interface PipelineOutputs {
  trends?: Trend[];
  topics?: Topic[];
  curatedContent?: CuratedContent[];
  posts?: Post[];
  images?: string[];
}

export interface ExecutionConfig {
  numPosts: number;
  platforms: ('instagram' | 'linkedin')[];
  includeVisual: boolean;
  qualityThreshold: number;
}
```

### Definicao dos Agentes

```typescript
// packages/ui/src/components/execution/agentConfig.ts

import {
  Search,
  Lightbulb,
  BookOpen,
  Pencil,
  Image,
  LayoutGrid,
  FileText,
  CheckCircle,
} from 'lucide-react';

export const AGENTS = [
  {
    id: 'researcher',
    name: 'Pesquisador',
    icon: Search,
    description: 'Busca tendencias em fontes tech',
  },
  {
    id: 'topic-generator',
    name: 'Gerador de Topicos',
    icon: Lightbulb,
    description: 'Seleciona topicos relevantes',
  },
  {
    id: 'curator',
    name: 'Curador',
    icon: BookOpen,
    description: 'Busca referencias e exemplos',
  },
  {
    id: 'writer',
    name: 'Redator',
    icon: Pencil,
    description: 'Gera textos para posts',
  },
  {
    id: 'image-designer',
    name: 'Designer',
    icon: Image,
    description: 'Gera imagens de fundo',
  },
  {
    id: 'carousel-builder',
    name: 'Carousel Builder',
    icon: LayoutGrid,
    description: 'Cria slides do carrossel',
  },
  {
    id: 'pdf-maker',
    name: 'PDF Maker',
    icon: FileText,
    description: 'Gera PDFs para LinkedIn',
  },
  {
    id: 'qa-analyst',
    name: 'QA Analyst',
    icon: CheckCircle,
    description: 'Avalia qualidade do output',
  },
] as const;
```

### Execution Page Component

```tsx
// packages/ui/src/routes/Execution.tsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  PipelineFlow,
  LogViewer,
  OutputPreview,
  ExecutionHeader,
  ExecutionSummary,
  ExecutionSkeleton,
} from '@/components/execution';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAppStore } from '@/stores/app.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AGENTS } from '@/components/execution/agentConfig';
import type { PipelineState, AgentNodeState, LogEntry } from '@social-content/shared';

export function Execution() {
  const { id: executionId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isConnected = useAppStore((state) => state.isConnected);

  const [pipelineState, setPipelineState] = useState<PipelineState>(() => ({
    executionId: executionId || '',
    status: 'idle',
    config: {
      numPosts: 3,
      platforms: ['instagram', 'linkedin'],
      includeVisual: true,
      qualityThreshold: 6.0,
    },
    agents: AGENTS.reduce((acc, agent) => ({
      ...acc,
      [agent.id]: { id: agent.id, name: agent.name, status: 'waiting' },
    }), {} as Record<string, AgentNodeState>),
    logs: [],
    outputs: {},
  }));

  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribers = [
      subscribe('pipeline:start', (data) => {
        setPipelineState((prev) => ({
          ...prev,
          executionId: data.executionId,
          status: 'running',
          startedAt: new Date(),
          config: data.config,
        }));
        addLog('info', 'Pipeline iniciado', undefined);
      }),

      subscribe('agent:start', (data) => {
        setPipelineState((prev) => ({
          ...prev,
          agents: {
            ...prev.agents,
            [data.agentId]: {
              ...prev.agents[data.agentId],
              status: 'running',
              startedAt: new Date(),
            },
          },
        }));
        addLog('info', `${data.agentName} iniciado`, data.agentId);
      }),

      subscribe('agent:progress', (data) => {
        setPipelineState((prev) => ({
          ...prev,
          agents: {
            ...prev.agents,
            [data.agentId]: {
              ...prev.agents[data.agentId],
              progress: data.progress,
            },
          },
        }));
        addLog('info', data.message, data.agentId);
      }),

      subscribe('agent:complete', (data) => {
        setPipelineState((prev) => ({
          ...prev,
          agents: {
            ...prev.agents,
            [data.agentId]: {
              ...prev.agents[data.agentId],
              status: 'done',
              finishedAt: new Date(),
              duration: data.duration,
              output: data.result,
            },
          },
          outputs: mergeOutputs(prev.outputs, data.agentId, data.result),
        }));
        addLog('success', `${getAgentName(data.agentId)} concluido em ${formatDuration(data.duration)}`, data.agentId);
      }),

      subscribe('agent:error', (data) => {
        setPipelineState((prev) => ({
          ...prev,
          agents: {
            ...prev.agents,
            [data.agentId]: {
              ...prev.agents[data.agentId],
              status: 'error',
              error: data.error,
            },
          },
        }));
        addLog('error', `Erro: ${data.error}${data.willRetry ? ' (tentando novamente)' : ''}`, data.agentId);
      }),

      subscribe('pipeline:complete', (data) => {
        setPipelineState((prev) => ({
          ...prev,
          status: data.status === 'completed' ? 'completed' : 'failed',
          finishedAt: new Date(),
        }));
        addLog(
          data.status === 'completed' ? 'success' : 'error',
          `Pipeline ${data.status === 'completed' ? 'concluido' : 'falhou'}. ${data.postsGenerated} posts, score medio ${data.averageScore.toFixed(1)}`,
          undefined
        );
      }),
    ];

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [subscribe]);

  const addLog = (level: LogEntry['level'], message: string, agentId?: string) => {
    setPipelineState((prev) => ({
      ...prev,
      logs: [
        ...prev.logs.slice(-499), // Keep last 500
        {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
          level,
          agentId,
          message,
        },
      ],
    }));
  };

  const handleCancel = async () => {
    if (!pipelineState.executionId) return;
    try {
      await api.cancelPipeline(pipelineState.executionId);
      setPipelineState((prev) => ({ ...prev, status: 'cancelled' }));
      addLog('warning', 'Pipeline cancelado pelo usuario', undefined);
    } catch (error) {
      addLog('error', 'Falha ao cancelar pipeline', undefined);
    }
  };

  const handleViewPosts = () => {
    navigate(`/posts?execution=${pipelineState.executionId}`);
  };

  // Auto-redirect after completion
  useEffect(() => {
    if (pipelineState.status === 'completed') {
      const timer = setTimeout(() => {
        navigate(`/posts?execution=${pipelineState.executionId}`);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [pipelineState.status, pipelineState.executionId, navigate]);

  if (!isConnected) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Conectando ao servidor...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <ExecutionHeader
        status={pipelineState.status}
        startedAt={pipelineState.startedAt}
        config={pipelineState.config}
        onCancel={handleCancel}
      />

      {/* Pipeline Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline de Agentes</CardTitle>
        </CardHeader>
        <CardContent>
          <PipelineFlow agents={pipelineState.agents} />
        </CardContent>
      </Card>

      {/* Completion Summary */}
      {(pipelineState.status === 'completed' || pipelineState.status === 'failed') && (
        <ExecutionSummary
          status={pipelineState.status}
          startedAt={pipelineState.startedAt}
          finishedAt={pipelineState.finishedAt}
          outputs={pipelineState.outputs}
          onViewPosts={handleViewPosts}
        />
      )}

      {/* Logs and Output Preview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Log de Execucao</CardTitle>
          </CardHeader>
          <CardContent>
            <LogViewer logs={pipelineState.logs} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outputs</CardTitle>
          </CardHeader>
          <CardContent>
            <OutputPreview outputs={pipelineState.outputs} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function mergeOutputs(current: PipelineOutputs, agentId: string, result: unknown): PipelineOutputs {
  switch (agentId) {
    case 'researcher':
      return { ...current, trends: result as Trend[] };
    case 'topic-generator':
      return { ...current, topics: result as Topic[] };
    case 'curator':
      return { ...current, curatedContent: result as CuratedContent[] };
    case 'writer':
    case 'qa-analyst':
      return { ...current, posts: result as Post[] };
    case 'image-designer':
      return { ...current, images: result as string[] };
    default:
      return current;
  }
}

function getAgentName(agentId: string): string {
  const agent = AGENTS.find((a) => a.id === agentId);
  return agent?.name || agentId;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${remainingSeconds}s`;
}
```

### PipelineFlow Component

```tsx
// packages/ui/src/components/execution/PipelineFlow.tsx

import { AgentNode } from './AgentNode';
import { AgentConnector } from './AgentConnector';
import { AGENTS } from './agentConfig';
import type { AgentNodeState, AgentId } from '@social-content/shared';

interface PipelineFlowProps {
  agents: Record<AgentId, AgentNodeState>;
}

export function PipelineFlow({ agents }: PipelineFlowProps) {
  return (
    <div className="relative">
      {/* Desktop: Horizontal Flow */}
      <div className="hidden lg:flex items-center justify-between overflow-x-auto py-4">
        {AGENTS.map((agentConfig, index) => (
          <div key={agentConfig.id} className="flex items-center">
            <AgentNode
              config={agentConfig}
              state={agents[agentConfig.id]}
            />
            {index < AGENTS.length - 1 && (
              <AgentConnector
                fromStatus={agents[agentConfig.id]?.status}
                toStatus={agents[AGENTS[index + 1].id]?.status}
              />
            )}
          </div>
        ))}
      </div>

      {/* Mobile/Tablet: Vertical Flow */}
      <div className="lg:hidden flex flex-col items-center space-y-2 py-4">
        {AGENTS.map((agentConfig, index) => (
          <div key={agentConfig.id} className="flex flex-col items-center">
            <AgentNode
              config={agentConfig}
              state={agents[agentConfig.id]}
              compact
            />
            {index < AGENTS.length - 1 && (
              <AgentConnector
                fromStatus={agents[agentConfig.id]?.status}
                toStatus={agents[AGENTS[index + 1].id]?.status}
                vertical
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### AgentNode Component

```tsx
// packages/ui/src/components/execution/AgentNode.tsx

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AgentNodeState, AgentNodeStatus } from '@social-content/shared';
import type { LucideIcon } from 'lucide-react';

interface AgentConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
}

interface AgentNodeProps {
  config: AgentConfig;
  state: AgentNodeState;
  compact?: boolean;
}

const statusConfig: Record<AgentNodeStatus, {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  pulse: boolean;
}> = {
  waiting: {
    label: 'Aguardando',
    bgColor: 'bg-muted',
    textColor: 'text-muted-foreground',
    borderColor: 'border-muted',
    pulse: false,
  },
  running: {
    label: 'Executando',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-500',
    borderColor: 'border-blue-500',
    pulse: true,
  },
  done: {
    label: 'Concluido',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-500',
    borderColor: 'border-green-500',
    pulse: false,
  },
  error: {
    label: 'Erro',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-500',
    borderColor: 'border-red-500',
    pulse: false,
  },
  skipped: {
    label: 'Pulado',
    bgColor: 'bg-muted',
    textColor: 'text-muted-foreground',
    borderColor: 'border-muted',
    pulse: false,
  },
};

export function AgentNode({ config, state, compact = false }: AgentNodeProps) {
  const [elapsed, setElapsed] = useState(0);
  const Icon = config.icon;
  const status = state?.status || 'waiting';
  const statusCfg = statusConfig[status];

  // Timer for running agents
  useEffect(() => {
    if (status !== 'running' || !state.startedAt) {
      if (state.duration) {
        setElapsed(state.duration);
      }
      return;
    }

    const startTime = new Date(state.startedAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [status, state.startedAt, state.duration]);

  const formatElapsed = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border-2 transition-all',
          statusCfg.bgColor,
          statusCfg.borderColor,
          statusCfg.pulse && 'animate-pulse'
        )}
      >
        <Icon className={cn('h-5 w-5', statusCfg.textColor)} />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{config.name}</p>
          <p className="text-xs text-muted-foreground">{statusCfg.label}</p>
        </div>
        {(status === 'running' || status === 'done') && (
          <span className="text-xs font-mono">{formatElapsed(elapsed)}</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center p-4 rounded-xl border-2 min-w-[120px] transition-all',
        statusCfg.bgColor,
        statusCfg.borderColor,
        statusCfg.pulse && 'animate-pulse'
      )}
      title={config.description}
    >
      <div
        className={cn(
          'p-3 rounded-full mb-2',
          status === 'running' ? 'bg-blue-500/20' : 'bg-background'
        )}
      >
        <Icon className={cn('h-6 w-6', statusCfg.textColor)} />
      </div>
      <p className="font-medium text-sm text-center">{config.name}</p>
      <Badge variant="outline" className={cn('mt-2 text-xs', statusCfg.textColor)}>
        {statusCfg.label}
      </Badge>
      {(status === 'running' || status === 'done') && (
        <span className="text-xs font-mono mt-1 text-muted-foreground">
          {formatElapsed(elapsed)}
        </span>
      )}
      {state.progress !== undefined && status === 'running' && (
        <div className="w-full mt-2 bg-muted rounded-full h-1">
          <div
            className="bg-blue-500 h-1 rounded-full transition-all"
            style={{ width: `${state.progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
```

### AgentConnector Component

```tsx
// packages/ui/src/components/execution/AgentConnector.tsx

import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type { AgentNodeStatus } from '@social-content/shared';

interface AgentConnectorProps {
  fromStatus?: AgentNodeStatus;
  toStatus?: AgentNodeStatus;
  vertical?: boolean;
}

export function AgentConnector({ fromStatus, toStatus, vertical = false }: AgentConnectorProps) {
  const isActive = fromStatus === 'done' || fromStatus === 'running';
  const Icon = vertical ? ChevronDown : ChevronRight;

  return (
    <div className={cn('flex items-center justify-center', vertical ? 'h-4' : 'w-8')}>
      <Icon
        className={cn(
          'h-4 w-4 transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground'
        )}
      />
    </div>
  );
}
```

### LogViewer Component

```tsx
// packages/ui/src/components/execution/LogViewer.tsx

import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LogEntry } from '@social-content/shared';

interface LogViewerProps {
  logs: LogEntry[];
  maxHeight?: number;
}

const levelColors: Record<LogEntry['level'], string> = {
  info: 'text-foreground',
  success: 'text-green-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
};

export function LogViewer({ logs, maxHeight = 400 }: LogViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 50;
    if (!isAtBottom && autoScroll) {
      setAutoScroll(false);
    }
  };

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="bg-zinc-950 rounded-lg p-4 font-mono text-sm overflow-auto"
        style={{ maxHeight }}
      >
        {logs.length === 0 ? (
          <p className="text-muted-foreground">Aguardando eventos...</p>
        ) : (
          <div className="space-y-1">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-2">
                <span className="text-muted-foreground shrink-0">
                  [{format(new Date(log.timestamp), 'HH:mm:ss')}]
                </span>
                {log.agentId && (
                  <span className="text-blue-400 shrink-0">[{log.agentId}]</span>
                )}
                <span className={cn(levelColors[log.level])}>{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auto-scroll toggle */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute bottom-2 right-2"
        onClick={() => setAutoScroll(!autoScroll)}
        title={autoScroll ? 'Pausar auto-scroll' : 'Retomar auto-scroll'}
      >
        {autoScroll ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
    </div>
  );
}
```

### OutputPreview Component

```tsx
// packages/ui/src/components/execution/OutputPreview.tsx

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Lightbulb, FileText, Image } from 'lucide-react';
import type { PipelineOutputs } from '@social-content/shared';

interface OutputPreviewProps {
  outputs: PipelineOutputs;
}

export function OutputPreview({ outputs }: OutputPreviewProps) {
  const hasTrends = outputs.trends && outputs.trends.length > 0;
  const hasTopics = outputs.topics && outputs.topics.length > 0;
  const hasPosts = outputs.posts && outputs.posts.length > 0;
  const hasImages = outputs.images && outputs.images.length > 0;

  const hasAnyOutput = hasTrends || hasTopics || hasPosts || hasImages;

  if (!hasAnyOutput) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Aguardando outputs...
      </div>
    );
  }

  return (
    <Tabs defaultValue={hasTrends ? 'trends' : hasTopics ? 'topics' : 'posts'}>
      <TabsList className="grid grid-cols-4 w-full">
        <TabsTrigger value="trends" disabled={!hasTrends}>
          <Search className="h-4 w-4 mr-1" />
          Trends
        </TabsTrigger>
        <TabsTrigger value="topics" disabled={!hasTopics}>
          <Lightbulb className="h-4 w-4 mr-1" />
          Topics
        </TabsTrigger>
        <TabsTrigger value="posts" disabled={!hasPosts}>
          <FileText className="h-4 w-4 mr-1" />
          Posts
        </TabsTrigger>
        <TabsTrigger value="images" disabled={!hasImages}>
          <Image className="h-4 w-4 mr-1" />
          Images
        </TabsTrigger>
      </TabsList>

      <ScrollArea className="h-[300px] mt-4">
        <TabsContent value="trends" className="mt-0 space-y-2">
          {outputs.trends?.map((trend, index) => (
            <div key={index} className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-sm">{trend.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">{trend.source}</Badge>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="topics" className="mt-0 space-y-2">
          {outputs.topics?.map((topic, index) => (
            <div key={index} className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-sm">{topic.title}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {topic.description}
              </p>
              <Badge variant="outline" className="text-xs mt-2">
                Potencial: {topic.engagementPotential}/10
              </Badge>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="posts" className="mt-0 space-y-2">
          {outputs.posts?.map((post, index) => (
            <div key={index} className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-sm">{post.topic.title}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                {post.textInstagram || post.textLinkedin}
              </p>
              {post.score && (
                <Badge
                  variant={post.score.overallScore >= 6 ? 'default' : 'destructive'}
                  className="text-xs mt-2"
                >
                  Score: {post.score.overallScore.toFixed(1)}/10
                </Badge>
              )}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="images" className="mt-0">
          <div className="grid grid-cols-2 gap-2">
            {outputs.images?.map((imagePath, index) => (
              <div key={index} className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={`/api/assets/${imagePath}`}
                  alt={`Generated image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </TabsContent>
      </ScrollArea>
    </Tabs>
  );
}
```

### ExecutionHeader Component

```tsx
// packages/ui/src/components/execution/ExecutionHeader.tsx

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Play, StopCircle, Clock, Instagram, Linkedin } from 'lucide-react';
import type { ExecutionConfig } from '@social-content/shared';

interface ExecutionHeaderProps {
  status: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt?: Date;
  config: ExecutionConfig;
  onCancel: () => void;
}

export function ExecutionHeader({ status, startedAt, config, onCancel }: ExecutionHeaderProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status !== 'running' || !startedAt) return;

    const startTime = new Date(startedAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [status, startedAt]);

  const formatElapsed = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const statusLabels: Record<typeof status, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    idle: { label: 'Aguardando', variant: 'outline' },
    running: { label: 'Executando', variant: 'default' },
    completed: { label: 'Concluido', variant: 'secondary' },
    failed: { label: 'Falhou', variant: 'destructive' },
    cancelled: { label: 'Cancelado', variant: 'outline' },
  };

  const statusInfo = statusLabels[status];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Play className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {status === 'running' ? 'Pipeline em Execucao' : 'Execucao do Pipeline'}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            {status === 'running' && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {formatElapsed(elapsed)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Config Summary */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{config.numPosts} posts</span>
          <span>|</span>
          <div className="flex items-center gap-1">
            {config.platforms.includes('instagram') && <Instagram className="h-4 w-4" />}
            {config.platforms.includes('linkedin') && <Linkedin className="h-4 w-4" />}
          </div>
        </div>

        {/* Cancel Button */}
        {status === 'running' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <StopCircle className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancelar Execucao?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso ira interromper o pipeline atual. Os outputs parciais serao preservados,
                  mas a execucao nao podera ser retomada.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continuar Executando</AlertDialogCancel>
                <AlertDialogAction onClick={onCancel}>Cancelar Pipeline</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
```

### ExecutionSummary Component

```tsx
// packages/ui/src/components/execution/ExecutionSummary.tsx

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, FileText, Clock, Star, ArrowRight } from 'lucide-react';
import type { PipelineOutputs } from '@social-content/shared';

interface ExecutionSummaryProps {
  status: 'completed' | 'failed';
  startedAt?: Date;
  finishedAt?: Date;
  outputs: PipelineOutputs;
  onViewPosts: () => void;
}

export function ExecutionSummary({
  status,
  startedAt,
  finishedAt,
  outputs,
  onViewPosts,
}: ExecutionSummaryProps) {
  const duration = startedAt && finishedAt
    ? new Date(finishedAt).getTime() - new Date(startedAt).getTime()
    : 0;

  const postsCount = outputs.posts?.length || 0;
  const averageScore = outputs.posts?.reduce((acc, post) => {
    return acc + (post.score?.overallScore || 0);
  }, 0) / (postsCount || 1);

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const isSuccess = status === 'completed';
  const Icon = isSuccess ? CheckCircle : XCircle;

  return (
    <Card className={isSuccess ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Icon className={`h-10 w-10 ${isSuccess ? 'text-green-500' : 'text-red-500'}`} />
            <div>
              <h3 className="text-lg font-bold">
                {isSuccess ? 'Pipeline Concluido!' : 'Pipeline Falhou'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isSuccess
                  ? 'Todos os agentes executaram com sucesso.'
                  : 'Houve erros durante a execucao.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="font-mono">{formatDuration(duration)}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span>{postsCount} posts</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-muted-foreground" />
              <span>{averageScore.toFixed(1)}/10</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Redirecionando para posts em 5 segundos...
          </p>
          <Button onClick={onViewPosts}>
            Ver Posts Gerados
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### CSS Animation para Pulsing

```css
/* packages/ui/src/styles/globals.css */

@keyframes agent-pulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    opacity: 0.9;
    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
  }
}

.agent-pulsing {
  animation: agent-pulse 2s ease-in-out infinite;
}
```

### Hook useExecution

```typescript
// packages/ui/src/hooks/useExecution.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Execution, ExecutionConfig } from '@social-content/shared';

/**
 * Hook to start a new pipeline execution
 */
export function useStartExecution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: ExecutionConfig) => {
      const response = await api.post<Execution>('/api/pipeline/run', config);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executions'] });
    },
  });
}

/**
 * Hook to cancel a running execution
 */
export function useCancelExecution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (executionId: string) => {
      await api.post(`/api/pipeline/cancel/${executionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executions'] });
    },
  });
}

/**
 * Hook to get execution status
 */
export function useExecutionStatus(executionId: string | undefined) {
  return useQuery({
    queryKey: ['execution', executionId],
    queryFn: async () => {
      if (!executionId) throw new Error('No execution ID');
      const response = await api.get<Execution>(`/api/pipeline/status/${executionId}`);
      return response.data;
    },
    enabled: !!executionId,
    refetchInterval: (data) => {
      // Keep polling if execution is running
      return data?.status === 'running' ? 2000 : false;
    },
  });
}
```

### Dependencias Adicionais

```json
{
  "dependencies": {
    "date-fns": "^3.0.0"
  }
}
```

---

## Testing

### Testes Unitarios

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgentNode } from '../components/execution/AgentNode';
import { LogViewer } from '../components/execution/LogViewer';
import { PipelineFlow } from '../components/execution/PipelineFlow';
import { Search } from 'lucide-react';

describe('AgentNode', () => {
  const mockConfig = {
    id: 'researcher',
    name: 'Pesquisador',
    icon: Search,
    description: 'Busca tendencias',
  };

  it('should render agent with waiting status', () => {
    render(
      <AgentNode
        config={mockConfig}
        state={{ id: 'researcher', name: 'Pesquisador', status: 'waiting' }}
      />
    );
    expect(screen.getByText('Pesquisador')).toBeInTheDocument();
    expect(screen.getByText('Aguardando')).toBeInTheDocument();
  });

  it('should render agent with running status and pulse animation', () => {
    render(
      <AgentNode
        config={mockConfig}
        state={{
          id: 'researcher',
          name: 'Pesquisador',
          status: 'running',
          startedAt: new Date(),
        }}
      />
    );
    expect(screen.getByText('Executando')).toBeInTheDocument();
    // Check for pulse animation class
    const node = screen.getByText('Pesquisador').closest('div');
    expect(node).toHaveClass('animate-pulse');
  });

  it('should render agent with done status and duration', () => {
    render(
      <AgentNode
        config={mockConfig}
        state={{
          id: 'researcher',
          name: 'Pesquisador',
          status: 'done',
          duration: 65000, // 1m 5s
        }}
      />
    );
    expect(screen.getByText('Concluido')).toBeInTheDocument();
    expect(screen.getByText('1m 5s')).toBeInTheDocument();
  });

  it('should render agent with error status', () => {
    render(
      <AgentNode
        config={mockConfig}
        state={{
          id: 'researcher',
          name: 'Pesquisador',
          status: 'error',
          error: 'Connection failed',
        }}
      />
    );
    expect(screen.getByText('Erro')).toBeInTheDocument();
  });

  it('should show progress bar when running with progress', () => {
    render(
      <AgentNode
        config={mockConfig}
        state={{
          id: 'researcher',
          name: 'Pesquisador',
          status: 'running',
          startedAt: new Date(),
          progress: 50,
        }}
      />
    );
    const progressBar = document.querySelector('[style*="width: 50%"]');
    expect(progressBar).toBeInTheDocument();
  });
});

describe('LogViewer', () => {
  const mockLogs = [
    { id: '1', timestamp: new Date(), level: 'info', message: 'Pipeline iniciado' },
    { id: '2', timestamp: new Date(), level: 'success', agentId: 'researcher', message: 'Pesquisador concluido' },
    { id: '3', timestamp: new Date(), level: 'error', message: 'Erro de conexao' },
  ];

  it('should render logs with correct colors', () => {
    render(<LogViewer logs={mockLogs} />);
    expect(screen.getByText('Pipeline iniciado')).toBeInTheDocument();
    expect(screen.getByText('Pesquisador concluido')).toBeInTheDocument();
    expect(screen.getByText('Erro de conexao')).toBeInTheDocument();
  });

  it('should show empty state when no logs', () => {
    render(<LogViewer logs={[]} />);
    expect(screen.getByText('Aguardando eventos...')).toBeInTheDocument();
  });

  it('should have auto-scroll toggle button', () => {
    render(<LogViewer logs={mockLogs} />);
    const pauseButton = screen.getByTitle('Pausar auto-scroll');
    expect(pauseButton).toBeInTheDocument();
  });
});

describe('PipelineFlow', () => {
  const mockAgents = {
    researcher: { id: 'researcher', name: 'Pesquisador', status: 'done' },
    'topic-generator': { id: 'topic-generator', name: 'Gerador', status: 'running' },
    curator: { id: 'curator', name: 'Curador', status: 'waiting' },
    writer: { id: 'writer', name: 'Redator', status: 'waiting' },
    'image-designer': { id: 'image-designer', name: 'Designer', status: 'waiting' },
    'carousel-builder': { id: 'carousel-builder', name: 'Carousel', status: 'waiting' },
    'pdf-maker': { id: 'pdf-maker', name: 'PDF', status: 'waiting' },
    'qa-analyst': { id: 'qa-analyst', name: 'QA', status: 'waiting' },
  };

  it('should render all agents in flow', () => {
    render(<PipelineFlow agents={mockAgents} />);
    expect(screen.getByText('Pesquisador')).toBeInTheDocument();
    expect(screen.getByText('Gerador de Topicos')).toBeInTheDocument();
    expect(screen.getByText('Curador')).toBeInTheDocument();
  });

  it('should show connectors between agents', () => {
    render(<PipelineFlow agents={mockAgents} />);
    // Check for connector elements (arrows)
    const connectors = document.querySelectorAll('svg');
    expect(connectors.length).toBeGreaterThan(0);
  });
});
```

### Testes de Integracao WebSocket

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Execution } from '../routes/Execution';
import { useWebSocket } from '../hooks/useWebSocket';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../hooks/useWebSocket');

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>{children}</BrowserRouter>
  </QueryClientProvider>
);

describe('Execution WebSocket Integration', () => {
  let mockSubscribe: vi.Mock;
  let subscriptions: Map<string, Function>;

  beforeEach(() => {
    subscriptions = new Map();
    mockSubscribe = vi.fn((event, callback) => {
      subscriptions.set(event, callback);
      return () => subscriptions.delete(event);
    });

    (useWebSocket as vi.Mock).mockReturnValue({
      subscribe: mockSubscribe,
      isConnected: true,
    });
  });

  it('should update agent status on agent:start event', async () => {
    render(<Execution />, { wrapper });

    await act(async () => {
      const callback = subscriptions.get('agent:start');
      callback?.({
        agentId: 'researcher',
        agentName: 'Pesquisador',
      });
    });

    expect(screen.getByText('Executando')).toBeInTheDocument();
  });

  it('should add log entry on agent:complete event', async () => {
    render(<Execution />, { wrapper });

    await act(async () => {
      const callback = subscriptions.get('agent:complete');
      callback?.({
        agentId: 'researcher',
        duration: 5000,
        result: [],
      });
    });

    expect(screen.getByText(/Pesquisador concluido/)).toBeInTheDocument();
  });

  it('should show completion summary on pipeline:complete', async () => {
    render(<Execution />, { wrapper });

    await act(async () => {
      const callback = subscriptions.get('pipeline:complete');
      callback?.({
        executionId: '123',
        status: 'completed',
        postsGenerated: 5,
        averageScore: 8.5,
        duration: 120000,
      });
    });

    expect(screen.getByText('Pipeline Concluido!')).toBeInTheDocument();
    expect(screen.getByText('5 posts')).toBeInTheDocument();
  });
});
```

### Testes de Cancelamento

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExecutionHeader } from '../components/execution/ExecutionHeader';
import { api } from '../lib/api';

vi.mock('../lib/api');

describe('Cancel Execution', () => {
  it('should show cancel confirmation dialog', () => {
    render(
      <ExecutionHeader
        status="running"
        startedAt={new Date()}
        config={{ numPosts: 3, platforms: ['instagram'], includeVisual: true, qualityThreshold: 6 }}
        onCancel={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Cancelar'));

    expect(screen.getByText('Cancelar Execucao?')).toBeInTheDocument();
  });

  it('should call onCancel when confirmed', async () => {
    const onCancel = vi.fn();

    render(
      <ExecutionHeader
        status="running"
        startedAt={new Date()}
        config={{ numPosts: 3, platforms: ['instagram'], includeVisual: true, qualityThreshold: 6 }}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByText('Cancelar'));
    fireEvent.click(screen.getByText('Cancelar Pipeline'));

    await waitFor(() => {
      expect(onCancel).toHaveBeenCalled();
    });
  });
});
```

### Validacoes Manuais

1. Navegar para `/execution`
2. Iniciar uma execucao do pipeline (via Dashboard ou API)
3. Verificar que o fluxo de agentes e exibido com conectores
4. Verificar que cada agente mostra icone, nome e status
5. Verificar animacao pulsante no agente ativo
6. Verificar timer de tempo decorrido em cada agente
7. Verificar logs em tempo real estilo terminal
8. Verificar cores diferentes para tipos de log (info, success, warning, error)
9. Verificar auto-scroll e botao de pausar
10. Verificar previews de outputs conforme sao gerados
11. Clicar em "Cancelar" e confirmar cancelamento
12. Verificar que o pipeline e interrompido
13. Aguardar pipeline concluir e verificar resumo final
14. Verificar redirect automatico para `/posts` apos 5 segundos
15. Testar responsividade em diferentes tamanhos de tela (desktop, tablet, mobile)

---

## References

- [PRD](../prd.md) - Story 5.4, FR18, FR19
- [Architecture](../architecture.md) - Frontend Architecture, WebSocket Events
- [Story 5.1](./story-5.1.md) - WebSocket Server (dependencia)
- [Story 5.2](./story-5.2.md) - Hook de WebSocket no React (dependencia)
- [Story 4.7](./story-4.7.md) - Pipeline Completo End-to-End (dependencia)

---

## Dev Agent Record

### File List

| Status | File | Changes |
|--------|------|---------|
| Created | `packages/shared/src/types/execution.ts` | Types for real-time execution view (AgentId, AgentNodeState, PipelineState, ExecutionLogEntry, etc.) |
| Modified | `packages/shared/src/types/index.ts` | Added export for execution types |
| Created | `packages/ui/src/components/execution/agentConfig.ts` | Agent configuration with icons and names |
| Created | `packages/ui/src/components/execution/AgentNode.tsx` | Agent node component with status badges and pulsing animation |
| Created | `packages/ui/src/components/execution/AgentConnector.tsx` | Connector arrows between agents |
| Created | `packages/ui/src/components/execution/PipelineFlow.tsx` | Pipeline flow visualization (horizontal/vertical) |
| Created | `packages/ui/src/components/execution/LogViewer.tsx` | Terminal-style log viewer with auto-scroll |
| Created | `packages/ui/src/components/execution/OutputPreview.tsx` | Tabbed output preview for trends, topics, posts, images |
| Created | `packages/ui/src/components/execution/ExecutionHeader.tsx` | Header with status, timer, config summary, and cancel button |
| Created | `packages/ui/src/components/execution/ExecutionSummary.tsx` | Completion summary with stats and navigation |
| Created | `packages/ui/src/components/execution/ExecutionSkeleton.tsx` | Loading skeleton for execution page |
| Created | `packages/ui/src/components/execution/index.ts` | Barrel exports for execution components |
| Modified | `packages/ui/src/routes/Execution.tsx` | Full implementation with WebSocket integration |
| Created | `packages/ui/src/hooks/useExecution.ts` | Hooks for starting/canceling executions |
| Modified | `packages/ui/src/styles/globals.css` | Added agent-pulsing CSS animation |
| Created | `packages/ui/src/__tests__/execution.test.tsx` | Comprehensive tests (35 tests) for all components |

### Debug Log

- Fixed type conflict: Renamed LogEntry/LogLevel to ExecutionLogEntry/ExecutionLogLevel to avoid conflict with logger utils
- Fixed PipelineFlow null safety: Added getAgentState helper function for missing agent states
- Fixed ExecutionSummary division by zero: Added check for postsCount > 0 before calculating average
- Fixed useEffect return value: Added explicit return undefined for auto-redirect effect

### Completion Notes

All tasks completed successfully:
- Execution page with full real-time pipeline visualization
- 8 agent nodes with status indicators (waiting/running/done/error/skipped)
- CSS pulsing animation for active agents
- Terminal-style log viewer with color-coded messages and auto-scroll
- Tabbed output preview for intermediate results
- Cancel functionality with confirmation dialog
- Auto-redirect to posts after completion
- Responsive design (horizontal for desktop, vertical for mobile)
- 35 unit tests covering all components and use cases

Tests: 35/35 passing
Lint: 0 errors for execution-related files

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-29 | Story created | River (SM Agent) |
| 2026-01-29 | Implementation complete | Dex (Dev Agent) |
