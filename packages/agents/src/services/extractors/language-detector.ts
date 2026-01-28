/**
 * Language Detector
 * Detects programming language from code content using pattern matching
 */

import type { LanguageDetectionResult } from './types';

/** Pattern configuration for a language */
interface LanguagePattern {
  /** Patterns that indicate this language */
  patterns: RegExp[];
  /** Patterns that indicate this is NOT this language */
  antiPatterns?: RegExp[];
}

/**
 * Detects programming languages from code snippets
 */
export class LanguageDetector {
  private patterns: Map<string, LanguagePattern>;

  constructor() {
    this.patterns = new Map([
      [
        'typescript',
        {
          patterns: [
            /:\s*(string|number|boolean|any|void|never|unknown)\b/,
            /interface\s+\w+\s*[{<]/,
            /type\s+\w+\s*=/,
            /<\w+(?:\s*,\s*\w+)*>\s*[(\\[{=]/,
            /as\s+(string|number|boolean|any|const)\b/,
            /export\s+(interface|type|enum|const|function)\b/,
            /import\s+type\s*{/,
            /readonly\s+\w+:/,
            /\?\s*:/,
            /Partial<|Required<|Readonly<|Pick<|Omit<|Record</,
          ],
        },
      ],
      [
        'javascript',
        {
          patterns: [
            /\bconst\b\s+\w+\s*=/,
            /\blet\b\s+\w+\s*=/,
            /\bvar\b\s+\w+\s*=/,
            /\bfunction\s+\w*\s*\(/,
            /=>\s*[{(]/,
            /\bconsole\.(log|error|warn|info)\b/,
            /\brequire\s*\(['"`]/,
            /\bmodule\.exports\b/,
            /\basync\s+(function|\()/,
            /\bawait\s+\w+/,
            /document\.(getElementById|querySelector)/,
            /window\.\w+/,
          ],
          antiPatterns: [/:\s*(string|number|boolean|any|void)\b/],
        },
      ],
      [
        'python',
        {
          patterns: [
            /\bdef\s+\w+\s*\([^)]*\)\s*:/,
            /\bclass\s+\w+\s*[:(]/,
            /\bimport\s+\w+/,
            /\bfrom\s+\w+\s+import\b/,
            /:\s*$/m,
            /\bprint\s*\(/,
            /\bself\.\w+/,
            /\bif\s+__name__\s*==\s*['"]__main__['"]\s*:/,
            /\bTrue\b|\bFalse\b|\bNone\b/,
            /@\w+\s*\n\s*(def|class)/,
            /\belif\b/,
            /\bpass\b/,
          ],
        },
      ],
      [
        'go',
        {
          patterns: [
            /\bfunc\s+(\([^)]+\)\s*)?\w+\s*\(/,
            /\bpackage\s+\w+/,
            /\bimport\s+[("]/,
            /:=\s*/,
            /\bgo\s+\w+/,
            /\bfmt\.Print/,
            /\bstruct\s*{/,
            /\binterface\s*{/,
            /\bdefer\s+\w+/,
            /\bchan\s+\w+/,
            /\bnil\b/,
          ],
        },
      ],
      [
        'rust',
        {
          patterns: [
            /\bfn\s+\w+\s*[(<]/,
            /\blet\s+mut\b/,
            /\bimpl\s+(\w+\s+for\s+)?\w+/,
            /->\s*(\w+|&)/,
            /\bpub\s+(fn|struct|enum|mod|trait)\b/,
            /\bmatch\s+\w+\s*{/,
            /\bprintln!\s*\(/,
            /\bSome\(|\bNone\b|\bOk\(|\bErr\(/,
            /\buse\s+\w+::/,
            /&mut\s+\w+/,
            /\bmod\s+\w+/,
            /#\[derive\(/,
          ],
        },
      ],
      [
        'java',
        {
          patterns: [
            /\bpublic\s+(class|static|void|interface|enum)\b/,
            /\bprivate\s+(final\s+)?\w+/,
            /\bprotected\s+\w+/,
            /System\.out\.print/,
            /\bpackage\s+[\w.]+;/,
            /\bimport\s+[\w.]+;/,
            /@Override\b/,
            /\bextends\s+\w+/,
            /\bimplements\s+\w+/,
            /\bnew\s+\w+\s*\(/,
            /\.class\b/,
          ],
        },
      ],
      [
        'csharp',
        {
          patterns: [
            /\busing\s+[\w.]+;/,
            /\bnamespace\s+[\w.]+/,
            /\bpublic\s+(class|static|void|interface|enum|partial)\b/,
            /\bprivate\s+(readonly\s+)?\w+/,
            /Console\.Write/,
            /\bvar\s+\w+\s*=/,
            /\basync\s+Task/,
            /\bawait\s+\w+/,
            /\bget\s*;|\bset\s*;/,
            /\bnull!/,
          ],
        },
      ],
      [
        'ruby',
        {
          patterns: [
            /\bdef\s+\w+/,
            /\bclass\s+\w+\s*</,
            /\bmodule\s+\w+/,
            /\brequire\s+['"`]/,
            /\bend\s*$/m,
            /\battr_(reader|writer|accessor)\b/,
            /\bputs\s+/,
            /:\w+\s*=>/,
            /\bdo\s*\|/,
            /@\w+\s*=/,
          ],
        },
      ],
      [
        'php',
        {
          patterns: [
            /<\?php/,
            /\$\w+\s*=/,
            /\bfunction\s+\w+\s*\(/,
            /\bclass\s+\w+\s*(extends|implements)?/,
            /\bpublic\s+(function|static)\b/,
            /->[\w$]+/,
            /\becho\s+/,
            /\brequire(_once)?\s+/,
            /\buse\s+[\w\\]+;/,
            /\bnamespace\s+[\w\\]+;/,
          ],
        },
      ],
      [
        'bash',
        {
          patterns: [
            /^#!/m,
            /\becho\s+["'$]/,
            /\$\{\w+\}/,
            /\$\(\w+|`\w+/,
            /\bif\s+\[/,
            /\bthen\b/,
            /\bfi\b/,
            /\bfor\s+\w+\s+in\b/,
            /\bdone\b/,
            /\bexport\s+\w+=/,
            /\bsource\s+/,
          ],
        },
      ],
      [
        'sql',
        {
          patterns: [
            /\bSELECT\s+.+\s+FROM\b/i,
            /\bINSERT\s+INTO\b/i,
            /\bUPDATE\s+\w+\s+SET\b/i,
            /\bDELETE\s+FROM\b/i,
            /\bCREATE\s+(TABLE|DATABASE|INDEX)\b/i,
            /\bALTER\s+TABLE\b/i,
            /\bDROP\s+(TABLE|DATABASE)\b/i,
            /\bWHERE\s+\w+\s*(=|<|>|LIKE|IN)\b/i,
            /\bJOIN\s+\w+\s+ON\b/i,
            /\bGROUP\s+BY\b/i,
          ],
        },
      ],
      [
        'html',
        {
          patterns: [
            /<!DOCTYPE\s+html>/i,
            /<html[>\s]/i,
            /<head[>\s]/i,
            /<body[>\s]/i,
            /<div[>\s]/i,
            /<span[>\s]/i,
            /<p[>\s]/i,
            /<a\s+href=/i,
            /<img\s+src=/i,
            /<script[>\s]/i,
          ],
        },
      ],
      [
        'css',
        {
          patterns: [
            /\.\w+\s*{/,
            /#\w+\s*{/,
            /@media\s+/,
            /@import\s+/,
            /\bcolor\s*:/,
            /\bbackground\s*:/,
            /\bmargin\s*:/,
            /\bpadding\s*:/,
            /\bfont-\w+\s*:/,
            /\bdisplay\s*:\s*(flex|grid|block|inline)/,
          ],
        },
      ],
      [
        'yaml',
        {
          patterns: [
            /^[\w-]+:\s*$/m,
            /^\s+-\s+\w+:/m,
            /^[\w-]+:\s+\w+$/m,
            /^\s+[\w-]+:\s+["'\w]/m,
          ],
          antiPatterns: [/[{};]/],
        },
      ],
      [
        'json',
        {
          patterns: [/^\s*{\s*"\w+":/m, /^\s*\[\s*{/m, /"\w+"\s*:\s*["\d\\[{]/],
          antiPatterns: [/\bfunction\b/, /=>/],
        },
      ],
      [
        'dockerfile',
        {
          patterns: [
            /^FROM\s+[\w/:.-]+$/m,
            /^RUN\s+/m,
            /^COPY\s+/m,
            /^WORKDIR\s+/m,
            /^ENV\s+\w+=/m,
            /^EXPOSE\s+\d+/m,
            /^CMD\s+\[/m,
            /^ENTRYPOINT\s+/m,
          ],
        },
      ],
      [
        'kotlin',
        {
          patterns: [
            /\bfun\s+\w+\s*\(/,
            /\bval\s+\w+\s*[:=]/,
            /\bvar\s+\w+\s*[:=]/,
            /\bdata\s+class\b/,
            /\bobject\s+\w+/,
            /\bcompanion\s+object\b/,
            /\bprintln\s*\(/,
            /\bit\./,
          ],
        },
      ],
      [
        'swift',
        {
          patterns: [
            /\bfunc\s+\w+\s*\(/,
            /\blet\s+\w+\s*[:=]/,
            /\bvar\s+\w+\s*[:=]/,
            /\bstruct\s+\w+\s*[:{]/,
            /\bclass\s+\w+\s*[:]/,
            /\bguard\s+let\b/,
            /\bif\s+let\b/,
            /\bprint\s*\(/,
            /\bimport\s+(Foundation|UIKit|SwiftUI)\b/,
          ],
        },
      ],
    ]);
  }

  /**
   * Detect the programming language of a code snippet
   */
  detect(code: string): LanguageDetectionResult {
    const scores = new Map<string, number>();

    for (const [lang, config] of this.patterns) {
      let matches = 0;
      const { patterns, antiPatterns } = config;

      // Check for anti-patterns (disqualifying patterns)
      if (antiPatterns) {
        const hasAntiPattern = antiPatterns.some((pattern) =>
          pattern.test(code)
        );
        if (hasAntiPattern) {
          continue;
        }
      }

      // Count pattern matches
      for (const pattern of patterns) {
        if (pattern.test(code)) {
          matches++;
        }
      }

      if (matches > 0) {
        // Normalize score based on number of patterns
        const score = matches / patterns.length;
        scores.set(lang, score);
      }
    }

    // No matches found
    if (scores.size === 0) {
      return { language: 'plaintext', confidence: 0 };
    }

    // Sort by score and return the best match
    const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
    const [bestLang, bestScore] = sorted[0];

    // If TypeScript and JavaScript both matched, prefer TypeScript if TS-specific patterns matched
    if (bestLang === 'javascript' && scores.has('typescript')) {
      const tsScore = scores.get('typescript')!;
      if (tsScore >= bestScore * 0.5) {
        // TS has at least half the score
        return { language: 'typescript', confidence: tsScore };
      }
    }

    return { language: bestLang, confidence: bestScore };
  }

  /**
   * Get list of supported languages
   */
  getSupportedLanguages(): string[] {
    return [...this.patterns.keys()];
  }
}
