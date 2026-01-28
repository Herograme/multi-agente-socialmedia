import { Clock } from 'lucide-react';
import { CuratedContentFilter } from './CuratedContentFilter';
import { formatDateTime } from '../../lib/date';
import type { CuratedContentType } from '@social-content/shared';

type FilterValue = CuratedContentType | 'all';

interface CuratedMetadata {
  executionId?: string;
  totalProcessed: number;
  timestamp: string;
  duration?: number;
}

interface CuratedContentHeaderProps {
  metadata?: CuratedMetadata;
  selectedType: FilterValue;
  onTypeChange: (type: FilterValue) => void;
}

export function CuratedContentHeader({
  metadata,
  selectedType,
  onTypeChange,
}: CuratedContentHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Conteudo Curado</h1>
          <p className="text-muted-foreground">
            Snippets de codigo e recursos extraidos das tendencias pesquisadas
          </p>
        </div>

        {metadata && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Atualizado em {formatDateTime(metadata.timestamp)}</span>
          </div>
        )}
      </div>

      <CuratedContentFilter value={selectedType} onChange={onTypeChange} />
    </div>
  );
}
