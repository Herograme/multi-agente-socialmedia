/**
 * IdeogramProvider - Image generation using Ideogram AI API
 * https://docs.ideogram.ai/
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

const logger = createLogger('image-gen:ideogram');

/**
 * Ideogram API response types
 */
interface IdeogramGenerateRequest {
  image_request: {
    prompt: string;
    negative_prompt?: string;
    aspect_ratio?: string;
    model?: string;
    style_type?: string;
  };
}

interface IdeogramImageData {
  url: string;
  prompt: string;
  resolution: string;
  is_image_safe: boolean;
}

interface IdeogramGenerateResponse {
  data: IdeogramImageData[];
}

/**
 * Configuration for IdeogramProvider
 */
export interface IdeogramConfig {
  /** API key for authentication */
  apiKey: string;
  /** Base URL override (for testing) */
  baseUrl?: string;
  /** Custom rate limits */
  rateLimits?: Partial<ProviderRateLimits>;
}

/**
 * Default rate limits for Ideogram free tier
 */
const DEFAULT_RATE_LIMITS: ProviderRateLimits = {
  requestsPerMinute: 8,
  requestsPerDay: 25,
};

/**
 * IdeogramProvider - Generates images using Ideogram AI
 *
 * @example
 * ```typescript
 * const provider = createIdeogramProvider({ apiKey: 'your-key' });
 * const image = await provider.generate({
 *   prompt: 'A futuristic cityscape',
 *   style: ImageStyle.TECH,
 *   aspectRatio: AspectRatio.LANDSCAPE
 * });
 * ```
 */
export class IdeogramProvider implements ImageProvider {
  readonly name = 'ideogram';
  readonly rateLimits: ProviderRateLimits;

  private apiKey: string;
  private baseUrl: string;
  private rateLimiter: RateLimiter;
  private status: ProviderStatus;

  constructor(config: IdeogramConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? 'https://api.ideogram.ai/generate';
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

    logger.debug('IdeogramProvider initialized', {
      rateLimits: this.rateLimits,
    });
  }

  /**
   * Generate an image using Ideogram API
   */
  async generate(options: ImageGenOptions): Promise<GeneratedImage> {
    // Acquire rate limiter token
    await this.rateLimiter.acquire();

    const request = this.buildRequest(options);

    logger.info('Generating image', {
      prompt: options.prompt.substring(0, 100),
      style: options.style,
      aspectRatio: options.aspectRatio,
    });

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey,
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
          `Ideogram API error: ${errorText}`,
          this.name,
          code,
          isRetriable,
          response.status
        );
      }

      const data = (await response.json()) as IdeogramGenerateResponse;

      if (!data.data || data.data.length === 0) {
        throw new ImageGenError(
          'No image generated in response',
          this.name,
          ImageGenErrorCode.NO_IMAGE,
          true
        );
      }

      const imageData = data.data[0];

      // Download and save the image
      const outputDir = options.outputPath ?? './output/images';
      const localPath = await this.downloadImage(imageData.url, outputDir);

      // Get file stats
      const stats = await fs.stat(localPath);
      const [width, height] = this.parseResolution(imageData.resolution);

      // Update status on success
      this.status.failureCount = 0;
      this.status.lastUsed = new Date();
      this.status.lastError = undefined;

      const result: GeneratedImage = {
        id: randomUUID(),
        provider: this.name,
        prompt: options.prompt,
        url: imageData.url,
        localPath,
        size: { width, height },
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
        `Ideogram generation failed: ${(error as Error).message}`,
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
   * Build Ideogram API request
   */
  private buildRequest(options: ImageGenOptions): IdeogramGenerateRequest {
    return {
      image_request: {
        prompt: this.enhancePrompt(options.prompt, options.style),
        negative_prompt:
          options.negativePrompt ?? 'text, watermark, signature, blurry, low quality',
        aspect_ratio: this.mapAspectRatio(options.aspectRatio),
        model: 'V_2',
        style_type: this.mapStyle(options.style),
      },
    };
  }

  /**
   * Enhance prompt with style-specific additions
   */
  private enhancePrompt(prompt: string, style?: ImageStyle): string {
    const styleEnhancements: Record<ImageStyle, string> = {
      [ImageStyle.ABSTRACT]: 'abstract digital art, flowing shapes,',
      [ImageStyle.TECH]: 'technology themed, circuit patterns, digital,',
      [ImageStyle.GRADIENT]: 'smooth gradient, colorful transitions,',
      [ImageStyle.MINIMAL]: 'minimalist, clean, simple shapes,',
      [ImageStyle.FUTURISTIC]: 'futuristic, sci-fi, advanced technology,',
      [ImageStyle.GEOMETRIC]: 'geometric patterns, polygons, mathematical,',
      [ImageStyle.NEON]: 'neon lights, glowing, cyberpunk,',
    };

    const enhancement = style ? styleEnhancements[style] : '';
    return `${enhancement} ${prompt}, professional quality, 4k, highly detailed`.trim();
  }

  /**
   * Map internal aspect ratio to Ideogram format
   */
  private mapAspectRatio(ratio?: AspectRatio): string {
    const mapping: Record<AspectRatio, string> = {
      [AspectRatio.SQUARE]: 'ASPECT_1_1',
      [AspectRatio.PORTRAIT]: 'ASPECT_4_5',
      [AspectRatio.LANDSCAPE]: 'ASPECT_16_9',
      [AspectRatio.STORY]: 'ASPECT_9_16',
    };
    return ratio ? mapping[ratio] : 'ASPECT_1_1';
  }

  /**
   * Map internal style to Ideogram style_type
   */
  private mapStyle(style?: ImageStyle): string {
    const mapping: Record<ImageStyle, string> = {
      [ImageStyle.ABSTRACT]: 'DESIGN',
      [ImageStyle.TECH]: 'RENDER_3D',
      [ImageStyle.GRADIENT]: 'DESIGN',
      [ImageStyle.MINIMAL]: 'DESIGN',
      [ImageStyle.FUTURISTIC]: 'RENDER_3D',
      [ImageStyle.GEOMETRIC]: 'DESIGN',
      [ImageStyle.NEON]: 'RENDER_3D',
    };
    return style ? mapping[style] : 'AUTO';
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
    const filename = `ideogram_${randomUUID()}.png`;
    const filePath = path.join(outputDir, filename);

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(filePath, buffer);

    logger.debug('Image saved', { filePath, size: buffer.length });

    return filePath;
  }

  /**
   * Parse resolution string (e.g., "1024x1024") to width/height
   */
  private parseResolution(resolution: string): [number, number] {
    const match = resolution.match(/(\d+)x(\d+)/);
    if (match) {
      return [parseInt(match[1], 10), parseInt(match[2], 10)];
    }

    // Default resolution
    return [1024, 1024];
  }

  /**
   * Get default size for aspect ratio
   */
  static getSizeForAspectRatio(ratio: AspectRatio): ImageSize {
    const sizes: Record<AspectRatio, ImageSize> = {
      [AspectRatio.SQUARE]: { width: 1024, height: 1024 },
      [AspectRatio.PORTRAIT]: { width: 832, height: 1040 },
      [AspectRatio.LANDSCAPE]: { width: 1344, height: 768 },
      [AspectRatio.STORY]: { width: 768, height: 1344 },
    };
    return sizes[ratio];
  }
}

/**
 * Factory function to create IdeogramProvider
 */
export function createIdeogramProvider(config: IdeogramConfig): IdeogramProvider {
  return new IdeogramProvider(config);
}
