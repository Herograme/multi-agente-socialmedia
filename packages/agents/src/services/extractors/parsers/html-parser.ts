/**
 * HTML Parser
 * Extracts code snippets from HTML content
 */

import type { CodeSnippet, ContentParser, CodeSource } from '../types';
import { LanguageDetector } from '../language-detector';

/** Regex patterns for different code block formats */
const CODE_BLOCK_PATTERNS = [
  // Highlight.js format (check first to get proper highlighter tag)
  {
    pattern:
      /<pre[^>]*>\s*<code[^>]*class="[^"]*hljs(?:[^"]*(?:language-|lang-)(\w+))?[^"]*"[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi,
    highlighter: 'highlight.js',
  },
  // Dev.to specific format (before generic patterns)
  {
    pattern:
      /<pre[^>]*class="[^"]*highlight\s+(\w+)[^"]*"[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi,
    highlighter: 'devto',
  },
  // Prism format (language class on pre)
  {
    pattern:
      /<pre[^>]*class="[^"]*language-(\w+)[^"]*"[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi,
    highlighter: 'prism',
  },
  // Standard pre > code with language class
  {
    pattern:
      /<pre[^>]*>\s*<code[^>]*(?:class="[^"]*(?:language-|lang-)(\w+)[^"]*")[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi,
    highlighter: undefined as string | undefined,
  },
  // GitHub-style highlight
  {
    pattern:
      /<div[^>]*class="[^"]*highlight-source-(\w+)[^"]*"[^>]*>[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>/gi,
    highlighter: 'github',
  },
  // Plain pre with data-lang or data-language attribute
  {
    pattern:
      /<pre[^>]*data-lang(?:uage)?="(\w+)"[^>]*>([\s\S]*?)<\/pre>/gi,
    highlighter: undefined,
  },
  // Code block with language in data attribute on code tag
  {
    pattern:
      /<pre[^>]*>\s*<code[^>]*data-lang(?:uage)?="(\w+)"[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi,
    highlighter: undefined,
  },
  // Generic pre > code without language (must be last as fallback)
  {
    pattern: /<pre[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi,
    highlighter: undefined,
    noLangGroup: true,
  },
];

// Note: Inline code pattern reserved for future use with includeInline option
// const INLINE_CODE_PATTERN = /<code[^>]*>([^<]{1,200})<\/code>/gi;

/**
 * Parse HTML content and extract code snippets
 */
export class HtmlParser implements ContentParser {
  private languageDetector: LanguageDetector;

  constructor() {
    this.languageDetector = new LanguageDetector();
  }

  /**
   * Parse HTML content and extract code snippets
   */
  async parse(content: string): Promise<CodeSnippet[]> {
    const snippets: CodeSnippet[] = [];
    let position = 0;

    // Track positions of already extracted snippets to avoid duplicates
    const extractedRanges: Array<{ start: number; end: number }> = [];

    for (const { pattern, highlighter, noLangGroup } of CODE_BLOCK_PATTERNS) {
      // Reset regex lastIndex
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = pattern.exec(content)) !== null) {
        const matchStart = match.index;
        const matchEnd = match.index + match[0].length;

        // Skip if this range overlaps with already extracted content
        const overlaps = extractedRanges.some(
          (range) => matchStart < range.end && matchEnd > range.start
        );
        if (overlaps) {
          continue;
        }

        extractedRanges.push({ start: matchStart, end: matchEnd });
        position++;

        let language: string;
        let code: string;

        if (noLangGroup) {
          // Pattern without language capture group
          language = '';
          code = match[1];
        } else {
          language = match[1] || '';
          code = match[2];
        }

        // Decode HTML entities
        code = this.decodeHtmlEntities(code);

        // Clean up the code
        code = this.cleanCode(code);

        // Skip empty snippets
        if (!code.trim()) {
          continue;
        }

        // Detect language if not specified
        let confidence = 1.0;
        if (!language) {
          const detection = this.languageDetector.detect(code);
          language = detection.language;
          confidence = detection.confidence;
        }

        // Normalize language name
        language = this.normalizeLanguage(language);

        const source: CodeSource = {
          format: 'html',
          originalTag: this.extractOriginalTag(match[0]),
          highlighter,
        };

        const lineCount = code.split('\n').length;

        const snippet: CodeSnippet = {
          id: this.generateId(code, position),
          code,
          language,
          lineCount,
          context: {
            position,
            title: this.extractContext(content, match.index),
          },
          source,
          metadata: {
            extractedAt: new Date(),
            charCount: code.length,
            hasComments: this.hasComments(code, language),
            isComplete: this.isCodeComplete(code, language),
            confidence,
          },
        };

        snippets.push(snippet);
      }
    }

    return snippets;
  }

  /**
   * Decode HTML entities in code
   */
  private decodeHtmlEntities(html: string): string {
    const entities: Record<string, string> = {
      '&lt;': '<',
      '&gt;': '>',
      '&amp;': '&',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
      '&#x27;': "'",
      '&nbsp;': ' ',
      '&#160;': ' ',
      '&#x2F;': '/',
      '&#47;': '/',
      '&tab;': '\t',
      '&#9;': '\t',
    };

    let result = html;
    for (const [entity, char] of Object.entries(entities)) {
      result = result.replace(new RegExp(entity, 'gi'), char);
    }

    // Handle numeric entities
    result = result.replace(/&#(\d+);/g, (_, num) =>
      String.fromCharCode(parseInt(num, 10))
    );
    result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );

    return result;
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
      lines = lines.map((line) => (line.trim() ? line.slice(minIndent) : line));
    }

    return lines.join('\n');
  }

  /**
   * Extract the opening tag for source reference
   */
  private extractOriginalTag(fullMatch: string): string {
    const tagMatch = fullMatch.match(/<(pre|code)[^>]*>/i);
    return tagMatch ? tagMatch[0] : '';
  }

  /**
   * Extract context (heading or description) near the code block
   */
  private extractContext(content: string, position: number): string | undefined {
    // Look for headings before the code block
    const beforeContent = content.slice(Math.max(0, position - 500), position);

    // Find all headings and get the last one (closest to code)
    const headingMatches = beforeContent.matchAll(
      /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi
    );
    const headings = [...headingMatches];
    if (headings.length > 0) {
      const lastHeading = headings[headings.length - 1];
      return this.decodeHtmlEntities(lastHeading[1].trim());
    }

    // Find paragraph just before (look for any paragraph in the content)
    const paraMatches = beforeContent.matchAll(/<p[^>]*>([^<]+)<\/p>/gi);
    const paragraphs = [...paraMatches];
    if (paragraphs.length > 0) {
      const lastPara = paragraphs[paragraphs.length - 1];
      const text = this.decodeHtmlEntities(lastPara[1].trim());
      // Truncate long paragraphs
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
      javascript: [/\/\/.*$/, /\/\*[\s\S]*?\*\//],
      typescript: [/\/\/.*$/, /\/\*[\s\S]*?\*\//],
      python: [/#.*$/, /'''[\s\S]*?'''/, /"""[\s\S]*?"""/],
      go: [/\/\/.*$/, /\/\*[\s\S]*?\*\//],
      rust: [/\/\/.*$/, /\/\*[\s\S]*?\*\//],
      java: [/\/\/.*$/, /\/\*[\s\S]*?\*\//],
      ruby: [/#.*$/],
      php: [/\/\/.*$/, /\/\*[\s\S]*?\*\//, /#.*$/],
      bash: [/#.*$/],
      sql: [/--.*$/, /\/\*[\s\S]*?\*\//],
      html: [/<!--[\s\S]*?-->/],
      css: [/\/\*[\s\S]*?\*\//],
    };

    const patterns = commentPatterns[language] || [/\/\/.*$/, /#.*$/];
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

    return `html-${position}-${hash.slice(0, 8)}`;
  }
}
