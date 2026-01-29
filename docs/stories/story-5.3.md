# Story 5.3: Dashboard Principal com Metricas

> Epic 5: Dashboard UI

---

## Story

**Como** usuario,
**Quero** um dashboard com visao geral do sistema,
**Para que** eu tenha metricas importantes em um so lugar.

---

## Status

`Ready for Review`

---

## Acceptance Criteria

| # | Criterio | Validacao |
|---|----------|-----------|
| AC1 | Pagina `/` (home) como dashboard principal | Rota raiz renderiza componente Dashboard |
| AC2 | Cards de metricas: posts hoje, score medio, tempo medio, aprovacao % | Quatro cards exibidos com valores corretos |
| AC3 | Metricas atualizadas em tempo real | WebSocket atualiza valores sem refresh manual |
| AC4 | Grafico de posts gerados ultimos 7 dias | Chart de barras/linha exibindo dados por dia |
| AC5 | Grafico de distribuicao de scores | Chart exibindo distribuicao (0-10) dos scores |
| AC6 | Lista de posts recentes (ultimos 5) com quick preview | Cards de posts com thumbnail, titulo, score |
| AC7 | Botao "Nova Execucao" em destaque | Botao primario visivel que inicia pipeline |
| AC8 | Indicador de status do pipeline (idle/running) | Badge/indicador mostrando estado atual |
| AC9 | Responsivo para desktop e tablet | Layout adapta para diferentes breakpoints |

---

## Tasks

- [x] **Task 1:** Implementar API de metricas agregadas
  - [x] Criar endpoint `GET /api/dashboard/metrics` no backend
  - [x] Retornar: postsToday, averageScore, approvalRate, avgGenerationTime
  - [x] Implementar query SQL para agregacoes diarias
  - [x] Adicionar cache de 30 segundos para performance
  - [x] Criar testes unitarios para o endpoint

- [x] **Task 2:** Implementar API de dados para graficos
  - [x] Criar endpoint `GET /api/dashboard/charts` com dados de 7 dias
  - [x] Retornar: postsByDay (array), scoreDistribution (array)
  - [x] Formatar dados no padrao esperado pelos charts
  - [x] Criar testes para validar formato de resposta

- [x] **Task 3:** Criar componente Dashboard principal
  - [x] Criar `packages/ui/src/routes/Dashboard.tsx`
  - [x] Configurar rota `/` para renderizar Dashboard
  - [x] Implementar layout responsivo com grid CSS
  - [x] Integrar com WebSocket para updates em tempo real
  - [x] Adicionar loading states durante fetch inicial

- [x] **Task 4:** Criar componentes MetricCard
  - [x] Criar `packages/ui/src/components/dashboard/MetricCard.tsx`
  - [x] Implementar variantes: default, success, warning, danger
  - [x] Exibir icone, valor, label, e variacao (opcional)
  - [x] Criar MetricsGrid para layout dos 4 cards
  - [x] Implementar skeleton loading para cards
  - [x] Criar testes para MetricCard

- [x] **Task 5:** Implementar graficos do dashboard
  - [x] Criar `packages/ui/src/components/dashboard/PostsChart.tsx`
  - [x] Criar `packages/ui/src/components/dashboard/ScoreDistributionChart.tsx`
  - [x] Usar recharts para visualizacoes
  - [x] Adicionar tooltips com detalhes ao hover
  - [x] Implementar empty state quando sem dados
  - [x] Criar testes para os componentes de grafico

- [x] **Task 6:** Implementar lista de posts recentes
  - [x] Criar `packages/ui/src/components/dashboard/RecentPosts.tsx`
  - [x] Criar `packages/ui/src/components/dashboard/PostPreviewCard.tsx`
  - [x] Exibir: thumbnail, titulo, plataforma, score, status
  - [x] Limitar a 5 posts mais recentes
  - [x] Link para pagina de detalhe do post
  - [x] Implementar empty state

- [x] **Task 7:** Implementar controles de execucao
  - [x] Criar `packages/ui/src/components/dashboard/ExecutionControls.tsx`
  - [x] Botao "Nova Execucao" com estado de loading
  - [x] Modal de configuracao (opcional) antes de iniciar
  - [x] Indicador de status: idle, running com animacao
  - [x] Integracao com WebSocket para status updates
  - [x] Botao de cancelar quando pipeline em execucao

- [x] **Task 8:** Implementar atualizacao em tempo real
  - [x] Criar `packages/ui/src/hooks/useDashboardMetrics.ts`
  - [x] Integrar com hook useWebSocket existente
  - [x] Atualizar metricas quando receber eventos de pipeline
  - [x] Implementar debounce para evitar re-renders excessivos
  - [x] Criar testes para o hook

- [x] **Task 9:** Implementar responsividade
  - [x] Definir breakpoints: mobile (<640px), tablet (640-1024px), desktop (>1024px)
  - [x] Grid de metricas: 1 col mobile, 2 col tablet, 4 col desktop
  - [x] Charts em stack no mobile, side-by-side no desktop
  - [x] Posts recentes em lista vertical no mobile
  - [x] Testar em diferentes tamanhos de tela

- [x] **Task 10:** Criar testes e documentacao
  - [x] Testes unitarios para todos os componentes
  - [x] Testes de integracao para Dashboard completo
  - [x] Testes de responsividade
  - [x] Documentar props e uso dos componentes

---

## Dev Notes

### Estrutura de Componentes

```
packages/ui/src/
├── routes/
│   ├── Dashboard.tsx
│   └── ...
├── components/
│   ├── dashboard/
│   │   ├── index.ts
│   │   ├── MetricCard.tsx
│   │   ├── MetricsGrid.tsx
│   │   ├── PostsChart.tsx
│   │   ├── ScoreDistributionChart.tsx
│   │   ├── RecentPosts.tsx
│   │   ├── PostPreviewCard.tsx
│   │   ├── ExecutionControls.tsx
│   │   ├── PipelineStatusBadge.tsx
│   │   ├── DashboardSkeleton.tsx
│   │   └── ...
│   └── ...
├── hooks/
│   ├── useDashboardMetrics.ts
│   └── ...
```

### Interfaces TypeScript

```typescript
// packages/shared/src/types/metrics.ts

export interface DashboardMetrics {
  postsToday: number;
  postsTodayChange: number; // percentual vs dia anterior
  averageScore: number;
  averageScoreChange: number;
  approvalRate: number; // 0-100
  approvalRateChange: number;
  avgGenerationTime: number; // milliseconds
  avgGenerationTimeChange: number;
}

export interface ChartData {
  postsByDay: Array<{
    date: string;
    count: number;
    instagram: number;
    linkedin: number;
  }>;
  scoreDistribution: Array<{
    range: string; // "0-2", "2-4", "4-6", "6-8", "8-10"
    count: number;
    percentage: number;
  }>;
}

export interface RecentPost {
  id: string;
  topic: string;
  platform: 'instagram' | 'linkedin';
  score: number | null;
  status: 'pending' | 'approved' | 'rejected';
  thumbnailUrl: string | null;
  createdAt: Date;
}

export type PipelineStatus = 'idle' | 'running' | 'error';

export interface DashboardState {
  metrics: DashboardMetrics | null;
  chartData: ChartData | null;
  recentPosts: RecentPost[];
  pipelineStatus: PipelineStatus;
  currentExecutionId: string | null;
  isLoading: boolean;
  error: string | null;
}
```

### Dashboard Page Component

```tsx
// packages/ui/src/routes/Dashboard.tsx

import { useEffect } from 'react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAppStore } from '@/stores/app.store';
import {
  MetricsGrid,
  PostsChart,
  ScoreDistributionChart,
  RecentPosts,
  ExecutionControls,
  DashboardSkeleton,
} from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LayoutDashboard, AlertCircle } from 'lucide-react';

export function Dashboard() {
  const { data, isLoading, error, refetch } = useDashboardMetrics();
  const { isConnected, subscribe } = useWebSocket();
  const pipelineStatus = useAppStore((state) => state.pipeline.isRunning ? 'running' : 'idle');

  // Subscribe to pipeline events for real-time updates
  useEffect(() => {
    const unsubscribe = subscribe('pipeline:complete', () => {
      refetch();
    });
    return unsubscribe;
  }, [subscribe, refetch]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="container py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar dashboard: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <ExecutionControls status={pipelineStatus} />
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <Alert variant="warning">
          <AlertDescription>
            Conexao em tempo real indisponivel. Metricas podem estar desatualizadas.
          </AlertDescription>
        </Alert>
      )}

      {/* Metrics Cards */}
      <MetricsGrid metrics={data?.metrics} />

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Posts Gerados (Ultimos 7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <PostsChart data={data?.chartData?.postsByDay || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuicao de Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreDistributionChart data={data?.chartData?.scoreDistribution || []} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Posts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Posts Recentes</CardTitle>
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
```

### MetricCard Component

```tsx
// packages/ui/src/components/dashboard/MetricCard.tsx

import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  loading?: boolean;
}

const variantStyles = {
  default: 'text-foreground',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  danger: 'text-red-500',
};

export function MetricCard({
  title,
  value,
  change,
  changeLabel = 'vs ontem',
  icon,
  variant = 'default',
  loading = false,
}: MetricCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = () => {
    if (change === undefined || change === 0) {
      return <Minus className="h-3 w-3" />;
    }
    return change > 0 ? (
      <TrendingUp className="h-3 w-3 text-green-500" />
    ) : (
      <TrendingDown className="h-3 w-3 text-red-500" />
    );
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return 'text-muted-foreground';
    return change > 0 ? 'text-green-500' : 'text-red-500';
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={cn('p-2 rounded-full bg-muted', variantStyles[variant])}>
            {icon}
          </div>
        </div>
        <div className="mt-2">
          <p className={cn('text-2xl font-bold', variantStyles[variant])}>
            {value}
          </p>
          {change !== undefined && (
            <div className={cn('flex items-center gap-1 mt-1 text-xs', getTrendColor())}>
              {getTrendIcon()}
              <span>
                {change > 0 ? '+' : ''}{change}% {changeLabel}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### MetricsGrid Component

```tsx
// packages/ui/src/components/dashboard/MetricsGrid.tsx

import { MetricCard } from './MetricCard';
import { FileText, Star, CheckCircle, Clock } from 'lucide-react';
import type { DashboardMetrics } from '@social-content/shared';

interface MetricsGridProps {
  metrics: DashboardMetrics | null | undefined;
  loading?: boolean;
}

export function MetricsGrid({ metrics, loading = false }: MetricsGridProps) {
  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getScoreVariant = (score: number): 'success' | 'warning' | 'danger' => {
    if (score >= 7) return 'success';
    if (score >= 5) return 'warning';
    return 'danger';
  };

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
        value={metrics?.approvalRate ? `${metrics.approvalRate.toFixed(0)}%` : '-'}
        change={metrics?.approvalRateChange}
        icon={<CheckCircle className="h-4 w-4" />}
        variant={metrics?.approvalRate && metrics.approvalRate >= 70 ? 'success' : 'warning'}
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
```

### PostsChart Component

```tsx
// packages/ui/src/components/dashboard/PostsChart.tsx

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PostsChartProps {
  data: Array<{
    date: string;
    count: number;
    instagram: number;
    linkedin: number;
  }>;
}

export function PostsChart({ data }: PostsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Nenhum post gerado nos ultimos 7 dias
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) =>
            format(parseISO(value), 'EEE', { locale: ptBR })
          }
          className="text-muted-foreground text-xs"
        />
        <YAxis className="text-muted-foreground text-xs" />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="bg-popover border rounded-lg p-3 shadow-lg">
                <p className="font-medium">
                  {format(parseISO(label), "EEEE, dd 'de' MMM", { locale: ptBR })}
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm">
                    <span className="inline-block w-3 h-3 rounded mr-2 bg-pink-500" />
                    Instagram: {payload[0]?.value || 0}
                  </p>
                  <p className="text-sm">
                    <span className="inline-block w-3 h-3 rounded mr-2 bg-blue-500" />
                    LinkedIn: {payload[1]?.value || 0}
                  </p>
                </div>
              </div>
            );
          }}
        />
        <Legend />
        <Bar
          dataKey="instagram"
          name="Instagram"
          fill="hsl(var(--chart-1))"
          radius={[4, 4, 0, 0]}
          stackId="posts"
        />
        <Bar
          dataKey="linkedin"
          name="LinkedIn"
          fill="hsl(var(--chart-2))"
          radius={[4, 4, 0, 0]}
          stackId="posts"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### ScoreDistributionChart Component

```tsx
// packages/ui/src/components/dashboard/ScoreDistributionChart.tsx

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ScoreDistributionChartProps {
  data: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
}

const COLORS = {
  '0-2': 'hsl(0, 84%, 60%)',    // red
  '2-4': 'hsl(25, 95%, 53%)',   // orange
  '4-6': 'hsl(48, 96%, 53%)',   // yellow
  '6-8': 'hsl(142, 71%, 45%)',  // green
  '8-10': 'hsl(142, 76%, 36%)', // dark green
};

export function ScoreDistributionChart({ data }: ScoreDistributionChartProps) {
  if (data.length === 0 || data.every((d) => d.count === 0)) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Nenhum dado de score disponivel
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="range"
          className="text-muted-foreground text-xs"
          tickFormatter={(value) => value}
        />
        <YAxis className="text-muted-foreground text-xs" />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const data = payload[0].payload;
            return (
              <div className="bg-popover border rounded-lg p-3 shadow-lg">
                <p className="font-medium">Score {data.range}</p>
                <p className="text-sm text-muted-foreground">
                  {data.count} posts ({data.percentage.toFixed(1)}%)
                </p>
              </div>
            );
          }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[entry.range as keyof typeof COLORS] || 'hsl(var(--primary))'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### RecentPosts Component

```tsx
// packages/ui/src/components/dashboard/RecentPosts.tsx

import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PostPreviewCard } from './PostPreviewCard';
import { FileText } from 'lucide-react';
import type { RecentPost } from '@social-content/shared';

interface RecentPostsProps {
  posts: RecentPost[];
}

export function RecentPosts({ posts }: RecentPostsProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Nenhum post ainda</h3>
        <p className="text-muted-foreground">
          Execute o pipeline para gerar seus primeiros posts.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {posts.map((post) => (
        <Link key={post.id} to={`/posts/${post.id}`}>
          <PostPreviewCard post={post} />
        </Link>
      ))}
    </div>
  );
}
```

### PostPreviewCard Component

```tsx
// packages/ui/src/components/dashboard/PostPreviewCard.tsx

import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Instagram, Linkedin, Star, Image as ImageIcon } from 'lucide-react';
import type { RecentPost } from '@social-content/shared';
import { cn } from '@/lib/utils';

interface PostPreviewCardProps {
  post: RecentPost;
}

const statusStyles = {
  pending: 'bg-yellow-500/10 text-yellow-500',
  approved: 'bg-green-500/10 text-green-500',
  rejected: 'bg-red-500/10 text-red-500',
};

const statusLabels = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

export function PostPreviewCard({ post }: PostPreviewCardProps) {
  const PlatformIcon = post.platform === 'instagram' ? Instagram : Linkedin;

  return (
    <Card className="hover:border-primary transition-colors cursor-pointer">
      <CardContent className="p-3">
        {/* Thumbnail */}
        <div className="aspect-square rounded-md bg-muted mb-3 flex items-center justify-center overflow-hidden">
          {post.thumbnailUrl ? (
            <img
              src={post.thumbnailUrl}
              alt={post.topic}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <PlatformIcon className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className={cn('text-xs', statusStyles[post.status])}>
              {statusLabels[post.status]}
            </Badge>
          </div>

          <p className="text-sm font-medium line-clamp-2" title={post.topic}>
            {post.topic}
          </p>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {post.score !== null && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                <span>{post.score.toFixed(1)}</span>
              </div>
            )}
            <span>
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### ExecutionControls Component

```tsx
// packages/ui/src/components/dashboard/ExecutionControls.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Play, Square, Loader2 } from 'lucide-react';
import { usePipeline } from '@/hooks/usePipeline';
import type { PipelineStatus } from '@social-content/shared';

interface ExecutionControlsProps {
  status: PipelineStatus;
}

export function ExecutionControls({ status }: ExecutionControlsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [config, setConfig] = useState({
    numPosts: 3,
    platforms: ['instagram', 'linkedin'],
    includeVisual: true,
  });

  const { startPipeline, cancelPipeline, isStarting, isCancelling } = usePipeline();

  const handleStart = async () => {
    await startPipeline(config);
    setDialogOpen(false);
  };

  const handleCancel = async () => {
    await cancelPipeline();
  };

  const isRunning = status === 'running';

  return (
    <div className="flex items-center gap-4">
      {/* Status Badge */}
      <Badge variant={isRunning ? 'default' : 'secondary'} className="gap-1">
        {isRunning ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Executando...
          </>
        ) : (
          'Ocioso'
        )}
      </Badge>

      {/* Action Button */}
      {isRunning ? (
        <Button
          variant="destructive"
          onClick={handleCancel}
          disabled={isCancelling}
        >
          {isCancelling ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Square className="h-4 w-4 mr-2" />
          )}
          Cancelar
        </Button>
      ) : (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Play className="h-4 w-4 mr-2" />
              Nova Execucao
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Iniciar Nova Execucao</DialogTitle>
              <DialogDescription>
                Configure os parametros para gerar novos posts.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="numPosts">Numero de Posts</Label>
                <Input
                  id="numPosts"
                  type="number"
                  min={1}
                  max={10}
                  value={config.numPosts}
                  onChange={(e) =>
                    setConfig({ ...config, numPosts: parseInt(e.target.value) || 1 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Plataformas</Label>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="instagram"
                      checked={config.platforms.includes('instagram')}
                      onCheckedChange={(checked) => {
                        const platforms = checked
                          ? [...config.platforms, 'instagram']
                          : config.platforms.filter((p) => p !== 'instagram');
                        setConfig({ ...config, platforms });
                      }}
                    />
                    <Label htmlFor="instagram">Instagram</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="linkedin"
                      checked={config.platforms.includes('linkedin')}
                      onCheckedChange={(checked) => {
                        const platforms = checked
                          ? [...config.platforms, 'linkedin']
                          : config.platforms.filter((p) => p !== 'linkedin');
                        setConfig({ ...config, platforms });
                      }}
                    />
                    <Label htmlFor="linkedin">LinkedIn</Label>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeVisual"
                  checked={config.includeVisual}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, includeVisual: !!checked })
                  }
                />
                <Label htmlFor="includeVisual">Incluir assets visuais (carrossel, PDF)</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleStart} disabled={isStarting || config.platforms.length === 0}>
                {isStarting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Iniciar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
```

### useDashboardMetrics Hook

```typescript
// packages/ui/src/hooks/useDashboardMetrics.ts

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { DashboardMetrics, ChartData, RecentPost } from '@social-content/shared';

interface DashboardData {
  metrics: DashboardMetrics;
  chartData: ChartData;
  recentPosts: RecentPost[];
}

export function useDashboardMetrics() {
  const queryClient = useQueryClient();
  const { subscribe } = useWebSocket();

  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: async (): Promise<DashboardData> => {
      const [metricsRes, chartsRes, postsRes] = await Promise.all([
        api.get<DashboardMetrics>('/api/metrics'),
        api.get<ChartData>('/api/metrics/charts'),
        api.get<{ posts: RecentPost[] }>('/api/posts?limit=5&sort=createdAt:desc'),
      ]);

      return {
        metrics: metricsRes.data,
        chartData: chartsRes.data,
        recentPosts: postsRes.data.posts,
      };
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  // Invalidate cache on pipeline events
  const handlePipelineComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }, [queryClient]);

  useEffect(() => {
    const unsubscribe = subscribe('pipeline:complete', handlePipelineComplete);
    return unsubscribe;
  }, [subscribe, handlePipelineComplete]);

  return query;
}
```

### Backend Metrics Endpoint

```typescript
// packages/api/src/routes/metrics.ts

import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { getMetricsService } from '../services/metrics.service';

export const metricsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const metricsService = getMetricsService();

  /**
   * GET /api/metrics
   * Get aggregated metrics for dashboard
   */
  fastify.get('/api/metrics', async (request, reply) => {
    const metrics = await metricsService.getDashboardMetrics();
    return reply.send(metrics);
  });

  /**
   * GET /api/metrics/charts
   * Get chart data for dashboard
   */
  fastify.get('/api/metrics/charts', async (request, reply) => {
    const chartData = await metricsService.getChartData();
    return reply.send(chartData);
  });
};
```

### Metrics Service

```typescript
// packages/api/src/services/metrics.service.ts

import { db } from '../db/client';
import { posts, scores, executions } from '../db/schema';
import { sql, eq, gte, and, count, avg } from 'drizzle-orm';
import { subDays, startOfDay, format } from 'date-fns';
import type { DashboardMetrics, ChartData } from '@social-content/shared';

class MetricsService {
  private cache: Map<string, { data: unknown; expiresAt: number }> = new Map();
  private CACHE_TTL = 30 * 1000; // 30 seconds

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const cached = this.getFromCache<DashboardMetrics>('dashboard_metrics');
    if (cached) return cached;

    const today = startOfDay(new Date());
    const yesterday = startOfDay(subDays(new Date(), 1));

    // Posts today
    const [postsToday] = await db
      .select({ count: count() })
      .from(posts)
      .where(gte(posts.createdAt, today));

    // Posts yesterday (for comparison)
    const [postsYesterday] = await db
      .select({ count: count() })
      .from(posts)
      .where(and(gte(posts.createdAt, yesterday), sql`${posts.createdAt} < ${today}`));

    // Average score (last 7 days)
    const [scoreData] = await db
      .select({ avg: avg(scores.overallScore) })
      .from(scores)
      .innerJoin(posts, eq(scores.postId, posts.id))
      .where(gte(posts.createdAt, subDays(new Date(), 7)));

    // Approval rate
    const [approvalData] = await db
      .select({
        total: count(),
        approved: sql<number>`SUM(CASE WHEN ${posts.status} = 'approved' THEN 1 ELSE 0 END)`,
      })
      .from(posts)
      .where(gte(posts.createdAt, subDays(new Date(), 7)));

    // Average generation time
    const [timeData] = await db
      .select({ avg: avg(sql`${executions.finishedAt} - ${executions.startedAt}`) })
      .from(executions)
      .where(and(
        gte(executions.startedAt, subDays(new Date(), 7)),
        eq(executions.status, 'completed')
      ));

    const metrics: DashboardMetrics = {
      postsToday: postsToday.count,
      postsTodayChange: this.calculateChange(postsToday.count, postsYesterday.count),
      averageScore: Number(scoreData.avg) || 0,
      averageScoreChange: 0, // Would need previous period data
      approvalRate: approvalData.total > 0
        ? (Number(approvalData.approved) / approvalData.total) * 100
        : 0,
      approvalRateChange: 0,
      avgGenerationTime: Number(timeData.avg) || 0,
      avgGenerationTimeChange: 0,
    };

    this.setCache('dashboard_metrics', metrics);
    return metrics;
  }

  async getChartData(): Promise<ChartData> {
    const cached = this.getFromCache<ChartData>('chart_data');
    if (cached) return cached;

    const last7Days = subDays(new Date(), 7);

    // Posts by day
    const postsByDayRaw = await db
      .select({
        date: sql<string>`DATE(${posts.createdAt})`,
        count: count(),
        instagram: sql<number>`SUM(CASE WHEN ${posts.textInstagram} IS NOT NULL THEN 1 ELSE 0 END)`,
        linkedin: sql<number>`SUM(CASE WHEN ${posts.textLinkedin} IS NOT NULL THEN 1 ELSE 0 END)`,
      })
      .from(posts)
      .where(gte(posts.createdAt, last7Days))
      .groupBy(sql`DATE(${posts.createdAt})`)
      .orderBy(sql`DATE(${posts.createdAt})`);

    // Score distribution
    const scoreDistribution = await db
      .select({
        range: sql<string>`
          CASE
            WHEN ${scores.overallScore} < 2 THEN '0-2'
            WHEN ${scores.overallScore} < 4 THEN '2-4'
            WHEN ${scores.overallScore} < 6 THEN '4-6'
            WHEN ${scores.overallScore} < 8 THEN '6-8'
            ELSE '8-10'
          END
        `,
        count: count(),
      })
      .from(scores)
      .innerJoin(posts, eq(scores.postId, posts.id))
      .where(gte(posts.createdAt, last7Days))
      .groupBy(sql`
        CASE
          WHEN ${scores.overallScore} < 2 THEN '0-2'
          WHEN ${scores.overallScore} < 4 THEN '2-4'
          WHEN ${scores.overallScore} < 6 THEN '4-6'
          WHEN ${scores.overallScore} < 8 THEN '6-8'
          ELSE '8-10'
        END
      `);

    const totalScores = scoreDistribution.reduce((sum, s) => sum + s.count, 0);

    const chartData: ChartData = {
      postsByDay: postsByDayRaw.map((row) => ({
        date: row.date,
        count: row.count,
        instagram: Number(row.instagram),
        linkedin: Number(row.linkedin),
      })),
      scoreDistribution: ['0-2', '2-4', '4-6', '6-8', '8-10'].map((range) => {
        const found = scoreDistribution.find((s) => s.range === range);
        return {
          range,
          count: found?.count || 0,
          percentage: totalScores > 0 ? ((found?.count || 0) / totalScores) * 100 : 0,
        };
      }),
    };

    this.setCache('chart_data', chartData);
    return chartData;
  }

  private calculateChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as T;
    }
    return null;
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.CACHE_TTL,
    });
  }
}

let metricsService: MetricsService;

export function getMetricsService(): MetricsService {
  if (!metricsService) {
    metricsService = new MetricsService();
  }
  return metricsService;
}
```

### Dependencias Adicionais

```json
{
  "dependencies": {
    "recharts": "^2.12.0",
    "date-fns": "^3.0.0"
  }
}
```

---

## Testing

### Testes Unitarios

```typescript
// packages/ui/src/__tests__/dashboard.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Dashboard } from '../routes/Dashboard';
import { MetricCard } from '../components/dashboard/MetricCard';
import { MetricsGrid } from '../components/dashboard/MetricsGrid';
import { PostsChart } from '../components/dashboard/PostsChart';
import { ScoreDistributionChart } from '../components/dashboard/ScoreDistributionChart';
import { RecentPosts } from '../components/dashboard/RecentPosts';
import { PostPreviewCard } from '../components/dashboard/PostPreviewCard';
import { ExecutionControls } from '../components/dashboard/ExecutionControls';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>{children}</BrowserRouter>
  </QueryClientProvider>
);

describe('MetricCard', () => {
  it('should render metric card with value', () => {
    render(
      <MetricCard
        title="Posts Hoje"
        value={12}
        icon={<span>icon</span>}
      />
    );

    expect(screen.getByText('Posts Hoje')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('should render loading state', () => {
    render(
      <MetricCard
        title="Posts Hoje"
        value={12}
        icon={<span>icon</span>}
        loading={true}
      />
    );

    expect(screen.queryByText('12')).not.toBeInTheDocument();
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should render positive change', () => {
    render(
      <MetricCard
        title="Posts Hoje"
        value={12}
        change={25}
        icon={<span>icon</span>}
      />
    );

    expect(screen.getByText('+25% vs ontem')).toBeInTheDocument();
  });

  it('should render negative change', () => {
    render(
      <MetricCard
        title="Posts Hoje"
        value={12}
        change={-15}
        icon={<span>icon</span>}
      />
    );

    expect(screen.getByText('-15% vs ontem')).toBeInTheDocument();
  });
});

describe('MetricsGrid', () => {
  const mockMetrics = {
    postsToday: 8,
    postsTodayChange: 33,
    averageScore: 7.5,
    averageScoreChange: 5,
    approvalRate: 85,
    approvalRateChange: 10,
    avgGenerationTime: 240000, // 4 minutes
    avgGenerationTimeChange: -8,
  };

  it('should render all four metric cards', () => {
    render(<MetricsGrid metrics={mockMetrics} />);

    expect(screen.getByText('Posts Hoje')).toBeInTheDocument();
    expect(screen.getByText('Score Medio')).toBeInTheDocument();
    expect(screen.getByText('Taxa de Aprovacao')).toBeInTheDocument();
    expect(screen.getByText('Tempo Medio')).toBeInTheDocument();
  });

  it('should display correct values', () => {
    render(<MetricsGrid metrics={mockMetrics} />);

    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('7.5/10')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('4:00')).toBeInTheDocument();
  });

  it('should show loading skeletons when metrics is null', () => {
    render(<MetricsGrid metrics={null} loading={true} />);

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(4);
  });
});

describe('PostsChart', () => {
  const mockData = [
    { date: '2026-01-23', count: 5, instagram: 3, linkedin: 2 },
    { date: '2026-01-24', count: 3, instagram: 2, linkedin: 1 },
    { date: '2026-01-25', count: 8, instagram: 5, linkedin: 3 },
    { date: '2026-01-26', count: 4, instagram: 2, linkedin: 2 },
    { date: '2026-01-27', count: 6, instagram: 4, linkedin: 2 },
    { date: '2026-01-28', count: 7, instagram: 4, linkedin: 3 },
    { date: '2026-01-29', count: 2, instagram: 1, linkedin: 1 },
  ];

  it('should render chart with data', () => {
    render(<PostsChart data={mockData} />);

    // Recharts renders SVG elements
    expect(document.querySelector('.recharts-bar')).toBeInTheDocument();
  });

  it('should show empty message when no data', () => {
    render(<PostsChart data={[]} />);

    expect(screen.getByText('Nenhum post gerado nos ultimos 7 dias')).toBeInTheDocument();
  });
});

describe('ScoreDistributionChart', () => {
  const mockData = [
    { range: '0-2', count: 2, percentage: 5 },
    { range: '2-4', count: 5, percentage: 12.5 },
    { range: '4-6', count: 10, percentage: 25 },
    { range: '6-8', count: 15, percentage: 37.5 },
    { range: '8-10', count: 8, percentage: 20 },
  ];

  it('should render chart with data', () => {
    render(<ScoreDistributionChart data={mockData} />);

    expect(document.querySelector('.recharts-bar')).toBeInTheDocument();
  });

  it('should show empty message when no data', () => {
    render(<ScoreDistributionChart data={[]} />);

    expect(screen.getByText('Nenhum dado de score disponivel')).toBeInTheDocument();
  });
});

describe('RecentPosts', () => {
  const mockPosts = [
    {
      id: '1',
      topic: 'React 19 Server Components',
      platform: 'instagram' as const,
      score: 8.5,
      status: 'approved' as const,
      thumbnailUrl: null,
      createdAt: new Date('2026-01-29T10:00:00'),
    },
    {
      id: '2',
      topic: 'TypeScript 5.4 Features',
      platform: 'linkedin' as const,
      score: 7.2,
      status: 'pending' as const,
      thumbnailUrl: null,
      createdAt: new Date('2026-01-29T09:00:00'),
    },
  ];

  it('should render list of posts', () => {
    render(<RecentPosts posts={mockPosts} />, { wrapper });

    expect(screen.getByText('React 19 Server Components')).toBeInTheDocument();
    expect(screen.getByText('TypeScript 5.4 Features')).toBeInTheDocument();
  });

  it('should show empty state when no posts', () => {
    render(<RecentPosts posts={[]} />, { wrapper });

    expect(screen.getByText('Nenhum post ainda')).toBeInTheDocument();
  });
});

describe('PostPreviewCard', () => {
  const mockPost = {
    id: '1',
    topic: 'React 19 Server Components',
    platform: 'instagram' as const,
    score: 8.5,
    status: 'approved' as const,
    thumbnailUrl: null,
    createdAt: new Date('2026-01-29T10:00:00'),
  };

  it('should render post details', () => {
    render(<PostPreviewCard post={mockPost} />);

    expect(screen.getByText('React 19 Server Components')).toBeInTheDocument();
    expect(screen.getByText('8.5')).toBeInTheDocument();
    expect(screen.getByText('Aprovado')).toBeInTheDocument();
  });

  it('should render pending status badge', () => {
    render(
      <PostPreviewCard
        post={{ ...mockPost, status: 'pending' }}
      />
    );

    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });

  it('should render rejected status badge', () => {
    render(
      <PostPreviewCard
        post={{ ...mockPost, status: 'rejected' }}
      />
    );

    expect(screen.getByText('Rejeitado')).toBeInTheDocument();
  });
});

describe('ExecutionControls', () => {
  it('should show "Nova Execucao" button when idle', () => {
    render(<ExecutionControls status="idle" />, { wrapper });

    expect(screen.getByText('Nova Execucao')).toBeInTheDocument();
    expect(screen.getByText('Ocioso')).toBeInTheDocument();
  });

  it('should show "Cancelar" button when running', () => {
    render(<ExecutionControls status="running" />, { wrapper });

    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByText('Executando...')).toBeInTheDocument();
  });

  it('should open config dialog when clicking "Nova Execucao"', async () => {
    render(<ExecutionControls status="idle" />, { wrapper });

    fireEvent.click(screen.getByText('Nova Execucao'));

    await waitFor(() => {
      expect(screen.getByText('Iniciar Nova Execucao')).toBeInTheDocument();
    });
  });
});
```

### Testes de Integracao

```typescript
// packages/api/src/__tests__/metrics.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../server';
import { FastifyInstance } from 'fastify';

describe('Metrics API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/metrics', () => {
    it('should return dashboard metrics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/metrics',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('postsToday');
      expect(body).toHaveProperty('averageScore');
      expect(body).toHaveProperty('approvalRate');
      expect(body).toHaveProperty('avgGenerationTime');
    });
  });

  describe('GET /api/metrics/charts', () => {
    it('should return chart data', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/metrics/charts',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('postsByDay');
      expect(body).toHaveProperty('scoreDistribution');
      expect(Array.isArray(body.postsByDay)).toBe(true);
      expect(Array.isArray(body.scoreDistribution)).toBe(true);
    });

    it('should return 7 days of data', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/metrics/charts',
      });

      const body = JSON.parse(response.body);
      expect(body.postsByDay.length).toBeLessThanOrEqual(7);
    });

    it('should return all score ranges', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/metrics/charts',
      });

      const body = JSON.parse(response.body);
      const ranges = body.scoreDistribution.map((s: { range: string }) => s.range);
      expect(ranges).toContain('0-2');
      expect(ranges).toContain('2-4');
      expect(ranges).toContain('4-6');
      expect(ranges).toContain('6-8');
      expect(ranges).toContain('8-10');
    });
  });
});
```

### Validacoes Manuais

1. Navegar para `/` (home)
2. Verificar que 4 cards de metricas sao exibidos
3. Verificar valores corretos em cada card (posts hoje, score medio, aprovacao %, tempo medio)
4. Verificar indicadores de variacao (setas verde/vermelha)
5. Verificar grafico de posts dos ultimos 7 dias
6. Verificar grafico de distribuicao de scores com cores corretas
7. Verificar lista de 5 posts recentes com thumbnail, titulo, plataforma, score
8. Clicar em um post recente e verificar navegacao para detalhe
9. Clicar em "Nova Execucao" e verificar modal de configuracao
10. Configurar parametros e iniciar execucao
11. Verificar badge de status muda para "Executando..."
12. Verificar botao muda para "Cancelar"
13. Aguardar conclusao e verificar metricas atualizadas automaticamente
14. Testar cancelamento de execucao
15. Testar responsividade: redimensionar janela para diferentes breakpoints
16. Verificar layout em mobile (1 coluna de cards)
17. Verificar layout em tablet (2 colunas de cards)
18. Verificar layout em desktop (4 colunas de cards)
19. Desconectar WebSocket e verificar alerta de conexao
20. Reconectar e verificar que updates voltam a funcionar

---

## References

- [PRD](../prd.md) - Story 5.3: Dashboard Principal com Metricas
- [Architecture](../architecture.md) - Frontend Architecture, API Specification
- [Front-End Spec](../front-end-spec.md) - Component Library, Design System
- [Story 5.1](./story-5.1.md) - WebSocket Server para Real-Time (dependencia)
- [Story 5.2](./story-5.2.md) - Hook de WebSocket no React (dependencia)
- [Story 4.1](./story-4.1.md) - Persistencia com SQLite (dependencia para queries)
- [Story 4.7](./story-4.7.md) - Pipeline Completo End-to-End (dependencia para execucao)

---

## Dev Agent Record

### File List

| Status | File | Changes |
|--------|------|---------|
| Created | packages/shared/src/types/metrics.ts | Dashboard metrics type definitions |
| Modified | packages/shared/src/types/index.ts | Added metrics export |
| Created | packages/api/src/services/metrics.service.ts | Metrics aggregation service with caching |
| Created | packages/api/src/routes/metrics/dashboard.ts | Dashboard API endpoints |
| Modified | packages/api/src/routes/metrics/index.ts | Added dashboard routes export |
| Modified | packages/api/src/routes/index.ts | Added dashboard routes export |
| Modified | packages/api/src/server.ts | Registered dashboard routes |
| Created | packages/api/src/__tests__/dashboard-metrics.test.ts | API tests (12 tests) |
| Created | packages/ui/src/components/dashboard/MetricCard.tsx | Metric card component |
| Created | packages/ui/src/components/dashboard/MetricsGrid.tsx | Grid layout for metric cards |
| Created | packages/ui/src/components/dashboard/PostsChart.tsx | Bar chart for posts by day |
| Created | packages/ui/src/components/dashboard/ScoreDistributionChart.tsx | Bar chart for score distribution |
| Created | packages/ui/src/components/dashboard/PostPreviewCard.tsx | Post preview card |
| Created | packages/ui/src/components/dashboard/RecentPosts.tsx | Recent posts grid |
| Created | packages/ui/src/components/dashboard/ExecutionControls.tsx | Execution controls with modal |
| Created | packages/ui/src/components/dashboard/DashboardSkeleton.tsx | Loading skeleton |
| Created | packages/ui/src/components/dashboard/index.ts | Barrel exports |
| Created | packages/ui/src/hooks/useDashboardMetrics.ts | Dashboard data fetching hook |
| Modified | packages/ui/src/lib/api.ts | Added dashboard API methods |
| Modified | packages/ui/src/routes/Dashboard.tsx | Updated dashboard with all components |
| Created | packages/ui/src/__tests__/dashboard.test.tsx | UI tests (20 tests) |

### Debug Log

_No debug entries_

### Completion Notes

Story 5.3 fully implemented with:
- Backend: GET /api/dashboard/metrics, GET /api/dashboard/charts, GET /api/dashboard/recent-posts endpoints
- Frontend: Dashboard page with metric cards, charts (recharts), recent posts grid, execution controls
- Real-time: useDashboardMetrics hook with React Query for caching and auto-refresh
- Tests: 12 API tests + 20 UI tests, all passing
- Responsive: Grid adapts from 1 col (mobile) to 4 col (desktop)
- Dependencies: Added recharts and date-fns to UI package

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-29 | Story created | River (SM Agent) |
| 2026-01-29 | Implementation completed | Dex (Dev Agent) |

---

*Story criada por River (Scrum Master Agent) - Synkra AIOS*
