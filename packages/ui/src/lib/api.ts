import type { Trend } from '@social-content/shared';

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
};
