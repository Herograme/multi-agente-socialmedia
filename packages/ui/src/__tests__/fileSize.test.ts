import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatFileSize,
  getFileSize,
  clearFileSizeCache,
  getCachedFileSize,
} from '../lib/fileSize';

describe('fileSize utilities', () => {
  describe('formatFileSize', () => {
    it('should return "0 B" for zero bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('should format bytes correctly', () => {
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(999)).toBe('999 B');
    });

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(2048)).toBe('2 KB');
      expect(formatFileSize(102400)).toBe('100 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1572864)).toBe('1.5 MB');
      expect(formatFileSize(10485760)).toBe('10 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB');
      expect(formatFileSize(1610612736)).toBe('1.5 GB');
    });

    it('should handle very large numbers', () => {
      // Values larger than GB should still use GB
      expect(formatFileSize(10737418240)).toBe('10 GB');
    });

    it('should round to one decimal place', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1127)).toBe('1.1 KB');
      expect(formatFileSize(1024 + 100)).toBe('1.1 KB');
    });
  });

  describe('getFileSize', () => {
    beforeEach(() => {
      clearFileSizeCache();
      vi.restoreAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should fetch file size via HEAD request', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        headers: {
          get: (name: string) => (name === 'content-length' ? '1024' : null),
        },
      });
      global.fetch = mockFetch;

      const size = await getFileSize('https://example.com/file.png');

      expect(size).toBe(1024);
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/file.png', {
        method: 'HEAD',
      });
    });

    it('should return 0 when content-length header is missing', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        headers: {
          get: () => null,
        },
      });
      global.fetch = mockFetch;

      const size = await getFileSize('https://example.com/file.png');

      expect(size).toBe(0);
    });

    it('should return 0 when fetch fails', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      const size = await getFileSize('https://example.com/file.png');

      expect(size).toBe(0);
    });

    it('should cache file sizes', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        headers: {
          get: () => '2048',
        },
      });
      global.fetch = mockFetch;

      // First call
      await getFileSize('https://example.com/cached.png');
      // Second call - should use cache
      const size = await getFileSize('https://example.com/cached.png');

      expect(size).toBe(2048);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only one fetch call
    });
  });

  describe('clearFileSizeCache', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('should clear the cache', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        headers: {
          get: () => '1024',
        },
      });
      global.fetch = mockFetch;

      // Populate cache
      await getFileSize('https://example.com/file.png');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Clear cache
      clearFileSizeCache();

      // Should make a new request
      await getFileSize('https://example.com/file.png');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCachedFileSize', () => {
    beforeEach(() => {
      clearFileSizeCache();
      vi.restoreAllMocks();
    });

    it('should return undefined for uncached URLs', () => {
      expect(getCachedFileSize('https://example.com/unknown.png')).toBeUndefined();
    });

    it('should return cached size for previously fetched URLs', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        headers: {
          get: () => '4096',
        },
      });
      global.fetch = mockFetch;

      await getFileSize('https://example.com/known.png');

      expect(getCachedFileSize('https://example.com/known.png')).toBe(4096);
    });
  });
});
