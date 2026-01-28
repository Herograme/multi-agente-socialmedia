/**
 * Browser Pool implementations for RendererService
 * Story 3.4 - Servico de Renderizacao HTML para Imagem
 *
 * MVP: SingletonBrowserPool - reuses a single browser instance
 * Post-MVP: Full pool with configurable size and connection management
 */

import puppeteer, { Browser } from 'puppeteer';
import { createLogger } from '@social-content/shared';
import type { BrowserPool, PoolMetrics, RendererConfig } from './types';
import { RendererError, RendererErrorCode } from './types';

const logger = createLogger('browser-pool');

/**
 * Default Puppeteer arguments for stable headless operation
 */
const DEFAULT_PUPPETEER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--disable-software-rasterizer',
];

/**
 * Singleton Browser Pool implementation
 *
 * This is the MVP implementation that maintains a single browser instance
 * and reuses it for all render operations. Suitable for moderate workloads.
 *
 * For high-throughput scenarios, implement a full pool with multiple
 * browser instances and connection management.
 *
 * @example
 * ```typescript
 * const pool = new SingletonBrowserPool({
 *   headless: true,
 *   timeout: 30000
 * });
 *
 * const browser = await pool.acquire();
 * // Use browser...
 * await pool.release(browser);
 *
 * await pool.dispose();
 * ```
 */
export class SingletonBrowserPool implements BrowserPool {
  private browser: Browser | null = null;
  private config: Required<RendererConfig>;
  private inUse = false;
  private metrics = {
    totalRenders: 0,
    totalRenderTimeMs: 0,
    acquireCount: 0,
    releaseCount: 0,
  };

  constructor(config?: Partial<RendererConfig>) {
    this.config = {
      headless: config?.headless ?? true,
      defaultViewport: config?.defaultViewport ?? { width: 1080, height: 1080 },
      timeout: config?.timeout ?? 30000,
      puppeteerArgs: config?.puppeteerArgs ?? DEFAULT_PUPPETEER_ARGS,
    };

    logger.debug('SingletonBrowserPool created', {
      headless: this.config.headless,
      viewport: this.config.defaultViewport,
    });
  }

  /**
   * Acquire the browser instance
   * Creates a new browser if one doesn't exist
   */
  async acquire(): Promise<Browser> {
    const startTime = Date.now();

    if (!this.browser) {
      logger.info('Launching new browser instance');
      this.browser = await this.launchBrowser();
    }

    this.inUse = true;
    this.metrics.acquireCount++;
    this.metrics.totalRenderTimeMs += Date.now() - startTime;

    logger.debug('Browser acquired', {
      acquireCount: this.metrics.acquireCount,
    });

    return this.browser;
  }

  /**
   * Release the browser back to the pool
   * In singleton mode, this just marks it as available
   */
  async release(_browser: Browser): Promise<void> {
    this.inUse = false;
    this.metrics.releaseCount++;
    this.metrics.totalRenders++;

    logger.debug('Browser released', {
      releaseCount: this.metrics.releaseCount,
      totalRenders: this.metrics.totalRenders,
    });
  }

  /**
   * Close the browser and clean up resources
   */
  async dispose(): Promise<void> {
    if (this.browser) {
      logger.info('Disposing browser pool');
      try {
        await this.browser.close();
        logger.info('Browser pool disposed');
      } catch (error) {
        logger.warn('Error disposing browser pool', {
          error: (error as Error).message,
        });
      } finally {
        this.browser = null;
        this.inUse = false;
      }
    }
  }

  /**
   * Get current pool metrics
   */
  getMetrics(): PoolMetrics {
    return {
      totalRenders: this.metrics.totalRenders,
      avgRenderTimeMs:
        this.metrics.acquireCount > 0
          ? this.metrics.totalRenderTimeMs / this.metrics.acquireCount
          : 0,
      activeBrowsers: this.browser ? 1 : 0,
      availableBrowsers: this.browser && !this.inUse ? 1 : 0,
    };
  }

  /**
   * Check if the pool has an active browser
   */
  hasActiveBrowser(): boolean {
    return this.browser !== null;
  }

  /**
   * Check if the browser is currently in use
   */
  isInUse(): boolean {
    return this.inUse;
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
}

/**
 * Documentation for implementing a full browser pool post-MVP
 *
 * A full pool implementation would include:
 *
 * 1. Pool configuration:
 *    - minBrowsers: Minimum browsers to maintain
 *    - maxBrowsers: Maximum browsers allowed
 *    - idleTimeout: Close idle browsers after this time
 *    - acquireTimeout: Max time to wait for available browser
 *
 * 2. Connection management:
 *    - Queue for pending acquire requests
 *    - Health checks for browser instances
 *    - Automatic replacement of crashed browsers
 *
 * 3. Scaling:
 *    - Dynamic scaling based on demand
 *    - Pre-warming browsers during low activity
 *
 * 4. Monitoring:
 *    - Detailed metrics per browser
 *    - Request queue depth
 *    - Browser health status
 *
 * Example interface:
 * ```typescript
 * interface FullPoolConfig extends RendererConfig {
 *   minBrowsers: number;
 *   maxBrowsers: number;
 *   idleTimeoutMs: number;
 *   acquireTimeoutMs: number;
 *   healthCheckIntervalMs: number;
 * }
 * ```
 */
