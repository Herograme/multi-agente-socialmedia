/**
 * TemplateCard Component
 * Story 5.7 - Editor de Templates de Carrossel
 *
 * Card component displaying a template with preview and actions.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { Template } from '@social-content/shared';

interface TemplateCardProps {
  template: Template;
  onDuplicate: (id: string) => void;
  onExport: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

/**
 * Generates CSS variables from template theme for preview.
 */
function generateCssVariables(template: Template): React.CSSProperties {
  const { colors } = template.theme;
  return {
    '--bg-primary': colors.bgPrimary,
    '--bg-secondary': colors.bgSecondary,
    '--text-primary': colors.textPrimary,
    '--text-secondary': colors.textSecondary,
    '--accent-primary': colors.accentPrimary,
  } as React.CSSProperties;
}

export function TemplateCard({
  template,
  onDuplicate,
  onExport,
  onDelete,
  isDeleting,
}: TemplateCardProps) {
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);

  const handleEdit = () => {
    navigate(`/settings/templates/${template.id}/edit`);
  };

  return (
    <Card
      className="overflow-hidden transition-shadow hover:shadow-lg"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Preview Area */}
      <div
        className="relative h-48 flex items-center justify-center"
        style={{
          ...generateCssVariables(template),
          backgroundColor: template.theme.colors.bgPrimary,
        }}
      >
        {/* Mini Preview */}
        <div className="w-32 h-32 rounded-lg shadow-lg overflow-hidden"
          style={{ backgroundColor: template.theme.colors.bgSecondary }}
        >
          <div className="p-3 h-full flex flex-col justify-between">
            <div>
              <div
                className="w-16 h-2 rounded mb-2"
                style={{ backgroundColor: template.theme.colors.accentPrimary }}
              />
              <div
                className="w-full h-1.5 rounded mb-1"
                style={{ backgroundColor: template.theme.colors.textPrimary, opacity: 0.3 }}
              />
              <div
                className="w-3/4 h-1.5 rounded"
                style={{ backgroundColor: template.theme.colors.textSecondary, opacity: 0.3 }}
              />
            </div>
            <div
              className="text-[6px] text-right"
              style={{ color: template.theme.colors.textMuted }}
            >
              {template.theme.branding.handle}
            </div>
          </div>
        </div>

        {/* Default Badge */}
        {template.isDefault && (
          <Badge className="absolute top-2 left-2" variant="secondary">
            Default
          </Badge>
        )}

        {/* Actions Overlay */}
        {showActions && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 transition-opacity">
            <Button size="sm" variant="secondary" onClick={handleEdit}>
              Editar
            </Button>
            <Button size="sm" variant="outline" onClick={() => onDuplicate(template.id)}>
              Duplicar
            </Button>
          </div>
        )}
      </div>

      {/* Card Content */}
      <CardContent className="pt-4">
        <h3 className="font-semibold text-lg truncate">{template.name}</h3>
        {template.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {template.description}
          </p>
        )}
        <div className="flex gap-2 mt-3">
          <div
            className="w-4 h-4 rounded-full border"
            style={{ backgroundColor: template.theme.colors.bgPrimary }}
            title="Background Primary"
          />
          <div
            className="w-4 h-4 rounded-full border"
            style={{ backgroundColor: template.theme.colors.accentPrimary }}
            title="Accent Primary"
          />
          <div
            className="w-4 h-4 rounded-full border"
            style={{ backgroundColor: template.theme.colors.textPrimary }}
            title="Text Primary"
          />
        </div>
      </CardContent>

      {/* Card Footer */}
      <CardFooter className="border-t pt-4 flex justify-between">
        <Button size="sm" variant="ghost" onClick={() => onExport(template.id)}>
          Exportar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(template.id)}
          disabled={template.isDefault || isDeleting}
          title={template.isDefault ? 'Template padrao nao pode ser deletado' : 'Deletar template'}
        >
          {isDeleting ? 'Deletando...' : 'Deletar'}
        </Button>
      </CardFooter>
    </Card>
  );
}
