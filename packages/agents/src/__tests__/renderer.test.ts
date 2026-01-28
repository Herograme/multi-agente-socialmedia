/**
 * Tests for HTMLRendererService
 * Story 3.4 - Servico de Renderizacao HTML para Imagem
 *
 * NOTE: Browser-based tests are skipped when no browser is available.
 * Set PUPPETEER_EXECUTABLE_PATH to point to a chromium/chrome binary
 * to enable browser rendering tests.
 *
 * For CI environments, ensure chromium is installed:
 * - Ubuntu: apt-get install chromium-browser
 * - Docker: Use a puppeteer-ready image
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  HTMLRendererService,
  createHTMLRendererService,
  createBrowserPool,
  getHTMLRendererDefaultConfig,
  RendererError,
  RendererErrorCode,
  SingletonBrowserPool,
} from '../services/renderer';
import type { HTMLRenderResult, PoolMetrics } from '../services/renderer';

// Test fixtures paths
const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const TEST_CSS_PATH = path.join(FIXTURES_DIR, 'test-styles.css');
const TEST_BG_PATH = path.join(FIXTURES_DIR, 'test-background.png');

// Check if browser tests should be skipped
// Skip if:
// 1. SKIP_BROWSER_TESTS env var is set
// 2. CI environment without PUPPETEER_EXECUTABLE_PATH
const SKIP_BROWSER_TESTS =
  process.env.SKIP_BROWSER_TESTS === 'true' ||
  (process.env.CI === 'true' && !process.env.PUPPETEER_EXECUTABLE_PATH);

// Simple test HTML
const SIMPLE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 40px;
      font-family: Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    h1 { font-size: 48px; }
  </style>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>
`;

// Carousel-style HTML
const CAROUSEL_HTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px;
      height: 1080px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-family: 'Inter', sans-serif;
      color: white;
      padding: 80px;
      background: #1a1a2e;
    }
    .content {
      position: relative;
      z-index: 2;
      text-align: center;
    }
    h1 {
      font-size: 64px;
      font-weight: 700;
      margin-bottom: 24px;
    }
    p {
      font-size: 32px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="content">
    <h1>React 19 Chegou!</h1>
    <p>Conheca as principais novidades</p>
  </div>
</body>
</html>
`;

// Setup test fixtures before all tests
beforeAll(async () => {
  // Create fixtures directory if it doesn't exist
  await fs.mkdir(FIXTURES_DIR, { recursive: true });

  // Create test CSS file
  const testCSS = `
    .test-class { color: red; font-size: 100px; }
    .injected { background: yellow; }
  `;
  await fs.writeFile(TEST_CSS_PATH, testCSS);

  // Create a simple 10x10 PNG for background tests
  // PNG header + IHDR + IDAT + IEND chunks for a minimal valid PNG
  const minimalPNG = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x0a, 0x00, 0x00, 0x00, 0x0a, // 10x10
    0x08, 0x02, 0x00, 0x00, 0x00, 0x02, 0x50, 0x58,
    0xea, 0x00, 0x00, 0x00, 0x1c, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x78, 0x9c, 0x62, 0x60, 0x60, 0x60, 0xf8,
    0xcf, 0xc0, 0xc0, 0xc0, 0xc0, 0xc0, 0xc0, 0xc0,
    0xc0, 0xc0, 0xc0, 0x00, 0x00, 0x00, 0x64, 0x00,
    0x01, 0xc5, 0x49, 0x23, 0x85, 0x00, 0x00, 0x00, // IEND chunk
    0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60,
    0x82,
  ]);
  await fs.writeFile(TEST_BG_PATH, minimalPNG);
});

// Cleanup fixtures after all tests
afterAll(async () => {
  try {
    await fs.unlink(TEST_CSS_PATH);
    await fs.unlink(TEST_BG_PATH);
  } catch {
    // Ignore cleanup errors
  }
});

describe('HTMLRendererService', () => {
  describe('instantiation', () => {
    it('should create service with default config', () => {
      const renderer = createHTMLRendererService();
      expect(renderer).toBeInstanceOf(HTMLRendererService);
    });

    it('should create service with custom viewport', () => {
      const renderer = createHTMLRendererService({
        defaultViewport: { width: 1920, height: 1080 },
      });
      expect(renderer).toBeInstanceOf(HTMLRendererService);
    });

    it('should create service with custom timeout', () => {
      const renderer = createHTMLRendererService({
        timeout: 60000,
      });
      expect(renderer).toBeInstanceOf(HTMLRendererService);
    });
  });

  describe('factory validation', () => {
    it('should throw on invalid timeout', () => {
      expect(() => createHTMLRendererService({ timeout: 500 })).toThrow(
        'timeout must be at least 1000ms'
      );
    });

    it('should throw on invalid viewport width', () => {
      expect(() =>
        createHTMLRendererService({
          defaultViewport: { width: 0, height: 1080 },
        })
      ).toThrow('defaultViewport.width must be at least 1');
    });

    it('should throw on invalid viewport height', () => {
      expect(() =>
        createHTMLRendererService({
          defaultViewport: { width: 1080, height: 0 },
        })
      ).toThrow('defaultViewport.height must be at least 1');
    });

    it('should return RendererError with correct code', () => {
      try {
        createHTMLRendererService({ timeout: 100 });
      } catch (error) {
        expect(error).toBeInstanceOf(RendererError);
        expect((error as RendererError).code).toBe(
          RendererErrorCode.INVALID_CONFIG
        );
      }
    });
  });

  describe('getHTMLRendererDefaultConfig', () => {
    it('should return default configuration', () => {
      const config = getHTMLRendererDefaultConfig();
      expect(config.headless).toBe(true);
      expect(config.defaultViewport?.width).toBe(1080);
      expect(config.defaultViewport?.height).toBe(1080);
      expect(config.timeout).toBe(30000);
    });
  });
});

// Browser-dependent tests - conditional based on environment
describe.skipIf(SKIP_BROWSER_TESTS)('HTMLRendererService rendering', () => {
  let renderer: HTMLRendererService;

  beforeAll(async () => {
    renderer = createHTMLRendererService({
      timeout: 30000,
    });
    await renderer.initialize();
  });

  afterAll(async () => {
    await renderer.dispose();
  });

  it('should render simple HTML to PNG buffer', async () => {
    const buffer = await renderer.renderToImage(SIMPLE_HTML);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);

    // Verify PNG magic bytes
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50); // 'P'
    expect(buffer[2]).toBe(0x4e); // 'N'
    expect(buffer[3]).toBe(0x47); // 'G'
  });

  it('should render with custom dimensions', async () => {
    const result = await renderer.render(SIMPLE_HTML, {
      width: 800,
      height: 600,
    });

    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
    expect(result.buffer.length).toBeGreaterThan(0);
    expect(result.format).toBe('png');
  });

  it('should render to JPEG format', async () => {
    const buffer = await renderer.renderToImage(SIMPLE_HTML, {
      format: 'jpeg',
      quality: 80,
    });

    expect(buffer).toBeInstanceOf(Buffer);

    // Verify JPEG magic bytes (SOI marker)
    expect(buffer[0]).toBe(0xff);
    expect(buffer[1]).toBe(0xd8);
  });

  it('should render to WebP format', async () => {
    const buffer = await renderer.renderToImage(SIMPLE_HTML, {
      format: 'webp',
      quality: 80,
    });

    expect(buffer).toBeInstanceOf(Buffer);

    // Verify WebP magic bytes (RIFF header)
    expect(buffer[0]).toBe(0x52); // 'R'
    expect(buffer[1]).toBe(0x49); // 'I'
    expect(buffer[2]).toBe(0x46); // 'F'
    expect(buffer[3]).toBe(0x46); // 'F'
  });

  it('should render carousel-style HTML', async () => {
    const result = await renderer.render(CAROUSEL_HTML, {
      width: 1080,
      height: 1080,
    });

    expect(result.width).toBe(1080);
    expect(result.height).toBe(1080);
    expect(result.buffer.length).toBeGreaterThan(0);
    expect(result.renderTimeMs).toBeGreaterThan(0);
  });

  it('should respect device scale factor', async () => {
    const result1 = await renderer.render(SIMPLE_HTML, {
      width: 540,
      height: 540,
      deviceScaleFactor: 1,
    });

    const result2 = await renderer.render(SIMPLE_HTML, {
      width: 540,
      height: 540,
      deviceScaleFactor: 2,
    });

    // Higher scale factor should produce larger image
    expect(result2.buffer.length).toBeGreaterThan(result1.buffer.length);
  });

  it('should return complete HTMLRenderResult with metadata', async () => {
    const result: HTMLRenderResult = await renderer.render(SIMPLE_HTML, {
      width: 1080,
      height: 1080,
      format: 'png',
    });

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.width).toBe(1080);
    expect(result.height).toBe(1080);
    expect(result.format).toBe('png');
    expect(result.size).toBe(result.buffer.length);
    expect(result.renderTimeMs).toBeGreaterThan(0);
  });
});

describe.skipIf(SKIP_BROWSER_TESTS)('HTMLRendererService CSS injection', () => {
  let renderer: HTMLRendererService;

  beforeAll(async () => {
    renderer = createHTMLRendererService();
    await renderer.initialize();
  });

  afterAll(async () => {
    await renderer.dispose();
  });

  it('should inject inline CSS', async () => {
    const html = '<html><body><h1 id="title">Styled</h1></body></html>';
    const buffer = await renderer.renderToImage(html, {
      cssContent: '#title { color: red; font-size: 100px; }',
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should inject CSS from file', async () => {
    const html =
      '<html><body><div class="test-class">From File</div></body></html>';
    const buffer = await renderer.renderToImage(html, {
      cssPath: TEST_CSS_PATH,
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should combine CSS path and inline CSS', async () => {
    const html = '<html><body><div class="test-class injected">Both</div></body></html>';
    const buffer = await renderer.renderToImage(html, {
      cssPath: TEST_CSS_PATH,
      cssContent: '.extra { padding: 20px; }',
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should throw error for non-existent CSS file', async () => {
    const html = '<html><body><h1>Test</h1></body></html>';

    await expect(
      renderer.renderToImage(html, {
        cssPath: '/non/existent/path.css',
      })
    ).rejects.toThrow();
  });
});

describe.skipIf(SKIP_BROWSER_TESTS)('HTMLRendererService background image', () => {
  let renderer: HTMLRendererService;

  beforeAll(async () => {
    renderer = createHTMLRendererService();
    await renderer.initialize();
  });

  afterAll(async () => {
    await renderer.dispose();
  });

  it('should render with background image', async () => {
    const html = `
      <html>
        <body style="width: 1080px; height: 1080px; margin: 0;">
          <h1 style="color: white; position: relative; z-index: 1; padding: 40px;">
            With Background
          </h1>
        </body>
      </html>
    `;

    const buffer = await renderer.renderToImage(html, {
      backgroundImage: TEST_BG_PATH,
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should throw error for non-existent background image', async () => {
    const html = '<html><body><h1>Test</h1></body></html>';

    await expect(
      renderer.renderToImage(html, {
        backgroundImage: '/non/existent/image.png',
      })
    ).rejects.toThrow('Background image not found');
  });

  it('should throw RendererError with correct code for missing background', async () => {
    const html = '<html><body><h1>Test</h1></body></html>';

    try {
      await renderer.renderToImage(html, {
        backgroundImage: '/non/existent/image.png',
      });
    } catch (error) {
      expect(error).toBeInstanceOf(RendererError);
      expect((error as RendererError).code).toBe(
        RendererErrorCode.BACKGROUND_IMAGE_FAILED
      );
    }
  });
});

describe.skipIf(SKIP_BROWSER_TESTS)('HTMLRendererService lifecycle', () => {
  it('should initialize browser on first render', async () => {
    const renderer = createHTMLRendererService();

    expect(renderer.isInitialized()).toBe(false);

    await renderer.renderToImage(SIMPLE_HTML);

    expect(renderer.isInitialized()).toBe(true);

    await renderer.dispose();
  });

  it('should track render metrics', async () => {
    const renderer = createHTMLRendererService();
    await renderer.initialize();

    await renderer.renderToImage(SIMPLE_HTML);
    await renderer.renderToImage(SIMPLE_HTML);

    const metrics = renderer.getMetrics();
    expect(metrics.totalRenders).toBe(2);
    expect(metrics.avgRenderTimeMs).toBeGreaterThan(0);

    await renderer.dispose();
  });

  it('should cleanup browser on dispose', async () => {
    const renderer = createHTMLRendererService();
    await renderer.initialize();

    expect(renderer.isInitialized()).toBe(true);

    await renderer.dispose();

    expect(renderer.isInitialized()).toBe(false);
  });

  it('should handle multiple dispose calls safely', async () => {
    const renderer = createHTMLRendererService();
    await renderer.initialize();
    await renderer.renderToImage(SIMPLE_HTML);

    await renderer.dispose();
    // Second dispose should not throw
    await renderer.dispose();
  });

  it('should return pool metrics', async () => {
    const renderer = createHTMLRendererService();
    await renderer.initialize();
    await renderer.renderToImage(SIMPLE_HTML);

    const poolMetrics: PoolMetrics = renderer.getPoolMetrics();

    expect(poolMetrics.totalRenders).toBe(1);
    expect(poolMetrics.avgRenderTimeMs).toBeGreaterThan(0);
    expect(poolMetrics.activeBrowsers).toBe(1);
    expect(poolMetrics.availableBrowsers).toBe(1);

    await renderer.dispose();
  });
});

describe('SingletonBrowserPool', () => {
  it('should create pool with default config', () => {
    const pool = new SingletonBrowserPool();
    expect(pool).toBeInstanceOf(SingletonBrowserPool);
  });

  it('should create pool with custom config', () => {
    const pool = new SingletonBrowserPool({
      headless: true,
      timeout: 60000,
    });
    expect(pool).toBeInstanceOf(SingletonBrowserPool);
  });
});

describe.skipIf(SKIP_BROWSER_TESTS)('SingletonBrowserPool browser operations', () => {
  let pool: SingletonBrowserPool;

  afterEach(async () => {
    if (pool) {
      await pool.dispose();
    }
  });

  it('should acquire browser instance', async () => {
    pool = new SingletonBrowserPool();
    const browser = await pool.acquire();

    expect(browser).toBeDefined();
    expect(pool.hasActiveBrowser()).toBe(true);
    expect(pool.isInUse()).toBe(true);
  });

  it('should release browser back to pool', async () => {
    pool = new SingletonBrowserPool();
    const browser = await pool.acquire();

    await pool.release(browser);

    expect(pool.hasActiveBrowser()).toBe(true);
    expect(pool.isInUse()).toBe(false);
  });

  it('should reuse same browser instance', async () => {
    pool = new SingletonBrowserPool();

    const browser1 = await pool.acquire();
    await pool.release(browser1);

    const browser2 = await pool.acquire();

    expect(browser1).toBe(browser2);
  });

  it('should track pool metrics', async () => {
    pool = new SingletonBrowserPool();

    await pool.acquire();
    const metrics = pool.getMetrics();

    expect(metrics.activeBrowsers).toBe(1);
    expect(metrics.totalRenders).toBe(0); // Incremented on release
  });

  it('should dispose pool correctly', async () => {
    pool = new SingletonBrowserPool();
    await pool.acquire();

    await pool.dispose();

    expect(pool.hasActiveBrowser()).toBe(false);
    expect(pool.isInUse()).toBe(false);
  });
});

describe('createBrowserPool factory', () => {
  it('should create pool instance', () => {
    const pool = createBrowserPool();
    expect(pool).toBeDefined();
    expect(typeof pool.acquire).toBe('function');
    expect(typeof pool.release).toBe('function');
    expect(typeof pool.dispose).toBe('function');
    expect(typeof pool.getMetrics).toBe('function');
  });

  it('should throw on invalid config', () => {
    expect(() => createBrowserPool({ timeout: 100 })).toThrow(
      'timeout must be at least 1000ms'
    );
  });
});

describe.skipIf(SKIP_BROWSER_TESTS)('HTMLRendererService with real carousel templates', () => {
  let renderer: HTMLRendererService;

  beforeAll(async () => {
    renderer = createHTMLRendererService();
    await renderer.initialize();
  });

  afterAll(async () => {
    await renderer.dispose();
  });

  it('should render carousel cover template HTML structure', async () => {
    const coverHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=1080, height=1080">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: 1080px;
            height: 1080px;
            font-family: 'Inter', system-ui, sans-serif;
          }
          .slide {
            width: 1080px;
            height: 1080px;
            position: relative;
            background: #0f172a;
          }
          .slide-content {
            position: relative;
            z-index: 2;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 64px;
          }
          .cover-title {
            font-size: 72px;
            font-weight: 800;
            color: white;
            text-align: center;
            line-height: 1.2;
          }
          .cover-subtitle {
            font-size: 32px;
            color: rgba(255,255,255,0.8);
            margin-top: 24px;
          }
          .cover-handle {
            position: absolute;
            bottom: 48px;
            font-size: 24px;
            color: rgba(255,255,255,0.6);
          }
        </style>
      </head>
      <body>
        <div class="slide">
          <div class="slide-content">
            <h1 class="cover-title">5 Dicas de TypeScript</h1>
            <p class="cover-subtitle">Para codigo mais limpo</p>
            <span class="cover-handle">@devtips</span>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await renderer.render(coverHtml, {
      width: 1080,
      height: 1080,
      format: 'png',
    });

    expect(result.width).toBe(1080);
    expect(result.height).toBe(1080);
    expect(result.format).toBe('png');
    expect(result.buffer.length).toBeGreaterThan(10000);
  });

  it('should render code slide template HTML structure', async () => {
    const codeHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: 1080px;
            height: 1080px;
            background: #1e1e2e;
            font-family: 'Fira Code', monospace;
            padding: 48px;
          }
          .slide-number {
            color: #89b4fa;
            font-size: 20px;
            margin-bottom: 24px;
          }
          .slide-title {
            color: #cdd6f4;
            font-size: 36px;
            margin-bottom: 32px;
          }
          .code-block {
            background: #11111b;
            border-radius: 16px;
            padding: 32px;
            font-size: 24px;
            line-height: 1.6;
          }
          .keyword { color: #cba6f7; }
          .string { color: #a6e3a1; }
          .type { color: #89dceb; }
        </style>
      </head>
      <body>
        <span class="slide-number">01 / 05</span>
        <h2 class="slide-title">Use const assertions</h2>
        <pre class="code-block">
<span class="keyword">const</span> colors = [
  <span class="string">'red'</span>,
  <span class="string">'green'</span>,
  <span class="string">'blue'</span>
] <span class="keyword">as const</span>;

<span class="keyword">type</span> <span class="type">Color</span> = <span class="keyword">typeof</span> colors[<span class="type">number</span>];
        </pre>
      </body>
      </html>
    `;

    const result = await renderer.render(codeHtml, {
      width: 1080,
      height: 1080,
      format: 'png',
    });

    expect(result.width).toBe(1080);
    expect(result.height).toBe(1080);
    expect(result.buffer.length).toBeGreaterThan(5000);
  });
});

describe.skipIf(SKIP_BROWSER_TESTS)('HTMLRendererService error handling', () => {
  let renderer: HTMLRendererService;

  beforeAll(async () => {
    renderer = createHTMLRendererService({ timeout: 5000 });
    await renderer.initialize();
  });

  afterAll(async () => {
    await renderer.dispose();
  });

  it('should handle empty HTML gracefully', async () => {
    const buffer = await renderer.renderToImage('');

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should handle malformed HTML', async () => {
    const malformedHtml = '<div><p>Unclosed tags<span>';
    const buffer = await renderer.renderToImage(malformedHtml);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should handle HTML with special characters', async () => {
    const specialHtml = `
      <html>
      <body>
        <h1>Special: &amp; &lt; &gt; &quot; &apos;</h1>
        <p>Unicode: \u00e9\u00e0\u00fc\u00f1</p>
      </body>
      </html>
    `;

    const buffer = await renderer.renderToImage(specialHtml);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });
});
