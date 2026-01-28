import { Search, RefreshCw, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { formatDateTime } from '../../lib/date';

interface TrendMetadata {
  executionId?: string;
  sourcesQueried: string[];
  totalFound: number;
  timestamp: string;
  duration?: number;
}

interface TrendHeaderProps {
  metadata?: TrendMetadata;
  isRunning: boolean;
  onResearch: () => void;
}

export function TrendHeader({ metadata, isRunning, onResearch }: TrendHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold">Tendencias</h1>
        <p className="text-muted-foreground">
          Descubra as ultimas tendencias tech para criar conteudo relevante
        </p>
      </div>

      <div className="flex flex-col items-end gap-2">
        <Button
          onClick={() => onResearch()}
          disabled={isRunning}
          className="gap-2"
        >
          {isRunning ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Pesquisando...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Pesquisar Agora
            </>
          )}
        </Button>

        {metadata && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Atualizado em {formatDateTime(metadata.timestamp)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
