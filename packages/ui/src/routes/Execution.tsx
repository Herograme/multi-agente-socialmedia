/**
 * Execution Page - Story 5.4
 * Real-time pipeline execution view with agent flow, logs, and outputs
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  PipelineFlow,
  LogViewer,
  OutputPreview,
  ExecutionHeader,
  ExecutionSummary,
  ExecutionSkeleton,
  AGENTS,
  getAgentName,
} from '../components/execution';
import { useWebSocket } from '../hooks/useWebSocket';
import { useCancelExecution } from '../hooks/useExecution';
import type {
  PipelineState,
  AgentNodeState,
  ExecutionLogEntry,
  AgentId,
  PipelineOutputs,
  Platform,
} from '@social-content/shared';

// Event payload types
interface PipelineStartPayload {
  executionId: string;
  config: {
    numPosts: number;
    platforms: Platform[];
    includeVisual: boolean;
    qualityThreshold: number;
  };
}

interface AgentStartPayload {
  agentId: AgentId;
  agentName: string;
}

interface AgentProgressPayload {
  agentId: AgentId;
  progress: number;
  message: string;
}

interface AgentCompletePayload {
  agentId: AgentId;
  duration: number;
  result: unknown;
}

interface AgentErrorPayload {
  agentId: AgentId;
  error: string;
  willRetry: boolean;
}

interface PipelineCompletePayload {
  executionId: string;
  status: 'completed' | 'failed';
  postsGenerated: number;
  averageScore: number;
  duration: number;
}

function createInitialAgentStates(): Record<AgentId, AgentNodeState> {
  return AGENTS.reduce(
    (acc, agent) => ({
      ...acc,
      [agent.id]: { id: agent.id, name: agent.name, status: 'waiting' as const },
    }),
    {} as Record<AgentId, AgentNodeState>
  );
}

function mergeOutputs(current: PipelineOutputs, agentId: AgentId, result: unknown): PipelineOutputs {
  switch (agentId) {
    case 'researcher':
      return { ...current, trends: result as PipelineOutputs['trends'] };
    case 'topic-generator':
      return { ...current, topics: result as PipelineOutputs['topics'] };
    case 'curator':
      return { ...current, curatedContent: result as PipelineOutputs['curatedContent'] };
    case 'writer':
    case 'qa-analyst':
      return { ...current, posts: result as PipelineOutputs['posts'] };
    case 'image-designer':
      return { ...current, images: result as string[] };
    default:
      return current;
  }
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${remainingSeconds}s`;
}

export function Execution() {
  const { id: executionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isConnected, subscribe } = useWebSocket();
  const cancelMutation = useCancelExecution();

  const [pipelineState, setPipelineState] = useState<PipelineState>(() => ({
    executionId: executionId || '',
    status: 'idle',
    config: {
      numPosts: 3,
      platforms: ['instagram', 'linkedin'] as Platform[],
      includeVisual: true,
      qualityThreshold: 6.0,
    },
    agents: createInitialAgentStates(),
    logs: [],
    outputs: {},
  }));

  const addLog = useCallback(
    (level: ExecutionLogEntry['level'], message: string, agentId?: AgentId) => {
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
    },
    []
  );

  // Subscribe to WebSocket events
  useEffect(() => {
    const unsubscribers = [
      subscribe<PipelineStartPayload>('pipeline:start', (data) => {
        setPipelineState((prev) => ({
          ...prev,
          executionId: data.executionId,
          status: 'running',
          startedAt: new Date(),
          config: data.config,
          agents: createInitialAgentStates(),
          logs: [],
          outputs: {},
        }));
        addLog('info', 'Pipeline iniciado');
      }),

      subscribe<AgentStartPayload>('agent:start', (data) => {
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

      subscribe<AgentProgressPayload>('agent:progress', (data) => {
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

      subscribe<AgentCompletePayload>('agent:complete', (data) => {
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
        addLog(
          'success',
          `${getAgentName(data.agentId)} concluido em ${formatDuration(data.duration)}`,
          data.agentId
        );
      }),

      subscribe<AgentErrorPayload>('agent:error', (data) => {
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
        addLog(
          'error',
          `Erro: ${data.error}${data.willRetry ? ' (tentando novamente)' : ''}`,
          data.agentId
        );
      }),

      subscribe<PipelineCompletePayload>('pipeline:complete', (data) => {
        setPipelineState((prev) => ({
          ...prev,
          status: data.status === 'completed' ? 'completed' : 'failed',
          finishedAt: new Date(),
        }));
        addLog(
          data.status === 'completed' ? 'success' : 'error',
          `Pipeline ${data.status === 'completed' ? 'concluido' : 'falhou'}. ${data.postsGenerated} posts, score medio ${data.averageScore.toFixed(1)}`
        );
      }),
    ];

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [subscribe, addLog]);

  const handleCancel = useCallback(async () => {
    if (!pipelineState.executionId) return;
    try {
      await cancelMutation.mutateAsync(pipelineState.executionId);
      setPipelineState((prev) => ({ ...prev, status: 'cancelled' }));
      addLog('warning', 'Pipeline cancelado pelo usuario');
    } catch (error) {
      addLog('error', 'Falha ao cancelar pipeline');
    }
  }, [pipelineState.executionId, cancelMutation, addLog]);

  const handleViewPosts = useCallback(() => {
    navigate(`/posts?execution=${pipelineState.executionId}`);
  }, [navigate, pipelineState.executionId]);

  // Auto-redirect after completion
  useEffect(() => {
    if (pipelineState.status === 'completed') {
      const timer = setTimeout(() => {
        navigate(`/posts?execution=${pipelineState.executionId}`);
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [pipelineState.status, pipelineState.executionId, navigate]);

  // Show connecting state
  if (!isConnected && pipelineState.status === 'idle') {
    return (
      <div className="space-y-6">
        <ExecutionSkeleton />
      </div>
    );
  }

  // Show idle state when no execution is running
  if (pipelineState.status === 'idle') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Execucao</h1>
          <p className="text-muted-foreground">
            Acompanhe a execucao do pipeline em tempo real
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline de Agentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="mb-4">Nenhuma execucao em andamento.</p>
              <button
                onClick={() => navigate('/pipeline')}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                Ir para Pipeline
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
