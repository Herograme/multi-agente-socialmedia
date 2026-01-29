/**
 * PDF Service
 * Handles PDF generation using Puppeteer
 */

import type { Browser, Page, PDFOptions } from 'puppeteer';
import puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  PDFMakerConfig,
  PDFMetadata,
  PDFGenerationResult,
} from './types';

/**
 * PDFService class
 * Handles PDF generation from images or HTML using Puppeteer
 */
export class PDFService {
  private config: PDFMakerConfig;
  private browser: Browser | null = null;

  constructor(config: PDFMakerConfig) {
    this.config = config;
  }

  /**
   * Creates a PDF from an array of image paths (carousel slides)
   * @param imagePaths - Array of image file paths
   * @param metadata - PDF metadata
   * @returns PDF buffer and page count
   */
  async createPDFFromImages(
    imagePaths: string[],
    metadata: PDFMetadata
  ): Promise<PDFGenerationResult> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Configure viewport for mobile (LinkedIn carousel optimal)
      await page.setViewport({
        width: this.config.dimensions.width,
        height: this.config.dimensions.height,
        deviceScaleFactor: 2,
      });

      // Generate HTML with all images
      const html = this.generateImagesHTML(imagePaths, metadata);
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdfOptions: PDFOptions = {
        printBackground: true,
        preferCSSPageSize: true,
        margin: this.config.margin,
        tagged: true,
      };

      const pdfBuffer = await page.pdf(pdfOptions);

      return {
        buffer: Buffer.from(pdfBuffer),
        pageCount: imagePaths.length,
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Creates a PDF directly from HTML content (alternative rendering)
   * @param htmlContent - HTML content to render
   * @param cssStyles - Optional CSS styles
   * @param metadata - Optional PDF metadata
   * @returns PDF buffer and page count
   */
  async createPDFFromHTML(
    htmlContent: string,
    cssStyles?: string,
    metadata?: PDFMetadata
  ): Promise<PDFGenerationResult> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Configure viewport for mobile
      await page.setViewport({
        width: this.config.dimensions.width,
        height: this.config.dimensions.height,
        deviceScaleFactor: 2,
      });

      // Build complete HTML
      const fullHTML = this.wrapHTML(htmlContent, cssStyles, metadata);
      await page.setContent(fullHTML, { waitUntil: 'networkidle0' });

      // Generate PDF optimized for mobile
      const pdfOptions: PDFOptions = {
        printBackground: true,
        preferCSSPageSize: true,
        margin: this.config.margin,
        tagged: true,
      };

      const pdfBuffer = await page.pdf(pdfOptions);

      // Estimate page count
      const pageCount = await this.estimatePageCount(page);

      return {
        buffer: Buffer.from(pdfBuffer),
        pageCount,
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Saves PDF buffer to disk
   * @param buffer - PDF buffer
   * @param outputPath - Output file path
   */
  async savePDF(buffer: Buffer, outputPath: string): Promise<void> {
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(outputPath, buffer);
  }

  /**
   * Generates HTML with images as separate pages
   * @param imagePaths - Array of image paths
   * @param metadata - PDF metadata
   * @returns HTML string
   */
  private generateImagesHTML(imagePaths: string[], metadata: PDFMetadata): string {
    const { width, height } = this.config.dimensions;

    const slides = imagePaths
      .map((imgPath, index) => {
        const absolutePath = path.resolve(imgPath);
        const pageBreak = index < imagePaths.length - 1 ? 'always' : 'auto';
        return `
        <div class="slide" style="page-break-after: ${pageBreak};">
          <img src="file://${absolutePath}" alt="Slide ${index + 1}" />
        </div>
      `;
      })
      .join('\n');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${this.escapeHtml(metadata.title)}</title>
        <meta name="author" content="${this.escapeHtml(metadata.author)}">
        ${metadata.subject ? `<meta name="description" content="${this.escapeHtml(metadata.subject)}">` : ''}
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          @page {
            size: ${width}px ${height}px;
            margin: 0;
          }
          body {
            width: ${width}px;
            margin: 0;
            padding: 0;
          }
          .slide {
            width: ${width}px;
            height: ${height}px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          .slide img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        ${slides}
      </body>
      </html>
    `;
  }

  /**
   * Wraps HTML content with styles and metadata
   * @param content - HTML content
   * @param css - Optional CSS styles
   * @param metadata - Optional PDF metadata
   * @returns Complete HTML document
   */
  private wrapHTML(content: string, css?: string, metadata?: PDFMetadata): string {
    const { width, height } = this.config.dimensions;
    const { top, right, bottom, left } = this.config.margin;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        ${metadata ? `<title>${this.escapeHtml(metadata.title)}</title>` : ''}
        ${metadata?.author ? `<meta name="author" content="${this.escapeHtml(metadata.author)}">` : ''}
        <style>
          @page {
            size: ${width}px ${height}px;
            margin: ${top}px ${right}px ${bottom}px ${left}px;
          }
          body {
            width: ${width}px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          ${css || ''}
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;
  }

  /**
   * Estimates the number of pages in the document
   * @param page - Puppeteer page instance
   * @returns Estimated page count
   */
  private async estimatePageCount(page: Page): Promise<number> {
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    const pageHeight = this.config.dimensions.height;
    return Math.max(1, Math.ceil(bodyHeight / pageHeight));
  }

  /**
   * Escapes HTML special characters
   * @param text - Text to escape
   * @returns Escaped text
   */
  private escapeHtml(text: string): string {
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return text.replace(/[&<>"']/g, (char) => htmlEntities[char]);
  }

  /**
   * Gets or creates the browser instance
   * @returns Browser instance
   */
  private async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      // Use system chromium if PUPPETEER_EXECUTABLE_PATH is set
      // This is useful for ARM64 environments where bundled Chrome doesn't work
      const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
        ...(executablePath && { executablePath }),
      });
    }
    return this.browser;
  }

  /**
   * Closes the browser instance
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Gets the current configuration
   * @returns Configuration copy
   */
  getConfig(): PDFMakerConfig {
    return { ...this.config };
  }
}
