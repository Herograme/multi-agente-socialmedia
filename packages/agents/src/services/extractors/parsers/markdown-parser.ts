/**
 * Markdown Parser
 * Extracts code snippets from Markdown content
 */

import type { CodeSnippet, ContentParser, CodeSource } from '../types';
import { LanguageDetector } from '../language-detector';

/** Regex for fenced code blocks (``` or ~~~) */
const FENCED_CODE_PATTERN = /^(`{3,}|~{3,})(\w*)\s*\n([\s\S]*?)^\1\s*$/gm;

/** Regex for indented code blocks (4 spaces or 1 tab) */
const INDENTED_CODE_PATTERN = /(?:^(?:[ ]{4}|\t).*$\n?)+/gm;

/**
 * Parse Markdown content and extract code snippets
 */
export class MarkdownParser implements ContentParser {
  private languageDetector: LanguageDetector;

  constructor() {
    this.languageDetector = new LanguageDetector();
  }

  /**
   * Parse Markdown content and extract code snippets
   */
  async parse(content: string): Promise<CodeSnippet[]> {
    const snippets: CodeSnippet[] = [];
    let position = 0;

    // Extract fenced code blocks first (they take priority)
    const fencedSnippets = this.extractFencedBlocks(content);
    const fencedRanges = fencedSnippets.map((s) => s.range);

    for (const { code, language, range, fence } of fencedSnippets) {
      position++;

      // Detect language if not specified
      let detectedLang = language;
      let confidence = 1.0;

      if (!detectedLang) {
        const detection = this.languageDetector.detect(code);
        detectedLang = detection.language;
        confidence = detection.confidence;
      }

      // Normalize language name
      detectedLang = this.normalizeLanguage(detectedLang);

      const source: CodeSource = {
        format: 'markdown',
        originalTag: `${fence}${language}`,
        highlighter: undefined,
      };

      const lineCount = code.split('\n').length;

      const snippet: CodeSnippet = {
        id: this.generateId(code, position),
        code,
        language: detectedLang,
        lineCount,
        context: {
          position,
          title: this.extractHeadingBefore(content, range.start),
          description: this.extractDescriptionBefore(content, range.start),
        },
        source,
        metadata: {
          extractedAt: new Date(),
          charCount: code.length,
          hasComments: this.hasComments(code, detectedLang),
          isComplete: this.isCodeComplete(code, detectedLang),
          confidence,
        },
      };

      snippets.push(snippet);
    }

    // Extract indented code blocks (skip if they overlap with fenced blocks)
    const indentedSnippets = this.extractIndentedBlocks(content, fencedRanges);

    for (const { code, range } of indentedSnippets) {
      position++;

      // Detect language for indented blocks
      const detection = this.languageDetector.detect(code);
      const detectedLang = detection.language;
      const confidence = detection.confidence;

      const source: CodeSource = {
        format: 'markdown',
        originalTag: '    (indented)',
        highlighter: undefined,
      };

      const lineCount = code.split('\n').length;

      const snippet: CodeSnippet = {
        id: this.generateId(code, position),
        code,
        language: detectedLang,
        lineCount,
        context: {
          position,
          title: this.extractHeadingBefore(content, range.start),
          description: this.extractDescriptionBefore(content, range.start),
        },
        source,
        metadata: {
          extractedAt: new Date(),
          charCount: code.length,
          hasComments: this.hasComments(code, detectedLang),
          isComplete: this.isCodeComplete(code, detectedLang),
          confidence,
        },
      };

      snippets.push(snippet);
    }

    return snippets;
  }

  /**
   * Extract fenced code blocks
   */
  private extractFencedBlocks(
    content: string
  ): Array<{
    code: string;
    language: string;
    range: { start: number; end: number };
    fence: string;
  }> {
    const blocks: Array<{
      code: string;
      language: string;
      range: { start: number; end: number };
      fence: string;
    }> = [];

    // Reset regex
    FENCED_CODE_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = FENCED_CODE_PATTERN.exec(content)) !== null) {
      const fence = match[1];
      const language = match[2] || '';
      let code = match[3];

      // Clean up the code
      code = this.cleanCode(code);

      // Skip empty blocks
      if (!code.trim()) {
        continue;
      }

      blocks.push({
        code,
        language,
        range: {
          start: match.index,
          end: match.index + match[0].length,
        },
        fence,
      });
    }

    return blocks;
  }

  /**
   * Extract indented code blocks
   */
  private extractIndentedBlocks(
    content: string,
    excludeRanges: Array<{ start: number; end: number }>
  ): Array<{
    code: string;
    range: { start: number; end: number };
  }> {
    const blocks: Array<{
      code: string;
      range: { start: number; end: number };
    }> = [];

    // Reset regex
    INDENTED_CODE_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = INDENTED_CODE_PATTERN.exec(content)) !== null) {
      const matchStart = match.index;
      const matchEnd = match.index + match[0].length;

      // Skip if this range overlaps with fenced blocks
      const overlaps = excludeRanges.some(
        (range) => matchStart < range.end && matchEnd > range.start
      );
      if (overlaps) {
        continue;
      }

      // Check if this is inside a list item (common false positive)
      const beforeMatch = content.slice(Math.max(0, matchStart - 50), matchStart);
      if (/[-*+]\s+\S.*\n\s*$/.test(beforeMatch)) {
        // Likely a continuation of a list item, skip
        continue;
      }

      // Remove the 4-space/tab indentation
      let code = match[0]
        .split('\n')
        .map((line) => {
          if (line.startsWith('    ')) {
            return line.slice(4);
          } else if (line.startsWith('\t')) {
            return line.slice(1);
          }
          return line;
        })
        .join('\n');

      // Clean up the code
      code = this.cleanCode(code);

      // Skip empty or very short blocks (likely not code)
      if (!code.trim() || code.trim().split('\n').length < 2) {
        continue;
      }

      blocks.push({
        code,
        range: {
          start: matchStart,
          end: matchEnd,
        },
      });
    }

    return blocks;
  }

  /**
   * Clean up extracted code
   */
  private cleanCode(code: string): string {
    // Remove leading/trailing whitespace while preserving internal indentation
    let lines = code.split('\n');

    // Remove empty lines at start and end
    while (lines.length > 0 && !lines[0].trim()) {
      lines.shift();
    }
    while (lines.length > 0 && !lines[lines.length - 1].trim()) {
      lines.pop();
    }

    // Find minimum indentation (excluding empty lines)
    let minIndent = Infinity;
    for (const line of lines) {
      if (line.trim()) {
        const indent = line.match(/^\s*/)?.[0].length ?? 0;
        minIndent = Math.min(minIndent, indent);
      }
    }

    // Remove common indentation
    if (minIndent > 0 && minIndent < Infinity) {
      lines = lines.map((line) => (line.trim() ? line.slice(minIndent) : ''));
    }

    return lines.join('\n');
  }

  /**
   * Extract heading before the code block
   */
  private extractHeadingBefore(content: string, position: number): string | undefined {
    const beforeContent = content.slice(Math.max(0, position - 500), position);

    // Find the closest markdown heading
    const headingMatch = beforeContent.match(/^(#{1,6})\s+(.+)$/gm);
    if (headingMatch && headingMatch.length > 0) {
      const lastHeading = headingMatch[headingMatch.length - 1];
      return lastHeading.replace(/^#{1,6}\s+/, '').trim();
    }

    return undefined;
  }

  /**
   * Extract description (paragraph) before the code block
   */
  private extractDescriptionBefore(
    content: string,
    position: number
  ): string | undefined {
    const beforeContent = content.slice(Math.max(0, position - 300), position);

    // Find the last paragraph (non-heading, non-empty text)
    const lines = beforeContent.split('\n').reverse();

    for (const line of lines) {
      const trimmed = line.trim();
      // Skip empty lines and code-related markers
      if (!trimmed || trimmed.startsWith('#') || trimmed.match(/^[`~]{3}/)) {
        continue;
      }
      // Found a text line
      const text = trimmed;
      return text.length > 100 ? text.slice(0, 100) + '...' : text;
    }

    return undefined;
  }

  /**
   * Normalize language identifiers
   */
  private normalizeLanguage(lang: string): string {
    const normalized = lang.toLowerCase().trim();
    const aliases: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      rb: 'ruby',
      sh: 'bash',
      shell: 'bash',
      zsh: 'bash',
      yml: 'yaml',
      dockerfile: 'dockerfile',
      docker: 'dockerfile',
      md: 'markdown',
      cs: 'csharp',
      'c#': 'csharp',
      'c++': 'cpp',
      golang: 'go',
    };

    return aliases[normalized] || normalized;
  }

  /**
   * Check if code contains comments
   */
  private hasComments(code: string, language: string): boolean {
    const commentPatterns: Record<string, RegExp[]> = {
      javascript: [/\/\/.*$/m, /\/\*[\s\S]*?\*\//],
      typescript: [/\/\/.*$/m, /\/\*[\s\S]*?\*\//],
      python: [/#.*$/m, /'''[\s\S]*?'''/, /"""[\s\S]*?"""/],
      go: [/\/\/.*$/m, /\/\*[\s\S]*?\*\//],
      rust: [/\/\/.*$/m, /\/\*[\s\S]*?\*\//],
      java: [/\/\/.*$/m, /\/\*[\s\S]*?\*\//],
      ruby: [/#.*$/m],
      php: [/\/\/.*$/m, /\/\*[\s\S]*?\*\//, /#.*$/m],
      bash: [/#.*$/m],
      sql: [/--.*$/m, /\/\*[\s\S]*?\*\//],
      html: [/<!--[\s\S]*?-->/],
      css: [/\/\*[\s\S]*?\*\//],
    };

    const patterns = commentPatterns[language] || [/\/\/.*$/m, /#.*$/m];
    return patterns.some((pattern) => pattern.test(code));
  }

  /**
   * Check if code appears to be complete (not truncated)
   */
  private isCodeComplete(code: string, _language: string): boolean {
    // Check for balanced brackets
    const openBrackets = (code.match(/{/g) || []).length;
    const closeBrackets = (code.match(/}/g) || []).length;
    if (openBrackets !== closeBrackets) return false;

    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) return false;

    const openSquare = (code.match(/\[/g) || []).length;
    const closeSquare = (code.match(/\]/g) || []).length;
    if (openSquare !== closeSquare) return false;

    // Check for truncation indicators
    if (/\.\.\.\s*$/.test(code)) return false;
    if (/\/\/\s*\.\.\.\s*$/.test(code)) return false;
    if (/#\s*\.\.\.\s*$/.test(code)) return false;

    return true;
  }

  /**
   * Generate a unique ID for the snippet
   */
  private generateId(code: string, position: number): string {
    // Simple hash based on code content and position
    const hash = code
      .split('')
      .reduce((acc, char) => {
        const h = ((acc << 5) - acc + char.charCodeAt(0)) | 0;
        return h;
      }, 0)
      .toString(16)
      .replace('-', '');

    return `md-${position}-${hash.slice(0, 8)}`;
  }
}
