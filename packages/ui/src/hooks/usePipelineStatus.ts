import { useEffect, useMemo, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { useWebSocketStore, type AgentState, type LogEntry } from '../stores/websocket.store';
import { AGENT_ORDER, AGENT_DISPLAY_NAMES } from '../lib/constants';
import {
  WSEventType,
  AgentStatus,
  type PipelineStartPayload,
  type PipelineCompletePayload,
  type AgentStartPayload,
  type AgentProgressPayload,
  type AgentCompletePayload,
  type AgentErrorPayload,
} from '@social-content/shared';

export type PipelineStatusType = 'idle' | 'running' | 'completed' | 'failed';

export interface PipelineState {
  executionId: string | null;
  isRunning: boolean;
  status: PipelineStatusType;
  agents: AgentState[];
  progress: number;
  logs: LogEntry[];
}

export interface UsePipelineStatusReturn extends PipelineState {
  isConnected: boolean;
  isFallbackMode: boolean;
  startPipeline: () => void;
  resetPipeline: () => void;
}

export function usePipelineStatus(): UsePipelineStatusReturn {
  const { subscribe, isConnected, isFallbackMode } = useWebSocket();
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

    // Pipeline start
    unsubscribers.push(
      subscribe<PipelineStartPayload>(WSEventType.PIPELINE_START, (payload) => {
        console.log('[Pipeline] Started:', payload.executionId);
        setCurrentExecution(payload.executionId);
        // Reset all agent statuses to idle
        AGENT_ORDER.forEach((agentId) => {
          updateAgentStatus(agentId, AgentStatus.IDLE);
        });
      })
    );

    // Agent start
    unsubscribers.push(
      subscribe<AgentStartPayload>(WSEventType.AGENT_START, (payload) => {
        console.log('[Pipeline] Agent started:', payload.agentId);
        updateAgentStatus(payload.agentId, AgentStatus.RUNNING);
      })
    );

    // Agent progress - just for logging, status updates handled by messages
    unsubscribers.push(
      subscribe<AgentProgressPayload>(WSEventType.AGENT_PROGRESS, (payload) => {
        console.log('[Pipeline] Agent progress:', payload.agentId, payload.progress);
      })
    );

    // Agent complete
    unsubscribers.push(
      subscribe<AgentCompletePayload>(WSEventType.AGENT_COMPLETE, (payload) => {
        console.log('[Pipeline] Agent complete:', payload.agentId, payload.duration);
        updateAgentStatus(payload.agentId, AgentStatus.SUCCESS);
      })
    );

    // Agent error
    unsubscribers.push(
      subscribe<AgentErrorPayload>(WSEventType.AGENT_ERROR, (payload) => {
        console.log('[Pipeline] Agent error:', payload.agentId, payload.error);
        updateAgentStatus(payload.agentId, AgentStatus.ERROR);
      })
    );

    // Pipeline complete
    unsubscribers.push(
      subscribe<PipelineCompletePayload>(WSEventType.PIPELINE_COMPLETE, (payload) => {
        console.log('[Pipeline] Complete:', payload.status, payload.postsGenerated);
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [subscribe, setCurrentExecution, updateAgentStatus]);

  // Compute agents state from messages and statuses
  const agents = useMemo((): AgentState[] => {
    return AGENT_ORDER.map((agentId) => {
      const status = agentStatuses[agentId] || AgentStatus.IDLE;

      // Find latest progress message for this agent
      const lastProgressMsg = messages
        .filter(
          (m) =>
            m.type === WSEventType.AGENT_PROGRESS &&
            (m.payload as AgentProgressPayload).agentId === agentId
        )
        .pop();

      // Find complete message for duration
      const lastCompleteMsg = messages
        .filter(
          (m) =>
            m.type === WSEventType.AGENT_COMPLETE &&
            (m.payload as AgentCompletePayload).agentId === agentId
        )
        .pop();

      // Find error message
      const lastErrorMsg = messages
        .filter(
          (m) =>
            m.type === WSEventType.AGENT_ERROR &&
            (m.payload as AgentErrorPayload).agentId === agentId
        )
        .pop();

      const progressPayload = lastProgressMsg?.payload as AgentProgressPayload | undefined;
      const completePayload = lastCompleteMsg?.payload as AgentCompletePayload | undefined;
      const errorPayload = lastErrorMsg?.payload as AgentErrorPayload | undefined;

      return {
        id: agentId,
        name: AGENT_DISPLAY_NAMES[agentId] || agentId,
        status,
        progress:
          status === AgentStatus.SUCCESS ? 100 : progressPayload?.progress || 0,
        message: progressPayload?.message,
        duration: completePayload?.duration,
        error: errorPayload?.error,
      };
    });
  }, [agentStatuses, messages]);

  // Compute logs from pipeline-related messages
  const logs = useMemo((): LogEntry[] => {
    return messages
      .filter((m) =>
        [
          WSEventType.PIPELINE_START,
          WSEventType.AGENT_START,
          WSEventType.AGENT_COMPLETE,
          WSEventType.AGENT_ERROR,
          WSEventType.PIPELINE_COMPLETE,
        ].includes(m.type as WSEventType)
      )
      .map((m) => {
        let message = '';
        let type: LogEntry['type'] = 'info';
        let agentId: string | undefined;
        let agentName: string | undefined;

        switch (m.type) {
          case WSEventType.PIPELINE_START: {
            const payload = m.payload as PipelineStartPayload;
            message = `Pipeline iniciado (${payload.executionId.slice(0, 8)})`;
            break;
          }
          case WSEventType.AGENT_START: {
            const payload = m.payload as AgentStartPayload;
            agentId = payload.agentId;
            agentName = payload.agentName || AGENT_DISPLAY_NAMES[payload.agentId];
            message = `${agentName} iniciado`;
            break;
          }
          case WSEventType.AGENT_COMPLETE: {
            const payload = m.payload as AgentCompletePayload;
            agentId = payload.agentId;
            agentName = AGENT_DISPLAY_NAMES[payload.agentId];
            const durationSec = Math.round(payload.duration / 1000);
            message = `${agentName} concluido em ${durationSec}s`;
            type = 'success';
            break;
          }
          case WSEventType.AGENT_ERROR: {
            const payload = m.payload as AgentErrorPayload;
            agentId = payload.agentId;
            agentName = AGENT_DISPLAY_NAMES[payload.agentId];
            message = `${agentName}: ${payload.error}`;
            type = 'error';
            break;
          }
          case WSEventType.PIPELINE_COMPLETE: {
            const payload = m.payload as PipelineCompletePayload;
            const statusText = payload.status === 'completed' ? 'concluido' : 'falhou';
            message = `Pipeline ${statusText} - ${payload.postsGenerated} posts gerados`;
            type = payload.status === 'completed' ? 'success' : 'error';
            break;
          }
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

  // Check if any agent is currently running
  const isRunning = useMemo(() => {
    return agents.some((a) => a.status === AgentStatus.RUNNING);
  }, [agents]);

  // Compute overall pipeline status
  const status = useMemo((): PipelineStatusType => {
    if (!currentExecutionId) return 'idle';
    if (isRunning) return 'running';

    // Check for pipeline complete message
    const lastPipelineComplete = messages
      .filter((m) => m.type === WSEventType.PIPELINE_COMPLETE)
      .pop();

    if (lastPipelineComplete) {
      const payload = lastPipelineComplete.payload as PipelineCompletePayload;
      return payload.status === 'completed' ? 'completed' : 'failed';
    }

    // Check if any agent has error
    const hasError = agents.some((a) => a.status === AgentStatus.ERROR);
    if (hasError) return 'failed';

    // Check if all agents completed
    const allCompleted = agents.every(
      (a) => a.status === AgentStatus.SUCCESS || a.status === AgentStatus.IDLE
    );
    if (allCompleted && agents.some((a) => a.status === AgentStatus.SUCCESS)) {
      return 'completed';
    }

    return 'idle';
  }, [currentExecutionId, isRunning, messages, agents]);

  // Calculate overall progress percentage
  const progress = useMemo(() => {
    const completedCount = agents.filter((a) => a.status === AgentStatus.SUCCESS).length;
    return Math.round((completedCount / agents.length) * 100);
  }, [agents]);

  // Start a new pipeline (resets current state)
  const startPipeline = useCallback(() => {
    resetPipelineState();
  }, [resetPipelineState]);

  // Reset pipeline state
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
    isConnected,
    isFallbackMode,
    startPipeline,
    resetPipeline,
  };
}
