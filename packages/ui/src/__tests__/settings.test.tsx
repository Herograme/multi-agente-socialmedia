/**
 * Settings Page Tests
 * Story 5.6: Pagina de Configuracoes
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '../components/ui/toast-provider';
import { Settings } from '../routes/Settings';
import { DEFAULT_SETTINGS } from '@social-content/shared';

// Use vi.hoisted to define mock functions before vi.mock is hoisted
const { mockGetSettings, mockUpdateSettings, mockResetSettings } = vi.hoisted(() => ({
  mockGetSettings: vi.fn(),
  mockUpdateSettings: vi.fn(),
  mockResetSettings: vi.fn(),
}));

// Mock the API
vi.mock('../lib/api', () => ({
  api: {
    getSettings: mockGetSettings,
    updateSettings: mockUpdateSettings,
    resetSettings: mockResetSettings,
  },
}));

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>{component}</ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Settings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    mockGetSettings.mockResolvedValue({
      settings: {
        sources: { devto: true, hackernews: true, reddit: false },
        llm: { primaryProvider: 'groq', fallbackOrder: ['gemini'], temperature: 0.7, maxTokens: 4096 },
        image: { provider: 'ideogram', enabled: true, preferredStyle: 'tech', aspectRatio: '1:1' },
        quality: { threshold: 6.0, autoRegenerate: true, maxRegenerations: 1 },
        output: { directory: './output', enableCarousel: true, enablePdf: true, slidesPerCarousel: 8, imageResolution: '1080x1080' },
      },
      isDefault: false,
      updatedAt: new Date().toISOString(),
    });
    mockUpdateSettings.mockResolvedValue({ success: true });
    mockResetSettings.mockResolvedValue({
      settings: DEFAULT_SETTINGS,
      isDefault: true,
      updatedAt: new Date().toISOString(),
    });
  });

  it('should render settings page with title', async () => {
    renderWithProviders(<Settings />);

    await waitFor(() => {
      expect(screen.getByText('Configuracoes')).toBeInTheDocument();
    });
  });

  it('should render all settings sections', async () => {
    renderWithProviders(<Settings />);

    await waitFor(() => {
      expect(screen.getByText('Fontes de Tendencias')).toBeInTheDocument();
    });

    expect(screen.getByText('LLM Providers')).toBeInTheDocument();
    expect(screen.getByText('Geracao de Imagens')).toBeInTheDocument();
    expect(screen.getByText('Quality Gate')).toBeInTheDocument();
    expect(screen.getByText('Output e Formatos')).toBeInTheDocument();
  });

  it('should show save button disabled when no changes', async () => {
    renderWithProviders(<Settings />);

    await waitFor(() => {
      const saveButton = screen.getByText('Salvar Configuracoes');
      expect(saveButton).toBeDisabled();
    });
  });

  it('should show restore defaults button', async () => {
    renderWithProviders(<Settings />);

    await waitFor(() => {
      expect(screen.getByText('Restaurar Padroes')).toBeInTheDocument();
    });
  });

  it('should have sources accordion open by default', async () => {
    renderWithProviders(<Settings />);

    await waitFor(() => {
      expect(screen.getByText('Fontes de Tendencias')).toBeInTheDocument();
    });

    // Sources section should be open by default (data-state="open")
    const sourcesAccordion = screen.getByText('Fontes de Tendencias').closest('[data-state]');
    expect(sourcesAccordion).toHaveAttribute('data-state', 'open');
  });

  it('should show confirmation dialog when clicking reset', async () => {
    renderWithProviders(<Settings />);

    await waitFor(() => {
      expect(screen.getByText('Restaurar Padroes')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Restaurar Padroes'));

    await waitFor(() => {
      expect(screen.getByText('Restaurar Configuracoes Padrao?')).toBeInTheDocument();
    });
  });

  it('should close confirmation dialog when clicking cancel', async () => {
    renderWithProviders(<Settings />);

    await waitFor(() => {
      expect(screen.getByText('Restaurar Padroes')).toBeInTheDocument();
    });

    // Open dialog
    fireEvent.click(screen.getByText('Restaurar Padroes'));

    await waitFor(() => {
      expect(screen.getByText('Restaurar Configuracoes Padrao?')).toBeInTheDocument();
    });

    // Click cancel
    fireEvent.click(screen.getByText('Cancelar'));

    await waitFor(() => {
      expect(screen.queryByText('Restaurar Configuracoes Padrao?')).not.toBeInTheDocument();
    });
  });
});
