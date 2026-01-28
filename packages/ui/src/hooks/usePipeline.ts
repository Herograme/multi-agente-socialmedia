/**
 * Pipeline Hook
 * Manages pipeline state and API interactions
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type PipelineStatus,
  type StepStatus,
  type PipelineRunRequest,
} from '../lib/api';

export type { PipelineStatus, StepStatus };

export interface PipelineStep {
  name: string;
  status: StepStatus;
  duration?: number;
  error?: string;
}

export interface PipelineState {
  pipelineId: string | null;
  status: PipelineStatus | null;
  progress: {
    currentStep: number;
    totalSteps: number;
    percentComplete: number;
    currentStepName: string;
  };
  steps: PipelineStep[];
  finalOutput: unknown;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

const INITIAL_STATE: PipelineState = {
  pipelineId: null,
  status: null,
  progress: {
    currentStep: 0,
    totalSteps: 0,
    percentComplete: 0,
    currentStepName: '',
  },
  steps: [],
  finalOutput: null,
  error: null,
  startedAt: null,
  completedAt: null,
};

export interface UsePipelineOptions {
  pollInterval?: number;
  onComplete?: (output: unknown) => void;
  onError?: (error: string) => void;
}

export function usePipeline(options: UsePipelineOptions = {}) {
  const { pollInterval = 1000, onComplete, onError } = options;
  const queryClient = useQueryClient();
  const [state, setState] = useState<PipelineState>(INITIAL_STATE);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Query for pipeline status
  const statusQuery = useQuery({
    queryKey: ['pipeline-status', state.pipelineId],
    queryFn: () => api.getPipelineStatus(state.pipelineId!),
    enabled: !!state.pipelineId && state.status === 'running',
    refetchInterval: pollInterval,
    refetchIntervalInBackground: true,
  });

  // Mutation to start pipeline
  const startMutation = useMutation({
    mutationFn: api.startResearchCuratePipeline,
    onSuccess: (data) => {
      setState((prev) => ({
        ...prev,
        pipelineId: data.pipelineId,
        status: 'running',
        startedAt: data.timestamp,
        error: null,
      }));
    },
    onError: (error: Error) => {
      setState((prev) => ({
        ...prev,
        status: 'failed',
        error: error.message,
      }));
      onError?.(error.message);
    },
  });

  // Mutation to cancel pipeline
  const cancelMutation = useMutation({
    mutationFn: () => api.cancelPipeline(state.pipelineId!),
    onSuccess: () => {
      setState((prev) => ({
        ...prev,
        status: 'cancelled',
      }));
    },
  });

  // Mutation to retry pipeline
  const retryMutation = useMutation({
    mutationFn: () => api.retryPipeline(state.pipelineId!),
    onSuccess: (data) => {
      setState((prev) => ({
        ...prev,
        pipelineId: data.pipelineId,
        status: 'running',
        startedAt: data.timestamp,
        error: null,
        steps: [],
        finalOutput: null,
      }));
    },
  });

  // Update state from status query
  useEffect(() => {
    if (statusQuery.data) {
      const data = statusQuery.data;

      setState((prev) => ({
        ...prev,
        status: data.status,
        progress: data.progress,
        steps: data.steps,
        finalOutput: data.finalOutput,
        error: data.error ?? null,
        completedAt: data.completedAt ?? null,
      }));

      // Handle completion
      if (data.status === 'completed') {
        onComplete?.(data.finalOutput);
        queryClient.invalidateQueries({ queryKey: ['trends'] });
        queryClient.invalidateQueries({ queryKey: ['curador'] });
      }

      // Handle failure
      if (data.status === 'failed' && data.error) {
        onError?.(data.error);
      }
    }
  }, [statusQuery.data, onComplete, onError, queryClient]);

  // Start pipeline
  const startPipeline = useCallback(
    (input?: PipelineRunRequest) => {
      // Reset state
      setState(INITIAL_STATE);
      startMutation.mutate(input);
    },
    [startMutation]
  );

  // Cancel pipeline
  const cancelPipeline = useCallback(() => {
    if (state.pipelineId && state.status === 'running') {
      cancelMutation.mutate();
    }
  }, [state.pipelineId, state.status, cancelMutation]);

  // Retry pipeline
  const retryPipeline = useCallback(() => {
    if (state.pipelineId && state.status === 'failed') {
      retryMutation.mutate();
    }
  }, [state.pipelineId, state.status, retryMutation]);

  // Reset state
  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const currentPolling = pollingRef.current;
    return () => {
      if (currentPolling) {
        clearInterval(currentPolling);
      }
    };
  }, []);

  return {
    // State
    state,
    isRunning: state.status === 'running',
    isComplete: state.status === 'completed',
    isFailed: state.status === 'failed',
    isCancelled: state.status === 'cancelled',

    // Actions
    startPipeline,
    cancelPipeline,
    retryPipeline,
    reset,

    // Loading states
    isStarting: startMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isRetrying: retryMutation.isPending,
    isPolling: statusQuery.isFetching,
  };
}
