import { useState, useCallback } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button, type ButtonProps } from '../ui/button';
import { formatFileSize } from '../../lib/fileSize';

export interface DownloadButtonProps {
  /** URL of the file to download */
  url: string;
  /** Filename for the downloaded file */
  filename: string;
  /** File size in bytes (optional) */
  size?: number;
  /** Button label */
  label: string;
  /** Button variant */
  variant?: ButtonProps['variant'];
  /** Additional className */
  className?: string;
  /** Callback when download completes */
  onComplete?: () => void;
  /** Callback when download fails */
  onError?: (error: Error) => void;
}

export function DownloadButton({
  url,
  filename,
  size,
  label,
  variant = 'default',
  className,
  onComplete,
  onError,
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    setProgress(0);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      const reader = response.body?.getReader();
      const chunks: ArrayBuffer[] = [];
      let received = 0;

      if (reader) {
        let done = false;
        while (!done) {
          const result = await reader.read();
          done = result.done;
          if (result.value) {
            chunks.push(result.value.buffer as ArrayBuffer);
            received += result.value.length;

            if (total > 0) {
              setProgress(Math.round((received / total) * 100));
            }
          }
        }
      }

      // Create blob and trigger download
      const blob = new Blob(chunks);
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(downloadUrl);

      onComplete?.();
    } catch (error) {
      console.error('Download error:', error);
      onError?.(error instanceof Error ? error : new Error('Download failed'));
    } finally {
      setIsDownloading(false);
      setProgress(0);
    }
  }, [url, filename, onComplete, onError]);

  return (
    <Button
      variant={variant}
      onClick={handleDownload}
      disabled={isDownloading}
      className={className}
      aria-label={isDownloading ? 'Downloading...' : label}
    >
      {isDownloading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {progress > 0 ? `${progress}%` : 'Baixando...'}
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          {label}
          {size !== undefined && size > 0 && (
            <span className="ml-2 text-xs opacity-70">
              ({formatFileSize(size)})
            </span>
          )}
        </>
      )}
    </Button>
  );
}
