/**
 * ImageGenService types - Image generation service abstraction
 * Supports multiple providers with automatic fallback
 */

/**
 * Available image styles
 */
export enum ImageStyle {
  ABSTRACT = 'abstract',
  TECH = 'tech',
  GRADIENT = 'gradient',
  MINIMAL = 'minimal',
  FUTURISTIC = 'futuristic',
  GEOMETRIC = 'geometric',
  NEON = 'neon',
}

/**
 * Supported aspect ratios
 */
export enum AspectRatio {
  SQUARE = '1:1', // 1080x1080 Instagram
  PORTRAIT = '4:5', // 1080x1350 Instagram
  LANDSCAPE = '16:9', // 1920x1080 Desktop
  STORY = '9:16', // 1080x1920 Stories
}

/**
 * Image dimensions
 */
export interface ImageSize {
  width: number;
  height: number;
}

/**
 * Options for image generation
 */
export interface ImageGenOptions {
  /** The prompt describing the image to generate */
  prompt: string;
  /** Negative prompt to exclude elements */
  negativePrompt?: string;
  /** Visual style for the image */
  style?: ImageStyle;
  /** Aspect ratio for the image */
  aspectRatio?: AspectRatio;
  /** Custom size override */
  size?: ImageSize;
  /** Directory or full path for the output image */
  outputPath?: string;
  /** Optional metadata to attach to the result */
  metadata?: {
    postId?: string;
    topicId?: string;
    [key: string]: unknown;
  };
}

/**
 * Result of image generation
 */
export interface GeneratedImage {
  /** Unique identifier for this generation */
  id: string;
  /** Provider that generated the image */
  provider: string;
  /** Original prompt used */
  prompt: string;
  /** Remote URL of the generated image (if available) */
  url?: string;
  /** Local path where image was saved */
  localPath: string;
  /** Image dimensions */
  size: ImageSize;
  /** Image format */
  format: 'png' | 'jpg' | 'webp';
  /** File size in bytes */
  fileSize: number;
  /** Generation timestamp */
  generatedAt: Date;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Rate limit configuration for a provider
 */
export interface ProviderRateLimits {
  /** Maximum requests per minute */
  requestsPerMinute: number;
  /** Maximum requests per day */
  requestsPerDay: number;
  /** Optional: tokens per minute limit */
  tokensPerMinute?: number;
}

/**
 * Current status of a provider
 */
export interface ProviderStatus {
  /** Provider name */
  name: string;
  /** Whether the provider is currently available */
  available: boolean;
  /** Last error message if any */
  lastError?: string;
  /** Consecutive failure count */
  failureCount: number;
  /** Last successful usage timestamp */
  lastUsed?: Date;
  /** Remaining rate limit (if known) */
  rateLimitRemaining?: number;
}

/**
 * Base interface for image generation providers
 */
export interface ImageProvider {
  /** Unique name identifier */
  readonly name: string;
  /** Rate limits for this provider */
  readonly rateLimits: ProviderRateLimits;

  /**
   * Generate an image based on the provided options
   * @param options - Generation options including prompt, style, etc.
   * @returns Generated image result
   */
  generate(options: ImageGenOptions): Promise<GeneratedImage>;

  /**
   * Check if the provider is currently available
   * @returns true if available, false otherwise
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get the current status of the provider
   * @returns Provider status information
   */
  getStatus(): ProviderStatus;
}

/**
 * Configuration for a single provider
 */
export interface ImageProviderConfig {
  /** Provider name identifier */
  name: 'ideogram' | 'leonardo';
  /** API key for authentication */
  apiKey: string;
  /** Whether this provider is enabled */
  enabled: boolean;
  /** Priority order (lower = higher priority) */
  priority: number;
  /** Custom rate limits override */
  rateLimits?: Partial<ProviderRateLimits>;
}

/**
 * Configuration for the ImageGenService
 */
export interface ImageGenConfig {
  /** List of provider configurations */
  providers: ImageProviderConfig[];
  /** Default style when not specified */
  defaultStyle: ImageStyle;
  /** Default aspect ratio when not specified */
  defaultAspectRatio: AspectRatio;
  /** Default output directory for generated images */
  defaultOutputDir: string;
  /** Maximum retry attempts per provider */
  maxRetries: number;
  /** Consecutive failures before opening circuit breaker */
  circuitBreakerThreshold: number;
  /** Time in ms before attempting to close circuit breaker */
  circuitBreakerResetMs: number;
}

/**
 * Usage metrics for a provider
 */
export interface ProviderMetrics {
  /** Total requests made */
  requests: number;
  /** Successful generations */
  successes: number;
  /** Failed generations */
  failures: number;
}

/**
 * Error codes for image generation
 */
export enum ImageGenErrorCode {
  /** API returned an error */
  API_ERROR = 'API_ERROR',
  /** HTTP error from provider */
  HTTP_ERROR = 'HTTP_ERROR',
  /** Rate limit exceeded */
  RATE_LIMITED = 'RATE_LIMITED',
  /** Authentication failed */
  AUTH_FAILED = 'AUTH_FAILED',
  /** No image in response */
  NO_IMAGE = 'NO_IMAGE',
  /** Failed to download image */
  DOWNLOAD_FAILED = 'DOWNLOAD_FAILED',
  /** Generation timed out */
  TIMEOUT = 'TIMEOUT',
  /** Provider unavailable */
  UNAVAILABLE = 'UNAVAILABLE',
  /** All providers failed */
  ALL_PROVIDERS_FAILED = 'ALL_PROVIDERS_FAILED',
  /** Invalid configuration */
  INVALID_CONFIG = 'INVALID_CONFIG',
}

/**
 * Custom error class for image generation errors
 */
export class ImageGenError extends Error {
  /** Provider that caused the error */
  public readonly provider: string;
  /** Error code for categorization */
  public readonly code: ImageGenErrorCode | string;
  /** Whether this error can be retried */
  public readonly retriable: boolean;
  /** HTTP status code if applicable */
  public readonly statusCode?: number;

  constructor(
    message: string,
    provider: string,
    code: ImageGenErrorCode | string,
    retriable = true,
    statusCode?: number
  ) {
    super(message);
    this.name = 'ImageGenError';
    this.provider = provider;
    this.code = code;
    this.retriable = retriable;
    this.statusCode = statusCode;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ImageGenError);
    }
  }
}

/**
 * Events emitted by ImageGenService
 */
export interface ImageGenEvents {
  /** Provider started generation attempt */
  'provider:start': { provider: string; options: ImageGenOptions };
  /** Provider generation succeeded */
  'provider:success': { provider: string; result: GeneratedImage };
  /** Provider generation failed */
  'provider:error': { provider: string; error: Error };
  /** Provider was skipped */
  'provider:skipped': { provider: string; reason: string };
  /** Circuit breaker opened for a provider */
  'circuit:open': { provider: string; failures: number };
  /** Circuit breaker closed for a provider */
  'circuit:close': { provider: string };
}
