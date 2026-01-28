/**
 * LeonardoProvider - Image generation using Leonardo.ai API
 * https://docs.leonardo.ai/
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { RateLimiter, createLogger } from '@social-content/shared';
import type {
  ImageProvider,
  ImageGenOptions,
  GeneratedImage,
  ProviderRateLimits,
  ProviderStatus,
  ImageSize,
} from '../types';
import { ImageGenError, ImageGenErrorCode, ImageStyle, AspectRatio } from '../types';

const logger = createLogger('image-gen:leonardo');

/**
 * Leonardo API response types
 */
interface LeonardoGenerateRequest {
  prompt: string;
  negative_prompt?: string;
  num_images: number;
  width: number;
  height: number;
  modelId: string;
  presetStyle?: string;
}

interface LeonardoGenerationJob {
  generationId: string;
}

interface LeonardoGenerateResponse {
  sdGenerationJob: LeonardoGenerationJob;
}

interface LeonardoGeneratedImage {
  url: string;
  id: string;
}

interface LeonardoGenerationStatus {
  generations_by_pk: {
    status: 'PENDING' | 'COMPLETE' | 'FAILED';
    generated_images?: LeonardoGeneratedImage[];
  };
}

/**
 * Configuration for LeonardoProvider
 */
export interface LeonardoConfig {
  /** API key for authentication */
  apiKey: string;
  /** Base URL override (for testing) */
  baseUrl?: string;
  /** Custom rate limits */
  rateLimits?: Partial<ProviderRateLimits>;
  /** Model ID to use (default: Leonardo Diffusion XL) */
  modelId?: string;
  /** Maximum polling attempts for generation status */
  maxPollingAttempts?: number;
  /** Polling interval in milliseconds */
  pollingIntervalMs?: number;
}

/**
 * Default rate limits for Leonardo free tier
 */
const DEFAULT_RATE_LIMITS: ProviderRateLimits = {
  requestsPerMinute: 10,
  requestsPerDay: 150,
};

// Default Leonardo Diffusion XL model
const DEFAULT_MODEL_ID = 'b24e16ff-06e3-43eb-8d33-4416c2d75876';

/**
 * LeonardoProvider - Generates images using Leonardo.ai
 *
 * @example
 * ```typescript
 * const provider = createLeonardoProvider({ apiKey: 'your-key' });
 * const image = await provider.generate({
 *   prompt: 'A mystical forest',
 *   style: ImageStyle.FUTURISTIC,
 *   aspectRatio: AspectRatio.LANDSCAPE
 * });
 * ```
 */
export class LeonardoProvider implements ImageProvider {
  readonly name = 'leonardo';
  readonly rateLimits: ProviderRateLimits;

  private apiKey: string;
  private baseUrl: string;
  private modelId: string;
  private maxPollingAttempts: number;
  private pollingIntervalMs: number;
  private rateLimiter: RateLimiter;
  private status: ProviderStatus;

  constructor(config: LeonardoConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? 'https://cloud.leonardo.ai/api/rest/v1';
    this.modelId = config.modelId ?? DEFAULT_MODEL_ID;
    this.maxPollingAttempts = config.maxPollingAttempts ?? 30;
    this.pollingIntervalMs = config.pollingIntervalMs ?? 2000;
    this.rateLimits = {
      ...DEFAULT_RATE_LIMITS,
      ...config.rateLimits,
    };

    this.rateLimiter = new RateLimiter({
      maxRequests: this.rateLimits.requestsPerMinute,
      windowMs: 60000,
    });

    this.status = {
      name: this.name,
      available: true,
      failureCount: 0,
    };

    logger.debug('LeonardoProvider initialized', {
      modelId: this.modelId,
      rateLimits: this.rateLimits,
    });
  }

  /**
   * Generate an image using Leonardo.ai API
   */
  async generate(options: ImageGenOptions): Promise<GeneratedImage> {
    // Acquire rate limiter token
    await this.rateLimiter.acquire();

    logger.info('Generating image', {
      prompt: options.prompt.substring(0, 100),
      style: options.style,
      aspectRatio: options.aspectRatio,
    });

    try {
      // Step 1: Create generation job
      const generationId = await this.createGeneration(options);

      // Step 2: Poll for completion
      const imageUrl = await this.waitForGeneration(generationId);

      // Step 3: Download and save
      const outputDir = options.outputPath ?? './output/images';
      const localPath = await this.downloadImage(imageUrl, outputDir);

      // Get file stats
      const stats = await fs.stat(localPath);
      const size = this.getSizeFromAspectRatio(options.aspectRatio);

      // Update status on success
      this.status.failureCount = 0;
      this.status.lastUsed = new Date();
      this.status.lastError = undefined;

      const result: GeneratedImage = {
        id: generationId,
        provider: this.name,
        prompt: options.prompt,
        url: imageUrl,
        localPath,
        size,
        format: 'png',
        fileSize: stats.size,
        generatedAt: new Date(),
        metadata: options.metadata,
      };

      logger.info('Image generated successfully', {
        id: result.id,
        localPath: result.localPath,
        size: result.size,
      });

      return result;
    } catch (error) {
      // Update status on failure
      this.status.failureCount++;
      this.status.lastError = (error as Error).message;

      if (error instanceof ImageGenError) {
        throw error;
      }

      throw new ImageGenError(
        `Leonardo generation failed: ${(error as Error).message}`,
        this.name,
        ImageGenErrorCode.API_ERROR,
        true
      );
    }
  }

  /**
   * Check if provider is available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    // Consider unavailable if too many consecutive failures
    if (this.status.failureCount >= 5) {
      return false;
    }

    return this.status.available;
  }

  /**
   * Get current provider status
   */
  getStatus(): ProviderStatus {
    return { ...this.status };
  }

  /**
   * Create a generation job in Leonardo
   */
  private async createGeneration(options: ImageGenOptions): Promise<string> {
    const size = this.getSizeFromAspectRatio(options.aspectRatio);

    const request: LeonardoGenerateRequest = {
      prompt: this.enhancePrompt(options.prompt, options.style),
      negative_prompt: options.negativePrompt ?? 'text, watermark, blurry',
      num_images: 1,
      width: size.width,
      height: size.height,
      modelId: this.modelId,
      presetStyle: this.mapStyle(options.style),
    };

    logger.debug('Creating generation', { request });

    const response = await fetch(`${this.baseUrl}/generations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const isRetriable = response.status >= 500 || response.status === 429;
      const code =
        response.status === 429
          ? ImageGenErrorCode.RATE_LIMITED
          : response.status === 401
            ? ImageGenErrorCode.AUTH_FAILED
            : ImageGenErrorCode.HTTP_ERROR;

      throw new ImageGenError(
        `Leonardo API error: ${errorText}`,
        this.name,
        code,
        isRetriable,
        response.status
      );
    }

    const data = (await response.json()) as LeonardoGenerateResponse;
    const generationId = data.sdGenerationJob.generationId;

    logger.debug('Generation created', { generationId });

    return generationId;
  }

  /**
   * Poll for generation completion
   */
  private async waitForGeneration(generationId: string): Promise<string> {
    logger.debug('Waiting for generation', { generationId });

    for (let attempt = 0; attempt < this.maxPollingAttempts; attempt++) {
      const response = await fetch(`${this.baseUrl}/generations/${generationId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new ImageGenError(
          'Failed to check generation status',
          this.name,
          ImageGenErrorCode.API_ERROR,
          true,
          response.status
        );
      }

      const data = (await response.json()) as LeonardoGenerationStatus;
      const generation = data.generations_by_pk;

      logger.debug('Generation status', {
        generationId,
        status: generation.status,
        attempt,
      });

      if (generation.status === 'COMPLETE') {
        if (generation.generated_images && generation.generated_images.length > 0) {
          return generation.generated_images[0].url;
        }

        throw new ImageGenError(
          'Generation complete but no images returned',
          this.name,
          ImageGenErrorCode.NO_IMAGE,
          false
        );
      }

      if (generation.status === 'FAILED') {
        throw new ImageGenError(
          'Image generation failed',
          this.name,
          ImageGenErrorCode.API_ERROR,
          true
        );
      }

      // Wait before next poll
      await this.sleep(this.pollingIntervalMs);
    }

    throw new ImageGenError(
      `Generation timed out after ${this.maxPollingAttempts} attempts`,
      this.name,
      ImageGenErrorCode.TIMEOUT,
      true
    );
  }

  /**
   * Enhance prompt with style-specific additions
   */
  private enhancePrompt(prompt: string, style?: ImageStyle): string {
    const base = `${prompt}, high quality, professional, detailed`;

    if (!style) return base;

    const enhancements: Record<ImageStyle, string> = {
      [ImageStyle.ABSTRACT]: `${base}, abstract art, fluid shapes`,
      [ImageStyle.TECH]: `${base}, technology, digital, futuristic`,
      [ImageStyle.GRADIENT]: `${base}, smooth gradients, colorful`,
      [ImageStyle.MINIMAL]: `${base}, minimalist, clean, simple`,
      [ImageStyle.FUTURISTIC]: `${base}, sci-fi, advanced, cyberpunk`,
      [ImageStyle.GEOMETRIC]: `${base}, geometric shapes, patterns`,
      [ImageStyle.NEON]: `${base}, neon lights, glowing, vibrant`,
    };

    return enhancements[style] ?? base;
  }

  /**
   * Map internal style to Leonardo preset style
   */
  private mapStyle(style?: ImageStyle): string {
    const mapping: Record<ImageStyle, string> = {
      [ImageStyle.ABSTRACT]: 'CREATIVE',
      [ImageStyle.TECH]: 'DYNAMIC',
      [ImageStyle.GRADIENT]: 'VIBRANT',
      [ImageStyle.MINIMAL]: 'NONE',
      [ImageStyle.FUTURISTIC]: 'CINEMATIC',
      [ImageStyle.GEOMETRIC]: 'DYNAMIC',
      [ImageStyle.NEON]: 'VIBRANT',
    };
    return style ? mapping[style] : 'NONE';
  }

  /**
   * Get image size for aspect ratio
   */
  private getSizeFromAspectRatio(ratio?: AspectRatio): ImageSize {
    const sizes: Record<AspectRatio, ImageSize> = {
      [AspectRatio.SQUARE]: { width: 1024, height: 1024 },
      [AspectRatio.PORTRAIT]: { width: 832, height: 1216 },
      [AspectRatio.LANDSCAPE]: { width: 1344, height: 768 },
      [AspectRatio.STORY]: { width: 768, height: 1344 },
    };
    return ratio ? sizes[ratio] : sizes[AspectRatio.SQUARE];
  }

  /**
   * Download image from URL and save locally
   */
  private async downloadImage(url: string, outputDir: string): Promise<string> {
    logger.debug('Downloading image', { url, outputDir });

    const response = await fetch(url);

    if (!response.ok) {
      throw new ImageGenError(
        `Failed to download image: HTTP ${response.status}`,
        this.name,
        ImageGenErrorCode.DOWNLOAD_FAILED,
        true,
        response.status
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const filename = `leonardo_${randomUUID()}.png`;
    const filePath = path.join(outputDir, filename);

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(filePath, buffer);

    logger.debug('Image saved', { filePath, size: buffer.length });

    return filePath;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get default size for aspect ratio (static helper)
   */
  static getSizeForAspectRatio(ratio: AspectRatio): ImageSize {
    const sizes: Record<AspectRatio, ImageSize> = {
      [AspectRatio.SQUARE]: { width: 1024, height: 1024 },
      [AspectRatio.PORTRAIT]: { width: 832, height: 1216 },
      [AspectRatio.LANDSCAPE]: { width: 1344, height: 768 },
      [AspectRatio.STORY]: { width: 768, height: 1344 },
    };
    return sizes[ratio];
  }
}

/**
 * Factory function to create LeonardoProvider
 */
export function createLeonardoProvider(config: LeonardoConfig): LeonardoProvider {
  return new LeonardoProvider(config);
}
