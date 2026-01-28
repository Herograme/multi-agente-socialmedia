/**
 * Pipeline Controls Component
 * Buttons and inputs for controlling pipeline execution
 */

import { useState } from 'react';
import { Play, Square, RotateCcw, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import type { PipelineStatus, PipelineRunRequest } from '../../lib/api';

export type SourceName = 'devto' | 'hackernews' | 'reddit';

export interface PipelineControlsProps {
  status: PipelineStatus | null;
  isStarting: boolean;
  isCancelling: boolean;
  isRetrying: boolean;
  onStart: (options?: PipelineRunRequest) => void;
  onCancel: () => void;
  onRetry: () => void;
  className?: string;
}

const AVAILABLE_SOURCES: Array<{ id: SourceName; name: string; description: string }> = [
  { id: 'devto', name: 'Dev.to', description: 'Artigos de desenvolvimento' },
  { id: 'hackernews', name: 'Hacker News', description: 'Noticias de tecnologia' },
  { id: 'reddit', name: 'Reddit', description: 'Comunidades tech' },
];

export function PipelineControls({
  status,
  isStarting,
  isCancelling,
  isRetrying,
  onStart,
  onCancel,
  onRetry,
  className,
}: PipelineControlsProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [selectedSources, setSelectedSources] = useState<SourceName[]>([
    'devto',
    'hackernews',
    'reddit',
  ]);
  const [limit, setLimit] = useState(50);

  const isRunning = status === 'running';
  const isFailed = status === 'failed';
  const canStart = !status || status === 'completed' || status === 'cancelled';

  const handleStart = () => {
    onStart({
      sources: selectedSources,
      limit,
    });
  };

  const toggleSource = (sourceId: SourceName) => {
    setSelectedSources((prev) =>
      prev.includes(sourceId)
        ? prev.filter((s) => s !== sourceId)
        : [...prev, sourceId]
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main action buttons */}
      <div className="flex items-center gap-3">
        {canStart && (
          <Button
            onClick={handleStart}
            disabled={isStarting || selectedSources.length === 0}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            {isStarting ? 'Iniciando...' : 'Pesquisar e Curar'}
          </Button>
        )}

        {isRunning && (
          <Button
            variant="destructive"
            onClick={onCancel}
            disabled={isCancelling}
            className="gap-2"
          >
            <Square className="h-4 w-4" />
            {isCancelling ? 'Cancelando...' : 'Cancelar'}
          </Button>
        )}

        {isFailed && (
          <Button
            variant="outline"
            onClick={onRetry}
            disabled={isRetrying}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {isRetrying ? 'Retentando...' : 'Tentar Novamente'}
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSettings(!showSettings)}
          className={cn(showSettings && 'bg-gray-100 dark:bg-gray-800')}
          disabled={isRunning}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Settings panel */}
      {showSettings && !isRunning && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Fontes</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SOURCES.map((source) => (
                <button
                  key={source.id}
                  onClick={() => toggleSource(source.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm transition-colors',
                    selectedSources.includes(source.id)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  )}
                  title={source.description}
                >
                  {source.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Limite de resultados: {limit}
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="10"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>10</span>
              <span>100</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
