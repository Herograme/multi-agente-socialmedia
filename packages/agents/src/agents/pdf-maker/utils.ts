/**
 * PDFMaker Utilities
 * File and directory utilities for PDF generation
 */

import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import type { SupportedImageFormat } from './types';

/**
 * Ensures that the output directory exists
 * @param postId - The post ID
 * @param baseDir - Base output directory
 * @returns The full path to the output directory
 */
export async function ensureOutputDirectory(
  postId: string,
  baseDir: string
): Promise<string> {
  const outputDir = path.join(baseDir, 'posts', postId);
  await fs.mkdir(outputDir, { recursive: true });
  return outputDir;
}

/**
 * Ensures that the output directory exists (synchronous version)
 * @param outputDir - Full path to the output directory
 */
export function ensureOutputDirectorySync(outputDir: string): void {
  if (!fsSync.existsSync(outputDir)) {
    fsSync.mkdirSync(outputDir, { recursive: true });
  }
}

/**
 * Returns the complete output path for a file
 * @param postId - The post ID
 * @param filename - The filename
 * @param baseDir - Base output directory
 * @returns Full path to the output file
 */
export function getOutputPath(
  postId: string,
  filename: string,
  baseDir: string
): string {
  return path.join(baseDir, 'posts', postId, filename);
}

/**
 * Returns the file size in bytes
 * @param filePath - Path to the file
 * @returns File size in bytes
 */
export async function getFileSize(filePath: string): Promise<number> {
  const stats = await fs.stat(filePath);
  return stats.size;
}

/**
 * Validates that all image paths exist and are accessible
 * @param imagePaths - Array of image paths to validate
 * @throws Error if any image is not accessible
 */
export async function validateImagePaths(imagePaths: string[]): Promise<void> {
  for (const imgPath of imagePaths) {
    try {
      await fs.access(imgPath, fsSync.constants.R_OK);
    } catch {
      throw new Error(`Image not accessible: ${imgPath}`);
    }
  }
}

/**
 * Formats a file size in bytes to a human-readable string
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 KB", "2.3 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Checks if a file has a supported image extension
 * @param filePath - Path to the file
 * @returns True if the file has a supported image extension
 */
export function isSupportedImageFormat(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase().slice(1);
  const supportedFormats: SupportedImageFormat[] = ['png', 'jpg', 'jpeg', 'webp'];
  return supportedFormats.includes(ext as SupportedImageFormat);
}

/**
 * Gets the image format from a file path
 * @param filePath - Path to the file
 * @returns The image format or undefined if not supported
 */
export function getImageFormat(filePath: string): SupportedImageFormat | undefined {
  const ext = path.extname(filePath).toLowerCase().slice(1);
  if (ext === 'jpeg') return 'jpg';
  const supportedFormats: SupportedImageFormat[] = ['png', 'jpg', 'webp'];
  if (supportedFormats.includes(ext as SupportedImageFormat)) {
    return ext as SupportedImageFormat;
  }
  return undefined;
}

/**
 * Resolves a path to an absolute path
 * @param inputPath - Input path (may be relative)
 * @returns Absolute path
 */
export function resolveAbsolutePath(inputPath: string): string {
  return path.resolve(inputPath);
}

/**
 * Checks if a file exists
 * @param filePath - Path to the file
 * @returns True if the file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
