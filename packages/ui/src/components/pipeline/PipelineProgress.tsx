/**
 * Pipeline Progress Component
 * Displays the current progress of a pipeline execution
 */

import { CheckCircle, Circle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import type { StepStatus, PipelineStatus } from '../../lib/api';

export interface PipelineStep {
  name: string;
  status: StepStatus;
  duration?: number;
  error?: string;
}

export interface PipelineProgressProps {
  steps: PipelineStep[];
  currentStep: number;
  status: PipelineStatus;
  percentComplete: number;
  className?: string;
}

const stepDisplayNames: Record<string, string> = {
  research: 'Pesquisar Tendencias',
  curate: 'Curar Conteudo',
};

const statusVariants: Record<PipelineStatus, 'default' | 'secondary' | 'destructive' | 'outline' | 'success'> = {
  pending: 'secondary',
  running: 'default',
  completed: 'success',
  failed: 'destructive',
  cancelled: 'outline',
};

const statusLabels: Record<PipelineStatus, string> = {
  pending: 'Pendente',
  running: 'Executando',
  completed: 'Concluido',
  failed: 'Falhou',
  cancelled: 'Cancelado',
};

function StepIndicator({ status }: { status: StepStatus }) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'running':
      return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'skipped':
      return <Circle className="h-5 w-5 text-gray-400" />;
    default:
      return <Circle className="h-5 w-5 text-gray-300" />;
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function PipelineProgress({
  steps,
  currentStep: _currentStep,
  status,
  percentComplete,
  className,
}: PipelineProgressProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Progresso do Pipeline</h3>
        <Badge variant={statusVariants[status]}>
          {statusLabels[status]}
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
        <div
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            status === 'failed' ? 'bg-red-500' :
            status === 'completed' ? 'bg-green-500' :
            'bg-blue-500'
          )}
          style={{ width: `${percentComplete}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.name}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg transition-colors',
              step.status === 'running' && 'bg-blue-50 dark:bg-blue-950',
              step.status === 'completed' && 'bg-green-50 dark:bg-green-950',
              step.status === 'failed' && 'bg-red-50 dark:bg-red-950',
              step.status === 'pending' && 'bg-gray-50 dark:bg-gray-800'
            )}
          >
            <StepIndicator status={step.status} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'font-medium',
                    step.status === 'running' && 'text-blue-700 dark:text-blue-300',
                    step.status === 'completed' && 'text-green-700 dark:text-green-300',
                    step.status === 'failed' && 'text-red-700 dark:text-red-300',
                    step.status === 'pending' && 'text-gray-500 dark:text-gray-400'
                  )}
                >
                  {stepDisplayNames[step.name] ?? step.name}
                </span>
                {step.duration && step.status === 'completed' && (
                  <span className="text-xs text-gray-500">
                    ({formatDuration(step.duration)})
                  </span>
                )}
              </div>

              {step.error && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1 truncate">
                  {step.error}
                </p>
              )}
            </div>

            <span className="text-sm text-gray-500">
              {index + 1}/{steps.length}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
