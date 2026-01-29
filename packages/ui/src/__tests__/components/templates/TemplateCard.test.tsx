/**
 * TemplateCard Component Tests
 * Story 5.7 - Editor de Templates de Carrossel
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TemplateCard } from '../../../components/templates/TemplateCard';
import type { Template } from '@social-content/shared';
import { DEFAULT_TEMPLATE_THEME } from '@social-content/shared';

const mockTemplate: Template = {
  id: 'test-1',
  name: 'Test Template',
  description: 'A test template description',
  theme: DEFAULT_TEMPLATE_THEME,
  isDefault: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const defaultTemplate: Template = {
  ...mockTemplate,
  id: 'default',
  name: 'Default Dark',
  isDefault: true,
};

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('TemplateCard', () => {
  const mockOnDuplicate = vi.fn();
  const mockOnExport = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render template name', () => {
    renderWithRouter(
      <TemplateCard
        template={mockTemplate}
        onDuplicate={mockOnDuplicate}
        onExport={mockOnExport}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Test Template')).toBeInTheDocument();
  });

  it('should render template description', () => {
    renderWithRouter(
      <TemplateCard
        template={mockTemplate}
        onDuplicate={mockOnDuplicate}
        onExport={mockOnExport}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('A test template description')).toBeInTheDocument();
  });

  it('should show Default badge for default template', () => {
    renderWithRouter(
      <TemplateCard
        template={defaultTemplate}
        onDuplicate={mockOnDuplicate}
        onExport={mockOnExport}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  it('should not show Default badge for non-default template', () => {
    renderWithRouter(
      <TemplateCard
        template={mockTemplate}
        onDuplicate={mockOnDuplicate}
        onExport={mockOnExport}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.queryByText('Default')).not.toBeInTheDocument();
  });

  it('should call onExport when export button is clicked', () => {
    renderWithRouter(
      <TemplateCard
        template={mockTemplate}
        onDuplicate={mockOnDuplicate}
        onExport={mockOnExport}
        onDelete={mockOnDelete}
      />
    );

    const exportButton = screen.getByText('Exportar');
    fireEvent.click(exportButton);

    expect(mockOnExport).toHaveBeenCalledWith('test-1');
  });

  it('should call onDelete when delete button is clicked', () => {
    renderWithRouter(
      <TemplateCard
        template={mockTemplate}
        onDuplicate={mockOnDuplicate}
        onExport={mockOnExport}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByText('Deletar');
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith('test-1');
  });

  it('should disable delete button for default template', () => {
    renderWithRouter(
      <TemplateCard
        template={defaultTemplate}
        onDuplicate={mockOnDuplicate}
        onExport={mockOnExport}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByText('Deletar');
    expect(deleteButton).toBeDisabled();
  });

  it('should show deleting state', () => {
    renderWithRouter(
      <TemplateCard
        template={mockTemplate}
        onDuplicate={mockOnDuplicate}
        onExport={mockOnExport}
        onDelete={mockOnDelete}
        isDeleting={true}
      />
    );

    expect(screen.getByText('Deletando...')).toBeInTheDocument();
  });

  it('should render color swatches', () => {
    const { container } = renderWithRouter(
      <TemplateCard
        template={mockTemplate}
        onDuplicate={mockOnDuplicate}
        onExport={mockOnExport}
        onDelete={mockOnDelete}
      />
    );

    // Check for color swatch elements
    const swatches = container.querySelectorAll('[style*="background-color"]');
    expect(swatches.length).toBeGreaterThan(0);
  });
});
