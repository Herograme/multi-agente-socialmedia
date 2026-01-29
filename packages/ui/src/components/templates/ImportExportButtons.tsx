/**
 * ImportExportButtons Component
 * Story 5.7 - Editor de Templates de Carrossel
 *
 * Buttons for importing and exporting template JSON.
 */

import { useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import type { ExportedTemplate } from '@social-content/shared';

interface ImportExportButtonsProps {
  templateId?: string;
  onExport?: () => void;
  onImport?: (json: ExportedTemplate) => void;
  isExporting?: boolean;
  isImporting?: boolean;
}

export function ImportExportButtons({
  templateId,
  onExport,
  onImport,
  isExporting,
  isImporting,
}: ImportExportButtonsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewDialog, setPreviewDialog] = useState<{
    isOpen: boolean;
    json: ExportedTemplate | null;
    error: string | null;
  }>({
    isOpen: false,
    json: null,
    error: null,
  });

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const json = JSON.parse(content) as ExportedTemplate;

      // Validate basic structure
      if (json.version !== '1.0') {
        throw new Error(`Versao nao suportada: ${json.version}`);
      }
      if (!json.template || !json.template.name || !json.template.theme) {
        throw new Error('Estrutura do arquivo invalida');
      }

      // Show preview dialog
      setPreviewDialog({
        isOpen: true,
        json,
        error: null,
      });
    } catch (error) {
      setPreviewDialog({
        isOpen: true,
        json: null,
        error: error instanceof Error ? error.message : 'Erro ao ler arquivo',
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (previewDialog.json && onImport) {
      onImport(previewDialog.json);
    }
    setPreviewDialog({ isOpen: false, json: null, error: null });
  };

  const handleCancelImport = () => {
    setPreviewDialog({ isOpen: false, json: null, error: null });
  };

  return (
    <>
      <div className="flex gap-2">
        {templateId && onExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exportando...' : 'Exportar JSON'}
          </Button>
        )}

        {onImport && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportClick}
            disabled={isImporting}
          >
            {isImporting ? 'Importando...' : 'Importar JSON'}
          </Button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Import Preview Dialog */}
      {previewDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>
                {previewDialog.error ? 'Erro ao Importar' : 'Preview do Template'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {previewDialog.error ? (
                <div className="text-destructive">
                  <p className="font-medium">Falha ao processar arquivo:</p>
                  <p className="mt-2">{previewDialog.error}</p>
                </div>
              ) : previewDialog.json ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{previewDialog.json.template.name}</p>
                  </div>
                  {previewDialog.json.template.description && (
                    <div>
                      <p className="text-sm text-muted-foreground">Descricao</p>
                      <p>{previewDialog.json.template.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Exportado em</p>
                    <p>{new Date(previewDialog.json.exportedAt).toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Cores</p>
                    <div className="flex gap-2">
                      {Object.entries(previewDialog.json.template.theme.colors)
                        .slice(0, 5)
                        .map(([key, color]) => (
                          <div
                            key={key}
                            className="w-8 h-8 rounded border"
                            style={{ backgroundColor: color }}
                            title={key}
                          />
                        ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancelImport}>
                Cancelar
              </Button>
              {!previewDialog.error && (
                <Button onClick={handleConfirmImport} disabled={isImporting}>
                  {isImporting ? 'Importando...' : 'Importar Template'}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}
