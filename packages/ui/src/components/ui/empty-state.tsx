import { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import {
  FileText,
  History,
  TrendingUp,
  WifiOff,
  Search,
  FolderOpen,
  AlertCircle,
  Inbox,
  ImageOff,
  Play,
} from 'lucide-react';

export type EmptyStateVariant = 'no-data' | 'no-results' | 'error' | 'offline';

interface EmptyStateProps {
  /** Visual variant that sets default icon and styling */
  variant?: EmptyStateVariant;
  /** Custom icon to override default */
  icon?: ReactNode;
  /** Main title text */
  title: string;
  /** Description text below title */
  description?: string;
  /** Action button configuration */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  /** Additional CSS classes */
  className?: string;
  /** Size variant for icon and spacing */
  size?: 'sm' | 'md' | 'lg';
}

const defaultIcons: Record<EmptyStateVariant, typeof FileText> = {
  'no-data': FolderOpen,
  'no-results': Search,
  error: AlertCircle,
  offline: WifiOff,
};

const iconBgStyles: Record<EmptyStateVariant, string> = {
  'no-data': 'bg-muted',
  'no-results': 'bg-muted',
  error: 'bg-destructive/10',
  offline: 'bg-yellow-500/10',
};

const iconStyles: Record<EmptyStateVariant, string> = {
  'no-data': 'text-muted-foreground',
  'no-results': 'text-muted-foreground',
  error: 'text-destructive',
  offline: 'text-yellow-500',
};

const sizeConfig = {
  sm: {
    wrapper: 'py-8 px-4',
    iconContainer: 'w-12 h-12 mb-3',
    icon: 'h-6 w-6',
    title: 'text-base',
    description: 'text-sm',
    maxWidth: 'max-w-sm',
  },
  md: {
    wrapper: 'py-12 px-4',
    iconContainer: 'w-16 h-16 mb-4',
    icon: 'h-8 w-8',
    title: 'text-lg',
    description: 'text-sm',
    maxWidth: 'max-w-md',
  },
  lg: {
    wrapper: 'py-16 px-4',
    iconContainer: 'w-20 h-20 mb-6',
    icon: 'h-10 w-10',
    title: 'text-xl',
    description: 'text-base',
    maxWidth: 'max-w-lg',
  },
};

/**
 * EmptyState component
 * Displays a friendly empty/error state with optional action.
 *
 * Story 5.8: Empty States
 */
export function EmptyState({
  variant = 'no-data',
  icon,
  title,
  description,
  action,
  className,
  size = 'md',
}: EmptyStateProps) {
  const DefaultIcon = defaultIcons[variant];
  const sizes = sizeConfig[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizes.wrapper,
        className
      )}
      data-testid="empty-state"
    >
      <div
        className={cn(
          'rounded-full flex items-center justify-center',
          sizes.iconContainer,
          iconBgStyles[variant]
        )}
      >
        {icon || (
          <DefaultIcon className={cn(sizes.icon, iconStyles[variant])} />
        )}
      </div>
      <h3 className={cn('font-medium mb-2', sizes.title)}>{title}</h3>
      {description && (
        <p className={cn('text-muted-foreground mb-6', sizes.description, sizes.maxWidth)}>
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} variant={action.variant || 'default'}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// ============================================
// Pre-configured Empty State Components
// ============================================

interface NoPostsStateProps {
  onExecute?: () => void;
}

/**
 * Empty state for when no posts have been generated
 */
export function NoPostsState({ onExecute }: NoPostsStateProps) {
  return (
    <EmptyState
      icon={<FileText className="h-8 w-8 text-muted-foreground" />}
      title="Nenhum post gerado"
      description="Execute o pipeline para gerar seus primeiros posts automatizados para redes sociais."
      action={onExecute ? { label: 'Executar Pipeline', onClick: onExecute } : undefined}
    />
  );
}

interface NoExecutionsStateProps {
  onExecute?: () => void;
}

/**
 * Empty state for execution history
 */
export function NoExecutionsState({ onExecute }: NoExecutionsStateProps) {
  return (
    <EmptyState
      icon={<History className="h-8 w-8 text-muted-foreground" />}
      title="Nenhuma execucao encontrada"
      description="O historico de execucoes aparecera aqui apos voce executar o pipeline pela primeira vez."
      action={onExecute ? { label: 'Executar Pipeline', onClick: onExecute } : undefined}
    />
  );
}

interface NoTrendsStateProps {
  onRefresh?: () => void;
}

/**
 * Empty state for trends page
 */
export function NoTrendsState({ onRefresh }: NoTrendsStateProps) {
  return (
    <EmptyState
      icon={<TrendingUp className="h-8 w-8 text-muted-foreground" />}
      title="Nenhuma tendencia encontrada"
      description="Nao foi possivel encontrar tendencias no momento. Tente novamente mais tarde."
      action={onRefresh ? { label: 'Tentar Novamente', onClick: onRefresh } : undefined}
    />
  );
}

interface NoResultsStateProps {
  onClear?: () => void;
}

/**
 * Empty state for search/filter with no results
 */
export function NoResultsState({ onClear }: NoResultsStateProps) {
  return (
    <EmptyState
      variant="no-results"
      title="Nenhum resultado encontrado"
      description="Tente ajustar os filtros ou termos de busca para encontrar o que procura."
      action={onClear ? { label: 'Limpar Filtros', onClick: onClear, variant: 'outline' } : undefined}
    />
  );
}

interface OfflineStateProps {
  onRetry?: () => void;
}

/**
 * Empty state for offline/connection error
 */
export function OfflineState({ onRetry }: OfflineStateProps) {
  return (
    <EmptyState
      variant="offline"
      title="Sem conexao"
      description="Verifique sua conexao com a internet e tente novamente."
      action={onRetry ? { label: 'Tentar Novamente', onClick: onRetry } : undefined}
    />
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * Empty state for generic errors
 */
export function ErrorEmptyState({ message, onRetry }: ErrorStateProps) {
  return (
    <EmptyState
      variant="error"
      title="Algo deu errado"
      description={message || 'Ocorreu um erro ao carregar os dados. Tente novamente.'}
      action={onRetry ? { label: 'Tentar Novamente', onClick: onRetry } : undefined}
    />
  );
}

interface NoCuratedContentStateProps {
  onResearch?: () => void;
}

/**
 * Empty state for curated content page
 */
export function NoCuratedContentState({ onResearch }: NoCuratedContentStateProps) {
  return (
    <EmptyState
      icon={<Inbox className="h-8 w-8 text-muted-foreground" />}
      title="Nenhum conteudo curado"
      description="O agente Curador ainda nao processou nenhum conteudo. Execute o Pesquisador primeiro para gerar tendencias."
      action={onResearch ? { label: 'Pesquisar Tendencias', onClick: onResearch } : undefined}
    />
  );
}

interface NoAssetsStateProps {
  onGenerate?: () => void;
}

/**
 * Empty state for when a post has no visual assets
 */
export function NoAssetsState({ onGenerate }: NoAssetsStateProps) {
  return (
    <EmptyState
      icon={<ImageOff className="h-8 w-8 text-muted-foreground" />}
      title="Sem assets visuais"
      description="Este post ainda nao possui carrossel ou PDF gerados."
      action={onGenerate ? { label: 'Gerar Visuais', onClick: onGenerate } : undefined}
      size="sm"
    />
  );
}

interface NoPipelineRunsStateProps {
  onRun?: () => void;
}

/**
 * Empty state for pipeline page when no runs
 */
export function NoPipelineRunsState({ onRun }: NoPipelineRunsStateProps) {
  return (
    <EmptyState
      icon={<Play className="h-8 w-8 text-muted-foreground" />}
      title="Pipeline pronto"
      description="Clique no botao abaixo para iniciar uma nova execucao do pipeline de geracao de conteudo."
      action={onRun ? { label: 'Iniciar Pipeline', onClick: onRun } : undefined}
    />
  );
}
