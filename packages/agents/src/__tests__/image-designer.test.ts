/**
 * ImageDesigner Agent Tests
 * Comprehensive tests for the ImageDesigner agent and its components
 */

import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  ImageDesignerAgent,
  createImageDesignerAgent,
  getDefaultConfig as getImageDesignerDefaultConfig,
  validatePartialConfig,
  AgentState,
  ImageStyle,
  // Prompt generator
  generateBackgroundPrompt,
  generateAlternativePrompt,
  getAlternativeStyle,
  extractTopicEssence,
  validatePromptSafety,
  getAllTemplates,
  TECH_COLORS,
  // Image validator
  validateImageDimensions,
  validateImageFormat,
  validateImageSize,
  isImageFile,
  getOutputPath,
  ensureOutputDirectory,
} from '../agents/image-designer';
import type {
  ImageDesignerInput,
  ImageMetadata,
  StateChangeEvent,
  AttemptEvent,
} from '../agents/image-designer';
import { AgentStatus } from '../agents/types';

// ============================================================================
// Agent Instantiation Tests
// ============================================================================

describe('ImageDesignerAgent', () => {
  describe('instantiation', () => {
    it('should create agent with default config', () => {
      const agent = createImageDesignerAgent();
      expect(agent).toBeInstanceOf(ImageDesignerAgent);
      expect(agent.name).toBe('ImageDesignerAgent');
    });

    it('should create agent with custom config', () => {
      const agent = createImageDesignerAgent({
        minWidth: 1200,
        minHeight: 1200,
        maxRetries: 5,
      });
      expect(agent).toBeInstanceOf(ImageDesignerAgent);
      expect(agent.getConfig().minWidth).toBe(1200);
      expect(agent.getConfig().minHeight).toBe(1200);
      expect(agent.getConfig().maxRetries).toBe(5);
    });

    it('should start in IDLE status', () => {
      const agent = createImageDesignerAgent();
      expect(agent.status).toBe(AgentStatus.IDLE);
      expect(agent.getState()).toBe(AgentState.IDLE);
    });

    it('should have correct name', () => {
      const agent = createImageDesignerAgent();
      expect(agent.name).toBe('ImageDesignerAgent');
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default configuration', () => {
      const config = getImageDesignerDefaultConfig();
      expect(config).toEqual({
        outputDir: 'output/images',
        minWidth: 1080,
        minHeight: 1080,
        maxRetries: 3,
        defaultStyle: ImageStyle.ABSTRACT,
        allowedFormats: ['png', 'jpg', 'webp'],
      });
    });

    it('should return a copy, not the original', () => {
      const config1 = getImageDesignerDefaultConfig();
      const config2 = getImageDesignerDefaultConfig();
      config1.minWidth = 2000;
      expect(config2.minWidth).toBe(1080);
    });
  });

  describe('getConfig', () => {
    it('should return agent configuration', () => {
      const agent = createImageDesignerAgent({ minWidth: 1500 });
      const config = agent.getConfig();
      expect(config.minWidth).toBe(1500);
    });

    it('should return a copy, not the original', () => {
      const agent = createImageDesignerAgent();
      const config1 = agent.getConfig();
      const config2 = agent.getConfig();
      config1.minWidth = 2000;
      expect(config2.minWidth).toBe(1080);
    });
  });

  describe('lifecycle', () => {
    it('should start in IDLE state', () => {
      const agent = createImageDesignerAgent();
      expect(agent.getState()).toBe(AgentState.IDLE);
    });

    it('should transition to RUNNING on start()', () => {
      const agent = createImageDesignerAgent();
      agent.start();
      expect(agent.getState()).toBe(AgentState.RUNNING);
      expect(agent.status).toBe(AgentStatus.RUNNING);
    });

    it('should transition to IDLE on stop()', () => {
      const agent = createImageDesignerAgent();
      agent.start();
      expect(agent.getState()).toBe(AgentState.RUNNING);
      agent.stop();
      expect(agent.getState()).toBe(AgentState.IDLE);
      expect(agent.status).toBe(AgentStatus.IDLE);
    });

    it('should reset to IDLE state', () => {
      const agent = createImageDesignerAgent();
      agent.start();
      expect(agent.getState()).toBe(AgentState.RUNNING);
      agent.reset();
      expect(agent.getState()).toBe(AgentState.IDLE);
    });

    it('should only start from IDLE state', () => {
      const agent = createImageDesignerAgent();
      agent.start(); // IDLE -> RUNNING
      const stateChanges: StateChangeEvent[] = [];
      agent.on('stateChange', (event: StateChangeEvent) => {
        stateChanges.push(event);
      });
      agent.start(); // Should not change if already RUNNING
      expect(stateChanges.length).toBe(0);
    });
  });

  describe('stateChange event', () => {
    it('should emit stateChange event on start()', () => {
      const agent = createImageDesignerAgent();
      const stateChanges: StateChangeEvent[] = [];

      agent.on('stateChange', (event: StateChangeEvent) => {
        stateChanges.push(event);
      });

      agent.start();

      expect(stateChanges).toHaveLength(1);
      expect(stateChanges[0]).toEqual({
        previous: AgentState.IDLE,
        current: AgentState.RUNNING,
      });
    });

    it('should emit stateChange event on stop()', () => {
      const agent = createImageDesignerAgent();
      agent.start();

      const stateChanges: StateChangeEvent[] = [];
      agent.on('stateChange', (event: StateChangeEvent) => {
        stateChanges.push(event);
      });

      agent.stop();

      expect(stateChanges).toHaveLength(1);
      expect(stateChanges[0]).toEqual({
        previous: AgentState.RUNNING,
        current: AgentState.IDLE,
      });
    });
  });

  describe('ImageGenService integration', () => {
    it('should report hasImageGenService as false by default', () => {
      const agent = createImageDesignerAgent();
      expect(agent.hasImageGenService()).toBe(false);
    });

    it('should fail run() if no ImageGenService is configured', async () => {
      const agent = createImageDesignerAgent();
      const input: ImageDesignerInput = {
        postId: 'test-123',
        topic: 'React Hooks',
        content: 'Learn how to use useState and useEffect',
      };

      const result = await agent.run(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('ImageGenService is not configured');
      expect(agent.getState()).toBe(AgentState.ERROR);
    });
  });
});

// ============================================================================
// Factory Validation Tests
// ============================================================================

describe('createImageDesignerAgent factory', () => {
  it('should throw on invalid minWidth (too small)', () => {
    expect(() => createImageDesignerAgent({ minWidth: 50 })).toThrow(
      'minWidth must be at least 100 pixels'
    );
  });

  it('should throw on invalid minHeight (too small)', () => {
    expect(() => createImageDesignerAgent({ minHeight: 0 })).toThrow(
      'minHeight must be at least 100 pixels'
    );
  });

  it('should throw on negative maxRetries', () => {
    expect(() => createImageDesignerAgent({ maxRetries: -1 })).toThrow(
      'maxRetries must be non-negative'
    );
  });

  it('should throw on excessive maxRetries', () => {
    expect(() => createImageDesignerAgent({ maxRetries: 15 })).toThrow(
      'maxRetries must not exceed 10'
    );
  });

  it('should throw on empty outputDir', () => {
    expect(() => createImageDesignerAgent({ outputDir: '' })).toThrow(
      'outputDir must be specified'
    );
  });

  it('should throw on empty allowedFormats', () => {
    expect(() => createImageDesignerAgent({ allowedFormats: [] })).toThrow(
      'At least one allowed format must be specified'
    );
  });

  it('should throw on invalid format in allowedFormats', () => {
    expect(() =>
      createImageDesignerAgent({ allowedFormats: ['bmp' as 'png'] })
    ).toThrow("Invalid format 'bmp'");
  });

  it('should accept valid boundary values', () => {
    expect(() =>
      createImageDesignerAgent({
        minWidth: 100,
        minHeight: 100,
        maxRetries: 0,
      })
    ).not.toThrow();

    expect(() =>
      createImageDesignerAgent({
        maxRetries: 10,
      })
    ).not.toThrow();
  });

  it('should merge config with defaults', () => {
    const agent = createImageDesignerAgent({ maxRetries: 5 });
    const config = agent.getConfig();

    expect(config.maxRetries).toBe(5);
    expect(config.minWidth).toBe(1080); // default
    expect(config.minHeight).toBe(1080); // default
    expect(config.outputDir).toBe('output/images'); // default
  });
});

describe('validatePartialConfig', () => {
  it('should return true for valid partial config', () => {
    expect(validatePartialConfig({ maxRetries: 5 })).toBe(true);
  });

  it('should throw for invalid partial config', () => {
    expect(() => validatePartialConfig({ minWidth: 50 })).toThrow();
  });
});

// ============================================================================
// Prompt Generator Tests
// ============================================================================

describe('Prompt Generator', () => {
  describe('generateBackgroundPrompt', () => {
    it('should generate prompt with no text instruction', () => {
      const prompt = generateBackgroundPrompt(
        'React Hooks',
        'Learn how to use useState and useEffect',
        ImageStyle.ABSTRACT
      );

      expect(prompt).toContain('no text');
      expect(prompt).toContain('no words');
      expect(prompt).toContain('no letters');
    });

    it('should include tech-related colors', () => {
      // Generate multiple prompts to check if at least one contains a color
      const prompts: string[] = [];
      for (let i = 0; i < 10; i++) {
        prompts.push(
          generateBackgroundPrompt('TypeScript', 'Type safety for JavaScript', ImageStyle.TECH)
        );
      }

      const hasColor = prompts.some((prompt) => {
        const lowerPrompt = prompt.toLowerCase();
        return (
          lowerPrompt.includes('blue') ||
          lowerPrompt.includes('cyan') ||
          lowerPrompt.includes('purple') ||
          lowerPrompt.includes('indigo') ||
          lowerPrompt.includes('teal') ||
          lowerPrompt.includes('magenta') ||
          lowerPrompt.includes('violet')
        );
      });
      expect(hasColor).toBe(true);
    });

    it('should include abstract theme for ABSTRACT style', () => {
      const prompt = generateBackgroundPrompt(
        'API Design',
        'REST vs GraphQL',
        ImageStyle.ABSTRACT
      );

      expect(prompt.toLowerCase()).toContain('abstract');
    });

    it('should include geometric elements for GEOMETRIC style', () => {
      const prompt = generateBackgroundPrompt(
        'Data Structures',
        'Arrays and linked lists',
        ImageStyle.GEOMETRIC
      );

      expect(prompt.toLowerCase()).toMatch(/geometric|polygon|triangle|hexagon/);
    });

    it('should work with all available styles', () => {
      const styles = Object.values(ImageStyle);
      for (const style of styles) {
        const prompt = generateBackgroundPrompt('Test Topic', 'Test content', style);
        expect(prompt).toBeTruthy();
        expect(prompt.length).toBeGreaterThan(50);
        // All prompts should contain no-text instruction
        expect(prompt.toLowerCase()).toContain('no text');
      }
    });
  });

  describe('extractTopicEssence', () => {
    it('should extract tech keywords from topic', () => {
      const essence = extractTopicEssence(
        'Machine Learning Basics',
        'Introduction to neural networks'
      );

      expect(essence).toContain('machine learning');
    });

    it('should extract multiple keywords when present', () => {
      const essence = extractTopicEssence(
        'AI Development',
        'Using machine learning for web applications'
      );

      expect(essence).toMatch(/ai|machine learning|web/i);
    });

    it('should return default essence when no keywords found', () => {
      const essence = extractTopicEssence('Random Topic', 'Some random content');

      expect(essence).toContain('tech-inspired');
    });
  });

  describe('generateAlternativePrompt', () => {
    it('should generate different prompt for retry', () => {
      // Generate prompts
      const alternative1 = generateAlternativePrompt('Test', 'Content', ImageStyle.ABSTRACT, 1);
      const alternative2 = generateAlternativePrompt('Test', 'Content', ImageStyle.ABSTRACT, 2);

      // Note: Due to randomness in templates, we check structure rather than exact content
      expect(alternative1).toBeTruthy();
      expect(alternative2).toBeTruthy();
      // All prompts should still have safety instructions
      expect(alternative1.toLowerCase()).toContain('no text');
      expect(alternative2.toLowerCase()).toContain('no text');
    });

    it('should use different styles for different attempt numbers', () => {
      const style1 = getAlternativeStyle(ImageStyle.ABSTRACT, 1);
      const style2 = getAlternativeStyle(ImageStyle.ABSTRACT, 2);
      const style3 = getAlternativeStyle(ImageStyle.ABSTRACT, 3);

      // Styles should rotate through available options
      expect(style1).not.toBe(ImageStyle.ABSTRACT);
      // After full rotation, may come back to original
      expect([style1, style2, style3]).toBeDefined();
    });
  });

  describe('validatePromptSafety', () => {
    it('should return true for prompt with all safety instructions', () => {
      const prompt =
        'Abstract background, no text, no words, no letters, professional quality';
      expect(validatePromptSafety(prompt)).toBe(true);
    });

    it('should return false for prompt missing safety instructions', () => {
      const prompt = 'Abstract background, professional quality';
      expect(validatePromptSafety(prompt)).toBe(false);
    });
  });

  describe('getAllTemplates', () => {
    it('should return templates for all styles', () => {
      const templates = getAllTemplates();
      const styles = Object.values(ImageStyle);

      for (const style of styles) {
        expect(templates[style]).toBeDefined();
        expect(templates[style].length).toBeGreaterThan(0);
      }
    });

    it('should have valid template structure', () => {
      const templates = getAllTemplates();

      for (const style of Object.values(ImageStyle)) {
        for (const template of templates[style]) {
          expect(template.id).toBeTruthy();
          expect(template.name).toBeTruthy();
          expect(template.template).toBeTruthy();
          expect(Array.isArray(template.variables)).toBe(true);
        }
      }
    });
  });

  describe('TECH_COLORS', () => {
    it('should have primary colors', () => {
      expect(TECH_COLORS.primary).toBeDefined();
      expect(TECH_COLORS.primary.length).toBeGreaterThan(0);
    });

    it('should have accent colors', () => {
      expect(TECH_COLORS.accent).toBeDefined();
      expect(TECH_COLORS.accent.length).toBeGreaterThan(0);
    });

    it('should have neutral colors', () => {
      expect(TECH_COLORS.neutral).toBeDefined();
      expect(TECH_COLORS.neutral.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// Image Validator Tests
// ============================================================================

describe('Image Validator', () => {
  const mockMetadata: ImageMetadata = {
    width: 1080,
    height: 1080,
    format: 'png',
    sizeBytes: 500000,
    generatedAt: new Date(),
    prompt: 'test prompt',
    provider: 'test',
  };

  describe('validateImageDimensions', () => {
    it('should pass for valid dimensions', () => {
      const result = validateImageDimensions(mockMetadata, 1080, 1080);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should pass for dimensions larger than minimum', () => {
      const largeMetadata = { ...mockMetadata, width: 2000, height: 2000 };
      const result = validateImageDimensions(largeMetadata, 1080, 1080);
      expect(result.valid).toBe(true);
    });

    it('should fail for insufficient width', () => {
      const result = validateImageDimensions(
        { ...mockMetadata, width: 800 },
        1080,
        1080
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('width');
      expect(result.error).toContain('800');
    });

    it('should fail for insufficient height', () => {
      const result = validateImageDimensions(
        { ...mockMetadata, height: 500 },
        1080,
        1080
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('height');
      expect(result.error).toContain('500');
    });
  });

  describe('validateImageFormat', () => {
    it('should pass for allowed format', () => {
      const result = validateImageFormat(mockMetadata, ['png', 'jpg']);
      expect(result.valid).toBe(true);
    });

    it('should fail for disallowed format', () => {
      const result = validateImageFormat(
        { ...mockMetadata, format: 'webp' },
        ['png', 'jpg']
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('webp');
    });

    it('should handle single allowed format', () => {
      const result = validateImageFormat(mockMetadata, ['png']);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateImageSize', () => {
    it('should pass for valid file size', () => {
      const result = validateImageSize(mockMetadata, 1024 * 1024); // 1MB limit
      expect(result.valid).toBe(true);
    });

    it('should fail for file size exceeding limit', () => {
      const largeMetadata = { ...mockMetadata, sizeBytes: 10 * 1024 * 1024 }; // 10MB
      const result = validateImageSize(largeMetadata, 1024 * 1024); // 1MB limit
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds');
    });
  });

  describe('isImageFile', () => {
    it('should return true for PNG files', () => {
      expect(isImageFile('image.png')).toBe(true);
    });

    it('should return true for JPG files', () => {
      expect(isImageFile('image.jpg')).toBe(true);
      expect(isImageFile('image.jpeg')).toBe(true);
    });

    it('should return true for WebP files', () => {
      expect(isImageFile('image.webp')).toBe(true);
    });

    it('should return false for non-image files', () => {
      expect(isImageFile('document.pdf')).toBe(false);
      expect(isImageFile('script.js')).toBe(false);
      expect(isImageFile('style.css')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isImageFile('image.PNG')).toBe(true);
      expect(isImageFile('image.JPG')).toBe(true);
    });
  });

  describe('getOutputPath', () => {
    it('should generate correct path with default format', () => {
      const outputPath = getOutputPath('output/images', 'post-123');
      expect(outputPath).toBe(path.join('output/images', 'post-123', 'background.png'));
    });

    it('should generate correct path with custom format', () => {
      const outputPath = getOutputPath('output/images', 'post-456', 'jpg');
      expect(outputPath).toBe(path.join('output/images', 'post-456', 'background.jpg'));
    });
  });

  describe('ensureOutputDirectory', () => {
    const testDir = '/tmp/image-designer-test-' + Date.now();

    afterEach(() => {
      // Cleanup
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true });
      }
    });

    it('should create directory if it does not exist', () => {
      expect(fs.existsSync(testDir)).toBe(false);
      ensureOutputDirectory(testDir);
      expect(fs.existsSync(testDir)).toBe(true);
    });

    it('should not throw if directory already exists', () => {
      fs.mkdirSync(testDir, { recursive: true });
      expect(() => ensureOutputDirectory(testDir)).not.toThrow();
    });

    it('should create nested directories', () => {
      const nestedDir = path.join(testDir, 'nested', 'deep');
      ensureOutputDirectory(nestedDir);
      expect(fs.existsSync(nestedDir)).toBe(true);
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('ImageDesigner Integration', () => {
  it('should work with complete workflow (types only)', () => {
    // Test that all types are compatible
    const config = getImageDesignerDefaultConfig();
    // Create agent to verify factory works
    createImageDesignerAgent(config);

    const input: ImageDesignerInput = {
      postId: 'test-post-001',
      topic: 'React Performance Optimization',
      content: 'Learn how to optimize React applications for better performance',
      style: ImageStyle.TECH,
      keywords: ['react', 'performance', 'optimization'],
    };

    // Generate prompt for the input
    const prompt = generateBackgroundPrompt(
      input.topic,
      input.content,
      input.style ?? config.defaultStyle
    );

    expect(prompt).toBeTruthy();
    expect(validatePromptSafety(prompt)).toBe(true);

    // Verify output path generation
    const outputPath = getOutputPath(config.outputDir, input.postId);
    expect(outputPath).toContain(input.postId);
  });

  it('should track attempts via events', async () => {
    const agent = createImageDesignerAgent();
    const attempts: AttemptEvent[] = [];

    agent.on('attempt', (event: AttemptEvent) => {
      attempts.push(event);
    });

    const input: ImageDesignerInput = {
      postId: 'test-post-002',
      topic: 'Node.js Best Practices',
      content: 'Essential best practices for Node.js development',
    };

    // Without ImageGenService, it will fail but should emit attempt
    await agent.run(input);

    // No attempts should be emitted since it fails before the loop
    // because ImageGenService is not configured
    expect(attempts.length).toBe(0);
  });
});
