import { useState, useCallback } from 'react';
import {
  Loader2,
  FileWarning,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button } from '../ui/button';
import { DownloadButton } from './DownloadButton';
import { formatFileSize } from '../../lib/fileSize';

export interface PDFViewerProps {
  /** URL of the PDF file */
  pdfUrl: string;
  /** File size in bytes (optional) */
  size?: number;
  /** Callback when download is triggered */
  onDownload?: () => void;
  /** Filename for downloads */
  filename?: string;
}

export function PDFViewer({
  pdfUrl,
  size,
  onDownload,
  filename = 'document.pdf',
}: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setError('Erro ao carregar PDF. Tente baixar o arquivo diretamente.');
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Error fallback state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 border rounded-lg bg-muted/50">
        <FileWarning className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4 text-center px-4">{error}</p>
        <DownloadButton
          url={pdfUrl}
          filename={filename}
          size={size}
          label={`Baixar PDF${size ? ` (${formatFileSize(size)})` : ''}`}
          onComplete={onDownload}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Visualizador de PDF
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div
        className={`border rounded-lg overflow-hidden bg-muted/50 relative ${
          isFullscreen ? 'fixed inset-4 z-50' : 'h-[600px]'
        }`}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Carregando PDF...</span>
            </div>
          </div>
        )}

        {/* Using iframe for PDF preview - works in most modern browsers */}
        <iframe
          src={`${pdfUrl}#toolbar=1&navpanes=0`}
          title="PDF Preview"
          className="w-full h-full border-0"
          onLoad={handleLoad}
          onError={handleError}
        />

        {/* Fullscreen close button */}
        {isFullscreen && (
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 z-20"
          >
            <Minimize2 className="h-4 w-4 mr-2" />
            Fechar
          </Button>
        )}
      </div>

      {/* Download Button */}
      <DownloadButton
        url={pdfUrl}
        filename={filename}
        size={size}
        label="Baixar PDF"
        onComplete={onDownload}
      />
    </div>
  );
}
