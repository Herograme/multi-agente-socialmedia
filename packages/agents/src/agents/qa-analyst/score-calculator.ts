/**
 * ScoreCalculator - Calculates weighted scores and generates feedback
 */

import type { CriteriaScore, QAFeedback, CriteriaWeights } from './types';
import { QACriterion, FeedbackSeverity } from './types';

/**
 * Default weights for all criteria
 */
const DEFAULT_WEIGHTS: CriteriaWeights = {
  [QACriterion.CLARITY]: 0.15,
  [QACriterion.RELEVANCE]: 0.2,
  [QACriterion.ENGAGEMENT]: 0.15,
  [QACriterion.GRAMMAR]: 0.1,
  [QACriterion.CODE_SYNTAX]: 0.1,
  [QACriterion.CODE_EXPLANATION]: 0.1,
  [QACriterion.VISUAL_LEGIBILITY]: 0.08,
  [QACriterion.VISUAL_CONTRAST]: 0.06,
  [QACriterion.VISUAL_COMPOSITION]: 0.06,
};

/**
 * Improvement suggestions per criterion
 */
const IMPROVEMENT_SUGGESTIONS: Record<QACriterion, string[]> = {
  [QACriterion.CLARITY]: [
    'Simplifique frases longas e complexas',
    'Use paragrafos mais curtos para melhor leitura',
    'Evite jargoes tecnicos sem explicacao',
  ],
  [QACriterion.RELEVANCE]: [
    'Adicione exemplos praticos relacionados ao topico',
    'Inclua dados ou estatisticas atuais',
    'Conecte o conteudo com problemas reais de desenvolvedores',
  ],
  [QACriterion.ENGAGEMENT]: [
    'Crie um hook mais impactante na primeira linha',
    'Adicione um call-to-action claro no final',
    'Use perguntas para gerar interacao',
  ],
  [QACriterion.GRAMMAR]: [
    'Revise a concordancia verbal e nominal',
    'Verifique a acentuacao das palavras',
    'Corrija erros de digitacao identificados',
  ],
  [QACriterion.CODE_SYNTAX]: [
    'Verifique se o codigo compila/executa sem erros',
    'Melhore a formatacao e indentacao',
    'Use nomes de variaveis mais descritivos',
  ],
  [QACriterion.CODE_EXPLANATION]: [
    'Adicione comentarios explicativos no codigo',
    'Explique o proposito de cada parte do codigo',
    'Inclua contexto sobre quando usar esse codigo',
  ],
  [QACriterion.VISUAL_LEGIBILITY]: [
    'Aumente a resolucao da imagem para pelo menos 1080px',
    'Verifique se o texto sobre a imagem e legivel',
    'Use fonte maior para melhor leitura em dispositivos moveis',
  ],
  [QACriterion.VISUAL_CONTRAST]: [
    'Aumente o contraste entre texto e fundo',
    'Use overlay mais escuro sobre imagens de fundo',
    'Escolha cores de texto que se destaquem',
  ],
  [QACriterion.VISUAL_COMPOSITION]: [
    'Ajuste o aspect ratio para o padrao da plataforma',
    'Centralize elementos importantes',
    'Mantenha espacamento consistente entre elementos',
  ],
};

/**
 * ScoreCalculator class
 */
export class ScoreCalculator {
  private weights: CriteriaWeights;

  constructor(customWeights?: Partial<CriteriaWeights>) {
    this.weights = { ...DEFAULT_WEIGHTS, ...customWeights };
  }

  /**
   * Calculate weighted overall score
   */
  calculateWeightedScore(scores: CriteriaScore[]): number {
    // Filter scores with weight > 0
    const activeScores = scores.filter((s) => s.weight > 0 || this.weights[s.criterion] > 0);

    if (activeScores.length === 0) {
      return 0;
    }

    let totalWeight = 0;
    let weightedSum = 0;

    for (const score of activeScores) {
      const weight = score.weight > 0 ? score.weight : this.weights[score.criterion];
      weightedSum += score.score * weight;
      totalWeight += weight;
    }

    if (totalWeight === 0) {
      // Fallback to simple average
      return Number(
        (activeScores.reduce((sum, s) => sum + s.score, 0) / activeScores.length).toFixed(1)
      );
    }

    return Number((weightedSum / totalWeight).toFixed(1));
  }

  /**
   * Determine feedback severity based on score
   */
  private getSeverity(score: number): FeedbackSeverity {
    if (score < 3) return FeedbackSeverity.CRITICAL;
    if (score < 5) return FeedbackSeverity.HIGH;
    if (score < 6) return FeedbackSeverity.MEDIUM;
    return FeedbackSeverity.LOW;
  }

  /**
   * Generate feedback for scores below threshold
   */
  generateFeedback(scores: CriteriaScore[], threshold: number = 7.0): QAFeedback[] {
    const feedbacks: QAFeedback[] = [];

    for (const score of scores) {
      if (score.score < threshold) {
        const suggestions = IMPROVEMENT_SUGGESTIONS[score.criterion] ?? [];
        const severity = this.getSeverity(score.score);

        feedbacks.push({
          criterion: score.criterion,
          score: score.score,
          severity,
          suggestion: score.feedback ?? suggestions[0] ?? 'Melhore este criterio',
          example: suggestions[1],
        });
      }
    }

    // Sort by severity (most critical first)
    const severityOrder = {
      [FeedbackSeverity.CRITICAL]: 0,
      [FeedbackSeverity.HIGH]: 1,
      [FeedbackSeverity.MEDIUM]: 2,
      [FeedbackSeverity.LOW]: 3,
    };

    return feedbacks.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }

  /**
   * Determine if post is approved
   */
  determineApproval(overallScore: number, threshold: number): boolean {
    return overallScore >= threshold;
  }

  /**
   * Generate textual evaluation summary
   */
  generateSummary(overallScore: number, approved: boolean, feedbacks: QAFeedback[]): string {
    if (approved && feedbacks.length === 0) {
      return `Post aprovado com score ${overallScore}/10. Qualidade excelente em todos os criterios.`;
    }

    if (approved) {
      return `Post aprovado com score ${overallScore}/10. ${feedbacks.length} ponto(s) podem ser melhorados.`;
    }

    const criticalCount = feedbacks.filter((f) => f.severity === FeedbackSeverity.CRITICAL).length;
    const highCount = feedbacks.filter((f) => f.severity === FeedbackSeverity.HIGH).length;

    if (criticalCount > 0) {
      return `Post reprovado com score ${overallScore}/10. ${criticalCount} problema(s) critico(s) identificado(s).`;
    }

    if (highCount > 0) {
      return `Post reprovado com score ${overallScore}/10. ${highCount} problema(s) importante(s) precisam atencao.`;
    }

    return `Post reprovado com score ${overallScore}/10. Revise os criterios com feedback negativo.`;
  }

  /**
   * Get current weights
   */
  getWeights(): CriteriaWeights {
    return { ...this.weights };
  }
}

/**
 * Get default weights
 */
export function getDefaultWeights(): CriteriaWeights {
  return { ...DEFAULT_WEIGHTS };
}

/**
 * Get improvement suggestions for a criterion
 */
export function getImprovementSuggestions(criterion: QACriterion): string[] {
  return [...(IMPROVEMENT_SUGGESTIONS[criterion] ?? [])];
}

/**
 * Default text weights for backward compatibility
 */
const DEFAULT_TEXT_WEIGHTS = {
  [QACriterion.CLARITY]: 0.25,
  [QACriterion.RELEVANCE]: 0.3,
  [QACriterion.ENGAGEMENT]: 0.25,
  [QACriterion.GRAMMAR]: 0.2,
};

/**
 * Default code weights for backward compatibility
 */
const DEFAULT_CODE_WEIGHTS = {
  [QACriterion.CODE_SYNTAX]: 0.5,
  [QACriterion.CODE_EXPLANATION]: 0.5,
};

/**
 * Default visual weights for backward compatibility
 */
const DEFAULT_VISUAL_WEIGHTS = {
  [QACriterion.VISUAL_LEGIBILITY]: 0.4,
  [QACriterion.VISUAL_CONTRAST]: 0.3,
  [QACriterion.VISUAL_COMPOSITION]: 0.3,
};

/**
 * Get default text weights (for backward compatibility)
 */
export function getDefaultTextWeights(): typeof DEFAULT_TEXT_WEIGHTS {
  return { ...DEFAULT_TEXT_WEIGHTS };
}

/**
 * Get default code weights (for backward compatibility)
 */
export function getDefaultCodeWeights(): typeof DEFAULT_CODE_WEIGHTS {
  return { ...DEFAULT_CODE_WEIGHTS };
}

/**
 * Get default visual weights (for backward compatibility)
 */
export function getDefaultVisualWeights(): typeof DEFAULT_VISUAL_WEIGHTS {
  return { ...DEFAULT_VISUAL_WEIGHTS };
}

/**
 * Image quality thresholds
 */
const IMAGE_QUALITY_THRESHOLDS = {
  minWidth: 1080,
  minHeight: 1080,
  minFileSize: 50 * 1024, // 50KB
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFormats: ['png', 'jpg', 'jpeg', 'webp'],
};

/**
 * Get image quality thresholds
 */
export function getImageQualityThresholds(): typeof IMAGE_QUALITY_THRESHOLDS {
  return { ...IMAGE_QUALITY_THRESHOLDS };
}
