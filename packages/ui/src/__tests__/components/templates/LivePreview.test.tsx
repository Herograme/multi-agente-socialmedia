/**
 * LivePreview Component Tests
 * Story 5.7 - Editor de Templates de Carrossel
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LivePreview } from '../../../components/templates/LivePreview';
import { DEFAULT_TEMPLATE_THEME } from '@social-content/shared';

describe('LivePreview', () => {
  it('should render preview container', () => {
    const { container } = render(<LivePreview theme={DEFAULT_TEMPLATE_THEME} />);

    // Should have a preview container
    const preview = container.querySelector('.aspect-square');
    expect(preview).toBeInTheDocument();
  });

  it('should start with cover slide', () => {
    render(<LivePreview theme={DEFAULT_TEMPLATE_THEME} />);

    expect(screen.getByText('Capa')).toBeInTheDocument();
    expect(screen.getByText('5 Dicas de TypeScript')).toBeInTheDocument();
  });

  it('should navigate to next slide', () => {
    render(<LivePreview theme={DEFAULT_TEMPLATE_THEME} />);

    const nextButton = screen.getByText('Proximo');
    fireEvent.click(nextButton);

    expect(screen.getByText('Conteudo')).toBeInTheDocument();
    expect(screen.getByText('1. Use Type Guards')).toBeInTheDocument();
  });

  it('should navigate to previous slide', () => {
    render(<LivePreview theme={DEFAULT_TEMPLATE_THEME} />);

    const prevButton = screen.getByText('Anterior');
    fireEvent.click(prevButton);

    // Should wrap to last slide (CTA)
    expect(screen.getByText('CTA')).toBeInTheDocument();
  });

  it('should render all slide types', () => {
    render(<LivePreview theme={DEFAULT_TEMPLATE_THEME} />);

    const slideTypes = ['Capa', 'Conteudo', 'Codigo', 'CTA'];
    const nextButton = screen.getByText('Proximo');

    for (const slideType of slideTypes) {
      expect(screen.getByText(slideType)).toBeInTheDocument();
      fireEvent.click(nextButton);
    }
  });

  it('should show navigation indicators', () => {
    const { container } = render(<LivePreview theme={DEFAULT_TEMPLATE_THEME} />);

    // Should have 4 indicators (one for each slide type)
    const indicators = container.querySelectorAll('.rounded-full');
    expect(indicators.length).toBe(4);
  });

  it('should allow clicking indicators to navigate', () => {
    const { container } = render(<LivePreview theme={DEFAULT_TEMPLATE_THEME} />);

    // Get all indicator buttons
    const indicators = container.querySelectorAll('.rounded-full');

    // Click the third indicator (code slide)
    const thirdIndicator = indicators[2];
    if (thirdIndicator) {
      fireEvent.click(thirdIndicator);
    }

    expect(screen.getByText('Codigo')).toBeInTheDocument();
  });

  it('should display branding handle', () => {
    render(<LivePreview theme={DEFAULT_TEMPLATE_THEME} />);

    // Should show the branding handle from the theme
    expect(screen.getByText(DEFAULT_TEMPLATE_THEME.branding.handle)).toBeInTheDocument();
  });

  it('should apply theme colors', () => {
    const { container } = render(<LivePreview theme={DEFAULT_TEMPLATE_THEME} />);

    // Check that the preview container has the background color applied
    const preview = container.querySelector('.aspect-square');
    expect(preview).toHaveStyle({
      backgroundColor: DEFAULT_TEMPLATE_THEME.colors.bgSecondary,
    });
  });

  it('should render code slide with code block', () => {
    render(<LivePreview theme={DEFAULT_TEMPLATE_THEME} />);

    // Navigate to code slide
    const nextButton = screen.getByText('Proximo');
    fireEvent.click(nextButton); // content
    fireEvent.click(nextButton); // code

    expect(screen.getByText('Codigo')).toBeInTheDocument();
    expect(screen.getByText(/function isString/)).toBeInTheDocument();
  });

  it('should render content slide with content text', () => {
    render(<LivePreview theme={DEFAULT_TEMPLATE_THEME} />);

    // Navigate to content slide
    const nextButton = screen.getByText('Proximo');
    fireEvent.click(nextButton);

    expect(screen.getByText('Conteudo')).toBeInTheDocument();
    expect(screen.getByText(/Type guards permitem/)).toBeInTheDocument();
    expect(screen.getByText('2/5')).toBeInTheDocument();
  });

  it('should render CTA slide', () => {
    render(<LivePreview theme={DEFAULT_TEMPLATE_THEME} />);

    // Navigate to CTA slide
    const nextButton = screen.getByText('Proximo');
    fireEvent.click(nextButton); // content
    fireEvent.click(nextButton); // code
    fireEvent.click(nextButton); // cta

    expect(screen.getByText('CTA')).toBeInTheDocument();
    expect(screen.getByText(/Gostou\?/)).toBeInTheDocument();
  });
});
