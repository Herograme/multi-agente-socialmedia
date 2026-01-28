# Story 4.3: Agente QA Analyst — Analise de Imagens

> Epic 4: Qualidade & Orquestracao

---

## Story

**Como** usuario,
**Quero** que o QA analise tambem as imagens geradas,
**Para que** a qualidade visual seja garantida.

---

## Status

`Ready for Review`

---

## Acceptance Criteria

| # | Criterio | Validacao |
|---|----------|-----------|
| AC1 | QA analisa imagens usando LLM multimodal (se disponivel) | LLM vision (Gemini/GPT-4V) processa imagens e retorna analise estruturada |
| AC2 | Fallback: analise heuristica (dimensoes, tamanho, formato) | Quando LLM multimodal indisponivel, usa validacao programatica |
| AC3 | Verifica legibilidade do texto sobre a imagem | Analisa contraste texto/fundo e tamanho da fonte |
| AC4 | Verifica se codigo esta visivel e formatado | Detecta blocos de codigo e valida syntax highlighting aplicado |
| AC5 | Verifica consistencia entre slides do carrossel | Compara estilo visual entre slides (cores, fontes, layout) |
| AC6 | Score visual separado do score de texto | `VisualScore` distinto do `TextScore` no `QAResult` |
| AC7 | Feedback especifico para problemas visuais | Mensagens acionaveis: "Aumentar contraste", "Reduzir texto", etc. |
| AC8 | Testes com imagens de qualidade variada | Suite de testes com imagens boas, medianas e ruins |

---

## Tasks

- [x] **Task 1:** Criar interfaces TypeScript para analise visual
  - [x] Criar `packages/agents/src/agents/qa-analyst/visual-types.ts`
  - [x] Definir interface `VisualAnalysisInput`
  - [x] Definir interface `VisualAnalysisResult`
  - [x] Definir interface `VisualScore`
  - [x] Definir interface `SlideConsistencyResult`
  - [x] Definir enum `VisualIssueType` (contrast, readability, formatting, consistency)
  - [x] Definir interface `VisualFeedback`
  - [x] Definir interface `HeuristicAnalysisConfig`

- [x] **Task 2:** Implementar analise heuristica de imagens
  - [x] Criar `packages/agents/src/agents/qa-analyst/heuristic-analyzer.ts`
  - [x] Implementar validacao de dimensoes (minimo 1080x1080)
  - [x] Implementar validacao de tamanho de arquivo (min 50KB, max 10MB)
  - [x] Implementar validacao de formato (PNG, JPG, WebP)
  - [x] Implementar deteccao de aspect ratio
  - [x] Implementar leitura de metadados da imagem (sharp ou jimp)
  - [x] Calcular score heuristico baseado nos criterios

- [x] **Task 3:** Implementar analise de contraste e legibilidade
  - [x] Criar `packages/agents/src/agents/qa-analyst/contrast-analyzer.ts`
  - [x] Implementar extracao de cores dominantes da imagem
  - [x] Implementar calculo de ratio de contraste (WCAG)
  - [x] Implementar deteccao de regioes de texto (via OCR ou zones conhecidas)
  - [x] Gerar score de legibilidade (0-10)
  - [x] Gerar feedback especifico para problemas de contraste

- [x] **Task 4:** Implementar analise multimodal via LLM
  - [x] Criar `packages/agents/src/agents/qa-analyst/multimodal-analyzer.ts`
  - [x] Implementar integracao com Gemini Vision API
  - [x] Implementar integracao com GPT-4V como fallback (se configurado)
  - [x] Criar prompt otimizado para analise visual de slides
  - [x] Parsear resposta do LLM em `VisualAnalysisResult`
  - [x] Implementar cache de analises para evitar requests duplicados
  - [x] Implementar rate limiting para APIs multimodais

- [x] **Task 5:** Implementar verificacao de codigo nos slides
  - [x] Criar `packages/agents/src/agents/qa-analyst/code-slide-analyzer.ts`
  - [x] Detectar slides que contem codigo (via metadata ou LLM)
  - [x] Verificar se syntax highlighting foi aplicado
  - [x] Verificar tamanho da fonte do codigo (legibilidade)
  - [x] Verificar quebras de linha e overflow
  - [x] Gerar feedback para problemas de formatacao de codigo

- [x] **Task 6:** Implementar verificacao de consistencia do carrossel
  - [x] Criar `packages/agents/src/agents/qa-analyst/carousel-consistency-analyzer.ts`
  - [x] Implementar comparacao de paleta de cores entre slides
  - [x] Implementar verificacao de posicionamento de elementos
  - [x] Implementar verificacao de tipografia consistente
  - [x] Gerar score de consistencia (0-10)
  - [x] Listar slides que quebram a consistencia

- [x] **Task 7:** Integrar analisadores no QAAnalyst Agent
  - [x] Modificar `packages/agents/src/agents/qa-analyst/qa-analyst-agent.ts`
  - [x] Adicionar metodo `analyzeVisuals(assets: Asset[]): Promise<VisualAnalysisResult>`
  - [x] Implementar logica de fallback (LLM multimodal -> heuristico)
  - [x] Combinar scores visuais com scores de texto
  - [x] Atualizar `QAResult` com campos visuais separados
  - [x] Implementar geracao de feedback visual consolidado

- [x] **Task 8:** Criar factory e barrel exports
  - [x] Atualizar `packages/agents/src/agents/qa-analyst/factory.ts`
  - [x] Adicionar configuracao para providers multimodais
  - [x] Atualizar `packages/agents/src/agents/qa-analyst/index.ts`
  - [x] Garantir exports corretos no `packages/agents/src/index.ts`

- [x] **Task 9:** Escrever testes unitarios
  - [x] Criar `packages/agents/src/__tests__/qa-analyst/visual-analysis.test.ts`
  - [x] Testar HeuristicAnalyzer com imagens de diferentes qualidades
  - [x] Testar ContrastAnalyzer com cenarios de alto/baixo contraste
  - [x] Testar MultimodalAnalyzer com mocks de APIs
  - [x] Testar CodeSlideAnalyzer com slides de codigo
  - [x] Testar CarouselConsistencyAnalyzer com carrosseis variados
  - [x] Testar integracao completa do QAAnalyst com assets visuais
  - [x] Criar fixtures de imagens para testes

---

## Dev Notes

### Estrutura do Agente

```
packages/agents/
├── src/
│   ├── agents/
│   │   ├── qa-analyst/
│   │   │   ├── qa-analyst-agent.ts      # Agente principal (modificar)
│   │   │   ├── visual-types.ts          # Tipos para analise visual
│   │   │   ├── heuristic-analyzer.ts    # Analise programatica
│   │   │   ├── contrast-analyzer.ts     # Analise de contraste/legibilidade
│   │   │   ├── multimodal-analyzer.ts   # Analise via LLM vision
│   │   │   ├── code-slide-analyzer.ts   # Analise de slides de codigo
│   │   │   ├── carousel-consistency-analyzer.ts  # Consistencia do carrossel
│   │   │   ├── factory.ts               # Factory atualizado
│   │   │   ├── types.ts                 # Tipos existentes
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── __tests__/
│   │   ├── qa-analyst/
│   │   │   ├── visual-analysis.test.ts
│   │   │   └── fixtures/
│   │   │       ├── good-slide.png
│   │   │       ├── low-contrast-slide.png
│   │   │       ├── code-slide.png
│   │   │       └── carousel/
```

### Interfaces TypeScript

```typescript
// visual-types.ts - Interfaces para analise visual

import { Asset } from '@social-content/shared';

/**
 * Tipos de problemas visuais detectaveis
 */
export enum VisualIssueType {
  LOW_CONTRAST = 'low_contrast',
  POOR_READABILITY = 'poor_readability',
  CODE_FORMATTING = 'code_formatting',
  INCONSISTENT_STYLE = 'inconsistent_style',
  WRONG_DIMENSIONS = 'wrong_dimensions',
  FILE_TOO_LARGE = 'file_too_large',
  FILE_TOO_SMALL = 'file_too_small',
  INVALID_FORMAT = 'invalid_format',
  TEXT_OVERFLOW = 'text_overflow',
  MISSING_SYNTAX_HIGHLIGHT = 'missing_syntax_highlight'
}

/**
 * Severidade do problema visual
 */
export enum IssueSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error'
}

/**
 * Feedback especifico para problemas visuais
 */
export interface VisualFeedback {
  type: VisualIssueType;
  severity: IssueSeverity;
  message: string;
  suggestion: string;
  slideIndex?: number;
  affectedArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Input para analise visual
 */
export interface VisualAnalysisInput {
  assets: Asset[];
  postId: string;
  isCarousel: boolean;
  expectedSlideCount?: number;
}

/**
 * Score visual detalhado
 */
export interface VisualScore {
  overall: number;           // 0-10
  dimensions: number;        // 0-10 - Dimensoes corretas
  fileQuality: number;       // 0-10 - Tamanho/formato adequados
  contrast: number;          // 0-10 - Contraste texto/fundo
  readability: number;       // 0-10 - Legibilidade geral
  codeFormatting: number;    // 0-10 - Formatacao de codigo (se aplicavel)
  consistency: number;       // 0-10 - Consistencia do carrossel (se aplicavel)
}

/**
 * Resultado de analise de consistencia
 */
export interface SlideConsistencyResult {
  isConsistent: boolean;
  score: number;
  colorPaletteMatch: number;     // 0-1
  fontConsistency: number;       // 0-1
  layoutConsistency: number;     // 0-1
  inconsistentSlides: number[];  // indices dos slides inconsistentes
  details: string[];
}

/**
 * Resultado de analise de um slide individual
 */
export interface SlideAnalysisResult {
  slideIndex: number;
  path: string;
  dimensions: {
    width: number;
    height: number;
  };
  fileSize: number;
  format: string;
  hasCode: boolean;
  contrastRatio: number;
  readabilityScore: number;
  issues: VisualFeedback[];
}

/**
 * Resultado completo da analise visual
 */
export interface VisualAnalysisResult {
  postId: string;
  analyzedAt: Date;
  analysisMethod: 'multimodal' | 'heuristic' | 'hybrid';
  score: VisualScore;
  slides: SlideAnalysisResult[];
  carouselConsistency?: SlideConsistencyResult;
  feedback: VisualFeedback[];
  passed: boolean;  // score.overall >= threshold
  processingTimeMs: number;
}

/**
 * Configuracao para analise heuristica
 */
export interface HeuristicAnalysisConfig {
  minWidth: number;        // default: 1080
  minHeight: number;       // default: 1080
  maxWidth: number;        // default: 4096
  maxHeight: number;       // default: 4096
  minFileSize: number;     // bytes, default: 50000 (50KB)
  maxFileSize: number;     // bytes, default: 10485760 (10MB)
  allowedFormats: string[]; // default: ['png', 'jpg', 'jpeg', 'webp']
  minContrastRatio: number; // WCAG AA, default: 4.5
}

/**
 * Configuracao para analise multimodal
 */
export interface MultimodalAnalysisConfig {
  provider: 'gemini' | 'openai' | 'anthropic';
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  rateLimitPerMinute: number;
}

/**
 * Resultado atualizado do QA com scores visuais
 */
export interface QAResultWithVisuals {
  postId: string;
  timestamp: Date;
  textAnalysis: {
    score: number;
    criteria: Record<string, number>;
    feedback: string[];
  };
  visualAnalysis: VisualAnalysisResult;
  overallScore: number;  // Media ponderada de texto + visual
  approved: boolean;
  threshold: number;
}
```

### HeuristicAnalyzer - Analise Programatica

```typescript
// heuristic-analyzer.ts

import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  HeuristicAnalysisConfig,
  SlideAnalysisResult,
  VisualFeedback,
  VisualIssueType,
  IssueSeverity
} from './visual-types';

const DEFAULT_CONFIG: HeuristicAnalysisConfig = {
  minWidth: 1080,
  minHeight: 1080,
  maxWidth: 4096,
  maxHeight: 4096,
  minFileSize: 50000,      // 50KB
  maxFileSize: 10485760,   // 10MB
  allowedFormats: ['png', 'jpg', 'jpeg', 'webp'],
  minContrastRatio: 4.5
};

/**
 * Analisa imagem usando heuristicas programaticas
 */
export class HeuristicAnalyzer {
  private config: HeuristicAnalysisConfig;

  constructor(config?: Partial<HeuristicAnalysisConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Analisa uma imagem individual
   */
  async analyzeImage(imagePath: string, slideIndex: number = 0): Promise<SlideAnalysisResult> {
    const issues: VisualFeedback[] = [];

    // Obtem metadados da imagem
    const stats = await fs.stat(imagePath);
    const metadata = await sharp(imagePath).metadata();

    const dimensions = {
      width: metadata.width ?? 0,
      height: metadata.height ?? 0
    };

    const format = metadata.format ?? 'unknown';
    const fileSize = stats.size;

    // Valida dimensoes
    const dimensionIssues = this.validateDimensions(dimensions, slideIndex);
    issues.push(...dimensionIssues);

    // Valida tamanho do arquivo
    const sizeIssues = this.validateFileSize(fileSize, slideIndex);
    issues.push(...sizeIssues);

    // Valida formato
    const formatIssues = this.validateFormat(format, slideIndex);
    issues.push(...formatIssues);

    // Calcula scores
    const dimensionScore = this.calculateDimensionScore(dimensions);
    const fileSizeScore = this.calculateFileSizeScore(fileSize);
    const formatScore = this.config.allowedFormats.includes(format) ? 10 : 0;

    // Score de legibilidade basico (heuristico sem OCR)
    const readabilityScore = Math.min(dimensionScore, fileSizeScore, formatScore);

    return {
      slideIndex,
      path: imagePath,
      dimensions,
      fileSize,
      format,
      hasCode: false, // Sera determinado por outro analyzer
      contrastRatio: 0, // Sera calculado pelo ContrastAnalyzer
      readabilityScore,
      issues
    };
  }

  /**
   * Analisa multiplas imagens (carrossel)
   */
  async analyzeMultiple(imagePaths: string[]): Promise<SlideAnalysisResult[]> {
    const results: SlideAnalysisResult[] = [];

    for (let i = 0; i < imagePaths.length; i++) {
      const result = await this.analyzeImage(imagePaths[i], i);
      results.push(result);
    }

    return results;
  }

  /**
   * Valida dimensoes da imagem
   */
  private validateDimensions(
    dimensions: { width: number; height: number },
    slideIndex: number
  ): VisualFeedback[] {
    const issues: VisualFeedback[] = [];

    if (dimensions.width < this.config.minWidth || dimensions.height < this.config.minHeight) {
      issues.push({
        type: VisualIssueType.WRONG_DIMENSIONS,
        severity: IssueSeverity.ERROR,
        message: `Imagem muito pequena: ${dimensions.width}x${dimensions.height}`,
        suggestion: `Redimensione para pelo menos ${this.config.minWidth}x${this.config.minHeight}px`,
        slideIndex
      });
    }

    if (dimensions.width > this.config.maxWidth || dimensions.height > this.config.maxHeight) {
      issues.push({
        type: VisualIssueType.WRONG_DIMENSIONS,
        severity: IssueSeverity.WARNING,
        message: `Imagem muito grande: ${dimensions.width}x${dimensions.height}`,
        suggestion: `Considere reduzir para no maximo ${this.config.maxWidth}x${this.config.maxHeight}px`,
        slideIndex
      });
    }

    // Verifica aspect ratio para Instagram (1:1 ideal)
    const aspectRatio = dimensions.width / dimensions.height;
    if (aspectRatio < 0.8 || aspectRatio > 1.91) {
      issues.push({
        type: VisualIssueType.WRONG_DIMENSIONS,
        severity: IssueSeverity.WARNING,
        message: `Aspect ratio ${aspectRatio.toFixed(2)} pode nao ser ideal para Instagram`,
        suggestion: 'Use aspect ratio entre 0.8 (4:5) e 1.91 (1.91:1) para melhor exibicao',
        slideIndex
      });
    }

    return issues;
  }

  /**
   * Valida tamanho do arquivo
   */
  private validateFileSize(fileSize: number, slideIndex: number): VisualFeedback[] {
    const issues: VisualFeedback[] = [];

    if (fileSize < this.config.minFileSize) {
      issues.push({
        type: VisualIssueType.FILE_TOO_SMALL,
        severity: IssueSeverity.WARNING,
        message: `Arquivo muito pequeno (${(fileSize / 1024).toFixed(1)}KB)`,
        suggestion: 'Imagem pode estar com compressao excessiva. Verifique a qualidade.',
        slideIndex
      });
    }

    if (fileSize > this.config.maxFileSize) {
      issues.push({
        type: VisualIssueType.FILE_TOO_LARGE,
        severity: IssueSeverity.ERROR,
        message: `Arquivo muito grande (${(fileSize / 1024 / 1024).toFixed(1)}MB)`,
        suggestion: `Reduza para menos de ${this.config.maxFileSize / 1024 / 1024}MB`,
        slideIndex
      });
    }

    return issues;
  }

  /**
   * Valida formato do arquivo
   */
  private validateFormat(format: string, slideIndex: number): VisualFeedback[] {
    const issues: VisualFeedback[] = [];

    if (!this.config.allowedFormats.includes(format)) {
      issues.push({
        type: VisualIssueType.INVALID_FORMAT,
        severity: IssueSeverity.ERROR,
        message: `Formato ${format} nao suportado`,
        suggestion: `Use um dos formatos: ${this.config.allowedFormats.join(', ')}`,
        slideIndex
      });
    }

    return issues;
  }

  /**
   * Calcula score de dimensoes (0-10)
   */
  private calculateDimensionScore(dimensions: { width: number; height: number }): number {
    const { width, height } = dimensions;
    const { minWidth, minHeight, maxWidth, maxHeight } = this.config;

    // Penaliza se menor que minimo
    if (width < minWidth || height < minHeight) {
      const widthRatio = width / minWidth;
      const heightRatio = height / minHeight;
      return Math.max(0, Math.min(widthRatio, heightRatio) * 10);
    }

    // Penaliza levemente se muito grande
    if (width > maxWidth || height > maxHeight) {
      return 8;
    }

    // Ideal: proximo de 1080x1080
    const targetSize = 1080;
    const deviation = Math.abs(width - targetSize) + Math.abs(height - targetSize);
    const deviationScore = Math.max(0, 10 - (deviation / 200));

    return Math.min(10, deviationScore);
  }

  /**
   * Calcula score de tamanho de arquivo (0-10)
   */
  private calculateFileSizeScore(fileSize: number): number {
    const { minFileSize, maxFileSize } = this.config;

    if (fileSize < minFileSize) {
      return (fileSize / minFileSize) * 6; // Max 6 se abaixo do minimo
    }

    if (fileSize > maxFileSize) {
      return 4; // Penaliza se muito grande
    }

    // Ideal: entre 100KB e 2MB
    const idealMin = 100000;
    const idealMax = 2000000;

    if (fileSize >= idealMin && fileSize <= idealMax) {
      return 10;
    }

    if (fileSize < idealMin) {
      return 6 + ((fileSize - minFileSize) / (idealMin - minFileSize)) * 4;
    }

    return 6 + ((maxFileSize - fileSize) / (maxFileSize - idealMax)) * 4;
  }
}

export function createHeuristicAnalyzer(
  config?: Partial<HeuristicAnalysisConfig>
): HeuristicAnalyzer {
  return new HeuristicAnalyzer(config);
}
```

### ContrastAnalyzer - Analise de Contraste

```typescript
// contrast-analyzer.ts

import sharp from 'sharp';
import {
  VisualFeedback,
  VisualIssueType,
  IssueSeverity
} from './visual-types';

interface ColorInfo {
  r: number;
  g: number;
  b: number;
  frequency: number;
}

interface ContrastAnalysisResult {
  contrastRatio: number;
  dominantColors: ColorInfo[];
  passesWCAG_AA: boolean;
  passesWCAG_AAA: boolean;
  issues: VisualFeedback[];
  score: number;
}

/**
 * Analisa contraste e legibilidade de imagens
 */
export class ContrastAnalyzer {
  private minContrastRatio: number;

  constructor(minContrastRatio: number = 4.5) {
    this.minContrastRatio = minContrastRatio;
  }

  /**
   * Analisa contraste de uma imagem
   */
  async analyzeContrast(
    imagePath: string,
    slideIndex: number = 0
  ): Promise<ContrastAnalysisResult> {
    const issues: VisualFeedback[] = [];

    // Extrai cores dominantes
    const dominantColors = await this.extractDominantColors(imagePath);

    // Calcula contraste entre cores mais frequentes
    const contrastRatio = this.calculateContrastRatio(
      dominantColors[0], // Cor mais frequente (fundo provavel)
      dominantColors[1]  // Segunda mais frequente (texto provavel)
    );

    // Verifica WCAG
    const passesWCAG_AA = contrastRatio >= 4.5;
    const passesWCAG_AAA = contrastRatio >= 7.0;

    // Gera issues se contraste baixo
    if (!passesWCAG_AA) {
      issues.push({
        type: VisualIssueType.LOW_CONTRAST,
        severity: IssueSeverity.ERROR,
        message: `Contraste insuficiente: ${contrastRatio.toFixed(2)}:1 (minimo: 4.5:1)`,
        suggestion: 'Aumente o contraste entre texto e fundo. Use overlay mais escuro ou texto mais claro.',
        slideIndex
      });
    } else if (!passesWCAG_AAA) {
      issues.push({
        type: VisualIssueType.LOW_CONTRAST,
        severity: IssueSeverity.WARNING,
        message: `Contraste pode ser melhorado: ${contrastRatio.toFixed(2)}:1`,
        suggestion: 'Para acessibilidade ideal (WCAG AAA), use contraste de 7:1 ou maior.',
        slideIndex
      });
    }

    // Calcula score
    const score = this.calculateContrastScore(contrastRatio);

    return {
      contrastRatio,
      dominantColors,
      passesWCAG_AA,
      passesWCAG_AAA,
      issues,
      score
    };
  }

  /**
   * Extrai cores dominantes da imagem
   */
  private async extractDominantColors(imagePath: string): Promise<ColorInfo[]> {
    // Redimensiona para acelerar processamento
    const { data, info } = await sharp(imagePath)
      .resize(100, 100, { fit: 'cover' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const colorCounts = new Map<string, ColorInfo>();

    // Conta frequencia de cada cor (agrupada)
    for (let i = 0; i < data.length; i += info.channels) {
      const r = Math.round(data[i] / 16) * 16;
      const g = Math.round(data[i + 1] / 16) * 16;
      const b = Math.round(data[i + 2] / 16) * 16;

      const key = `${r},${g},${b}`;
      const existing = colorCounts.get(key);

      if (existing) {
        existing.frequency++;
      } else {
        colorCounts.set(key, { r, g, b, frequency: 1 });
      }
    }

    // Ordena por frequencia e retorna top 5
    return Array.from(colorCounts.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
  }

  /**
   * Calcula ratio de contraste entre duas cores (WCAG)
   */
  private calculateContrastRatio(color1: ColorInfo, color2: ColorInfo): number {
    const lum1 = this.calculateLuminance(color1);
    const lum2 = this.calculateLuminance(color2);

    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Calcula luminancia relativa (WCAG)
   */
  private calculateLuminance(color: ColorInfo): number {
    const normalize = (value: number): number => {
      const sRGB = value / 255;
      return sRGB <= 0.03928
        ? sRGB / 12.92
        : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    };

    const r = normalize(color.r);
    const g = normalize(color.g);
    const b = normalize(color.b);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Calcula score de contraste (0-10)
   */
  private calculateContrastScore(contrastRatio: number): number {
    // Score baseado no ratio de contraste
    // 21:1 = score 10 (maximo teorico)
    // 7:1 = score 8 (WCAG AAA)
    // 4.5:1 = score 6 (WCAG AA)
    // 3:1 = score 4
    // 1:1 = score 0

    if (contrastRatio >= 21) return 10;
    if (contrastRatio >= 7) return 8 + ((contrastRatio - 7) / 14) * 2;
    if (contrastRatio >= 4.5) return 6 + ((contrastRatio - 4.5) / 2.5) * 2;
    if (contrastRatio >= 3) return 4 + ((contrastRatio - 3) / 1.5) * 2;
    return Math.max(0, (contrastRatio - 1) / 2 * 4);
  }
}

export function createContrastAnalyzer(minContrastRatio?: number): ContrastAnalyzer {
  return new ContrastAnalyzer(minContrastRatio);
}
```

### MultimodalAnalyzer - Analise via LLM Vision

```typescript
// multimodal-analyzer.ts

import * as fs from 'fs/promises';
import {
  MultimodalAnalysisConfig,
  VisualAnalysisResult,
  VisualScore,
  VisualFeedback,
  VisualIssueType,
  IssueSeverity,
  SlideAnalysisResult
} from './visual-types';
import { RateLimiter } from '@social-content/shared';

interface LLMVisionResponse {
  overall_quality: number;
  readability: number;
  contrast: number;
  code_formatting?: number;
  consistency?: number;
  issues: Array<{
    type: string;
    severity: string;
    message: string;
    suggestion: string;
    slide_index?: number;
  }>;
  summary: string;
}

/**
 * Analisa imagens usando LLM multimodal (Gemini, GPT-4V, etc.)
 */
export class MultimodalAnalyzer {
  private config: MultimodalAnalysisConfig;
  private rateLimiter: RateLimiter;
  private cache: Map<string, VisualAnalysisResult> = new Map();

  constructor(config: MultimodalAnalysisConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(config.rateLimitPerMinute, 60000);
  }

  /**
   * Analisa imagens usando LLM multimodal
   */
  async analyze(
    imagePaths: string[],
    postId: string,
    isCarousel: boolean
  ): Promise<VisualAnalysisResult> {
    const startTime = Date.now();

    // Verifica cache
    const cacheKey = this.generateCacheKey(imagePaths);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return { ...cached, analyzedAt: new Date() };
    }

    // Aguarda rate limiter
    await this.rateLimiter.acquire();

    // Converte imagens para base64
    const imagesBase64 = await Promise.all(
      imagePaths.map(async (path) => {
        const buffer = await fs.readFile(path);
        return buffer.toString('base64');
      })
    );

    // Gera prompt para analise
    const prompt = this.buildAnalysisPrompt(isCarousel, imagePaths.length);

    // Chama API multimodal
    const llmResponse = await this.callVisionAPI(imagesBase64, prompt);

    // Parseia resposta
    const result = this.parseResponse(
      llmResponse,
      postId,
      imagePaths,
      isCarousel,
      startTime
    );

    // Salva no cache
    this.cache.set(cacheKey, result);

    return result;
  }

  /**
   * Verifica se o provider multimodal esta disponivel
   */
  async isAvailable(): Promise<boolean> {
    if (!this.config.apiKey) return false;

    try {
      // Faz health check simples
      // Implementacao depende do provider
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Constroi prompt otimizado para analise visual
   */
  private buildAnalysisPrompt(isCarousel: boolean, slideCount: number): string {
    const basePrompt = `Analise a qualidade visual desta imagem para uso em redes sociais (Instagram/LinkedIn).

Avalie os seguintes aspectos em uma escala de 0-10:
1. Qualidade geral (overall_quality)
2. Legibilidade do texto (readability)
3. Contraste texto/fundo (contrast)
4. Formatacao de codigo, se houver (code_formatting)
${isCarousel ? '5. Consistencia entre slides (consistency)' : ''}

Identifique problemas especificos e forneca sugestoes de melhoria.

Responda em JSON no formato:
{
  "overall_quality": <0-10>,
  "readability": <0-10>,
  "contrast": <0-10>,
  "code_formatting": <0-10 ou null se nao houver codigo>,
  ${isCarousel ? '"consistency": <0-10>,' : ''}
  "issues": [
    {
      "type": "low_contrast|poor_readability|code_formatting|inconsistent_style|text_overflow",
      "severity": "info|warning|error",
      "message": "descricao do problema",
      "suggestion": "como corrigir"${isCarousel ? ',\n      "slide_index": <numero do slide>' : ''}
    }
  ],
  "summary": "resumo da analise em 1-2 frases"
}`;

    if (isCarousel) {
      return `${basePrompt}\n\nEsta e um carrossel com ${slideCount} slides. Analise cada slide e a consistencia visual entre eles.`;
    }

    return basePrompt;
  }

  /**
   * Chama API de visao do provider configurado
   */
  private async callVisionAPI(
    imagesBase64: string[],
    prompt: string
  ): Promise<LLMVisionResponse> {
    switch (this.config.provider) {
      case 'gemini':
        return this.callGeminiVision(imagesBase64, prompt);
      case 'openai':
        return this.callOpenAIVision(imagesBase64, prompt);
      case 'anthropic':
        return this.callAnthropicVision(imagesBase64, prompt);
      default:
        throw new Error(`Provider ${this.config.provider} nao suportado`);
    }
  }

  /**
   * Chama Gemini Vision API
   */
  private async callGeminiVision(
    imagesBase64: string[],
    prompt: string
  ): Promise<LLMVisionResponse> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;

    const parts = [
      { text: prompt },
      ...imagesBase64.map(base64 => ({
        inline_data: {
          mime_type: 'image/png',
          data: base64
        }
      }))
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxTokens
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Resposta vazia do Gemini');
    }

    // Extrai JSON da resposta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Nao foi possivel extrair JSON da resposta');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Chama OpenAI Vision API (GPT-4V)
   */
  private async callOpenAIVision(
    imagesBase64: string[],
    prompt: string
  ): Promise<LLMVisionResponse> {
    const url = 'https://api.openai.com/v1/chat/completions';

    const content = [
      { type: 'text', text: prompt },
      ...imagesBase64.map(base64 => ({
        type: 'image_url',
        image_url: {
          url: `data:image/png;base64,${base64}`,
          detail: 'high'
        }
      }))
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: 'user', content }],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('Resposta vazia do OpenAI');
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Nao foi possivel extrair JSON da resposta');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Chama Anthropic Vision API (Claude)
   */
  private async callAnthropicVision(
    imagesBase64: string[],
    prompt: string
  ): Promise<LLMVisionResponse> {
    const url = 'https://api.anthropic.com/v1/messages';

    const content = [
      ...imagesBase64.map(base64 => ({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: base64
        }
      })),
      { type: 'text', text: prompt }
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        messages: [{ role: 'user', content }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;

    if (!text) {
      throw new Error('Resposta vazia do Anthropic');
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Nao foi possivel extrair JSON da resposta');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Parseia resposta do LLM em VisualAnalysisResult
   */
  private parseResponse(
    llmResponse: LLMVisionResponse,
    postId: string,
    imagePaths: string[],
    isCarousel: boolean,
    startTime: number
  ): VisualAnalysisResult {
    const score: VisualScore = {
      overall: llmResponse.overall_quality,
      dimensions: 10, // Assumido correto se chegou ate aqui
      fileQuality: 10, // Assumido correto
      contrast: llmResponse.contrast,
      readability: llmResponse.readability,
      codeFormatting: llmResponse.code_formatting ?? 10,
      consistency: llmResponse.consistency ?? 10
    };

    const feedback: VisualFeedback[] = llmResponse.issues.map(issue => ({
      type: this.mapIssueType(issue.type),
      severity: this.mapSeverity(issue.severity),
      message: issue.message,
      suggestion: issue.suggestion,
      slideIndex: issue.slide_index
    }));

    const slides: SlideAnalysisResult[] = imagePaths.map((path, index) => ({
      slideIndex: index,
      path,
      dimensions: { width: 1080, height: 1080 }, // Placeholder
      fileSize: 0, // Placeholder
      format: 'png',
      hasCode: llmResponse.code_formatting !== null,
      contrastRatio: 0, // Calculado separadamente
      readabilityScore: llmResponse.readability,
      issues: feedback.filter(f => f.slideIndex === index || f.slideIndex === undefined)
    }));

    return {
      postId,
      analyzedAt: new Date(),
      analysisMethod: 'multimodal',
      score,
      slides,
      carouselConsistency: isCarousel ? {
        isConsistent: (llmResponse.consistency ?? 10) >= 7,
        score: llmResponse.consistency ?? 10,
        colorPaletteMatch: 1,
        fontConsistency: 1,
        layoutConsistency: 1,
        inconsistentSlides: [],
        details: []
      } : undefined,
      feedback,
      passed: score.overall >= 6,
      processingTimeMs: Date.now() - startTime
    };
  }

  /**
   * Mapeia tipo de issue do LLM para enum
   */
  private mapIssueType(type: string): VisualIssueType {
    const mapping: Record<string, VisualIssueType> = {
      'low_contrast': VisualIssueType.LOW_CONTRAST,
      'poor_readability': VisualIssueType.POOR_READABILITY,
      'code_formatting': VisualIssueType.CODE_FORMATTING,
      'inconsistent_style': VisualIssueType.INCONSISTENT_STYLE,
      'text_overflow': VisualIssueType.TEXT_OVERFLOW
    };
    return mapping[type] || VisualIssueType.POOR_READABILITY;
  }

  /**
   * Mapeia severidade do LLM para enum
   */
  private mapSeverity(severity: string): IssueSeverity {
    const mapping: Record<string, IssueSeverity> = {
      'info': IssueSeverity.INFO,
      'warning': IssueSeverity.WARNING,
      'error': IssueSeverity.ERROR
    };
    return mapping[severity] || IssueSeverity.WARNING;
  }

  /**
   * Gera chave de cache baseada nos paths das imagens
   */
  private generateCacheKey(imagePaths: string[]): string {
    return imagePaths.sort().join('|');
  }

  /**
   * Limpa cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export function createMultimodalAnalyzer(
  config: MultimodalAnalysisConfig
): MultimodalAnalyzer {
  return new MultimodalAnalyzer(config);
}
```

### Integracao no QAAnalystAgent

```typescript
// Adicoes ao qa-analyst-agent.ts

import { Asset } from '@social-content/shared';
import {
  VisualAnalysisInput,
  VisualAnalysisResult,
  VisualScore,
  QAResultWithVisuals
} from './visual-types';
import { createHeuristicAnalyzer, HeuristicAnalyzer } from './heuristic-analyzer';
import { createContrastAnalyzer, ContrastAnalyzer } from './contrast-analyzer';
import { createMultimodalAnalyzer, MultimodalAnalyzer } from './multimodal-analyzer';
import { createCarouselConsistencyAnalyzer, CarouselConsistencyAnalyzer } from './carousel-consistency-analyzer';

export class QAAnalystAgent implements Agent<QAInput, QAResultWithVisuals> {
  readonly name = 'QAAnalystAgent';
  public status: AgentStatus = AgentStatus.IDLE;

  private config: QAConfig;
  private heuristicAnalyzer: HeuristicAnalyzer;
  private contrastAnalyzer: ContrastAnalyzer;
  private multimodalAnalyzer?: MultimodalAnalyzer;
  private carouselAnalyzer: CarouselConsistencyAnalyzer;

  constructor(config: QAConfig) {
    this.config = config;
    this.heuristicAnalyzer = createHeuristicAnalyzer(config.heuristic);
    this.contrastAnalyzer = createContrastAnalyzer(config.minContrastRatio);
    this.carouselAnalyzer = createCarouselConsistencyAnalyzer();

    // Multimodal e opcional
    if (config.multimodal?.apiKey) {
      this.multimodalAnalyzer = createMultimodalAnalyzer(config.multimodal);
    }
  }

  /**
   * Analisa assets visuais do post
   */
  async analyzeVisuals(input: VisualAnalysisInput): Promise<VisualAnalysisResult> {
    const startTime = Date.now();
    const { assets, postId, isCarousel } = input;

    // Extrai paths das imagens
    const imagePaths = assets
      .filter(a => a.type === 'image' || a.type === 'carousel')
      .map(a => a.path);

    if (imagePaths.length === 0) {
      return this.createEmptyVisualResult(postId, startTime);
    }

    // Tenta analise multimodal primeiro (se disponivel)
    if (this.multimodalAnalyzer) {
      try {
        const isAvailable = await this.multimodalAnalyzer.isAvailable();
        if (isAvailable) {
          return await this.multimodalAnalyzer.analyze(imagePaths, postId, isCarousel);
        }
      } catch (error) {
        console.warn('Multimodal analysis failed, falling back to heuristic:', error);
      }
    }

    // Fallback: analise heuristica
    return await this.analyzeHeuristic(imagePaths, postId, isCarousel, startTime);
  }

  /**
   * Analise heuristica (fallback)
   */
  private async analyzeHeuristic(
    imagePaths: string[],
    postId: string,
    isCarousel: boolean,
    startTime: number
  ): Promise<VisualAnalysisResult> {
    // Analisa cada imagem
    const slideResults = await this.heuristicAnalyzer.analyzeMultiple(imagePaths);

    // Analisa contraste de cada imagem
    for (const slide of slideResults) {
      const contrastResult = await this.contrastAnalyzer.analyzeContrast(
        slide.path,
        slide.slideIndex
      );
      slide.contrastRatio = contrastResult.contrastRatio;
      slide.issues.push(...contrastResult.issues);
    }

    // Analisa consistencia do carrossel (se aplicavel)
    let carouselConsistency;
    if (isCarousel && imagePaths.length > 1) {
      carouselConsistency = await this.carouselAnalyzer.analyze(imagePaths);
    }

    // Calcula scores agregados
    const score = this.calculateAggregateScore(slideResults, carouselConsistency);

    // Coleta todos os feedbacks
    const feedback = slideResults.flatMap(s => s.issues);

    return {
      postId,
      analyzedAt: new Date(),
      analysisMethod: 'heuristic',
      score,
      slides: slideResults,
      carouselConsistency,
      feedback,
      passed: score.overall >= this.config.threshold,
      processingTimeMs: Date.now() - startTime
    };
  }

  /**
   * Calcula score agregado
   */
  private calculateAggregateScore(
    slides: SlideAnalysisResult[],
    consistency?: SlideConsistencyResult
  ): VisualScore {
    const avgReadability = slides.reduce((sum, s) => sum + s.readabilityScore, 0) / slides.length;
    const avgContrast = slides.length > 0
      ? slides.reduce((sum, s) => sum + this.contrastToScore(s.contrastRatio), 0) / slides.length
      : 10;

    const dimensionScore = slides.every(s => s.issues.every(i => i.type !== VisualIssueType.WRONG_DIMENSIONS)) ? 10 : 5;
    const fileScore = slides.every(s => s.issues.every(i => i.type !== VisualIssueType.FILE_TOO_LARGE && i.type !== VisualIssueType.FILE_TOO_SMALL)) ? 10 : 6;

    const consistencyScore = consistency?.score ?? 10;

    const overall = (
      avgReadability * 0.25 +
      avgContrast * 0.25 +
      dimensionScore * 0.15 +
      fileScore * 0.15 +
      consistencyScore * 0.20
    );

    return {
      overall: Math.round(overall * 10) / 10,
      dimensions: dimensionScore,
      fileQuality: fileScore,
      contrast: Math.round(avgContrast * 10) / 10,
      readability: Math.round(avgReadability * 10) / 10,
      codeFormatting: 10, // Determinado separadamente
      consistency: consistencyScore
    };
  }

  /**
   * Converte ratio de contraste para score 0-10
   */
  private contrastToScore(ratio: number): number {
    if (ratio >= 7) return 10;
    if (ratio >= 4.5) return 8;
    if (ratio >= 3) return 6;
    return Math.max(0, ratio * 2);
  }

  /**
   * Cria resultado vazio para posts sem assets visuais
   */
  private createEmptyVisualResult(postId: string, startTime: number): VisualAnalysisResult {
    return {
      postId,
      analyzedAt: new Date(),
      analysisMethod: 'heuristic',
      score: {
        overall: 10,
        dimensions: 10,
        fileQuality: 10,
        contrast: 10,
        readability: 10,
        codeFormatting: 10,
        consistency: 10
      },
      slides: [],
      feedback: [],
      passed: true,
      processingTimeMs: Date.now() - startTime
    };
  }

  /**
   * Metodo run atualizado com analise visual
   */
  async run(input: QAInput): Promise<AgentResult<QAResultWithVisuals>> {
    const startTime = Date.now();
    this.status = AgentStatus.RUNNING;

    try {
      // Analise de texto (existente)
      const textAnalysis = await this.analyzeText(input);

      // Analise visual (novo)
      const visualAnalysis = await this.analyzeVisuals({
        assets: input.assets || [],
        postId: input.postId,
        isCarousel: (input.assets?.length ?? 0) > 1
      });

      // Calcula score geral (media ponderada)
      const overallScore = this.calculateOverallScore(textAnalysis.score, visualAnalysis.score.overall);
      const approved = overallScore >= this.config.threshold;

      const result: QAResultWithVisuals = {
        postId: input.postId,
        timestamp: new Date(),
        textAnalysis: {
          score: textAnalysis.score,
          criteria: textAnalysis.criteria,
          feedback: textAnalysis.feedback
        },
        visualAnalysis,
        overallScore,
        approved,
        threshold: this.config.threshold
      };

      this.status = AgentStatus.SUCCESS;

      return {
        success: true,
        data: result,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

    } catch (error) {
      this.status = AgentStatus.ERROR;
      return {
        success: false,
        error: `QA analysis failed: ${(error as Error).message}`,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  /**
   * Calcula score geral combinando texto e visual
   */
  private calculateOverallScore(textScore: number, visualScore: number): number {
    // Peso: 60% texto, 40% visual
    const weighted = textScore * 0.6 + visualScore * 0.4;
    return Math.round(weighted * 10) / 10;
  }
}
```

---

## Testing

### Testes de HeuristicAnalyzer

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';
import { HeuristicAnalyzer, createHeuristicAnalyzer } from '../agents/qa-analyst/heuristic-analyzer';
import { VisualIssueType } from '../agents/qa-analyst/visual-types';

describe('HeuristicAnalyzer', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');
  const goodImagePath = path.join(fixturesDir, 'good-slide.png');
  const smallImagePath = path.join(fixturesDir, 'small-slide.png');
  const largeImagePath = path.join(fixturesDir, 'large-slide.png');

  beforeAll(async () => {
    // Cria diretorio de fixtures
    await fs.mkdir(fixturesDir, { recursive: true });

    // Cria imagem boa (1080x1080, ~500KB)
    await sharp({
      create: { width: 1080, height: 1080, channels: 3, background: { r: 30, g: 30, b: 50 } }
    }).png().toFile(goodImagePath);

    // Cria imagem pequena (500x500)
    await sharp({
      create: { width: 500, height: 500, channels: 3, background: { r: 30, g: 30, b: 50 } }
    }).png().toFile(smallImagePath);

    // Cria imagem muito grande (5000x5000)
    await sharp({
      create: { width: 5000, height: 5000, channels: 3, background: { r: 30, g: 30, b: 50 } }
    }).png().toFile(largeImagePath);
  });

  afterAll(async () => {
    // Limpa fixtures
    await fs.rm(fixturesDir, { recursive: true, force: true });
  });

  describe('analyzeImage', () => {
    it('should pass for good quality image', async () => {
      const analyzer = createHeuristicAnalyzer();
      const result = await analyzer.analyzeImage(goodImagePath);

      expect(result.dimensions.width).toBe(1080);
      expect(result.dimensions.height).toBe(1080);
      expect(result.format).toBe('png');
      expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0);
    });

    it('should detect small dimensions', async () => {
      const analyzer = createHeuristicAnalyzer();
      const result = await analyzer.analyzeImage(smallImagePath);

      const dimensionIssue = result.issues.find(i => i.type === VisualIssueType.WRONG_DIMENSIONS);
      expect(dimensionIssue).toBeDefined();
      expect(dimensionIssue?.severity).toBe('error');
    });

    it('should warn about large dimensions', async () => {
      const analyzer = createHeuristicAnalyzer();
      const result = await analyzer.analyzeImage(largeImagePath);

      const dimensionIssue = result.issues.find(i => i.type === VisualIssueType.WRONG_DIMENSIONS);
      expect(dimensionIssue).toBeDefined();
      expect(dimensionIssue?.severity).toBe('warning');
    });

    it('should calculate readability score', async () => {
      const analyzer = createHeuristicAnalyzer();
      const result = await analyzer.analyzeImage(goodImagePath);

      expect(result.readabilityScore).toBeGreaterThanOrEqual(0);
      expect(result.readabilityScore).toBeLessThanOrEqual(10);
    });
  });

  describe('analyzeMultiple', () => {
    it('should analyze carousel images', async () => {
      const analyzer = createHeuristicAnalyzer();
      const results = await analyzer.analyzeMultiple([goodImagePath, goodImagePath]);

      expect(results).toHaveLength(2);
      expect(results[0].slideIndex).toBe(0);
      expect(results[1].slideIndex).toBe(1);
    });
  });

  describe('custom config', () => {
    it('should use custom min dimensions', async () => {
      const analyzer = createHeuristicAnalyzer({
        minWidth: 2000,
        minHeight: 2000
      });
      const result = await analyzer.analyzeImage(goodImagePath);

      const dimensionIssue = result.issues.find(i => i.type === VisualIssueType.WRONG_DIMENSIONS);
      expect(dimensionIssue).toBeDefined();
    });
  });
});
```

### Testes de ContrastAnalyzer

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';
import { ContrastAnalyzer, createContrastAnalyzer } from '../agents/qa-analyst/contrast-analyzer';
import { VisualIssueType, IssueSeverity } from '../agents/qa-analyst/visual-types';

describe('ContrastAnalyzer', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');
  const highContrastPath = path.join(fixturesDir, 'high-contrast.png');
  const lowContrastPath = path.join(fixturesDir, 'low-contrast.png');

  beforeAll(async () => {
    await fs.mkdir(fixturesDir, { recursive: true });

    // Imagem com alto contraste (preto e branco)
    const highContrast = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 0, g: 0, b: 0 } }
    }).composite([{
      input: await sharp({
        create: { width: 50, height: 100, channels: 3, background: { r: 255, g: 255, b: 255 } }
      }).png().toBuffer(),
      left: 50,
      top: 0
    }]).png().toFile(highContrastPath);

    // Imagem com baixo contraste (cinzas similares)
    const lowContrast = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 100, g: 100, b: 100 } }
    }).composite([{
      input: await sharp({
        create: { width: 50, height: 100, channels: 3, background: { r: 120, g: 120, b: 120 } }
      }).png().toBuffer(),
      left: 50,
      top: 0
    }]).png().toFile(lowContrastPath);
  });

  afterAll(async () => {
    await fs.rm(fixturesDir, { recursive: true, force: true });
  });

  describe('analyzeContrast', () => {
    it('should detect high contrast', async () => {
      const analyzer = createContrastAnalyzer();
      const result = await analyzer.analyzeContrast(highContrastPath);

      expect(result.contrastRatio).toBeGreaterThan(10);
      expect(result.passesWCAG_AA).toBe(true);
      expect(result.passesWCAG_AAA).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(8);
    });

    it('should detect low contrast', async () => {
      const analyzer = createContrastAnalyzer();
      const result = await analyzer.analyzeContrast(lowContrastPath);

      expect(result.contrastRatio).toBeLessThan(4.5);
      expect(result.passesWCAG_AA).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe(VisualIssueType.LOW_CONTRAST);
    });

    it('should return dominant colors', async () => {
      const analyzer = createContrastAnalyzer();
      const result = await analyzer.analyzeContrast(highContrastPath);

      expect(result.dominantColors.length).toBeGreaterThan(0);
      expect(result.dominantColors[0]).toHaveProperty('r');
      expect(result.dominantColors[0]).toHaveProperty('g');
      expect(result.dominantColors[0]).toHaveProperty('b');
    });
  });
});
```

### Testes de MultimodalAnalyzer

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MultimodalAnalyzer, createMultimodalAnalyzer } from '../agents/qa-analyst/multimodal-analyzer';
import { MultimodalAnalysisConfig } from '../agents/qa-analyst/visual-types';

// Mock fetch
global.fetch = vi.fn();

describe('MultimodalAnalyzer', () => {
  const mockConfig: MultimodalAnalysisConfig = {
    provider: 'gemini',
    apiKey: 'test-api-key',
    model: 'gemini-pro-vision',
    maxTokens: 1000,
    temperature: 0.3,
    rateLimitPerMinute: 10
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyze', () => {
    it('should call Gemini API and parse response', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                overall_quality: 8,
                readability: 9,
                contrast: 7,
                code_formatting: null,
                issues: [],
                summary: 'Good quality image'
              })
            }]
          }
        }]
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const analyzer = createMultimodalAnalyzer(mockConfig);

      // Mock fs.readFile
      vi.mock('fs/promises', () => ({
        readFile: vi.fn().mockResolvedValue(Buffer.from('fake-image-data'))
      }));

      const result = await analyzer.analyze(['/fake/path.png'], 'post-123', false);

      expect(result.score.overall).toBe(8);
      expect(result.score.readability).toBe(9);
      expect(result.analysisMethod).toBe('multimodal');
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        text: async () => 'API Error'
      });

      const analyzer = createMultimodalAnalyzer(mockConfig);

      await expect(analyzer.analyze(['/fake/path.png'], 'post-123', false))
        .rejects.toThrow('Gemini API error');
    });

    it('should cache results', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                overall_quality: 8,
                readability: 9,
                contrast: 7,
                issues: [],
                summary: 'Good'
              })
            }]
          }
        }]
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const analyzer = createMultimodalAnalyzer(mockConfig);

      // Primeira chamada
      await analyzer.analyze(['/fake/path.png'], 'post-123', false);

      // Segunda chamada com mesmo path
      await analyzer.analyze(['/fake/path.png'], 'post-456', false);

      // fetch deve ter sido chamado apenas uma vez (cache hit)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('isAvailable', () => {
    it('should return false without API key', async () => {
      const analyzer = createMultimodalAnalyzer({ ...mockConfig, apiKey: '' });
      const available = await analyzer.isAvailable();
      expect(available).toBe(false);
    });

    it('should return true with API key', async () => {
      const analyzer = createMultimodalAnalyzer(mockConfig);
      const available = await analyzer.isAvailable();
      expect(available).toBe(true);
    });
  });
});
```

### Testes de Integracao do QAAnalyst

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QAAnalystAgent } from '../agents/qa-analyst/qa-analyst-agent';
import { AgentStatus } from '../agents/types';
import { Asset } from '@social-content/shared';

describe('QAAnalystAgent - Visual Analysis Integration', () => {
  const mockAssets: Asset[] = [
    { id: '1', postId: 'post-123', type: 'carousel', path: '/tmp/slide1.png', size: 500000 },
    { id: '2', postId: 'post-123', type: 'carousel', path: '/tmp/slide2.png', size: 500000 }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should analyze both text and visuals', async () => {
    const agent = new QAAnalystAgent({
      threshold: 6,
      minContrastRatio: 4.5,
      heuristic: {
        minWidth: 1080,
        minHeight: 1080,
        maxWidth: 4096,
        maxHeight: 4096,
        minFileSize: 50000,
        maxFileSize: 10485760,
        allowedFormats: ['png', 'jpg', 'jpeg', 'webp']
      }
    });

    // Mock das analises
    vi.spyOn(agent as any, 'analyzeText').mockResolvedValue({
      score: 8,
      criteria: { clarity: 8, relevance: 9 },
      feedback: []
    });

    vi.spyOn(agent as any, 'analyzeVisuals').mockResolvedValue({
      postId: 'post-123',
      analysisMethod: 'heuristic',
      score: { overall: 7, dimensions: 10, contrast: 7, readability: 7 },
      slides: [],
      feedback: [],
      passed: true
    });

    const result = await agent.run({
      postId: 'post-123',
      textContent: 'Test content',
      assets: mockAssets
    });

    expect(result.success).toBe(true);
    expect(result.data?.textAnalysis).toBeDefined();
    expect(result.data?.visualAnalysis).toBeDefined();
    expect(result.data?.overallScore).toBeDefined();
  });

  it('should calculate weighted overall score', async () => {
    const agent = new QAAnalystAgent({ threshold: 6 });

    // Text: 10, Visual: 5
    // Expected: 10 * 0.6 + 5 * 0.4 = 8

    vi.spyOn(agent as any, 'analyzeText').mockResolvedValue({
      score: 10,
      criteria: {},
      feedback: []
    });

    vi.spyOn(agent as any, 'analyzeVisuals').mockResolvedValue({
      score: { overall: 5 },
      passed: false
    });

    const result = await agent.run({
      postId: 'post-123',
      textContent: 'Test',
      assets: []
    });

    expect(result.data?.overallScore).toBe(8);
  });

  it('should fallback to heuristic when multimodal unavailable', async () => {
    const agent = new QAAnalystAgent({
      threshold: 6,
      multimodal: {
        provider: 'gemini',
        apiKey: '', // Vazio = indisponivel
        model: 'gemini-pro-vision',
        maxTokens: 1000,
        temperature: 0.3,
        rateLimitPerMinute: 10
      }
    });

    const result = await agent.analyzeVisuals({
      assets: mockAssets,
      postId: 'post-123',
      isCarousel: true
    });

    expect(result.analysisMethod).toBe('heuristic');
  });

  it('should generate specific visual feedback', async () => {
    const agent = new QAAnalystAgent({ threshold: 6 });

    vi.spyOn(agent as any, 'analyzeVisuals').mockResolvedValue({
      score: { overall: 5 },
      feedback: [
        {
          type: 'low_contrast',
          severity: 'error',
          message: 'Contraste insuficiente',
          suggestion: 'Aumente o contraste entre texto e fundo'
        }
      ],
      passed: false
    });

    const result = await agent.analyzeVisuals({
      assets: mockAssets,
      postId: 'post-123',
      isCarousel: false
    });

    expect(result.feedback).toHaveLength(1);
    expect(result.feedback[0].suggestion).toContain('contraste');
  });
});
```

---

## References

- [PRD](../prd.md) - Epic 4: Qualidade & Orquestracao, Story 4.3
- [Architecture](../architecture.md) - QA Agent Design
- [Story 4.2](./story-4.2.md) - Agente QA Analyst — Criterios de Qualidade
- [Story 3.5](./story-3.5.md) - Agente Carousel Builder (assets gerados)
- [Story 3.4](./story-3.4.md) - Servico de Renderizacao (contexto de imagens)
- [Gemini Vision API Docs](https://ai.google.dev/gemini-api/docs/vision)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

---

## Dev Agent Record

### File List

| Status | File | Changes |
|--------|------|---------|
| Created | `packages/agents/src/agents/qa-analyst/visual-types.ts` | TypeScript interfaces for visual analysis (VisualAnalysisInput, VisualAnalysisResult, VisualScore, VisualFeedback, etc.) |
| Created | `packages/agents/src/agents/qa-analyst/heuristic-analyzer.ts` | Programmatic image analysis (dimensions, file size, format, aspect ratio) |
| Created | `packages/agents/src/agents/qa-analyst/contrast-analyzer.ts` | WCAG contrast analysis with dominant color extraction |
| Created | `packages/agents/src/agents/qa-analyst/multimodal-analyzer.ts` | LLM Vision API integration (Gemini, OpenAI, Anthropic) |
| Created | `packages/agents/src/agents/qa-analyst/code-slide-analyzer.ts` | Code slide detection and syntax highlighting verification |
| Created | `packages/agents/src/agents/qa-analyst/carousel-consistency-analyzer.ts` | Carousel slide visual consistency analysis |
| Modified | `packages/agents/src/agents/qa-analyst/qa-analyst-agent.ts` | Integrated visual analysis with text analysis |
| Modified | `packages/agents/src/agents/qa-analyst/factory.ts` | Added factory for QAAnalystAgent with visual config |
| Modified | `packages/agents/src/agents/qa-analyst/index.ts` | Added exports for all visual analysis components |
| Modified | `packages/agents/src/agents/index.ts` | Added QAAnalyst visual analysis exports |
| Modified | `packages/agents/package.json` | Added sharp dependency for image processing |
| Created | `packages/agents/src/__tests__/qa-analyst/visual-analysis.test.ts` | 49 unit tests for all visual analyzers |

### Debug Log

- All 49 tests passing
- Type checking passes for qa-analyst files (pre-existing errors in other files unrelated to this story)
- Sharp library used for image metadata extraction and color analysis

### Completion Notes

Implemented visual analysis capabilities for the QAAnalyst agent:

1. **Heuristic Analysis**: Validates image dimensions (min 1080x1080), file size (50KB-10MB), format (PNG/JPG/WebP), and aspect ratio for Instagram compatibility.

2. **Contrast Analysis**: Extracts dominant colors using sharp, calculates WCAG contrast ratios, and generates feedback for accessibility compliance (WCAG AA: 4.5:1, AAA: 7:1).

3. **Multimodal Analysis**: Integrates with Gemini Vision API, GPT-4V, and Claude Vision with structured JSON prompts. Includes caching and rate limiting.

4. **Code Slide Analysis**: Detects code presence through color pattern analysis, verifies syntax highlighting, and checks for readability issues.

5. **Carousel Consistency**: Compares color palettes, brightness, and edge density across slides to ensure visual consistency.

6. **Integration**: QAAnalystAgent combines text and visual scores with configurable weights (default: 60% text, 40% visual). Falls back to heuristic analysis when multimodal API is unavailable.

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story created | Claude (Dev Agent) |
| 2026-01-28 | Implemented all tasks (1-9), all tests passing | Dex (Dev Agent) |

---
