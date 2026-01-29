/**
 * useTemplates Hook
 * Story 5.7 - Editor de Templates de Carrossel
 *
 * TanStack Query hooks for template management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  Template,
  CreateTemplateInput,
  UpdateTemplateInput,
  ExportedTemplate,
} from '@social-content/shared';

const TEMPLATES_KEY = ['templates'];

/**
 * Lists all templates.
 */
export function useTemplates() {
  return useQuery({
    queryKey: TEMPLATES_KEY,
    queryFn: () => api.getTemplates(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Gets a specific template by ID.
 */
export function useTemplate(id: string | undefined) {
  return useQuery({
    queryKey: [...TEMPLATES_KEY, id],
    queryFn: () => api.getTemplate(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Creates a new template.
 */
export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTemplateInput) => api.createTemplate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    },
  });
}

/**
 * Updates an existing template.
 */
export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTemplateInput }) =>
      api.updateTemplate(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
      queryClient.invalidateQueries({ queryKey: [...TEMPLATES_KEY, id] });
    },
  });
}

/**
 * Deletes a template.
 */
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    },
  });
}

/**
 * Duplicates a template.
 */
export function useDuplicateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name?: string }) =>
      api.duplicateTemplate(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    },
  });
}

/**
 * Exports a template as JSON.
 */
export function useExportTemplate() {
  return useMutation({
    mutationFn: async (id: string) => {
      const data = await api.exportTemplate(id);
      // Trigger download
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-${data.template.name.toLowerCase().replace(/\s+/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return data;
    },
  });
}

/**
 * Imports a template from JSON.
 */
export function useImportTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (json: ExportedTemplate) => api.importTemplate(json),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    },
  });
}

/**
 * Hook for file-based import.
 */
export function useImportTemplateFromFile() {
  const importMutation = useImportTemplate();

  const importFromFile = async (file: File): Promise<Template> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const json = JSON.parse(content) as ExportedTemplate;
          const result = await importMutation.mutateAsync(json);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  return {
    importFromFile,
    isPending: importMutation.isPending,
    error: importMutation.error,
  };
}
