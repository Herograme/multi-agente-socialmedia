/**
 * LivePreview Component
 * Story 5.7 - Editor de Templates de Carrossel
 *
 * Real-time preview of template with slide navigation.
 */

import { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import type { TemplateTheme, TemplateSlideType } from '@social-content/shared';
import { TEMPLATE_SLIDE_TYPES } from '@social-content/shared';

interface LivePreviewProps {
  theme: TemplateTheme;
  className?: string;
}

interface CoverData {
  title: string;
  subtitle: string;
}

interface ContentData {
  title: string;
  content: string;
  slideNumber: string;
}

interface CodeData {
  title: string;
  language: string;
  code: string;
}

interface CtaData {
  cta: string;
  subtitle: string;
}

const SAMPLE_DATA: {
  cover: CoverData;
  content: ContentData;
  code: CodeData;
  cta: CtaData;
} = {
  cover: {
    title: '5 Dicas de TypeScript',
    subtitle: 'Para desenvolvedores',
  },
  content: {
    title: '1. Use Type Guards',
    content: 'Type guards permitem verificar tipos em runtime de forma segura e com inferencia automatica.',
    slideNumber: '2/5',
  },
  code: {
    title: 'Exemplo de Type Guard',
    language: 'typescript',
    code: `function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// Uso
const data: unknown = "hello";
if (isString(data)) {
  console.log(data.toUpperCase());
}`,
  },
  cta: {
    cta: 'Gostou? Salve e compartilhe!',
    subtitle: 'Siga para mais conteudo',
  },
};

const SLIDE_LABELS: Record<TemplateSlideType, string> = {
  cover: 'Capa',
  content: 'Conteudo',
  code: 'Codigo',
  cta: 'CTA',
};

export function LivePreview({ theme, className }: LivePreviewProps) {
  const [currentSlide, setCurrentSlide] = useState<TemplateSlideType>('cover');

  // Generate CSS variables from theme
  const cssVariables = useMemo((): React.CSSProperties => {
    return {
      '--bg-primary': theme.colors.bgPrimary,
      '--bg-secondary': theme.colors.bgSecondary,
      '--bg-tertiary': theme.colors.bgTertiary,
      '--text-primary': theme.colors.textPrimary,
      '--text-secondary': theme.colors.textSecondary,
      '--text-muted': theme.colors.textMuted,
      '--accent-primary': theme.colors.accentPrimary,
      '--accent-secondary': theme.colors.accentSecondary,
      '--font-sans': `'${theme.fonts.fontSans}', sans-serif`,
      '--font-mono': `'${theme.fonts.fontMono}', monospace`,
      '--font-size-base': theme.fonts.fontSizeBase,
    } as React.CSSProperties;
  }, [theme]);

  const handlePrev = () => {
    const idx = TEMPLATE_SLIDE_TYPES.indexOf(currentSlide);
    const newIdx = idx === 0 ? TEMPLATE_SLIDE_TYPES.length - 1 : idx - 1;
    const newSlide = TEMPLATE_SLIDE_TYPES[newIdx];
    if (newSlide) {
      setCurrentSlide(newSlide);
    }
  };

  const handleNext = () => {
    const idx = TEMPLATE_SLIDE_TYPES.indexOf(currentSlide);
    const newIdx = (idx + 1) % TEMPLATE_SLIDE_TYPES.length;
    const newSlide = TEMPLATE_SLIDE_TYPES[newIdx];
    if (newSlide) {
      setCurrentSlide(newSlide);
    }
  };

  const renderSlideContent = () => {
    const fontSizeMultiplier = theme.fonts.fontSizeBase;

    switch (currentSlide) {
      case 'cover': {
        const data = SAMPLE_DATA.cover;
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <h1
              style={{
                color: theme.colors.textPrimary,
                fontFamily: `var(--font-sans)`,
                fontSize: `${2 * fontSizeMultiplier}rem`,
                fontWeight: 'bold',
                marginBottom: '0.5rem',
              }}
            >
              {data.title}
            </h1>
            <p
              style={{
                color: theme.colors.textSecondary,
                fontFamily: `var(--font-sans)`,
                fontSize: `${1 * fontSizeMultiplier}rem`,
              }}
            >
              {data.subtitle}
            </p>
          </div>
        );
      }

      case 'content': {
        const data = SAMPLE_DATA.content;
        return (
          <div className="flex flex-col h-full p-8">
            <div className="flex justify-between items-start mb-4">
              <h2
                style={{
                  color: theme.colors.accentPrimary,
                  fontFamily: `var(--font-sans)`,
                  fontSize: `${1.5 * fontSizeMultiplier}rem`,
                  fontWeight: 'bold',
                }}
              >
                {data.title}
              </h2>
              <span
                style={{
                  color: theme.colors.textMuted,
                  fontFamily: `var(--font-sans)`,
                  fontSize: `${0.75 * fontSizeMultiplier}rem`,
                }}
              >
                {data.slideNumber}
              </span>
            </div>
            <p
              style={{
                color: theme.colors.textPrimary,
                fontFamily: `var(--font-sans)`,
                fontSize: `${1 * fontSizeMultiplier}rem`,
                lineHeight: 1.6,
              }}
            >
              {data.content}
            </p>
          </div>
        );
      }

      case 'code': {
        const data = SAMPLE_DATA.code;
        return (
          <div className="flex flex-col h-full p-8">
            <h2
              style={{
                color: theme.colors.accentPrimary,
                fontFamily: `var(--font-sans)`,
                fontSize: `${1.25 * fontSizeMultiplier}rem`,
                fontWeight: 'bold',
                marginBottom: '1rem',
              }}
            >
              {data.title}
            </h2>
            <div
              className="flex-1 rounded-lg p-4 overflow-auto"
              style={{
                backgroundColor: theme.colors.bgTertiary,
              }}
            >
              <pre
                style={{
                  color: theme.colors.textPrimary,
                  fontFamily: `var(--font-mono)`,
                  fontSize: `${0.75 * fontSizeMultiplier}rem`,
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {data.code}
              </pre>
            </div>
          </div>
        );
      }

      case 'cta': {
        const data = SAMPLE_DATA.cta;
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <h2
              style={{
                color: theme.colors.accentPrimary,
                fontFamily: `var(--font-sans)`,
                fontSize: `${1.5 * fontSizeMultiplier}rem`,
                fontWeight: 'bold',
                marginBottom: '0.5rem',
              }}
            >
              {data.cta}
            </h2>
            <p
              style={{
                color: theme.colors.textSecondary,
                fontFamily: `var(--font-sans)`,
                fontSize: `${1 * fontSizeMultiplier}rem`,
              }}
            >
              {data.subtitle}
            </p>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className || ''}`}>
      {/* Preview Container */}
      <div
        className="relative w-full max-w-[350px] aspect-square rounded-lg overflow-hidden shadow-lg"
        style={{
          ...cssVariables,
          backgroundColor: theme.colors.bgSecondary,
        }}
      >
        {/* Slide Content */}
        {renderSlideContent()}

        {/* Branding Footer */}
        <div
          className="absolute bottom-0 left-0 right-0 p-3 flex"
          style={{
            justifyContent:
              theme.branding.position === 'footer-left'
                ? 'flex-start'
                : theme.branding.position === 'footer-right'
                ? 'flex-end'
                : 'center',
          }}
        >
          <span
            style={{
              color: theme.colors.textMuted,
              fontFamily: `var(--font-sans)`,
              fontSize: `${0.75 * theme.fonts.fontSizeBase}rem`,
            }}
          >
            {theme.branding.handle}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={handlePrev}>
          Anterior
        </Button>

        <span className="text-sm font-medium min-w-[80px] text-center">
          {SLIDE_LABELS[currentSlide]}
        </span>

        <Button variant="outline" size="sm" onClick={handleNext}>
          Proximo
        </Button>
      </div>

      {/* Slide Indicators */}
      <div className="flex gap-2">
        {TEMPLATE_SLIDE_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setCurrentSlide(type)}
            className={`w-2 h-2 rounded-full transition-colors ${
              type === currentSlide ? 'bg-primary' : 'bg-muted'
            }`}
            title={SLIDE_LABELS[type]}
          />
        ))}
      </div>
    </div>
  );
}
