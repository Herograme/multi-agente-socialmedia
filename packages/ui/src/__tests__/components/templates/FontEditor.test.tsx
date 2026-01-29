/**
 * FontEditor Component Tests
 * Story 5.7 - Editor de Templates de Carrossel
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FontEditor } from '../../../components/templates/FontEditor';
import { DEFAULT_TEMPLATE_FONTS } from '@social-content/shared';

describe('FontEditor', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render section title', () => {
    render(<FontEditor fonts={DEFAULT_TEMPLATE_FONTS} onChange={mockOnChange} />);

    expect(screen.getByText('Fontes')).toBeInTheDocument();
  });

  it('should render sans font selector', () => {
    render(<FontEditor fonts={DEFAULT_TEMPLATE_FONTS} onChange={mockOnChange} />);

    expect(screen.getByText('Fonte do Titulo/Corpo')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /titulo.*corpo/i })).toBeInTheDocument();
  });

  it('should render mono font selector', () => {
    render(<FontEditor fonts={DEFAULT_TEMPLATE_FONTS} onChange={mockOnChange} />);

    expect(screen.getByText('Fonte de Codigo')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /codigo/i })).toBeInTheDocument();
  });

  it('should render font size slider', () => {
    render(<FontEditor fonts={DEFAULT_TEMPLATE_FONTS} onChange={mockOnChange} />);

    expect(screen.getByText(/Tamanho Base/)).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('should display current font size', () => {
    render(<FontEditor fonts={DEFAULT_TEMPLATE_FONTS} onChange={mockOnChange} />);

    // The label includes the current font size value
    expect(screen.getByText(/Tamanho Base: 1\.0x/)).toBeInTheDocument();
  });

  it('should call onChange when sans font is changed', () => {
    render(<FontEditor fonts={DEFAULT_TEMPLATE_FONTS} onChange={mockOnChange} />);

    const sansSelect = screen.getByRole('combobox', { name: /titulo.*corpo/i });
    fireEvent.change(sansSelect, { target: { value: 'Roboto' } });

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        fontSans: 'Roboto',
      })
    );
  });

  it('should call onChange when mono font is changed', () => {
    render(<FontEditor fonts={DEFAULT_TEMPLATE_FONTS} onChange={mockOnChange} />);

    const monoSelect = screen.getByRole('combobox', { name: /codigo/i });
    fireEvent.change(monoSelect, { target: { value: 'Fira Code' } });

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        fontMono: 'Fira Code',
      })
    );
  });

  it('should call onChange when font size is changed', () => {
    render(<FontEditor fonts={DEFAULT_TEMPLATE_FONTS} onChange={mockOnChange} />);

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '1.2' } });

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        fontSizeBase: 1.2,
      })
    );
  });

  it('should render preview section', () => {
    render(<FontEditor fonts={DEFAULT_TEMPLATE_FONTS} onChange={mockOnChange} />);

    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText('Titulo do Slide')).toBeInTheDocument();
  });

  it('should render code preview', () => {
    render(<FontEditor fonts={DEFAULT_TEMPLATE_FONTS} onChange={mockOnChange} />);

    expect(screen.getByText(/const example/)).toBeInTheDocument();
  });

  it('should include available font options', () => {
    render(<FontEditor fonts={DEFAULT_TEMPLATE_FONTS} onChange={mockOnChange} />);

    // Check sans fonts
    expect(screen.getByRole('option', { name: 'Inter' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Roboto' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Poppins' })).toBeInTheDocument();

    // Check mono fonts
    expect(screen.getByRole('option', { name: 'JetBrains Mono' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Fira Code' })).toBeInTheDocument();
  });
});
