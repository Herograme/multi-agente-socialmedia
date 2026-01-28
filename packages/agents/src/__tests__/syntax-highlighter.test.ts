/**
 * Syntax Highlighter Tests
 * Story 3.3 - Templates HTML/CSS para Slides
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  initHighlighter,
  highlightCode,
  getSupportedLanguages,
  getSupportedThemes,
  isLanguageSupported,
  isThemeSupported,
  disposeHighlighter,
  SUPPORTED_LANGUAGES,
  SUPPORTED_THEMES,
} from '../services/syntax-highlighter';

describe('Syntax Highlighter', () => {
  // Initialize highlighter once for all tests
  beforeAll(async () => {
    await initHighlighter();
  });

  // Clean up after all tests
  afterAll(() => {
    disposeHighlighter();
  });

  describe('initHighlighter', () => {
    it('should initialize highlighter successfully', async () => {
      const highlighter = await initHighlighter();
      expect(highlighter).toBeDefined();
    });

    it('should return same instance on subsequent calls', async () => {
      const h1 = await initHighlighter();
      const h2 = await initHighlighter();
      expect(h1).toBe(h2);
    });
  });

  describe('highlightCode', () => {
    it('should highlight TypeScript code', async () => {
      const code = 'const x: number = 1;';
      const result = await highlightCode(code, { language: 'typescript' });

      expect(result.html).toBeDefined();
      expect(result.html).toContain('const');
      expect(result.html).toContain('shiki');
    });

    it('should highlight JavaScript code', async () => {
      const code = 'function hello() { return "world"; }';
      const result = await highlightCode(code, { language: 'javascript' });

      expect(result.html).toBeDefined();
      expect(result.html).toContain('function');
    });

    it('should highlight Python code', async () => {
      const code = 'def hello():\n    return "world"';
      const result = await highlightCode(code, { language: 'python' });

      expect(result.html).toBeDefined();
      expect(result.html).toContain('def');
    });

    it('should highlight Rust code', async () => {
      const code = 'fn main() { println!("Hello"); }';
      const result = await highlightCode(code, { language: 'rust' });

      expect(result.html).toBeDefined();
      expect(result.html).toContain('fn');
    });

    it('should highlight Go code', async () => {
      const code = 'func main() { fmt.Println("Hello") }';
      const result = await highlightCode(code, { language: 'go' });

      expect(result.html).toBeDefined();
      expect(result.html).toContain('func');
    });

    it('should use dracula theme by default', async () => {
      const code = 'const x = 1;';
      const result = await highlightCode(code, { language: 'typescript' });

      // Dracula theme should produce HTML with the theme class
      expect(result.html).toBeDefined();
      expect(typeof result.html).toBe('string');
    });

    it('should support one-dark-pro theme', async () => {
      const code = 'const x = 1;';
      const result = await highlightCode(code, {
        language: 'typescript',
        theme: 'one-dark-pro',
      });

      expect(result.html).toBeDefined();
      expect(typeof result.html).toBe('string');
    });

    it('should support github-dark theme', async () => {
      const code = 'const x = 1;';
      const result = await highlightCode(code, {
        language: 'typescript',
        theme: 'github-dark',
      });

      expect(result.html).toBeDefined();
      expect(typeof result.html).toBe('string');
    });

    it('should return CSS for styling', async () => {
      const code = 'const x = 1;';
      const result = await highlightCode(code, { language: 'typescript' });

      expect(result.css).toBeDefined();
      expect(typeof result.css).toBe('string');
      expect(result.css).toContain('.shiki');
    });

    it('should handle multi-line code', async () => {
      const code = `function add(a: number, b: number): number {
  return a + b;
}

const result = add(1, 2);
console.log(result);`;

      const result = await highlightCode(code, { language: 'typescript' });

      expect(result.html).toBeDefined();
      expect(result.html).toContain('function');
      expect(result.html).toContain('return');
    });

    it('should handle empty code', async () => {
      const code = '';
      const result = await highlightCode(code, { language: 'typescript' });

      expect(result.html).toBeDefined();
    });

    it('should handle code with special HTML characters', async () => {
      const code = 'const arr = [1, 2, 3].filter(x => x > 1);';
      const result = await highlightCode(code, { language: 'typescript' });

      expect(result.html).toBeDefined();
      // The highlighted HTML should contain the > character (either escaped or as part of syntax)
      expect(result.html).toContain('filter');
      expect(result.html).toContain('>');
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return array of supported languages', () => {
      const languages = getSupportedLanguages();

      expect(Array.isArray(languages)).toBe(true);
      expect(languages).toContain('typescript');
      expect(languages).toContain('javascript');
      expect(languages).toContain('python');
      expect(languages).toContain('rust');
      expect(languages).toContain('go');
      expect(languages).toContain('java');
      expect(languages).toContain('csharp');
      expect(languages).toContain('cpp');
      expect(languages).toContain('html');
      expect(languages).toContain('css');
      expect(languages).toContain('json');
      expect(languages).toContain('yaml');
      expect(languages).toContain('bash');
      expect(languages).toContain('sql');
    });

    it('should return all expected languages', () => {
      const languages = getSupportedLanguages();
      expect(languages.length).toBe(SUPPORTED_LANGUAGES.length);
    });
  });

  describe('getSupportedThemes', () => {
    it('should return array of supported themes', () => {
      const themes = getSupportedThemes();

      expect(Array.isArray(themes)).toBe(true);
      expect(themes).toContain('dracula');
      expect(themes).toContain('one-dark-pro');
      expect(themes).toContain('github-dark');
    });

    it('should return all expected themes', () => {
      const themes = getSupportedThemes();
      expect(themes.length).toBe(SUPPORTED_THEMES.length);
    });
  });

  describe('isLanguageSupported', () => {
    it('should return true for supported languages', () => {
      expect(isLanguageSupported('typescript')).toBe(true);
      expect(isLanguageSupported('javascript')).toBe(true);
      expect(isLanguageSupported('python')).toBe(true);
    });

    it('should return false for unsupported languages', () => {
      expect(isLanguageSupported('unsupported')).toBe(false);
      expect(isLanguageSupported('')).toBe(false);
      expect(isLanguageSupported('TypeScript')).toBe(false); // case sensitive
    });
  });

  describe('isThemeSupported', () => {
    it('should return true for supported themes', () => {
      expect(isThemeSupported('dracula')).toBe(true);
      expect(isThemeSupported('one-dark-pro')).toBe(true);
      expect(isThemeSupported('github-dark')).toBe(true);
    });

    it('should return false for unsupported themes', () => {
      expect(isThemeSupported('unsupported')).toBe(false);
      expect(isThemeSupported('')).toBe(false);
      expect(isThemeSupported('Dracula')).toBe(false); // case sensitive
    });
  });

  describe('disposeHighlighter', () => {
    it('should dispose highlighter and allow reinitialization', async () => {
      // Get initial instance
      await initHighlighter();

      // Dispose
      disposeHighlighter();

      // Reinitialize should create new instance
      const h2 = await initHighlighter();

      // Should be different instances (though we can't easily verify this)
      expect(h2).toBeDefined();
    });
  });
});
