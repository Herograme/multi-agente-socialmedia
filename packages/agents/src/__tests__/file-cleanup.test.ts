/**
 * File Cleanup Service Tests
 * Story 3.7 - Integracao Pipeline Visual
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, access, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { createFileCleanupService } from '../services/cleanup/file-cleanup';

describe('FileCleanupService', () => {
  let testDir: string;
  let cleanup: ReturnType<typeof createFileCleanupService>;

  beforeEach(async () => {
    // Create a unique test directory
    testDir = join(tmpdir(), `cleanup-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    cleanup = createFileCleanupService();
  });

  afterEach(async () => {
    // Clean up the test directory
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore errors
    }
  });

  describe('trackFile', () => {
    it('should track a file for cleanup', () => {
      const filePath = join(testDir, 'test.txt');
      cleanup.trackFile(filePath);

      expect(cleanup.getTrackedCount()).toBe(1);
      expect(cleanup.isTracked(filePath)).toBe(true);
    });

    it('should track multiple files', () => {
      cleanup.trackFile(join(testDir, 'test1.txt'));
      cleanup.trackFile(join(testDir, 'test2.txt'));
      cleanup.trackFile(join(testDir, 'test3.txt'));

      expect(cleanup.getTrackedCount()).toBe(3);
    });

    it('should not duplicate tracked files', () => {
      const filePath = join(testDir, 'test.txt');
      cleanup.trackFile(filePath);
      cleanup.trackFile(filePath);

      expect(cleanup.getTrackedCount()).toBe(1);
    });
  });

  describe('trackFiles', () => {
    it('should track multiple files at once', () => {
      const files = [
        join(testDir, 'test1.txt'),
        join(testDir, 'test2.txt'),
        join(testDir, 'test3.txt'),
      ];
      cleanup.trackFiles(files);

      expect(cleanup.getTrackedCount()).toBe(3);
    });
  });

  describe('cleanupTrackedFiles', () => {
    it('should remove all tracked files', async () => {
      // Create test files
      const files = [
        join(testDir, 'test1.txt'),
        join(testDir, 'test2.txt'),
      ];

      for (const file of files) {
        await writeFile(file, 'test content');
        cleanup.trackFile(file);
      }

      // Verify files exist
      for (const file of files) {
        await expect(access(file)).resolves.toBeUndefined();
      }

      // Cleanup
      const result = await cleanup.cleanupTrackedFiles();

      expect(result.success).toHaveLength(2);
      expect(result.failed).toHaveLength(0);

      // Verify files are removed
      for (const file of files) {
        await expect(access(file)).rejects.toThrow();
      }
    });

    it('should handle non-existent files gracefully', async () => {
      const filePath = join(testDir, 'non-existent.txt');
      cleanup.trackFile(filePath);

      const result = await cleanup.cleanupTrackedFiles();

      // Non-existent files should be counted as success (ENOENT)
      expect(result.success).toHaveLength(1);
      expect(result.failed).toHaveLength(0);
    });

    it('should clear tracking after cleanup', async () => {
      cleanup.trackFile(join(testDir, 'test.txt'));
      await cleanup.cleanupTrackedFiles();

      expect(cleanup.getTrackedCount()).toBe(0);
    });
  });

  describe('cleanupFiles', () => {
    it('should cleanup specific files', async () => {
      const file1 = join(testDir, 'test1.txt');
      const file2 = join(testDir, 'test2.txt');
      const file3 = join(testDir, 'test3.txt');

      await writeFile(file1, 'test');
      await writeFile(file2, 'test');
      await writeFile(file3, 'test');

      // Track all files
      cleanup.trackFile(file1);
      cleanup.trackFile(file2);
      cleanup.trackFile(file3);

      // Only cleanup specific files
      const result = await cleanup.cleanupFiles([file1, file2]);

      expect(result.success).toHaveLength(2);
      expect(result.failed).toHaveLength(0);

      // file3 should still exist
      await expect(access(file3)).resolves.toBeUndefined();
      // file3 should still be tracked
      expect(cleanup.isTracked(file3)).toBe(true);
      // file1 and file2 should be untracked
      expect(cleanup.isTracked(file1)).toBe(false);
      expect(cleanup.isTracked(file2)).toBe(false);
    });
  });

  describe('commitFiles', () => {
    it('should clear tracking without deleting files', async () => {
      const filePath = join(testDir, 'committed.txt');
      await writeFile(filePath, 'test content');
      cleanup.trackFile(filePath);

      cleanup.commitFiles();

      expect(cleanup.getTrackedCount()).toBe(0);

      // File should still exist
      await expect(access(filePath)).resolves.toBeUndefined();
    });
  });

  describe('untrackFile', () => {
    it('should remove a file from tracking', () => {
      const filePath = join(testDir, 'test.txt');
      cleanup.trackFile(filePath);
      expect(cleanup.isTracked(filePath)).toBe(true);

      cleanup.untrackFile(filePath);
      expect(cleanup.isTracked(filePath)).toBe(false);
    });
  });

  describe('getTrackedFiles', () => {
    it('should return all tracked file paths', () => {
      const files = [
        join(testDir, 'test1.txt'),
        join(testDir, 'test2.txt'),
        join(testDir, 'test3.txt'),
      ];

      cleanup.trackFiles(files);
      const tracked = cleanup.getTrackedFiles();

      expect(tracked).toHaveLength(3);
      expect(tracked).toContain(files[0]);
      expect(tracked).toContain(files[1]);
      expect(tracked).toContain(files[2]);
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const filePath = join(testDir, 'exists.txt');
      await writeFile(filePath, 'test');

      const exists = await cleanup.fileExists(filePath);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const filePath = join(testDir, 'not-exists.txt');

      const exists = await cleanup.fileExists(filePath);
      expect(exists).toBe(false);
    });
  });

  describe('getFileDirectory', () => {
    it('should return parent directory of file path', () => {
      const filePath = '/path/to/file.txt';
      const dir = cleanup.getFileDirectory(filePath);
      expect(dir).toBe('/path/to');
    });
  });

  describe('trackDirectory', () => {
    it('should track directories for cleanup', async () => {
      const subDir = join(testDir, 'subdir');
      await mkdir(subDir);
      await writeFile(join(subDir, 'file.txt'), 'test');

      cleanup.trackDirectory(subDir);

      await cleanup.cleanupTrackedFiles();

      // Directory should be removed along with its contents
      await expect(access(subDir)).rejects.toThrow();
    });
  });
});
