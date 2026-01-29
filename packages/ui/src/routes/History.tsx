import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, History as HistoryIcon, Activity, FileText, Star, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  ExecutionList,
  HistoryFilters,
  HistorySkeleton,
  StatsSkeleton,
  ScoreChart,
  PostsChart,
} from '../components/history';
import { useExecutions, useExecutionStats } from '../hooks/useExecutions';
import { exportExecutionsToCSV } from '../lib/csvExport';
import type { ExecutionFilters } from '@social-content/shared';

/**
 * History page - displays execution history with charts and filters
 * Story 4.8: Historico de Execucoes na UI
 */
export function History() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [chartView, setChartView] = useState<'day' | 'week'>('day');

  // Parse filters from URL search params
  const filters: ExecutionFilters = {
    period: searchParams.get('period') || '7days',
    status: searchParams.get('status') || 'all',
    startDate: searchParams.get('startDate'),
    endDate: searchParams.get('endDate'),
  };

  // Fetch data
  const { data: executions, isLoading, error } = useExecutions(filters);
  const { data: stats, isLoading: statsLoading } = useExecutionStats(filters);

  // Handle filter changes - update URL params
  const handleFilterChange = (newFilters: ExecutionFilters) => {
    const params = new URLSearchParams();
    params.set('period', newFilters.period);
    params.set('status', newFilters.status);
    if (newFilters.startDate) {
      params.set('startDate', newFilters.startDate);
    }
    if (newFilters.endDate) {
      params.set('endDate', newFilters.endDate);
    }
    setSearchParams(params);
  };

  // Handle CSV export
  const handleExport = () => {
    if (executions && executions.length > 0) {
      exportExecutionsToCSV(executions);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-destructive text-lg font-medium">
            Erro ao carregar historico
          </p>
          <p className="text-muted-foreground mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HistoryIcon className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Historico de Execucoes</h1>
            <p className="text-muted-foreground">
              Analise tendencias e performance do pipeline
            </p>
          </div>
        </div>
        <Button
          onClick={handleExport}
          disabled={!executions?.length}
          variant="outline"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <HistoryFilters filters={filters} onChange={handleFilterChange} />

      {/* Stats summary */}
      {statsLoading ? (
        <StatsSkeleton />
      ) : stats ? (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            icon={Activity}
            label="Total Execucoes"
            value={stats.totalExecutions.toString()}
          />
          <StatCard
            icon={FileText}
            label="Total Posts"
            value={stats.totalPosts.toString()}
          />
          <StatCard
            icon={Star}
            label="Score Medio"
            value={stats.averageScore ? stats.averageScore.toFixed(1) : 'N/A'}
          />
          <StatCard
            icon={TrendingUp}
            label="Taxa de Sucesso"
            value={`${(stats.successRate * 100).toFixed(0)}%`}
          />
        </div>
      ) : null}

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Score over time chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Score Medio ao Longo do Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <HistorySkeleton variant="chart" />
            ) : (
              <ScoreChart data={stats?.scoreOverTime || []} />
            )}
          </CardContent>
        </Card>

        {/* Posts chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">Posts Gerados</CardTitle>
            <div className="flex gap-1">
              <Button
                variant={chartView === 'day' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setChartView('day')}
              >
                Diario
              </Button>
              <Button
                variant={chartView === 'week' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setChartView('week')}
              >
                Semanal
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <HistorySkeleton variant="chart" />
            ) : (
              <PostsChart data={stats?.postsByPeriod || []} groupBy={chartView} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Execution list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Execucoes
            {executions && executions.length > 0 && (
              <span className="ml-2 text-muted-foreground font-normal">
                ({executions.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <HistorySkeleton variant="list" count={5} />
          ) : (
            <ExecutionList executions={executions || []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
