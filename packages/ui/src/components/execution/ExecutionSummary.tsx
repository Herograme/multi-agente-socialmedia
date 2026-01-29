/**
 * ExecutionSummary Component
 * Displays completion summary with stats and navigation to posts
 */

import { Button } from '../ui/button';
import { CheckCircle, XCircle, FileText, Clock, Star, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { PipelineOutputs, PipelineExecutionStatus } from '@social-content/shared';

interface ExecutionSummaryProps {
  status: PipelineExecutionStatus;
  startedAt?: Date;
  finishedAt?: Date;
  outputs: PipelineOutputs;
  onViewPosts: () => void;
}

export function ExecutionSummary({
  status,
  startedAt,
  finishedAt,
  outputs,
  onViewPosts,
}: ExecutionSummaryProps) {
  const duration =
    startedAt && finishedAt
      ? new Date(finishedAt).getTime() - new Date(startedAt).getTime()
      : 0;

  const postsCount = outputs.posts?.length || 0;
  const averageScore = postsCount > 0
    ? (outputs.posts?.reduce((acc, post) => {
        return acc + (post.score?.overallScore || 0);
      }, 0) || 0) / postsCount
    : 0;

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const isSuccess = status === 'completed';
  const Icon = isSuccess ? CheckCircle : XCircle;

  return (
    <div
      className={cn(
        'rounded-lg border p-6',
        isSuccess
          ? 'border-green-500/50 bg-green-500/5'
          : 'border-red-500/50 bg-red-500/5'
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Icon className={cn('h-10 w-10', isSuccess ? 'text-green-500' : 'text-red-500')} />
          <div>
            <h3 className="text-lg font-bold">
              {isSuccess ? 'Pipeline Concluido!' : 'Pipeline Falhou'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isSuccess
                ? 'Todos os agentes executaram com sucesso.'
                : 'Houve erros durante a execucao.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span className="font-mono">{formatDuration(duration)}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span>{postsCount} posts</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-muted-foreground" />
            <span>{averageScore.toFixed(1)}/10</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Redirecionando para posts em 5 segundos...
        </p>
        <Button onClick={onViewPosts}>
          Ver Posts Gerados
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
