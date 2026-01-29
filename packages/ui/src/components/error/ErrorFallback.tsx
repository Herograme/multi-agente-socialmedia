import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface ErrorFallbackProps {
  /** The error that was caught */
  error: Error | null;
  /** Callback to retry/reset the error state */
  onRetry?: () => void;
  /** Show "Go Home" button */
  showHomeButton?: boolean;
  /** Show "Report Problem" button */
  showReportButton?: boolean;
  /** Custom title */
  title?: string;
  /** Custom description */
  description?: string;
}

/**
 * Error Fallback component
 * Friendly error UI shown when an error is caught by ErrorBoundary.
 *
 * Story 5.8: Error Boundaries
 */
export function ErrorFallback({
  error,
  onRetry,
  showHomeButton = true,
  showReportButton = false,
  title = 'Algo deu errado',
  description = 'Ocorreu um erro inesperado. Nossa equipe foi notificada.',
}: ErrorFallbackProps) {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReport = () => {
    // Create GitHub issue or open support link
    const issueBody = encodeURIComponent(
      `## Error Report\n\n**Error Message:** ${error?.message || 'Unknown error'}\n\n**Stack Trace:**\n\`\`\`\n${error?.stack || 'No stack trace available'}\n\`\`\`\n\n**Steps to Reproduce:**\n1. \n2. \n3. \n\n**Expected Behavior:**\n\n**Actual Behavior:**\n`
    );
    window.open(
      `https://github.com/your-org/social-content-agent/issues/new?title=Error Report: ${encodeURIComponent(error?.message || 'Unknown error')}&body=${issueBody}`,
      '_blank'
    );
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6" data-testid="error-fallback">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-semibold mb-2">{title}</h2>

            {/* Description */}
            <p className="text-muted-foreground text-sm mb-4">{description}</p>

            {/* Technical Details (dev only) */}
            {error && process.env.NODE_ENV === 'development' && (
              <details className="w-full mb-4 text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  Detalhes tecnicos (dev only)
                </summary>
                <div className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-40">
                  <p className="font-medium text-destructive mb-2">{error.message}</p>
                  {error.stack && (
                    <pre className="whitespace-pre-wrap text-muted-foreground font-mono text-[10px]">
                      {error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-center">
              {onRetry && (
                <Button onClick={onRetry} variant="default">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
              )}
              {showHomeButton && (
                <Button onClick={handleGoHome} variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Ir para Inicio
                </Button>
              )}
              {showReportButton && (
                <Button onClick={handleReport} variant="ghost" size="sm">
                  <Bug className="h-4 w-4 mr-2" />
                  Reportar Problema
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Minimal error fallback for inline components
 */
interface InlineErrorFallbackProps {
  error: Error | null;
  onRetry?: () => void;
}

export function InlineErrorFallback({ error, onRetry }: InlineErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center p-4 bg-destructive/10 rounded-lg border border-destructive/30">
      <div className="flex flex-col items-center text-center">
        <AlertTriangle className="h-6 w-6 text-destructive mb-2" />
        <p className="text-sm text-destructive font-medium mb-1">Erro ao carregar</p>
        {process.env.NODE_ENV === 'development' && error && (
          <p className="text-xs text-muted-foreground mb-2">{error.message}</p>
        )}
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="h-3 w-3 mr-1" />
            Tentar novamente
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Chart-specific error fallback
 */
export function ChartErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
      <div className="text-center">
        <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-2">Erro ao renderizar grafico</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            Recarregar
          </Button>
        )}
      </div>
    </div>
  );
}
