/**
 * Templates Page
 * Story 5.7 - Editor de Templates de Carrossel
 *
 * List and manage carousel templates.
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { TemplateCard } from '../../components/templates/TemplateCard';
import {
  useTemplates,
  useDeleteTemplate,
  useDuplicateTemplate,
  useExportTemplate,
  useImportTemplateFromFile,
} from '../../hooks/useTemplates';

export function Templates() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: templates, isLoading, error, refetch } = useTemplates();
  const deleteMutation = useDeleteTemplate();
  const duplicateMutation = useDuplicateTemplate();
  const exportMutation = useExportTemplate();
  const { importFromFile, isPending: isImporting } = useImportTemplateFromFile();

  const handleCreateNew = () => {
    navigate('/settings/templates/new');
  };

  const handleDuplicate = async (id: string) => {
    try {
      const result = await duplicateMutation.mutateAsync({ id });
      navigate(`/settings/templates/${result.id}/edit`);
    } catch (error) {
      console.error('Failed to duplicate template:', error);
    }
  };

  const handleExport = (id: string) => {
    exportMutation.mutate(id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este template?')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete template:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await importFromFile(file);
      navigate(`/settings/templates/${result.id}/edit`);
    } catch (error) {
      console.error('Failed to import template:', error);
      alert('Falha ao importar template. Verifique se o arquivo JSON e valido.');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Templates</h1>
            <p className="text-muted-foreground">Personalize os templates do carrossel</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-48 bg-muted animate-pulse" />
              <CardContent className="pt-4">
                <div className="h-6 bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Templates</h1>
            <p className="text-muted-foreground">Personalize os templates do carrossel</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">Erro ao carregar templates</p>
            <Button onClick={() => refetch()}>Tentar Novamente</Button>
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
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-muted-foreground">Personalize os templates do carrossel</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport} disabled={isImporting}>
            {isImporting ? 'Importando...' : 'Importar'}
          </Button>
          <Button onClick={handleCreateNew}>
            Criar Novo
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Templates Grid */}
      {templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onDuplicate={handleDuplicate}
              onExport={handleExport}
              onDelete={handleDelete}
              isDeleting={deletingId === template.id}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Nenhum template encontrado. Crie um novo ou importe um existente.
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={handleImport}>
                Importar Template
              </Button>
              <Button onClick={handleCreateNew}>
                Criar Novo Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
