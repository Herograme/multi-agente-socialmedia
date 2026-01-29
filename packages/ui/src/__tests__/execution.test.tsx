/**
 * Execution Components Tests - Story 5.4
 * Tests for real-time pipeline execution view components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { AgentNode } from '../components/execution/AgentNode';
import { AgentConnector } from '../components/execution/AgentConnector';
import { PipelineFlow } from '../components/execution/PipelineFlow';
import { LogViewer } from '../components/execution/LogViewer';
import { OutputPreview } from '../components/execution/OutputPreview';
import { ExecutionHeader } from '../components/execution/ExecutionHeader';
import { ExecutionSummary } from '../components/execution/ExecutionSummary';
import type {
  AgentNodeState,
  ExecutionLogEntry,
  PipelineOutputs,
  ExecutionViewConfig,
  AgentId,
} from '@social-content/shared';

// Test utilities
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>{children}</BrowserRouter>
  </QueryClientProvider>
);

// Mock data
const mockAgentConfig = {
  id: 'researcher' as const,
  name: 'Pesquisador',
  icon: Search,
  description: 'Busca tendencias em fontes tech',
};

const mockDefaultAgentState: AgentNodeState = {
  id: 'researcher',
  name: 'Pesquisador',
  status: 'waiting',
};

const mockDefaultConfig: ExecutionViewConfig = {
  numPosts: 3,
  platforms: ['instagram', 'linkedin'],
  includeVisual: true,
  qualityThreshold: 6.0,
};

// ============================================
// AgentNode Tests
// ============================================

describe('AgentNode', () => {
  it('should render agent with waiting status', () => {
    render(
      <AgentNode config={mockAgentConfig} state={mockDefaultAgentState} />,
      { wrapper }
    );

    expect(screen.getByText('Pesquisador')).toBeInTheDocument();
    expect(screen.getByText('Aguardando')).toBeInTheDocument();
  });

  it('should render agent with running status and pulse animation', () => {
    const runningState: AgentNodeState = {
      id: 'researcher',
      name: 'Pesquisador',
      status: 'running',
      startedAt: new Date(),
    };

    render(<AgentNode config={mockAgentConfig} state={runningState} />, { wrapper });

    expect(screen.getByText('Executando')).toBeInTheDocument();
    // Check for pulse animation class
    const node = screen.getByText('Pesquisador').closest('div[title]');
    expect(node).toHaveClass('agent-pulsing');
  });

  it('should render agent with done status and duration', () => {
    const doneState: AgentNodeState = {
      id: 'researcher',
      name: 'Pesquisador',
      status: 'done',
      duration: 65000, // 1m 5s
    };

    render(<AgentNode config={mockAgentConfig} state={doneState} />, { wrapper });

    expect(screen.getByText('Concluido')).toBeInTheDocument();
    expect(screen.getByText('1m 5s')).toBeInTheDocument();
  });

  it('should render agent with error status', () => {
    const errorState: AgentNodeState = {
      id: 'researcher',
      name: 'Pesquisador',
      status: 'error',
      error: 'Connection failed',
    };

    render(<AgentNode config={mockAgentConfig} state={errorState} />, { wrapper });

    expect(screen.getByText('Erro')).toBeInTheDocument();
  });

  it('should show progress bar when running with progress', () => {
    const progressState: AgentNodeState = {
      id: 'researcher',
      name: 'Pesquisador',
      status: 'running',
      startedAt: new Date(),
      progress: 50,
    };

    const { container } = render(
      <AgentNode config={mockAgentConfig} state={progressState} />,
      { wrapper }
    );

    const progressBar = container.querySelector('[style*="width: 50%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('should render compact mode correctly', () => {
    render(
      <AgentNode config={mockAgentConfig} state={mockDefaultAgentState} compact />,
      { wrapper }
    );

    expect(screen.getByText('Pesquisador')).toBeInTheDocument();
    expect(screen.getByText('Aguardando')).toBeInTheDocument();
  });
});

// ============================================
// AgentConnector Tests
// ============================================

describe('AgentConnector', () => {
  it('should render horizontal connector by default', () => {
    const { container } = render(<AgentConnector fromStatus="done" />, { wrapper });

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should render vertical connector when vertical prop is true', () => {
    const { container } = render(<AgentConnector fromStatus="done" vertical />, { wrapper });

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should have active style when fromStatus is done', () => {
    const { container } = render(<AgentConnector fromStatus="done" />, { wrapper });

    const icon = container.querySelector('svg');
    expect(icon).toHaveClass('text-primary');
  });

  it('should have inactive style when fromStatus is waiting', () => {
    const { container } = render(<AgentConnector fromStatus="waiting" />, { wrapper });

    const icon = container.querySelector('svg');
    expect(icon).toHaveClass('text-muted-foreground');
  });
});

// ============================================
// PipelineFlow Tests
// ============================================

describe('PipelineFlow', () => {
  const mockAgents: Record<AgentId, AgentNodeState> = {
    researcher: { id: 'researcher', name: 'Pesquisador', status: 'done' },
    'topic-generator': { id: 'topic-generator', name: 'Gerador', status: 'running', startedAt: new Date() },
    curator: { id: 'curator', name: 'Curador', status: 'waiting' },
    writer: { id: 'writer', name: 'Redator', status: 'waiting' },
    'image-designer': { id: 'image-designer', name: 'Designer', status: 'waiting' },
    'carousel-builder': { id: 'carousel-builder', name: 'Carousel', status: 'waiting' },
    'pdf-maker': { id: 'pdf-maker', name: 'PDF', status: 'waiting' },
    'qa-analyst': { id: 'qa-analyst', name: 'QA', status: 'waiting' },
  };

  it('should render all agents in flow', () => {
    render(<PipelineFlow agents={mockAgents} />, { wrapper });

    // Use getAllByText since agents appear in both desktop and mobile views
    expect(screen.getAllByText('Pesquisador').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Gerador de Topicos').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Curador').length).toBeGreaterThan(0);
  });

  it('should show connectors between agents', () => {
    const { container } = render(<PipelineFlow agents={mockAgents} />, { wrapper });

    // Check for connector elements (arrows)
    const connectors = container.querySelectorAll('svg');
    expect(connectors.length).toBeGreaterThan(0);
  });

  it('should handle missing agents gracefully', () => {
    const partialAgents: Record<AgentId, AgentNodeState> = {
      researcher: { id: 'researcher', name: 'Pesquisador', status: 'done' },
    } as Record<AgentId, AgentNodeState>;

    render(<PipelineFlow agents={partialAgents} />, { wrapper });

    // Use getAllByText since agents appear in both desktop and mobile views
    expect(screen.getAllByText('Pesquisador').length).toBeGreaterThan(0);
  });
});

// ============================================
// LogViewer Tests
// ============================================

describe('LogViewer', () => {
  const mockLogs: ExecutionLogEntry[] = [
    { id: '1', timestamp: new Date(), level: 'info', message: 'Pipeline iniciado' },
    { id: '2', timestamp: new Date(), level: 'success', agentId: 'researcher', message: 'Pesquisador concluido' },
    { id: '3', timestamp: new Date(), level: 'error', message: 'Erro de conexao' },
    { id: '4', timestamp: new Date(), level: 'warning', message: 'Aviso: taxa limitada' },
  ];

  it('should render logs with messages', () => {
    render(<LogViewer logs={mockLogs} />, { wrapper });

    expect(screen.getByText('Pipeline iniciado')).toBeInTheDocument();
    expect(screen.getByText('Pesquisador concluido')).toBeInTheDocument();
    expect(screen.getByText('Erro de conexao')).toBeInTheDocument();
  });

  it('should show empty state when no logs', () => {
    render(<LogViewer logs={[]} />, { wrapper });

    expect(screen.getByText('Aguardando eventos...')).toBeInTheDocument();
  });

  it('should have auto-scroll toggle button', () => {
    render(<LogViewer logs={mockLogs} />, { wrapper });

    const pauseButton = screen.getByTitle('Pausar auto-scroll');
    expect(pauseButton).toBeInTheDocument();
  });

  it('should toggle auto-scroll when button is clicked', () => {
    render(<LogViewer logs={mockLogs} />, { wrapper });

    const pauseButton = screen.getByTitle('Pausar auto-scroll');
    fireEvent.click(pauseButton);

    const playButton = screen.getByTitle('Retomar auto-scroll');
    expect(playButton).toBeInTheDocument();
  });

  it('should show agent ID in brackets for agent-specific logs', () => {
    render(<LogViewer logs={mockLogs} />, { wrapper });

    expect(screen.getByText('[researcher]')).toBeInTheDocument();
  });
});

// ============================================
// OutputPreview Tests
// ============================================

describe('OutputPreview', () => {
  const mockOutputsWithTrends: PipelineOutputs = {
    trends: [
      { id: '1', title: 'React 19 Features', source: 'devto', url: 'https://dev.to/1', discoveredAt: new Date() },
      { id: '2', title: 'AI in 2025', source: 'hackernews', url: 'https://hn.com/1', discoveredAt: new Date() },
    ],
  };

  const mockOutputsWithTopics: PipelineOutputs = {
    topics: [
      { id: '1', title: 'Topic 1', description: 'Description 1', engagementPotential: 8, basedOnTrends: ['1'] },
    ],
  };

  const mockOutputsEmpty: PipelineOutputs = {};

  it('should show empty state when no outputs', () => {
    render(<OutputPreview outputs={mockOutputsEmpty} />, { wrapper });

    expect(screen.getByText('Aguardando outputs...')).toBeInTheDocument();
  });

  it('should render trends tab when trends are available', () => {
    render(<OutputPreview outputs={mockOutputsWithTrends} />, { wrapper });

    expect(screen.getByText('React 19 Features')).toBeInTheDocument();
    expect(screen.getByText('AI in 2025')).toBeInTheDocument();
  });

  it('should render topics tab content', () => {
    render(<OutputPreview outputs={mockOutputsWithTopics} />, { wrapper });

    // Topics tab should be clickable
    const topicsTab = screen.getByRole('button', { name: /topics/i });
    fireEvent.click(topicsTab);

    expect(screen.getByText('Topic 1')).toBeInTheDocument();
    expect(screen.getByText('Potencial: 8/10')).toBeInTheDocument();
  });

  it('should disable tabs without data', () => {
    render(<OutputPreview outputs={mockOutputsWithTrends} />, { wrapper });

    const postsTab = screen.getByRole('button', { name: /posts/i });
    expect(postsTab).toBeDisabled();
  });
});

// ============================================
// ExecutionHeader Tests
// ============================================

describe('ExecutionHeader', () => {
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    mockOnCancel.mockClear();
  });

  it('should render title for running status', () => {
    render(
      <ExecutionHeader
        status="running"
        startedAt={new Date()}
        config={mockDefaultConfig}
        onCancel={mockOnCancel}
      />,
      { wrapper }
    );

    expect(screen.getByText('Pipeline em Execucao')).toBeInTheDocument();
    expect(screen.getByText('Executando')).toBeInTheDocument();
  });

  it('should render title for idle status', () => {
    render(
      <ExecutionHeader
        status="idle"
        config={mockDefaultConfig}
        onCancel={mockOnCancel}
      />,
      { wrapper }
    );

    expect(screen.getByText('Execucao do Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Aguardando')).toBeInTheDocument();
  });

  it('should show cancel button when running', () => {
    render(
      <ExecutionHeader
        status="running"
        startedAt={new Date()}
        config={mockDefaultConfig}
        onCancel={mockOnCancel}
      />,
      { wrapper }
    );

    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('should not show cancel button when not running', () => {
    render(
      <ExecutionHeader
        status="completed"
        config={mockDefaultConfig}
        onCancel={mockOnCancel}
      />,
      { wrapper }
    );

    expect(screen.queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument();
  });

  it('should show confirmation dialog when cancel is clicked', () => {
    render(
      <ExecutionHeader
        status="running"
        startedAt={new Date()}
        config={mockDefaultConfig}
        onCancel={mockOnCancel}
      />,
      { wrapper }
    );

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(screen.getByText('Cancelar Execucao?')).toBeInTheDocument();
  });

  it('should call onCancel when confirmed', async () => {
    render(
      <ExecutionHeader
        status="running"
        startedAt={new Date()}
        config={mockDefaultConfig}
        onCancel={mockOnCancel}
      />,
      { wrapper }
    );

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancelar pipeline/i }));

    await waitFor(() => {
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  it('should show config summary', () => {
    render(
      <ExecutionHeader
        status="running"
        startedAt={new Date()}
        config={mockDefaultConfig}
        onCancel={mockOnCancel}
      />,
      { wrapper }
    );

    expect(screen.getByText('3 posts')).toBeInTheDocument();
  });
});

// ============================================
// ExecutionSummary Tests
// ============================================

describe('ExecutionSummary', () => {
  const mockOnViewPosts = vi.fn();
  const mockOutputs: PipelineOutputs = {
    posts: [
      {
        id: '1',
        executionId: 'exec-1',
        topicId: 'topic-1',
        textInstagram: 'Test post',
        status: 'pending',
        createdAt: new Date(),
        assets: [],
        score: { id: 's1', postId: '1', overallScore: 8.5, criteriaBreakdown: [], feedback: '', approved: true, createdAt: new Date() },
      },
      {
        id: '2',
        executionId: 'exec-1',
        topicId: 'topic-2',
        textLinkedin: 'Test post 2',
        status: 'pending',
        createdAt: new Date(),
        assets: [],
        score: { id: 's2', postId: '2', overallScore: 7.5, criteriaBreakdown: [], feedback: '', approved: true, createdAt: new Date() },
      },
    ],
  };

  beforeEach(() => {
    mockOnViewPosts.mockClear();
  });

  it('should render success state for completed status', () => {
    render(
      <ExecutionSummary
        status="completed"
        startedAt={new Date(Date.now() - 120000)}
        finishedAt={new Date()}
        outputs={mockOutputs}
        onViewPosts={mockOnViewPosts}
      />,
      { wrapper }
    );

    expect(screen.getByText('Pipeline Concluido!')).toBeInTheDocument();
  });

  it('should render failure state for failed status', () => {
    render(
      <ExecutionSummary
        status="failed"
        startedAt={new Date(Date.now() - 60000)}
        finishedAt={new Date()}
        outputs={{}}
        onViewPosts={mockOnViewPosts}
      />,
      { wrapper }
    );

    expect(screen.getByText('Pipeline Falhou')).toBeInTheDocument();
  });

  it('should show posts count', () => {
    render(
      <ExecutionSummary
        status="completed"
        startedAt={new Date(Date.now() - 120000)}
        finishedAt={new Date()}
        outputs={mockOutputs}
        onViewPosts={mockOnViewPosts}
      />,
      { wrapper }
    );

    expect(screen.getByText('2 posts')).toBeInTheDocument();
  });

  it('should show average score', () => {
    render(
      <ExecutionSummary
        status="completed"
        startedAt={new Date(Date.now() - 120000)}
        finishedAt={new Date()}
        outputs={mockOutputs}
        onViewPosts={mockOnViewPosts}
      />,
      { wrapper }
    );

    expect(screen.getByText('8.0/10')).toBeInTheDocument();
  });

  it('should call onViewPosts when button is clicked', () => {
    render(
      <ExecutionSummary
        status="completed"
        startedAt={new Date(Date.now() - 120000)}
        finishedAt={new Date()}
        outputs={mockOutputs}
        onViewPosts={mockOnViewPosts}
      />,
      { wrapper }
    );

    fireEvent.click(screen.getByRole('button', { name: /ver posts gerados/i }));

    expect(mockOnViewPosts).toHaveBeenCalled();
  });

  it('should show redirect message', () => {
    render(
      <ExecutionSummary
        status="completed"
        startedAt={new Date(Date.now() - 120000)}
        finishedAt={new Date()}
        outputs={mockOutputs}
        onViewPosts={mockOnViewPosts}
      />,
      { wrapper }
    );

    expect(screen.getByText(/redirecionando para posts em 5 segundos/i)).toBeInTheDocument();
  });
});
