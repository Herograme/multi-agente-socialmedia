/**
 * QA Analyst Agent
 * Story 4.3 - Agente QA Analyst - Analise de Imagens
 *
 * Main agent that orchestrates visual and text quality analysis.
 * Integrates heuristic, contrast, multimodal, code, and consistency analyzers.
 */

import type { Agent, AgentResult } from '../types';
import { AgentStatus } from '../types';
import type {
  QAInput,
  QAResultWithVisuals,
  VisualAnalysisInput,
  VisualAnalysisResult,
  VisualScore,
  TextAnalysisResult,
  SlideAnalysisResult,
  SlideConsistencyResult,
  QAAnalystVisualConfig,
} from './visual-types';
import {
  VisualIssueType,
  DEFAULT_QA_VISUAL_CONFIG,
  DEFAULT_HEURISTIC_CONFIG,
} from './visual-types';
import { HeuristicAnalyzer, createHeuristicAnalyzer } from './heuristic-analyzer';
import { ContrastAnalyzer, createContrastAnalyzer } from './contrast-analyzer';
import { MultimodalAnalyzer, createMultimodalAnalyzer } from './multimodal-analyzer';
import { CodeSlideAnalyzer, createCodeSlideAnalyzer } from './code-slide-analyzer';
import {
  CarouselConsistencyAnalyzer,
  createCarouselConsistencyAnalyzer,
} from './carousel-consistency-analyzer';

/**
 * State of the QA Analyst agent
 */
export enum AgentState {
  IDLE = 'idle',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
}

/**
 * State change event
 */
export interface StateChangeEvent {
  previous: AgentState;
  current: AgentState;
}

/**
 * QA Analyst Agent for content quality analysis
 *
 * Analyzes both text and visual content to ensure quality
 * before publishing to social media platforms.
 */
export class QAAnalystAgent implements Agent<QAInput, QAResultWithVisuals> {
  readonly name = 'QAAnalystAgent';
  public status: AgentStatus = AgentStatus.IDLE;

  private config: QAAnalystVisualConfig;
  private heuristicAnalyzer: HeuristicAnalyzer;
  private contrastAnalyzer: ContrastAnalyzer;
  private multimodalAnalyzer?: MultimodalAnalyzer;
  private codeSlideAnalyzer: CodeSlideAnalyzer;
  private carouselAnalyzer: CarouselConsistencyAnalyzer;

  private state: AgentState = AgentState.IDLE;
  private onStateChange?: (event: StateChangeEvent) => void;

  constructor(config?: Partial<QAAnalystVisualConfig>) {
    this.config = { ...DEFAULT_QA_VISUAL_CONFIG, ...config };

    // Initialize analyzers
    this.heuristicAnalyzer = createHeuristicAnalyzer(
      config?.heuristic ?? DEFAULT_HEURISTIC_CONFIG
    );
    this.contrastAnalyzer = createContrastAnalyzer(this.config.minContrastRatio);
    this.codeSlideAnalyzer = createCodeSlideAnalyzer();
    this.carouselAnalyzer = createCarouselConsistencyAnalyzer();

    // Initialize multimodal analyzer if configured
    if (config?.multimodal?.apiKey) {
      this.multimodalAnalyzer = createMultimodalAnalyzer(config.multimodal);
    }
  }

  /**
   * Sets a callback for state change events
   */
  onStateChanged(callback: (event: StateChangeEvent) => void): void {
    this.onStateChange = callback;
  }

  /**
   * Gets the current agent state
   */
  getState(): AgentState {
    return this.state;
  }

  /**
   * Main execution method
   *
   * @param input - QA input with text and assets
   * @returns Combined QA result with visual and text analysis
   */
  async run(input: QAInput): Promise<AgentResult<QAResultWithVisuals>> {
    const startTime = Date.now();
    this.setState(AgentState.RUNNING);
    this.status = AgentStatus.RUNNING;

    try {
      // Perform text analysis
      const textAnalysis = await this.analyzeText(input);

      // Perform visual analysis
      const visualAnalysis = await this.analyzeVisuals({
        assets: input.assets ?? [],
        postId: input.postId,
        isCarousel: (input.assets?.length ?? 0) > 1,
      });

      // Calculate weighted overall score
      const overallScore = this.calculateOverallScore(
        textAnalysis.score,
        visualAnalysis.score.overall
      );

      const approved = overallScore >= this.config.threshold;

      const result: QAResultWithVisuals = {
        postId: input.postId,
        timestamp: new Date(),
        textAnalysis,
        visualAnalysis,
        overallScore,
        approved,
        threshold: this.config.threshold,
      };

      this.setState(AgentState.SUCCESS);
      this.status = AgentStatus.SUCCESS;

      return {
        success: true,
        data: result,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      this.setState(AgentState.ERROR);
      this.status = AgentStatus.ERROR;

      return {
        success: false,
        error: `QA analysis failed: ${(error as Error).message}`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Analyzes text content quality
   */
  async analyzeText(input: QAInput): Promise<TextAnalysisResult> {
    const criteria: Record<string, number> = {};
    const feedback: string[] = [];
    let totalScore = 0;
    let criteriaCount = 0;

    const content = input.textContent ||
      input.platformContent?.instagram ||
      input.platformContent?.linkedin ||
      '';

    // Length check
    const lengthScore = this.analyzeTextLength(content);
    criteria['length'] = lengthScore;
    totalScore += lengthScore;
    criteriaCount++;

    if (lengthScore < 6) {
      feedback.push('Considere ajustar o tamanho do texto para melhor engajamento');
    }

    // Hashtag analysis (for Instagram)
    if (input.platformContent?.instagram) {
      const hashtagScore = this.analyzeHashtags(input.platformContent.instagram);
      criteria['hashtags'] = hashtagScore;
      totalScore += hashtagScore;
      criteriaCount++;

      if (hashtagScore < 6) {
        feedback.push('Revise a quantidade e relevancia das hashtags');
      }
    }

    // Call-to-action check
    const ctaScore = this.analyzeCallToAction(content);
    criteria['callToAction'] = ctaScore;
    totalScore += ctaScore;
    criteriaCount++;

    if (ctaScore < 6) {
      feedback.push('Adicione um call-to-action mais claro');
    }

    // Readability check
    const readabilityScore = this.analyzeReadability(content);
    criteria['readability'] = readabilityScore;
    totalScore += readabilityScore;
    criteriaCount++;

    if (readabilityScore < 6) {
      feedback.push('Simplifique o texto para melhor legibilidade');
    }

    const score = criteriaCount > 0 ? totalScore / criteriaCount : 0;

    return {
      score: Math.round(score * 10) / 10,
      criteria,
      feedback,
    };
  }

  /**
   * Analyzes visual assets quality
   *
   * @param input - Visual analysis input with assets
   * @returns Visual analysis result
   */
  async analyzeVisuals(input: VisualAnalysisInput): Promise<VisualAnalysisResult> {
    const startTime = Date.now();
    const { assets, postId, isCarousel } = input;

    // Extract image paths
    const imagePaths = assets
      .filter(a => a.type === 'carousel_slide' || a.type === 'background_image')
      .map(a => a.path);

    if (imagePaths.length === 0) {
      return this.createEmptyVisualResult(postId, startTime);
    }

    // Try multimodal analysis first (if available)
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

    // Fallback: heuristic analysis
    return await this.analyzeHeuristic(imagePaths, postId, isCarousel, startTime);
  }

  /**
   * Performs heuristic visual analysis
   */
  private async analyzeHeuristic(
    imagePaths: string[],
    postId: string,
    isCarousel: boolean,
    startTime: number
  ): Promise<VisualAnalysisResult> {
    // Analyze each image with heuristic analyzer
    const slideResults = await this.heuristicAnalyzer.analyzeMultiple(imagePaths);

    // Analyze contrast and code for each image
    for (const slide of slideResults) {
      // Contrast analysis
      const contrastResult = await this.contrastAnalyzer.analyzeContrast(
        slide.path,
        slide.slideIndex
      );
      slide.contrastRatio = contrastResult.contrastRatio;
      slide.issues.push(...contrastResult.issues);

      // Code slide analysis
      const codeResult = await this.codeSlideAnalyzer.analyzeCodeSlide(
        slide.path,
        slide.slideIndex
      );
      slide.hasCode = codeResult.hasCode;
      slide.issues.push(...codeResult.issues);
    }

    // Analyze carousel consistency (if applicable)
    let carouselConsistency: SlideConsistencyResult | undefined;
    if (isCarousel && imagePaths.length > 1) {
      carouselConsistency = await this.carouselAnalyzer.analyze(imagePaths);

      // Add consistency issues to feedback
      if (!carouselConsistency.isConsistent) {
        for (const slideIndex of carouselConsistency.inconsistentSlides) {
          const slide = slideResults.find(s => s.slideIndex === slideIndex);
          if (slide) {
            slide.issues.push({
              type: VisualIssueType.INCONSISTENT_STYLE,
              severity: 'warning' as any,
              message: 'Slide inconsistente com o resto do carrossel',
              suggestion: 'Ajuste cores e layout para manter consistencia visual',
              slideIndex,
            });
          }
        }
      }
    }

    // Calculate aggregate scores
    const score = this.calculateAggregateScore(slideResults, carouselConsistency);

    // Collect all feedback
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
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Calculates aggregate visual score from slide results
   */
  private calculateAggregateScore(
    slides: SlideAnalysisResult[],
    consistency?: SlideConsistencyResult
  ): VisualScore {
    if (slides.length === 0) {
      return {
        overall: 10,
        dimensions: 10,
        fileQuality: 10,
        contrast: 10,
        readability: 10,
        codeFormatting: 10,
        consistency: 10,
      };
    }

    // Calculate average readability
    const avgReadability =
      slides.reduce((sum, s) => sum + s.readabilityScore, 0) / slides.length;

    // Calculate average contrast score
    const avgContrast =
      slides.reduce((sum, s) => sum + this.contrastToScore(s.contrastRatio), 0) /
      slides.length;

    // Check dimension issues
    const hasDimensionIssues = slides.some(s =>
      s.issues.some(i => i.type === VisualIssueType.WRONG_DIMENSIONS)
    );
    const dimensionScore = hasDimensionIssues ? 5 : 10;

    // Check file quality issues
    const hasFileIssues = slides.some(s =>
      s.issues.some(
        i =>
          i.type === VisualIssueType.FILE_TOO_LARGE ||
          i.type === VisualIssueType.FILE_TOO_SMALL
      )
    );
    const fileScore = hasFileIssues ? 6 : 10;

    // Code formatting score (average of code slides)
    const codeSlides = slides.filter(s => s.hasCode);
    const codeFormattingScore =
      codeSlides.length > 0
        ? codeSlides.reduce((sum, s) => {
            const codeIssues = s.issues.filter(
              i =>
                i.type === VisualIssueType.CODE_FORMATTING ||
                i.type === VisualIssueType.MISSING_SYNTAX_HIGHLIGHT
            );
            return sum + (10 - codeIssues.length * 2);
          }, 0) / codeSlides.length
        : 10;

    const consistencyScore = consistency?.score ?? 10;

    // Calculate weighted overall score
    const overall =
      avgReadability * 0.25 +
      avgContrast * 0.25 +
      dimensionScore * 0.15 +
      fileScore * 0.15 +
      consistencyScore * 0.2;

    return {
      overall: Math.round(overall * 10) / 10,
      dimensions: dimensionScore,
      fileQuality: fileScore,
      contrast: Math.round(avgContrast * 10) / 10,
      readability: Math.round(avgReadability * 10) / 10,
      codeFormatting: Math.round(codeFormattingScore * 10) / 10,
      consistency: consistencyScore,
    };
  }

  /**
   * Converts contrast ratio to score (0-10)
   */
  private contrastToScore(ratio: number): number {
    if (ratio >= 7) return 10;
    if (ratio >= 4.5) return 8;
    if (ratio >= 3) return 6;
    return Math.max(0, ratio * 2);
  }

  /**
   * Creates empty visual result for posts without visual assets
   */
  private createEmptyVisualResult(
    postId: string,
    startTime: number
  ): VisualAnalysisResult {
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
        consistency: 10,
      },
      slides: [],
      feedback: [],
      passed: true,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Calculates weighted overall score from text and visual scores
   */
  private calculateOverallScore(textScore: number, visualScore: number): number {
    const weighted =
      textScore * this.config.textWeight + visualScore * this.config.visualWeight;
    return Math.round(weighted * 10) / 10;
  }

  /**
   * Analyzes text length
   */
  private analyzeTextLength(content: string): number {
    const length = content.length;

    // Ideal length for Instagram: 125-150 characters for feed
    // LinkedIn: 100-300 characters for best engagement
    if (length < 50) return 4;
    if (length < 100) return 6;
    if (length <= 300) return 10;
    if (length <= 500) return 8;
    if (length <= 1000) return 6;
    return 4;
  }

  /**
   * Analyzes hashtag usage
   */
  private analyzeHashtags(content: string): number {
    const hashtags = content.match(/#\w+/g) || [];
    const count = hashtags.length;

    // Instagram best practice: 5-10 hashtags
    if (count === 0) return 4;
    if (count < 3) return 6;
    if (count <= 10) return 10;
    if (count <= 15) return 8;
    if (count <= 20) return 6;
    return 4; // Too many hashtags
  }

  /**
   * Analyzes call-to-action presence
   */
  private analyzeCallToAction(content: string): number {
    const ctaPatterns = [
      /siga/i,
      /follow/i,
      /coment[ea]/i,
      /curta/i,
      /like/i,
      /compartilh[ea]/i,
      /share/i,
      /salve/i,
      /save/i,
      /clique/i,
      /click/i,
      /link/i,
      /saiba mais/i,
      /learn more/i,
      /confira/i,
      /check out/i,
    ];

    const hasStrategicCTA = ctaPatterns.some(pattern => pattern.test(content));

    // Check for questions (engagement drivers)
    const hasQuestion = /\?/.test(content);

    if (hasStrategicCTA && hasQuestion) return 10;
    if (hasStrategicCTA || hasQuestion) return 8;
    return 5;
  }

  /**
   * Analyzes text readability
   */
  private analyzeReadability(content: string): number {
    // Simple readability metrics
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);

    if (sentences.length === 0 || words.length === 0) return 5;

    const avgWordsPerSentence = words.length / sentences.length;
    const avgWordLength =
      words.reduce((sum, w) => sum + w.length, 0) / words.length;

    // Shorter sentences and simpler words = better for social media
    let score = 10;

    if (avgWordsPerSentence > 20) score -= 2;
    if (avgWordsPerSentence > 30) score -= 2;
    if (avgWordLength > 7) score -= 1;
    if (avgWordLength > 9) score -= 1;

    return Math.max(0, score);
  }

  /**
   * Updates the agent state and triggers callback
   */
  private setState(newState: AgentState): void {
    const previous = this.state;
    this.state = newState;

    if (this.onStateChange) {
      this.onStateChange({ previous, current: newState });
    }
  }

  /**
   * Gets the current configuration
   */
  getConfig(): QAAnalystVisualConfig {
    return { ...this.config };
  }
}
