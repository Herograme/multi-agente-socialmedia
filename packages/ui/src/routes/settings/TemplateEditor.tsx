/**
 * TemplateEditor Page
 * Story 5.7 - Editor de Templates de Carrossel
 *
 * Page for editing template colors, fonts, and branding.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { ColorEditor } from '../../components/templates/ColorEditor';
import { FontEditor } from '../../components/templates/FontEditor';
import { BrandingEditor } from '../../components/templates/BrandingEditor';
import { LivePreview } from '../../components/templates/LivePreview';
import { SaveTemplateDialog } from '../../components/templates/SaveTemplateDialog';
import {
  useTemplate,
  useCreateTemplate,
  useUpdateTemplate,
  useExportTemplate,
} from '../../hooks/useTemplates';
import type { TemplateTheme, TemplateColors, TemplateFonts, TemplateBranding } from '@social-content/shared';
import { DEFAULT_TEMPLATE_THEME } from '@social-content/shared';

type EditorTab = 'colors' | 'fonts' | 'branding';

export function TemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  // API hooks
  const { data: template, isLoading, error } = useTemplate(isNew ? undefined : id);
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const exportMutation = useExportTemplate();

  // Local state
  const [activeTab, setActiveTab] = useState<EditorTab>('colors');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState<TemplateTheme>(DEFAULT_TEMPLATE_THEME);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveDialog, setSaveDialog] = useState<{
    isOpen: boolean;
    mode: 'save' | 'saveAs';
  }>({ isOpen: false, mode: 'save' });

  // Initialize state from template
  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      setTheme(template.theme);
      setHasChanges(false);
    }
  }, [template]);

  // Handlers
  const handleColorsChange = useCallback((colors: TemplateColors) => {
    setTheme((prev) => ({ ...prev, colors }));
    setHasChanges(true);
  }, []);

  const handleFontsChange = useCallback((fonts: TemplateFonts) => {
    setTheme((prev) => ({ ...prev, fonts }));
    setHasChanges(true);
  }, []);

  const handleBrandingChange = useCallback((branding: TemplateBranding) => {
    setTheme((prev) => ({ ...prev, branding }));
    setHasChanges(true);
  }, []);

  const handleSave = async (newName: string) => {
    try {
      if (isNew || saveDialog.mode === 'saveAs') {
        // Create new template
        const result = await createMutation.mutateAsync({
          name: newName,
          description: description || undefined,
          theme,
        });
        navigate(`/settings/templates/${result.id}/edit`, { replace: true });
      } else {
        // Update existing template
        await updateMutation.mutateAsync({
          id: id!,
          input: {
            name: newName !== name ? newName : undefined,
            description: description || undefined,
            theme,
          },
        });
      }
      setHasChanges(false);
      setSaveDialog({ isOpen: false, mode: 'save' });
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Falha ao salvar template. Por favor, tente novamente.');
    }
  };

  const handleExport = () => {
    if (id && !isNew) {
      exportMutation.mutate(id);
    }
  };

  // Loading state
  if (!isNew && isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="h-[600px] animate-pulse bg-muted" />
          <Card className="h-[600px] animate-pulse bg-muted" />
        </div>
      </div>
    );
  }

  // Error state
  if (!isNew && error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Editor de Template</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">Template nao encontrado</p>
            <Button onClick={() => navigate('/settings/templates')}>
              Voltar para Templates
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/settings" className="hover:text-foreground">Configuracoes</Link>
            <span>/</span>
            <Link to="/settings/templates" className="hover:text-foreground">Templates</Link>
            <span>/</span>
            <span>{isNew ? 'Novo' : name}</span>
          </div>
          <h1 className="text-3xl font-bold">
            {isNew ? 'Novo Template' : `Editar: ${name}`}
          </h1>
        </div>
        <div className="flex gap-2">
          {!isNew && (
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={exportMutation.isPending}
            >
              {exportMutation.isPending ? 'Exportando...' : 'Exportar'}
            </Button>
          )}
          {!isNew && !template?.isDefault && (
            <Button
              variant="outline"
              onClick={() => setSaveDialog({ isOpen: true, mode: 'saveAs' })}
            >
              Salvar Como
            </Button>
          )}
          <Button
            onClick={() => setSaveDialog({ isOpen: true, mode: 'save' })}
            disabled={!hasChanges && !isNew}
          >
            {isNew ? 'Criar' : 'Salvar'}
          </Button>
        </div>
      </div>

      {/* Metadata (for new templates) */}
      {isNew && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="templateName" className="text-sm font-medium">
                Nome do Template *
              </label>
              <input
                type="text"
                id="templateName"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setHasChanges(true);
                }}
                placeholder="Meu Template"
                className="w-full h-10 px-3 rounded-md border bg-transparent text-sm"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="templateDescription" className="text-sm font-medium">
                Descricao (opcional)
              </label>
              <textarea
                id="templateDescription"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setHasChanges(true);
                }}
                placeholder="Uma breve descricao do template..."
                rows={3}
                className="w-full px-3 py-2 rounded-md border bg-transparent text-sm resize-none"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit Panel */}
        <Card className="min-h-[600px]">
          <CardContent className="pt-6">
            {/* Tabs */}
            <div className="flex border-b mb-6">
              {(['colors', 'fonts', 'branding'] as EditorTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab === 'colors' && 'Cores'}
                  {tab === 'fonts' && 'Fontes'}
                  {tab === 'branding' && 'Branding'}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'colors' && (
              <ColorEditor colors={theme.colors} onChange={handleColorsChange} />
            )}
            {activeTab === 'fonts' && (
              <FontEditor fonts={theme.fonts} onChange={handleFontsChange} />
            )}
            {activeTab === 'branding' && (
              <BrandingEditor branding={theme.branding} onChange={handleBrandingChange} />
            )}
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <Card className="min-h-[600px]">
          <CardContent className="pt-6 flex flex-col items-center justify-center h-full">
            <h3 className="text-lg font-semibold mb-6">Preview ao Vivo</h3>
            <LivePreview theme={theme} />
            {hasChanges && (
              <p className="mt-4 text-sm text-muted-foreground">
                * Alteracoes nao salvas
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save Dialog */}
      <SaveTemplateDialog
        isOpen={saveDialog.isOpen}
        mode={saveDialog.mode}
        currentName={name}
        onSave={handleSave}
        onCancel={() => setSaveDialog({ isOpen: false, mode: 'save' })}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
