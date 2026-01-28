/**
 * Tests for LeonardoProvider
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import { LeonardoProvider, createLeonardoProvider } from '../../services/image-gen/providers/leonardo-provider';
import { ImageStyle, AspectRatio, ImageGenError, ImageGenErrorCode } from '../../services/image-gen/types';

// Mock fs module
vi.mock('fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  stat: vi.fn().mockResolvedValue({ size: 2048 }),
}));

describe('LeonardoProvider', () => {
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
      const provider = new LeonardoProvider({ apiKey: 'test-key' });

      expect(provider.name).toBe('leonardo');
      expect(provider.rateLimits.requestsPerMinute).toBe(10);
      expect(provider.rateLimits.requestsPerDay).toBe(150);
    });

    it('should allow custom rate limits', () => {
      const provider = new LeonardoProvider({
        apiKey: 'test-key',
        rateLimits: {
          requestsPerMinute: 30,
          requestsPerDay: 500,
        },
      });

      expect(provider.rateLimits.requestsPerMinute).toBe(30);
      expect(provider.rateLimits.requestsPerDay).toBe(500);
    });

    it('should allow custom model ID', () => {
      const provider = new LeonardoProvider({
        apiKey: 'test-key',
        modelId: 'custom-model-id',
      });

      expect(provider.name).toBe('leonardo');
    });

    it('should allow custom polling configuration', () => {
      const provider = new LeonardoProvider({
        apiKey: 'test-key',
        maxPollingAttempts: 60,
        pollingIntervalMs: 5000,
      });

      expect(provider.name).toBe('leonardo');
    });
  });

  describe('generate', () => {
    it('should generate image with polling', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>)
        // Create generation
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sdGenerationJob: { generationId: 'gen-123' },
          }),
        })
        // Status check - complete
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            generations_by_pk: {
              status: 'COMPLETE',
              generated_images: [{ url: 'https://example.com/leonardo.png', id: 'img-1' }],
            },
          }),
        })
        // Download
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(200),
        });

      const provider = new LeonardoProvider({ apiKey: 'test-key' });
      const result = await provider.generate({
        prompt: 'test prompt',
        style: ImageStyle.FUTURISTIC,
        outputPath: '/tmp/test',
      });

      expect(result.provider).toBe('leonardo');
      expect(result.id).toBe('gen-123');
      expect(result.prompt).toBe('test prompt');
    });

    it('should include correct headers in API request', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sdGenerationJob: { generationId: 'gen-123' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            generations_by_pk: {
              status: 'COMPLETE',
              generated_images: [{ url: 'https://example.com/image.png', id: 'img-1' }],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(100),
        });

      const provider = new LeonardoProvider({ apiKey: 'my-api-key' });
      await provider.generate({ prompt: 'test' });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/generations'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer my-api-key',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should poll multiple times for completion', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>)
        // Create generation
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sdGenerationJob: { generationId: 'gen-123' },
          }),
        })
        // First status check - pending
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            generations_by_pk: { status: 'PENDING' },
          }),
        })
        // Second status check - complete
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            generations_by_pk: {
              status: 'COMPLETE',
              generated_images: [{ url: 'https://example.com/image.png', id: 'img-1' }],
            },
          }),
        })
        // Download
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(100),
        });

      const provider = new LeonardoProvider({
        apiKey: 'test-key',
        pollingIntervalMs: 10, // Fast polling for tests
      });

      const result = await provider.generate({ prompt: 'test' });

      expect(result.provider).toBe('leonardo');
      // Should have been called 4 times: create, status x2, download
      expect(globalThis.fetch).toHaveBeenCalledTimes(4);
    });

    it('should map aspect ratio to correct dimensions', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sdGenerationJob: { generationId: 'gen-123' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            generations_by_pk: {
              status: 'COMPLETE',
              generated_images: [{ url: 'https://example.com/image.png', id: 'img-1' }],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(100),
        });

      const provider = new LeonardoProvider({ apiKey: 'test-key' });
      await provider.generate({
        prompt: 'test',
        aspectRatio: AspectRatio.LANDSCAPE,
      });

      const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.width).toBe(1344);
      expect(body.height).toBe(768);
    });

    it('should handle generation failure status', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sdGenerationJob: { generationId: 'gen-123' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            generations_by_pk: { status: 'FAILED' },
          }),
        });

      const provider = new LeonardoProvider({
        apiKey: 'test-key',
        pollingIntervalMs: 10,
      });

      await expect(provider.generate({ prompt: 'test' })).rejects.toThrow(
        'Image generation failed'
      );
    });

    it('should handle timeout', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sdGenerationJob: { generationId: 'gen-123' },
          }),
        })
        // All status checks return PENDING
        .mockResolvedValue({
          ok: true,
          json: async () => ({
            generations_by_pk: { status: 'PENDING' },
          }),
        });

      const provider = new LeonardoProvider({
        apiKey: 'test-key',
        maxPollingAttempts: 3,
        pollingIntervalMs: 10,
      });

      try {
        await provider.generate({ prompt: 'test' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ImageGenError);
        expect((error as ImageGenError).code).toBe(ImageGenErrorCode.TIMEOUT);
      }
    });

    it('should handle API error on create', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad request',
      });

      const provider = new LeonardoProvider({ apiKey: 'test-key' });

      await expect(provider.generate({ prompt: 'test' })).rejects.toThrow(ImageGenError);
    });

    it('should handle rate limit error', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Too many requests',
      });

      const provider = new LeonardoProvider({ apiKey: 'test-key' });

      try {
        await provider.generate({ prompt: 'test' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ImageGenError);
        expect((error as ImageGenError).code).toBe(ImageGenErrorCode.RATE_LIMITED);
        expect((error as ImageGenError).retriable).toBe(true);
      }
    });

    it('should handle auth error', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const provider = new LeonardoProvider({ apiKey: 'test-key' });

      try {
        await provider.generate({ prompt: 'test' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ImageGenError);
        expect((error as ImageGenError).code).toBe(ImageGenErrorCode.AUTH_FAILED);
        expect((error as ImageGenError).retriable).toBe(false);
      }
    });

    it('should handle complete but no images', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sdGenerationJob: { generationId: 'gen-123' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            generations_by_pk: {
              status: 'COMPLETE',
              generated_images: [],
            },
          }),
        });

      const provider = new LeonardoProvider({
        apiKey: 'test-key',
        pollingIntervalMs: 10,
      });

      try {
        await provider.generate({ prompt: 'test' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ImageGenError);
        expect((error as ImageGenError).code).toBe(ImageGenErrorCode.NO_IMAGE);
      }
    });

    it('should handle download failure', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sdGenerationJob: { generationId: 'gen-123' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            generations_by_pk: {
              status: 'COMPLETE',
              generated_images: [{ url: 'https://example.com/image.png', id: 'img-1' }],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

      const provider = new LeonardoProvider({
        apiKey: 'test-key',
        pollingIntervalMs: 10,
      });

      try {
        await provider.generate({ prompt: 'test' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ImageGenError);
        expect((error as ImageGenError).code).toBe(ImageGenErrorCode.DOWNLOAD_FAILED);
      }
    });

    it('should enhance prompt with style', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sdGenerationJob: { generationId: 'gen-123' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            generations_by_pk: {
              status: 'COMPLETE',
              generated_images: [{ url: 'https://example.com/image.png', id: 'img-1' }],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(100),
        });

      const provider = new LeonardoProvider({ apiKey: 'test-key' });
      await provider.generate({
        prompt: 'a cityscape',
        style: ImageStyle.FUTURISTIC,
      });

      const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.prompt).toContain('sci-fi');
      expect(body.prompt).toContain('a cityscape');
    });

    it('should create output directory', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sdGenerationJob: { generationId: 'gen-123' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            generations_by_pk: {
              status: 'COMPLETE',
              generated_images: [{ url: 'https://example.com/image.png', id: 'img-1' }],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(100),
        });

      const provider = new LeonardoProvider({
        apiKey: 'test-key',
        pollingIntervalMs: 10,
      });
      await provider.generate({ prompt: 'test', outputPath: '/custom/output' });

      expect(fs.mkdir).toHaveBeenCalledWith('/custom/output', { recursive: true });
    });

    it('should include metadata in result', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sdGenerationJob: { generationId: 'gen-123' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            generations_by_pk: {
              status: 'COMPLETE',
              generated_images: [{ url: 'https://example.com/image.png', id: 'img-1' }],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(100),
        });

      const provider = new LeonardoProvider({
        apiKey: 'test-key',
        pollingIntervalMs: 10,
      });
      const result = await provider.generate({
        prompt: 'test',
        metadata: { topicId: 'topic-456' },
      });

      expect(result.metadata).toEqual({ topicId: 'topic-456' });
    });
  });

  describe('isAvailable', () => {
    it('should return true with valid API key', async () => {
      const provider = new LeonardoProvider({ apiKey: 'test-key' });
      const available = await provider.isAvailable();
      expect(available).toBe(true);
    });

    it('should return false without API key', async () => {
      const provider = new LeonardoProvider({ apiKey: '' });
      const available = await provider.isAvailable();
      expect(available).toBe(false);
    });

    it('should return false after too many failures', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Server error',
      });

      const provider = new LeonardoProvider({ apiKey: 'test-key' });

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
      const provider = new LeonardoProvider({ apiKey: 'test-key' });
      const status = provider.getStatus();

      expect(status.name).toBe('leonardo');
      expect(status.available).toBe(true);
      expect(status.failureCount).toBe(0);
    });

    it('should update status after failure', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Server Error',
      });

      const provider = new LeonardoProvider({ apiKey: 'test-key' });

      try {
        await provider.generate({ prompt: 'test' });
      } catch {
        // Expected
      }

      const status = provider.getStatus();
      expect(status.failureCount).toBe(1);
      expect(status.lastError).toContain('Server Error');
    });

    it('should reset failure count after success', async () => {
      // First fail
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Error',
      });

      const provider = new LeonardoProvider({
        apiKey: 'test-key',
        pollingIntervalMs: 10,
      });

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
          json: async () => ({
            sdGenerationJob: { generationId: 'gen-123' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            generations_by_pk: {
              status: 'COMPLETE',
              generated_images: [{ url: 'https://example.com/image.png', id: 'img-1' }],
            },
          }),
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
      const provider = createLeonardoProvider({ apiKey: 'test-key' });

      expect(provider).toBeInstanceOf(LeonardoProvider);
      expect(provider.name).toBe('leonardo');
    });
  });

  describe('getSizeForAspectRatio', () => {
    it('should return correct size for SQUARE', () => {
      const size = LeonardoProvider.getSizeForAspectRatio(AspectRatio.SQUARE);
      expect(size.width).toBe(1024);
      expect(size.height).toBe(1024);
    });

    it('should return correct size for LANDSCAPE', () => {
      const size = LeonardoProvider.getSizeForAspectRatio(AspectRatio.LANDSCAPE);
      expect(size.width).toBe(1344);
      expect(size.height).toBe(768);
    });

    it('should return correct size for PORTRAIT', () => {
      const size = LeonardoProvider.getSizeForAspectRatio(AspectRatio.PORTRAIT);
      expect(size.width).toBe(832);
      expect(size.height).toBe(1216);
    });

    it('should return correct size for STORY', () => {
      const size = LeonardoProvider.getSizeForAspectRatio(AspectRatio.STORY);
      expect(size.width).toBe(768);
      expect(size.height).toBe(1344);
    });
  });
});
