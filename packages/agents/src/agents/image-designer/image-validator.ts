/**
 * Image Validator for ImageDesigner
 * Validates image dimensions, format, and extracts metadata
 */

import * as fs from 'fs';
import * as path from 'path';
import { imageSize } from 'image-size';
import type { ImageMetadata, ImageValidationResult, ImageDesignerConfig } from './types';

/**
 * Supported image formats
 */
export type SupportedFormat = 'png' | 'jpg' | 'webp';

/**
 * Get metadata from an image file
 *
 * @param imagePath - Path to the image file
 * @param prompt - The prompt used to generate the image
 * @param provider - The provider that generated the image
 * @returns Image metadata
 */
export async function getImageMetadata(
  imagePath: string,
  prompt: string,
  provider: string
): Promise<ImageMetadata> {
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image file not found: ${imagePath}`);
  }

  const stats = fs.statSync(imagePath);
  const buffer = fs.readFileSync(imagePath);
  const dimensions = imageSize(new Uint8Array(buffer));

  // Normalize extension to our format type
  const ext = path.extname(imagePath).toLowerCase().slice(1);
  const format = normalizeFormat(ext);

  return {
    width: dimensions.width ?? 0,
    height: dimensions.height ?? 0,
    format,
    sizeBytes: stats.size,
    generatedAt: new Date(),
    prompt,
    provider,
  };
}

/**
 * Normalize image extension to supported format
 */
function normalizeFormat(ext: string): SupportedFormat {
  if (ext === 'jpeg') return 'jpg';
  if (['png', 'jpg', 'webp'].includes(ext)) return ext as SupportedFormat;
  // Default to png for unknown formats
  return 'png';
}

/**
 * Validate image dimensions against minimum requirements
 *
 * @param metadata - Image metadata to validate
 * @param minWidth - Minimum required width
 * @param minHeight - Minimum required height
 * @returns Validation result with optional error message
 */
export function validateImageDimensions(
  metadata: ImageMetadata,
  minWidth: number,
  minHeight: number
): { valid: boolean; error?: string } {
  if (metadata.width < minWidth) {
    return {
      valid: false,
      error: `Image width ${metadata.width}px is less than minimum ${minWidth}px`,
    };
  }

  if (metadata.height < minHeight) {
    return {
      valid: false,
      error: `Image height ${metadata.height}px is less than minimum ${minHeight}px`,
    };
  }

  return { valid: true };
}

/**
 * Validate image format against allowed formats
 *
 * @param metadata - Image metadata to validate
 * @param allowedFormats - List of allowed formats
 * @returns Validation result with optional error message
 */
export function validateImageFormat(
  metadata: ImageMetadata,
  allowedFormats: SupportedFormat[]
): { valid: boolean; error?: string } {
  if (!allowedFormats.includes(metadata.format)) {
    return {
      valid: false,
      error: `Image format '${metadata.format}' is not allowed. Allowed formats: ${allowedFormats.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validate image file size
 *
 * @param metadata - Image metadata to validate
 * @param maxSizeBytes - Maximum allowed file size in bytes
 * @returns Validation result with optional error message
 */
export function validateImageSize(
  metadata: ImageMetadata,
  maxSizeBytes: number
): { valid: boolean; error?: string } {
  if (metadata.sizeBytes > maxSizeBytes) {
    const sizeMB = (metadata.sizeBytes / (1024 * 1024)).toFixed(2);
    const maxMB = (maxSizeBytes / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `Image size ${sizeMB}MB exceeds maximum ${maxMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Perform complete validation of an image
 *
 * @param imagePath - Path to the image file
 * @param config - ImageDesigner configuration
 * @param prompt - The prompt used to generate the image
 * @param provider - The provider that generated the image
 * @returns Complete validation result with errors and metadata
 */
export async function validateImage(
  imagePath: string,
  config: ImageDesignerConfig,
  prompt: string,
  provider: string
): Promise<ImageValidationResult> {
  const errors: string[] = [];

  // Check if file exists
  if (!fs.existsSync(imagePath)) {
    return {
      valid: false,
      errors: [`Image file not found: ${imagePath}`],
    };
  }

  try {
    // Get metadata
    const metadata = await getImageMetadata(imagePath, prompt, provider);

    // Validate dimensions
    const dimensionResult = validateImageDimensions(
      metadata,
      config.minWidth,
      config.minHeight
    );
    if (!dimensionResult.valid && dimensionResult.error) {
      errors.push(dimensionResult.error);
    }

    // Validate format
    const formatResult = validateImageFormat(metadata, config.allowedFormats);
    if (!formatResult.valid && formatResult.error) {
      errors.push(formatResult.error);
    }

    return {
      valid: errors.length === 0,
      errors,
      metadata,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error reading image';
    return {
      valid: false,
      errors: [errorMessage],
    };
  }
}

/**
 * Check if a path is a valid image file (based on extension)
 *
 * @param filePath - Path to check
 * @returns True if the file has a valid image extension
 */
export function isImageFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase().slice(1);
  return ['png', 'jpg', 'jpeg', 'webp'].includes(ext);
}

/**
 * Get the expected output path for an image
 *
 * @param outputDir - Base output directory
 * @param postId - Post identifier
 * @param format - Image format
 * @returns Full path for the output image
 */
export function getOutputPath(
  outputDir: string,
  postId: string,
  format: SupportedFormat = 'png'
): string {
  return path.join(outputDir, postId, `background.${format}`);
}

/**
 * Ensure output directory exists
 *
 * @param outputDir - Directory to create
 */
export function ensureOutputDirectory(outputDir: string): void {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
}
