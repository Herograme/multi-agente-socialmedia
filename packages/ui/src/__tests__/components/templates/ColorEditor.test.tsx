/**
 * ColorEditor Component Tests
 * Story 5.7 - Editor de Templates de Carrossel
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorEditor } from '../../../components/templates/ColorEditor';
import { DEFAULT_TEMPLATE_COLORS } from '@social-content/shared';

describe('ColorEditor', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all color fields', () => {
    render(<ColorEditor colors={DEFAULT_TEMPLATE_COLORS} onChange={mockOnChange} />);

    expect(screen.getByText('Background Primario')).toBeInTheDocument();
    expect(screen.getByText('Background Secundario')).toBeInTheDocument();
    expect(screen.getByText('Texto Primario')).toBeInTheDocument();
    expect(screen.getByText('Destaque Primario')).toBeInTheDocument();
  });

  it('should render section title', () => {
    render(<ColorEditor colors={DEFAULT_TEMPLATE_COLORS} onChange={mockOnChange} />);

    expect(screen.getByText('Cores')).toBeInTheDocument();
  });

  it('should display current color values', () => {
    render(<ColorEditor colors={DEFAULT_TEMPLATE_COLORS} onChange={mockOnChange} />);

    // Check for hex values in text inputs
    const textInputs = screen.getAllByRole('textbox');
    const bgPrimaryInput = textInputs.find(
      (input) => (input as HTMLInputElement).value === DEFAULT_TEMPLATE_COLORS.bgPrimary
    );
    expect(bgPrimaryInput).toBeDefined();
  });

  it('should call onChange when text input is changed', () => {
    render(<ColorEditor colors={DEFAULT_TEMPLATE_COLORS} onChange={mockOnChange} />);

    const textInputs = screen.getAllByRole('textbox');
    const firstTextInput = textInputs[0];
    if (firstTextInput) {
      fireEvent.change(firstTextInput, { target: { value: '#ffffff' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          bgPrimary: '#ffffff',
        })
      );
    }
  });

  it('should render color picker inputs', () => {
    const { container } = render(
      <ColorEditor colors={DEFAULT_TEMPLATE_COLORS} onChange={mockOnChange} />
    );

    const colorInputs = container.querySelectorAll('input[type="color"]');
    expect(colorInputs.length).toBe(8); // 8 color fields
  });

  it('should render descriptions for color fields', () => {
    render(<ColorEditor colors={DEFAULT_TEMPLATE_COLORS} onChange={mockOnChange} />);

    expect(screen.getByText('Cor de fundo principal')).toBeInTheDocument();
    expect(screen.getByText('Cor do texto principal')).toBeInTheDocument();
    expect(screen.getByText('Cor de destaque principal')).toBeInTheDocument();
  });
});
