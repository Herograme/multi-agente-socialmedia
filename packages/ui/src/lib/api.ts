import type {
  Trend,
  CuratedContent,
  CuratedContentType,
  ExecutionWithDuration,
  ExecutionWithPosts,
  ExecutionStats,
  ExecutionFilters,
} from '@social-content/shared';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface HealthResponse {
  status: 'ok';
  timestamp: string;
  uptime: number;
  environment: string;
}

export interface ResearcherResultsResponse {
  trends: Trend[];
  metadata: {
    executionId?: string;
    sourcesQueried: string[];
    totalFound: number;
    timestamp: string;
    duration?: number;
  };
}

export interface ResearcherRunResponse {
  status: 'started';
  executionId: string;
  timestamp: string;
}

export interface ResearcherRunRequest {
  sources?: string[];
  limit?: number;
}

export interface CuratorResultsResponse {
  contents: CuratedContent[];
  metadata: {
    executionId?: string;
    totalProcessed: number;
    timestamp: string;
    duration?: number;
  };
}

export interface CuratorResultsRequest {
  type?: CuratedContentType;
}

// Pipeline types
export type PipelineStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface PipelineStepResponse {
  name: string;
  status: StepStatus;
  duration?: number;
  error?: string;
}

export interface PipelineStatusResponse {
  pipelineId: string;
  configName: string;
  status: PipelineStatus;
  progress: {
    currentStep: number;
    totalSteps: number;
    percentComplete: number;
    currentStepName: string;
  };
  startedAt: string;
  completedAt?: string;
  steps: PipelineStepResponse[];
  finalOutput?: unknown;
  error?: string;
}

export interface PipelineRunRequest {
  sources?: Array<'devto' | 'hackernews' | 'reddit'>;
  limit?: number;
}

export interface PipelineRunResponse {
  status: 'started';
  pipelineId: string;
  timestamp: string;
  message: string;
}

export interface PipelineStatsResponse {
  counts: Record<PipelineStatus, number>;
  isRunning: boolean;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, `Request failed: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Health check
  getHealth: () => request<HealthResponse>('/health'),

  // Researcher Agent
  getResearcherResults: () =>
    request<ResearcherResultsResponse>('/api/agents/researcher/results'),

  runResearcher: (options?: ResearcherRunRequest) =>
    request<ResearcherRunResponse>('/api/agents/researcher/run', {
      method: 'POST',
      body: JSON.stringify(options ?? {}),
    }),

  // Curator Agent
  getCuratorResults: (options?: CuratorResultsRequest) => {
    const params = new URLSearchParams();
    if (options?.type) {
      params.set('type', options.type);
    }
    const queryString = params.toString();
    const endpoint = `/api/agents/curator/results${queryString ? `?${queryString}` : ''}`;
    return request<CuratorResultsResponse>(endpoint);
  },

  // Pipeline
  startResearchCuratePipeline: (options?: PipelineRunRequest) =>
    request<PipelineRunResponse>('/api/pipeline/research-curate', {
      method: 'POST',
      body: JSON.stringify(options ?? {}),
    }),

  getPipelineStatus: (pipelineId: string) =>
    request<PipelineStatusResponse>(`/api/pipeline/${pipelineId}/status`),

  getAllPipelineStatuses: () =>
    request<PipelineStatusResponse[]>('/api/pipeline/status'),

  getPipelineStats: () =>
    request<PipelineStatsResponse>('/api/pipeline/stats'),

  cancelPipeline: (pipelineId: string) =>
    request<{ success: boolean; message: string }>(`/api/pipeline/${pipelineId}/cancel`, {
      method: 'POST',
    }),

  retryPipeline: (pipelineId: string) =>
    request<PipelineRunResponse>(`/api/pipeline/${pipelineId}/retry`, {
      method: 'POST',
    }),

  // Executions (History) - Story 4.8
  getExecutions: (filters: ExecutionFilters) => {
    const params = new URLSearchParams();
    params.set('period', filters.period);
    if (filters.status !== 'all') {
      params.set('status', filters.status);
    }
    if (filters.startDate) {
      params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params.set('endDate', filters.endDate);
    }
    return request<{ executions: ExecutionWithDuration[] }>(
      `/api/executions?${params.toString()}`
    ).then((res) => res.executions);
  },

  getExecution: (executionId: string) =>
    request<ExecutionWithPosts>(`/api/executions/${executionId}`),

  getExecutionStats: (filters: ExecutionFilters) => {
    const params = new URLSearchParams();
    params.set('period', filters.period);
    if (filters.startDate) {
      params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params.set('endDate', filters.endDate);
    }
    return request<ExecutionStats>(`/api/executions/stats?${params.toString()}`);
  },

  exportExecutions: (filters: ExecutionFilters) => {
    const params = new URLSearchParams();
    params.set('period', filters.period);
    if (filters.status !== 'all') {
      params.set('status', filters.status);
    }
    if (filters.startDate) {
      params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params.set('endDate', filters.endDate);
    }
    // For CSV export, we return the URL so it can be opened in a new tab or downloaded
    return `${API_BASE}/api/executions/export?${params.toString()}`;
  },
};
