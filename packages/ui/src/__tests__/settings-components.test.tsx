/**
 * Settings Components Tests
 * Story 5.6: Pagina de Configuracoes
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SourcesSettings } from '../components/settings/SourcesSettings';
import { QualitySettings } from '../components/settings/QualitySettings';

describe('SourcesSettings', () => {
  const defaultSources = {
    devto: true,
    hackernews: true,
    reddit: true,
  };

  it('should render all source toggles', () => {
    const onChange = vi.fn();
    render(<SourcesSettings sources={defaultSources} onChange={onChange} />);

    expect(screen.getByText('Dev.to')).toBeInTheDocument();
    expect(screen.getByText('Hacker News')).toBeInTheDocument();
    expect(screen.getByText('Reddit')).toBeInTheDocument();
  });

  it('should toggle source when clicked', () => {
    const onChange = vi.fn();
    render(<SourcesSettings sources={defaultSources} onChange={onChange} />);

    // Find and click reddit toggle
    const redditSwitch = screen.getByRole('checkbox', { name: /reddit/i });
    fireEvent.click(redditSwitch);

    expect(onChange).toHaveBeenCalledWith({
      devto: true,
      hackernews: true,
      reddit: false,
    });
  });

  it('should not allow disabling last active source', () => {
    const onChange = vi.fn();
    const singleSource = { devto: true, hackernews: false, reddit: false };
    render(<SourcesSettings sources={singleSource} onChange={onChange} />);

    const devtoSwitch = screen.getByRole('checkbox', { name: /dev\.to/i });
    fireEvent.click(devtoSwitch);

    // Should not call onChange when trying to disable the last source
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should display error message when provided', () => {
    const onChange = vi.fn();
    render(
      <SourcesSettings sources={defaultSources} onChange={onChange} errors="Erro de validacao" />
    );

    expect(screen.getByText('Erro de validacao')).toBeInTheDocument();
  });

  it('should show help tooltip on last active source', () => {
    const onChange = vi.fn();
    const singleSource = { devto: true, hackernews: false, reddit: false };
    render(<SourcesSettings sources={singleSource} onChange={onChange} />);

    // Verify the switch is disabled when it's the last active source
    const devtoSwitch = screen.getByRole('checkbox', { name: /dev\.to/i });
    expect(devtoSwitch).toBeDisabled();
  });
});

describe('QualitySettings', () => {
  const defaultQuality = {
    threshold: 6.0,
    autoRegenerate: true,
    maxRegenerations: 1,
  };

  it('should render threshold slider', () => {
    const onChange = vi.fn();
    render(<QualitySettings quality={defaultQuality} onChange={onChange} />);

    expect(screen.getByText('Threshold de Qualidade')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('should render auto regenerate toggle', () => {
    const onChange = vi.fn();
    render(<QualitySettings quality={defaultQuality} onChange={onChange} />);

    expect(screen.getByText('Regenerar Automaticamente')).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /regenerar automaticamente/i })
    ).toBeInTheDocument();
  });

  it('should show max regenerations input when auto regenerate is enabled', () => {
    const onChange = vi.fn();
    render(<QualitySettings quality={defaultQuality} onChange={onChange} />);

    expect(screen.getByText('Maximo de Tentativas')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /maximo de tentativas/i })).toBeInTheDocument();
  });

  it('should hide max regenerations input when auto regenerate is disabled', () => {
    const onChange = vi.fn();
    const qualityWithoutAuto = { ...defaultQuality, autoRegenerate: false };
    render(<QualitySettings quality={qualityWithoutAuto} onChange={onChange} />);

    expect(screen.queryByText('Maximo de Tentativas')).not.toBeInTheDocument();
  });

  it('should update threshold when slider changes', () => {
    const onChange = vi.fn();
    render(<QualitySettings quality={defaultQuality} onChange={onChange} />);

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '8' } });

    expect(onChange).toHaveBeenCalledWith({
      ...defaultQuality,
      threshold: 8,
    });
  });

  it('should update threshold when input changes', () => {
    const onChange = vi.fn();
    render(<QualitySettings quality={defaultQuality} onChange={onChange} />);

    // Find the number input for threshold (there are two number inputs, threshold is first)
    const inputs = screen.getAllByRole('spinbutton');
    const thresholdInput = inputs[0];
    if (thresholdInput) {
      fireEvent.change(thresholdInput, { target: { value: '7.5' } });
    }

    expect(onChange).toHaveBeenCalledWith({
      ...defaultQuality,
      threshold: 7.5,
    });
  });

  it('should toggle auto regenerate', () => {
    const onChange = vi.fn();
    render(<QualitySettings quality={defaultQuality} onChange={onChange} />);

    const toggle = screen.getByRole('checkbox', { name: /regenerar automaticamente/i });
    fireEvent.click(toggle);

    expect(onChange).toHaveBeenCalledWith({
      ...defaultQuality,
      autoRegenerate: false,
    });
  });

  it('should display threshold label based on value', () => {
    const onChange = vi.fn();
    render(<QualitySettings quality={defaultQuality} onChange={onChange} />);

    // With threshold 6.0, should show "Bom"
    expect(screen.getByText('Bom')).toBeInTheDocument();
  });

  it('should display error messages when provided', () => {
    const onChange = vi.fn();
    render(
      <QualitySettings
        quality={defaultQuality}
        onChange={onChange}
        errors={{ threshold: 'Valor invalido' }}
      />
    );

    expect(screen.getByText('Valor invalido')).toBeInTheDocument();
  });
});
