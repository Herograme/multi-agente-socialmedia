/**
 * Dashboard Component Tests
 * Story 5.3: Dashboard Principal com Metricas
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import {
  MetricCard,
  MetricsGrid,
  PostsChart,
  ScoreDistributionChart,
  RecentPosts,
  PostPreviewCard,
  DashboardSkeleton,
} from '../components/dashboard';
import type { DashboardMetrics, PostsByDayData, ScoreDistributionData, RecentPost } from '@social-content/shared';

// Mock Recharts components to avoid canvas errors in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Cell: () => <div data-testid="cell" />,
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
}

describe('MetricCard', () => {
  it('renders title and value', () => {
    render(
      <MetricCard
        title="Posts Hoje"
        value={42}
        icon={<span data-testid="icon">icon</span>}
      />
    );

    expect(screen.getByText('Posts Hoje')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders change indicator when provided', () => {
    render(
      <MetricCard
        title="Score"
        value="8.5"
        change={15}
        icon={<span>icon</span>}
      />
    );

    expect(screen.getByText(/\+15%/)).toBeInTheDocument();
  });

  it('renders negative change correctly', () => {
    render(
      <MetricCard
        title="Score"
        value="8.5"
        change={-10}
        icon={<span>icon</span>}
      />
    );

    expect(screen.getByText(/-10%/)).toBeInTheDocument();
  });

  it('renders loading skeleton when loading', () => {
    const { container } = render(
      <MetricCard
        title="Score"
        value="8.5"
        icon={<span>icon</span>}
        loading={true}
      />
    );

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(screen.queryByText('Score')).not.toBeInTheDocument();
  });
});

describe('MetricsGrid', () => {
  const mockMetrics: DashboardMetrics = {
    postsToday: 10,
    postsTodayChange: 20,
    averageScore: 7.5,
    averageScoreChange: 5,
    approvalRate: 80,
    approvalRateChange: -3,
    avgGenerationTime: 65000, // 1:05
    avgGenerationTimeChange: 10,
  };

  it('renders all four metric cards', () => {
    render(<MetricsGrid metrics={mockMetrics} />);

    expect(screen.getByText('Posts Hoje')).toBeInTheDocument();
    expect(screen.getByText('Score Medio')).toBeInTheDocument();
    expect(screen.getByText('Taxa de Aprovacao')).toBeInTheDocument();
    expect(screen.getByText('Tempo Medio')).toBeInTheDocument();
  });

  it('displays metrics values correctly', () => {
    render(<MetricsGrid metrics={mockMetrics} />);

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('7.5/10')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('1:05')).toBeInTheDocument();
  });

  it('renders loading state when loading', () => {
    const { container } = render(<MetricsGrid metrics={null} loading={true} />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(4);
  });

  it('renders dashes for null metrics', () => {
    render(<MetricsGrid metrics={null} />);

    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThan(0);
  });
});

describe('PostsChart', () => {
  const mockData: PostsByDayData[] = [
    { date: '2025-01-22', count: 5, instagram: 3, linkedin: 2 },
    { date: '2025-01-23', count: 8, instagram: 5, linkedin: 3 },
    { date: '2025-01-24', count: 3, instagram: 2, linkedin: 1 },
  ];

  it('renders chart with data', () => {
    render(<PostsChart data={mockData} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    render(<PostsChart data={[]} />);

    expect(screen.getByText(/Nenhum post gerado/)).toBeInTheDocument();
  });
});

describe('ScoreDistributionChart', () => {
  const mockData: ScoreDistributionData[] = [
    { range: '0-2', count: 2, percentage: 10 },
    { range: '2-4', count: 3, percentage: 15 },
    { range: '4-6', count: 5, percentage: 25 },
    { range: '6-8', count: 6, percentage: 30 },
    { range: '8-10', count: 4, percentage: 20 },
  ];

  it('renders chart with data', () => {
    render(<ScoreDistributionChart data={mockData} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    const emptyData: ScoreDistributionData[] = [
      { range: '0-2', count: 0, percentage: 0 },
      { range: '2-4', count: 0, percentage: 0 },
      { range: '4-6', count: 0, percentage: 0 },
      { range: '6-8', count: 0, percentage: 0 },
      { range: '8-10', count: 0, percentage: 0 },
    ];

    render(<ScoreDistributionChart data={emptyData} />);

    expect(screen.getByText(/Nenhum dado de score disponivel/)).toBeInTheDocument();
  });
});

describe('PostPreviewCard', () => {
  const mockPost: RecentPost = {
    id: 'post-1',
    topic: 'Test Post Topic',
    platform: 'instagram',
    score: 8.5,
    status: 'approved',
    thumbnailUrl: null,
    createdAt: new Date('2025-01-29T10:00:00Z'),
  };

  it('renders post information', () => {
    renderWithProviders(<PostPreviewCard post={mockPost} />);

    expect(screen.getByText('Test Post Topic')).toBeInTheDocument();
    expect(screen.getByText('8.5')).toBeInTheDocument();
    expect(screen.getByText('Aprovado')).toBeInTheDocument();
  });

  it('renders pending status correctly', () => {
    const pendingPost = { ...mockPost, status: 'pending' as const };
    renderWithProviders(<PostPreviewCard post={pendingPost} />);

    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });

  it('renders rejected status correctly', () => {
    const rejectedPost = { ...mockPost, status: 'rejected' as const };
    renderWithProviders(<PostPreviewCard post={rejectedPost} />);

    expect(screen.getByText('Rejeitado')).toBeInTheDocument();
  });

  it('renders needs_review status correctly', () => {
    const reviewPost = { ...mockPost, status: 'needs_review' as const };
    renderWithProviders(<PostPreviewCard post={reviewPost} />);

    expect(screen.getByText('Revisao')).toBeInTheDocument();
  });
});

describe('RecentPosts', () => {
  const mockPosts: RecentPost[] = [
    {
      id: 'post-1',
      topic: 'Post 1',
      platform: 'instagram',
      score: 8.5,
      status: 'approved',
      thumbnailUrl: null,
      createdAt: new Date('2025-01-29T10:00:00Z'),
    },
    {
      id: 'post-2',
      topic: 'Post 2',
      platform: 'linkedin',
      score: 7.0,
      status: 'pending',
      thumbnailUrl: null,
      createdAt: new Date('2025-01-29T09:00:00Z'),
    },
  ];

  it('renders list of posts', () => {
    renderWithProviders(<RecentPosts posts={mockPosts} />);

    expect(screen.getByText('Post 1')).toBeInTheDocument();
    expect(screen.getByText('Post 2')).toBeInTheDocument();
  });

  it('renders empty state when no posts', () => {
    renderWithProviders(<RecentPosts posts={[]} />);

    expect(screen.getByText('Nenhum post ainda')).toBeInTheDocument();
    expect(screen.getByText(/Execute o pipeline/)).toBeInTheDocument();
  });
});

describe('DashboardSkeleton', () => {
  it('renders loading skeleton structure', () => {
    const { container } = render(<DashboardSkeleton />);

    // Should have multiple skeleton elements (animate-pulse divs)
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders section skeletons', () => {
    const { container } = render(<DashboardSkeleton />);

    // Should have skeleton elements for the dashboard sections
    // Check for rounded skeleton elements which represent card content
    const skeletonElements = container.querySelectorAll('[class*="rounded"]');
    expect(skeletonElements.length).toBeGreaterThan(10);
  });
});
