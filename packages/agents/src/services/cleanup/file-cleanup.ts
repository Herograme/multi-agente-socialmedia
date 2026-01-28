/**
 * File Cleanup Service
 * Story 3.7 - Integracao Pipeline Visual
 *
 * Manages tracking and cleanup of generated files during pipeline execution.
 * Provides rollback capability in case of errors.
 */

import { unlink, access, rm } from 'fs/promises';
import { constants } from 'fs';
import { dirname } from 'path';
import { createLogger } from '@social-content/shared';
import type { CleanupResult } from '../../orchestrator/pipelines/visual-pipeline.types';

const logger = createLogger('service:file-cleanup');

/**
 * Service for managing and cleaning up generated files
 * Provides atomic rollback capability for pipeline operations
 */
export class FileCleanupService {
  /** Set of tracked file paths */
  private trackedFiles: Set<string> = new Set();

  /** Set of tracked directory paths */
  private trackedDirectories: Set<string> = new Set();

  /**
   * Track a generated file for potential cleanup
   * @param filePath - Absolute path to the file
   */
  trackFile(filePath: string): void {
    this.trackedFiles.add(filePath);
    logger.debug('Tracked file for cleanup', { filePath });
  }

  /**
   * Track multiple files at once
   * @param filePaths - Array of absolute file paths
   */
  trackFiles(filePaths: string[]): void {
    for (const filePath of filePaths) {
      this.trackFile(filePath);
    }
  }

  /**
   * Track a directory for potential cleanup
   * @param dirPath - Absolute path to the directory
   */
  trackDirectory(dirPath: string): void {
    this.trackedDirectories.add(dirPath);
    logger.debug('Tracked directory for cleanup', { dirPath });
  }

  /**
   * Get the count of currently tracked files
   */
  getTrackedCount(): number {
    return this.trackedFiles.size;
  }

  /**
   * Get all tracked file paths
   */
  getTrackedFiles(): string[] {
    return Array.from(this.trackedFiles);
  }

  /**
   * Remove all tracked files (used on error)
   * @returns Result of the cleanup operation
   */
  async cleanupTrackedFiles(): Promise<CleanupResult> {
    const results: CleanupResult = {
      success: [],
      failed: [],
    };

    logger.info('Starting cleanup of tracked files', {
      fileCount: this.trackedFiles.size,
    });

    for (const filePath of this.trackedFiles) {
      try {
        // Check if file exists before attempting removal
        await access(filePath, constants.F_OK);
        await unlink(filePath);
        results.success.push(filePath);
        logger.debug('Cleaned up file', { filePath });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        // ENOENT means file doesn't exist - consider it already cleaned
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          logger.debug('File already removed', { filePath });
          results.success.push(filePath);
        } else {
          results.failed.push({
            path: filePath,
            error: errorMessage,
          });
          logger.warn('Failed to cleanup file', { filePath, error: errorMessage });
        }
      }
    }

    // Cleanup tracked directories (in reverse order of tracking)
    const directories = Array.from(this.trackedDirectories).reverse();
    for (const dirPath of directories) {
      try {
        await rm(dirPath, { recursive: true, force: true });
        logger.debug('Cleaned up directory', { dirPath });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.warn('Failed to cleanup directory', { dirPath, error: errorMessage });
      }
    }

    this.trackedFiles.clear();
    this.trackedDirectories.clear();

    logger.info('Cleanup completed', {
      successCount: results.success.length,
      failedCount: results.failed.length,
    });

    return results;
  }

  /**
   * Clean up specific files (for targeted cleanup)
   * @param filePaths - Array of file paths to clean up
   * @returns Result of the cleanup operation
   */
  async cleanupFiles(filePaths: string[]): Promise<CleanupResult> {
    const results: CleanupResult = {
      success: [],
      failed: [],
    };

    logger.info('Starting targeted cleanup', { fileCount: filePaths.length });

    for (const filePath of filePaths) {
      try {
        await access(filePath, constants.F_OK);
        await unlink(filePath);
        results.success.push(filePath);
        // Remove from tracked files if present
        this.trackedFiles.delete(filePath);
        logger.debug('Cleaned up file', { filePath });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          results.success.push(filePath);
          this.trackedFiles.delete(filePath);
        } else {
          results.failed.push({
            path: filePath,
            error: errorMessage,
          });
          logger.warn('Failed to cleanup file', { filePath, error: errorMessage });
        }
      }
    }

    logger.info('Targeted cleanup completed', {
      successCount: results.success.length,
      failedCount: results.failed.length,
    });

    return results;
  }

  /**
   * Confirm that tracked files should be kept
   * Clears the tracking to prevent cleanup
   */
  commitFiles(): void {
    const count = this.trackedFiles.size;
    this.trackedFiles.clear();
    this.trackedDirectories.clear();
    logger.info('Files committed, tracking cleared', { count });
  }

  /**
   * Remove a specific file from tracking
   * @param filePath - Path to remove from tracking
   */
  untrackFile(filePath: string): void {
    this.trackedFiles.delete(filePath);
    logger.debug('Untracked file', { filePath });
  }

  /**
   * Check if a file is currently tracked
   * @param filePath - Path to check
   */
  isTracked(filePath: string): boolean {
    return this.trackedFiles.has(filePath);
  }

  /**
   * Get directory for a file path
   * Useful for tracking output directories
   */
  getFileDirectory(filePath: string): string {
    return dirname(filePath);
  }

  /**
   * Verify a file exists
   * @param filePath - Path to check
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await access(filePath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
let instance: FileCleanupService | null = null;

/**
 * Get the file cleanup service singleton
 */
export function getFileCleanupService(): FileCleanupService {
  if (!instance) {
    instance = new FileCleanupService();
  }
  return instance;
}

/**
 * Create a new file cleanup service instance (for isolated usage)
 */
export function createFileCleanupService(): FileCleanupService {
  return new FileCleanupService();
}
