/**
 * Pipeline Results Component
 * Displays the final output of a completed pipeline
 */

import { CheckCircle, FileText, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

export interface PipelineResultsProps {
  output: unknown;
  startedAt: string | null;
  completedAt: string | null;
  className?: string;
}

interface ResearchOutput {
  trends?: Array<{
    id: string;
    title: string;
    source: string;
    url?: string;
  }>;
  metadata?: {
    sourcesQueried: string[];
    totalFound: number;
  };
}

interface CurationOutput {
  result?: {
    content: Array<{
      id: string;
      title: string;
      summary: string;
    }>;
    stats?: {
      totalProcessed: number;
      totalCurated: number;
    };
  };
}

interface PipelineOutput {
  research?: ResearchOutput;
  curate?: CurationOutput;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function getDuration(startedAt: string, completedAt: string): string {
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const duration = end - start;

  if (duration < 1000) {
    return `${duration}ms`;
  }
  const seconds = Math.round(duration / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function PipelineResults({
  output,
  startedAt,
  completedAt,
  className,
}: PipelineResultsProps) {
  const data = output as PipelineOutput | null;

  if (!data) {
    return null;
  }

  const researchData = data.research;
  const curationData = data.curate;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Pipeline Concluido
            </CardTitle>
            {startedAt && completedAt && (
              <Badge variant="outline">
                {getDuration(startedAt, completedAt)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {startedAt && (
              <div>
                <span className="text-gray-500">Iniciado:</span>
                <span className="ml-2">{formatDate(startedAt)}</span>
              </div>
            )}
            {completedAt && (
              <div>
                <span className="text-gray-500">Concluido:</span>
                <span className="ml-2">{formatDate(completedAt)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Research results */}
      {researchData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Resultados da Pesquisa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {researchData.metadata && (
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>
                    Fontes: {researchData.metadata.sourcesQueried?.join(', ')}
                  </span>
                  <span>
                    Total encontrado: {researchData.metadata.totalFound}
                  </span>
                </div>
              )}

              {researchData.trends && researchData.trends.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium mb-2">
                    Tendencias ({researchData.trends.length})
                  </h4>
                  <ul className="space-y-1 max-h-40 overflow-y-auto">
                    {researchData.trends.slice(0, 10).map((trend) => (
                      <li
                        key={trend.id}
                        className="text-sm py-1 px-2 bg-gray-50 dark:bg-gray-800 rounded"
                      >
                        {trend.url ? (
                          <a
                            href={trend.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {trend.title}
                          </a>
                        ) : (
                          trend.title
                        )}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {trend.source}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                  {researchData.trends.length > 10 && (
                    <p className="text-xs text-gray-500 mt-2">
                      E mais {researchData.trends.length - 10} tendencias...
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Curation results */}
      {curationData && curationData.result && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Conteudo Curado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {curationData.result.stats && (
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>
                    Processados: {curationData.result.stats.totalProcessed}
                  </span>
                  <span>
                    Curados: {curationData.result.stats.totalCurated}
                  </span>
                </div>
              )}

              {curationData.result.content && curationData.result.content.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium mb-2">
                    Conteudo ({curationData.result.content.length})
                  </h4>
                  <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {curationData.result.content.slice(0, 5).map((item) => (
                      <li
                        key={item.id}
                        className="p-2 bg-gray-50 dark:bg-gray-800 rounded"
                      >
                        <h5 className="font-medium text-sm">{item.title}</h5>
                        {item.summary && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {item.summary}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                  {curationData.result.content.length > 5 && (
                    <p className="text-xs text-gray-500 mt-2">
                      E mais {curationData.result.content.length - 5} itens...
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
