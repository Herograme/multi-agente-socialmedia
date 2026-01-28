/**
 * CarouselBuilder Agent
 * Story 3.5 - Agente Carousel Builder
 *
 * Generates carousel image sequences for Instagram posts.
 * Splits content into slides, applies syntax highlighting to code,
 * and renders each slide as an image.
 */

import { EventEmitter } from 'events';
import { mkdir, writeFile, stat } from 'fs/promises';
import { join } from 'path';
import type { Agent, AgentResult } from '../types';
import { AgentStatus } from '../types';
import type {
  CarouselBuilderInput,
  CarouselBuilderOutput,
  CarouselConfig,
  RendererService,
  SlideMetadata,
  SplitSlide,
  StateChangeEvent,
} from './types';
import { AgentState, SlideType } from './types';
import { splitContent } from './content-splitter';
import { highlightCode, disposeHighlighter } from './code-highlighter';

/**
 * CarouselBuilderAgent class
 *
 * Implements carousel generation with lifecycle management.
 * Extends EventEmitter for state change notifications.
 *
 * @example
 * ```typescript
 * const agent = new CarouselBuilderAgent(config, renderer);
 * const result = await agent.run({
 *   postId: 'post-123',
 *   content: '# My Title\n\nContent here...',
 *   backgroundImagePath: '/path/to/bg.png',
 *   authorHandle: '@myhandle'
 * });
 * ```
 */
export class CarouselBuilderAgent
  extends EventEmitter
  implements Agent<CarouselBuilderInput, CarouselBuilderOutput>
{
  readonly name = 'CarouselBuilderAgent';
  status: AgentStatus = AgentStatus.IDLE;

  private state: AgentState = AgentState.IDLE;
  private readonly config: CarouselConfig;
  private readonly renderer: RendererService;

  /**
   * Creates a new CarouselBuilderAgent instance.
   *
   * @param config - Agent configuration
   * @param renderer - Service for rendering HTML to images
   */
  constructor(config: CarouselConfig, renderer: RendererService) {
    super();
    this.config = config;
    this.renderer = renderer;
  }

  /**
   * Gets the current agent state.
   */
  getState(): AgentState {
    return this.state;
  }

  /**
   * Gets the agent configuration.
   *
   * @returns Copy of the configuration object
   */
  getConfig(): CarouselConfig {
    return { ...this.config };
  }

  /**
   * Sets the agent state and emits stateChange event.
   *
   * @param newState - New state to transition to
   */
  private setState(newState: AgentState): void {
    const previousState = this.state;
    this.state = newState;

    // Sync status with state
    switch (newState) {
      case AgentState.IDLE:
        this.status = AgentStatus.IDLE;
        break;
      case AgentState.RUNNING:
        this.status = AgentStatus.RUNNING;
        break;
      case AgentState.SUCCESS:
        this.status = AgentStatus.SUCCESS;
        break;
      case AgentState.ERROR:
        this.status = AgentStatus.ERROR;
        break;
    }

    const event: StateChangeEvent = {
      previous: previousState,
      current: newState,
    };

    this.emit('stateChange', event);
  }

  /**
   * Runs the carousel generation pipeline.
   *
   * 1. Splits content into slides
   * 2. Prepares output directory
   * 3. Renders each slide to image
   * 4. Returns metadata about generated carousel
   *
   * @param input - Carousel generation input
   * @returns Agent result with carousel output or error
   */
  async run(
    input: CarouselBuilderInput
  ): Promise<AgentResult<CarouselBuilderOutput>> {
    const startTime = Date.now();
    this.setState(AgentState.RUNNING);

    try {
      // 1. Split content into slides
      const splitResult = splitContent(
        input.content,
        input.codeExamples || [],
        { maxSlides: input.maxSlides || this.config.maxSlides }
      );

      // 2. Prepare output directory
      const carouselPath = join(
        this.config.outputBaseDir,
        input.postId,
        'carousel'
      );
      await mkdir(carouselPath, { recursive: true });

      // 3. Render each slide
      const slidesMetadata: SlideMetadata[] = [];

      for (let i = 0; i < splitResult.slides.length; i++) {
        const slide = splitResult.slides[i];
        const metadata = await this.renderSlide(slide, i, input, carouselPath);
        slidesMetadata.push(metadata);
      }

      // 4. Build output
      const processingTimeMs = Date.now() - startTime;

      const output: CarouselBuilderOutput = {
        postId: input.postId,
        slides: slidesMetadata,
        totalSlides: slidesMetadata.length,
        carouselPath,
        metadata: {
          generatedAt: new Date(),
          processingTimeMs,
          backgroundUsed: input.backgroundImagePath,
          dimensions: this.config.dimensions,
        },
      };

      this.setState(AgentState.SUCCESS);

      return {
        success: true,
        data: output,
        duration: processingTimeMs,
        timestamp: new Date(),
      };
    } catch (error) {
      this.setState(AgentState.ERROR);
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        error: `Carousel generation failed: ${errorMessage}`,
        duration,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Renders a single slide to an image file.
   *
   * @param slide - Slide data to render
   * @param index - Slide index
   * @param input - Original input for context
   * @param outputDir - Directory to save the image
   * @returns Metadata about the rendered slide
   */
  private async renderSlide(
    slide: SplitSlide,
    index: number,
    input: CarouselBuilderInput,
    outputDir: string
  ): Promise<SlideMetadata> {
    // Generate HTML for this slide
    const html = await this.generateSlideHtml(slide, input, index);

    // Render to image buffer
    const imageBuffer = await this.renderer.renderToImage(html, {
      width: this.config.dimensions.width,
      height: this.config.dimensions.height,
      backgroundImage: input.backgroundImagePath,
      overlayOpacity: this.config.overlayOpacity,
    });

    // Save to file
    const filename = `slide-${String(index + 1).padStart(2, '0')}.png`;
    const filePath = join(outputDir, filename);
    await writeFile(filePath, imageBuffer);

    // Get file stats
    const stats = await stat(filePath);

    return {
      index,
      type: slide.type,
      path: filePath,
      sizeBytes: stats.size,
      dimensions: this.config.dimensions,
      renderedAt: new Date(),
    };
  }

  /**
   * Generates HTML for a slide based on its type.
   *
   * @param slide - Slide data
   * @param input - Original input for context
   * @param index - Slide index
   * @returns Complete HTML document for rendering
   */
  private async generateSlideHtml(
    slide: SplitSlide,
    input: CarouselBuilderInput,
    index: number
  ): Promise<string> {
    switch (slide.type) {
      case SlideType.COVER:
        return this.generateCoverHtml(slide.title || 'Sem titulo');

      case SlideType.CONTENT:
        return this.generateContentHtml(slide.content || '', index + 1);

      case SlideType.CODE: {
        if (!slide.code) {
          return this.generateContentHtml('Codigo nao disponivel', index + 1);
        }
        const highlightResult = await highlightCode(
          slide.code.code,
          slide.code.language,
          this.config.codeTheme as 'dracula' | 'one-dark-pro' | 'github-dark'
        );
        return this.generateCodeHtml(
          highlightResult.html,
          highlightResult.css,
          slide.code.explanation
        );
      }

      case SlideType.CTA:
        return this.generateCtaHtml(
          input.authorHandle,
          input.ctaText || this.config.defaultCtaText
        );

      default:
        return this.generateContentHtml('Slide vazio', index + 1);
    }
  }

  /**
   * Generates HTML for a cover slide.
   *
   * @param title - Title text for the cover
   * @returns Complete HTML document
   */
  private generateCoverHtml(title: string): string {
    const { width, height } = this.config.dimensions;
    const { title: titleFont } = this.config.fonts;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${width}px;
      height: ${height}px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: '${titleFont}', -apple-system, BlinkMacSystemFont, sans-serif;
      color: white;
      text-align: center;
      padding: 80px;
      background: transparent;
    }
    .title {
      font-size: 64px;
      font-weight: 700;
      line-height: 1.2;
      text-shadow: 2px 2px 8px rgba(0,0,0,0.7);
      max-width: 100%;
      word-wrap: break-word;
    }
  </style>
</head>
<body>
  <h1 class="title">${this.escapeHtml(title)}</h1>
</body>
</html>`;
  }

  /**
   * Generates HTML for a content slide.
   *
   * @param content - Text content for the slide
   * @param slideNumber - Slide number for display
   * @returns Complete HTML document
   */
  private generateContentHtml(content: string, slideNumber: number): string {
    const { width, height } = this.config.dimensions;
    const { body: bodyFont } = this.config.fonts;

    // Convert newlines to <br> tags for proper display
    const formattedContent = this.escapeHtml(content).replace(/\n/g, '<br>');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${width}px;
      height: ${height}px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      font-family: '${bodyFont}', -apple-system, BlinkMacSystemFont, sans-serif;
      color: white;
      padding: 80px;
      background: transparent;
      position: relative;
    }
    .content {
      font-size: 36px;
      line-height: 1.6;
      text-shadow: 1px 1px 4px rgba(0,0,0,0.6);
    }
    .slide-number {
      position: absolute;
      bottom: 40px;
      right: 40px;
      font-size: 24px;
      opacity: 0.7;
    }
  </style>
</head>
<body>
  <div class="content">${formattedContent}</div>
  <div class="slide-number">${slideNumber}</div>
</body>
</html>`;
  }

  /**
   * Generates HTML for a code slide.
   *
   * @param highlightedCode - Pre-highlighted HTML code
   * @param css - CSS styles from highlighter
   * @param explanation - Optional explanation text
   * @returns Complete HTML document
   */
  private generateCodeHtml(
    highlightedCode: string,
    css: string,
    explanation?: string
  ): string {
    const { width, height } = this.config.dimensions;
    const { code: codeFont, body: bodyFont } = this.config.fonts;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${width}px;
      height: ${height}px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      font-family: '${bodyFont}', -apple-system, BlinkMacSystemFont, sans-serif;
      color: white;
      padding: 60px;
      background: transparent;
    }
    .code-container {
      background: rgba(30, 30, 30, 0.95);
      border-radius: 12px;
      padding: 32px;
      overflow: hidden;
    }
    .code-container pre {
      font-family: '${codeFont}', 'Fira Code', 'Consolas', monospace;
      font-size: 22px;
      line-height: 1.5;
      overflow: auto;
      margin: 0;
    }
    .code-container code {
      font-family: inherit;
    }
    .explanation {
      margin-top: 24px;
      font-size: 28px;
      opacity: 0.9;
      text-shadow: 1px 1px 4px rgba(0,0,0,0.6);
    }
    ${css}
  </style>
</head>
<body>
  <div class="code-container">${highlightedCode}</div>
  ${explanation ? `<p class="explanation">${this.escapeHtml(explanation)}</p>` : ''}
</body>
</html>`;
  }

  /**
   * Generates HTML for a CTA (call-to-action) slide.
   *
   * @param handle - Author's social media handle
   * @param ctaText - Call-to-action text
   * @returns Complete HTML document
   */
  private generateCtaHtml(handle: string, ctaText: string): string {
    const { width, height } = this.config.dimensions;
    const { title: titleFont, body: bodyFont } = this.config.fonts;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${width}px;
      height: ${height}px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: '${bodyFont}', -apple-system, BlinkMacSystemFont, sans-serif;
      color: white;
      text-align: center;
      padding: 80px;
      background: transparent;
    }
    .cta-text {
      font-size: 48px;
      font-weight: 600;
      margin-bottom: 40px;
      text-shadow: 2px 2px 8px rgba(0,0,0,0.7);
    }
    .handle {
      font-family: '${titleFont}', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 56px;
      font-weight: 700;
      color: #3B82F6;
      text-shadow: 2px 2px 8px rgba(0,0,0,0.7);
    }
  </style>
</head>
<body>
  <p class="cta-text">${this.escapeHtml(ctaText)}</p>
  <p class="handle">${this.escapeHtml(handle)}</p>
</body>
</html>`;
  }

  /**
   * Escapes HTML special characters to prevent XSS.
   *
   * @param text - Text to escape
   * @returns Escaped text safe for HTML insertion
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Starts the agent (transitions to running state).
   */
  start(): void {
    if (this.state === AgentState.IDLE) {
      this.setState(AgentState.RUNNING);
    }
  }

  /**
   * Stops the agent (transitions to idle state).
   */
  stop(): void {
    this.setState(AgentState.IDLE);
  }

  /**
   * Resets the agent to idle state.
   */
  reset(): void {
    this.setState(AgentState.IDLE);
  }

  /**
   * Disposes of resources used by the agent.
   *
   * Should be called when done with the agent.
   */
  dispose(): void {
    disposeHighlighter();
    this.removeAllListeners();
  }
}
