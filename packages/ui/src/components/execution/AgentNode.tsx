/**
 * AgentNode Component
 * Displays a single agent in the pipeline flow with status, timer, and animations
 */

import { useEffect, useState } from 'react';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import type { AgentNodeState, AgentNodeStatus } from '@social-content/shared';
import type { LucideIcon } from 'lucide-react';

interface AgentConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
}

interface AgentNodeProps {
  config: AgentConfig;
  state: AgentNodeState;
  compact?: boolean;
}

const statusConfig: Record<
  AgentNodeStatus,
  {
    label: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    pulse: boolean;
  }
> = {
  waiting: {
    label: 'Aguardando',
    bgColor: 'bg-muted',
    textColor: 'text-muted-foreground',
    borderColor: 'border-muted',
    pulse: false,
  },
  running: {
    label: 'Executando',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-500',
    borderColor: 'border-blue-500',
    pulse: true,
  },
  done: {
    label: 'Concluido',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-500',
    borderColor: 'border-green-500',
    pulse: false,
  },
  error: {
    label: 'Erro',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-500',
    borderColor: 'border-red-500',
    pulse: false,
  },
  skipped: {
    label: 'Pulado',
    bgColor: 'bg-muted',
    textColor: 'text-muted-foreground',
    borderColor: 'border-muted',
    pulse: false,
  },
};

export function AgentNode({ config, state, compact = false }: AgentNodeProps) {
  const [elapsed, setElapsed] = useState(0);
  const Icon = config.icon;
  const status = state?.status || 'waiting';
  const statusCfg = statusConfig[status];

  // Timer for running agents
  useEffect(() => {
    if (status !== 'running' || !state.startedAt) {
      if (state.duration) {
        setElapsed(state.duration);
      }
      return;
    }

    const startTime = new Date(state.startedAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [status, state.startedAt, state.duration]);

  const formatElapsed = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border-2 transition-all w-full',
          statusCfg.bgColor,
          statusCfg.borderColor,
          statusCfg.pulse && 'agent-pulsing'
        )}
      >
        <Icon className={cn('h-5 w-5', statusCfg.textColor)} />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{config.name}</p>
          <p className="text-xs text-muted-foreground">{statusCfg.label}</p>
        </div>
        {(status === 'running' || status === 'done') && (
          <span className="text-xs font-mono">{formatElapsed(elapsed)}</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center p-4 rounded-xl border-2 min-w-[120px] transition-all',
        statusCfg.bgColor,
        statusCfg.borderColor,
        statusCfg.pulse && 'agent-pulsing'
      )}
      title={config.description}
    >
      <div
        className={cn(
          'p-3 rounded-full mb-2',
          status === 'running' ? 'bg-blue-500/20' : 'bg-background'
        )}
      >
        <Icon className={cn('h-6 w-6', statusCfg.textColor)} />
      </div>
      <p className="font-medium text-sm text-center">{config.name}</p>
      <Badge variant="outline" className={cn('mt-2 text-xs', statusCfg.textColor)}>
        {statusCfg.label}
      </Badge>
      {(status === 'running' || status === 'done') && (
        <span className="text-xs font-mono mt-1 text-muted-foreground">
          {formatElapsed(elapsed)}
        </span>
      )}
      {state.progress !== undefined && status === 'running' && (
        <div className="w-full mt-2 bg-muted rounded-full h-1">
          <div
            className="bg-blue-500 h-1 rounded-full transition-all"
            style={{ width: `${state.progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
