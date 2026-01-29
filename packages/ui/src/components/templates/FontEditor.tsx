/**
 * FontEditor Component
 * Story 5.7 - Editor de Templates de Carrossel
 *
 * Font selection panel for template theme customization.
 */

import { useCallback } from 'react';
import type { TemplateFonts } from '@social-content/shared';
import { SANS_FONTS, MONO_FONTS } from '@social-content/shared';

interface FontEditorProps {
  fonts: TemplateFonts;
  onChange: (fonts: TemplateFonts) => void;
}

export function FontEditor({ fonts, onChange }: FontEditorProps) {
  const handleFontSansChange = useCallback(
    (value: string) => {
      onChange({ ...fonts, fontSans: value });
    },
    [fonts, onChange]
  );

  const handleFontMonoChange = useCallback(
    (value: string) => {
      onChange({ ...fonts, fontMono: value });
    },
    [fonts, onChange]
  );

  const handleFontSizeChange = useCallback(
    (value: number) => {
      onChange({ ...fonts, fontSizeBase: value });
    },
    [fonts, onChange]
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Fontes</h3>
      <div className="space-y-4">
        {/* Sans Font */}
        <div className="space-y-2">
          <label htmlFor="fontSans" className="text-sm font-medium">
            Fonte do Titulo/Corpo
          </label>
          <select
            id="fontSans"
            value={fonts.fontSans}
            onChange={(e) => handleFontSansChange(e.target.value)}
            className="w-full h-10 px-3 rounded-md border bg-transparent text-sm"
          >
            {SANS_FONTS.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Fonte usada em titulos e textos do corpo
          </p>
        </div>

        {/* Mono Font */}
        <div className="space-y-2">
          <label htmlFor="fontMono" className="text-sm font-medium">
            Fonte de Codigo
          </label>
          <select
            id="fontMono"
            value={fonts.fontMono}
            onChange={(e) => handleFontMonoChange(e.target.value)}
            className="w-full h-10 px-3 rounded-md border bg-transparent text-sm"
          >
            {MONO_FONTS.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Fonte usada em blocos de codigo
          </p>
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <label htmlFor="fontSizeBase" className="text-sm font-medium">
            Tamanho Base: {fonts.fontSizeBase.toFixed(1)}x
          </label>
          <input
            type="range"
            id="fontSizeBase"
            min="0.8"
            max="1.4"
            step="0.1"
            value={fonts.fontSizeBase}
            onChange={(e) => handleFontSizeChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.8x</span>
            <span>1.0x</span>
            <span>1.4x</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Multiplicador do tamanho base das fontes
          </p>
        </div>

        {/* Font Preview */}
        <div className="mt-6 p-4 rounded-lg border bg-muted/50">
          <h4 className="text-sm font-medium mb-3">Preview</h4>
          <div
            className="space-y-2"
            style={{ fontFamily: `'${fonts.fontSans}', sans-serif` }}
          >
            <p style={{ fontSize: `${1.5 * fonts.fontSizeBase}rem`, fontWeight: 'bold' }}>
              Titulo do Slide
            </p>
            <p style={{ fontSize: `${1 * fonts.fontSizeBase}rem` }}>
              Texto do corpo com a fonte selecionada.
            </p>
          </div>
          <div className="mt-3">
            <code
              className="block p-2 rounded bg-black/10 text-sm"
              style={{ fontFamily: `'${fonts.fontMono}', monospace`, fontSize: `${0.875 * fonts.fontSizeBase}rem` }}
            >
              const example = &quot;Codigo de exemplo&quot;;
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
