// Quality Gate types - Social Content Agent

/**
 * Status de aprovacao do post pelo Quality Gate
 */
export enum PostApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  NEEDS_REVIEW = 'needs_review',
  REJECTED = 'rejected',
}

/**
 * Configuracao do Quality Gate
 */
export interface QualityGateConfig {
  /** Score minimo para aprovacao (0-10) */
  threshold: number;
  /** Regenerar automaticamente posts reprovados */
  autoRegenerate: boolean;
  /** Maximo de tentativas de regeneracao */
  maxRegenerations: number;
}

/**
 * Resultado da avaliacao do Quality Gate
 */
export interface QualityGateResult {
  /** Se o post foi aprovado */
  approved: boolean;
  /** Status de aprovacao */
  status: PostApprovalStatus;
  /** Score do post */
  score: number;
  /** Threshold usado na avaliacao */
  threshold: number;
  /** Feedback sobre a avaliacao */
  feedback?: string;
  /** Se o post pode ser regenerado */
  canRegenerate: boolean;
}

/**
 * Metricas de qualidade agregadas
 */
export interface QualityMetrics {
  /** Total de posts avaliados */
  totalPosts: number;
  /** Quantidade de posts aprovados */
  approvedCount: number;
  /** Quantidade de posts que precisam revisao */
  needsReviewCount: number;
  /** Percentual de aprovados (0-100) */
  approvalRate: number;
  /** Score medio */
  averageScore: number;
  /** Distribuicao de scores por bucket */
  scoreDistribution: ScoreDistribution;
  /** Periodo do calculo */
  period: MetricsPeriod;
  /** Data/hora do calculo */
  calculatedAt: Date;
}

/**
 * Distribuicao de scores em buckets
 */
export interface ScoreDistribution {
  '0-2': number;
  '2-4': number;
  '4-6': number;
  '6-8': number;
  '8-10': number;
}

/**
 * Periodo para calculo de metricas
 */
export type MetricsPeriod = '24h' | '7d' | '30d' | 'all';

/**
 * Resultado do QA para avaliacao
 */
export interface QAResult {
  /** Score geral do post */
  overallScore: number;
  /** Breakdown por criterio */
  criteriaBreakdown: CriteriaBreakdownItem[];
}

/**
 * Item do breakdown de criterios
 */
export interface CriteriaBreakdownItem {
  /** Nome do criterio */
  name: string;
  /** Score do criterio */
  score: number;
  /** Feedback do criterio */
  feedback?: string;
}
