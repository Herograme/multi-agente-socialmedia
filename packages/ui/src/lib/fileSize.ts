// File size formatting utility
// packages/ui/src/lib/fileSize.ts

/**
 * Formats a byte value into a human-readable string (B, KB, MB, GB)
 * @param bytes - The number of bytes to format
 * @returns Formatted string with appropriate unit
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const unitIndex = Math.min(i, units.length - 1);

  return `${parseFloat((bytes / Math.pow(k, unitIndex)).toFixed(1))} ${units[unitIndex]}`;
}

// Cache for file sizes to avoid repeated HEAD requests
const sizeCache = new Map<string, number>();

/**
 * Fetches the size of a file via HEAD request with caching
 * @param url - The URL of the file to get size for
 * @returns The size in bytes, or 0 if unable to determine
 */
export async function getFileSize(url: string): Promise<number> {
  if (sizeCache.has(url)) {
    return sizeCache.get(url)!;
  }

  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    const size = contentLength ? parseInt(contentLength, 10) : 0;
    sizeCache.set(url, size);
    return size;
  } catch {
    return 0;
  }
}

/**
 * Clears the file size cache
 */
export function clearFileSizeCache(): void {
  sizeCache.clear();
}

/**
 * Gets a cached file size without making a request
 * @param url - The URL to check in cache
 * @returns The cached size or undefined if not cached
 */
export function getCachedFileSize(url: string): number | undefined {
  return sizeCache.get(url);
}
