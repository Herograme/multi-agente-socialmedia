/**
 * Tests for ImageGenService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImageGenService } from '../../services/image-gen/image-gen-service';
import type {
  ImageProvider,
  ImageGenOptions,
  GeneratedImage,
  ImageGenConfig,
  ProviderStatus,
} from '../../services/image-gen/types';
import { ImageGenError, ImageStyle, AspectRatio } from '../../services/image-gen/types';

/**
 * Create a mock provider for testing
 */
function createMockProvider(
  name: string,
  shouldFail = false,
  errorRetriable = true
): ImageProvider {
  const status: ProviderStatus = {
    name,
    available: true,
    failureCount: 0,
  };

  return {
    name,
    rateLimits: { requestsPerMinute: 10, requestsPerDay: 100 },
    generate: vi.fn().mockImplementation(async (options: ImageGenOptions): Promise<GeneratedImage> => {
      if (shouldFail) {
        throw new ImageGenError('Mock failure', name, 'MOCK_ERROR', errorRetriable);
      }
      return {
        id: `test-id-${name}`,
        provider: name,
        prompt: options.prompt,
        localPath: `/test/path/${name}.png`,
        url: `https://example.com/${name}.png`,
        size: { width: 1024, height: 1024 },
        format: 'png' as const,
        fileSize: 1024,
        generatedAt: new Date(),
        metadata: options.metadata,
      };
    }),
    isAvailable: vi.fn().mockResolvedValue(true),
    getStatus: vi.fn().mockReturnValue(status),
  };
}

const defaultConfig: ImageGenConfig = {
  providers: [
    { name: 'ideogram', apiKey: 'test-key-1', enabled: true, priority: 1 },
    { name: 'leonardo', apiKey: 'test-key-2', enabled: true, priority: 2 },
  ],
  defaultStyle: ImageStyle.TECH,
  defaultAspectRatio: AspectRatio.SQUARE,
  defaultOutputDir: './output',
  maxRetries: 2,
  circuitBreakerThreshold: 3,
  circuitBreakerResetMs: 1000,
};

describe('ImageGenService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with providers sorted by priority', () => {
      const provider1 = createMockProvider('provider1');
      const provider2 = createMockProvider('provider2');
      const config: ImageGenConfig = {
        ...defaultConfig,
        providers: [
          { name: 'provider1' as 'ideogram', apiKey: 'key', enabled: true, priority: 2 },
          { name: 'provider2' as 'ideogram', apiKey: 'key', enabled: true, priority: 1 },
        ],
      };

      const service = new ImageGenService([provider1, provider2], config);
      const names = service.getProviderNames();

      // provider2 should be first due to lower priority number
      expect(names).toEqual(['provider2', 'provider1']);
    });

    it('should initialize circuit breakers for each provider', () => {
      const provider = createMockProvider('ideogram');
      const service = new ImageGenService([provider], defaultConfig);

      expect(service.hasProvider('ideogram')).toBe(true);
    });

    it('should initialize metrics for each provider', () => {
      const provider = createMockProvider('ideogram');
      const service = new ImageGenService([provider], defaultConfig);

      const metrics = service.getProviderMetrics('ideogram');
      expect(metrics).toEqual({
        requests: 0,
        successes: 0,
        failures: 0,
      });
    });
  });

  describe('generate', () => {
    it('should generate image using first available provider', async () => {
      const provider = createMockProvider('ideogram');
      const service = new ImageGenService([provider], defaultConfig);

      const result = await service.generate({ prompt: 'test prompt' });

      expect(result.provider).toBe('ideogram');
      expect(result.prompt).toBe('test prompt');
      expect(provider.generate).toHaveBeenCalledOnce();
    });

    it('should apply default style and aspect ratio', async () => {
      const provider = createMockProvider('ideogram');
      const service = new ImageGenService([provider], defaultConfig);

      await service.generate({ prompt: 'test' });

      expect(provider.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          style: ImageStyle.TECH,
          aspectRatio: AspectRatio.SQUARE,
        })
      );
    });

    it('should use provided style and aspect ratio', async () => {
      const provider = createMockProvider('ideogram');
      const service = new ImageGenService([provider], defaultConfig);

      await service.generate({
        prompt: 'test',
        style: ImageStyle.NEON,
        aspectRatio: AspectRatio.LANDSCAPE,
      });

      expect(provider.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          style: ImageStyle.NEON,
          aspectRatio: AspectRatio.LANDSCAPE,
        })
      );
    });

    it('should fallback to next provider on failure', async () => {
      const failingProvider = createMockProvider('ideogram', true);
      const workingProvider = createMockProvider('leonardo');
      const service = new ImageGenService([failingProvider, workingProvider], defaultConfig);

      const result = await service.generate({ prompt: 'test prompt' });

      expect(result.provider).toBe('leonardo');
      expect(failingProvider.generate).toHaveBeenCalled();
      expect(workingProvider.generate).toHaveBeenCalled();
    });

    it('should throw when all providers fail', async () => {
      const failingProvider1 = createMockProvider('ideogram', true);
      const failingProvider2 = createMockProvider('leonardo', true);
      const service = new ImageGenService([failingProvider1, failingProvider2], defaultConfig);

      await expect(service.generate({ prompt: 'test' })).rejects.toThrow(
        'All image providers failed'
      );
    });

    it('should skip unavailable providers', async () => {
      const unavailableProvider = createMockProvider('ideogram');
      (unavailableProvider.isAvailable as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      const availableProvider = createMockProvider('leonardo');

      const service = new ImageGenService(
        [unavailableProvider, availableProvider],
        defaultConfig
      );

      const result = await service.generate({ prompt: 'test' });

      expect(result.provider).toBe('leonardo');
      expect(unavailableProvider.generate).not.toHaveBeenCalled();
    });

    it('should include metadata in result', async () => {
      const provider = createMockProvider('ideogram');
      const service = new ImageGenService([provider], defaultConfig);

      const result = await service.generate({
        prompt: 'test',
        metadata: { postId: 'post-123', topicId: 'topic-456' },
      });

      expect(result.metadata).toEqual({ postId: 'post-123', topicId: 'topic-456' });
    });

    it('should propagate non-retriable errors immediately', async () => {
      const provider = createMockProvider('ideogram', true, false);
      const backupProvider = createMockProvider('leonardo');
      const service = new ImageGenService([provider, backupProvider], defaultConfig);

      await expect(service.generate({ prompt: 'test' })).rejects.toThrow('Mock failure');
      expect(backupProvider.generate).not.toHaveBeenCalled();
    });
  });

  describe('circuit breaker', () => {
    it('should skip provider with open circuit', async () => {
      const failingProvider = createMockProvider('ideogram', true);
      const workingProvider = createMockProvider('leonardo');
      const config = { ...defaultConfig, circuitBreakerThreshold: 1, maxRetries: 1 };
      const service = new ImageGenService([failingProvider, workingProvider], config);

      // First call opens circuit breaker
      await service.generate({ prompt: 'test 1' });

      // Reset the call count to track second call
      (failingProvider.generate as ReturnType<typeof vi.fn>).mockClear();

      // Second call should skip ideogram
      const result = await service.generate({ prompt: 'test 2' });

      expect(result.provider).toBe('leonardo');
      expect(failingProvider.generate).not.toHaveBeenCalled();
    });

    it('should emit circuit:open event when threshold reached', async () => {
      const failingProvider = createMockProvider('ideogram', true);
      const workingProvider = createMockProvider('leonardo');
      const config = { ...defaultConfig, circuitBreakerThreshold: 1, maxRetries: 1 };
      const service = new ImageGenService([failingProvider, workingProvider], config);

      const circuitOpenHandler = vi.fn();
      service.on('circuit:open', circuitOpenHandler);

      await service.generate({ prompt: 'test' });

      expect(circuitOpenHandler).toHaveBeenCalledWith({
        provider: 'ideogram',
        failures: 1,
      });
    });

    it('should reset circuit breaker after successful request', async () => {
      let shouldFail = true;
      const provider = createMockProvider('ideogram');
      (provider.generate as ReturnType<typeof vi.fn>).mockImplementation(async (options: ImageGenOptions) => {
        if (shouldFail) {
          throw new ImageGenError('Temporary failure', 'ideogram', 'TEMP', true);
        }
        return {
          id: 'test-id',
          provider: 'ideogram',
          prompt: options.prompt,
          localPath: '/test/path.png',
          size: { width: 1024, height: 1024 },
          format: 'png' as const,
          fileSize: 1024,
          generatedAt: new Date(),
        };
      });

      const config = { ...defaultConfig, circuitBreakerThreshold: 2, maxRetries: 1 };
      const service = new ImageGenService([provider], config);

      // First failure
      await expect(service.generate({ prompt: 'test' })).rejects.toThrow();

      // Now make it succeed
      shouldFail = false;
      const result = await service.generate({ prompt: 'test 2' });

      expect(result.provider).toBe('ideogram');
    });
  });

  describe('retry', () => {
    it('should retry on temporary failure', async () => {
      let callCount = 0;
      const provider = createMockProvider('ideogram');
      (provider.generate as ReturnType<typeof vi.fn>).mockImplementation(async (options: ImageGenOptions) => {
        callCount++;
        if (callCount < 2) {
          throw new ImageGenError('Temporary error', 'ideogram', 'TEMP', true);
        }
        return {
          id: 'test-id',
          provider: 'ideogram',
          prompt: options.prompt,
          localPath: '/test/path.png',
          size: { width: 1024, height: 1024 },
          format: 'png' as const,
          fileSize: 1024,
          generatedAt: new Date(),
        };
      });

      const service = new ImageGenService([provider], defaultConfig);
      const result = await service.generate({ prompt: 'test' });

      expect(result.provider).toBe('ideogram');
      expect(callCount).toBe(2);
    });

    it('should not retry non-retriable errors', async () => {
      let callCount = 0;
      const provider = createMockProvider('ideogram');
      (provider.generate as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        callCount++;
        throw new ImageGenError('Non-retriable error', 'ideogram', 'FATAL', false);
      });

      const backupProvider = createMockProvider('leonardo');
      const service = new ImageGenService([provider, backupProvider], defaultConfig);

      await expect(service.generate({ prompt: 'test' })).rejects.toThrow('Non-retriable error');
      expect(callCount).toBe(1);
      expect(backupProvider.generate).not.toHaveBeenCalled();
    });

    it('should respect maxRetries configuration', async () => {
      let callCount = 0;
      const provider = createMockProvider('ideogram');
      (provider.generate as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        callCount++;
        throw new ImageGenError('Always fails', 'ideogram', 'TEMP', true);
      });

      // Use maxRetries: 1 and shorter circuit breaker threshold to avoid timeout
      const config = { ...defaultConfig, maxRetries: 1, circuitBreakerThreshold: 2 };
      const backupProvider = createMockProvider('leonardo');
      const service = new ImageGenService([provider, backupProvider], config);

      await service.generate({ prompt: 'test' });

      expect(callCount).toBe(1); // Should retry exactly maxRetries times before falling back
    }, 10000);
  });

  describe('metrics', () => {
    it('should track request count', async () => {
      const provider = createMockProvider('ideogram');
      const service = new ImageGenService([provider], defaultConfig);

      await service.generate({ prompt: 'test' });
      await service.generate({ prompt: 'test 2' });

      const metrics = service.getMetrics().get('ideogram');
      expect(metrics?.requests).toBe(2);
    });

    it('should track success count', async () => {
      const provider = createMockProvider('ideogram');
      const service = new ImageGenService([provider], defaultConfig);

      await service.generate({ prompt: 'test' });
      await service.generate({ prompt: 'test 2' });

      const metrics = service.getMetrics().get('ideogram');
      expect(metrics?.successes).toBe(2);
    });

    it('should track failure count', async () => {
      const failingProvider = createMockProvider('ideogram', true);
      const workingProvider = createMockProvider('leonardo');
      const service = new ImageGenService([failingProvider, workingProvider], defaultConfig);

      await service.generate({ prompt: 'test' });

      const ideogramMetrics = service.getMetrics().get('ideogram');
      const leonardoMetrics = service.getMetrics().get('leonardo');

      expect(ideogramMetrics?.failures).toBe(1);
      expect(leonardoMetrics?.successes).toBe(1);
    });
  });

  describe('events', () => {
    it('should emit provider:start event', async () => {
      const provider = createMockProvider('ideogram');
      const service = new ImageGenService([provider], defaultConfig);

      const startHandler = vi.fn();
      service.on('provider:start', startHandler);

      await service.generate({ prompt: 'test' });

      expect(startHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'ideogram',
          options: expect.objectContaining({ prompt: 'test' }),
        })
      );
    });

    it('should emit provider:success event', async () => {
      const provider = createMockProvider('ideogram');
      const service = new ImageGenService([provider], defaultConfig);

      const successHandler = vi.fn();
      service.on('provider:success', successHandler);

      await service.generate({ prompt: 'test' });

      expect(successHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'ideogram',
          result: expect.objectContaining({ provider: 'ideogram' }),
        })
      );
    });

    it('should emit provider:error event on failure', async () => {
      const failingProvider = createMockProvider('ideogram', true);
      const workingProvider = createMockProvider('leonardo');
      const service = new ImageGenService([failingProvider, workingProvider], defaultConfig);

      const errorHandler = vi.fn();
      service.on('provider:error', errorHandler);

      await service.generate({ prompt: 'test' });

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'ideogram',
          error: expect.any(ImageGenError),
        })
      );
    });

    it('should emit provider:skipped event', async () => {
      const unavailableProvider = createMockProvider('ideogram');
      (unavailableProvider.isAvailable as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      const availableProvider = createMockProvider('leonardo');

      const service = new ImageGenService(
        [unavailableProvider, availableProvider],
        defaultConfig
      );

      const skippedHandler = vi.fn();
      service.on('provider:skipped', skippedHandler);

      await service.generate({ prompt: 'test' });

      expect(skippedHandler).toHaveBeenCalledWith({
        provider: 'ideogram',
        reason: 'unavailable',
      });
    });
  });

  describe('getProvidersStatus', () => {
    it('should return status for all providers', () => {
      const provider1 = createMockProvider('ideogram');
      const provider2 = createMockProvider('leonardo');
      const service = new ImageGenService([provider1, provider2], defaultConfig);

      const statuses = service.getProvidersStatus();

      expect(statuses).toHaveLength(2);
      expect(statuses.map((s) => s.name)).toContain('ideogram');
      expect(statuses.map((s) => s.name)).toContain('leonardo');
    });
  });

  describe('getProviderNames', () => {
    it('should return all provider names', () => {
      const provider1 = createMockProvider('ideogram');
      const provider2 = createMockProvider('leonardo');
      const service = new ImageGenService([provider1, provider2], defaultConfig);

      const names = service.getProviderNames();

      expect(names).toContain('ideogram');
      expect(names).toContain('leonardo');
    });
  });

  describe('hasProvider', () => {
    it('should return true for existing provider', () => {
      const provider = createMockProvider('ideogram');
      const service = new ImageGenService([provider], defaultConfig);

      expect(service.hasProvider('ideogram')).toBe(true);
    });

    it('should return false for non-existing provider', () => {
      const provider = createMockProvider('ideogram');
      const service = new ImageGenService([provider], defaultConfig);

      expect(service.hasProvider('nonexistent')).toBe(false);
    });
  });
});
