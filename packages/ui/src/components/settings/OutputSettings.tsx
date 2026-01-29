import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { FolderOpen, FileImage, FileText, Layout } from 'lucide-react';
import type { OutputSettings as OutputSettingsType, ImageResolution } from '@social-content/shared';
import { cn } from '../../lib/utils';

interface OutputSettingsProps {
  output: OutputSettingsType;
  onChange: (output: OutputSettingsType) => void;
  errors?: Record<string, string>;
}

const resolutions: Array<{ value: ImageResolution; label: string; description: string }> = [
  { value: '1080x1080', label: '1080 x 1080', description: 'Padrao Instagram' },
  { value: '1200x1200', label: '1200 x 1200', description: 'Alta qualidade' },
];

export function OutputSettings({ output, onChange, errors }: OutputSettingsProps) {
  const handleDirectoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...output, directory: e.target.value });
  };

  const handleCarouselChange = (checked: boolean) => {
    onChange({ ...output, enableCarousel: checked });
  };

  const handlePdfChange = (checked: boolean) => {
    onChange({ ...output, enablePdf: checked });
  };

  const handleSlidesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 10) {
      onChange({ ...output, slidesPerCarousel: value });
    }
  };

  const handleResolutionChange = (resolution: string) => {
    onChange({ ...output, imageResolution: resolution as ImageResolution });
  };

  return (
    <div className="space-y-6">
      {/* Diretorio de Saida */}
      <div className="space-y-2">
        <Label htmlFor="outputDirectory" className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          Diretorio de Saida
        </Label>
        <Input
          id="outputDirectory"
          value={output.directory}
          onChange={handleDirectoryChange}
          placeholder="./output"
          className="w-full"
        />
        <p className="text-sm text-muted-foreground">
          Pasta onde os arquivos gerados serao salvos (relativo ao projeto)
        </p>
        {errors?.directory && <p className="text-sm text-destructive">{errors.directory}</p>}
      </div>

      {/* Formatos habilitados */}
      <div className="space-y-4">
        <Label>Formatos de Saida</Label>

        <div className="grid grid-cols-2 gap-4">
          {/* Carousel */}
          <div
            className={cn(
              'p-4 rounded-lg border cursor-pointer transition-colors',
              output.enableCarousel
                ? 'bg-primary/10 border-primary'
                : 'bg-muted/30 hover:bg-muted/50'
            )}
            onClick={() => handleCarouselChange(!output.enableCarousel)}
          >
            <div className="flex items-center gap-3">
              <Checkbox
                id="enableCarousel"
                checked={output.enableCarousel}
                onCheckedChange={handleCarouselChange}
              />
              <div className="flex items-center gap-2">
                <Layout className="h-5 w-5 text-blue-500" />
                <div>
                  <Label htmlFor="enableCarousel" className="font-medium cursor-pointer">
                    Carousel
                  </Label>
                  <p className="text-xs text-muted-foreground">Imagens em sequencia</p>
                </div>
              </div>
            </div>
          </div>

          {/* PDF */}
          <div
            className={cn(
              'p-4 rounded-lg border cursor-pointer transition-colors',
              output.enablePdf ? 'bg-primary/10 border-primary' : 'bg-muted/30 hover:bg-muted/50'
            )}
            onClick={() => handlePdfChange(!output.enablePdf)}
          >
            <div className="flex items-center gap-3">
              <Checkbox
                id="enablePdf"
                checked={output.enablePdf}
                onCheckedChange={handlePdfChange}
              />
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-500" />
                <div>
                  <Label htmlFor="enablePdf" className="font-medium cursor-pointer">
                    PDF
                  </Label>
                  <p className="text-xs text-muted-foreground">Documento para download</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slides por Carousel */}
      {output.enableCarousel && (
        <div className="space-y-2">
          <Label htmlFor="slidesPerCarousel">Slides por Carousel</Label>
          <Input
            id="slidesPerCarousel"
            type="number"
            min={1}
            max={10}
            value={output.slidesPerCarousel}
            onChange={handleSlidesChange}
            className="w-24"
          />
          <p className="text-sm text-muted-foreground">
            Numero de imagens em cada carousel (1-10). Instagram permite ate 10.
          </p>
          {errors?.slidesPerCarousel && (
            <p className="text-sm text-destructive">{errors.slidesPerCarousel}</p>
          )}
        </div>
      )}

      {/* Resolucao */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <FileImage className="h-4 w-4" />
          Resolucao de Imagens
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {resolutions.map((res) => (
            <button
              key={res.value}
              type="button"
              onClick={() => handleResolutionChange(res.value)}
              className={cn(
                'p-3 rounded-lg border text-left transition-colors',
                output.imageResolution === res.value
                  ? 'bg-primary/10 border-primary'
                  : 'bg-muted/30 hover:bg-muted/50'
              )}
            >
              <span className="block font-medium text-sm">{res.label}</span>
              <span className="block text-xs text-muted-foreground">{res.description}</span>
            </button>
          ))}
        </div>
        {errors?.imageResolution && (
          <p className="text-sm text-destructive">{errors.imageResolution}</p>
        )}
      </div>

      {/* Preview da estrutura de saida */}
      <div className="p-4 rounded-lg bg-muted/30 border">
        <h4 className="text-sm font-medium mb-2">Estrutura de Saida</h4>
        <pre className="text-xs text-muted-foreground font-mono">
          {output.directory}/
          {'\n'}  posts/
          {'\n'}    post-123/
          {output.enableCarousel && '\n      carousel/'}
          {output.enableCarousel && '\n        slide-01.png'}
          {output.enableCarousel && '\n        slide-02.png'}
          {output.enableCarousel && '\n        ...'}
          {output.enablePdf && '\n      post-123.pdf'}
          {'\n'}      metadata.json
        </pre>
      </div>
    </div>
  );
}
