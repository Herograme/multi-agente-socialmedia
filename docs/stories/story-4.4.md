# Story 4.4: Orquestrador LangGraph — Setup Base

> Epic 4: Qualidade & Orquestracao

---

## Story

**Como** desenvolvedor,
**Quero** um orquestrador usando LangGraph,
**Para que** o fluxo entre agentes seja gerenciado de forma robusta.

---

## Status

`Ready for Review`

---

## Acceptance Criteria

| # | Criterio | Validacao |
|---|----------|-----------|
| AC1 | LangGraph.js configurado no package `agents` | Dependencia instalada e importavel |
| AC2 | Grafo definido com todos os agentes como nodes | Grafo instancia e lista todos os nodes |
| AC3 | Edges definindo fluxo: Pesquisador -> Topicos -> Curador -> Redator -> Visual -> QA | Fluxo executa na ordem correta |
| AC4 | State compartilhado entre nodes tipado | Interface `PipelineState` exportada e usada |
| AC5 | Checkpoints para retomada em caso de falha | Checkpointer configurado e persistindo |
| AC6 | Configuracao de paralelismo onde possivel | Nodes independentes executam em paralelo |
| AC7 | Logging de transicoes entre nodes | Logs de entrada/saida de cada node |
| AC8 | Testes do grafo com mocks dos agentes | `pnpm test` passa |

---

## Tasks

- [x] **Task 1:** Instalar e configurar LangGraph.js
  - [x] Adicionar `@langchain/langgraph` ao `packages/agents/package.json`
  - [x] Adicionar `@langchain/core` como peer dependency
  - [x] Verificar compatibilidade com versao do Node.js (20+)
  - [x] Criar arquivo de configuracao `packages/agents/src/orchestrator/langgraph/config.ts`

- [x] **Task 2:** Definir interfaces e tipos do Pipeline State
  - [x] Criar `packages/agents/src/orchestrator/langgraph/types.ts`
  - [x] Definir interface `LangGraphPipelineState` com todos os campos
  - [x] Definir interface `NodeFunction` e tipos genericos
  - [x] Definir enum `LangGraphPipelineStatus` (pending, running, completed, failed, paused)
  - [x] Definir interface `CheckpointData` para persistencia
  - [x] Definir interface `TransitionLog` para logging

- [x] **Task 3:** Implementar nodes do grafo
  - [x] Criar `packages/agents/src/orchestrator/langgraph/nodes/researcher-node.ts`
  - [x] Criar `packages/agents/src/orchestrator/langgraph/nodes/topic-generator-node.ts`
  - [x] Criar `packages/agents/src/orchestrator/langgraph/nodes/curator-node.ts`
  - [x] Criar `packages/agents/src/orchestrator/langgraph/nodes/writer-node.ts`
  - [x] Criar `packages/agents/src/orchestrator/langgraph/nodes/visual-node.ts`
  - [x] Criar `packages/agents/src/orchestrator/langgraph/nodes/qa-node.ts`
  - [x] Criar barrel export `packages/agents/src/orchestrator/langgraph/nodes/index.ts`

- [x] **Task 4:** Implementar o grafo principal
  - [x] Criar `packages/agents/src/orchestrator/langgraph/pipeline-graph.ts`
  - [x] Instanciar `StateGraph` com `PipelineStateAnnotation`
  - [x] Adicionar todos os nodes ao grafo
  - [x] Definir edges sequenciais (Pesquisador -> Topicos -> ...)
  - [x] Definir entry point e end point
  - [x] Compilar grafo com `.compile()`

- [x] **Task 5:** Implementar checkpointer para persistencia
  - [x] Criar `packages/agents/src/orchestrator/langgraph/checkpointer.ts`
  - [x] Implementar `MemoryCheckpointer` para desenvolvimento
  - [x] Implementar `LangGraphMemorySaverWrapper` para integracao
  - [x] Configurar grafo com checkpointer
  - [x] Implementar metodo `resume(threadId)` no orchestrator

- [x] **Task 6:** Configurar paralelismo onde possivel
  - [x] Identificar nodes que podem executar em paralelo
  - [x] Criar `parallel-visual-node.ts` para execucao paralela
  - [x] Usar `Promise.all` para carousel e PDF em paralelo
  - [x] Documentar decisoes de paralelismo no config

- [x] **Task 7:** Implementar logging de transicoes
  - [x] Criar `packages/agents/src/orchestrator/langgraph/logger.ts`
  - [x] Implementar hooks `onNodeStart` e `onNodeEnd`
  - [x] Registrar: node name, timestamp, duration, input/output summary
  - [x] Integrar com logger do `@social-content/shared`
  - [x] Criar `ExecutionLogger` para contexto de execucao

- [x] **Task 8:** Criar factory function e exports
  - [x] Criar `packages/agents/src/orchestrator/langgraph/factory.ts`
  - [x] Implementar `createOrchestrator(options?)` com validacao
  - [x] Validar configuracao de entrada
  - [x] Criar `packages/agents/src/orchestrator/langgraph/index.ts`
  - [x] Atualizar `packages/agents/src/orchestrator/index.ts`

- [x] **Task 9:** Escrever testes unitarios
  - [x] Criar `packages/agents/src/__tests__/orchestrator/langgraph/pipeline-graph.test.ts`
  - [x] Criar `packages/agents/src/__tests__/orchestrator/langgraph/checkpointer.test.ts`
  - [x] Criar `packages/agents/src/__tests__/orchestrator/langgraph/nodes.test.ts`
  - [x] Criar `packages/agents/src/__tests__/orchestrator/langgraph/factory.test.ts`
  - [x] Criar `packages/agents/src/__tests__/orchestrator/langgraph/logger.test.ts`
  - [x] Testar fluxo sequencial completo (90 testes passando)

---

## Dev Notes

### Estrutura do Orquestrador

```
packages/agents/
├── src/
│   ├── orchestrator/
│   │   ├── types.ts
│   │   ├── config.ts
│   │   ├── pipeline-graph.ts
│   │   ├── checkpointer.ts
│   │   ├── logger.ts
│   │   ├── factory.ts
│   │   ├── nodes/
│   │   │   ├── researcher-node.ts
│   │   │   ├── topic-generator-node.ts
│   │   │   ├── curator-node.ts
│   │   │   ├── writer-node.ts
│   │   │   ├── visual-node.ts
│   │   │   ├── qa-node.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── __tests__/
│   │   ├── orchestrator/
│   │   │   ├── pipeline-graph.test.ts
│   │   │   ├── checkpointer.test.ts
│   │   │   └── nodes.test.ts
```

### Interfaces TypeScript

```typescript
// types.ts - Interfaces do Orquestrador

import { Trend, Topic } from '@social-content/shared';
import { CuratedContent } from '../agents/curador/types';
import { WriterOutput } from '../agents/writer/types';
import { GeneratedImage } from '../services/image-gen/types';
import { QAResult } from '../agents/qa/types';

/**
 * Status do pipeline de execucao
 */
export enum PipelineStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused'
}

/**
 * Estado compartilhado entre todos os nodes do grafo
 */
export interface PipelineState {
  // Identificacao
  executionId: string;
  threadId: string;
  status: PipelineStatus;

  // Configuracao
  config: PipelineConfig;

  // Dados do pipeline (preenchidos por cada node)
  trends: Trend[];
  topics: Topic[];
  curatedContent: CuratedContent[];
  posts: WriterOutput[];
  images: GeneratedImage[];
  carouselPaths: string[][];
  pdfPaths: string[];
  qaResults: QAResult[];

  // Metadata
  currentNode: string;
  startedAt: Date;
  completedAt?: Date;
  errors: PipelineError[];

  // Checkpointing
  lastCheckpoint?: string;
  checkpointData?: Record<string, unknown>;
}

/**
 * Configuracao do pipeline
 */
export interface PipelineConfig {
  numPosts: number;
  platforms: ('instagram' | 'linkedin')[];
  includeVisual: boolean;
  qualityThreshold: number;
  maxRetries: number;
  timeoutMs: number;
  parallelVisual: boolean;
}

/**
 * Erro durante execucao do pipeline
 */
export interface PipelineError {
  node: string;
  message: string;
  code: string;
  timestamp: Date;
  retriable: boolean;
  stack?: string;
}

/**
 * Log de transicao entre nodes
 */
export interface TransitionLog {
  from: string;
  to: string;
  timestamp: Date;
  durationMs: number;
  inputSummary: string;
  outputSummary: string;
  success: boolean;
  error?: string;
}

/**
 * Dados de checkpoint para persistencia
 */
export interface CheckpointData {
  threadId: string;
  state: Partial<PipelineState>;
  timestamp: Date;
  node: string;
  version: number;
}

/**
 * Resultado da execucao do pipeline
 */
export interface PipelineResult {
  executionId: string;
  status: PipelineStatus;
  posts: WriterOutput[];
  qaResults: QAResult[];
  stats: {
    totalGenerated: number;
    totalApproved: number;
    averageScore: number;
    durationMs: number;
  };
  errors: PipelineError[];
}

/**
 * Opcoes para criacao do grafo
 */
export interface GraphOptions {
  checkpointer?: Checkpointer;
  logger?: TransitionLogger;
  onNodeStart?: (node: string, state: PipelineState) => void;
  onNodeEnd?: (node: string, state: PipelineState, duration: number) => void;
  onError?: (node: string, error: Error) => void;
}

/**
 * Interface do checkpointer
 */
export interface Checkpointer {
  save(data: CheckpointData): Promise<void>;
  load(threadId: string): Promise<CheckpointData | null>;
  list(executionId: string): Promise<CheckpointData[]>;
  delete(threadId: string): Promise<void>;
}

/**
 * Interface do logger de transicoes
 */
export interface TransitionLogger {
  log(transition: TransitionLog): void;
  getHistory(executionId: string): TransitionLog[];
}
```

### Configuracao do LangGraph

```typescript
// config.ts - Configuracao do LangGraph

import { PipelineConfig } from './types';

/**
 * Configuracao padrao do pipeline
 */
export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  numPosts: 3,
  platforms: ['instagram', 'linkedin'],
  includeVisual: true,
  qualityThreshold: 6.0,
  maxRetries: 3,
  timeoutMs: 600000, // 10 minutos
  parallelVisual: true
};

/**
 * Nomes dos nodes do grafo
 */
export const NODE_NAMES = {
  RESEARCHER: 'researcher',
  TOPIC_GENERATOR: 'topic_generator',
  CURATOR: 'curator',
  WRITER: 'writer',
  IMAGE_DESIGNER: 'image_designer',
  CAROUSEL_BUILDER: 'carousel_builder',
  PDF_MAKER: 'pdf_maker',
  QA_ANALYST: 'qa_analyst'
} as const;

/**
 * Ordem de execucao dos nodes (sequencial)
 */
export const NODE_ORDER = [
  NODE_NAMES.RESEARCHER,
  NODE_NAMES.TOPIC_GENERATOR,
  NODE_NAMES.CURATOR,
  NODE_NAMES.WRITER,
  // Visual nodes podem ser paralelos
  NODE_NAMES.IMAGE_DESIGNER,
  NODE_NAMES.CAROUSEL_BUILDER,
  NODE_NAMES.PDF_MAKER,
  // QA no final
  NODE_NAMES.QA_ANALYST
] as const;

/**
 * Nodes que podem executar em paralelo
 */
export const PARALLEL_NODES = [
  [NODE_NAMES.CAROUSEL_BUILDER, NODE_NAMES.PDF_MAKER]
] as const;
```

### Implementacao do Pipeline Graph

```typescript
// pipeline-graph.ts - Grafo principal do orquestrador

import { StateGraph, END, START } from '@langchain/langgraph';
import { RunnableConfig } from '@langchain/core/runnables';
import {
  PipelineState,
  PipelineConfig,
  PipelineStatus,
  GraphOptions,
  PipelineResult
} from './types';
import { DEFAULT_PIPELINE_CONFIG, NODE_NAMES } from './config';
import {
  researcherNode,
  topicGeneratorNode,
  curatorNode,
  writerNode,
  imageDesignerNode,
  carouselBuilderNode,
  pdfMakerNode,
  qaAnalystNode
} from './nodes';
import { createTransitionLogger } from './logger';

/**
 * Cria o estado inicial do pipeline
 */
function createInitialState(
  executionId: string,
  config: PipelineConfig
): PipelineState {
  return {
    executionId,
    threadId: `thread_${executionId}`,
    status: PipelineStatus.PENDING,
    config,
    trends: [],
    topics: [],
    curatedContent: [],
    posts: [],
    images: [],
    carouselPaths: [],
    pdfPaths: [],
    qaResults: [],
    currentNode: '',
    startedAt: new Date(),
    errors: []
  };
}

/**
 * Annotation para o estado do grafo
 */
const PipelineStateAnnotation = {
  executionId: { default: () => '' },
  threadId: { default: () => '' },
  status: { default: () => PipelineStatus.PENDING },
  config: { default: () => DEFAULT_PIPELINE_CONFIG },
  trends: { default: () => [] },
  topics: { default: () => [] },
  curatedContent: { default: () => [] },
  posts: { default: () => [] },
  images: { default: () => [] },
  carouselPaths: { default: () => [] },
  pdfPaths: { default: () => [] },
  qaResults: { default: () => [] },
  currentNode: { default: () => '' },
  startedAt: { default: () => new Date() },
  completedAt: { default: () => undefined },
  errors: { default: () => [] },
  lastCheckpoint: { default: () => undefined },
  checkpointData: { default: () => undefined }
};

/**
 * Cria wrapper de node com logging
 */
function createNodeWrapper(
  nodeName: string,
  nodeFunction: (state: PipelineState) => Promise<Partial<PipelineState>>,
  options: GraphOptions
) {
  return async (state: PipelineState): Promise<Partial<PipelineState>> => {
    const startTime = Date.now();

    // Notifica inicio
    options.onNodeStart?.(nodeName, state);

    try {
      // Atualiza node atual
      const updatedState = {
        ...state,
        currentNode: nodeName,
        status: PipelineStatus.RUNNING
      };

      // Executa node
      const result = await nodeFunction(updatedState);

      const duration = Date.now() - startTime;

      // Notifica fim
      options.onNodeEnd?.(nodeName, { ...state, ...result }, duration);

      // Log transicao
      options.logger?.log({
        from: state.currentNode || START,
        to: nodeName,
        timestamp: new Date(),
        durationMs: duration,
        inputSummary: summarizeState(state),
        outputSummary: summarizeState({ ...state, ...result }),
        success: true
      });

      return result;
    } catch (error) {
      const err = error as Error;

      // Notifica erro
      options.onError?.(nodeName, err);

      // Log transicao com erro
      options.logger?.log({
        from: state.currentNode || START,
        to: nodeName,
        timestamp: new Date(),
        durationMs: Date.now() - startTime,
        inputSummary: summarizeState(state),
        outputSummary: '',
        success: false,
        error: err.message
      });

      throw error;
    }
  };
}

/**
 * Resume do estado para logging
 */
function summarizeState(state: Partial<PipelineState>): string {
  const parts = [];
  if (state.trends?.length) parts.push(`trends:${state.trends.length}`);
  if (state.topics?.length) parts.push(`topics:${state.topics.length}`);
  if (state.posts?.length) parts.push(`posts:${state.posts.length}`);
  if (state.images?.length) parts.push(`images:${state.images.length}`);
  if (state.qaResults?.length) parts.push(`qa:${state.qaResults.length}`);
  return parts.join(', ') || 'empty';
}

/**
 * Condicao para verificar se deve incluir visual
 */
function shouldIncludeVisual(state: PipelineState): string {
  return state.config.includeVisual
    ? NODE_NAMES.IMAGE_DESIGNER
    : NODE_NAMES.QA_ANALYST;
}

/**
 * Cria e compila o grafo do pipeline
 */
export function createPipelineGraph(options: GraphOptions = {}) {
  const logger = options.logger ?? createTransitionLogger();
  const mergedOptions = { ...options, logger };

  // Cria o grafo com state annotation
  const graph = new StateGraph<PipelineState>({
    channels: PipelineStateAnnotation
  });

  // Adiciona nodes com wrappers de logging
  graph.addNode(
    NODE_NAMES.RESEARCHER,
    createNodeWrapper(NODE_NAMES.RESEARCHER, researcherNode, mergedOptions)
  );

  graph.addNode(
    NODE_NAMES.TOPIC_GENERATOR,
    createNodeWrapper(NODE_NAMES.TOPIC_GENERATOR, topicGeneratorNode, mergedOptions)
  );

  graph.addNode(
    NODE_NAMES.CURATOR,
    createNodeWrapper(NODE_NAMES.CURATOR, curatorNode, mergedOptions)
  );

  graph.addNode(
    NODE_NAMES.WRITER,
    createNodeWrapper(NODE_NAMES.WRITER, writerNode, mergedOptions)
  );

  graph.addNode(
    NODE_NAMES.IMAGE_DESIGNER,
    createNodeWrapper(NODE_NAMES.IMAGE_DESIGNER, imageDesignerNode, mergedOptions)
  );

  graph.addNode(
    NODE_NAMES.CAROUSEL_BUILDER,
    createNodeWrapper(NODE_NAMES.CAROUSEL_BUILDER, carouselBuilderNode, mergedOptions)
  );

  graph.addNode(
    NODE_NAMES.PDF_MAKER,
    createNodeWrapper(NODE_NAMES.PDF_MAKER, pdfMakerNode, mergedOptions)
  );

  graph.addNode(
    NODE_NAMES.QA_ANALYST,
    createNodeWrapper(NODE_NAMES.QA_ANALYST, qaAnalystNode, mergedOptions)
  );

  // Define edges (fluxo sequencial)
  graph.addEdge(START, NODE_NAMES.RESEARCHER);
  graph.addEdge(NODE_NAMES.RESEARCHER, NODE_NAMES.TOPIC_GENERATOR);
  graph.addEdge(NODE_NAMES.TOPIC_GENERATOR, NODE_NAMES.CURATOR);
  graph.addEdge(NODE_NAMES.CURATOR, NODE_NAMES.WRITER);

  // Edge condicional: visual ou direto para QA
  graph.addConditionalEdges(
    NODE_NAMES.WRITER,
    shouldIncludeVisual,
    {
      [NODE_NAMES.IMAGE_DESIGNER]: NODE_NAMES.IMAGE_DESIGNER,
      [NODE_NAMES.QA_ANALYST]: NODE_NAMES.QA_ANALYST
    }
  );

  // Fluxo visual
  graph.addEdge(NODE_NAMES.IMAGE_DESIGNER, NODE_NAMES.CAROUSEL_BUILDER);
  graph.addEdge(NODE_NAMES.CAROUSEL_BUILDER, NODE_NAMES.PDF_MAKER);
  graph.addEdge(NODE_NAMES.PDF_MAKER, NODE_NAMES.QA_ANALYST);

  // Fim
  graph.addEdge(NODE_NAMES.QA_ANALYST, END);

  // Compila com checkpointer se fornecido
  const compiled = graph.compile({
    checkpointer: options.checkpointer
  });

  return compiled;
}

/**
 * Executa o pipeline completo
 */
export async function runPipeline(
  executionId: string,
  config: Partial<PipelineConfig> = {},
  options: GraphOptions = {}
): Promise<PipelineResult> {
  const mergedConfig: PipelineConfig = {
    ...DEFAULT_PIPELINE_CONFIG,
    ...config
  };

  const initialState = createInitialState(executionId, mergedConfig);
  const graph = createPipelineGraph(options);

  const runnableConfig: RunnableConfig = {
    configurable: {
      thread_id: initialState.threadId
    }
  };

  try {
    const finalState = await graph.invoke(initialState, runnableConfig);

    // Calcula estatisticas
    const approvedPosts = finalState.qaResults.filter(
      (r: { approved: boolean }) => r.approved
    ).length;

    const totalScore = finalState.qaResults.reduce(
      (sum: number, r: { overallScore: number }) => sum + r.overallScore,
      0
    );

    return {
      executionId,
      status: PipelineStatus.COMPLETED,
      posts: finalState.posts,
      qaResults: finalState.qaResults,
      stats: {
        totalGenerated: finalState.posts.length,
        totalApproved: approvedPosts,
        averageScore: finalState.qaResults.length > 0
          ? totalScore / finalState.qaResults.length
          : 0,
        durationMs: Date.now() - initialState.startedAt.getTime()
      },
      errors: finalState.errors
    };
  } catch (error) {
    return {
      executionId,
      status: PipelineStatus.FAILED,
      posts: [],
      qaResults: [],
      stats: {
        totalGenerated: 0,
        totalApproved: 0,
        averageScore: 0,
        durationMs: Date.now() - initialState.startedAt.getTime()
      },
      errors: [{
        node: 'pipeline',
        message: (error as Error).message,
        code: 'PIPELINE_FAILED',
        timestamp: new Date(),
        retriable: true,
        stack: (error as Error).stack
      }]
    };
  }
}
```

### Exemplo de Node

```typescript
// nodes/researcher-node.ts - Node do Pesquisador

import { PipelineState } from '../types';
import { createResearcherAgent } from '../../agents/researcher';

/**
 * Node do agente Pesquisador
 * Busca tendencias de fontes configuradas
 */
export async function researcherNode(
  state: PipelineState
): Promise<Partial<PipelineState>> {
  const researcher = createResearcherAgent();

  const result = await researcher.run({
    sources: ['devto', 'hackernews', 'reddit'],
    maxResults: 50
  });

  return {
    trends: result.trends,
    currentNode: 'researcher'
  };
}
```

### Checkpointer Implementation

```typescript
// checkpointer.ts - Implementacao do checkpointer

import { BaseCheckpointSaver } from '@langchain/langgraph';
import { CheckpointData, Checkpointer } from './types';

/**
 * Checkpointer em memoria para desenvolvimento
 */
export class MemoryCheckpointer implements Checkpointer {
  private checkpoints: Map<string, CheckpointData> = new Map();

  async save(data: CheckpointData): Promise<void> {
    this.checkpoints.set(data.threadId, data);
  }

  async load(threadId: string): Promise<CheckpointData | null> {
    return this.checkpoints.get(threadId) ?? null;
  }

  async list(executionId: string): Promise<CheckpointData[]> {
    return Array.from(this.checkpoints.values())
      .filter(cp => cp.state.executionId === executionId);
  }

  async delete(threadId: string): Promise<void> {
    this.checkpoints.delete(threadId);
  }
}

/**
 * Adapter para usar com LangGraph
 */
export class LangGraphCheckpointerAdapter extends BaseCheckpointSaver {
  constructor(private checkpointer: Checkpointer) {
    super();
  }

  async getTuple(config: { configurable: { thread_id: string } }) {
    const data = await this.checkpointer.load(config.configurable.thread_id);
    if (!data) return undefined;

    return {
      config,
      checkpoint: {
        v: data.version,
        ts: data.timestamp.toISOString(),
        channel_values: data.state,
        channel_versions: {},
        versions_seen: {}
      },
      metadata: { node: data.node }
    };
  }

  async put(
    config: { configurable: { thread_id: string } },
    checkpoint: { v: number; ts: string; channel_values: Record<string, unknown> },
    metadata: { node: string }
  ) {
    await this.checkpointer.save({
      threadId: config.configurable.thread_id,
      state: checkpoint.channel_values as Partial<import('./types').PipelineState>,
      timestamp: new Date(checkpoint.ts),
      node: metadata.node,
      version: checkpoint.v
    });

    return config;
  }

  async *list() {
    // Implementacao simplificada
    yield* [];
  }
}

/**
 * Cria checkpointer em memoria
 */
export function createMemoryCheckpointer(): LangGraphCheckpointerAdapter {
  return new LangGraphCheckpointerAdapter(new MemoryCheckpointer());
}
```

### Logger de Transicoes

```typescript
// logger.ts - Logger de transicoes entre nodes

import { TransitionLog, TransitionLogger } from './types';
import { createLogger } from '@social-content/shared';

const logger = createLogger('orchestrator');

/**
 * Implementacao do logger de transicoes
 */
class DefaultTransitionLogger implements TransitionLogger {
  private history: Map<string, TransitionLog[]> = new Map();

  log(transition: TransitionLog): void {
    // Log para console/arquivo
    const level = transition.success ? 'info' : 'error';
    logger[level]({
      msg: `Transition: ${transition.from} -> ${transition.to}`,
      duration: transition.durationMs,
      success: transition.success,
      input: transition.inputSummary,
      output: transition.outputSummary,
      error: transition.error
    });

    // Armazena no historico
    // Extrai executionId do threadId (thread_xxx -> xxx)
    const executionId = transition.from.includes('_')
      ? transition.from.split('_')[1]
      : 'unknown';

    if (!this.history.has(executionId)) {
      this.history.set(executionId, []);
    }
    this.history.get(executionId)!.push(transition);
  }

  getHistory(executionId: string): TransitionLog[] {
    return this.history.get(executionId) ?? [];
  }
}

/**
 * Cria logger de transicoes
 */
export function createTransitionLogger(): TransitionLogger {
  return new DefaultTransitionLogger();
}
```

### Factory Function

```typescript
// factory.ts - Factory do orquestrador

import { createPipelineGraph, runPipeline } from './pipeline-graph';
import { createMemoryCheckpointer } from './checkpointer';
import { createTransitionLogger } from './logger';
import {
  PipelineConfig,
  GraphOptions,
  PipelineResult
} from './types';
import { DEFAULT_PIPELINE_CONFIG } from './config';

/**
 * Opcoes para criar o orquestrador
 */
export interface OrchestratorOptions {
  config?: Partial<PipelineConfig>;
  enableCheckpoints?: boolean;
  enableLogging?: boolean;
  onNodeStart?: (node: string, state: unknown) => void;
  onNodeEnd?: (node: string, state: unknown, duration: number) => void;
  onError?: (node: string, error: Error) => void;
}

/**
 * Interface do orquestrador
 */
export interface Orchestrator {
  run(executionId: string): Promise<PipelineResult>;
  resume(threadId: string): Promise<PipelineResult>;
  getConfig(): PipelineConfig;
}

/**
 * Cria instancia do orquestrador
 */
export function createOrchestrator(
  options: OrchestratorOptions = {}
): Orchestrator {
  const config: PipelineConfig = {
    ...DEFAULT_PIPELINE_CONFIG,
    ...options.config
  };

  const graphOptions: GraphOptions = {
    checkpointer: options.enableCheckpoints !== false
      ? createMemoryCheckpointer()
      : undefined,
    logger: options.enableLogging !== false
      ? createTransitionLogger()
      : undefined,
    onNodeStart: options.onNodeStart,
    onNodeEnd: options.onNodeEnd,
    onError: options.onError
  };

  return {
    async run(executionId: string): Promise<PipelineResult> {
      return runPipeline(executionId, config, graphOptions);
    },

    async resume(threadId: string): Promise<PipelineResult> {
      // Implementacao de resume usando checkpointer
      if (!graphOptions.checkpointer) {
        throw new Error('Checkpointer not enabled - cannot resume');
      }

      const graph = createPipelineGraph(graphOptions);
      const result = await graph.invoke(
        null,
        { configurable: { thread_id: threadId } }
      );

      return {
        executionId: result.executionId,
        status: result.status,
        posts: result.posts,
        qaResults: result.qaResults,
        stats: {
          totalGenerated: result.posts.length,
          totalApproved: result.qaResults.filter((r: { approved: boolean }) => r.approved).length,
          averageScore: result.qaResults.length > 0
            ? result.qaResults.reduce((s: number, r: { overallScore: number }) => s + r.overallScore, 0) / result.qaResults.length
            : 0,
          durationMs: 0
        },
        errors: result.errors
      };
    },

    getConfig(): PipelineConfig {
      return { ...config };
    }
  };
}
```

---

## Testing

### Testes do Pipeline Graph

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPipelineGraph, runPipeline } from '../orchestrator/pipeline-graph';
import { createMemoryCheckpointer } from '../orchestrator/checkpointer';
import { PipelineState, PipelineStatus } from '../orchestrator/types';
import { NODE_NAMES } from '../orchestrator/config';

// Mock dos nodes
vi.mock('../orchestrator/nodes', () => ({
  researcherNode: vi.fn().mockResolvedValue({
    trends: [{ id: '1', title: 'Test Trend', source: 'devto' }]
  }),
  topicGeneratorNode: vi.fn().mockResolvedValue({
    topics: [{ id: '1', title: 'Test Topic', description: 'Test' }]
  }),
  curatorNode: vi.fn().mockResolvedValue({
    curatedContent: [{ id: '1', references: [], keyPoints: [] }]
  }),
  writerNode: vi.fn().mockResolvedValue({
    posts: [{ id: '1', textInstagram: 'Test post', textLinkedIn: 'Test post' }]
  }),
  imageDesignerNode: vi.fn().mockResolvedValue({
    images: [{ id: '1', localPath: '/test/image.png' }]
  }),
  carouselBuilderNode: vi.fn().mockResolvedValue({
    carouselPaths: [['/test/slide1.png', '/test/slide2.png']]
  }),
  pdfMakerNode: vi.fn().mockResolvedValue({
    pdfPaths: ['/test/document.pdf']
  }),
  qaAnalystNode: vi.fn().mockResolvedValue({
    qaResults: [{ postId: '1', overallScore: 8.5, approved: true }]
  })
}));

describe('PipelineGraph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPipelineGraph', () => {
    it('should create a compiled graph', () => {
      const graph = createPipelineGraph();
      expect(graph).toBeDefined();
      expect(typeof graph.invoke).toBe('function');
    });

    it('should create graph with checkpointer', () => {
      const checkpointer = createMemoryCheckpointer();
      const graph = createPipelineGraph({ checkpointer });
      expect(graph).toBeDefined();
    });
  });

  describe('runPipeline', () => {
    it('should execute full pipeline successfully', async () => {
      const result = await runPipeline('test-execution-1');

      expect(result.status).toBe(PipelineStatus.COMPLETED);
      expect(result.executionId).toBe('test-execution-1');
      expect(result.posts).toHaveLength(1);
      expect(result.qaResults).toHaveLength(1);
      expect(result.stats.totalGenerated).toBe(1);
    });

    it('should respect includeVisual config', async () => {
      const result = await runPipeline('test-execution-2', {
        includeVisual: false
      });

      expect(result.status).toBe(PipelineStatus.COMPLETED);
      // Visual nodes should be skipped
    });

    it('should track execution statistics', async () => {
      const result = await runPipeline('test-execution-3');

      expect(result.stats.durationMs).toBeGreaterThan(0);
      expect(result.stats.averageScore).toBe(8.5);
      expect(result.stats.totalApproved).toBe(1);
    });

    it('should handle errors gracefully', async () => {
      const { researcherNode } = await import('../orchestrator/nodes');
      (researcherNode as any).mockRejectedValueOnce(new Error('API Error'));

      const result = await runPipeline('test-execution-4');

      expect(result.status).toBe(PipelineStatus.FAILED);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe('API Error');
    });
  });

  describe('logging', () => {
    it('should call onNodeStart and onNodeEnd callbacks', async () => {
      const onNodeStart = vi.fn();
      const onNodeEnd = vi.fn();

      await runPipeline('test-execution-5', {}, {
        onNodeStart,
        onNodeEnd
      });

      expect(onNodeStart).toHaveBeenCalledTimes(8); // All 8 nodes
      expect(onNodeEnd).toHaveBeenCalledTimes(8);
    });

    it('should log transitions between nodes', async () => {
      const logger = {
        log: vi.fn(),
        getHistory: vi.fn().mockReturnValue([])
      };

      await runPipeline('test-execution-6', {}, { logger });

      expect(logger.log).toHaveBeenCalled();
      const firstCall = logger.log.mock.calls[0][0];
      expect(firstCall).toHaveProperty('from');
      expect(firstCall).toHaveProperty('to');
      expect(firstCall).toHaveProperty('durationMs');
      expect(firstCall).toHaveProperty('success');
    });
  });
});
```

### Testes do Checkpointer

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  MemoryCheckpointer,
  createMemoryCheckpointer
} from '../orchestrator/checkpointer';
import { CheckpointData, PipelineStatus } from '../orchestrator/types';

describe('MemoryCheckpointer', () => {
  let checkpointer: MemoryCheckpointer;

  beforeEach(() => {
    checkpointer = new MemoryCheckpointer();
  });

  it('should save and load checkpoint', async () => {
    const data: CheckpointData = {
      threadId: 'thread_1',
      state: {
        executionId: 'exec_1',
        status: PipelineStatus.RUNNING,
        trends: [{ id: '1', title: 'Test' }]
      },
      timestamp: new Date(),
      node: 'researcher',
      version: 1
    };

    await checkpointer.save(data);
    const loaded = await checkpointer.load('thread_1');

    expect(loaded).not.toBeNull();
    expect(loaded?.threadId).toBe('thread_1');
    expect(loaded?.state.trends).toHaveLength(1);
  });

  it('should return null for non-existent checkpoint', async () => {
    const loaded = await checkpointer.load('non_existent');
    expect(loaded).toBeNull();
  });

  it('should list checkpoints by executionId', async () => {
    await checkpointer.save({
      threadId: 'thread_1',
      state: { executionId: 'exec_1' },
      timestamp: new Date(),
      node: 'node1',
      version: 1
    });

    await checkpointer.save({
      threadId: 'thread_2',
      state: { executionId: 'exec_1' },
      timestamp: new Date(),
      node: 'node2',
      version: 1
    });

    const list = await checkpointer.list('exec_1');
    expect(list).toHaveLength(2);
  });

  it('should delete checkpoint', async () => {
    await checkpointer.save({
      threadId: 'thread_1',
      state: {},
      timestamp: new Date(),
      node: 'test',
      version: 1
    });

    await checkpointer.delete('thread_1');
    const loaded = await checkpointer.load('thread_1');

    expect(loaded).toBeNull();
  });
});

describe('createMemoryCheckpointer', () => {
  it('should create LangGraph compatible checkpointer', () => {
    const checkpointer = createMemoryCheckpointer();

    expect(checkpointer).toBeDefined();
    expect(typeof checkpointer.getTuple).toBe('function');
    expect(typeof checkpointer.put).toBe('function');
  });
});
```

### Testes dos Nodes

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { researcherNode } from '../orchestrator/nodes/researcher-node';
import { PipelineState, PipelineStatus } from '../orchestrator/types';
import { DEFAULT_PIPELINE_CONFIG } from '../orchestrator/config';

// Mock do agente
vi.mock('../../agents/researcher', () => ({
  createResearcherAgent: vi.fn().mockReturnValue({
    run: vi.fn().mockResolvedValue({
      trends: [
        { id: '1', title: 'React 19 Features', source: 'devto' },
        { id: '2', title: 'Node.js 22 Release', source: 'hackernews' }
      ]
    })
  })
}));

describe('researcherNode', () => {
  const mockState: PipelineState = {
    executionId: 'test-1',
    threadId: 'thread_test-1',
    status: PipelineStatus.RUNNING,
    config: DEFAULT_PIPELINE_CONFIG,
    trends: [],
    topics: [],
    curatedContent: [],
    posts: [],
    images: [],
    carouselPaths: [],
    pdfPaths: [],
    qaResults: [],
    currentNode: '',
    startedAt: new Date(),
    errors: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch trends and update state', async () => {
    const result = await researcherNode(mockState);

    expect(result.trends).toBeDefined();
    expect(result.trends).toHaveLength(2);
    expect(result.currentNode).toBe('researcher');
  });

  it('should return trends with correct structure', async () => {
    const result = await researcherNode(mockState);

    expect(result.trends![0]).toHaveProperty('id');
    expect(result.trends![0]).toHaveProperty('title');
    expect(result.trends![0]).toHaveProperty('source');
  });
});
```

---

## References

- [PRD](../prd.md) - Epic 4: Qualidade & Orquestracao, Story 4.4
- [Architecture](../architecture.md) - Orchestration Layer
- [LangGraph.js Documentation](https://js.langchain.com/docs/langgraph)
- [Story 2.1](./story-2.1.md) - Servico de LLM (reference for service patterns)
- [Story 3.1](./story-3.1.md) - Servico de Geracao de Imagem (reference for fallback patterns)

---

## Dev Agent Record

### File List

| Status | File | Changes |
|--------|------|---------|
| Modified | `packages/agents/package.json` | Added @langchain/langgraph and @langchain/core dependencies |
| Created | `packages/agents/src/orchestrator/langgraph/config.ts` | Pipeline configuration constants |
| Created | `packages/agents/src/orchestrator/langgraph/types.ts` | Pipeline state interfaces and types |
| Created | `packages/agents/src/orchestrator/langgraph/nodes/researcher-node.ts` | Researcher node implementation |
| Created | `packages/agents/src/orchestrator/langgraph/nodes/topic-generator-node.ts` | Topic generator node |
| Created | `packages/agents/src/orchestrator/langgraph/nodes/curator-node.ts` | Curator node implementation |
| Created | `packages/agents/src/orchestrator/langgraph/nodes/writer-node.ts` | Writer node implementation |
| Created | `packages/agents/src/orchestrator/langgraph/nodes/visual-node.ts` | Image, carousel, and PDF nodes |
| Created | `packages/agents/src/orchestrator/langgraph/nodes/qa-node.ts` | QA analyst node implementation |
| Created | `packages/agents/src/orchestrator/langgraph/nodes/parallel-visual-node.ts` | Parallel visual processing node |
| Created | `packages/agents/src/orchestrator/langgraph/nodes/index.ts` | Barrel export for nodes |
| Created | `packages/agents/src/orchestrator/langgraph/pipeline-graph.ts` | Main StateGraph implementation |
| Created | `packages/agents/src/orchestrator/langgraph/checkpointer.ts` | MemoryCheckpointer and LangGraph adapter |
| Created | `packages/agents/src/orchestrator/langgraph/logger.ts` | Transition logging implementation |
| Created | `packages/agents/src/orchestrator/langgraph/factory.ts` | createOrchestrator factory function |
| Created | `packages/agents/src/orchestrator/langgraph/index.ts` | Module barrel export |
| Modified | `packages/agents/src/orchestrator/index.ts` | Added langgraph exports |
| Created | `packages/agents/src/__tests__/orchestrator/langgraph/pipeline-graph.test.ts` | Pipeline graph tests |
| Created | `packages/agents/src/__tests__/orchestrator/langgraph/checkpointer.test.ts` | Checkpointer tests |
| Created | `packages/agents/src/__tests__/orchestrator/langgraph/nodes.test.ts` | Node implementation tests |
| Created | `packages/agents/src/__tests__/orchestrator/langgraph/factory.test.ts` | Factory function tests |
| Created | `packages/agents/src/__tests__/orchestrator/langgraph/logger.test.ts` | Logger tests |

### Debug Log

- Used LangGraph StateGraph with Annotation.Root for state management
- Used `as any` cast on StateGraph to bypass strict typing for node names
- Implemented parallel visual processing with Promise.all in parallel-visual-node.ts
- All 90 unit tests passing

### Completion Notes

LangGraph.js orchestrator successfully implemented with:
- Full pipeline graph with 8 nodes (researcher, topic_generator, curator, writer, image_designer, carousel_builder, pdf_maker, qa_analyst)
- Conditional edges for visual content (skips visual nodes when includeVisual=false)
- MemoryCheckpointer for development with resume capability
- Transition logging with state summaries
- Factory function with configuration validation
- 90 unit tests covering pipeline graph, checkpointer, nodes, factory, and logger

Note: Node implementations use placeholder logic that should be replaced with actual agent integrations in future stories.

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story created | River (SM Agent) |
| 2026-01-28 | Story implemented with all 9 tasks completed | Dex (Dev Agent) |
| 2026-01-28 | QA review completed | Quinn (QA Agent) |

---

## QA Results

### Gate Decision: **PASS**

The Story 4.4 implementation meets all acceptance criteria. The LangGraph.js orchestrator is properly configured with a complete pipeline graph, checkpoint persistence, transition logging, and comprehensive test coverage.

---

### Test Results Summary

| Category | Result | Details |
|----------|--------|---------|
| **LangGraph Tests** | PASS | 90 tests passing (5 test files) |
| **Pipeline Graph** | PASS | 13 tests - full pipeline execution, conditional edges, callbacks |
| **Checkpointer** | PASS | 18 tests - save/load/delete, resume validation |
| **Nodes** | PASS | 20 tests - all 8 node implementations verified |
| **Logger** | PASS | 21 tests - transition logging, ExecutionLogger |
| **Factory** | PASS | 18 tests - orchestrator creation, validation, test helpers |
| **TypeCheck** | PASS | No TypeScript errors in agents package |
| **Lint** | PARTIAL | 8 minor lint issues in langgraph files (unused imports/vars) |

**Note:** The overall test suite shows 10 failures in `renderer.test.ts` due to a Puppeteer/Chrome compatibility issue on ARM64 architecture. This is unrelated to Story 4.4 and affects a pre-existing module.

---

### Acceptance Criteria Verification

| AC# | Criterion | Status | Evidence |
|-----|-----------|--------|----------|
| AC1 | LangGraph.js configured in package `agents` | PASS | `@langchain/langgraph@^0.2.0` and `@langchain/core@^0.3.0` in package.json |
| AC2 | Grafo definido com todos os agentes como nodes | PASS | 8 nodes defined: researcher, topic_generator, curator, writer, image_designer, carousel_builder, pdf_maker, qa_analyst |
| AC3 | Edges definindo fluxo correto | PASS | Sequential flow verified in pipeline-graph.ts with conditional edges for visual content |
| AC4 | State compartilhado entre nodes tipado | PASS | `LangGraphPipelineState` interface exported with 18 typed fields |
| AC5 | Checkpoints para retomada | PASS | MemoryCheckpointer and LangGraphMemorySaverWrapper implemented; resume() method in factory |
| AC6 | Configuracao de paralelismo | PASS | `parallelVisualNode` using Promise.all for carousel+PDF; PARALLEL_NODE_GROUPS config |
| AC7 | Logging de transicoes | PASS | TransitionLogger with onNodeStart/onNodeEnd hooks; ExecutionLogger class |
| AC8 | Testes do grafo com mocks | PASS | 90 tests passing with proper mocks for all agent nodes |

---

### Code Quality Review

#### Strengths

1. **Clean Architecture**: Clear separation between config, types, nodes, checkpointer, logger, and factory
2. **Type Safety**: Comprehensive TypeScript interfaces for pipeline state, transitions, and checkpoints
3. **LangGraph Integration**: Proper use of StateGraph, Annotation.Root, START/END constants, and conditional edges
4. **Extensibility**: Factory pattern with configuration validation and test helpers
5. **Logging**: Structured logging with execution context and state summaries
6. **Error Handling**: Graceful error propagation with detailed error objects

#### Issues Found (Minor)

1. **Unused imports in test files**: `beforeEach`, `vi`, `LangGraphPipelineState` imported but not used
2. **Unused imports in source files**: `createMemorySaver` in factory.ts, `NODE_NAMES` in parallel-visual-node.ts
3. **Unused parameter**: `postIndex` in visual-node.ts line 79

**Severity**: Low - These are lint warnings that do not affect functionality.

#### Code Metrics

| Metric | Value |
|--------|-------|
| Source Files | 15 files |
| Test Files | 5 files |
| Test Coverage | 90 unit tests |
| Type Coverage | Full (TypeCheck passes) |

---

### Recommendations

1. **Clean up lint issues**: Remove unused imports in:
   - `factory.ts` (createMemorySaver)
   - `parallel-visual-node.ts` (NODE_NAMES)
   - `nodes.test.ts` (beforeEach, vi)
   - `pipeline-graph.test.ts` (LangGraphPipelineState, unused node imports)
   - `visual-node.ts` (prefix `postIndex` with `_`)

2. **Future Integration**: Node implementations currently use placeholder logic (as noted in Dev Notes). Real agent integrations should be added in subsequent stories.

3. **Consider Database Checkpointer**: For production, implement a persistent checkpointer (e.g., PostgreSQL, Redis) instead of MemoryCheckpointer.

---

### Files Reviewed

| File | Status |
|------|--------|
| `packages/agents/package.json` | Verified - dependencies correct |
| `packages/agents/src/orchestrator/langgraph/types.ts` | Verified - comprehensive typing |
| `packages/agents/src/orchestrator/langgraph/config.ts` | Verified - well-structured constants |
| `packages/agents/src/orchestrator/langgraph/pipeline-graph.ts` | Verified - correct graph construction |
| `packages/agents/src/orchestrator/langgraph/checkpointer.ts` | Verified - persistence logic |
| `packages/agents/src/orchestrator/langgraph/logger.ts` | Verified - transition tracking |
| `packages/agents/src/orchestrator/langgraph/factory.ts` | Verified - orchestrator creation |
| `packages/agents/src/orchestrator/langgraph/nodes/*.ts` | Verified - all 8 node implementations |
| `packages/agents/src/orchestrator/langgraph/index.ts` | Verified - barrel exports |
| `packages/agents/src/__tests__/orchestrator/langgraph/*.ts` | Verified - comprehensive tests |

---

**QA Review Completed**: 2026-01-28
**Reviewer**: Quinn (QA Agent)
