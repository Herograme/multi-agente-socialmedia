import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import type { QualitySettings as QualitySettingsType } from '@social-content/shared';
import { cn } from '../../lib/utils';

interface QualitySettingsProps {
  quality: QualitySettingsType;
  onChange: (quality: QualitySettingsType) => void;
  errors?: Record<string, string>;
}

const thresholdLabels = [
  { value: 0, label: 'Muito Baixo', color: 'text-red-500', bg: 'bg-red-500' },
  { value: 2, label: 'Baixo', color: 'text-orange-500', bg: 'bg-orange-500' },
  { value: 4, label: 'Moderado', color: 'text-yellow-500', bg: 'bg-yellow-500' },
  { value: 6, label: 'Bom', color: 'text-green-500', bg: 'bg-green-500' },
  { value: 8, label: 'Excelente', color: 'text-emerald-500', bg: 'bg-emerald-500' },
  { value: 10, label: 'Perfeito', color: 'text-cyan-500', bg: 'bg-cyan-500' },
];

function getThresholdLabel(value: number) {
  return thresholdLabels.reduce((prev, curr) =>
    Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev
  );
}

export function QualitySettings({ quality, onChange, errors }: QualitySettingsProps) {
  const thresholdInfo = getThresholdLabel(quality.threshold);

  const handleThresholdChange = (value: number[]) => {
    const newValue = value[0];
    if (newValue !== undefined) {
      const rounded = Math.round(newValue * 10) / 10;
      onChange({ ...quality, threshold: rounded });
    }
  };

  const handleThresholdInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 10) {
      onChange({ ...quality, threshold: Math.round(value * 10) / 10 });
    }
  };

  const handleAutoRegenerateChange = (checked: boolean) => {
    onChange({ ...quality, autoRegenerate: checked });
  };

  const handleMaxRegenerationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 5) {
      onChange({ ...quality, maxRegenerations: value });
    }
  };

  return (
    <div className="space-y-6">
      {/* Threshold de Score */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Threshold de Qualidade</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={10}
              step={0.1}
              value={quality.threshold}
              onChange={handleThresholdInput}
              className="w-20 text-center"
            />
            <span className={cn('text-sm font-medium', thresholdInfo.color)}>
              {thresholdInfo.label}
            </span>
          </div>
        </div>

        <Slider
          value={[quality.threshold]}
          onValueChange={handleThresholdChange}
          min={0}
          max={10}
          step={0.1}
          className="w-full"
        />

        {/* Visual scale */}
        <div className="flex justify-between pt-2">
          {thresholdLabels.map((item) => (
            <div key={item.value} className="flex flex-col items-center">
              <div
                className={cn(
                  'w-3 h-3 rounded-full mb-1',
                  item.bg,
                  quality.threshold >= item.value ? 'opacity-100' : 'opacity-30'
                )}
              />
              <span className="text-xs text-muted-foreground">{item.value}</span>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          Posts com score abaixo de{' '}
          <span className={cn('font-medium', thresholdInfo.color)}>{quality.threshold}</span> serao
          marcados para revisao manual ou regenerados automaticamente.
        </p>

        {errors?.threshold && <p className="text-sm text-destructive">{errors.threshold}</p>}
      </div>

      {/* Auto Regenerate */}
      <div className="flex items-center justify-between p-4 rounded-lg border">
        <div>
          <Label htmlFor="autoRegenerate" className="text-base font-medium">
            Regenerar Automaticamente
          </Label>
          <p className="text-sm text-muted-foreground">
            Tenta gerar novamente posts que nao atingem o threshold
          </p>
        </div>
        <Switch
          id="autoRegenerate"
          checked={quality.autoRegenerate}
          onCheckedChange={handleAutoRegenerateChange}
        />
      </div>

      {/* Max Regeneracoes */}
      {quality.autoRegenerate && (
        <div className="space-y-2">
          <Label htmlFor="maxRegenerations">Maximo de Tentativas</Label>
          <Input
            id="maxRegenerations"
            type="number"
            min={1}
            max={5}
            value={quality.maxRegenerations}
            onChange={handleMaxRegenerationsChange}
            className="w-24"
          />
          <p className="text-sm text-muted-foreground">
            Numero maximo de vezes que o sistema tentara regenerar um post (1-5)
          </p>
          {errors?.maxRegenerations && (
            <p className="text-sm text-destructive">{errors.maxRegenerations}</p>
          )}
        </div>
      )}

      {/* Explicacao visual */}
      <div className="p-4 rounded-lg bg-muted/30 border">
        <h4 className="text-sm font-medium mb-2">Como funciona o Quality Gate</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>
            - Cada post gerado recebe um score de <strong>0 a 10</strong>
          </li>
          <li>
            - Posts com score {'>'} {quality.threshold} sao{' '}
            <span className="text-green-500">aprovados automaticamente</span>
          </li>
          <li>
            - Posts com score {'<'} {quality.threshold}{' '}
            {quality.autoRegenerate ? (
              <>
                sao <span className="text-yellow-500">regenerados</span> ate{' '}
                {quality.maxRegenerations}x
              </>
            ) : (
              <>
                sao marcados para <span className="text-yellow-500">revisao manual</span>
              </>
            )}
          </li>
        </ul>
      </div>
    </div>
  );
}
