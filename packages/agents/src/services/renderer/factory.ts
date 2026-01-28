/**
 * RendererService factory functions
 * Story 3.4 - Servico de Renderizacao HTML para Imagem
 */

import { createLogger } from '@social-content/shared';
import { RendererService } from './renderer-service';
import { SingletonBrowserPool } from './browser-pool';
import type { RendererConfig, BrowserPool } from './types';
import { RendererError, RendererErrorCode } from './types';

const logger = createLogger('renderer:factory');

/**
 * Default configuration for RendererService
 */
const DEFAULT_CONFIG: RendererConfig = {
  headless: true,
  defaultViewport: { width: 1080, height: 1080 },
  timeout: 30000,
};

/**
 * Create a configured RendererService instance
 *
 * @example
 * ```typescript
 * const renderer = createRendererService({
 *   headless: true,
 *   defaultViewport: { width: 1080, height: 1080 },
 *   timeout: 30000
 * });
 *
 * await renderer.initialize();
 * const buffer = await renderer.renderToImage('<h1>Hello</h1>');
 * await renderer.dispose();
 * ```
 *
 * @param config - Optional configuration overrides
 * @returns Configured RendererService instance
 * @throws RendererError if configuration is invalid
 */
export function createRendererService(
  config?: Partial<RendererConfig>
): RendererService {
  const mergedConfig: RendererConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    defaultViewport: {
      width: config?.defaultViewport?.width ?? DEFAULT_CONFIG.defaultViewport!.width,
      height: config?.defaultViewport?.height ?? DEFAULT_CONFIG.defaultViewport!.height,
    },
  };

  // Validate configuration
  validateConfig(mergedConfig);

  logger.info('Creating RendererService', {
    headless: mergedConfig.headless,
    viewport: mergedConfig.defaultViewport,
    timeout: mergedConfig.timeout,
  });

  return new RendererService(mergedConfig);
}

/**
 * Create a browser pool instance
 *
 * @example
 * ```typescript
 * const pool = createBrowserPool({
 *   headless: true,
 *   timeout: 30000
 * });
 *
 * const browser = await pool.acquire();
 * // Use browser...
 * await pool.release(browser);
 * await pool.dispose();
 * ```
 *
 * @param config - Optional configuration overrides
 * @returns Configured BrowserPool instance (SingletonBrowserPool for MVP)
 */
export function createBrowserPool(
  config?: Partial<RendererConfig>
): BrowserPool {
  const mergedConfig: RendererConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    defaultViewport: {
      width: config?.defaultViewport?.width ?? DEFAULT_CONFIG.defaultViewport!.width,
      height: config?.defaultViewport?.height ?? DEFAULT_CONFIG.defaultViewport!.height,
    },
  };

  validateConfig(mergedConfig);

  logger.info('Creating BrowserPool', {
    type: 'singleton',
    headless: mergedConfig.headless,
  });

  return new SingletonBrowserPool(mergedConfig);
}

/**
 * Validate renderer configuration
 * @throws RendererError if configuration is invalid
 */
function validateConfig(config: RendererConfig): void {
  // Validate timeout
  if (config.timeout !== undefined && config.timeout < 1000) {
    throw new RendererError(
      'timeout must be at least 1000ms',
      RendererErrorCode.INVALID_CONFIG,
      { timeout: config.timeout }
    );
  }

  // Validate viewport
  if (config.defaultViewport) {
    if (config.defaultViewport.width < 1) {
      throw new RendererError(
        'defaultViewport.width must be at least 1',
        RendererErrorCode.INVALID_CONFIG,
        { width: config.defaultViewport.width }
      );
    }
    if (config.defaultViewport.height < 1) {
      throw new RendererError(
        'defaultViewport.height must be at least 1',
        RendererErrorCode.INVALID_CONFIG,
        { height: config.defaultViewport.height }
      );
    }
  }

  logger.debug('Configuration validated', {
    timeout: config.timeout,
    viewport: config.defaultViewport,
  });
}

/**
 * Get the default configuration for reference
 *
 * @example
 * ```typescript
 * const defaults = getDefaultConfig();
 * console.log(defaults.timeout); // 30000
 * ```
 *
 * @returns Copy of the default configuration
 */
export function getDefaultConfig(): RendererConfig {
  return { ...DEFAULT_CONFIG };
}
