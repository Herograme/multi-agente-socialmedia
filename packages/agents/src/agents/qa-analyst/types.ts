/**
 * QAAnalyst Agent Types
 * Types for quality criteria analysis of social media content
 */

/**
 * Quality criteria for content evaluation
 */
export enum QACriterion {
  // Text criteria
  CLARITY = 'clarity',
  RELEVANCE = 'relevance',
  ENGAGEMENT = 'engagement',
  GRAMMAR = 'grammar',

  // Code criteria
  CODE_SYNTAX = 'code_syntax',
  CODE_EXPLANATION = 'code_explanation',

  // Visual criteria
  VISUAL_LEGIBILITY = 'visual_legibility',
  VISUAL_CONTRAST = 'visual_contrast',
  VISUAL_COMPOSITION = 'visual_composition',
}

/**
 * Feedback severity levels
 */
export enum FeedbackSeverity {
  LOW = 'low', // Score 6-6.9
  MEDIUM = 'medium', // Score 5-5.9
  HIGH = 'high', // Score 3-4.9
  CRITICAL = 'critical', // Score < 3
}

/**
 * Agent state enum
 */
export enum AgentState {
  IDLE = 'idle',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
}

/**
 * Target platform for the post
 */
export type Platform = 'instagram' | 'linkedin';

/**
 * Code snippet for evaluation
 */
export interface CodeSnippet {
  code: string;
  language?: string;
  context?: string;
}

/**
 * Visual asset for evaluation
 */
export interface VisualAsset {
  path: string;
  type: 'image' | 'carousel' | 'pdf';
  index?: number;
}

/**
 * Input for QAAnalyst agent
 */
export interface QAAnalystInput {
  postId: string;
  text: string;
  platform: Platform;
  topic?: string;
  assets?: VisualAsset[];
  codeSnippets?: CodeSnippet[];
  metadata?: {
    generatedAt?: Date;
    authorHandle?: string;
  };
}

/**
 * Individual criterion score
 */
export interface CriteriaScore {
  criterion: QACriterion;
  score: number; // 0.0 - 10.0
  weight: number; // Weight in overall calculation
  feedback?: string; // Feedback if score < 7
  details?: string; // Additional evaluation details
}

/**
 * Structured improvement feedback
 */
export interface QAFeedback {
  criterion: QACriterion;
  score: number;
  severity: FeedbackSeverity;
  suggestion: string;
  example?: string;
}

/**
 * Quality analysis result
 */
export interface QAResult {
  postId: string;
  overallScore: number; // 0.0 - 10.0
  approved: boolean;
  scores: CriteriaScore[];
  feedback: QAFeedback[];
  summary: string; // Evaluation summary
  evaluatedAt: Date;
  evaluationDuration: number; // ms
}

/**
 * Alias for agent output
 */
export type QAAnalystOutput = QAResult;

/**
 * Weights for weighted average calculation
 */
export interface CriteriaWeights {
  [QACriterion.CLARITY]: number;
  [QACriterion.RELEVANCE]: number;
  [QACriterion.ENGAGEMENT]: number;
  [QACriterion.GRAMMAR]: number;
  [QACriterion.CODE_SYNTAX]: number;
  [QACriterion.CODE_EXPLANATION]: number;
  [QACriterion.VISUAL_LEGIBILITY]: number;
  [QACriterion.VISUAL_CONTRAST]: number;
  [QACriterion.VISUAL_COMPOSITION]: number;
}

/**
 * QAAnalyst agent configuration
 */
export interface QAAnalystConfig {
  approvalThreshold: number; // Minimum score for approval (default: 6.0)
  feedbackThreshold: number; // Score below which feedback is generated (default: 7.0)
  weights: Partial<CriteriaWeights>;
  enableVisualAnalysis: boolean;
  enableCodeAnalysis: boolean;
  maxEvaluationTime: number; // Timeout in ms (default: 60000)
}

/**
 * State change event
 */
export interface StateChangeEvent {
  previous: AgentState;
  current: AgentState;
}

/**
 * Evaluation phase event
 */
export interface EvaluationPhaseEvent {
  phase: 'text' | 'code' | 'visual';
  criteria: string[];
}

/**
 * Evaluation completed event
 */
export interface EvaluationCompletedEvent {
  phase: 'text' | 'code' | 'visual';
  scores: CriteriaScore[];
}

/**
 * LLM Service interface for dependency injection
 */
export interface LLMService {
  generate(options: LLMGenerateOptions): Promise<LLMGenerateResult>;
}

/**
 * LLM generation options
 */
export interface LLMGenerateOptions {
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

/**
 * LLM message format
 */
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * LLM generation result
 */
export interface LLMGenerateResult {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * QA evaluation error
 */
export class QAEvaluationError extends Error {
  constructor(
    message: string,
    public criterion: QACriterion,
    public code: string,
    public retriable: boolean = true
  ) {
    super(message);
    this.name = 'QAEvaluationError';
  }
}
