/**
 * ExecutionHeader Component
 * Displays execution status, timer, configuration summary, and cancel button
 */

import { useEffect, useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Play, StopCircle, Clock, Instagram, Linkedin } from 'lucide-react';
import type { ExecutionViewConfig, PipelineExecutionStatus, Platform } from '@social-content/shared';

interface ExecutionHeaderProps {
  status: PipelineExecutionStatus;
  startedAt?: Date;
  config: ExecutionViewConfig;
  onCancel: () => void;
  showCancelConfirmation?: boolean;
}

const statusLabels: Record<
  PipelineExecutionStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  idle: { label: 'Aguardando', variant: 'outline' },
  running: { label: 'Executando', variant: 'default' },
  completed: { label: 'Concluido', variant: 'secondary' },
  failed: { label: 'Falhou', variant: 'destructive' },
  cancelled: { label: 'Cancelado', variant: 'outline' },
};

export function ExecutionHeader({
  status,
  startedAt,
  config,
  onCancel,
}: ExecutionHeaderProps) {
  const [elapsed, setElapsed] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    if (status !== 'running' || !startedAt) return;

    const startTime = new Date(startedAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [status, startedAt]);

  const formatElapsed = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const statusInfo = statusLabels[status];

  const handleCancelClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmCancel = () => {
    setShowConfirmDialog(false);
    onCancel();
  };

  const handleCancelDialog = () => {
    setShowConfirmDialog(false);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Play className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {status === 'running' ? 'Pipeline em Execucao' : 'Execucao do Pipeline'}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            {status === 'running' && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {formatElapsed(elapsed)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Config Summary */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{config.numPosts} posts</span>
          <span>|</span>
          <div className="flex items-center gap-1">
            {config.platforms.includes('instagram' as Platform) && (
              <Instagram className="h-4 w-4" />
            )}
            {config.platforms.includes('linkedin' as Platform) && (
              <Linkedin className="h-4 w-4" />
            )}
          </div>
        </div>

        {/* Cancel Button */}
        {status === 'running' && (
          <Button variant="destructive" size="sm" onClick={handleCancelClick}>
            <StopCircle className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={handleCancelDialog}
          />
          {/* Dialog */}
          <div className="relative z-50 bg-card border rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
            <h2 className="text-lg font-semibold">Cancelar Execucao?</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Isso ira interromper o pipeline atual. Os outputs parciais serao preservados,
              mas a execucao nao podera ser retomada.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleCancelDialog}>
                Continuar Executando
              </Button>
              <Button variant="destructive" onClick={handleConfirmCancel}>
                Cancelar Pipeline
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
