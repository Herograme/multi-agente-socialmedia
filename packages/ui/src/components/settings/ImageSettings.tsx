import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Select, SelectOption } from '../ui/select';
import { Input } from '../ui/input';
import { ImageIcon, Wand2 } from 'lucide-react';
import type {
  ImageSettings as ImageSettingsType,
  ImageProviderType,
  AspectRatio,
} from '@social-content/shared';
import { cn } from '../../lib/utils';

interface ImageSettingsProps {
  image: ImageSettingsType;
  onChange: (image: ImageSettingsType) => void;
  errors?: Record<string, string>;
}

const providerInfo: Record<ImageProviderType, { label: string; description: string }> = {
  ideogram: {
    label: 'Ideogram',
    description: 'Otimo para imagens com texto e logos',
  },
  leonardo: {
    label: 'Leonardo.ai',
    description: 'Alta qualidade e estilos artisticos',
  },
};

const aspectRatios: Array<{ value: AspectRatio; label: string; description: string }> = [
  { value: '1:1', label: '1:1 (Quadrado)', description: 'Instagram Feed' },
  { value: '16:9', label: '16:9 (Paisagem)', description: 'LinkedIn, YouTube' },
  { value: '9:16', label: '9:16 (Retrato)', description: 'Stories, Reels' },
];

const suggestedStyles = [
  'tech, abstract, modern, dark background',
  'minimalist, clean, professional, gradient',
  'futuristic, neon, cyberpunk, digital',
  'corporate, business, blue tones, clean',
  'creative, colorful, dynamic, energetic',
];

export function ImageSettings({ image, onChange, errors }: ImageSettingsProps) {
  const handleProviderChange = (provider: string) => {
    onChange({ ...image, provider: provider as ImageProviderType });
  };

  const handleEnabledChange = (enabled: boolean) => {
    onChange({ ...image, enabled });
  };

  const handleStyleChange = (style: string) => {
    onChange({ ...image, preferredStyle: style });
  };

  const handleAspectRatioChange = (ratio: string) => {
    onChange({ ...image, aspectRatio: ratio as AspectRatio });
  };

  return (
    <div className="space-y-6">
      {/* Enable/Disable */}
      <div className="flex items-center justify-between p-4 rounded-lg border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <Label htmlFor="imageEnabled" className="text-base font-medium">
              Geracao de Imagens
            </Label>
            <p className="text-sm text-muted-foreground">
              Gerar imagens de fundo para os carousels
            </p>
          </div>
        </div>
        <Switch
          id="imageEnabled"
          checked={image.enabled}
          onCheckedChange={handleEnabledChange}
        />
      </div>

      {image.enabled && (
        <>
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="imageProvider">Provider de Imagens</Label>
            <Select
              id="imageProvider"
              value={image.provider}
              onValueChange={handleProviderChange}
            >
              {Object.entries(providerInfo).map(([key, info]) => (
                <SelectOption key={key} value={key}>
                  {info.label}
                </SelectOption>
              ))}
            </Select>
            <p className="text-sm text-muted-foreground">
              {providerInfo[image.provider].description}
            </p>
            {errors?.provider && (
              <p className="text-sm text-destructive">{errors.provider}</p>
            )}
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <Label>Aspect Ratio</Label>
            <div className="grid grid-cols-3 gap-3">
              {aspectRatios.map((ratio) => (
                <button
                  key={ratio.value}
                  type="button"
                  onClick={() => handleAspectRatioChange(ratio.value)}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-colors',
                    image.aspectRatio === ratio.value
                      ? 'bg-primary/10 border-primary'
                      : 'bg-muted/30 hover:bg-muted/50'
                  )}
                >
                  <span className="block font-medium text-sm">{ratio.label}</span>
                  <span className="block text-xs text-muted-foreground">{ratio.description}</span>
                </button>
              ))}
            </div>
            {errors?.aspectRatio && (
              <p className="text-sm text-destructive">{errors.aspectRatio}</p>
            )}
          </div>

          {/* Preferred Style */}
          <div className="space-y-2">
            <Label htmlFor="preferredStyle">Estilo Preferido</Label>
            <Input
              id="preferredStyle"
              value={image.preferredStyle}
              onChange={(e) => handleStyleChange(e.target.value)}
              placeholder="Ex: tech, abstract, modern, dark background"
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Palavras-chave que definem o estilo visual das imagens geradas
            </p>
            {errors?.preferredStyle && (
              <p className="text-sm text-destructive">{errors.preferredStyle}</p>
            )}
          </div>

          {/* Suggested Styles */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Estilos Sugeridos
            </Label>
            <div className="flex flex-wrap gap-2">
              {suggestedStyles.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => handleStyleChange(style)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs border transition-colors',
                    image.preferredStyle === style
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/30 hover:bg-muted/50'
                  )}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
