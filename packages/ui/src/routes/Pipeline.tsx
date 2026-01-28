/**
 * Pipeline Page
 * Main page for running the research-curate pipeline
 */

import { Workflow } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { PipelineProgress } from '../components/pipeline/PipelineProgress';
import { PipelineControls } from '../components/pipeline/PipelineControls';
import { PipelineResults } from '../components/pipeline/PipelineResults';
import { usePipeline } from '../hooks/usePipeline';
import type { PipelineStatus } from '../lib/api';

export function Pipeline() {
  const {
    state,
    isComplete,
    startPipeline,
    cancelPipeline,
    retryPipeline,
    isStarting,
    isCancelling,
    isRetrying,
  } = usePipeline({
    onComplete: () => {
      // Could show a toast notification here
    },
    onError: (error) => {
      console.error('Pipeline error:', error);
      // Could show an error toast here
    },
  });

  const hasProgress = state.steps.length > 0 && state.status !== null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Workflow className="h-6 w-6" />
          Pipeline de Conteudo
        </h1>
        <p className="text-gray-500 mt-1">
          Execute pesquisa e curadoria de conteudo em um unico fluxo automatizado.
        </p>
      </div>

      {/* Main content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Control panel */}
        <Card>
          <CardHeader>
            <CardTitle>Pesquisar e Curar</CardTitle>
            <CardDescription>
              Descubra tendencias de multiplas fontes e gere conteudo curado automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PipelineControls
              status={state.status}
              isStarting={isStarting}
              isCancelling={isCancelling}
              isRetrying={isRetrying}
              onStart={startPipeline}
              onCancel={cancelPipeline}
              onRetry={retryPipeline}
            />
          </CardContent>
        </Card>

        {/* Progress panel */}
        {hasProgress ? (
          <Card>
            <CardHeader>
              <CardTitle>Progresso</CardTitle>
              {state.pipelineId && (
                <CardDescription className="font-mono text-xs">
                  ID: {state.pipelineId}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <PipelineProgress
                steps={state.steps}
                currentStep={state.progress.currentStep}
                status={state.status as PipelineStatus}
                percentComplete={state.progress.percentComplete}
              />
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Error display */}
      {state.error ? (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-300">Erro no Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 dark:text-red-400">{state.error}</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Results display */}
      {isComplete && state.finalOutput ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Resultados</h2>
          <PipelineResults
            output={state.finalOutput}
            startedAt={state.startedAt}
            completedAt={state.completedAt}
          />
        </div>
      ) : null}

      {/* Info panel when idle */}
      {!state.status ? (
        <Card>
          <CardContent className="py-6">
            <div className="text-center space-y-3">
              <Workflow className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="font-medium">Pipeline de Pesquisa e Curadoria</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                O pipeline executa automaticamente os seguintes passos:
              </p>
              <ol className="text-sm text-gray-600 dark:text-gray-400 list-decimal list-inside text-left max-w-xs mx-auto space-y-1">
                <li>Pesquisa tendencias em Dev.to, Hacker News e Reddit</li>
                <li>Deduplica e ordena os resultados</li>
                <li>Cura o conteudo para diferentes plataformas</li>
                <li>Gera posts prontos para Instagram, LinkedIn e Twitter</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
