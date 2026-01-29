import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { StatusBadge, StatusBadgeWithPartial } from '../components/history/StatusBadge';
import { ExecutionList } from '../components/history/ExecutionList';
import { HistorySkeleton, StatsSkeleton } from '../components/history/HistorySkeleton';
import { HistoryFilters } from '../components/history/HistoryFilters';
import { ScoreChart } from '../components/history/ScoreChart';
import { PostsChart } from '../components/history/PostsChart';
import { escapeCSV, generateExecutionsCSVContent } from '../lib/csvExport';
import { ExecutionStatus, Platform } from '@social-content/shared';
import type { ExecutionWithDuration, ExecutionFilters } from '@social-content/shared';

// Mock the useExecution hook for ExecutionDetail
vi.mock('../hooks/useExecutions', () => ({
  useExecution: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
  useExecutions: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
  useExecutionStats: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
}));

// Create wrapper with providers
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>{children}</BrowserRouter>
  </QueryClientProvider>
);

describe('History Components', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  describe('StatusBadge', () => {
    it('should render completed status with success styling', () => {
      render(<StatusBadge status={ExecutionStatus.COMPLETED} />);
      expect(screen.getByText('Sucesso')).toBeInTheDocument();
    });

    it('should render pending status', () => {
      render(<StatusBadge status={ExecutionStatus.PENDING} />);
      expect(screen.getByText('Pendente')).toBeInTheDocument();
    });

    it('should render running status with spinning animation', () => {
      render(<StatusBadge status={ExecutionStatus.RUNNING} />);
      expect(screen.getByText('Executando')).toBeInTheDocument();
    });

    it('should render failed status with destructive styling', () => {
      render(<StatusBadge status={ExecutionStatus.FAILED} />);
      expect(screen.getByText('Falha')).toBeInTheDocument();
    });

    it('should render cancelled status', () => {
      render(<StatusBadge status={ExecutionStatus.CANCELLED} />);
      expect(screen.getByText('Cancelado')).toBeInTheDocument();
    });
  });

  describe('StatusBadgeWithPartial', () => {
    it('should show Parcial when isPartial is true and status is completed', () => {
      render(
        <StatusBadgeWithPartial status={ExecutionStatus.COMPLETED} isPartial={true} />
      );
      expect(screen.getByText('Parcial')).toBeInTheDocument();
    });

    it('should show Sucesso when isPartial is false and status is completed', () => {
      render(
        <StatusBadgeWithPartial status={ExecutionStatus.COMPLETED} isPartial={false} />
      );
      expect(screen.getByText('Sucesso')).toBeInTheDocument();
    });

    it('should show normal status for non-completed statuses regardless of isPartial', () => {
      render(
        <StatusBadgeWithPartial status={ExecutionStatus.FAILED} isPartial={true} />
      );
      expect(screen.getByText('Falha')).toBeInTheDocument();
    });
  });

  describe('ExecutionList', () => {
    const mockExecutions: ExecutionWithDuration[] = [
      {
        id: 'exec-001',
        startedAt: new Date('2026-01-28T10:00:00Z'),
        finishedAt: new Date('2026-01-28T10:05:00Z'),
        duration: 300000,
        status: ExecutionStatus.COMPLETED,
        postsGenerated: 5,
        postsApproved: 4,
        averageScore: 8.5,
        config: {
          numPosts: 5,
          platforms: [Platform.INSTAGRAM],
          includeVisual: true,
          qualityThreshold: 7,
          sources: ['devto'],
        },
      },
      {
        id: 'exec-002',
        startedAt: new Date('2026-01-27T14:00:00Z'),
        finishedAt: new Date('2026-01-27T14:03:00Z'),
        duration: 180000,
        status: ExecutionStatus.FAILED,
        postsGenerated: 0,
        postsApproved: 0,
        averageScore: undefined,
        config: {
          numPosts: 5,
          platforms: [Platform.LINKEDIN],
          includeVisual: false,
          qualityThreshold: 7,
          sources: ['hackernews'],
        },
      },
    ];

    it('should render list of executions', () => {
      render(<ExecutionList executions={mockExecutions} />, { wrapper });

      expect(screen.getByText('5 posts')).toBeInTheDocument();
      expect(screen.getByText('8.5/10')).toBeInTheDocument();
    });

    it('should show empty state when no executions', () => {
      render(<ExecutionList executions={[]} />, { wrapper });

      expect(screen.getByText('Nenhuma execucao encontrada')).toBeInTheDocument();
      expect(screen.getByText(/Execute o pipeline/)).toBeInTheDocument();
    });

    it('should toggle expand when clicking on execution', () => {
      render(<ExecutionList executions={mockExecutions} />, { wrapper });

      const buttons = screen.getAllByRole('button');
      const firstButton = buttons[0];
      if (firstButton) {
        fireEvent.click(firstButton);
      }

      // Should show expanded view (ExecutionDetail is loaded)
    });

    it('should show partial badge for executions with some rejected posts', () => {
      render(<ExecutionList executions={mockExecutions} />, { wrapper });

      // First execution has 5 generated, 4 approved = partial
      expect(screen.getByText('Parcial')).toBeInTheDocument();
    });

    it('should format duration correctly', () => {
      render(<ExecutionList executions={mockExecutions} />, { wrapper });

      // 300000ms = 5 minutes
      expect(screen.getByText('5m 0s')).toBeInTheDocument();
      // 180000ms = 3 minutes
      expect(screen.getByText('3m 0s')).toBeInTheDocument();
    });
  });

  describe('HistorySkeleton', () => {
    it('should render list skeleton with default count', () => {
      const { container } = render(<HistorySkeleton variant="list" />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should render chart skeleton', () => {
      const { container } = render(<HistorySkeleton variant="chart" />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should render specified number of skeleton items', () => {
      const { container } = render(<HistorySkeleton variant="list" count={5} />);
      const skeletonItems = container.querySelectorAll('.border.rounded-lg');
      expect(skeletonItems.length).toBe(5);
    });
  });

  describe('StatsSkeleton', () => {
    it('should render 4 stat card skeletons', () => {
      const { container } = render(<StatsSkeleton />);
      const cards = container.querySelectorAll('.animate-pulse');
      expect(cards.length).toBe(4);
    });
  });

  describe('HistoryFilters', () => {
    const defaultFilters: ExecutionFilters = {
      period: '7days',
      status: 'all',
      startDate: null,
      endDate: null,
    };

    it('should render period and status filters', () => {
      const onChange = vi.fn();
      render(<HistoryFilters filters={defaultFilters} onChange={onChange} />);

      expect(screen.getByText('Ultimos 7 dias')).toBeInTheDocument();
      expect(screen.getByText('Todos')).toBeInTheDocument();
    });

    it('should call onChange when period changes', async () => {
      const onChange = vi.fn();
      render(<HistoryFilters filters={defaultFilters} onChange={onChange} />);

      // Click period dropdown
      const periodButton = screen.getByText('Ultimos 7 dias');
      fireEvent.click(periodButton);

      // Click 30 days option
      const option30 = screen.getByText('Ultimos 30 dias');
      fireEvent.click(option30);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          period: '30days',
        })
      );
    });

    it('should call onChange when status changes', async () => {
      const onChange = vi.fn();
      render(<HistoryFilters filters={defaultFilters} onChange={onChange} />);

      // Click status dropdown
      const statusButton = screen.getByText('Todos');
      fireEvent.click(statusButton);

      // Click success option
      const successOption = screen.getByText('Sucesso');
      fireEvent.click(successOption);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
        })
      );
    });

    it('should show date pickers when custom period is selected', () => {
      const customFilters: ExecutionFilters = {
        ...defaultFilters,
        period: 'custom',
      };
      const onChange = vi.fn();
      const { container } = render(<HistoryFilters filters={customFilters} onChange={onChange} />);

      // Should show date inputs
      const dateInputs = container.querySelectorAll('input[type="date"]');
      expect(dateInputs.length).toBeGreaterThan(0);
    });
  });

  describe('ScoreChart', () => {
    it('should render chart with data', () => {
      const data = [
        { date: '2026-01-25', averageScore: 7.5, count: 3 },
        { date: '2026-01-26', averageScore: 8.0, count: 2 },
        { date: '2026-01-27', averageScore: 8.5, count: 4 },
      ];

      const { container } = render(<ScoreChart data={data} />);

      // Should render SVG elements
      expect(container.querySelector('svg')).toBeInTheDocument();
      expect(container.querySelectorAll('circle').length).toBe(3);
    });

    it('should show empty message when no data', () => {
      render(<ScoreChart data={[]} />);
      expect(screen.getByText('Sem dados para exibir')).toBeInTheDocument();
    });
  });

  describe('PostsChart', () => {
    const data = [
      { date: '2026-01-25', count: 5 },
      { date: '2026-01-26', count: 3 },
      { date: '2026-01-27', count: 8 },
    ];

    it('should render daily chart', () => {
      const { container } = render(<PostsChart data={data} groupBy="day" />);

      // Should render bar elements
      const bars = container.querySelectorAll('.bg-primary');
      expect(bars.length).toBe(3);
    });

    it('should render weekly chart with grouped data', () => {
      const { container } = render(<PostsChart data={data} groupBy="week" />);

      // Weekly grouping should combine data
      const bars = container.querySelectorAll('.bg-primary');
      expect(bars.length).toBeGreaterThan(0);
    });

    it('should show empty message when no data', () => {
      render(<PostsChart data={[]} groupBy="day" />);
      expect(screen.getByText('Sem dados para exibir')).toBeInTheDocument();
    });
  });
});

describe('CSV Export Utility', () => {
  describe('escapeCSV', () => {
    it('should not escape simple values', () => {
      expect(escapeCSV('hello')).toBe('hello');
      expect(escapeCSV('123')).toBe('123');
    });

    it('should escape values with commas', () => {
      expect(escapeCSV('hello, world')).toBe('"hello, world"');
    });

    it('should escape values with quotes', () => {
      expect(escapeCSV('say "hello"')).toBe('"say ""hello"""');
    });

    it('should escape values with newlines', () => {
      expect(escapeCSV('line1\nline2')).toBe('"line1\nline2"');
    });
  });

  describe('generateExecutionsCSVContent', () => {
    it('should generate valid CSV with headers', () => {
      const mockExecutions: ExecutionWithDuration[] = [
        {
          id: 'exec-001',
          startedAt: new Date('2026-01-28T10:00:00Z'),
          finishedAt: new Date('2026-01-28T10:05:00Z'),
          duration: 300000,
          status: ExecutionStatus.COMPLETED,
          postsGenerated: 5,
          postsApproved: 4,
          averageScore: 8.5,
          config: {
            numPosts: 5,
            platforms: [Platform.INSTAGRAM],
            includeVisual: true,
            qualityThreshold: 7,
            sources: ['devto'],
          },
        },
      ];

      const csv = generateExecutionsCSVContent(mockExecutions);

      // Check headers
      expect(csv).toContain('ID,Data Inicio,Data Fim,Duracao (s),Status,Posts Gerados,Posts Aprovados,Score Medio');

      // Check data row
      expect(csv).toContain('exec-001');
      expect(csv).toContain('300'); // duration in seconds
      expect(csv).toContain('Sucesso');
      expect(csv).toContain('5'); // posts generated
      expect(csv).toContain('4'); // posts approved
      expect(csv).toContain('8.50'); // average score
    });

    it('should handle empty finishedAt', () => {
      const mockExecutions: ExecutionWithDuration[] = [
        {
          id: 'exec-002',
          startedAt: new Date('2026-01-28T10:00:00Z'),
          finishedAt: undefined,
          duration: 0,
          status: ExecutionStatus.RUNNING,
          postsGenerated: 0,
          postsApproved: 0,
          averageScore: undefined,
          config: {
            numPosts: 5,
            platforms: [Platform.INSTAGRAM],
            includeVisual: true,
            qualityThreshold: 7,
            sources: ['devto'],
          },
        },
      ];

      const csv = generateExecutionsCSVContent(mockExecutions);

      // Should have empty finishedAt and score
      expect(csv).toContain('exec-002');
      expect(csv).toContain('Executando');
    });

    it('should translate all statuses correctly', () => {
      const statuses = [
        { status: ExecutionStatus.COMPLETED, expected: 'Sucesso' },
        { status: ExecutionStatus.PENDING, expected: 'Pendente' },
        { status: ExecutionStatus.RUNNING, expected: 'Executando' },
        { status: ExecutionStatus.FAILED, expected: 'Falha' },
        { status: ExecutionStatus.CANCELLED, expected: 'Cancelado' },
      ];

      statuses.forEach(({ status, expected }) => {
        const mockExecution: ExecutionWithDuration = {
          id: `exec-${status}`,
          startedAt: new Date(),
          finishedAt: new Date(),
          duration: 1000,
          status,
          postsGenerated: 0,
          postsApproved: 0,
          averageScore: undefined,
          config: {
            numPosts: 5,
            platforms: [Platform.INSTAGRAM],
            includeVisual: true,
            qualityThreshold: 7,
            sources: ['devto'],
          },
        };

        const csv = generateExecutionsCSVContent([mockExecution]);
        expect(csv).toContain(expected);
      });
    });
  });
});
