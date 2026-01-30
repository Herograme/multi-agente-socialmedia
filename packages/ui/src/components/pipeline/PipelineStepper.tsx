/**
 * Pipeline Stepper Component
 * Visual horizontal stepper showing pipeline execution flow
 * Task #15 - Story 5.4
 */

import { Search, Copy, FileCheck, Sparkles, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { StepStatus } from '../../lib/api';

export interface StepperStep {
  id: string;
  name: string;
  status: StepStatus;
  duration?: number;
  error?: string;
}

export interface PipelineStepperProps {
  steps: StepperStep[];
  className?: string;
}

const STEP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  research: Search,
  deduplicate: Copy,
  curate: FileCheck,
  generate: Sparkles,
};

const STEP_LABELS: Record<string, string> = {
  research: 'Pesquisar',
  deduplicate: 'Deduplicar',
  curate: 'Curar',
  generate: 'Gerar',
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function StepIcon({ stepId, status }: { stepId: string; status: StepStatus }) {
  const BaseIcon = STEP_ICONS[stepId] || Search;

  if (status === 'completed') {
    return <CheckCircle className="h-5 w-5 text-white" />;
  }
  if (status === 'failed') {
    return <XCircle className="h-5 w-5 text-white" />;
  }
  if (status === 'running') {
    return <Loader2 className="h-5 w-5 text-white animate-spin" />;
  }
  return <BaseIcon className="h-5 w-5 text-gray-400" />;
}

function StepNode({ step, isLast }: { step: StepperStep; isLast: boolean }) {
  const status = step.status;

  return (
    <div className="flex items-center">
      {/* Step Circle */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300',
            status === 'completed' && 'bg-green-500 border-green-500',
            status === 'running' && 'bg-blue-500 border-blue-500 animate-pulse',
            status === 'failed' && 'bg-red-500 border-red-500',
            status === 'pending' && 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600',
            status === 'skipped' && 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
          )}
        >
          <StepIcon stepId={step.id} status={status} />

          {/* Running indicator ring */}
          {status === 'running' && (
            <span className="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-30" />
          )}
        </div>

        {/* Step Label */}
        <div className="mt-2 text-center">
          <span
            className={cn(
              'text-sm font-medium block',
              status === 'completed' && 'text-green-600 dark:text-green-400',
              status === 'running' && 'text-blue-600 dark:text-blue-400',
              status === 'failed' && 'text-red-600 dark:text-red-400',
              status === 'pending' && 'text-gray-500 dark:text-gray-400',
              status === 'skipped' && 'text-gray-400 dark:text-gray-500'
            )}
          >
            {STEP_LABELS[step.id] || step.name}
          </span>
          {step.duration && status === 'completed' && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDuration(step.duration)}
            </span>
          )}
          {step.error && status === 'failed' && (
            <span className="text-xs text-red-500 dark:text-red-400 max-w-[80px] truncate block">
              Erro
            </span>
          )}
        </div>
      </div>

      {/* Connector Line */}
      {!isLast && (
        <div
          className={cn(
            'flex-1 h-1 mx-2 min-w-[40px] transition-all duration-300 rounded-full',
            status === 'completed' ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
          )}
        />
      )}
    </div>
  );
}

export function PipelineStepper({ steps, className }: PipelineStepperProps) {
  // Ensure we have the 4 default steps if none provided
  const displaySteps = steps.length > 0 ? steps : [
    { id: 'research', name: 'Pesquisar', status: 'pending' as StepStatus },
    { id: 'deduplicate', name: 'Deduplicar', status: 'pending' as StepStatus },
    { id: 'curate', name: 'Curar', status: 'pending' as StepStatus },
    { id: 'generate', name: 'Gerar', status: 'pending' as StepStatus },
  ];

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-start justify-between px-4">
        {displaySteps.map((step, index) => (
          <StepNode
            key={step.id}
            step={step}
            isLast={index === displaySteps.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
