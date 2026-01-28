/**
 * Syntax Highlighter Service
 * Story 3.3 - Templates HTML/CSS para Slides
 *
 * Wraps Shiki for syntax highlighting in carousel code slides.
 * Uses a singleton pattern for the highlighter instance.
 */

import {
  createHighlighter,
  type Highlighter,
  type BundledLanguage,
  type BundledTheme,
} from 'shiki';

/**
 * Options for syntax highlighting
 */
export interface HighlightOptions {
  /** Programming language for syntax highlighting */
  language: BundledLanguage;
  /** Theme to use (defaults to 'dracula') */
  theme?: BundledTheme;
}

/**
 * Result of highlighting code
 */
export interface HighlightResult {
  /** HTML string with highlighted code */
  html: string;
  /** CSS for the theme (for inline styles) */
  css: string;
}

/** Supported languages for highlighting */
export const SUPPORTED_LANGUAGES = [
  'typescript',
  'javascript',
  'python',
  'rust',
  'go',
  'java',
  'csharp',
  'cpp',
  'html',
  'css',
  'json',
  'yaml',
  'bash',
  'sql',
] as const;

/** Supported themes for highlighting */
export const SUPPORTED_THEMES = [
  'dracula',
  'one-dark-pro',
  'github-dark',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export type SupportedTheme = (typeof SUPPORTED_THEMES)[number];

/** Singleton highlighter instance */
let highlighterInstance: Highlighter | null = null;

/**
 * Initializes the Shiki highlighter with predefined themes and languages.
 * Uses a singleton pattern - subsequent calls return the same instance.
 *
 * @returns The initialized highlighter instance
 */
export async function initHighlighter(): Promise<Highlighter> {
  if (highlighterInstance) {
    return highlighterInstance;
  }

  highlighterInstance = await createHighlighter({
    themes: [...SUPPORTED_THEMES],
    langs: [...SUPPORTED_LANGUAGES],
  });

  return highlighterInstance;
}

/**
 * Applies syntax highlighting to code using Shiki.
 *
 * @param code - The source code to highlight
 * @param options - Highlighting options (language, theme)
 * @returns Object with highlighted HTML and theme CSS
 *
 * @example
 * ```typescript
 * const result = await highlightCode(
 *   'const x: number = 1;',
 *   { language: 'typescript' }
 * );
 * console.log(result.html); // HTML with syntax highlighting
 * ```
 */
export async function highlightCode(
  code: string,
  options: HighlightOptions
): Promise<HighlightResult> {
  const highlighter = await initHighlighter();

  const theme = options.theme || 'dracula';

  const html = highlighter.codeToHtml(code, {
    lang: options.language,
    theme,
  });

  // Generate minimal CSS override for the Shiki theme
  const css = `
    .shiki {
      background-color: transparent !important;
    }
  `;

  return { html, css };
}

/**
 * Returns the list of supported programming languages.
 */
export function getSupportedLanguages(): readonly string[] {
  return SUPPORTED_LANGUAGES;
}

/**
 * Returns the list of supported syntax themes.
 */
export function getSupportedThemes(): readonly string[] {
  return SUPPORTED_THEMES;
}

/**
 * Checks if a language is supported for highlighting.
 *
 * @param language - Language identifier to check
 * @returns True if the language is supported
 */
export function isLanguageSupported(language: string): language is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(language as SupportedLanguage);
}

/**
 * Checks if a theme is supported for highlighting.
 *
 * @param theme - Theme identifier to check
 * @returns True if the theme is supported
 */
export function isThemeSupported(theme: string): theme is SupportedTheme {
  return SUPPORTED_THEMES.includes(theme as SupportedTheme);
}

/**
 * Disposes of the highlighter instance.
 * Useful for cleanup in tests or when reinitializing.
 */
export function disposeHighlighter(): void {
  if (highlighterInstance) {
    highlighterInstance.dispose();
    highlighterInstance = null;
  }
}
