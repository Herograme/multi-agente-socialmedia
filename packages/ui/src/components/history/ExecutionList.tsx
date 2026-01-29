import { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, FileText, Star } from 'lucide-react';
import { StatusBadgeWithPartial, getStatusFromResults } from './StatusBadge';
import { ExecutionDetail } from './ExecutionDetail';
import { formatRelativeTime, formatDateTime } from '../../lib/date';
import { cn } from '../../lib/utils';
import type { ExecutionWithDuration } from '@social-content/shared';

interface ExecutionListProps {
  executions: ExecutionWithDuration[];
}

/**
 * Format duration from milliseconds to human readable string
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

export function ExecutionList({ executions }: ExecutionListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (executions.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Nenhuma execucao encontrada</h3>
        <p className="text-muted-foreground">
          Execute o pipeline para ver o historico aqui.
        </p>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-2">
      {executions.map((execution) => {
        const isExpanded = expandedId === execution.id;
        const { isPartial } = getStatusFromResults(
          execution.status,
          execution.postsGenerated,
          execution.postsApproved
        );

        return (
          <div
            key={execution.id}
            className="border rounded-lg overflow-hidden"
          >
            {/* Execution header - clickable to expand */}
            <button
              onClick={() => toggleExpand(execution.id)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
                <StatusBadgeWithPartial status={execution.status} isPartial={isPartial} />
                <div className="text-left">
                  <p className="font-medium">
                    {formatDateTime(execution.startedAt)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatRelativeTime(execution.startedAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1" title="Duracao">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDuration(execution.duration)}</span>
                </div>
                <div className="flex items-center gap-1" title="Posts gerados">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{execution.postsGenerated} posts</span>
                </div>
                {execution.averageScore !== undefined && execution.averageScore !== null && (
                  <div className="flex items-center gap-1" title="Score medio">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <span>{execution.averageScore.toFixed(1)}/10</span>
                  </div>
                )}
              </div>
            </button>

            {/* Expandable detail section */}
            <div
              className={cn(
                'overflow-hidden transition-all duration-300',
                isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
              )}
            >
              <div className="border-t px-4 py-4 bg-accent/20">
                <ExecutionDetail executionId={execution.id} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
