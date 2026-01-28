import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrendCard } from '../components/trends/TrendCard';
import { TrendSkeleton } from '../components/trends/TrendSkeleton';
import { EmptyTrends } from '../components/trends/EmptyTrends';
import { ErrorState } from '../components/trends/ErrorState';
import type { Trend } from '@social-content/shared';

// Mock the date utility
vi.mock('../lib/date', () => ({
  formatRelativeTime: () => '2 horas atrás',
  formatDateTime: () => '28/01/2025, 14:30',
}));

describe('Trends Components', () => {
  describe('TrendCard', () => {
    const mockTrend: Trend = {
      id: 'trend-1',
      title: 'React 19 New Features',
      description: 'A look at the new features in React 19',
      source: 'devto',
      url: 'https://dev.to/article/123',
      discoveredAt: new Date('2025-01-28T10:00:00Z'),
    };

    it('should render trend title', () => {
      render(<TrendCard trend={mockTrend} />);
      expect(screen.getByText('React 19 New Features')).toBeInTheDocument();
    });

    it('should render trend description', () => {
      render(<TrendCard trend={mockTrend} />);
      expect(screen.getByText('A look at the new features in React 19')).toBeInTheDocument();
    });

    it('should render source badge with correct label', () => {
      render(<TrendCard trend={mockTrend} />);
      expect(screen.getByText('DEV.to')).toBeInTheDocument();
    });

    it('should render relative time', () => {
      render(<TrendCard trend={mockTrend} />);
      expect(screen.getByText('2 horas atrás')).toBeInTheDocument();
    });

    it('should render external link button', () => {
      render(<TrendCard trend={mockTrend} />);
      const link = screen.getByRole('link', { name: /ver fonte/i });
      expect(link).toHaveAttribute('href', mockTrend.url);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should render hackernews source correctly', () => {
      const hnTrend: Trend = {
        ...mockTrend,
        source: 'hackernews',
      };
      render(<TrendCard trend={hnTrend} />);
      expect(screen.getByText('Hacker News')).toBeInTheDocument();
    });

    it('should render reddit source correctly', () => {
      const redditTrend: Trend = {
        ...mockTrend,
        source: 'reddit',
      };
      render(<TrendCard trend={redditTrend} />);
      expect(screen.getByText('Reddit')).toBeInTheDocument();
    });

    it('should handle missing description', () => {
      const trendWithoutDesc: Trend = {
        ...mockTrend,
        description: undefined,
      };
      render(<TrendCard trend={trendWithoutDesc} />);
      expect(screen.queryByText('A look at the new features in React 19')).not.toBeInTheDocument();
    });
  });

  describe('TrendSkeleton', () => {
    it('should render skeleton elements', () => {
      const { container } = render(<TrendSkeleton />);
      // Check for pulse animation class
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
      // Check for muted background elements (skeleton placeholders)
      expect(container.querySelectorAll('.bg-muted').length).toBeGreaterThan(0);
    });
  });

  describe('EmptyTrends', () => {
    it('should render empty state message', () => {
      const onResearch = vi.fn();
      render(<EmptyTrends onResearch={onResearch} />);

      expect(screen.getByText('Nenhuma tendencia encontrada')).toBeInTheDocument();
      expect(screen.getByText(/Execute uma pesquisa/)).toBeInTheDocument();
    });

    it('should call onResearch when button is clicked', () => {
      const onResearch = vi.fn();
      render(<EmptyTrends onResearch={onResearch} />);

      const button = screen.getByRole('button', { name: /pesquisar agora/i });
      fireEvent.click(button);

      expect(onResearch).toHaveBeenCalledTimes(1);
    });
  });

  describe('ErrorState', () => {
    it('should render error message', () => {
      const onRetry = vi.fn();
      render(<ErrorState message="Network error" onRetry={onRetry} />);

      expect(screen.getByText('Erro ao carregar tendencias')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('should call onRetry when button is clicked', () => {
      const onRetry = vi.fn();
      render(<ErrorState message="Network error" onRetry={onRetry} />);

      const button = screen.getByRole('button', { name: /tentar novamente/i });
      fireEvent.click(button);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });
});
