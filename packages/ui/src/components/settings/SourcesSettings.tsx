import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { HelpCircle, Globe } from 'lucide-react';
import type { SourcesSettings as SourcesSettingsType } from '@social-content/shared';
import { cn } from '../../lib/utils';

interface SourcesSettingsProps {
  sources: SourcesSettingsType;
  onChange: (sources: SourcesSettingsType) => void;
  errors?: string;
}

const sourceInfo: Record<
  keyof SourcesSettingsType,
  { label: string; description: string; color: string }
> = {
  devto: {
    label: 'Dev.to',
    description: 'Artigos e posts da comunidade de desenvolvedores',
    color: 'bg-black text-white',
  },
  hackernews: {
    label: 'Hacker News',
    description: 'Noticias e discussoes sobre tecnologia',
    color: 'bg-orange-500 text-white',
  },
  reddit: {
    label: 'Reddit',
    description: 'Subreddits de programacao (r/programming, r/webdev)',
    color: 'bg-orange-600 text-white',
  },
};

export function SourcesSettings({ sources, onChange, errors }: SourcesSettingsProps) {
  const handleToggle = (key: keyof SourcesSettingsType) => {
    const newSources = { ...sources, [key]: !sources[key] };

    // Validar: pelo menos uma fonte ativa
    const hasActiveSource = Object.values(newSources).some(Boolean);
    if (!hasActiveSource) {
      return; // Nao permite desativar a ultima fonte
    }

    onChange(newSources);
  };

  const activeCount = Object.values(sources).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Selecione as fontes de onde buscar tendencias tech. Pelo menos uma fonte deve estar ativa.
      </div>

      <div className="space-y-4">
        {(Object.keys(sourceInfo) as Array<keyof SourcesSettingsType>).map((key) => {
          const info = sourceInfo[key];
          const isActive = sources[key];
          const isLastActive = isActive && activeCount === 1;

          return (
            <div
              key={key}
              className={cn(
                'flex items-center justify-between p-4 rounded-lg border transition-colors',
                isActive ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn('h-8 w-8 rounded flex items-center justify-center', info.color)}>
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <Label htmlFor={key} className="text-base font-medium">
                    {info.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{info.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isLastActive && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>Pelo menos uma fonte deve estar ativa</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <Switch
                  id={key}
                  checked={isActive}
                  onCheckedChange={() => handleToggle(key)}
                  disabled={isLastActive}
                />
              </div>
            </div>
          );
        })}
      </div>

      {errors && <p className="text-sm text-destructive mt-2">{errors}</p>}
    </div>
  );
}
