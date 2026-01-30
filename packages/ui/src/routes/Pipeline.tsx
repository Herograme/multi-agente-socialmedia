/**
 * Pipeline Page
 * Main page for running the research-curate pipeline
 */

import { Workflow } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { PipelineProgress } from '../components/pipeline/PipelineProgress';
import { PipelineControls } from '../components/pipeline/PipelineControls';
import { PipelineResults } from '../components/pipeline/PipelineResults';
import { PipelineStepper } from '../components/pipeline/PipelineStepper';
import { usePipeline } from '../hooks/usePipeline';
import type { PipelineStatus, StepStatus } from '../lib/api';

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

      {/* Visual Stepper - shows during execution */}
      {hasProgress && (
        <Card>
          <CardHeader>
            <CardTitle>Fluxo do Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineStepper
              steps={state.steps.map((step) => ({
                id: step.name,
                name: step.name,
                status: step.status as StepStatus,
                duration: step.duration,
                error: step.error,
              }))}
            />
          </CardContent>
        </Card>
      )}

      {/* Info panel when idle */}
      {!state.status ? (
        <Card>
          <CardContent className="py-6">
            <div className="text-center space-y-4">
              <Workflow className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="font-medium">Pipeline de Pesquisa e Curadoria</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                O pipeline executa automaticamente os seguintes passos:
              </p>
              <PipelineStepper steps={[]} className="mb-4" />
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Clique em "Pesquisar e Curar" para iniciar a execucao automatizada.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
