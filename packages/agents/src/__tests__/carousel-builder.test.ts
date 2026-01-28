/**
 * CarouselBuilder Agent Tests
 * Story 3.5 - Agente Carousel Builder
 *
 * Comprehensive tests for carousel generation functionality.
 */

import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  CarouselBuilderAgent,
  createCarouselBuilderAgent,
  createMockRenderer,
  getDefaultConfig,
  validatePartialConfig,
  splitContent,
  extractTitle,
  splitIntoParagraphs,
  distributeContent,
  insertCodeSlides,
  detectCodeBlocks,
  calculateOptimalSlideCount,
  getDefaultSplitterConfig,
  highlightCode,
  highlightMultiple,
  normalizeLanguage,
  escapeHtml,
  isSupportedLanguage,
  disposeHighlighter,
  getLanguageAliases,
  SlideType,
  AgentState,
} from '../agents/carousel-builder';
import type {
  CodeExample,
  SplitSlide,
  RendererService,
} from '../agents/carousel-builder';
import { AgentStatus } from '../agents/types';

describe('CarouselBuilder', () => {
  // Test directories
  const TEST_OUTPUT_DIR = join(tmpdir(), 'carousel-builder-test');

  beforeEach(async () => {
    vi.clearAllMocks();
    // Create test output directory
    await mkdir(TEST_OUTPUT_DIR, { recursive: true });
  });

  afterAll(async () => {
    // Cleanup
    disposeHighlighter();
    try {
      await rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  // ============================================
  // Content Splitter Tests
  // ============================================
  describe('ContentSplitter', () => {
    describe('splitContent', () => {
      it('should create cover slide from first line', () => {
        const content = '# Titulo do Post\n\nConteudo do post aqui.';
        const result = splitContent(content);

        expect(result.slides[0].type).toBe(SlideType.COVER);
        expect(result.slides[0].title).toBe('Titulo do Post');
      });

      it('should always end with CTA slide', () => {
        const content = 'Titulo\n\nConteudo';
        const result = splitContent(content);

        const lastSlide = result.slides[result.slides.length - 1];
        expect(lastSlide.type).toBe(SlideType.CTA);
      });

      it('should respect maxSlides limit', () => {
        const longContent = Array(20)
          .fill('Paragrafo de conteudo com bastante texto')
          .join('\n\n');
        const result = splitContent(`Titulo\n\n${longContent}`, [], {
          maxSlides: 5,
        });

        expect(result.slides.length).toBeLessThanOrEqual(5);
      });

      it('should detect and include code slides', () => {
        const content = 'Titulo\n\nConteudo explicativo.';
        const codeExamples: CodeExample[] = [
          {
            language: 'typescript',
            code: 'const x = 1;',
            explanation: 'Exemplo simples',
          },
        ];

        const result = splitContent(content, codeExamples);

        expect(result.hasCode).toBe(true);
        expect(result.slides.some((s) => s.type === SlideType.CODE)).toBe(true);
      });

      it('should balance content across slides', () => {
        const content =
          'Titulo\n\n' +
          'Primeiro paragrafo com conteudo.\n\n' +
          'Segundo paragrafo com mais conteudo.\n\n' +
          'Terceiro paragrafo com ainda mais conteudo.';

        const result = splitContent(content, [], { maxCharsPerSlide: 50 });

        // Verify content slides exist and have reasonable lengths
        const contentSlides = result.slides.filter(
          (s) => s.type === SlideType.CONTENT
        );
        expect(contentSlides.length).toBeGreaterThan(0);

        for (const slide of contentSlides) {
          if (slide.content) {
            // Allow some tolerance for paragraph boundaries
            expect(slide.content.length).toBeLessThanOrEqual(150);
          }
        }
      });

      it('should handle empty content', () => {
        const result = splitContent('');

        expect(result.slides.length).toBeGreaterThanOrEqual(2);
        expect(result.slides[0].type).toBe(SlideType.COVER);
        expect(result.slides[result.slides.length - 1].type).toBe(SlideType.CTA);
      });

      it('should handle content with only title', () => {
        const result = splitContent('# Only Title');

        expect(result.slides.length).toBe(2); // Cover + CTA
        expect(result.slides[0].title).toBe('Only Title');
      });

      it('should track total characters', () => {
        const content = 'Title\n\nSome content here';
        const result = splitContent(content);

        expect(result.totalCharacters).toBe(content.length);
      });
    });

    describe('extractTitle', () => {
      it('should extract title from markdown header', () => {
        const { title, body } = extractTitle('# My Title\n\nBody text');

        expect(title).toBe('My Title');
        expect(body).toBe('Body text');
      });

      it('should handle multiple hash levels', () => {
        const { title } = extractTitle('### Deep Header\n\nBody');

        expect(title).toBe('Deep Header');
      });

      it('should truncate long titles', () => {
        const longTitle = 'A'.repeat(100);
        const { title } = extractTitle(`# ${longTitle}\n\nBody`);

        expect(title.length).toBeLessThanOrEqual(60);
        expect(title.endsWith('...')).toBe(true);
      });

      it('should handle content without markdown header', () => {
        const { title } = extractTitle('Plain Title\n\nBody text');

        expect(title).toBe('Plain Title');
      });

      it('should handle empty content', () => {
        const { title, body } = extractTitle('');

        expect(title).toBe('Sem titulo');
        expect(body).toBe('');
      });
    });

    describe('splitIntoParagraphs', () => {
      it('should split on double newlines', () => {
        const paragraphs = splitIntoParagraphs('First\n\nSecond\n\nThird');

        expect(paragraphs).toHaveLength(3);
        expect(paragraphs[0]).toBe('First');
        expect(paragraphs[1]).toBe('Second');
        expect(paragraphs[2]).toBe('Third');
      });

      it('should filter empty paragraphs', () => {
        const paragraphs = splitIntoParagraphs('First\n\n\n\nSecond');

        expect(paragraphs).toHaveLength(2);
      });

      it('should trim whitespace', () => {
        const paragraphs = splitIntoParagraphs('  First  \n\n  Second  ');

        expect(paragraphs[0]).toBe('First');
        expect(paragraphs[1]).toBe('Second');
      });
    });

    describe('distributeContent', () => {
      it('should create multiple slides for long content', () => {
        const paragraphs = ['Short', 'Medium paragraph', 'Another paragraph'];
        const slides = distributeContent(paragraphs, 30, 5);

        expect(slides.length).toBeGreaterThan(1);
        slides.forEach((slide) => {
          expect(slide.type).toBe(SlideType.CONTENT);
        });
      });

      it('should respect maxSlides limit', () => {
        const paragraphs = Array(10).fill('Paragraph content');
        const slides = distributeContent(paragraphs, 20, 3);

        expect(slides.length).toBeLessThanOrEqual(3);
      });

      it('should combine short paragraphs', () => {
        const paragraphs = ['A', 'B', 'C'];
        const slides = distributeContent(paragraphs, 100, 10);

        expect(slides.length).toBe(1);
        expect(slides[0].content).toContain('A');
        expect(slides[0].content).toContain('B');
        expect(slides[0].content).toContain('C');
      });
    });

    describe('insertCodeSlides', () => {
      it('should insert code slide after first content slide', () => {
        const slides: SplitSlide[] = [
          { type: SlideType.COVER, title: 'Title' },
          { type: SlideType.CONTENT, content: 'Text' },
        ];
        const codeExamples: CodeExample[] = [
          { code: 'x = 1', language: 'python' },
        ];

        insertCodeSlides(slides, codeExamples, 10);

        expect(slides[2].type).toBe(SlideType.CODE);
        expect(slides[2].code?.code).toBe('x = 1');
      });

      it('should respect maxSlides when inserting code', () => {
        const slides: SplitSlide[] = [
          { type: SlideType.COVER, title: 'Title' },
          { type: SlideType.CONTENT, content: 'Text 1' },
          { type: SlideType.CONTENT, content: 'Text 2' },
        ];
        const codeExamples: CodeExample[] = [
          { code: 'x = 1', language: 'python' },
          { code: 'y = 2', language: 'python' },
        ];

        insertCodeSlides(slides, codeExamples, 4); // Only room for 1 code slide (+ CTA)

        const codeSlides = slides.filter((s) => s.type === SlideType.CODE);
        expect(codeSlides.length).toBeLessThanOrEqual(1);
      });
    });

    describe('detectCodeBlocks', () => {
      it('should detect fenced code blocks', () => {
        const content = 'Text\n```typescript\nconst x = 1;\n```\nMore text';
        const codes = detectCodeBlocks(content);

        expect(codes).toHaveLength(1);
        expect(codes[0].language).toBe('typescript');
        expect(codes[0].code).toBe('const x = 1;');
      });

      it('should detect multiple code blocks', () => {
        const content =
          '```js\na = 1;\n```\n\n```python\nb = 2\n```';
        const codes = detectCodeBlocks(content);

        expect(codes).toHaveLength(2);
      });

      it('should default to plaintext for unspecified language', () => {
        const content = '```\ncode here\n```';
        const codes = detectCodeBlocks(content);

        expect(codes[0].language).toBe('plaintext');
      });

      it('should handle empty code blocks', () => {
        const content = '```typescript\n```';
        const codes = detectCodeBlocks(content);

        expect(codes).toHaveLength(0);
      });
    });

    describe('calculateOptimalSlideCount', () => {
      it('should calculate based on content length', () => {
        const count = calculateOptimalSlideCount(1000, 200, 10);

        expect(count).toBe(5);
      });

      it('should respect maxSlides limit', () => {
        const count = calculateOptimalSlideCount(10000, 100, 5);

        // Max 5 - 2 (cover + CTA) = 3 content slots
        expect(count).toBeLessThanOrEqual(3);
      });

      it('should return at least 1', () => {
        const count = calculateOptimalSlideCount(10, 1000, 10);

        expect(count).toBeGreaterThanOrEqual(1);
      });
    });

    describe('getDefaultSplitterConfig', () => {
      it('should return default configuration', () => {
        const config = getDefaultSplitterConfig();

        expect(config.maxSlides).toBe(10);
        expect(config.maxCharsPerSlide).toBe(280);
        expect(config.minCharsPerSlide).toBe(100);
      });
    });
  });

  // ============================================
  // Code Highlighter Tests
  // ============================================
  describe('CodeHighlighter', () => {
    describe('highlightCode', () => {
      it('should highlight TypeScript code', async () => {
        const result = await highlightCode('const x: number = 1;', 'typescript');

        expect(result.success).toBe(true);
        expect(result.html).toContain('<pre');
        expect(result.normalizedLanguage).toBe('typescript');
      });

      it('should handle language aliases', async () => {
        const result = await highlightCode('const x = 1;', 'ts');

        expect(result.normalizedLanguage).toBe('typescript');
      });

      it('should fallback for unknown languages', async () => {
        const result = await highlightCode('some code', 'unknown-lang');

        expect(result.success).toBe(false);
        expect(result.html).toContain('<pre');
        expect(result.html).toContain('some code');
      });

      it('should escape HTML in fallback', async () => {
        const result = await highlightCode(
          '<script>alert("xss")</script>',
          'unknown'
        );

        expect(result.html).not.toContain('<script>');
        expect(result.html).toContain('&lt;script&gt;');
      });
    });

    describe('highlightMultiple', () => {
      it('should highlight multiple code blocks', async () => {
        const blocks = [
          { code: 'const a = 1;', language: 'typescript' },
          { code: 'let b = 2;', language: 'javascript' },
        ];

        const results = await highlightMultiple(blocks);

        expect(results).toHaveLength(2);
        expect(results[0].success).toBe(true);
        expect(results[1].success).toBe(true);
      });
    });

    describe('normalizeLanguage', () => {
      it('should normalize common aliases', () => {
        expect(normalizeLanguage('ts')).toBe('typescript');
        expect(normalizeLanguage('js')).toBe('javascript');
        expect(normalizeLanguage('py')).toBe('python');
        expect(normalizeLanguage('sh')).toBe('bash');
      });

      it('should handle case insensitivity', () => {
        expect(normalizeLanguage('TypeScript')).toBe('typescript');
        expect(normalizeLanguage('PYTHON')).toBe('python');
      });
    });

    describe('escapeHtml', () => {
      it('should escape HTML special characters', () => {
        expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
        expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
        expect(escapeHtml("it's")).toBe("it&#039;s");
        expect(escapeHtml('A & B')).toBe('A &amp; B');
      });
    });

    describe('isSupportedLanguage', () => {
      it('should return true for supported languages', () => {
        expect(isSupportedLanguage('typescript')).toBe(true);
        expect(isSupportedLanguage('python')).toBe(true);
        expect(isSupportedLanguage('rust')).toBe(true);
      });

      it('should handle aliases', () => {
        expect(isSupportedLanguage('ts')).toBe(true);
        expect(isSupportedLanguage('js')).toBe(true);
      });

      it('should return false for unsupported languages', () => {
        expect(isSupportedLanguage('unknown-lang')).toBe(false);
      });
    });

    describe('getLanguageAliases', () => {
      it('should return alias map', () => {
        const aliases = getLanguageAliases();

        expect(aliases.ts).toBe('typescript');
        expect(aliases.js).toBe('javascript');
        expect(aliases.py).toBe('python');
      });
    });
  });

  // ============================================
  // Factory Tests
  // ============================================
  describe('Factory', () => {
    describe('createCarouselBuilderAgent', () => {
      it('should create agent with default config', () => {
        const renderer = createMockRenderer();
        const agent = createCarouselBuilderAgent(renderer);

        expect(agent).toBeInstanceOf(CarouselBuilderAgent);
        expect(agent.name).toBe('CarouselBuilderAgent');
      });

      it('should create agent with custom config', () => {
        const renderer = createMockRenderer();
        const agent = createCarouselBuilderAgent(renderer, {
          maxSlides: 5,
          codeTheme: 'github-dark',
        });

        const config = agent.getConfig();
        expect(config.maxSlides).toBe(5);
        expect(config.codeTheme).toBe('github-dark');
      });

      it('should throw on invalid maxSlides (too low)', () => {
        const renderer = createMockRenderer();

        expect(() =>
          createCarouselBuilderAgent(renderer, { maxSlides: 1 })
        ).toThrow('maxSlides must be between 2 and 10');
      });

      it('should throw on invalid maxSlides (too high)', () => {
        const renderer = createMockRenderer();

        expect(() =>
          createCarouselBuilderAgent(renderer, { maxSlides: 15 })
        ).toThrow('maxSlides must be between 2 and 10');
      });

      it('should throw on invalid dimensions', () => {
        const renderer = createMockRenderer();

        expect(() =>
          createCarouselBuilderAgent(renderer, {
            dimensions: { width: 100, height: 100 },
          })
        ).toThrow('Dimensions must be at least 500x500');
      });

      it('should throw on invalid overlayOpacity', () => {
        const renderer = createMockRenderer();

        expect(() =>
          createCarouselBuilderAgent(renderer, { overlayOpacity: 1.5 })
        ).toThrow('overlayOpacity must be between 0 and 1');
      });

      it('should throw on invalid codeTheme', () => {
        const renderer = createMockRenderer();

        expect(() =>
          createCarouselBuilderAgent(renderer, { codeTheme: 'invalid-theme' })
        ).toThrow('codeTheme must be one of:');
      });
    });

    describe('getDefaultConfig', () => {
      it('should return default configuration', () => {
        const config = getDefaultConfig();

        expect(config.outputBaseDir).toBe('output/posts');
        expect(config.dimensions.width).toBe(1080);
        expect(config.dimensions.height).toBe(1080);
        expect(config.maxSlides).toBe(10);
        expect(config.overlayOpacity).toBe(0.6);
        expect(config.codeTheme).toBe('dracula');
      });

      it('should return a copy', () => {
        const config1 = getDefaultConfig();
        const config2 = getDefaultConfig();

        config1.maxSlides = 5;
        expect(config2.maxSlides).toBe(10);
      });
    });

    describe('validatePartialConfig', () => {
      it('should not throw for valid partial config', () => {
        expect(() =>
          validatePartialConfig({ maxSlides: 5, overlayOpacity: 0.8 })
        ).not.toThrow();
      });

      it('should throw for invalid maxSlides', () => {
        expect(() => validatePartialConfig({ maxSlides: 15 })).toThrow(
          'maxSlides must be between 2 and 10'
        );
      });

      it('should throw for invalid dimensions', () => {
        expect(() =>
          validatePartialConfig({ dimensions: { width: 100, height: 1080 } })
        ).toThrow('dimensions.width must be at least 500');
      });
    });

    describe('createMockRenderer', () => {
      it('should create a valid mock renderer', async () => {
        const renderer = createMockRenderer();
        const buffer = await renderer.renderToImage('<html></html>', {
          width: 1080,
          height: 1080,
        });

        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================
  // CarouselBuilderAgent Tests
  // ============================================
  describe('CarouselBuilderAgent', () => {
    const createTestAgent = (
      overrides?: Partial<{
        config: Record<string, unknown>;
        renderer: RendererService;
      }>
    ) => {
      const renderer = overrides?.renderer || createMockRenderer();
      return createCarouselBuilderAgent(renderer, {
        outputBaseDir: TEST_OUTPUT_DIR,
        ...overrides?.config,
      });
    };

    describe('instantiation', () => {
      it('should start in IDLE state', () => {
        const agent = createTestAgent();

        expect(agent.getState()).toBe(AgentState.IDLE);
        expect(agent.status).toBe(AgentStatus.IDLE);
      });

      it('should have correct name', () => {
        const agent = createTestAgent();

        expect(agent.name).toBe('CarouselBuilderAgent');
      });
    });

    describe('lifecycle', () => {
      it('should transition to RUNNING on start()', () => {
        const agent = createTestAgent();

        agent.start();

        expect(agent.getState()).toBe(AgentState.RUNNING);
        expect(agent.status).toBe(AgentStatus.RUNNING);
      });

      it('should transition to IDLE on stop()', () => {
        const agent = createTestAgent();

        agent.start();
        agent.stop();

        expect(agent.getState()).toBe(AgentState.IDLE);
      });

      it('should emit stateChange events', () => {
        const agent = createTestAgent();
        const stateChanges: { previous: string; current: string }[] = [];

        agent.on('stateChange', (event) => {
          stateChanges.push(event);
        });

        agent.start();
        agent.stop();

        expect(stateChanges).toHaveLength(2);
        expect(stateChanges[0].current).toBe(AgentState.RUNNING);
        expect(stateChanges[1].current).toBe(AgentState.IDLE);
      });

      it('should reset to IDLE state', () => {
        const agent = createTestAgent();

        agent.start();
        agent.reset();

        expect(agent.getState()).toBe(AgentState.IDLE);
      });
    });

    describe('run()', () => {
      it('should generate carousel slides', async () => {
        const agent = createTestAgent();

        const result = await agent.run({
          postId: 'test-post-123',
          content: '# Test Title\n\nFirst paragraph.\n\nSecond paragraph.',
          backgroundImagePath: '/tmp/bg.png',
          authorHandle: '@testuser',
        });

        expect(result.success).toBe(true);
        expect(result.data?.slides.length).toBeGreaterThan(0);
        expect(result.data?.slides.length).toBeLessThanOrEqual(10);
        expect(result.data?.postId).toBe('test-post-123');
      });

      it('should create correct number of slides', async () => {
        const agent = createTestAgent();

        const result = await agent.run({
          postId: 'test-post-count',
          content: '# Title\n\nContent',
          backgroundImagePath: '/tmp/bg.png',
          authorHandle: '@user',
        });

        // Should have at least: cover + CTA = 2 slides
        expect(result.data?.slides.length).toBeGreaterThanOrEqual(2);
        expect(result.data?.totalSlides).toBe(result.data?.slides.length);
      });

      it('should set status to SUCCESS on completion', async () => {
        const agent = createTestAgent();

        await agent.run({
          postId: 'test-post-success',
          content: 'Title\n\nContent',
          backgroundImagePath: '/tmp/bg.png',
          authorHandle: '@testuser',
        });

        expect(agent.getState()).toBe(AgentState.SUCCESS);
        expect(agent.status).toBe(AgentStatus.SUCCESS);
      });

      it('should include code slides when codeExamples provided', async () => {
        const agent = createTestAgent();

        const result = await agent.run({
          postId: 'test-post-code',
          content: 'Title\n\nExplanation of code.',
          backgroundImagePath: '/tmp/bg.png',
          authorHandle: '@testuser',
          codeExamples: [
            {
              language: 'typescript',
              code: 'const x = 1;',
              explanation: 'A simple constant',
            },
          ],
        });

        expect(result.data?.slides.some((s) => s.type === SlideType.CODE)).toBe(
          true
        );
      });

      it('should respect maxSlides input', async () => {
        const agent = createTestAgent();
        const longContent =
          '# Title\n\n' +
          Array(20).fill('Long paragraph content').join('\n\n');

        const result = await agent.run({
          postId: 'test-post-max',
          content: longContent,
          backgroundImagePath: '/tmp/bg.png',
          authorHandle: '@testuser',
          maxSlides: 5,
        });

        expect(result.data?.slides.length).toBeLessThanOrEqual(5);
      });

      it('should include processing metadata', async () => {
        const agent = createTestAgent();

        const result = await agent.run({
          postId: 'test-post-meta',
          content: 'Title\n\nContent',
          backgroundImagePath: '/path/to/bg.png',
          authorHandle: '@user',
        });

        expect(result.data?.metadata.generatedAt).toBeInstanceOf(Date);
        expect(result.data?.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
        expect(result.data?.metadata.backgroundUsed).toBe('/path/to/bg.png');
        expect(result.data?.metadata.dimensions.width).toBe(1080);
        expect(result.data?.metadata.dimensions.height).toBe(1080);
      });

      it('should return duration in result', async () => {
        const agent = createTestAgent();

        const result = await agent.run({
          postId: 'test-post-duration',
          content: 'Title\n\nContent',
          backgroundImagePath: '/tmp/bg.png',
          authorHandle: '@user',
        });

        expect(result.duration).toBeGreaterThanOrEqual(0);
        expect(result.timestamp).toBeInstanceOf(Date);
      });

      it('should return error result on failure', async () => {
        const failingRenderer: RendererService = {
          renderToImage: vi.fn().mockRejectedValue(new Error('Render failed')),
        };

        const agent = createTestAgent({ renderer: failingRenderer });

        const result = await agent.run({
          postId: 'test-post-fail',
          content: 'Title\n\nContent',
          backgroundImagePath: '/tmp/bg.png',
          authorHandle: '@testuser',
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('Carousel generation failed');
        expect(agent.status).toBe(AgentStatus.ERROR);
      });

      it('should use custom CTA text when provided', async () => {
        const mockRenderer: RendererService = {
          renderToImage: vi.fn().mockResolvedValue(Buffer.from('fake')),
        };

        const agent = createTestAgent({ renderer: mockRenderer });

        await agent.run({
          postId: 'test-post-cta',
          content: 'Title\n\nContent',
          backgroundImagePath: '/tmp/bg.png',
          authorHandle: '@user',
          ctaText: 'Custom CTA here!',
        });

        // Verify render was called with HTML containing custom CTA
        const renderCalls = (mockRenderer.renderToImage as ReturnType<typeof vi.fn>).mock.calls;
        const ctaSlideHtml = renderCalls.find((call) =>
          call[0].includes('Custom CTA here!')
        );
        expect(ctaSlideHtml).toBeDefined();
      });
    });

    describe('slide rendering', () => {
      it('should render cover slide with title', async () => {
        const mockRenderer: RendererService = {
          renderToImage: vi.fn().mockResolvedValue(Buffer.from('fake')),
        };

        const agent = createTestAgent({ renderer: mockRenderer });

        await agent.run({
          postId: 'test-cover',
          content: '# Amazing Title\n\nContent',
          backgroundImagePath: '/tmp/bg.png',
          authorHandle: '@user',
        });

        const renderCalls = (mockRenderer.renderToImage as ReturnType<typeof vi.fn>).mock.calls;
        const coverHtml = renderCalls[0][0];

        expect(coverHtml).toContain('Amazing Title');
        expect(coverHtml).toContain('class="title"');
      });

      it('should render content slides with text', async () => {
        const mockRenderer: RendererService = {
          renderToImage: vi.fn().mockResolvedValue(Buffer.from('fake')),
        };

        const agent = createTestAgent({ renderer: mockRenderer });

        await agent.run({
          postId: 'test-content',
          content: 'Title\n\nThis is the body content',
          backgroundImagePath: '/tmp/bg.png',
          authorHandle: '@user',
        });

        const renderCalls = (mockRenderer.renderToImage as ReturnType<typeof vi.fn>).mock.calls;
        const hasContentSlide = renderCalls.some(
          (call) =>
            call[0].includes('class="content"') &&
            call[0].includes('This is the body content')
        );

        expect(hasContentSlide).toBe(true);
      });

      it('should render CTA slide with handle', async () => {
        const mockRenderer: RendererService = {
          renderToImage: vi.fn().mockResolvedValue(Buffer.from('fake')),
        };

        const agent = createTestAgent({ renderer: mockRenderer });

        await agent.run({
          postId: 'test-cta-handle',
          content: 'Title\n\nContent',
          backgroundImagePath: '/tmp/bg.png',
          authorHandle: '@myhandle',
        });

        const renderCalls = (mockRenderer.renderToImage as ReturnType<typeof vi.fn>).mock.calls;
        const ctaSlide = renderCalls.find(
          (call) =>
            call[0].includes('class="handle"') &&
            call[0].includes('@myhandle')
        );

        expect(ctaSlide).toBeDefined();
      });

      it('should pass correct dimensions to renderer', async () => {
        const mockRenderer: RendererService = {
          renderToImage: vi.fn().mockResolvedValue(Buffer.from('fake')),
        };

        const agent = createCarouselBuilderAgent(mockRenderer, {
          outputBaseDir: TEST_OUTPUT_DIR,
          dimensions: { width: 1200, height: 1200 },
        });

        await agent.run({
          postId: 'test-dimensions',
          content: 'Title\n\nContent',
          backgroundImagePath: '/tmp/bg.png',
          authorHandle: '@user',
        });

        const renderCalls = (mockRenderer.renderToImage as ReturnType<typeof vi.fn>).mock.calls;
        expect(renderCalls[0][1].width).toBe(1200);
        expect(renderCalls[0][1].height).toBe(1200);
      });
    });

    describe('getConfig', () => {
      it('should return a copy of the configuration', () => {
        const agent = createTestAgent({ config: { maxSlides: 5 } });

        const config1 = agent.getConfig();
        const config2 = agent.getConfig();

        config1.maxSlides = 10;
        expect(config2.maxSlides).toBe(5);
      });
    });

    describe('dispose', () => {
      it('should clean up resources', () => {
        const agent = createTestAgent();

        // Should not throw
        expect(() => agent.dispose()).not.toThrow();
      });
    });
  });
});
