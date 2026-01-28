/**
 * Content Splitter
 * Story 3.5 - Agente Carousel Builder
 *
 * Splits content into balanced slides for carousel generation.
 * Handles markdown parsing, code block detection, and content distribution.
 */

import type {
  CodeExample,
  ContentSplitResult,
  SplitSlide,
  SplitterConfig,
} from './types';
import { SlideType } from './types';

/**
 * Default configuration for the content splitter
 */
const DEFAULT_SPLITTER_CONFIG: SplitterConfig = {
  maxSlides: 10,
  maxCharsPerSlide: 280, // Optimized for readability on 1080x1080
  minCharsPerSlide: 100,
};

/**
 * Splits content into balanced carousel slides.
 *
 * Creates a cover slide from the title, distributes body content
 * across multiple slides, inserts code examples where appropriate,
 * and adds a CTA slide at the end.
 *
 * @param content - Full content text (with markdown support)
 * @param codeExamples - Optional code examples to include
 * @param config - Optional configuration overrides
 * @returns Split result with slides and metadata
 *
 * @example
 * ```typescript
 * const result = splitContent(
 *   '# My Title\n\nFirst paragraph.\n\nSecond paragraph.',
 *   [{ code: 'const x = 1;', language: 'typescript' }],
 *   { maxSlides: 5 }
 * );
 * ```
 */
export function splitContent(
  content: string,
  codeExamples: CodeExample[] = [],
  config: Partial<SplitterConfig> = {}
): ContentSplitResult {
  const cfg: SplitterConfig = { ...DEFAULT_SPLITTER_CONFIG, ...config };
  const slides: SplitSlide[] = [];

  // Extract title and body from content
  const { title, body } = extractTitle(content);

  // Slide 1: Cover with title
  slides.push({
    type: SlideType.COVER,
    title,
  });

  // Split body into paragraphs
  const paragraphs = splitIntoParagraphs(body);

  // Calculate available slots for content (reserve for cover and CTA)
  const contentSlots = cfg.maxSlides - 2;

  // Distribute content across slides
  const contentSlides = distributeContent(
    paragraphs,
    cfg.maxCharsPerSlide,
    contentSlots
  );

  slides.push(...contentSlides);

  // Insert code slides where appropriate
  if (codeExamples.length > 0) {
    insertCodeSlides(slides, codeExamples, cfg.maxSlides);
  }

  // Ensure we don't exceed maxSlides (reserve 1 for CTA)
  const finalSlides = slides.slice(0, cfg.maxSlides - 1);

  // Add CTA slide at the end
  finalSlides.push({
    type: SlideType.CTA,
  });

  return {
    slides: finalSlides,
    hasCode: codeExamples.length > 0,
    totalCharacters: content.length,
  };
}

/**
 * Extracts the title and body from content.
 *
 * Handles:
 * - Markdown headers (# Title)
 * - First line as title fallback
 * - Title length limiting
 *
 * @param content - Full content text
 * @returns Object with extracted title and remaining body
 */
export function extractTitle(content: string): { title: string; body: string } {
  const lines = content.split('\n').filter((line) => line.trim());

  if (lines.length === 0) {
    return { title: 'Sem titulo', body: '' };
  }

  // Extract first line and remove markdown header prefix
  let title = lines[0].replace(/^#+\s*/, '').trim();

  // Limit title length for visual appeal
  const MAX_TITLE_LENGTH = 60;
  if (title.length > MAX_TITLE_LENGTH) {
    title = title.substring(0, MAX_TITLE_LENGTH - 3) + '...';
  }

  // Rest is the body
  const body = lines.slice(1).join('\n').trim();

  return { title, body };
}

/**
 * Splits text into paragraphs.
 *
 * Uses double newlines as paragraph separators.
 * Filters out empty paragraphs.
 *
 * @param text - Text to split
 * @returns Array of paragraph strings
 */
export function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * Distributes paragraphs across slides with balanced content.
 *
 * Uses a greedy algorithm to fill slides without exceeding
 * the character limit, while maintaining logical paragraph breaks.
 *
 * @param paragraphs - Array of paragraphs to distribute
 * @param maxCharsPerSlide - Maximum characters per slide
 * @param maxSlides - Maximum number of content slides
 * @returns Array of content slides
 */
export function distributeContent(
  paragraphs: string[],
  maxCharsPerSlide: number,
  maxSlides: number
): SplitSlide[] {
  const slides: SplitSlide[] = [];
  let currentContent = '';

  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed limit, create new slide
    const wouldExceed =
      currentContent.length + paragraph.length > maxCharsPerSlide;
    const hasContent = currentContent.length > 0;

    if (wouldExceed && hasContent) {
      slides.push({
        type: SlideType.CONTENT,
        content: currentContent.trim(),
      });
      currentContent = paragraph;
    } else {
      // Add separator between paragraphs
      currentContent += (currentContent ? '\n\n' : '') + paragraph;
    }

    // Check if we've reached slide limit
    if (slides.length >= maxSlides) {
      break;
    }
  }

  // Add remaining content as final slide
  if (currentContent.length > 0 && slides.length < maxSlides) {
    slides.push({
      type: SlideType.CONTENT,
      content: currentContent.trim(),
    });
  }

  return slides;
}

/**
 * Inserts code slides at appropriate positions.
 *
 * Places code slides after the first content slide for context,
 * respecting the maximum slide limit.
 *
 * @param slides - Existing slides array (modified in place)
 * @param codeExamples - Code examples to insert
 * @param maxSlides - Maximum total slides allowed
 */
export function insertCodeSlides(
  slides: SplitSlide[],
  codeExamples: CodeExample[],
  maxSlides: number
): void {
  for (const code of codeExamples) {
    // Reserve at least 1 slot for CTA
    if (slides.length >= maxSlides - 1) {
      break;
    }

    // Find best position: after first content slide
    const firstContentIndex = slides.findIndex(
      (s) => s.type === SlideType.CONTENT
    );

    // Insert after first content slide, or after cover if no content yet
    const insertIndex =
      firstContentIndex >= 0
        ? firstContentIndex + 1
        : Math.min(1, slides.length);

    slides.splice(insertIndex, 0, {
      type: SlideType.CODE,
      code,
    });
  }
}

/**
 * Detects code blocks in markdown content.
 *
 * Parses fenced code blocks (```) and extracts
 * language and code content.
 *
 * @param content - Markdown content to parse
 * @returns Array of detected code examples
 *
 * @example
 * ```typescript
 * const codes = detectCodeBlocks('Here is code:\n```typescript\nconst x = 1;\n```');
 * // Returns: [{ code: 'const x = 1;', language: 'typescript' }]
 * ```
 */
export function detectCodeBlocks(content: string): CodeExample[] {
  const codeBlocks: CodeExample[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || 'plaintext';
    const code = match[2].trim();

    if (code.length > 0) {
      codeBlocks.push({
        code,
        language,
      });
    }
  }

  return codeBlocks;
}

/**
 * Calculates the optimal number of content slides.
 *
 * Based on total content length and target characters per slide.
 *
 * @param contentLength - Total content length in characters
 * @param maxCharsPerSlide - Target characters per slide
 * @param maxSlides - Maximum allowed slides
 * @returns Recommended number of content slides
 */
export function calculateOptimalSlideCount(
  contentLength: number,
  maxCharsPerSlide: number,
  maxSlides: number
): number {
  // Reserve 2 slots for cover and CTA
  const availableSlots = maxSlides - 2;

  // Calculate based on content length
  const naturalCount = Math.ceil(contentLength / maxCharsPerSlide);

  // Clamp to available slots
  return Math.min(Math.max(1, naturalCount), availableSlots);
}

/**
 * Gets the default splitter configuration.
 *
 * @returns Default splitter configuration object
 */
export function getDefaultSplitterConfig(): SplitterConfig {
  return { ...DEFAULT_SPLITTER_CONFIG };
}
