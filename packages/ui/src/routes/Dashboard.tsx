/**
 * Dashboard Route
 * Story 5.3: Dashboard Principal com Metricas
 *
 * Main dashboard page with metrics, charts, and recent posts.
 */

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  MetricsGrid,
  PostsChart,
  ScoreDistributionChart,
  RecentPosts,
  ExecutionControls,
  DashboardSkeleton,
} from '../components/dashboard';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useAppStore } from '../stores/app.store';
import { LayoutDashboard, AlertCircle, WifiOff } from 'lucide-react';
import type { PipelineStatus } from '@social-content/shared';

/**
 * Main dashboard component showing system overview.
 *
 * Features:
 * - Metric cards (posts today, avg score, approval rate, avg time)
 * - Posts by day chart
 * - Score distribution chart
 * - Recent posts grid
 * - Execution controls with status indicator
 */
export function Dashboard() {
  const { data, isLoading, error } = useDashboardMetrics();
  const isConnected = useAppStore((state) => state.isConnected);
  const pipelineStatus: PipelineStatus = 'idle'; // TODO: Get from WebSocket/store

  // Show loading skeleton
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Show error state
  if (error) {
    return (
      <div className="container py-6">
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-4 pt-6">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <h3 className="font-semibold">Erro ao carregar dashboard</h3>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'Erro desconhecido'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <ExecutionControls status={pipelineStatus} />
      </div>

      {/* Connection Warning */}
      {!isConnected && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="flex items-center gap-3 py-3">
            <WifiOff className="h-4 w-4 text-yellow-500" />
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Conexao em tempo real indisponivel. Metricas podem estar desatualizadas.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Metrics Cards */}
      <MetricsGrid metrics={data?.metrics} />

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Posts Gerados (Ultimos 7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <PostsChart data={data?.chartData?.postsByDay || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuicao de Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreDistributionChart data={data?.chartData?.scoreDistribution || []} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Posts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Posts Recentes</CardTitle>
          <a href="/posts" className="text-sm text-primary hover:underline">
            Ver todos
          </a>
        </CardHeader>
        <CardContent>
          <RecentPosts posts={data?.recentPosts || []} />
        </CardContent>
      </Card>
    </div>
  );
}
