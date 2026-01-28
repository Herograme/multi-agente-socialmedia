import { useState, useCallback, useEffect, useRef } from 'react';
import { Image, Loader2, Wand2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

export interface GenerateVisualButtonProps {
  /** Post ID to generate visuals for */
  postId: string;
  /** API base URL (optional) */
  apiBaseUrl?: string;
  /** Callback when generation completes successfully */
  onComplete?: () => void;
  /** Callback when generation fails */
  onError?: (error: Error) => void;
  /** Whether to generate carousel */
  generateCarousel?: boolean;
  /** Whether to generate PDF */
  generatePdf?: boolean;
  /** Number of slides for carousel */
  numSlides?: number;
}

type GenerationStatus = 'idle' | 'starting' | 'generating' | 'completed' | 'error';

export function GenerateVisualButton({
  postId,
  apiBaseUrl = '',
  onComplete,
  onError,
  generateCarousel = true,
  generatePdf = true,
  numSlides = 10,
}: GenerateVisualButtonProps) {
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const pollingRef = useRef<number | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, []);

  const pollStatus = useCallback(
    async (executionId: string) => {
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/pipeline/status/${executionId}`
        );

        if (!response.ok) {
          throw new Error('Failed to get generation status');
        }

        const data = await response.json();

        setStatusMessage(data.currentAgent || data.status || 'Processando...');

        if (data.status === 'completed') {
          setStatus('completed');
          setStatusMessage('Assets visuais gerados com sucesso!');
          onComplete?.();

          // Reset to idle after showing success
          setTimeout(() => {
            setStatus('idle');
            setStatusMessage('');
          }, 3000);
        } else if (data.status === 'error' || data.status === 'failed') {
          throw new Error(data.error || 'Generation failed');
        } else {
          // Continue polling
          pollingRef.current = window.setTimeout(
            () => pollStatus(executionId),
            2000
          );
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        setStatus('error');
        setErrorMessage(err.message);
        onError?.(err);
      }
    },
    [apiBaseUrl, onComplete, onError]
  );

  const handleGenerate = useCallback(async () => {
    setStatus('starting');
    setStatusMessage('Iniciando geracao visual...');
    setErrorMessage('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/pipeline/visual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          gerar_carousel: generateCarousel,
          gerar_pdf: generatePdf,
          num_slides: numSlides,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to start visual generation: ${response.statusText}`
        );
      }

      const { executionId, pipelineId } = await response.json();
      const id = executionId || pipelineId;

      if (!id) {
        throw new Error('No execution ID returned from API');
      }

      setStatus('generating');
      setStatusMessage('Gerando assets visuais...');

      // Start polling for status
      pollStatus(id);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setStatus('error');
      setErrorMessage(err.message);
      onError?.(err);
    }
  }, [
    apiBaseUrl,
    postId,
    generateCarousel,
    generatePdf,
    numSlides,
    pollStatus,
    onError,
  ]);

  const handleRetry = useCallback(() => {
    setStatus('idle');
    setErrorMessage('');
    setStatusMessage('');
  }, []);

  const isGenerating = status === 'starting' || status === 'generating';

  return (
    <Card className="border border-dashed p-8">
      <div className="flex flex-col items-center justify-center text-center">
        {status === 'completed' ? (
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
        ) : status === 'error' ? (
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        ) : (
          <Image className="h-12 w-12 text-muted-foreground mb-4" />
        )}

        <h3 className="text-lg font-medium mb-2">
          {status === 'completed'
            ? 'Geracao Concluida!'
            : status === 'error'
            ? 'Erro na Geracao'
            : 'Sem Assets Visuais'}
        </h3>

        <p className="text-muted-foreground mb-4 max-w-sm">
          {status === 'completed'
            ? statusMessage
            : status === 'error'
            ? errorMessage
            : isGenerating
            ? statusMessage
            : 'Este post ainda nao possui carrossel ou PDF gerados. Clique para gerar automaticamente.'}
        </p>

        {status === 'error' ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRetry}>
              Voltar
            </Button>
            <Button onClick={handleGenerate}>Tentar Novamente</Button>
          </div>
        ) : status !== 'completed' ? (
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {statusMessage || 'Gerando...'}
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Gerar Visual
              </>
            )}
          </Button>
        ) : null}

        {/* Generation progress indicator */}
        {isGenerating && (
          <div className="mt-4 w-full max-w-xs">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-pulse w-2/3" />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
