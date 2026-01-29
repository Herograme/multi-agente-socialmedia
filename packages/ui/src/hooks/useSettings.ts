import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Settings, SettingsResponse } from '@social-content/shared';
import { DEFAULT_SETTINGS, SettingsSchema } from '@social-content/shared';

/**
 * Deep comparison of two objects
 */
function isEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (a === null || b === null) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!isEqual((a as any)[key], (b as any)[key])) return false;
  }

  return true;
}

interface UseSettingsResult {
  settings: Settings;
  originalSettings: Settings;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isDirty: boolean;
  errors: Record<string, string>;
  updateField: <K extends keyof Settings>(field: K, value: Settings[K]) => void;
  updateNestedField: <K extends keyof Settings>(
    field: K,
    nestedField: keyof Settings[K],
    value: unknown
  ) => void;
  saveSettings: () => Promise<void>;
  resetSettings: () => Promise<void>;
  isSaving: boolean;
  isResetting: boolean;
}

export function useSettings(): UseSettingsResult {
  const queryClient = useQueryClient();

  // Estado local das configuracoes
  const [localSettings, setLocalSettings] = useState<Settings | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Query para buscar configuracoes
  const {
    data: serverResponse,
    isLoading,
    isError,
    error,
  } = useQuery<SettingsResponse>({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
    staleTime: 60 * 1000, // 1 minuto
  });

  // Configuracoes efetivas (local ou servidor)
  const settings = useMemo(() => {
    if (localSettings) return localSettings;
    if (serverResponse?.settings) return serverResponse.settings;
    return DEFAULT_SETTINGS;
  }, [localSettings, serverResponse]);

  // Configuracoes originais do servidor
  const originalSettings = useMemo(() => {
    return serverResponse?.settings || DEFAULT_SETTINGS;
  }, [serverResponse]);

  // Verificar se ha mudancas
  const isDirty = useMemo(() => {
    if (!localSettings) return false;
    return !isEqual(localSettings, originalSettings);
  }, [localSettings, originalSettings]);

  // Mutation para salvar
  const saveMutation = useMutation({
    mutationFn: (newSettings: Partial<Settings>) => api.updateSettings(newSettings),
    onSuccess: (data) => {
      queryClient.setQueryData(['settings'], data);
      setLocalSettings(null);
      setErrors({});
    },
  });

  // Mutation para resetar
  const resetMutation = useMutation({
    mutationFn: () => api.resetSettings(),
    onSuccess: (data) => {
      queryClient.setQueryData(['settings'], data);
      setLocalSettings(null);
      setErrors({});
    },
  });

  // Validar campo
  const validateField = useCallback((field: keyof Settings, value: unknown): string | null => {
    // Skip validation for fields not in schema
    if (field === 'updatedAt') return null;

    try {
      // Type-safe access to schema shape
      const schemaShape = SettingsSchema.shape as Record<string, unknown>;
      const fieldSchema = schemaShape[field];
      if (fieldSchema && typeof fieldSchema === 'object' && 'parse' in fieldSchema) {
        (fieldSchema as { parse: (value: unknown) => unknown }).parse(value);
      }
      return null;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'issues' in err) {
        const zodError = err as { issues: Array<{ message: string }> };
        return zodError.issues[0]?.message || 'Campo invalido';
      }
      return 'Campo invalido';
    }
  }, []);

  // Atualizar campo
  const updateField = useCallback(
    <K extends keyof Settings>(field: K, value: Settings[K]) => {
      setLocalSettings((prev) => {
        const current = prev || serverResponse?.settings || DEFAULT_SETTINGS;
        return { ...current, [field]: value };
      });

      // Validar campo
      const error = validateField(field, value);
      setErrors((prev) => {
        const next = { ...prev };
        if (error) {
          next[field] = error;
        } else {
          delete next[field];
        }
        return next;
      });
    },
    [serverResponse, validateField]
  );

  // Atualizar campo aninhado
  const updateNestedField = useCallback(
    <K extends keyof Settings>(field: K, nestedField: keyof Settings[K], value: unknown) => {
      setLocalSettings((prev) => {
        const current = prev || serverResponse?.settings || DEFAULT_SETTINGS;
        const currentFieldValue = current[field];
        if (typeof currentFieldValue === 'object' && currentFieldValue !== null) {
          return {
            ...current,
            [field]: {
              ...currentFieldValue,
              [nestedField]: value,
            },
          };
        }
        return current;
      });
    },
    [serverResponse]
  );

  // Salvar configuracoes
  const saveSettings = useCallback(async () => {
    if (!localSettings) return;

    // Validar tudo antes de salvar
    const validation = SettingsSchema.safeParse(localSettings);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      throw new Error('Configuracoes invalidas');
    }

    await saveMutation.mutateAsync(localSettings);
  }, [localSettings, saveMutation]);

  // Resetar configuracoes
  const resetSettings = useCallback(async () => {
    await resetMutation.mutateAsync();
    setErrors({});
  }, [resetMutation]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return {
    settings,
    originalSettings,
    isLoading,
    isError,
    error: error as Error | null,
    isDirty,
    errors,
    updateField,
    updateNestedField,
    saveSettings,
    resetSettings,
    isSaving: saveMutation.isPending,
    isResetting: resetMutation.isPending,
  };
}
