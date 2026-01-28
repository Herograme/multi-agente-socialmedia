/**
 * RendererService types - HTML to image rendering service
 * Story 3.4 - Servico de Renderizacao HTML para Imagem
 */

import type { Browser } from 'puppeteer';

/**
 * Supported image output formats
 */
export type ImageFormat = 'png' | 'jpeg' | 'webp';

/**
 * Options for rendering HTML to image
 */
export interface RenderOptions {
  /** Width in pixels (default: 1080) */
  width?: number;
  /** Height in pixels (default: 1080) */
  height?: number;
  /** Output format (default: 'png') */
  format?: ImageFormat;
  /** Quality for JPEG/WebP, 0-100 (default: 90) */
  quality?: number;
  /** Path to external CSS file to inject */
  cssPath?: string;
  /** CSS content string to inject */
  cssContent?: string;
  /** Path to local background image */
  backgroundImage?: string;
  /** Device scale factor for retina displays (default: 1) */
  deviceScaleFactor?: number;
}

/**
 * Result of a render operation with metadata
 */
export interface RenderResult {
  /** Buffer containing the rendered image */
  buffer: Buffer;
  /** Width of the rendered image in pixels */
  width: number;
  /** Height of the rendered image in pixels */
  height: number;
  /** Format of the rendered image */
  format: ImageFormat;
  /** Size of the buffer in bytes */
  size: number;
  /** Time taken to render in milliseconds */
  renderTimeMs: number;
}

/**
 * Configuration for the RendererService
 */
export interface RendererConfig {
  /** Run browser in headless mode (default: true) */
  headless?: boolean;
  /** Default viewport dimensions */
  defaultViewport?: {
    width: number;
    height: number;
  };
  /** Timeout for operations in milliseconds (default: 30000) */
  timeout?: number;
  /** Additional Puppeteer launch arguments */
  puppeteerArgs?: string[];
}

/**
 * Interface for browser pool implementations
 * Allows different pooling strategies (singleton, pool, etc.)
 */
export interface BrowserPool {
  /**
   * Acquire a browser instance from the pool
   * @returns Promise resolving to a Browser instance
   */
  acquire(): Promise<Browser>;

  /**
   * Release a browser instance back to the pool
   * @param browser - The browser instance to release
   */
  release(browser: Browser): Promise<void>;

  /**
   * Close all browsers and clean up the pool
   */
  dispose(): Promise<void>;

  /**
   * Get current pool metrics
   */
  getMetrics(): PoolMetrics;
}

/**
 * Metrics for browser pool monitoring
 */
export interface PoolMetrics {
  /** Total number of render operations executed */
  totalRenders: number;
  /** Average render time in milliseconds */
  avgRenderTimeMs: number;
  /** Number of browsers currently active */
  activeBrowsers: number;
  /** Number of browsers available for use */
  availableBrowsers: number;
}

/**
 * Error codes for renderer operations
 */
export enum RendererErrorCode {
  /** Failed to launch browser */
  BROWSER_LAUNCH_FAILED = 'BROWSER_LAUNCH_FAILED',
  /** Failed to create page */
  PAGE_CREATION_FAILED = 'PAGE_CREATION_FAILED',
  /** Failed to set content */
  CONTENT_SET_FAILED = 'CONTENT_SET_FAILED',
  /** Failed to take screenshot */
  SCREENSHOT_FAILED = 'SCREENSHOT_FAILED',
  /** CSS injection failed */
  CSS_INJECTION_FAILED = 'CSS_INJECTION_FAILED',
  /** Background image not found or invalid */
  BACKGROUND_IMAGE_FAILED = 'BACKGROUND_IMAGE_FAILED',
  /** Operation timed out */
  TIMEOUT = 'TIMEOUT',
  /** Invalid configuration */
  INVALID_CONFIG = 'INVALID_CONFIG',
  /** Browser not initialized */
  NOT_INITIALIZED = 'NOT_INITIALIZED',
}

/**
 * Custom error class for renderer operations
 */
export class RendererError extends Error {
  /** Error code for categorization */
  public readonly code: RendererErrorCode;
  /** Additional context about the error */
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: RendererErrorCode,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'RendererError';
    this.code = code;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RendererError);
    }
  }
}
