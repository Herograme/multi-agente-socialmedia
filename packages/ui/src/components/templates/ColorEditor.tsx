/**
 * ColorEditor Component
 * Story 5.7 - Editor de Templates de Carrossel
 *
 * Color picker panel for template theme customization.
 */

import { useCallback } from 'react';
import type { TemplateColors } from '@social-content/shared';

interface ColorEditorProps {
  colors: TemplateColors;
  onChange: (colors: TemplateColors) => void;
}

const COLOR_FIELDS: Array<{
  key: keyof TemplateColors;
  label: string;
  description: string;
}> = [
  { key: 'bgPrimary', label: 'Background Primario', description: 'Cor de fundo principal' },
  { key: 'bgSecondary', label: 'Background Secundario', description: 'Cor de fundo secundaria' },
  { key: 'bgTertiary', label: 'Background Terciario', description: 'Cor de fundo terciaria' },
  { key: 'textPrimary', label: 'Texto Primario', description: 'Cor do texto principal' },
  { key: 'textSecondary', label: 'Texto Secundario', description: 'Cor do texto secundario' },
  { key: 'textMuted', label: 'Texto Esmaecido', description: 'Cor do texto esmaecido' },
  { key: 'accentPrimary', label: 'Destaque Primario', description: 'Cor de destaque principal' },
  { key: 'accentSecondary', label: 'Destaque Secundario', description: 'Cor de destaque secundaria' },
];

export function ColorEditor({ colors, onChange }: ColorEditorProps) {
  const handleColorChange = useCallback(
    (key: keyof TemplateColors, value: string) => {
      onChange({ ...colors, [key]: value });
    },
    [colors, onChange]
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Cores</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {COLOR_FIELDS.map(({ key, label, description }) => (
          <div key={key} className="space-y-2">
            <label htmlFor={key} className="text-sm font-medium">
              {label}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id={key}
                value={colors[key]}
                onChange={(e) => handleColorChange(key, e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer rounded border bg-transparent"
              />
              <input
                type="text"
                value={colors[key]}
                onChange={(e) => handleColorChange(key, e.target.value)}
                placeholder="#000000"
                className="flex-1 h-10 px-3 rounded-md border bg-transparent text-sm font-mono"
              />
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
