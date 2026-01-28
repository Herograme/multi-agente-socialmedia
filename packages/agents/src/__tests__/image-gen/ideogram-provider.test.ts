/**
 * Tests for IdeogramProvider
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import { IdeogramProvider, createIdeogramProvider } from '../../services/image-gen/providers/ideogram-provider';
import { ImageStyle, AspectRatio, ImageGenError, ImageGenErrorCode } from '../../services/image-gen/types';

// Mock fs module
vi.mock('fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  stat: vi.fn().mockResolvedValue({ size: 1024 }),
}));

describe('IdeogramProvider', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('constructor', () => {
    it('should create provider with default config', () => {
      const provider = new IdeogramProvider({ apiKey: 'test-key' });

      expect(provider.name).toBe('ideogram');
      expect(provider.rateLimits.requestsPerMinute).toBe(8);
      expect(provider.rateLimits.requestsPerDay).toBe(25);
    });

    it('should allow custom rate limits', () => {
      const provider = new IdeogramProvider({
        apiKey: 'test-key',
        rateLimits: {
          requestsPerMinute: 20,
          requestsPerDay: 100,
        },
      });

      expect(provider.rateLimits.requestsPerMinute).toBe(20);
      expect(provider.rateLimits.requestsPerDay).toBe(100);
    });

    it('should allow custom base URL', () => {
      const provider = new IdeogramProvider({
        apiKey: 'test-key',
        baseUrl: 'https://custom.api.com/generate',
      });

      expect(provider.name).toBe('ideogram');
    });
  });

  describe('generate', () => {
    it('should generate image successfully', async () => {
      const mockResponse = {
        data: [
          {
            url: 'https://example.com/image.png',
            prompt: 'test prompt',
            resolution: '1024x1024',
            is_image_safe: true,
          },
        ],
      };

      (globalThis.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(100),
        });

      const provider = new IdeogramProvider({ apiKey: 'test-key' });
      const result = await provider.generate({
        prompt: 'test prompt',
        style: ImageStyle.TECH,
        aspectRatio: AspectRatio.SQUARE,
        outputPath: '/tmp/test',
      });

      expect(result.provider).toBe('ideogram');
      expect(result.prompt).toBe('test prompt');
      expect(result.url).toBe('https://example.com/image.png');
      expect(result.format).toBe('png');
    });

    it('should include correct headers in API request', async () => {
      const mockResponse = {
        data: [
          {
            url: 'https://example.com/image.png',
            prompt: 'test',
            resolution: '1024x1024',
            is_image_safe: true,
          },
        ],
      };

      (globalThis.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(100),
        });

      const provider = new IdeogramProvider({ apiKey: 'my-api-key' });
      await provider.generate({ prompt: 'test' });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Api-Key': 'my-api-key',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should map aspect ratios correctly', async () => {
      const mockResponse = {
        data: [
          {
            url: 'https://example.com/image.png',
            prompt: 'test',
            resolution: '1344x768',
            is_image_safe: true,
          },
        ],
      };

      (globalThis.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(100),
        });

      const provider = new IdeogramProvider({ apiKey: 'test-key' });
      await provider.generate({
        prompt: 'test',
        aspectRatio: AspectRatio.LANDSCAPE,
      });

      const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.image_request.aspect_ratio).toBe('ASPECT_16_9');
    });

    it('should enhance prompt with style', async () => {
      const mockResponse = {
        data: [
          {
            url: 'https://example.com/image.png',
            prompt: 'test',
            resolution: '1024x1024',
            is_image_safe: true,
          },
        ],
      };

      (globalThis.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(100),
        });

      const provider = new IdeogramProvider({ apiKey: 'test-key' });
      await provider.generate({
        prompt: 'a beautiful sunset',
        style: ImageStyle.NEON,
      });

      const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.image_request.prompt).toContain('neon lights');
      expect(body.image_request.prompt).toContain('a beautiful sunset');
    });

    it('should handle API error response', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad request',
      });

      const provider = new IdeogramProvider({ apiKey: 'test-key' });

      await expect(provider.generate({ prompt: 'test' })).rejects.toThrow(ImageGenError);
    });

    it('should handle rate limit error', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Rate limited',
      });

      const provider = new IdeogramProvider({ apiKey: 'test-key' });

      try {
        await provider.generate({ prompt: 'test' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ImageGenError);
        expect((error as ImageGenError).code).toBe(ImageGenErrorCode.RATE_LIMITED);
        expect((error as ImageGenError).retriable).toBe(true);
      }
    });

    it('should handle authentication error', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const provider = new IdeogramProvider({ apiKey: 'test-key' });

      try {
        await provider.generate({ prompt: 'test' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ImageGenError);
        expect((error as ImageGenError).code).toBe(ImageGenErrorCode.AUTH_FAILED);
        expect((error as ImageGenError).retriable).toBe(false);
      }
    });

    it('should handle empty response', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const provider = new IdeogramProvider({ apiKey: 'test-key' });

      try {
        await provider.generate({ prompt: 'test' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ImageGenError);
        expect((error as ImageGenError).code).toBe(ImageGenErrorCode.NO_IMAGE);
      }
    });

    it('should handle download failure', async () => {
      const mockResponse = {
        data: [
          {
            url: 'https://example.com/image.png',
            prompt: 'test',
            resolution: '1024x1024',
            is_image_safe: true,
          },
        ],
      };

      (globalThis.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

      const provider = new IdeogramProvider({ apiKey: 'test-key' });

      try {
        await provider.generate({ prompt: 'test' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ImageGenError);
        expect((error as ImageGenError).code).toBe(ImageGenErrorCode.DOWNLOAD_FAILED);
      }
    });

    it('should create output directory if needed', async () => {
      const mockResponse = {
        data: [
          {
            url: 'https://example.com/image.png',
            prompt: 'test',
            resolution: '1024x1024',
            is_image_safe: true,
          },
        ],
      };

      (globalThis.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(100),
        });

      const provider = new IdeogramProvider({ apiKey: 'test-key' });
      await provider.generate({ prompt: 'test', outputPath: '/custom/output' });

      expect(fs.mkdir).toHaveBeenCalledWith('/custom/output', { recursive: true });
    });

    it('should parse resolution correctly', async () => {
      const mockResponse = {
        data: [
          {
            url: 'https://example.com/image.png',
            prompt: 'test',
            resolution: '1920x1080',
            is_image_safe: true,
          },
        ],
      };

      (globalThis.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(100),
        });

      const provider = new IdeogramProvider({ apiKey: 'test-key' });
      const result = await provider.generate({ prompt: 'test' });

      expect(result.size.width).toBe(1920);
      expect(result.size.height).toBe(1080);
    });

    it('should include metadata in result', async () => {
      const mockResponse = {
        data: [
          {
            url: 'https://example.com/image.png',
            prompt: 'test',
            resolution: '1024x1024',
            is_image_safe: true,
          },
        ],
      };

      (globalThis.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(100),
        });

      const provider = new IdeogramProvider({ apiKey: 'test-key' });
      const result = await provider.generate({
        prompt: 'test',
        metadata: { postId: 'post-123' },
      });

      expect(result.metadata).toEqual({ postId: 'post-123' });
    });
  });

  describe('isAvailable', () => {
    it('should return true with valid API key', async () => {
      const provider = new IdeogramProvider({ apiKey: 'test-key' });
      const available = await provider.isAvailable();
      expect(available).toBe(true);
    });

    it('should return false without API key', async () => {
      const provider = new IdeogramProvider({ apiKey: '' });
      const available = await provider.isAvailable();
      expect(available).toBe(false);
    });

    it('should return false after too many failures', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Server error',
      });

      const provider = new IdeogramProvider({ apiKey: 'test-key' });

      // Cause 5 failures
      for (let i = 0; i < 5; i++) {
        try {
          await provider.generate({ prompt: 'test' });
        } catch {
          // Expected
        }
      }

      const available = await provider.isAvailable();
      expect(available).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('should return current status', () => {
      const provider = new IdeogramProvider({ apiKey: 'test-key' });
      const status = provider.getStatus();

      expect(status.name).toBe('ideogram');
      expect(status.available).toBe(true);
      expect(status.failureCount).toBe(0);
    });

    it('should update status after failure', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Error',
      });

      const provider = new IdeogramProvider({ apiKey: 'test-key' });

      try {
        await provider.generate({ prompt: 'test' });
      } catch {
        // Expected
      }

      const status = provider.getStatus();
      expect(status.failureCount).toBe(1);
      expect(status.lastError).toContain('Error');
    });

    it('should reset failure count after success', async () => {
      const mockResponse = {
        data: [
          {
            url: 'https://example.com/image.png',
            prompt: 'test',
            resolution: '1024x1024',
            is_image_safe: true,
          },
        ],
      };

      // First fail
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Error',
      });

      const provider = new IdeogramProvider({ apiKey: 'test-key' });

      try {
        await provider.generate({ prompt: 'test' });
      } catch {
        // Expected
      }

      expect(provider.getStatus().failureCount).toBe(1);

      // Then succeed
      (globalThis.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(100),
        });

      await provider.generate({ prompt: 'test' });

      expect(provider.getStatus().failureCount).toBe(0);
      expect(provider.getStatus().lastUsed).toBeInstanceOf(Date);
    });
  });

  describe('factory function', () => {
    it('should create provider instance', () => {
      const provider = createIdeogramProvider({ apiKey: 'test-key' });

      expect(provider).toBeInstanceOf(IdeogramProvider);
      expect(provider.name).toBe('ideogram');
    });
  });

  describe('getSizeForAspectRatio', () => {
    it('should return correct size for SQUARE', () => {
      const size = IdeogramProvider.getSizeForAspectRatio(AspectRatio.SQUARE);
      expect(size.width).toBe(1024);
      expect(size.height).toBe(1024);
    });

    it('should return correct size for LANDSCAPE', () => {
      const size = IdeogramProvider.getSizeForAspectRatio(AspectRatio.LANDSCAPE);
      expect(size.width).toBe(1344);
      expect(size.height).toBe(768);
    });

    it('should return correct size for PORTRAIT', () => {
      const size = IdeogramProvider.getSizeForAspectRatio(AspectRatio.PORTRAIT);
      expect(size.width).toBe(832);
      expect(size.height).toBe(1040);
    });

    it('should return correct size for STORY', () => {
      const size = IdeogramProvider.getSizeForAspectRatio(AspectRatio.STORY);
      expect(size.width).toBe(768);
      expect(size.height).toBe(1344);
    });
  });
});
