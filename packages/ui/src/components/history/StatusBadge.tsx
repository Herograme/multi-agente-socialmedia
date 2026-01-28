import { Badge } from '../ui/badge';
import { CheckCircle, AlertCircle, XCircle, Loader2, Ban, Clock } from 'lucide-react';
import { ExecutionStatus } from '@social-content/shared';

interface StatusBadgeProps {
  status: ExecutionStatus;
}

const statusConfig: Record<
  ExecutionStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success'; icon: React.ElementType; className?: string }
> = {
  [ExecutionStatus.COMPLETED]: {
    label: 'Sucesso',
    variant: 'success',
    icon: CheckCircle,
  },
  [ExecutionStatus.PENDING]: {
    label: 'Pendente',
    variant: 'secondary',
    icon: Clock,
  },
  [ExecutionStatus.RUNNING]: {
    label: 'Executando',
    variant: 'outline',
    icon: Loader2,
  },
  [ExecutionStatus.FAILED]: {
    label: 'Falha',
    variant: 'destructive',
    icon: XCircle,
  },
  [ExecutionStatus.CANCELLED]: {
    label: 'Cancelado',
    variant: 'outline',
    icon: Ban,
  },
};

// For partial success scenario (not in base enum, can be derived from results)
export function getStatusFromResults(
  status: ExecutionStatus,
  postsGenerated: number,
  postsApproved: number
): { displayStatus: ExecutionStatus; isPartial: boolean } {
  if (status === ExecutionStatus.COMPLETED && postsGenerated > 0 && postsApproved < postsGenerated) {
    return { displayStatus: status, isPartial: true };
  }
  return { displayStatus: status, isPartial: false };
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  if (!config) {
    return (
      <Badge variant="outline" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        Desconhecido
      </Badge>
    );
  }

  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className={`h-3 w-3 ${status === ExecutionStatus.RUNNING ? 'animate-spin' : ''}`} />
      {config.label}
    </Badge>
  );
}

interface StatusBadgeWithPartialProps {
  status: ExecutionStatus;
  isPartial?: boolean;
}

/**
 * StatusBadge that can show "Parcial" for partial success
 */
export function StatusBadgeWithPartial({ status, isPartial }: StatusBadgeWithPartialProps) {
  if (isPartial && status === ExecutionStatus.COMPLETED) {
    return (
      <Badge variant="secondary" className="gap-1 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
        <AlertCircle className="h-3 w-3" />
        Parcial
      </Badge>
    );
  }

  return <StatusBadge status={status} />;
}
