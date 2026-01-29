/**
 * BrandingEditor Component
 * Story 5.7 - Editor de Templates de Carrossel
 *
 * Branding configuration panel for template customization.
 */

import { useCallback } from 'react';
import type { TemplateBranding, BrandingPosition } from '@social-content/shared';
import { BRANDING_POSITIONS } from '@social-content/shared';

interface BrandingEditorProps {
  branding: TemplateBranding;
  onChange: (branding: TemplateBranding) => void;
}

const POSITION_LABELS: Record<BrandingPosition, string> = {
  'footer-left': 'Rodape Esquerda',
  'footer-center': 'Rodape Centro',
  'footer-right': 'Rodape Direita',
};

export function BrandingEditor({ branding, onChange }: BrandingEditorProps) {
  const handleHandleChange = useCallback(
    (value: string) => {
      // Ensure handle starts with @
      const handle = value.startsWith('@') ? value : `@${value}`;
      onChange({ ...branding, handle });
    },
    [branding, onChange]
  );

  const handlePositionChange = useCallback(
    (value: BrandingPosition) => {
      onChange({ ...branding, position: value });
    },
    [branding, onChange]
  );

  const handleLogoUrlChange = useCallback(
    (value: string) => {
      onChange({ ...branding, logoUrl: value || undefined });
    },
    [branding, onChange]
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Branding</h3>
      <div className="space-y-4">
        {/* Handle */}
        <div className="space-y-2">
          <label htmlFor="handle" className="text-sm font-medium">
            Handle (@usuario)
          </label>
          <input
            type="text"
            id="handle"
            value={branding.handle}
            onChange={(e) => handleHandleChange(e.target.value)}
            placeholder="@seuhandle"
            className="w-full h-10 px-3 rounded-md border bg-transparent text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Seu identificador que aparecera nos slides
          </p>
        </div>

        {/* Position */}
        <div className="space-y-2">
          <label htmlFor="position" className="text-sm font-medium">
            Posicao do Branding
          </label>
          <select
            id="position"
            value={branding.position}
            onChange={(e) => handlePositionChange(e.target.value as BrandingPosition)}
            className="w-full h-10 px-3 rounded-md border bg-transparent text-sm"
          >
            {BRANDING_POSITIONS.map((position) => (
              <option key={position} value={position}>
                {POSITION_LABELS[position]}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Onde seu handle sera exibido nos slides
          </p>
        </div>

        {/* Logo URL (Optional) */}
        <div className="space-y-2">
          <label htmlFor="logoUrl" className="text-sm font-medium">
            URL do Logo (opcional)
          </label>
          <input
            type="url"
            id="logoUrl"
            value={branding.logoUrl || ''}
            onChange={(e) => handleLogoUrlChange(e.target.value)}
            placeholder="https://example.com/logo.png"
            className="w-full h-10 px-3 rounded-md border bg-transparent text-sm"
          />
          <p className="text-xs text-muted-foreground">
            URL de uma imagem de logo para exibir junto ao handle
          </p>
        </div>

        {/* Preview */}
        <div className="mt-6 p-4 rounded-lg border bg-muted/50">
          <h4 className="text-sm font-medium mb-3">Preview do Branding</h4>
          <div className="relative h-16 bg-black/20 rounded flex items-end p-2">
            <div
              className={`flex items-center gap-2 ${
                branding.position === 'footer-left'
                  ? 'mr-auto'
                  : branding.position === 'footer-right'
                  ? 'ml-auto'
                  : 'mx-auto'
              }`}
            >
              {branding.logoUrl && (
                <div className="w-6 h-6 rounded-full bg-muted overflow-hidden">
                  <img
                    src={branding.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <span className="text-sm font-medium">{branding.handle}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
