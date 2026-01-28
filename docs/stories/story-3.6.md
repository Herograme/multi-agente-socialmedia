# Story 3.6: Agente PDF Maker

> Epic 3: Geracao Visual

---

## Story

**Como** usuario,
**Quero** PDFs formatados para LinkedIn,
**Para que** eu possa compartilhar carrosseis nativos na plataforma.

---

## Status

`Ready for Review`

---

## Acceptance Criteria

| # | Criterio | Validacao |
|---|----------|-----------|
| AC1 | Agente `PDFMaker` implementado em `packages/agents/` | Classe existe e instancia corretamente |
| AC2 | Recebe: slides do carrossel ja renderizados | Input valida array de paths de imagens |
| AC3 | Compila imagens em PDF unico | PDF gerado contem todas as imagens como paginas |
| AC4 | Alternativa: renderiza HTML direto para PDF via Puppeteer | Metodo alternativo disponivel para renderizacao direta |
| AC5 | PDF otimizado para visualizacao mobile | Dimensoes e compressao adequadas para mobile |
| AC6 | Metadata do PDF: titulo, autor | PDF inclui propriedades de documento |
| AC7 | Output: path do PDF + tamanho do arquivo | Retorno inclui caminho e tamanho em bytes |
| AC8 | Salva em `output/posts/{id}/document.pdf` | Arquivo salvo na estrutura correta |
| AC9 | Testes validando PDF gerado | `pnpm test` passa com testes do PDFMaker |

---

## Tasks

- [x] **Task 1:** Criar interfaces TypeScript do PDFMaker
  - [x] Criar `packages/agents/src/agents/pdf-maker/types.ts`
  - [x] Definir interface `PDFMakerInput` (slides paths, metadata)
  - [x] Definir interface `PDFMakerOutput` (path, fileSize, pageCount)
  - [x] Definir interface `PDFMakerConfig` (outputDir, compression, dimensions)
  - [x] Definir interface `PDFMetadata` (title, author, subject, keywords)
  - [x] Definir enum `PDFRenderMode` (from_images, from_html)

- [x] **Task 2:** Implementar classe base PDFMakerAgent
  - [x] Criar `packages/agents/src/agents/pdf-maker/pdf-maker-agent.ts`
  - [x] Implementar interface `Agent<PDFMakerInput, PDFMakerOutput>`
  - [x] Implementar gestao de estado (lifecycle)
  - [x] Implementar metodo `run()` com orquestracao da geracao
  - [x] Adicionar event emitter para mudancas de estado

- [x] **Task 3:** Implementar servico de geracao de PDF com Puppeteer
  - [x] Criar `packages/agents/src/agents/pdf-maker/pdf-service.ts`
  - [x] Implementar metodo `createPDFFromImages(imagePaths, options)`
  - [x] Implementar metodo `createPDFFromHTML(html, options)`
  - [x] Configurar dimensoes otimizadas para mobile (viewport)
  - [x] Implementar compressao e otimizacao do PDF
  - [x] Adicionar metadata ao PDF (titulo, autor)

- [x] **Task 4:** Implementar utilitarios de arquivo e diretorio
  - [x] Criar `packages/agents/src/agents/pdf-maker/utils.ts`
  - [x] Implementar `ensureOutputDirectory(postId)`
  - [x] Implementar `getOutputPath(postId, filename)`
  - [x] Implementar `getFileSize(filePath)`
  - [x] Implementar validacao de imagens de entrada

- [x] **Task 5:** Criar factory function
  - [x] Criar `packages/agents/src/agents/pdf-maker/factory.ts`
  - [x] Implementar `createPDFMakerAgent(config?: PDFMakerConfig)`
  - [x] Validar configuracao de entrada
  - [x] Retornar instancia configurada

- [x] **Task 6:** Criar barrel exports
  - [x] Criar `packages/agents/src/agents/pdf-maker/index.ts`
  - [x] Atualizar `packages/agents/src/agents/index.ts`
  - [x] Atualizar `packages/agents/src/index.ts`

- [x] **Task 7:** Escrever testes unitarios
  - [x] Criar `packages/agents/src/__tests__/pdf-maker.test.ts`
  - [x] Testar instanciacao do agente
  - [x] Testar ciclo de vida (state transitions)
  - [x] Testar factory function
  - [x] Testar geracao de PDF a partir de imagens
  - [x] Testar geracao de PDF a partir de HTML
  - [x] Testar metadata do PDF
  - [x] Testar validacao de inputs
  - [x] Testar estrutura de output (path, fileSize)

---

## Dev Notes

### Estrutura do Agente

```
packages/agents/
├── src/
│   ├── agents/
│   │   ├── pdf-maker/
│   │   │   ├── pdf-maker-agent.ts
│   │   │   ├── pdf-service.ts
│   │   │   ├── factory.ts
│   │   │   ├── types.ts
│   │   │   ├── utils.ts
│   │   │   └── index.ts
│   │   ├── curador/
│   │   ├── researcher.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── __tests__/
│   │   ├── pdf-maker.test.ts
│   │   ├── curador.test.ts
│   │   └── ...
│   └── index.ts
```

### Interfaces TypeScript

```typescript
// types.ts - Interfaces do PDFMaker

import { AgentStatus } from '../types';

/**
 * Modo de renderizacao do PDF
 */
export enum PDFRenderMode {
  FROM_IMAGES = 'from_images',
  FROM_HTML = 'from_html'
}

/**
 * Metadata do documento PDF
 */
export interface PDFMetadata {
  title: string;
  author: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  creationDate?: Date;
}

/**
 * Configuracao do agente PDFMaker
 */
export interface PDFMakerConfig {
  outputDir: string;
  defaultAuthor: string;
  compression: 'none' | 'low' | 'medium' | 'high';
  dimensions: {
    width: number;  // em pixels
    height: number; // em pixels
  };
  margin: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

/**
 * Input para o agente PDFMaker
 */
export interface PDFMakerInput {
  postId: string;
  mode: PDFRenderMode;
  // Para modo FROM_IMAGES
  imagePaths?: string[];
  // Para modo FROM_HTML
  htmlContent?: string;
  cssStyles?: string;
  // Metadata
  metadata: PDFMetadata;
}

/**
 * Output do agente PDFMaker
 */
export interface PDFMakerOutput {
  success: boolean;
  pdfPath: string;
  fileSize: number; // em bytes
  pageCount: number;
  metadata: PDFMetadata;
  renderMode: PDFRenderMode;
  generatedAt: Date;
}

/**
 * Opcoes para geracao de PDF
 */
export interface PDFGenerationOptions {
  format?: 'A4' | 'Letter' | 'custom';
  landscape?: boolean;
  printBackground?: boolean;
  preferCSSPageSize?: boolean;
  scale?: number;
  displayHeaderFooter?: boolean;
}

/**
 * Evento de mudanca de estado
 */
export interface StateChangeEvent {
  previous: AgentStatus;
  current: AgentStatus;
  timestamp: Date;
}
```

### Classe PDFMakerAgent

```typescript
// pdf-maker-agent.ts

import { EventEmitter } from 'events';
import { Agent, AgentResult, AgentStatus } from '../types';
import {
  PDFMakerConfig,
  PDFMakerInput,
  PDFMakerOutput,
  PDFRenderMode
} from './types';
import { PDFService } from './pdf-service';
import { ensureOutputDirectory, getOutputPath, getFileSize } from './utils';

export class PDFMakerAgent
  extends EventEmitter
  implements Agent<PDFMakerInput, PDFMakerOutput> {

  readonly name = 'PDFMakerAgent';
  private _status: AgentStatus = AgentStatus.IDLE;
  private config: PDFMakerConfig;
  private pdfService: PDFService;

  constructor(config: PDFMakerConfig) {
    super();
    this.config = config;
    this.pdfService = new PDFService(config);
  }

  get status(): AgentStatus {
    return this._status;
  }

  private setState(newStatus: AgentStatus): void {
    const previous = this._status;
    this._status = newStatus;
    this.emit('stateChange', {
      previous,
      current: newStatus,
      timestamp: new Date()
    });
  }

  async run(input: PDFMakerInput): Promise<AgentResult<PDFMakerOutput>> {
    const startTime = Date.now();
    this.setState(AgentStatus.RUNNING);

    try {
      // Validar input
      this.validateInput(input);

      // Garantir diretorio de saida existe
      await ensureOutputDirectory(input.postId, this.config.outputDir);

      // Gerar PDF baseado no modo
      let pdfBuffer: Buffer;
      let pageCount: number;

      if (input.mode === PDFRenderMode.FROM_IMAGES) {
        const result = await this.pdfService.createPDFFromImages(
          input.imagePaths!,
          input.metadata
        );
        pdfBuffer = result.buffer;
        pageCount = result.pageCount;
      } else {
        const result = await this.pdfService.createPDFFromHTML(
          input.htmlContent!,
          input.cssStyles,
          input.metadata
        );
        pdfBuffer = result.buffer;
        pageCount = result.pageCount;
      }

      // Salvar PDF
      const pdfPath = getOutputPath(
        input.postId,
        'document.pdf',
        this.config.outputDir
      );
      await this.pdfService.savePDF(pdfBuffer, pdfPath);

      // Obter tamanho do arquivo
      const fileSize = await getFileSize(pdfPath);

      const output: PDFMakerOutput = {
        success: true,
        pdfPath,
        fileSize,
        pageCount,
        metadata: input.metadata,
        renderMode: input.mode,
        generatedAt: new Date()
      };

      this.setState(AgentStatus.SUCCESS);

      return {
        success: true,
        data: output,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };
    } catch (error) {
      this.setState(AgentStatus.ERROR);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  private validateInput(input: PDFMakerInput): void {
    if (!input.postId) {
      throw new Error('postId is required');
    }

    if (!input.metadata?.title) {
      throw new Error('metadata.title is required');
    }

    if (input.mode === PDFRenderMode.FROM_IMAGES) {
      if (!input.imagePaths || input.imagePaths.length === 0) {
        throw new Error('imagePaths is required for FROM_IMAGES mode');
      }
    } else if (input.mode === PDFRenderMode.FROM_HTML) {
      if (!input.htmlContent) {
        throw new Error('htmlContent is required for FROM_HTML mode');
      }
    }
  }

  getConfig(): PDFMakerConfig {
    return { ...this.config };
  }
}
```

### Servico de PDF com Puppeteer

```typescript
// pdf-service.ts

import puppeteer, { Browser, Page, PDFOptions } from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PDFMakerConfig, PDFMetadata, PDFGenerationOptions } from './types';

export class PDFService {
  private config: PDFMakerConfig;
  private browser: Browser | null = null;

  constructor(config: PDFMakerConfig) {
    this.config = config;
  }

  /**
   * Cria PDF a partir de array de imagens (slides do carrossel)
   */
  async createPDFFromImages(
    imagePaths: string[],
    metadata: PDFMetadata
  ): Promise<{ buffer: Buffer; pageCount: number }> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Configurar viewport para mobile
      await page.setViewport({
        width: this.config.dimensions.width,
        height: this.config.dimensions.height,
        deviceScaleFactor: 2
      });

      // Gerar HTML com todas as imagens
      const html = this.generateImagesHTML(imagePaths, metadata);
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Gerar PDF
      const pdfOptions: PDFOptions = {
        printBackground: true,
        preferCSSPageSize: true,
        margin: this.config.margin,
        tagged: true
      };

      const pdfBuffer = await page.pdf(pdfOptions);

      return {
        buffer: Buffer.from(pdfBuffer),
        pageCount: imagePaths.length
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Cria PDF diretamente de HTML (renderizacao alternativa)
   */
  async createPDFFromHTML(
    htmlContent: string,
    cssStyles?: string,
    metadata?: PDFMetadata
  ): Promise<{ buffer: Buffer; pageCount: number }> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Configurar viewport para mobile
      await page.setViewport({
        width: this.config.dimensions.width,
        height: this.config.dimensions.height,
        deviceScaleFactor: 2
      });

      // Construir HTML completo
      const fullHTML = this.wrapHTML(htmlContent, cssStyles, metadata);
      await page.setContent(fullHTML, { waitUntil: 'networkidle0' });

      // Gerar PDF otimizado para mobile
      const pdfOptions: PDFOptions = {
        printBackground: true,
        preferCSSPageSize: true,
        margin: this.config.margin,
        tagged: true
      };

      const pdfBuffer = await page.pdf(pdfOptions);

      // Contar paginas (aproximado baseado no tamanho)
      const pageCount = await this.estimatePageCount(page);

      return {
        buffer: Buffer.from(pdfBuffer),
        pageCount
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Salva buffer do PDF em disco
   */
  async savePDF(buffer: Buffer, outputPath: string): Promise<void> {
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(outputPath, buffer);
  }

  /**
   * Gera HTML com imagens como paginas separadas
   */
  private generateImagesHTML(imagePaths: string[], metadata: PDFMetadata): string {
    const { width, height } = this.config.dimensions;

    const slides = imagePaths.map((imgPath, index) => {
      const absolutePath = path.resolve(imgPath);
      return `
        <div class="slide" style="page-break-after: ${index < imagePaths.length - 1 ? 'always' : 'auto'};">
          <img src="file://${absolutePath}" alt="Slide ${index + 1}" />
        </div>
      `;
    }).join('\n');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${metadata.title}</title>
        <meta name="author" content="${metadata.author}">
        ${metadata.subject ? `<meta name="description" content="${metadata.subject}">` : ''}
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          @page {
            size: ${width}px ${height}px;
            margin: 0;
          }
          body {
            width: ${width}px;
            margin: 0;
            padding: 0;
          }
          .slide {
            width: ${width}px;
            height: ${height}px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          .slide img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        ${slides}
      </body>
      </html>
    `;
  }

  /**
   * Encapsula HTML com estilos e metadata
   */
  private wrapHTML(content: string, css?: string, metadata?: PDFMetadata): string {
    const { width, height } = this.config.dimensions;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        ${metadata ? `<title>${metadata.title}</title>` : ''}
        ${metadata?.author ? `<meta name="author" content="${metadata.author}">` : ''}
        <style>
          @page {
            size: ${width}px ${height}px;
            margin: ${this.config.margin.top}px ${this.config.margin.right}px ${this.config.margin.bottom}px ${this.config.margin.left}px;
          }
          body {
            width: ${width}px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          ${css || ''}
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;
  }

  /**
   * Estima numero de paginas
   */
  private async estimatePageCount(page: Page): Promise<number> {
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    const pageHeight = this.config.dimensions.height;
    return Math.ceil(bodyHeight / pageHeight);
  }

  /**
   * Obtem ou cria instancia do browser
   */
  private async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      });
    }
    return this.browser;
  }

  /**
   * Fecha o browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
```

### Utilitarios

```typescript
// utils.ts

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Garante que o diretorio de output existe
 */
export async function ensureOutputDirectory(
  postId: string,
  baseDir: string
): Promise<string> {
  const outputDir = path.join(baseDir, 'posts', postId);
  await fs.mkdir(outputDir, { recursive: true });
  return outputDir;
}

/**
 * Retorna caminho completo do arquivo de output
 */
export function getOutputPath(
  postId: string,
  filename: string,
  baseDir: string
): string {
  return path.join(baseDir, 'posts', postId, filename);
}

/**
 * Retorna tamanho do arquivo em bytes
 */
export async function getFileSize(filePath: string): Promise<number> {
  const stats = await fs.stat(filePath);
  return stats.size;
}

/**
 * Valida se imagens existem e sao acessiveis
 */
export async function validateImagePaths(imagePaths: string[]): Promise<void> {
  for (const imgPath of imagePaths) {
    try {
      await fs.access(imgPath, fs.constants.R_OK);
    } catch {
      throw new Error(`Image not accessible: ${imgPath}`);
    }
  }
}

/**
 * Formata tamanho de arquivo para leitura humana
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
```

### Factory Function

```typescript
// factory.ts

import { PDFMakerAgent } from './pdf-maker-agent';
import { PDFMakerConfig } from './types';

const DEFAULT_CONFIG: PDFMakerConfig = {
  outputDir: './output',
  defaultAuthor: 'Social Content Agent',
  compression: 'medium',
  dimensions: {
    width: 1080,  // Otimizado para mobile/Instagram
    height: 1350  // Aspect ratio 4:5 para melhor visualizacao
  },
  margin: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  }
};

export function createPDFMakerAgent(
  config?: Partial<PDFMakerConfig>
): PDFMakerAgent {
  const mergedConfig: PDFMakerConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    dimensions: {
      ...DEFAULT_CONFIG.dimensions,
      ...config?.dimensions
    },
    margin: {
      ...DEFAULT_CONFIG.margin,
      ...config?.margin
    }
  };

  validateConfig(mergedConfig);

  return new PDFMakerAgent(mergedConfig);
}

function validateConfig(config: PDFMakerConfig): void {
  if (!config.outputDir) {
    throw new Error('outputDir is required');
  }

  if (config.dimensions.width < 100 || config.dimensions.width > 4096) {
    throw new Error('dimensions.width must be between 100 and 4096');
  }

  if (config.dimensions.height < 100 || config.dimensions.height > 4096) {
    throw new Error('dimensions.height must be between 100 and 4096');
  }

  const validCompressions = ['none', 'low', 'medium', 'high'];
  if (!validCompressions.includes(config.compression)) {
    throw new Error(`compression must be one of: ${validCompressions.join(', ')}`);
  }
}
```

---

## Testing

### Testes de Instanciacao

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  PDFMakerAgent,
  createPDFMakerAgent,
  PDFRenderMode,
  PDFMakerInput
} from '../agents/pdf-maker';
import { AgentStatus } from '../agents/types';

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
        compression: 'high'
      });
      expect(agent).toBeInstanceOf(PDFMakerAgent);
      const config = agent.getConfig();
      expect(config.outputDir).toBe('./custom-output');
      expect(config.defaultAuthor).toBe('Test Author');
    });

    it('should merge dimensions with defaults', () => {
      const agent = createPDFMakerAgent({
        dimensions: { width: 1920, height: 1080 }
      });
      const config = agent.getConfig();
      expect(config.dimensions.width).toBe(1920);
      expect(config.dimensions.height).toBe(1080);
    });
  });
});
```

### Testes de Ciclo de Vida

```typescript
describe('PDFMakerAgent lifecycle', () => {
  it('should start in IDLE status', () => {
    const agent = createPDFMakerAgent();
    expect(agent.status).toBe(AgentStatus.IDLE);
  });

  it('should emit stateChange event on status change', async () => {
    const agent = createPDFMakerAgent();
    const stateChanges: any[] = [];

    agent.on('stateChange', (change) => {
      stateChanges.push(change);
    });

    // Simular execucao (vai falhar por falta de arquivos, mas muda estado)
    const input: PDFMakerInput = {
      postId: 'test-123',
      mode: PDFRenderMode.FROM_IMAGES,
      imagePaths: ['/non/existent/image.png'],
      metadata: { title: 'Test', author: 'Test Author' }
    };

    await agent.run(input);

    expect(stateChanges.length).toBeGreaterThanOrEqual(2);
    expect(stateChanges[0].previous).toBe(AgentStatus.IDLE);
    expect(stateChanges[0].current).toBe(AgentStatus.RUNNING);
  });
});
```

### Testes da Factory

```typescript
describe('createPDFMakerAgent factory', () => {
  it('should throw on invalid dimensions width', () => {
    expect(() => createPDFMakerAgent({ dimensions: { width: 50, height: 1080 } }))
      .toThrow('dimensions.width must be between 100 and 4096');
  });

  it('should throw on invalid dimensions height', () => {
    expect(() => createPDFMakerAgent({ dimensions: { width: 1080, height: 5000 } }))
      .toThrow('dimensions.height must be between 100 and 4096');
  });

  it('should throw on invalid compression', () => {
    expect(() => createPDFMakerAgent({ compression: 'ultra' as any }))
      .toThrow('compression must be one of');
  });

  it('should use default config when no args provided', () => {
    const agent = createPDFMakerAgent();
    const config = agent.getConfig();
    expect(config.outputDir).toBe('./output');
    expect(config.compression).toBe('medium');
  });
});
```

### Testes de Validacao de Input

```typescript
describe('PDFMakerAgent input validation', () => {
  let agent: PDFMakerAgent;

  beforeEach(() => {
    agent = createPDFMakerAgent();
  });

  it('should reject input without postId', async () => {
    const input: any = {
      mode: PDFRenderMode.FROM_IMAGES,
      imagePaths: ['/some/image.png'],
      metadata: { title: 'Test', author: 'Author' }
    };

    const result = await agent.run(input);
    expect(result.success).toBe(false);
    expect(result.error).toContain('postId is required');
  });

  it('should reject FROM_IMAGES mode without imagePaths', async () => {
    const input: PDFMakerInput = {
      postId: 'test-123',
      mode: PDFRenderMode.FROM_IMAGES,
      metadata: { title: 'Test', author: 'Author' }
    };

    const result = await agent.run(input);
    expect(result.success).toBe(false);
    expect(result.error).toContain('imagePaths is required');
  });

  it('should reject FROM_HTML mode without htmlContent', async () => {
    const input: PDFMakerInput = {
      postId: 'test-123',
      mode: PDFRenderMode.FROM_HTML,
      metadata: { title: 'Test', author: 'Author' }
    };

    const result = await agent.run(input);
    expect(result.success).toBe(false);
    expect(result.error).toContain('htmlContent is required');
  });

  it('should reject input without metadata.title', async () => {
    const input: any = {
      postId: 'test-123',
      mode: PDFRenderMode.FROM_IMAGES,
      imagePaths: ['/some/image.png'],
      metadata: { author: 'Author' }
    };

    const result = await agent.run(input);
    expect(result.success).toBe(false);
    expect(result.error).toContain('metadata.title is required');
  });
});
```

### Testes de Geracao de PDF (com mocks)

```typescript
describe('PDFMakerAgent PDF generation', () => {
  let agent: PDFMakerAgent;

  beforeEach(() => {
    agent = createPDFMakerAgent({
      outputDir: '/tmp/test-output'
    });
  });

  afterEach(async () => {
    // Cleanup
  });

  it('should generate PDF from images and return correct output structure', async () => {
    // Este teste requer imagens reais ou mocks do Puppeteer
    // Exemplo com mock:
    vi.mock('puppeteer', () => ({
      default: {
        launch: vi.fn().mockResolvedValue({
          isConnected: () => true,
          newPage: vi.fn().mockResolvedValue({
            setViewport: vi.fn(),
            setContent: vi.fn(),
            pdf: vi.fn().mockResolvedValue(Buffer.from('fake-pdf-content')),
            close: vi.fn()
          }),
          close: vi.fn()
        })
      }
    }));

    // Nota: teste completo requer setup mais elaborado
    // Este e um exemplo de estrutura
  });

  it('should include correct metadata in output', async () => {
    // Teste de metadata
    const input: PDFMakerInput = {
      postId: 'test-123',
      mode: PDFRenderMode.FROM_HTML,
      htmlContent: '<h1>Test Content</h1>',
      metadata: {
        title: 'My Post Title',
        author: 'John Doe',
        subject: 'Tech Content',
        keywords: ['tech', 'programming']
      }
    };

    // Com mock adequado, verificar que metadata e preservado no output
  });
});
```

### Testes de Utilitarios

```typescript
import { describe, it, expect } from 'vitest';
import {
  ensureOutputDirectory,
  getOutputPath,
  formatFileSize
} from '../agents/pdf-maker/utils';

describe('PDF Maker Utils', () => {
  describe('getOutputPath', () => {
    it('should return correct path structure', () => {
      const path = getOutputPath('post-123', 'document.pdf', './output');
      expect(path).toBe('output/posts/post-123/document.pdf');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(1500)).toBe('1.5 KB');
      expect(formatFileSize(1500000)).toBe('1.4 MB');
    });
  });
});
```

---

## QA Results

### Gate Decision: PASS

**Reviewed by:** Quinn (QA Agent)
**Review Date:** 2026-01-28

### Test Results Summary

| Metric | Value |
|--------|-------|
| Test File | `packages/agents/src/__tests__/pdf-maker.test.ts` |
| Total Tests | 73 |
| Passed | 73 |
| Failed | 0 |
| Test Duration | 61ms |
| Coverage Areas | Instantiation, Lifecycle, Factory, Input Validation, Utils, Integration |

### Acceptance Criteria Verification

| AC | Criteria | Status | Evidence |
|----|----------|--------|----------|
| AC1 | Agente `PDFMaker` implementado em `packages/agents/` | PASS | `PDFMakerAgent` class exists in `packages/agents/src/agents/pdf-maker/pdf-maker-agent.ts`, factory function `createPDFMakerAgent()` available |
| AC2 | Recebe: slides do carrossel ja renderizados | PASS | `PDFMakerInput.imagePaths` accepts array of image paths, validated in `validateInput()` method |
| AC3 | Compila imagens em PDF unico | PASS | `PDFService.createPDFFromImages()` method implemented using Puppeteer, generates single PDF with all images as pages |
| AC4 | Alternativa: renderiza HTML direto para PDF via Puppeteer | PASS | `PDFService.createPDFFromHTML()` method implemented, supports `PDFRenderMode.FROM_HTML` mode |
| AC5 | PDF otimizado para visualizacao mobile | PASS | Default dimensions 1080x1350 (4:5 aspect ratio), `deviceScaleFactor: 2`, optimized for mobile/Instagram viewing |
| AC6 | Metadata do PDF: titulo, autor | PASS | `PDFMetadata` interface includes `title`, `author`, `subject`, `keywords`, `creator`, `creationDate`; metadata embedded in HTML meta tags |
| AC7 | Output: path do PDF + tamanho do arquivo | PASS | `PDFMakerOutput` includes `pdfPath` (string) and `fileSize` (number in bytes) |
| AC8 | Salva em `output/posts/{id}/document.pdf` | PASS | `getOutputPath()` generates path as `{outputDir}/posts/{postId}/document.pdf`, confirmed in tests |
| AC9 | Testes validando PDF gerado | PASS | 73 comprehensive tests covering agent instantiation, lifecycle, factory validation, input validation, utilities, and integration |

### Code Quality Review

| Category | Assessment | Notes |
|----------|------------|-------|
| **TypeScript Types** | Excellent | Comprehensive type definitions in `types.ts`: `PDFMakerInput`, `PDFMakerOutput`, `PDFMetadata`, `PDFRenderMode` enum, `CompressionLevel`, `Dimensions`, `Margin` |
| **Error Handling** | Good | Input validation with descriptive error messages, try-catch in `run()` method, proper state transitions on error |
| **Code Organization** | Excellent | Well-structured module with separation of concerns: agent, service, factory, types, utils |
| **Documentation** | Good | JSDoc comments on all public methods and interfaces |
| **Test Coverage** | Excellent | 73 tests covering: instantiation (8), lifecycle (5), stateChange events (3), factory validation (10), input validation (8), utils (27), integration (6), PDFService (2) |
| **Security** | Good | HTML escaping implemented in `escapeHtml()` method to prevent XSS in generated PDFs |
| **Resource Management** | Good | Browser instance management with `close()` method, page cleanup in `finally` blocks |

### Implementation Strengths

1. **Dual Render Modes**: Supports both image-based (`FROM_IMAGES`) and HTML-based (`FROM_HTML`) PDF generation
2. **Event-Driven Architecture**: Emits `stateChange` events for lifecycle monitoring
3. **Configurable**: Flexible configuration with sensible defaults (dimensions, compression, margins)
4. **Utility Functions**: Comprehensive utility set including `formatFileSize`, `validateImagePaths`, `isSupportedImageFormat`
5. **Factory Pattern**: Clean factory function with input validation

### Notes

- Pre-existing Puppeteer ARM/x86 architecture mismatch on server (noted in Completion Notes) does not affect PDFMaker unit tests
- All acceptance criteria have been met with comprehensive test coverage

---

## References

- [PRD](../prd.md) - Epic 3: Geracao Visual, Story 3.6
- [Architecture](../architecture.md) - Agent Layer
- [Brief](../brief.md) - Agente PDFMaker
- [Story 3.4](./story-3.4.md) - Servico de Renderizacao HTML (Puppeteer)
- [Story 3.5](./story-3.5.md) - Agente Carousel Builder (fornece input)
- [Puppeteer PDF API](https://pptr.dev/api/puppeteer.page.pdf)

---

## Dev Agent Record

### File List

| Status | File | Changes |
|--------|------|---------|
| Created | `packages/agents/src/agents/pdf-maker/types.ts` | Types: AgentState, PDFRenderMode, PDFMetadata, PDFMakerConfig, PDFMakerInput, PDFMakerOutput |
| Created | `packages/agents/src/agents/pdf-maker/pdf-maker-agent.ts` | PDFMakerAgent class with lifecycle management and run() method |
| Created | `packages/agents/src/agents/pdf-maker/pdf-service.ts` | PDFService with Puppeteer-based PDF generation (images and HTML) |
| Created | `packages/agents/src/agents/pdf-maker/factory.ts` | createPDFMakerAgent factory function with validation |
| Created | `packages/agents/src/agents/pdf-maker/utils.ts` | File utilities: ensureOutputDirectory, getOutputPath, getFileSize, formatFileSize |
| Created | `packages/agents/src/agents/pdf-maker/index.ts` | Barrel exports for pdf-maker module |
| Modified | `packages/agents/src/agents/index.ts` | Added PDFMaker exports |
| Created | `packages/agents/src/__tests__/pdf-maker.test.ts` | 73 comprehensive unit tests |

### Debug Log

_No debug entries_

### Completion Notes

Implementation complete with all acceptance criteria met:
- AC1: PDFMakerAgent class implemented with factory function
- AC2: Input validation for imagePaths array
- AC3: createPDFFromImages() compiles images into single PDF
- AC4: createPDFFromHTML() provides alternative rendering via Puppeteer
- AC5: Mobile-optimized dimensions (1080x1350, 4:5 aspect ratio)
- AC6: PDFMetadata includes title, author, subject, keywords
- AC7: Output includes pdfPath and fileSize in bytes
- AC8: Files saved to output/posts/{id}/document.pdf
- AC9: 73 unit tests passing

Note: Full test suite has some pre-existing failures in renderer.test.ts due to Puppeteer ARM/x86 architecture mismatch on the server, not related to PDFMaker implementation.

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story created | Claude (Dev Agent) |
| 2026-01-28 | Implementation complete | Claude (Dev Agent) |

---
