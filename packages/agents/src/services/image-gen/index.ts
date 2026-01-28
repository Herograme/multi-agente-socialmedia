/**
 * ImageGenService module
 * Exports all image generation service components
 */

// Main service
export { ImageGenService } from './image-gen-service';

// Types and enums
export type {
  ImageProvider,
  ImageGenOptions,
  GeneratedImage,
  ImageGenConfig,
  ImageProviderConfig,
  ProviderRateLimits,
  ProviderStatus,
  ProviderMetrics,
  ImageSize,
  ImageGenEvents,
} from './types';

export { ImageStyle, AspectRatio, ImageGenError, ImageGenErrorCode } from './types';

// Factory functions
export { createImageGenService, createImageGenServiceFromEnv, getDefaultConfig } from './factory';

// Provider exports
export {
  IdeogramProvider,
  createIdeogramProvider,
  LeonardoProvider,
  createLeonardoProvider,
} from './providers';

export type { IdeogramConfig, LeonardoConfig } from './providers';
