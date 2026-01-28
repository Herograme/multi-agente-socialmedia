/**
 * Code Snippet Extractor Types
 * Types and interfaces for extracting code snippets from content
 */

/**
 * Context information about where the code snippet appears
 */
export interface CodeContext {
  /** Title of the section where the code appears */
  title?: string;
  /** Text before/after the code */
  description?: string;
  /** Position in the document (1-indexed) */
  position: number;
}

/**
 * Source information about the code snippet format
 */
export interface CodeSource {
  /** Format of the content (html or markdown) */
  format: 'html' | 'markdown';
  /** Original tag or fence, e.g., '<pre class="hljs">' or '```typescript' */
  originalTag?: string;
  /** Syntax highlighter used, e.g., 'highlight.js', 'prism' */
  highlighter?: string;
}

/**
 * Metadata about the extracted snippet
 */
export interface SnippetMetadata {
  /** When the snippet was extracted */
  extractedAt: Date;
  /** Character count of the code */
  charCount: number;
  /** Whether the code contains comments */
  hasComments: boolean;
  /** Whether the code appears complete (not truncated) */
  isComplete: boolean;
  /** Confidence score for language detection (0-1) */
  confidence: number;
}

/**
 * A single code snippet extracted from content
 */
export interface CodeSnippet {
  /** Unique identifier for the snippet */
  id: string;
  /** The actual code content */
  code: string;
  /** Detected or specified programming language */
  language: string;
  /** Number of lines in the code */
  lineCount: number;
  /** Context information */
  context?: CodeContext;
  /** Source format information */
  source: CodeSource;
  /** Additional metadata */
  metadata: SnippetMetadata;
}

/**
 * Options for the code extractor
 */
export interface ExtractorOptions {
  /** Minimum number of lines to include (default: 2) */
  minLines?: number;
  /** Maximum number of lines (default: 100) */
  maxLines?: number;
  /** Include inline code (default: false) */
  includeInline?: boolean;
  /** Enable deduplication (default: true) */
  deduplication?: boolean;
  /** Similarity threshold for duplicates (default: 0.9) */
  similarityThreshold?: number;
}

/**
 * Result of code extraction
 */
export interface ExtractionResult {
  /** Array of extracted code snippets */
  snippets: CodeSnippet[];
  /** Metadata about the extraction process */
  metadata: {
    /** Total snippets found before deduplication */
    totalFound: number;
    /** Number of duplicates removed */
    duplicatesRemoved: number;
    /** Format of the source content */
    format: 'html' | 'markdown' | 'mixed';
    /** When extraction was performed */
    extractedAt: Date;
  };
}

/**
 * Interface for content parsers
 */
export interface ContentParser {
  /** Parse content and extract code snippets */
  parse(content: string): Promise<CodeSnippet[]>;
}

/**
 * Language detection result
 */
export interface LanguageDetectionResult {
  /** Detected language */
  language: string;
  /** Confidence score (0-1) */
  confidence: number;
}
