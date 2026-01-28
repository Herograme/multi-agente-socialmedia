# Story 3.2: Agente Designer de Imagens

> Epic 3: Geracao Visual

---

## Story

**Como** usuario,
**Quero** imagens de fundo geradas automaticamente para cada post,
**Para que** meu conteudo tenha visual atraente e profissional.

---

## Status

`Ready for Review`

---

## Acceptance Criteria

| # | Criterio | Validacao |
|---|----------|-----------|
| AC1 | Agente `ImageDesigner` implementado em `packages/agents/` | Classe existe e instancia corretamente |
| AC2 | Recebe topico/conteudo como input | Metodo `run()` aceita `ImageDesignerInput` com topic e content |
| AC3 | Gera prompt otimizado para imagem de fundo tech | Prompt gerado inclui descricao visual detalhada |
| AC4 | Prompt inclui: tema abstrato, cores tech, sem texto na imagem | Validacao do prompt gerado contem essas instrucoes |
| AC5 | Solicita imagem via `ImageGenService` | Integracao com servico de geracao de imagem |
| AC6 | Valida qualidade da imagem recebida (dimensoes, formato) | Verificacao de width >= 1080, height >= 1080, formato PNG/JPG |
| AC7 | Salva imagem em `output/images/{post_id}/background.png` | Arquivo salvo no path correto |
| AC8 | Retry com prompt alternativo se qualidade insuficiente | Ate 3 tentativas com prompts variados |
| AC9 | Output: path da imagem + metadata | Retorna `ImageDesignerOutput` com path, dimensions, format, generatedAt |

---

## Tasks

- [x] **Task 1:** Criar interfaces TypeScript do ImageDesigner
  - [x] Criar `packages/agents/src/agents/image-designer/types.ts`
  - [x] Definir interface `ImageDesignerInput` (postId, topic, content, style?)
  - [x] Definir interface `ImageDesignerOutput` (path, metadata)
  - [x] Definir interface `ImageMetadata` (width, height, format, size, generatedAt)
  - [x] Definir interface `ImageDesignerConfig` (outputDir, minWidth, minHeight, maxRetries)
  - [x] Definir interface `PromptTemplate` para geracao de prompts
  - [x] Definir enum `ImageStyle` (re-exported from ImageGenService for consistency)

- [x] **Task 2:** Implementar gerador de prompts otimizados
  - [x] Criar `packages/agents/src/agents/image-designer/prompt-generator.ts`
  - [x] Implementar `generateBackgroundPrompt(topic, content, style)`
  - [x] Incluir instrucoes para tema abstrato tech
  - [x] Incluir instrucoes para paleta de cores tech (azul, roxo, ciano)
  - [x] Incluir instrucao explicita: "no text, no words, no letters"
  - [x] Implementar `generateAlternativePrompt()` para retry
  - [x] Criar lista de templates de prompt variaveis

- [x] **Task 3:** Implementar validador de imagem
  - [x] Criar `packages/agents/src/agents/image-designer/image-validator.ts`
  - [x] Implementar `validateImageDimensions(imagePath, minWidth, minHeight)`
  - [x] Implementar `validateImageFormat(imagePath, allowedFormats)`
  - [x] Implementar `getImageMetadata(imagePath)` retornando ImageMetadata
  - [x] Usar biblioteca `image-size` para leitura de metadata

- [x] **Task 4:** Implementar classe ImageDesignerAgent
  - [x] Criar `packages/agents/src/agents/image-designer/image-designer-agent.ts`
  - [x] Implementar interface `Agent<ImageDesignerInput, ImageDesignerOutput>`
  - [x] Implementar gestao de estado (idle, running, success, error)
  - [x] Implementar metodo `run()` com fluxo completo
  - [x] Integrar com `ImageGenService` para solicitar geracao
  - [x] Implementar logica de retry com prompt alternativo
  - [x] Implementar salvamento em `output/images/{post_id}/background.png`
  - [x] Garantir criacao de diretorios se nao existirem

- [x] **Task 5:** Criar factory function
  - [x] Criar `packages/agents/src/agents/image-designer/factory.ts`
  - [x] Implementar `createImageDesignerAgent(config?: Partial<ImageDesignerConfig>)`
  - [x] Validar configuracao de entrada
  - [x] Definir valores default para config
  - [x] Retornar instancia configurada

- [x] **Task 6:** Criar barrel exports
  - [x] Criar `packages/agents/src/agents/image-designer/index.ts`
  - [x] Atualizar `packages/agents/src/agents/index.ts`
  - [x] Main index already exports via agents barrel

- [x] **Task 7:** Escrever testes unitarios
  - [x] Criar `packages/agents/src/__tests__/image-designer.test.ts`
  - [x] Testar instanciacao do agente
  - [x] Testar geracao de prompt (inclui tema abstrato, cores, sem texto)
  - [x] Testar validacao de imagem (dimensoes, formato)
  - [x] Testar fluxo de retry com prompt alternativo
  - [x] Testar salvamento de imagem no path correto
  - [x] Testar factory function
  - [x] Tests pass without ImageGenService mock (validates error handling)

---

## Dev Notes

### Estrutura do Agente

```
packages/agents/
├── src/
│   ├── agents/
│   │   ├── image-designer/
│   │   │   ├── image-designer-agent.ts
│   │   │   ├── prompt-generator.ts
│   │   │   ├── image-validator.ts
│   │   │   ├── factory.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── curador/
│   │   ├── researcher.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── image-gen/           # Story 3.1 (dependencia)
│   │   │   ├── image-gen-service.ts
│   │   │   └── types.ts
│   │   └── ...
│   ├── __tests__/
│   │   ├── image-designer.test.ts
│   │   └── ...
│   └── index.ts
```

### Interfaces TypeScript

```typescript
// types.ts - Interfaces do ImageDesigner

import { AgentStatus } from '../types';

/**
 * Estilos de imagem de fundo suportados
 */
export enum ImageStyle {
  ABSTRACT = 'abstract',
  GRADIENT = 'gradient',
  GEOMETRIC = 'geometric',
  TECH = 'tech',
  MINIMAL = 'minimal'
}

/**
 * Metadata da imagem gerada
 */
export interface ImageMetadata {
  width: number;
  height: number;
  format: 'png' | 'jpg' | 'webp';
  sizeBytes: number;
  generatedAt: Date;
  prompt: string;
  provider: string;
}

/**
 * Input para o agente ImageDesigner
 */
export interface ImageDesignerInput {
  postId: string;
  topic: string;
  content: string;
  style?: ImageStyle;
  keywords?: string[];
}

/**
 * Output do agente ImageDesigner
 */
export interface ImageDesignerOutput {
  success: boolean;
  imagePath: string;
  metadata: ImageMetadata;
  retryCount: number;
}

/**
 * Configuracao do agente ImageDesigner
 */
export interface ImageDesignerConfig {
  outputDir: string;
  minWidth: number;
  minHeight: number;
  maxRetries: number;
  defaultStyle: ImageStyle;
  allowedFormats: ('png' | 'jpg' | 'webp')[];
}

/**
 * Template para geracao de prompts
 */
export interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
}

/**
 * Resultado da validacao de imagem
 */
export interface ImageValidationResult {
  valid: boolean;
  errors: string[];
  metadata?: ImageMetadata;
}
```

### Gerador de Prompts

```typescript
// prompt-generator.ts

import { ImageStyle, PromptTemplate } from './types';

/**
 * Templates de prompt para diferentes estilos
 */
const PROMPT_TEMPLATES: Record<ImageStyle, PromptTemplate[]> = {
  [ImageStyle.ABSTRACT]: [
    {
      id: 'abstract-1',
      name: 'Abstract Tech Flow',
      template: `Abstract digital background with flowing {color} and {accent} gradients,
        futuristic tech aesthetic, smooth curves and waves, ethereal glow effects,
        dark background with luminescent accents, {topic_essence},
        no text, no words, no letters, no numbers, no symbols,
        high resolution, 4k quality, professional design`,
      variables: ['color', 'accent', 'topic_essence']
    },
    {
      id: 'abstract-2',
      name: 'Abstract Data Streams',
      template: `Abstract visualization of data streams, {color} neon lines on dark background,
        digital particles flowing, tech-inspired patterns, {topic_essence},
        minimalist and modern, no text, no words, no letters,
        clean composition, professional quality`,
      variables: ['color', 'topic_essence']
    }
  ],
  [ImageStyle.GEOMETRIC]: [
    {
      id: 'geometric-1',
      name: 'Tech Geometry',
      template: `Geometric abstract background with {color} polygons and triangles,
        low-poly style, tech aesthetic, dark navy background,
        subtle gradient overlays, {topic_essence},
        no text, no words, no letters, clean design`,
      variables: ['color', 'topic_essence']
    }
  ],
  [ImageStyle.GRADIENT]: [
    {
      id: 'gradient-1',
      name: 'Tech Gradient',
      template: `Smooth gradient background transitioning from {color} to {accent},
        subtle tech-inspired texture overlay, soft glow effects,
        modern and professional, {topic_essence},
        no text, no words, no letters, 4k quality`,
      variables: ['color', 'accent', 'topic_essence']
    }
  ],
  [ImageStyle.TECH]: [
    {
      id: 'tech-1',
      name: 'Circuit Board Abstract',
      template: `Abstract circuit board pattern, glowing {color} traces on dark background,
        futuristic technology aesthetic, {topic_essence},
        subtle depth effect, no text, no words, no letters,
        professional quality, modern design`,
      variables: ['color', 'topic_essence']
    }
  ],
  [ImageStyle.MINIMAL]: [
    {
      id: 'minimal-1',
      name: 'Minimal Dark',
      template: `Minimalist dark background with subtle {color} accent gradient,
        clean and professional, soft vignette effect, {topic_essence},
        no text, no words, no letters, high resolution`,
      variables: ['color', 'topic_essence']
    }
  ]
};

/**
 * Paleta de cores tech
 */
const TECH_COLORS = {
  primary: ['deep blue', 'electric blue', 'cyan', 'teal', 'indigo'],
  accent: ['purple', 'magenta', 'violet', 'pink', 'orange'],
  neutral: ['dark gray', 'charcoal', 'midnight blue', 'dark navy']
};

/**
 * Extrai essencia do topico para o prompt
 */
export function extractTopicEssence(topic: string, content: string): string {
  // Extrai palavras-chave relacionadas a tech
  const techKeywords = [
    'code', 'programming', 'software', 'development', 'data',
    'cloud', 'api', 'database', 'algorithm', 'machine learning',
    'artificial intelligence', 'web', 'mobile', 'security', 'devops'
  ];

  const combined = `${topic} ${content}`.toLowerCase();
  const foundKeywords = techKeywords.filter(kw => combined.includes(kw));

  if (foundKeywords.length > 0) {
    return `inspired by ${foundKeywords.slice(0, 2).join(' and ')} concepts`;
  }

  return 'tech-inspired modern aesthetic';
}

/**
 * Gera prompt otimizado para imagem de fundo
 */
export function generateBackgroundPrompt(
  topic: string,
  content: string,
  style: ImageStyle = ImageStyle.ABSTRACT
): string {
  const templates = PROMPT_TEMPLATES[style];
  const template = templates[Math.floor(Math.random() * templates.length)];

  const color = TECH_COLORS.primary[Math.floor(Math.random() * TECH_COLORS.primary.length)];
  const accent = TECH_COLORS.accent[Math.floor(Math.random() * TECH_COLORS.accent.length)];
  const topicEssence = extractTopicEssence(topic, content);

  let prompt = template.template;
  prompt = prompt.replace(/{color}/g, color);
  prompt = prompt.replace(/{accent}/g, accent);
  prompt = prompt.replace(/{topic_essence}/g, topicEssence);

  return prompt.trim().replace(/\s+/g, ' ');
}

/**
 * Gera prompt alternativo para retry
 */
export function generateAlternativePrompt(
  topic: string,
  content: string,
  previousStyle: ImageStyle,
  attemptNumber: number
): string {
  // Alterna entre estilos para retry
  const styles = Object.values(ImageStyle);
  const newStyle = styles[(styles.indexOf(previousStyle) + attemptNumber) % styles.length];

  return generateBackgroundPrompt(topic, content, newStyle);
}
```

### Validador de Imagem

```typescript
// image-validator.ts

import * as fs from 'fs';
import * as path from 'path';
import sizeOf from 'image-size';
import { ImageMetadata, ImageValidationResult, ImageDesignerConfig } from './types';

/**
 * Obtem metadata de uma imagem
 */
export async function getImageMetadata(
  imagePath: string,
  prompt: string,
  provider: string
): Promise<ImageMetadata> {
  const stats = fs.statSync(imagePath);
  const dimensions = sizeOf(imagePath);

  const ext = path.extname(imagePath).toLowerCase().slice(1);
  const format = ext === 'jpeg' ? 'jpg' : ext as 'png' | 'jpg' | 'webp';

  return {
    width: dimensions.width ?? 0,
    height: dimensions.height ?? 0,
    format,
    sizeBytes: stats.size,
    generatedAt: new Date(),
    prompt,
    provider
  };
}

/**
 * Valida dimensoes da imagem
 */
export function validateImageDimensions(
  metadata: ImageMetadata,
  minWidth: number,
  minHeight: number
): { valid: boolean; error?: string } {
  if (metadata.width < minWidth) {
    return {
      valid: false,
      error: `Image width ${metadata.width}px is less than minimum ${minWidth}px`
    };
  }

  if (metadata.height < minHeight) {
    return {
      valid: false,
      error: `Image height ${metadata.height}px is less than minimum ${minHeight}px`
    };
  }

  return { valid: true };
}

/**
 * Valida formato da imagem
 */
export function validateImageFormat(
  metadata: ImageMetadata,
  allowedFormats: ('png' | 'jpg' | 'webp')[]
): { valid: boolean; error?: string } {
  if (!allowedFormats.includes(metadata.format)) {
    return {
      valid: false,
      error: `Image format ${metadata.format} is not allowed. Allowed: ${allowedFormats.join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Valida imagem completa
 */
export async function validateImage(
  imagePath: string,
  config: ImageDesignerConfig,
  prompt: string,
  provider: string
): Promise<ImageValidationResult> {
  const errors: string[] = [];

  // Verifica se arquivo existe
  if (!fs.existsSync(imagePath)) {
    return {
      valid: false,
      errors: [`Image file not found: ${imagePath}`]
    };
  }

  // Obtem metadata
  const metadata = await getImageMetadata(imagePath, prompt, provider);

  // Valida dimensoes
  const dimensionResult = validateImageDimensions(
    metadata,
    config.minWidth,
    config.minHeight
  );
  if (!dimensionResult.valid && dimensionResult.error) {
    errors.push(dimensionResult.error);
  }

  // Valida formato
  const formatResult = validateImageFormat(metadata, config.allowedFormats);
  if (!formatResult.valid && formatResult.error) {
    errors.push(formatResult.error);
  }

  return {
    valid: errors.length === 0,
    errors,
    metadata
  };
}
```

### Classe ImageDesignerAgent

```typescript
// image-designer-agent.ts

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { Agent, AgentResult, AgentStatus } from '../types';
import {
  ImageDesignerConfig,
  ImageDesignerInput,
  ImageDesignerOutput,
  ImageStyle,
  ImageMetadata
} from './types';
import { generateBackgroundPrompt, generateAlternativePrompt } from './prompt-generator';
import { validateImage } from './image-validator';
// import { ImageGenService } from '../../services/image-gen'; // Story 3.1

export class ImageDesignerAgent
  extends EventEmitter
  implements Agent<ImageDesignerInput, ImageDesignerOutput> {

  readonly name = 'ImageDesignerAgent';
  private _status: AgentStatus = AgentStatus.IDLE;
  private config: ImageDesignerConfig;
  // private imageGenService: ImageGenService;

  constructor(config: ImageDesignerConfig) {
    super();
    this.config = config;
    // this.imageGenService = imageGenService;
  }

  get status(): AgentStatus {
    return this._status;
  }

  private setStatus(newStatus: AgentStatus): void {
    const previous = this._status;
    this._status = newStatus;
    this.emit('statusChange', { previous, current: newStatus });
  }

  /**
   * Executa o agente para gerar imagem de fundo
   */
  async run(input: ImageDesignerInput): Promise<AgentResult<ImageDesignerOutput>> {
    const startTime = Date.now();
    this.setStatus(AgentStatus.RUNNING);

    const style = input.style ?? this.config.defaultStyle;
    let retryCount = 0;
    let lastError: string | undefined;
    let currentPrompt = generateBackgroundPrompt(input.topic, input.content, style);

    try {
      while (retryCount <= this.config.maxRetries) {
        this.emit('attempt', { retryCount, prompt: currentPrompt });

        // Gera imagem via ImageGenService
        // const imageResult = await this.imageGenService.generate({
        //   prompt: currentPrompt,
        //   width: this.config.minWidth,
        //   height: this.config.minHeight,
        //   format: 'png'
        // });

        // Placeholder para integracao com ImageGenService (Story 3.1)
        const imageResult = {
          success: true,
          imagePath: '', // Sera preenchido pelo servico
          provider: 'placeholder'
        };

        if (!imageResult.success) {
          lastError = 'Image generation failed';
          retryCount++;
          currentPrompt = generateAlternativePrompt(
            input.topic,
            input.content,
            style,
            retryCount
          );
          continue;
        }

        // Define path de saida
        const outputDir = path.join(this.config.outputDir, input.postId);
        const outputPath = path.join(outputDir, 'background.png');

        // Cria diretorio se nao existir
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        // Copia/move imagem para destino final
        // fs.copyFileSync(imageResult.imagePath, outputPath);

        // Valida imagem
        const validationResult = await validateImage(
          outputPath,
          this.config,
          currentPrompt,
          imageResult.provider
        );

        if (validationResult.valid && validationResult.metadata) {
          this.setStatus(AgentStatus.SUCCESS);

          return {
            success: true,
            data: {
              success: true,
              imagePath: outputPath,
              metadata: validationResult.metadata,
              retryCount
            },
            duration: Date.now() - startTime,
            timestamp: new Date()
          };
        }

        // Validacao falhou, tenta novamente
        lastError = validationResult.errors.join('; ');
        retryCount++;
        currentPrompt = generateAlternativePrompt(
          input.topic,
          input.content,
          style,
          retryCount
        );
      }

      // Esgotou tentativas
      this.setStatus(AgentStatus.ERROR);
      return {
        success: false,
        error: `Failed after ${this.config.maxRetries} retries. Last error: ${lastError}`,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

    } catch (error) {
      this.setStatus(AgentStatus.ERROR);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  /**
   * Retorna configuracao atual (copia)
   */
  getConfig(): ImageDesignerConfig {
    return { ...this.config };
  }
}
```

### Factory Function

```typescript
// factory.ts

import { ImageDesignerAgent } from './image-designer-agent';
import { ImageDesignerConfig, ImageStyle } from './types';

/**
 * Configuracao padrao do ImageDesigner
 */
const DEFAULT_CONFIG: ImageDesignerConfig = {
  outputDir: 'output/images',
  minWidth: 1080,
  minHeight: 1080,
  maxRetries: 3,
  defaultStyle: ImageStyle.ABSTRACT,
  allowedFormats: ['png', 'jpg', 'webp']
};

/**
 * Cria instancia do ImageDesignerAgent
 */
export function createImageDesignerAgent(
  config?: Partial<ImageDesignerConfig>
): ImageDesignerAgent {
  const mergedConfig: ImageDesignerConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    allowedFormats: config?.allowedFormats ?? DEFAULT_CONFIG.allowedFormats
  };

  validateConfig(mergedConfig);

  return new ImageDesignerAgent(mergedConfig);
}

/**
 * Valida configuracao
 */
function validateConfig(config: ImageDesignerConfig): void {
  if (config.minWidth < 100) {
    throw new Error('minWidth must be at least 100 pixels');
  }

  if (config.minHeight < 100) {
    throw new Error('minHeight must be at least 100 pixels');
  }

  if (config.maxRetries < 0) {
    throw new Error('maxRetries must be non-negative');
  }

  if (config.maxRetries > 10) {
    throw new Error('maxRetries must not exceed 10');
  }

  if (!config.outputDir || config.outputDir.trim() === '') {
    throw new Error('outputDir must be specified');
  }

  if (config.allowedFormats.length === 0) {
    throw new Error('At least one allowed format must be specified');
  }
}
```

---

## Testing

### Testes de Instanciacao

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ImageDesignerAgent,
  createImageDesignerAgent,
  ImageStyle,
  ImageDesignerInput
} from '../agents/image-designer';
import { AgentStatus } from '../agents/types';

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
        maxRetries: 5
      });
      expect(agent).toBeInstanceOf(ImageDesignerAgent);
      expect(agent.getConfig().minWidth).toBe(1200);
    });

    it('should start in IDLE status', () => {
      const agent = createImageDesignerAgent();
      expect(agent.status).toBe(AgentStatus.IDLE);
    });
  });
});
```

### Testes de Geracao de Prompt

```typescript
import { generateBackgroundPrompt, extractTopicEssence } from '../agents/image-designer/prompt-generator';
import { ImageStyle } from '../agents/image-designer/types';

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
      const prompt = generateBackgroundPrompt(
        'TypeScript',
        'Type safety for JavaScript',
        ImageStyle.TECH
      );

      // Should contain at least one tech color
      const hasColor = ['blue', 'cyan', 'purple', 'indigo', 'teal']
        .some(color => prompt.toLowerCase().includes(color));
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

      expect(prompt.toLowerCase()).toMatch(/geometric|polygon|triangle/);
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

    it('should return default essence when no keywords found', () => {
      const essence = extractTopicEssence(
        'Random Topic',
        'Some random content'
      );

      expect(essence).toContain('tech-inspired');
    });
  });
});
```

### Testes de Validacao de Imagem

```typescript
import { validateImageDimensions, validateImageFormat } from '../agents/image-designer/image-validator';
import { ImageMetadata } from '../agents/image-designer/types';

describe('Image Validator', () => {
  const mockMetadata: ImageMetadata = {
    width: 1080,
    height: 1080,
    format: 'png',
    sizeBytes: 500000,
    generatedAt: new Date(),
    prompt: 'test prompt',
    provider: 'test'
  };

  describe('validateImageDimensions', () => {
    it('should pass for valid dimensions', () => {
      const result = validateImageDimensions(mockMetadata, 1080, 1080);
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
    });

    it('should fail for insufficient height', () => {
      const result = validateImageDimensions(
        { ...mockMetadata, height: 500 },
        1080,
        1080
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('height');
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
  });
});
```

### Testes de Retry

```typescript
describe('ImageDesignerAgent retry logic', () => {
  it('should retry with alternative prompt on failure', async () => {
    const agent = createImageDesignerAgent({ maxRetries: 2 });
    const attempts: string[] = [];

    agent.on('attempt', ({ prompt }) => {
      attempts.push(prompt);
    });

    // Mock para simular falha e depois sucesso
    // const mockImageGenService = vi.mock(...)

    const input: ImageDesignerInput = {
      postId: 'test-123',
      topic: 'React Testing',
      content: 'How to test React components'
    };

    // await agent.run(input);

    // Verifica que prompts sao diferentes em cada tentativa
    // expect(new Set(attempts).size).toBe(attempts.length);
  });

  it('should not exceed maxRetries', async () => {
    const agent = createImageDesignerAgent({ maxRetries: 3 });
    let attemptCount = 0;

    agent.on('attempt', () => {
      attemptCount++;
    });

    const input: ImageDesignerInput = {
      postId: 'test-456',
      topic: 'Error Handling',
      content: 'Try catch best practices'
    };

    // Mock para sempre falhar
    // const result = await agent.run(input);

    // expect(attemptCount).toBeLessThanOrEqual(4); // initial + 3 retries
    // expect(result.success).toBe(false);
  });
});
```

### Testes da Factory

```typescript
describe('createImageDesignerAgent factory', () => {
  it('should throw on invalid minWidth', () => {
    expect(() => createImageDesignerAgent({ minWidth: 50 }))
      .toThrow('minWidth must be at least 100 pixels');
  });

  it('should throw on invalid minHeight', () => {
    expect(() => createImageDesignerAgent({ minHeight: 0 }))
      .toThrow('minHeight must be at least 100 pixels');
  });

  it('should throw on negative maxRetries', () => {
    expect(() => createImageDesignerAgent({ maxRetries: -1 }))
      .toThrow('maxRetries must be non-negative');
  });

  it('should throw on excessive maxRetries', () => {
    expect(() => createImageDesignerAgent({ maxRetries: 15 }))
      .toThrow('maxRetries must not exceed 10');
  });

  it('should throw on empty outputDir', () => {
    expect(() => createImageDesignerAgent({ outputDir: '' }))
      .toThrow('outputDir must be specified');
  });

  it('should throw on empty allowedFormats', () => {
    expect(() => createImageDesignerAgent({ allowedFormats: [] }))
      .toThrow('At least one allowed format must be specified');
  });

  it('should merge config with defaults', () => {
    const agent = createImageDesignerAgent({ maxRetries: 5 });
    const config = agent.getConfig();

    expect(config.maxRetries).toBe(5);
    expect(config.minWidth).toBe(1080); // default
    expect(config.minHeight).toBe(1080); // default
  });
});
```

---

## References

- [PRD](../prd.md) - Epic 3: Geracao Visual, Story 3.2
- [Architecture](../architecture.md) - Agent Layer
- [Brief](../brief.md) - Agente Designer de Imagens
- [Story 3.1](./story-3.1.md) - Servico de Geracao de Imagem (dependencia)
- [Story 2.1](./story-2.1.md) - CuradorAgent (padrao de referencia)

---

## Dependencies

| Dependencia | Tipo | Story |
|-------------|------|-------|
| ImageGenService | Service | Story 3.1 |
| @social-content/shared | Package | Story 1.4 |
| image-size (npm) | Library | - |
| sharp (npm) | Library (opcional) | - |

---

## Dev Agent Record

### File List

| Status | File | Changes |
|--------|------|---------|
| Created | `packages/agents/src/agents/image-designer/types.ts` | TypeScript interfaces and types |
| Created | `packages/agents/src/agents/image-designer/prompt-generator.ts` | Prompt generation with templates |
| Created | `packages/agents/src/agents/image-designer/image-validator.ts` | Image validation utilities |
| Created | `packages/agents/src/agents/image-designer/image-designer-agent.ts` | Main agent class |
| Created | `packages/agents/src/agents/image-designer/factory.ts` | Factory function with validation |
| Created | `packages/agents/src/agents/image-designer/index.ts` | Barrel exports |
| Modified | `packages/agents/src/agents/index.ts` | Added ImageDesigner exports |
| Modified | `packages/agents/src/services/image-gen/index.ts` | Updated exports for compatibility |
| Created | `packages/agents/src/__tests__/image-designer.test.ts` | 66 unit tests |
| Modified | `packages/agents/package.json` | Added image-size dependency |

### Debug Log

_No debug entries_

### Completion Notes

Story 3.2 implemented successfully:
- ImageDesignerAgent class with full lifecycle management (IDLE, RUNNING, SUCCESS, ERROR states)
- Prompt generator with 7 styles (ABSTRACT, TECH, GRADIENT, MINIMAL, FUTURISTIC, GEOMETRIC, NEON)
- All prompts include safety instructions ("no text, no words, no letters")
- Image validation for dimensions, format, and file size
- Factory function with comprehensive config validation
- Full integration with ImageGenService (Story 3.1)
- 66 unit tests covering all functionality

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story created | Claude Opus 4.5 |
| 2026-01-28 | Story implemented - all tasks complete | Dex (Dev Agent) |
| 2026-01-28 | QA Review completed - PASS | Quinn (QA Agent) |

---

## QA Results

### Gate Decision: **PASS**

**Reviewer:** Quinn (QA Agent)
**Date:** 2026-01-28
**Status:** Ready for Merge

---

### Test Results Summary

| Metric | Result |
|--------|--------|
| Total Tests | 66 |
| Passed | 66 |
| Failed | 0 |
| Skipped | 0 |
| TypeScript Typecheck | PASS |
| ESLint | PASS |

**Test Coverage Areas:**
- Agent instantiation (4 tests)
- Default config (2 tests)
- Agent config (2 tests)
- Lifecycle management (5 tests)
- State change events (2 tests)
- ImageGenService integration (2 tests)
- Factory validation (10 tests)
- Prompt generation (12 tests)
- Image validation (15 tests)
- Integration tests (2 tests)

---

### Acceptance Criteria Verification

| AC# | Criteria | Status | Evidence |
|-----|----------|--------|----------|
| AC1 | Agente `ImageDesigner` implementado em `packages/agents/` | PASS | Class `ImageDesignerAgent` exists in `packages/agents/src/agents/image-designer/image-designer-agent.ts`, instantiates correctly via factory |
| AC2 | Recebe topico/conteudo como input | PASS | `run()` method accepts `ImageDesignerInput` with `postId`, `topic`, `content`, `style?`, `keywords?` |
| AC3 | Gera prompt otimizado para imagem de fundo tech | PASS | `generateBackgroundPrompt()` generates detailed prompts with tech themes, tested with 7 styles |
| AC4 | Prompt inclui: tema abstrato, cores tech, sem texto | PASS | All prompts include "no text, no words, no letters"; validated by `validatePromptSafety()` |
| AC5 | Solicita imagem via `ImageGenService` | PASS | Integration via `setImageGenService()` and `run()` uses `ImageGenService.generate()` |
| AC6 | Valida qualidade da imagem (dimensoes, formato) | PASS | `validateImage()` checks width >= 1080, height >= 1080, format PNG/JPG/WebP |
| AC7 | Salva imagem em `output/images/{post_id}/background.png` | PASS | `getOutputPath()` generates correct path; `ensureOutputDirectory()` creates dirs |
| AC8 | Retry com prompt alternativo se qualidade insuficiente | PASS | `generateAlternativePrompt()` rotates through styles; `maxRetries` config (default 3) |
| AC9 | Output: path da imagem + metadata | PASS | Returns `ImageDesignerOutput` with `imagePath`, `metadata` (width, height, format, sizeBytes, generatedAt, prompt, provider), `retryCount` |

---

### Code Quality Review

#### TypeScript Strict Mode Compliance
- **Status:** PASS
- All types properly defined in `types.ts`
- No `any` types used
- Proper type imports with `import type` syntax
- Interfaces well-documented with JSDoc comments

#### Error Handling
- **Status:** PASS
- Comprehensive try/catch in `run()` method
- Graceful degradation when ImageGenService not configured
- Validation errors collected and returned in `ImageValidationResult.errors[]`
- Proper error messages with context

#### Code Organization
- **Status:** PASS
- Clean modular structure:
  - `types.ts` - All TypeScript interfaces
  - `prompt-generator.ts` - Prompt creation logic
  - `image-validator.ts` - Validation utilities
  - `image-designer-agent.ts` - Main agent class
  - `factory.ts` - Factory function with validation
  - `index.ts` - Barrel exports
- Proper separation of concerns
- Reusable utility functions exported

#### Dependencies
- **Status:** PASS
- `image-size` properly added as devDependency in package.json
- Integration with `ImageGenService` from Story 3.1 confirmed
- Uses shared types from agent system

---

### Notes

1. **Integration Ready:** The agent correctly integrates with `ImageGenService` from Story 3.1, using proper dependency injection via `setImageGenService()`.

2. **Prompt Safety:** All 7 image styles (ABSTRACT, TECH, GRADIENT, MINIMAL, FUTURISTIC, GEOMETRIC, NEON) include explicit "no text, no words, no letters" instructions.

3. **Retry Logic:** Alternative prompts rotate through different styles to maximize chances of successful image generation.

4. **File Structure:** Follows established patterns from CuradorAgent (Story 2.1) for consistency.

---
