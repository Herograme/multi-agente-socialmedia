/**
 * RendererService - HTML to image rendering using Puppeteer
 * Story 3.4 - Servico de Renderizacao HTML para Imagem
 */

import puppeteer, { Browser, Page, ScreenshotOptions } from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createLogger } from '@social-content/shared';
import type {
  RendererConfig,
  RenderOptions,
  RenderResult,
  PoolMetrics,
} from './types';
import { RendererError, RendererErrorCode } from './types';

const logger = createLogger('renderer-service');

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<RendererConfig> = {
  headless: true,
  defaultViewport: { width: 1080, height: 1080 },
  timeout: 30000,
  puppeteerArgs: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-software-rasterizer',
  ],
};

/**
 * Default render options
 */
const DEFAULT_RENDER_OPTIONS: Required<
  Omit<RenderOptions, 'cssPath' | 'cssContent' | 'backgroundImage'>
> = {
  width: 1080,
  height: 1080,
  format: 'png',
  quality: 90,
  deviceScaleFactor: 1,
};

/**
 * MIME type mappings for image files
 */
const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

/**
 * Service for rendering HTML content to images using Puppeteer
 *
 * @example
 * ```typescript
 * const renderer = new RendererService();
 * await renderer.initialize();
 *
 * const buffer = await renderer.renderToImage('<h1>Hello</h1>', {
 *   width: 1080,
 *   height: 1080,
 *   format: 'png'
 * });
 *
 * await renderer.dispose();
 * ```
 */
export class RendererService {
  private config: Required<RendererConfig>;
  private browser: Browser | null = null;
  private metrics = {
    totalRenders: 0,
    totalRenderTimeMs: 0,
  };

  /**
   * Creates a new RendererService instance
   * @param config - Optional configuration overrides
   */
  constructor(config?: Partial<RendererConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      defaultViewport: {
        ...DEFAULT_CONFIG.defaultViewport,
        ...config?.defaultViewport,
      },
      puppeteerArgs: config?.puppeteerArgs ?? DEFAULT_CONFIG.puppeteerArgs,
    };

    logger.debug('RendererService created', {
      headless: this.config.headless,
      viewport: this.config.defaultViewport,
      timeout: this.config.timeout,
    });
  }

  /**
   * Initialize the browser instance (pre-warming)
   * Call this before rendering for faster first render
   */
  async initialize(): Promise<void> {
    if (!this.browser) {
      logger.info('Initializing browser...');
      this.browser = await this.launchBrowser();
      logger.info('Browser initialized');
    }
  }

  /**
   * Render HTML content to an image buffer
   *
   * @param html - HTML content to render
   * @param options - Render options
   * @returns Buffer containing the rendered image
   * @throws RendererError if rendering fails
   */
  async renderToImage(html: string, options?: RenderOptions): Promise<Buffer> {
    const startTime = Date.now();
    const opts = { ...DEFAULT_RENDER_OPTIONS, ...options };

    // Ensure browser is initialized
    if (!this.browser) {
      await this.initialize();
    }

    let page: Page | null = null;

    try {
      page = await this.createPage(opts);

      // Set HTML content
      await this.setPageContent(page, html);

      // Inject CSS if provided
      if (options?.cssPath || options?.cssContent) {
        await this.injectCSS(page, options.cssPath, options.cssContent);
      }

      // Apply background image if provided
      if (options?.backgroundImage) {
        await this.setBackgroundImage(page, options.backgroundImage);
      }

      // Wait for fonts and other resources
      await page.evaluate(() => document.fonts.ready);

      // Take screenshot
      const buffer = await this.captureScreenshot(page, opts);

      // Update metrics
      const renderTime = Date.now() - startTime;
      this.metrics.totalRenders++;
      this.metrics.totalRenderTimeMs += renderTime;

      logger.debug('Render completed', {
        width: opts.width,
        height: opts.height,
        format: opts.format,
        renderTimeMs: renderTime,
        size: buffer.length,
      });

      return buffer;
    } catch (error) {
      logger.error('Render failed', {
        error: (error as Error).message,
        width: opts.width,
        height: opts.height,
      });
      throw error;
    } finally {
      // Always close the page to free resources
      if (page) {
        await page.close().catch((err) => {
          logger.warn('Failed to close page', { error: err.message });
        });
      }
    }
  }

  /**
   * Render HTML and return complete result with metadata
   *
   * @param html - HTML content to render
   * @param options - Render options
   * @returns Complete render result with buffer and metadata
   */
  async render(html: string, options?: RenderOptions): Promise<RenderResult> {
    const startTime = Date.now();
    const opts = { ...DEFAULT_RENDER_OPTIONS, ...options };

    const buffer = await this.renderToImage(html, options);

    return {
      buffer,
      width: opts.width,
      height: opts.height,
      format: opts.format,
      size: buffer.length,
      renderTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Get current service metrics
   */
  getMetrics(): { totalRenders: number; avgRenderTimeMs: number } {
    return {
      totalRenders: this.metrics.totalRenders,
      avgRenderTimeMs:
        this.metrics.totalRenders > 0
          ? this.metrics.totalRenderTimeMs / this.metrics.totalRenders
          : 0,
    };
  }

  /**
   * Get pool-compatible metrics (for BrowserPool interface compatibility)
   */
  getPoolMetrics(): PoolMetrics {
    return {
      totalRenders: this.metrics.totalRenders,
      avgRenderTimeMs:
        this.metrics.totalRenders > 0
          ? this.metrics.totalRenderTimeMs / this.metrics.totalRenders
          : 0,
      activeBrowsers: this.browser ? 1 : 0,
      availableBrowsers: this.browser ? 1 : 0,
    };
  }

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this.browser !== null;
  }

  /**
   * Close the browser and release all resources
   */
  async dispose(): Promise<void> {
    if (this.browser) {
      logger.info('Disposing browser...');
      try {
        await this.browser.close();
        logger.info('Browser disposed');
      } catch (error) {
        logger.warn('Error closing browser', {
          error: (error as Error).message,
        });
      } finally {
        this.browser = null;
      }
    }
  }

  /**
   * Launch a new browser instance
   */
  private async launchBrowser(): Promise<Browser> {
    try {
      // Use system chromium if PUPPETEER_EXECUTABLE_PATH is set
      // This is useful for ARM64 environments where bundled Chrome doesn't work
      const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

      const browser = await puppeteer.launch({
        headless: this.config.headless,
        args: this.config.puppeteerArgs,
        defaultViewport: this.config.defaultViewport,
        timeout: this.config.timeout,
        ...(executablePath && { executablePath }),
      });

      logger.debug('Browser launched', {
        pid: browser.process()?.pid,
        headless: this.config.headless,
        executablePath: executablePath || 'default',
      });

      return browser;
    } catch (error) {
      throw new RendererError(
        `Failed to launch browser: ${(error as Error).message}`,
        RendererErrorCode.BROWSER_LAUNCH_FAILED,
        { originalError: (error as Error).message }
      );
    }
  }

  /**
   * Create a new page with configured viewport
   */
  private async createPage(
    opts: Required<
      Omit<RenderOptions, 'cssPath' | 'cssContent' | 'backgroundImage'>
    >
  ): Promise<Page> {
    if (!this.browser) {
      throw new RendererError(
        'Browser not initialized',
        RendererErrorCode.NOT_INITIALIZED
      );
    }

    try {
      const page = await this.browser.newPage();

      await page.setViewport({
        width: opts.width,
        height: opts.height,
        deviceScaleFactor: opts.deviceScaleFactor,
      });

      // Set timeout for page operations
      page.setDefaultTimeout(this.config.timeout);

      return page;
    } catch (error) {
      throw new RendererError(
        `Failed to create page: ${(error as Error).message}`,
        RendererErrorCode.PAGE_CREATION_FAILED,
        { originalError: (error as Error).message }
      );
    }
  }

  /**
   * Set HTML content on the page
   */
  private async setPageContent(page: Page, html: string): Promise<void> {
    try {
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: this.config.timeout,
      });
    } catch (error) {
      throw new RendererError(
        `Failed to set content: ${(error as Error).message}`,
        RendererErrorCode.CONTENT_SET_FAILED,
        { originalError: (error as Error).message }
      );
    }
  }

  /**
   * Inject CSS into the page
   */
  private async injectCSS(
    page: Page,
    cssPath?: string,
    cssContent?: string
  ): Promise<void> {
    try {
      let css = cssContent || '';

      if (cssPath) {
        const absolutePath = path.isAbsolute(cssPath)
          ? cssPath
          : path.resolve(process.cwd(), cssPath);

        // Verify file exists
        await fs.access(absolutePath);
        css += await fs.readFile(absolutePath, 'utf-8');
      }

      if (css) {
        await page.addStyleTag({ content: css });
        logger.debug('CSS injected', {
          fromFile: !!cssPath,
          hasInline: !!cssContent,
          totalLength: css.length,
        });
      }
    } catch (error) {
      throw new RendererError(
        `Failed to inject CSS: ${(error as Error).message}`,
        RendererErrorCode.CSS_INJECTION_FAILED,
        { cssPath, originalError: (error as Error).message }
      );
    }
  }

  /**
   * Set background image on the page body
   */
  private async setBackgroundImage(
    page: Page,
    imagePath: string
  ): Promise<void> {
    try {
      const absolutePath = path.isAbsolute(imagePath)
        ? imagePath
        : path.resolve(process.cwd(), imagePath);

      // Verify file exists
      await fs.access(absolutePath);

      // Read image and convert to base64
      const imageBuffer = await fs.readFile(absolutePath);
      const base64 = imageBuffer.toString('base64');
      const mimeType = this.getMimeType(absolutePath);

      // Inject as CSS background
      const css = `
        body {
          background-image: url('data:${mimeType};base64,${base64}');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
      `;

      await page.addStyleTag({ content: css });

      logger.debug('Background image set', {
        path: imagePath,
        mimeType,
        size: imageBuffer.length,
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new RendererError(
          `Background image not found: ${imagePath}`,
          RendererErrorCode.BACKGROUND_IMAGE_FAILED,
          { imagePath }
        );
      }
      throw new RendererError(
        `Failed to set background image: ${(error as Error).message}`,
        RendererErrorCode.BACKGROUND_IMAGE_FAILED,
        { imagePath, originalError: (error as Error).message }
      );
    }
  }

  /**
   * Capture screenshot with configured format and quality
   */
  private async captureScreenshot(
    page: Page,
    opts: Required<
      Omit<RenderOptions, 'cssPath' | 'cssContent' | 'backgroundImage'>
    >
  ): Promise<Buffer> {
    try {
      const screenshotOptions: ScreenshotOptions = {
        type: opts.format === 'jpeg' ? 'jpeg' : opts.format,
        fullPage: false,
        omitBackground: false,
      };

      // Quality only applies to JPEG and WebP
      if (opts.format !== 'png' && opts.quality !== undefined) {
        screenshotOptions.quality = opts.quality;
      }

      const buffer = await page.screenshot(screenshotOptions);

      return buffer as Buffer;
    } catch (error) {
      throw new RendererError(
        `Failed to capture screenshot: ${(error as Error).message}`,
        RendererErrorCode.SCREENSHOT_FAILED,
        { format: opts.format, originalError: (error as Error).message }
      );
    }
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    return MIME_TYPES[ext] || 'image/png';
  }
}
