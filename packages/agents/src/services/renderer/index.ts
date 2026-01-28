/**
 * RendererService module
 * Exports all HTML to image rendering components
 * Story 3.4 - Servico de Renderizacao HTML para Imagem
 */

// Main service
export { RendererService as HTMLRendererService } from './renderer-service';

// Browser pool
export { SingletonBrowserPool } from './browser-pool';

// Types and enums - use prefixed names to avoid conflicts with carousel-builder
export type {
  ImageFormat as HTMLImageFormat,
  RenderOptions as HTMLRenderOptions,
  RenderResult as HTMLRenderResult,
  RendererConfig as HTMLRendererConfig,
  BrowserPool,
  PoolMetrics,
} from './types';

export { RendererError, RendererErrorCode } from './types';

// Factory functions
export {
  createRendererService as createHTMLRendererService,
  createBrowserPool,
  getDefaultConfig as getHTMLRendererDefaultConfig,
} from './factory';
