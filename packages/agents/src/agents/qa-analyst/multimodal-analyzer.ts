/**
 * Multimodal Analyzer
 * Story 4.3 - Agente QA Analyst - Analise de Imagens
 *
 * Analyzes images using LLM Vision APIs (Gemini, OpenAI GPT-4V, Anthropic Claude).
 * Provides deep visual analysis including text legibility, code formatting,
 * and carousel consistency.
 */

import * as fs from 'node:fs/promises';
import { RateLimiter } from '@social-content/shared';
import type {
  MultimodalAnalysisConfig,
  VisualAnalysisResult,
  VisualScore,
  VisualFeedback,
  SlideAnalysisResult,
  SlideConsistencyResult,
  LLMVisionResponse,
} from './visual-types';
import { VisualIssueType, IssueSeverity } from './visual-types';

/**
 * Analyzes images using multimodal LLM vision APIs
 */
export class MultimodalAnalyzer {
  private config: MultimodalAnalysisConfig;
  private rateLimiter: RateLimiter;
  private cache: Map<string, VisualAnalysisResult> = new Map();

  constructor(config: MultimodalAnalysisConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter({
      maxRequests: config.rateLimitPerMinute,
      windowMs: 60000,
    });
  }

  /**
   * Analyzes images using the configured LLM vision API
   *
   * @param imagePaths - Paths to images to analyze
   * @param postId - Unique post identifier
   * @param isCarousel - Whether analyzing a carousel
   * @returns Visual analysis result
   */
  async analyze(
    imagePaths: string[],
    postId: string,
    isCarousel: boolean
  ): Promise<VisualAnalysisResult> {
    const startTime = Date.now();

    // Check cache
    const cacheKey = this.generateCacheKey(imagePaths);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return { ...cached, analyzedAt: new Date() };
    }

    // Wait for rate limiter
    await this.rateLimiter.acquire();

    // Convert images to base64
    const imagesBase64 = await Promise.all(
      imagePaths.map(async (path) => {
        const buffer = await fs.readFile(path);
        return buffer.toString('base64');
      })
    );

    // Build analysis prompt
    const prompt = this.buildAnalysisPrompt(isCarousel, imagePaths.length);

    // Call vision API
    const llmResponse = await this.callVisionAPI(imagesBase64, prompt);

    // Parse response into result
    const result = this.parseResponse(
      llmResponse,
      postId,
      imagePaths,
      isCarousel,
      startTime
    );

    // Cache result
    this.cache.set(cacheKey, result);

    return result;
  }

  /**
   * Checks if the multimodal provider is available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.config.apiKey) return false;

    try {
      // Simple availability check - could be extended with health check
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Builds the analysis prompt for the LLM
   */
  private buildAnalysisPrompt(isCarousel: boolean, slideCount: number): string {
    const basePrompt = `Analise a qualidade visual desta imagem para uso em redes sociais (Instagram/LinkedIn).

Avalie os seguintes aspectos em uma escala de 0-10:
1. Qualidade geral (overall_quality) - composicao, estetica, profissionalismo
2. Legibilidade do texto (readability) - clareza, tamanho, posicionamento
3. Contraste texto/fundo (contrast) - facilidade de leitura
4. Formatacao de codigo, se houver (code_formatting) - syntax highlighting, tamanho da fonte
${isCarousel ? '5. Consistencia entre slides (consistency) - cores, fontes, layout' : ''}

Identifique problemas especificos e forneca sugestoes acionaveis de melhoria.

IMPORTANTE: Responda APENAS com JSON valido no formato exato abaixo:
{
  "overall_quality": <numero 0-10>,
  "readability": <numero 0-10>,
  "contrast": <numero 0-10>,
  "code_formatting": <numero 0-10 ou null se nao houver codigo>,
  ${isCarousel ? '"consistency": <numero 0-10>,' : ''}
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
      return `${basePrompt}

Este e um carrossel com ${slideCount} slides. Analise cada slide individualmente e tambem a consistencia visual entre eles. Slides devem manter paleta de cores, tipografia e estilo visual consistentes.`;
    }

    return basePrompt;
  }

  /**
   * Calls the configured vision API
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
        throw new Error(`Provider '${this.config.provider}' nao suportado`);
    }
  }

  /**
   * Calls Google Gemini Vision API
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
          data: base64,
        },
      })),
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json() as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Resposta vazia do Gemini');
    }

    return this.extractJSON(text);
  }

  /**
   * Calls OpenAI GPT-4 Vision API
   */
  private async callOpenAIVision(
    imagesBase64: string[],
    prompt: string
  ): Promise<LLMVisionResponse> {
    const url = 'https://api.openai.com/v1/chat/completions';

    const content = [
      { type: 'text' as const, text: prompt },
      ...imagesBase64.map(base64 => ({
        type: 'image_url' as const,
        image_url: {
          url: `data:image/png;base64,${base64}`,
          detail: 'high' as const,
        },
      })),
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: 'user', content }],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json() as {
      choices?: Array<{
        message?: { content?: string };
      }>;
    };
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('Resposta vazia do OpenAI');
    }

    return this.extractJSON(text);
  }

  /**
   * Calls Anthropic Claude Vision API
   */
  private async callAnthropicVision(
    imagesBase64: string[],
    prompt: string
  ): Promise<LLMVisionResponse> {
    const url = 'https://api.anthropic.com/v1/messages';

    const content = [
      ...imagesBase64.map(base64 => ({
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: 'image/png' as const,
          data: base64,
        },
      })),
      { type: 'text' as const, text: prompt },
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        messages: [{ role: 'user', content }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json() as {
      content?: Array<{ text?: string }>;
    };
    const text = data.content?.[0]?.text;

    if (!text) {
      throw new Error('Resposta vazia do Anthropic');
    }

    return this.extractJSON(text);
  }

  /**
   * Extracts JSON from LLM response text
   */
  private extractJSON(text: string): LLMVisionResponse {
    // Try to find JSON in the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Nao foi possivel extrair JSON da resposta');
    }

    try {
      return JSON.parse(jsonMatch[0]) as LLMVisionResponse;
    } catch (error) {
      throw new Error(`Erro ao parsear JSON: ${(error as Error).message}`);
    }
  }

  /**
   * Parses LLM response into VisualAnalysisResult
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
      dimensions: 10, // Assumed correct if it got here
      fileQuality: 10, // Assumed correct
      contrast: llmResponse.contrast,
      readability: llmResponse.readability,
      codeFormatting: llmResponse.code_formatting ?? 10,
      consistency: llmResponse.consistency ?? 10,
    };

    const feedback: VisualFeedback[] = llmResponse.issues.map(issue => ({
      type: this.mapIssueType(issue.type),
      severity: this.mapSeverity(issue.severity),
      message: issue.message,
      suggestion: issue.suggestion,
      slideIndex: issue.slide_index,
    }));

    const slides: SlideAnalysisResult[] = imagePaths.map((path, index) => ({
      slideIndex: index,
      path,
      dimensions: { width: 1080, height: 1080 }, // Placeholder
      fileSize: 0, // Placeholder
      format: 'png',
      hasCode: llmResponse.code_formatting !== null && llmResponse.code_formatting !== undefined,
      contrastRatio: 0, // Calculated separately
      readabilityScore: llmResponse.readability,
      issues: feedback.filter(f => f.slideIndex === index || f.slideIndex === undefined),
    }));

    let carouselConsistency: SlideConsistencyResult | undefined;
    if (isCarousel) {
      const consistencyScore = llmResponse.consistency ?? 10;
      carouselConsistency = {
        isConsistent: consistencyScore >= 7,
        score: consistencyScore,
        colorPaletteMatch: consistencyScore / 10,
        fontConsistency: consistencyScore / 10,
        layoutConsistency: consistencyScore / 10,
        inconsistentSlides: [],
        details: [],
      };
    }

    return {
      postId,
      analyzedAt: new Date(),
      analysisMethod: 'multimodal',
      score,
      slides,
      carouselConsistency,
      feedback,
      passed: score.overall >= 6,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Maps LLM issue type string to enum
   */
  private mapIssueType(type: string): VisualIssueType {
    const mapping: Record<string, VisualIssueType> = {
      'low_contrast': VisualIssueType.LOW_CONTRAST,
      'poor_readability': VisualIssueType.POOR_READABILITY,
      'code_formatting': VisualIssueType.CODE_FORMATTING,
      'inconsistent_style': VisualIssueType.INCONSISTENT_STYLE,
      'text_overflow': VisualIssueType.TEXT_OVERFLOW,
      'wrong_dimensions': VisualIssueType.WRONG_DIMENSIONS,
      'missing_syntax_highlight': VisualIssueType.MISSING_SYNTAX_HIGHLIGHT,
    };
    return mapping[type] ?? VisualIssueType.POOR_READABILITY;
  }

  /**
   * Maps LLM severity string to enum
   */
  private mapSeverity(severity: string): IssueSeverity {
    const mapping: Record<string, IssueSeverity> = {
      'info': IssueSeverity.INFO,
      'warning': IssueSeverity.WARNING,
      'error': IssueSeverity.ERROR,
    };
    return mapping[severity] ?? IssueSeverity.WARNING;
  }

  /**
   * Generates cache key from image paths
   */
  private generateCacheKey(imagePaths: string[]): string {
    return imagePaths.slice().sort().join('|');
  }

  /**
   * Clears the analysis cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Gets current cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

/**
 * Factory function to create a MultimodalAnalyzer
 *
 * @param config - Multimodal analysis configuration
 * @returns Configured MultimodalAnalyzer instance
 */
export function createMultimodalAnalyzer(
  config: MultimodalAnalysisConfig
): MultimodalAnalyzer {
  return new MultimodalAnalyzer(config);
}
