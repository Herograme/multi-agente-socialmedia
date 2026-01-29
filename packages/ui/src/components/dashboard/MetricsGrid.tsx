/**
 * MetricsGrid Component
 * Story 5.3: Dashboard Principal com Metricas
 *
 * Grid layout for the four dashboard metric cards.
 */

import { MetricCard } from './MetricCard';
import { FileText, Star, CheckCircle, Clock } from 'lucide-react';
import type { DashboardMetrics } from '@social-content/shared';

export interface MetricsGridProps {
  /** Dashboard metrics data */
  metrics: DashboardMetrics | null | undefined;
  /** Show loading skeletons */
  loading?: boolean;
}

/**
 * Formats milliseconds to "mm:ss" format.
 */
function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Gets the appropriate variant based on score value.
 */
function getScoreVariant(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 7) return 'success';
  if (score >= 5) return 'warning';
  return 'danger';
}

/**
 * Displays the four main dashboard metrics in a responsive grid.
 */
export function MetricsGrid({ metrics, loading = false }: MetricsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Posts Hoje"
        value={metrics?.postsToday ?? '-'}
        change={metrics?.postsTodayChange}
        icon={<FileText className="h-4 w-4" />}
        loading={loading}
      />
      <MetricCard
        title="Score Medio"
        value={metrics?.averageScore ? `${metrics.averageScore.toFixed(1)}/10` : '-'}
        change={metrics?.averageScoreChange}
        icon={<Star className="h-4 w-4" />}
        variant={metrics?.averageScore ? getScoreVariant(metrics.averageScore) : 'default'}
        loading={loading}
      />
      <MetricCard
        title="Taxa de Aprovacao"
        value={metrics?.approvalRate !== undefined ? `${metrics.approvalRate.toFixed(0)}%` : '-'}
        change={metrics?.approvalRateChange}
        icon={<CheckCircle className="h-4 w-4" />}
        variant={metrics?.approvalRate !== undefined && metrics.approvalRate >= 70 ? 'success' : 'warning'}
        loading={loading}
      />
      <MetricCard
        title="Tempo Medio"
        value={metrics?.avgGenerationTime ? formatTime(metrics.avgGenerationTime) : '-'}
        change={metrics?.avgGenerationTimeChange}
        changeLabel="vs media"
        icon={<Clock className="h-4 w-4" />}
        loading={loading}
      />
    </div>
  );
}
