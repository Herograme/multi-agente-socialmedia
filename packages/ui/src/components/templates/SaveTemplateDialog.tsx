/**
 * SaveTemplateDialog Component
 * Story 5.7 - Editor de Templates de Carrossel
 *
 * Dialog for saving templates (Save/Save As).
 */

import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';

interface SaveTemplateDialogProps {
  isOpen: boolean;
  mode: 'save' | 'saveAs';
  currentName: string;
  onSave: (name: string) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function SaveTemplateDialog({
  isOpen,
  mode,
  currentName,
  onSave,
  onCancel,
  isSaving,
}: SaveTemplateDialogProps) {
  const [name, setName] = useState(mode === 'saveAs' ? `${currentName} (Copy)` : currentName);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Nome do template e obrigatorio');
      return;
    }
    if (trimmedName.length < 3) {
      setError('Nome deve ter pelo menos 3 caracteres');
      return;
    }
    setError(null);
    onSave(trimmedName);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>
            {mode === 'save' ? 'Salvar Template' : 'Salvar Como'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="templateName" className="text-sm font-medium">
              Nome do Template
            </label>
            <input
              type="text"
              id="templateName"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="Meu Template"
              className="w-full h-10 px-3 rounded-md border bg-transparent text-sm"
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          {mode === 'save' && (
            <p className="text-sm text-muted-foreground">
              As alteracoes serao salvas no template atual.
            </p>
          )}
          {mode === 'saveAs' && (
            <p className="text-sm text-muted-foreground">
              Um novo template sera criado com as configuracoes atuais.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
