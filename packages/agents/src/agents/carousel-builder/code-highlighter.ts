/**
 * Code Highlighter
 * Story 3.5 - Agente Carousel Builder
 *
 * Provides syntax highlighting for code slides using Shiki.
 * Wraps the existing syntax-highlighter service with carousel-specific features.
 */

import {
  highlightCode as shikiHighlightCode,
  isLanguageSupported,
  disposeHighlighter as disposeShikiHighlighter,
  type SupportedLanguage,
  type SupportedTheme,
} from '../../services/syntax-highlighter';

/**
 * Language aliases for common abbreviations
 */
const LANGUAGE_ALIASES: Record<string, SupportedLanguage> = {
  ts: 'typescript',
  js: 'javascript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  cs: 'csharp',
  'c#': 'csharp',
  yml: 'yaml',
};

/**
 * Result from code highlighting
 */
export interface CodeHighlightResult {
  /** HTML with syntax highlighting applied */
  html: string;
  /** CSS styles for the theme */
  css: string;
  /** Original language requested */
  language: string;
  /** Normalized language used */
  normalizedLanguage: string;
  /** Whether highlighting was successful */
  success: boolean;
}

/**
 * Normalizes a language identifier.
 *
 * Handles common aliases and case normalization.
 *
 * @param language - Language identifier to normalize
 * @returns Normalized language identifier
 */
export function normalizeLanguage(language: string): string {
  const normalized = language.toLowerCase().trim();
  return LANGUAGE_ALIASES[normalized] || normalized;
}

/**
 * Escapes HTML special characters.
 *
 * Used as fallback when syntax highlighting fails.
 *
 * @param text - Text to escape
 * @returns Escaped text safe for HTML
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Highlights code with syntax coloring using Shiki.
 *
 * Falls back to plain code display if the language is not supported
 * or highlighting fails.
 *
 * @param code - Source code to highlight
 * @param language - Programming language identifier
 * @param theme - Color theme for highlighting (default: 'dracula')
 * @returns Highlighted code result with HTML and CSS
 *
 * @example
 * ```typescript
 * const result = await highlightCode('const x = 1;', 'typescript');
 * console.log(result.html); // HTML with syntax highlighting
 * ```
 */
export async function highlightCode(
  code: string,
  language: string,
  theme: SupportedTheme = 'dracula'
): Promise<CodeHighlightResult> {
  const normalizedLang = normalizeLanguage(language);

  try {
    // Check if language is supported
    if (!isLanguageSupported(normalizedLang)) {
      return createFallbackResult(code, language, normalizedLang);
    }

    // Use the existing syntax highlighter service
    const result = await shikiHighlightCode(code, {
      language: normalizedLang as SupportedLanguage,
      theme,
    });

    return {
      html: result.html,
      css: result.css,
      language,
      normalizedLanguage: normalizedLang,
      success: true,
    };
  } catch (error) {
    console.warn(
      `Failed to highlight code for language ${language}:`,
      error instanceof Error ? error.message : 'Unknown error'
    );
    return createFallbackResult(code, language, normalizedLang);
  }
}

/**
 * Creates a fallback result when highlighting fails.
 *
 * Returns plain code in a pre/code block with HTML escaping.
 *
 * @param code - Original code
 * @param language - Requested language
 * @param normalizedLanguage - Normalized language identifier
 * @returns Fallback highlight result
 */
function createFallbackResult(
  code: string,
  language: string,
  normalizedLanguage: string
): CodeHighlightResult {
  const escapedCode = escapeHtml(code);
  const html = `<pre class="shiki"><code class="language-${normalizedLanguage}">${escapedCode}</code></pre>`;

  return {
    html,
    css: '',
    language,
    normalizedLanguage,
    success: false,
  };
}

/**
 * Highlights multiple code blocks in batch.
 *
 * Useful for processing multiple code examples in a carousel.
 *
 * @param codeBlocks - Array of code blocks with language
 * @param theme - Color theme for highlighting
 * @returns Array of highlight results
 */
export async function highlightMultiple(
  codeBlocks: Array<{ code: string; language: string }>,
  theme: SupportedTheme = 'dracula'
): Promise<CodeHighlightResult[]> {
  return Promise.all(
    codeBlocks.map((block) => highlightCode(block.code, block.language, theme))
  );
}

/**
 * Checks if a language is supported for syntax highlighting.
 *
 * Handles language aliases.
 *
 * @param language - Language identifier to check
 * @returns True if the language is supported
 */
export function isSupportedLanguage(language: string): boolean {
  const normalized = normalizeLanguage(language);
  return isLanguageSupported(normalized);
}

/**
 * Disposes of the highlighter instance.
 *
 * Should be called when done highlighting to free resources.
 */
export function disposeHighlighter(): void {
  disposeShikiHighlighter();
}

/**
 * Gets the list of supported language aliases.
 *
 * @returns Record of aliases to canonical language names
 */
export function getLanguageAliases(): Record<string, string> {
  return { ...LANGUAGE_ALIASES };
}
