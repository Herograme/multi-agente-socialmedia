/**
 * PDFMaker Agent Tests
 * Comprehensive tests for the PDFMaker agent and its components
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import {
  PDFMakerAgent,
  createPDFMakerAgent,
  getDefaultConfig as getPDFMakerDefaultConfig,
  validatePartialConfig,
  AgentState,
  PDFRenderMode,
  PDFService,
} from '../agents/pdf-maker';
import type {
  PDFMakerInput,
  StateChangeEvent,
  PDFMetadata,
} from '../agents/pdf-maker';
import {
  ensureOutputDirectory,
  ensureOutputDirectorySync,
  getOutputPath,
  getFileSize,
  formatFileSize,
  isSupportedImageFormat,
  getImageFormat,
  resolveAbsolutePath,
  fileExists,
  validateImagePaths,
} from '../agents/pdf-maker/utils';
import { AgentStatus } from '../agents/types';

// ============================================================================
// Agent Instantiation Tests
// ============================================================================

describe('PDFMakerAgent', () => {
  describe('instantiation', () => {
    it('should create agent with default config', () => {
      const agent = createPDFMakerAgent();
      expect(agent).toBeInstanceOf(PDFMakerAgent);
      expect(agent.name).toBe('PDFMakerAgent');
    });

    it('should create agent with custom config', () => {
      const agent = createPDFMakerAgent({
        outputDir: './custom-output',
        defaultAuthor: 'Test Author',
        compression: 'high',
      });
      expect(agent).toBeInstanceOf(PDFMakerAgent);
      const config = agent.getConfig();
      expect(config.outputDir).toBe('./custom-output');
      expect(config.defaultAuthor).toBe('Test Author');
      expect(config.compression).toBe('high');
    });

    it('should start in IDLE status', () => {
      const agent = createPDFMakerAgent();
      expect(agent.status).toBe(AgentStatus.IDLE);
      expect(agent.getState()).toBe(AgentState.IDLE);
    });

    it('should have correct name', () => {
      const agent = createPDFMakerAgent();
      expect(agent.name).toBe('PDFMakerAgent');
    });

    it('should merge dimensions with defaults', () => {
      const agent = createPDFMakerAgent({
        dimensions: { width: 1920, height: 1080 },
      });
      const config = agent.getConfig();
      expect(config.dimensions.width).toBe(1920);
      expect(config.dimensions.height).toBe(1080);
    });

    it('should merge margins with defaults', () => {
      const agent = createPDFMakerAgent({
        margin: { top: 10, bottom: 10, left: 10, right: 10 },
      });
      const config = agent.getConfig();
      expect(config.margin.top).toBe(10);
      expect(config.margin.bottom).toBe(10);
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default configuration', () => {
      const config = getPDFMakerDefaultConfig();
      expect(config).toEqual({
        outputDir: './output',
        defaultAuthor: 'Social Content Agent',
        compression: 'medium',
        dimensions: {
          width: 1080,
          height: 1350,
        },
        margin: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
      });
    });

    it('should return a copy, not the original', () => {
      const config1 = getPDFMakerDefaultConfig();
      const config2 = getPDFMakerDefaultConfig();
      config1.outputDir = 'changed';
      expect(config2.outputDir).toBe('./output');
    });

    it('should return independent dimension copies', () => {
      const config1 = getPDFMakerDefaultConfig();
      const config2 = getPDFMakerDefaultConfig();
      config1.dimensions.width = 2000;
      expect(config2.dimensions.width).toBe(1080);
    });
  });

  describe('getConfig', () => {
    it('should return agent configuration', () => {
      const agent = createPDFMakerAgent({ compression: 'high' });
      const config = agent.getConfig();
      expect(config.compression).toBe('high');
    });

    it('should return a copy, not the original', () => {
      const agent = createPDFMakerAgent();
      const config1 = agent.getConfig();
      const config2 = agent.getConfig();
      config1.outputDir = 'changed';
      expect(config2.outputDir).toBe('./output');
    });
  });

  describe('lifecycle', () => {
    it('should start in IDLE state', () => {
      const agent = createPDFMakerAgent();
      expect(agent.getState()).toBe(AgentState.IDLE);
    });

    it('should transition to RUNNING on start()', () => {
      const agent = createPDFMakerAgent();
      agent.start();
      expect(agent.getState()).toBe(AgentState.RUNNING);
      expect(agent.status).toBe(AgentStatus.RUNNING);
    });

    it('should transition to IDLE on stop()', () => {
      const agent = createPDFMakerAgent();
      agent.start();
      expect(agent.getState()).toBe(AgentState.RUNNING);
      agent.stop();
      expect(agent.getState()).toBe(AgentState.IDLE);
      expect(agent.status).toBe(AgentStatus.IDLE);
    });

    it('should reset to IDLE state', () => {
      const agent = createPDFMakerAgent();
      agent.start();
      expect(agent.getState()).toBe(AgentState.RUNNING);
      agent.reset();
      expect(agent.getState()).toBe(AgentState.IDLE);
    });

    it('should only start from IDLE state', () => {
      const agent = createPDFMakerAgent();
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
      const agent = createPDFMakerAgent();
      const stateChanges: StateChangeEvent[] = [];

      agent.on('stateChange', (event: StateChangeEvent) => {
        stateChanges.push(event);
      });

      agent.start();

      expect(stateChanges).toHaveLength(1);
      expect(stateChanges[0].previous).toBe(AgentState.IDLE);
      expect(stateChanges[0].current).toBe(AgentState.RUNNING);
      expect(stateChanges[0].timestamp).toBeInstanceOf(Date);
    });

    it('should emit stateChange event on stop()', () => {
      const agent = createPDFMakerAgent();
      agent.start();

      const stateChanges: StateChangeEvent[] = [];
      agent.on('stateChange', (event: StateChangeEvent) => {
        stateChanges.push(event);
      });

      agent.stop();

      expect(stateChanges).toHaveLength(1);
      expect(stateChanges[0].previous).toBe(AgentState.RUNNING);
      expect(stateChanges[0].current).toBe(AgentState.IDLE);
    });

    it('should emit multiple stateChange events during run()', async () => {
      const agent = createPDFMakerAgent();
      const stateChanges: StateChangeEvent[] = [];

      agent.on('stateChange', (event: StateChangeEvent) => {
        stateChanges.push(event);
      });

      // This should fail validation but still emit state changes
      const input: PDFMakerInput = {
        postId: '',
        mode: PDFRenderMode.FROM_IMAGES,
        imagePaths: ['/some/image.png'],
        metadata: { title: 'Test', author: 'Author' },
      };

      await agent.run(input);

      expect(stateChanges.length).toBeGreaterThanOrEqual(2);
      expect(stateChanges[0].previous).toBe(AgentState.IDLE);
      expect(stateChanges[0].current).toBe(AgentState.RUNNING);
      // Last state change should be to ERROR due to validation failure
      expect(stateChanges[stateChanges.length - 1].current).toBe(
        AgentState.ERROR
      );
    });
  });
});

// ============================================================================
// Factory Validation Tests
// ============================================================================

describe('createPDFMakerAgent factory', () => {
  it('should throw on invalid dimensions width (too small)', () => {
    expect(() =>
      createPDFMakerAgent({ dimensions: { width: 50, height: 1080 } })
    ).toThrow('dimensions.width must be a number between 100 and 4096');
  });

  it('should throw on invalid dimensions width (too large)', () => {
    expect(() =>
      createPDFMakerAgent({ dimensions: { width: 5000, height: 1080 } })
    ).toThrow('dimensions.width must be a number between 100 and 4096');
  });

  it('should throw on invalid dimensions height (too small)', () => {
    expect(() =>
      createPDFMakerAgent({ dimensions: { width: 1080, height: 50 } })
    ).toThrow('dimensions.height must be a number between 100 and 4096');
  });

  it('should throw on invalid dimensions height (too large)', () => {
    expect(() =>
      createPDFMakerAgent({ dimensions: { width: 1080, height: 5000 } })
    ).toThrow('dimensions.height must be a number between 100 and 4096');
  });

  it('should throw on invalid compression', () => {
    expect(() =>
      createPDFMakerAgent({ compression: 'ultra' as 'high' })
    ).toThrow('compression must be one of');
  });

  it('should throw on empty outputDir', () => {
    expect(() => createPDFMakerAgent({ outputDir: '' })).toThrow(
      'outputDir must be a non-empty string'
    );
  });

  it('should accept valid boundary values for dimensions', () => {
    expect(() =>
      createPDFMakerAgent({ dimensions: { width: 100, height: 100 } })
    ).not.toThrow();

    expect(() =>
      createPDFMakerAgent({ dimensions: { width: 4096, height: 4096 } })
    ).not.toThrow();
  });

  it('should merge config with defaults', () => {
    const agent = createPDFMakerAgent({ compression: 'high' });
    const config = agent.getConfig();

    expect(config.compression).toBe('high');
    expect(config.outputDir).toBe('./output'); // default
    expect(config.dimensions.width).toBe(1080); // default
  });

  it('should throw on negative margin values', () => {
    expect(() => createPDFMakerAgent({ margin: { top: -5, bottom: 0, left: 0, right: 0 } })).toThrow(
      'margin.top must be a non-negative number'
    );
  });
});

describe('validatePartialConfig', () => {
  it('should return true for valid partial config', () => {
    expect(validatePartialConfig({ compression: 'high' })).toBe(true);
  });

  it('should return true for empty config', () => {
    expect(validatePartialConfig({})).toBe(true);
  });

  it('should throw for invalid partial config', () => {
    expect(() =>
      validatePartialConfig({ dimensions: { width: 50, height: 1080 } })
    ).toThrow();
  });
});

// ============================================================================
// Input Validation Tests
// ============================================================================

describe('PDFMakerAgent input validation', () => {
  let agent: PDFMakerAgent;

  beforeEach(() => {
    agent = createPDFMakerAgent();
  });

  afterEach(async () => {
    await agent.close();
  });

  it('should reject input without postId', async () => {
    const input: PDFMakerInput = {
      postId: '',
      mode: PDFRenderMode.FROM_IMAGES,
      imagePaths: ['/some/image.png'],
      metadata: { title: 'Test', author: 'Author' },
    };

    const result = await agent.run(input);
    expect(result.success).toBe(false);
    expect(result.error).toContain('postId is required');
  });

  it('should reject FROM_IMAGES mode without imagePaths', async () => {
    const input: PDFMakerInput = {
      postId: 'test-123',
      mode: PDFRenderMode.FROM_IMAGES,
      metadata: { title: 'Test', author: 'Author' },
    };

    const result = await agent.run(input);
    expect(result.success).toBe(false);
    expect(result.error).toContain('imagePaths is required');
  });

  it('should reject FROM_IMAGES mode with empty imagePaths', async () => {
    const input: PDFMakerInput = {
      postId: 'test-123',
      mode: PDFRenderMode.FROM_IMAGES,
      imagePaths: [],
      metadata: { title: 'Test', author: 'Author' },
    };

    const result = await agent.run(input);
    expect(result.success).toBe(false);
    expect(result.error).toContain('imagePaths is required');
  });

  it('should reject FROM_HTML mode without htmlContent', async () => {
    const input: PDFMakerInput = {
      postId: 'test-123',
      mode: PDFRenderMode.FROM_HTML,
      metadata: { title: 'Test', author: 'Author' },
    };

    const result = await agent.run(input);
    expect(result.success).toBe(false);
    expect(result.error).toContain('htmlContent is required');
  });

  it('should reject input without metadata.title', async () => {
    const input = {
      postId: 'test-123',
      mode: PDFRenderMode.FROM_IMAGES,
      imagePaths: ['/some/image.png'],
      metadata: { author: 'Author' },
    } as PDFMakerInput;

    const result = await agent.run(input);
    expect(result.success).toBe(false);
    expect(result.error).toContain('metadata.title is required');
  });

  it('should reject input without metadata.author', async () => {
    const input = {
      postId: 'test-123',
      mode: PDFRenderMode.FROM_IMAGES,
      imagePaths: ['/some/image.png'],
      metadata: { title: 'Test' },
    } as PDFMakerInput;

    const result = await agent.run(input);
    expect(result.success).toBe(false);
    expect(result.error).toContain('metadata.author is required');
  });

  it('should set state to ERROR after validation failure', async () => {
    const input: PDFMakerInput = {
      postId: '',
      mode: PDFRenderMode.FROM_IMAGES,
      imagePaths: ['/some/image.png'],
      metadata: { title: 'Test', author: 'Author' },
    };

    await agent.run(input);
    expect(agent.getState()).toBe(AgentState.ERROR);
    expect(agent.status).toBe(AgentStatus.ERROR);
  });
});

// ============================================================================
// Utils Tests
// ============================================================================

describe('PDF Maker Utils', () => {
  const testDir = '/tmp/pdf-maker-test-' + Date.now();

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fsPromises.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('getOutputPath', () => {
    it('should return correct path structure', () => {
      const outputPath = getOutputPath('post-123', 'document.pdf', './output');
      expect(outputPath).toBe(
        path.join('./output', 'posts', 'post-123', 'document.pdf')
      );
    });

    it('should handle different base directories', () => {
      const outputPath = getOutputPath(
        'post-456',
        'test.pdf',
        '/var/output'
      );
      expect(outputPath).toBe('/var/output/posts/post-456/test.pdf');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1500)).toBe('1.5 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1500000)).toBe('1.4 MB');
    });

    it('should handle zero bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('should handle exact boundaries', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
    });
  });

  describe('isSupportedImageFormat', () => {
    it('should return true for PNG files', () => {
      expect(isSupportedImageFormat('image.png')).toBe(true);
    });

    it('should return true for JPG files', () => {
      expect(isSupportedImageFormat('image.jpg')).toBe(true);
      expect(isSupportedImageFormat('image.jpeg')).toBe(true);
    });

    it('should return true for WebP files', () => {
      expect(isSupportedImageFormat('image.webp')).toBe(true);
    });

    it('should return false for unsupported formats', () => {
      expect(isSupportedImageFormat('image.gif')).toBe(false);
      expect(isSupportedImageFormat('document.pdf')).toBe(false);
      expect(isSupportedImageFormat('script.js')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isSupportedImageFormat('image.PNG')).toBe(true);
      expect(isSupportedImageFormat('image.JPG')).toBe(true);
    });
  });

  describe('getImageFormat', () => {
    it('should return correct format for PNG', () => {
      expect(getImageFormat('image.png')).toBe('png');
    });

    it('should normalize JPEG to JPG', () => {
      expect(getImageFormat('image.jpeg')).toBe('jpg');
    });

    it('should return undefined for unsupported formats', () => {
      expect(getImageFormat('image.gif')).toBeUndefined();
    });
  });

  describe('resolveAbsolutePath', () => {
    it('should resolve relative paths', () => {
      const resolved = resolveAbsolutePath('./test/file.txt');
      expect(path.isAbsolute(resolved)).toBe(true);
    });

    it('should keep absolute paths unchanged', () => {
      const absolutePath = '/absolute/path/file.txt';
      expect(resolveAbsolutePath(absolutePath)).toBe(absolutePath);
    });
  });

  describe('ensureOutputDirectory', () => {
    it('should create directory if it does not exist', async () => {
      const outputDir = await ensureOutputDirectory('test-post', testDir);
      const exists = fs.existsSync(outputDir);
      expect(exists).toBe(true);
      expect(outputDir).toBe(path.join(testDir, 'posts', 'test-post'));
    });

    it('should not throw if directory already exists', async () => {
      await ensureOutputDirectory('test-post', testDir);
      await expect(
        ensureOutputDirectory('test-post', testDir)
      ).resolves.not.toThrow();
    });
  });

  describe('ensureOutputDirectorySync', () => {
    it('should create directory synchronously', () => {
      const dirPath = path.join(testDir, 'sync-test');
      expect(fs.existsSync(dirPath)).toBe(false);
      ensureOutputDirectorySync(dirPath);
      expect(fs.existsSync(dirPath)).toBe(true);
    });

    it('should not throw if directory already exists', () => {
      const dirPath = path.join(testDir, 'sync-test-2');
      ensureOutputDirectorySync(dirPath);
      expect(() => ensureOutputDirectorySync(dirPath)).not.toThrow();
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const filePath = path.join(testDir, 'existing-file.txt');
      await fsPromises.mkdir(testDir, { recursive: true });
      await fsPromises.writeFile(filePath, 'test');
      expect(await fileExists(filePath)).toBe(true);
    });

    it('should return false for non-existing file', async () => {
      expect(await fileExists('/non/existing/file.txt')).toBe(false);
    });
  });

  describe('getFileSize', () => {
    it('should return correct file size', async () => {
      const filePath = path.join(testDir, 'size-test.txt');
      await fsPromises.mkdir(testDir, { recursive: true });
      const content = 'Hello, World!';
      await fsPromises.writeFile(filePath, content);
      const size = await getFileSize(filePath);
      expect(size).toBe(Buffer.from(content).length);
    });

    it('should throw for non-existing file', async () => {
      await expect(getFileSize('/non/existing/file.txt')).rejects.toThrow();
    });
  });

  describe('validateImagePaths', () => {
    it('should pass for existing files', async () => {
      const filePath = path.join(testDir, 'image.png');
      await fsPromises.mkdir(testDir, { recursive: true });
      await fsPromises.writeFile(filePath, 'fake-image-data');
      await expect(validateImagePaths([filePath])).resolves.not.toThrow();
    });

    it('should throw for non-existing files', async () => {
      await expect(
        validateImagePaths(['/non/existing/image.png'])
      ).rejects.toThrow('Image not accessible');
    });

    it('should validate all files in array', async () => {
      const filePath1 = path.join(testDir, 'image1.png');
      const filePath2 = path.join(testDir, 'image2.png');
      await fsPromises.mkdir(testDir, { recursive: true });
      await fsPromises.writeFile(filePath1, 'fake-image-data');
      // image2 does not exist
      await expect(validateImagePaths([filePath1, filePath2])).rejects.toThrow(
        'Image not accessible'
      );
    });
  });
});

// ============================================================================
// PDFRenderMode Tests
// ============================================================================

describe('PDFRenderMode', () => {
  it('should have FROM_IMAGES mode', () => {
    expect(PDFRenderMode.FROM_IMAGES).toBe('from_images');
  });

  it('should have FROM_HTML mode', () => {
    expect(PDFRenderMode.FROM_HTML).toBe('from_html');
  });
});

// ============================================================================
// Integration Tests (Types and Structure)
// ============================================================================

describe('PDFMaker Integration', () => {
  it('should work with complete workflow (types only)', () => {
    const config = getPDFMakerDefaultConfig();
    createPDFMakerAgent(config);

    const input: PDFMakerInput = {
      postId: 'test-post-001',
      mode: PDFRenderMode.FROM_IMAGES,
      imagePaths: ['/path/to/slide1.png', '/path/to/slide2.png'],
      metadata: {
        title: 'Tech Tutorial: React Hooks',
        author: 'Tech Content Creator',
        subject: 'Programming tutorial',
        keywords: ['react', 'hooks', 'programming'],
        creator: 'Social Content Agent',
        creationDate: new Date(),
      },
    };

    // Verify input structure
    expect(input.postId).toBeTruthy();
    expect(input.mode).toBe(PDFRenderMode.FROM_IMAGES);
    expect(input.imagePaths?.length).toBe(2);
    expect(input.metadata.title).toBeTruthy();
    expect(input.metadata.author).toBeTruthy();

    // Verify output path generation
    const outputPath = getOutputPath(
      input.postId,
      'document.pdf',
      config.outputDir
    );
    expect(outputPath).toContain(input.postId);
    expect(outputPath).toContain('document.pdf');
  });

  it('should have correct metadata structure', () => {
    const metadata: PDFMetadata = {
      title: 'Test Document',
      author: 'Test Author',
      subject: 'Test Subject',
      keywords: ['test', 'keywords'],
      creator: 'Test Creator',
      creationDate: new Date(),
    };

    expect(metadata.title).toBe('Test Document');
    expect(metadata.author).toBe('Test Author');
    expect(metadata.subject).toBe('Test Subject');
    expect(metadata.keywords).toEqual(['test', 'keywords']);
  });

  it('should support HTML render mode input', () => {
    const input: PDFMakerInput = {
      postId: 'test-html-001',
      mode: PDFRenderMode.FROM_HTML,
      htmlContent: '<h1>Test Content</h1><p>This is a test.</p>',
      cssStyles: 'h1 { color: blue; }',
      metadata: {
        title: 'HTML Test',
        author: 'Test Author',
      },
    };

    expect(input.mode).toBe(PDFRenderMode.FROM_HTML);
    expect(input.htmlContent).toBeTruthy();
    expect(input.cssStyles).toBeTruthy();
  });
});

// ============================================================================
// PDFService Tests (Unit level without browser)
// ============================================================================

describe('PDFService', () => {
  it('should create service with config', () => {
    const config = getPDFMakerDefaultConfig();
    const service = new PDFService(config);
    expect(service).toBeInstanceOf(PDFService);
    expect(service.getConfig()).toEqual(config);
  });

  it('should return config copy', () => {
    const config = getPDFMakerDefaultConfig();
    const service = new PDFService(config);
    const config1 = service.getConfig();
    const config2 = service.getConfig();
    config1.outputDir = 'changed';
    expect(config2.outputDir).toBe('./output');
  });
});
