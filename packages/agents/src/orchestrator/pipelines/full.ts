/**
 * Full Pipeline Implementation
 * Story 4.7 - Pipeline Completo End-to-End
 *
 * Orchestrates the complete content generation pipeline:
 * Pesquisador -> TopicGenerator -> Curador -> Writer -> Visual -> QAAnalyst
 */

import { createLogger, generateId } from '@social-content/shared';
import { PipelineOrchestrator } from '../pipeline';
import type { PipelineConfig, PipelineStep, PipelineResult } from '../types';
import {
  createResearcherAgent,
  createCuradorAgent,
  type ResearcherInput,
  type ResearcherOutput,
} from '../../agents';
import type {
  FullPipelineInput,
  FullPipelineOptions,
  FullPipelineOutput,
  FullPipelineCallbacks,
  ExecutionSummary,
  GeneratedPost,
  PipelineStepProgress,
} from './full-pipeline.types';
import {
  DEFAULT_FULL_PIPELINE_OPTIONS,
  DEFAULT_FULL_PIPELINE_CONFIG,
} from './full-pipeline.types';
import type { Agent, AgentResult } from '../../agents/types';
import { AgentStatus } from '../../agents/types';

const logger = createLogger('pipeline:full');

/**
 * Full pipeline configuration export
 */
export const FULL_PIPELINE_CONFIG = DEFAULT_FULL_PIPELINE_CONFIG;

/**
 * Mock TopicGenerator Agent
 * Selects top topics from researcher output for content generation
 */
class TopicGeneratorAgent implements Agent<ResearcherOutput, TopicGeneratorOutput> {
  name = 'TopicGenerator';
  status = AgentStatus.IDLE;
  private numTopics: number;

  constructor(numTopics: number = 3) {
    this.numTopics = numTopics;
  }

  async run(input: ResearcherOutput): Promise<AgentResult<TopicGeneratorOutput>> {
    const startTime = Date.now();
    this.status = AgentStatus.RUNNING;

    try {
      // Select top N trends - sorted by discovery date (most recent first)
      const sortedTrends = [...input.trends].sort((a, b) => {
        return b.discoveredAt.getTime() - a.discoveredAt.getTime();
      });

      const selectedTopics = sortedTrends.slice(0, this.numTopics).map((trend, index) => ({
        id: `topic-${generateId()}`,
        rank: index + 1,
        title: trend.title,
        description: trend.description ?? trend.title,
        source: trend.source,
        url: trend.url,
        engagementScore: index === 0 ? 8 : index === 1 ? 7 : 6, // Assign based on rank
        keywords: [trend.source, 'tech', 'development'],
        suggestedAngle: this.generateSuggestedAngle(trend.title),
      }));

      this.status = AgentStatus.SUCCESS;

      return {
        success: true,
        data: {
          topics: selectedTopics,
          metadata: {
            totalTrendsAnalyzed: input.trends.length,
            topicsSelected: selectedTopics.length,
            selectionCriteria: 'engagement_score',
          },
        },
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      this.status = AgentStatus.ERROR;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Topic generation failed',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private generateSuggestedAngle(_title: string): string {
    const angles = [
      'Practical guide with examples',
      'Key takeaways for developers',
      'How this impacts your workflow',
      'Step-by-step implementation',
      'Why this matters for your projects',
    ];
    return angles[Math.floor(Math.random() * angles.length)] ?? angles[0]!;
  }
}

interface SelectedTopic {
  id: string;
  rank: number;
  title: string;
  description: string;
  source: string;
  url: string;
  engagementScore: number;
  keywords: string[];
  suggestedAngle: string;
}

interface TopicGeneratorOutput {
  topics: SelectedTopic[];
  metadata: {
    totalTrendsAnalyzed: number;
    topicsSelected: number;
    selectionCriteria: string;
  };
}

/**
 * Mock Writer Agent
 * Generates social media posts from curated content
 */
class WriterAgent implements Agent<WriterInput, WriterOutput> {
  name = 'Writer';
  status = AgentStatus.IDLE;
  private platforms: 'instagram' | 'linkedin' | 'both';

  constructor(platforms: 'instagram' | 'linkedin' | 'both' = 'both') {
    this.platforms = platforms;
  }

  async run(input: WriterInput): Promise<AgentResult<WriterOutput>> {
    const startTime = Date.now();
    this.status = AgentStatus.RUNNING;

    try {
      const posts: WrittenPost[] = [];

      for (const topic of input.topics) {
        const post: WrittenPost = {
          id: `post-${generateId()}`,
          topicId: topic.id,
          topic: topic.title,
          references: input.curatedContent[topic.id] ?? [],
        };

        // Generate Instagram text
        if (this.platforms === 'instagram' || this.platforms === 'both') {
          post.textInstagram = this.generateInstagramText(topic, input.curatedContent[topic.id] ?? []);
        }

        // Generate LinkedIn text
        if (this.platforms === 'linkedin' || this.platforms === 'both') {
          post.textLinkedin = this.generateLinkedinText(topic, input.curatedContent[topic.id] ?? []);
        }

        posts.push(post);
      }

      this.status = AgentStatus.SUCCESS;

      return {
        success: true,
        data: {
          posts,
          metadata: {
            totalPosts: posts.length,
            platforms: this.platforms,
            generatedAt: new Date(),
          },
        },
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      this.status = AgentStatus.ERROR;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Writing failed',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private generateInstagramText(topic: SelectedTopic, _references: CuratedReference[]): string {
    const emoji = this.getTopicEmoji(topic.title);
    const hashtags = topic.keywords.map(k => `#${k.replace(/\s+/g, '')}`).join(' ');

    return `${emoji} ${topic.title}

${topic.suggestedAngle}

${topic.description.slice(0, 200)}${topic.description.length > 200 ? '...' : ''}

${hashtags} #dev #coding #tech`;
  }

  private generateLinkedinText(topic: SelectedTopic, references: CuratedReference[]): string {
    const refText = references.length > 0
      ? `\n\nFontes:\n${references.slice(0, 3).map(r => `- ${r.title}`).join('\n')}`
      : '';

    return `${topic.title}

${topic.suggestedAngle}

${topic.description}${refText}

#${topic.keywords.join(' #')}`;
  }

  private getTopicEmoji(title: string): string {
    const lowercaseTitle = title.toLowerCase();
    if (lowercaseTitle.includes('ai') || lowercaseTitle.includes('artificial')) return '';
    if (lowercaseTitle.includes('web') || lowercaseTitle.includes('frontend')) return '';
    if (lowercaseTitle.includes('security')) return '';
    if (lowercaseTitle.includes('cloud')) return '';
    if (lowercaseTitle.includes('database') || lowercaseTitle.includes('sql')) return '';
    return '';
  }
}

interface WriterInput {
  topics: SelectedTopic[];
  curatedContent: Record<string, CuratedReference[]>;
}

interface CuratedReference {
  title: string;
  url: string;
  summary?: string;
}

interface WrittenPost {
  id: string;
  topicId: string;
  topic: string;
  textInstagram?: string;
  textLinkedin?: string;
  references: CuratedReference[];
}

interface WriterOutput {
  posts: WrittenPost[];
  metadata: {
    totalPosts: number;
    platforms: string;
    generatedAt: Date;
  };
}

/**
 * Mock Visual Pipeline Agent
 * Wraps the visual pipeline for use in the full pipeline
 */
class VisualPipelineAgent implements Agent<VisualAgentInput, VisualAgentOutput> {
  name = 'Visual';
  status = AgentStatus.IDLE;
  private options: { numSlides: number; backgroundStyle: string };

  constructor(options: { numSlides?: number; backgroundStyle?: string } = {}) {
    this.options = {
      numSlides: options.numSlides ?? 5,
      backgroundStyle: options.backgroundStyle ?? 'tech',
    };
  }

  async run(input: VisualAgentInput): Promise<AgentResult<VisualAgentOutput>> {
    const startTime = Date.now();
    this.status = AgentStatus.RUNNING;

    try {
      // For now, generate placeholder asset paths
      // In production, this would call the actual visual pipeline
      const assets: PostAssets[] = [];

      for (const post of input.posts) {
        const postAssets: PostAssets = {
          postId: post.id,
          backgroundPath: `output/posts/${post.id}/background.png`,
          carouselPaths: Array.from({ length: this.options.numSlides }, (_, i) =>
            `output/posts/${post.id}/slide-${i + 1}.png`
          ),
          pdfPath: `output/posts/${post.id}/carousel.pdf`,
        };
        assets.push(postAssets);
      }

      this.status = AgentStatus.SUCCESS;

      return {
        success: true,
        data: {
          assets,
          metadata: {
            totalAssets: assets.length * (2 + this.options.numSlides), // bg + slides + pdf
            options: this.options,
            generatedAt: new Date(),
          },
        },
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      this.status = AgentStatus.ERROR;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Visual generation failed',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }
}

interface VisualAgentInput {
  posts: WrittenPost[];
}

interface PostAssets {
  postId: string;
  backgroundPath?: string;
  carouselPaths?: string[];
  pdfPath?: string;
}

interface VisualAgentOutput {
  assets: PostAssets[];
  metadata: {
    totalAssets: number;
    options: { numSlides: number; backgroundStyle: string };
    generatedAt: Date;
  };
}

/**
 * Mock QA Analyst Agent
 * Evaluates post quality and provides scores/feedback
 */
class QAAnalystAgent implements Agent<QAAgentInput, QAAgentOutput> {
  name = 'QAAnalyst';
  status = AgentStatus.IDLE;
  private qualityThreshold: number;

  constructor(qualityThreshold: number = 6.0) {
    this.qualityThreshold = qualityThreshold;
  }

  async run(input: QAAgentInput): Promise<AgentResult<QAAgentOutput>> {
    const startTime = Date.now();
    this.status = AgentStatus.RUNNING;

    try {
      const evaluations: PostEvaluation[] = [];

      for (const post of input.posts) {
        const evaluation = this.evaluatePost(post, input.assets[post.id]);
        evaluations.push(evaluation);
      }

      this.status = AgentStatus.SUCCESS;

      return {
        success: true,
        data: {
          evaluations,
          summary: this.calculateSummary(evaluations),
          metadata: {
            evaluatedAt: new Date(),
            qualityThreshold: this.qualityThreshold,
          },
        },
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      this.status = AgentStatus.ERROR;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'QA evaluation failed',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private evaluatePost(post: WrittenPost, assets?: PostAssets): PostEvaluation {
    // Simple scoring based on content presence and length
    let score = 5.0;
    const feedback: string[] = [];

    // Text quality checks
    if (post.textInstagram) {
      const len = post.textInstagram.length;
      if (len > 100) score += 1.0;
      if (len > 200) score += 0.5;
      if (len < 50) {
        score -= 1.0;
        feedback.push('Instagram text is too short');
      }
    } else {
      score -= 1.0;
      feedback.push('Missing Instagram text');
    }

    if (post.textLinkedin) {
      const len = post.textLinkedin.length;
      if (len > 200) score += 1.0;
      if (len > 400) score += 0.5;
      if (len < 100) {
        score -= 0.5;
        feedback.push('LinkedIn text could be longer');
      }
    }

    // Asset checks
    if (assets) {
      if (assets.backgroundPath) score += 0.5;
      if (assets.carouselPaths && assets.carouselPaths.length >= 3) score += 0.5;
      if (assets.pdfPath) score += 0.5;
    } else {
      feedback.push('No visual assets generated');
    }

    // Reference checks
    if (post.references.length > 0) {
      score += 0.5;
    } else {
      feedback.push('No references provided');
    }

    // Cap score at 10
    score = Math.min(10, Math.max(0, score));

    const status: 'approved' | 'needs_review' | 'rejected' =
      score >= this.qualityThreshold ? 'approved' :
      score >= this.qualityThreshold - 2 ? 'needs_review' : 'rejected';

    return {
      postId: post.id,
      score: Math.round(score * 100) / 100,
      status,
      feedback: feedback.length > 0 ? feedback : ['Quality meets standards'],
      criteria: {
        textQuality: score >= 6 ? 'good' : 'needs_improvement',
        visualQuality: assets ? 'good' : 'missing',
        referenceQuality: post.references.length > 0 ? 'good' : 'missing',
      },
    };
  }

  private calculateSummary(evaluations: PostEvaluation[]): QASummary {
    const total = evaluations.length;
    const approved = evaluations.filter(e => e.status === 'approved').length;
    const needsReview = evaluations.filter(e => e.status === 'needs_review').length;
    const avgScore = total > 0
      ? evaluations.reduce((sum, e) => sum + e.score, 0) / total
      : 0;

    return {
      totalEvaluated: total,
      approved,
      needsReview,
      rejected: total - approved - needsReview,
      averageScore: Math.round(avgScore * 100) / 100,
      distribution: {
        excellent: evaluations.filter(e => e.score >= 8.0).length,
        good: evaluations.filter(e => e.score >= 6.0 && e.score < 8.0).length,
        needsWork: evaluations.filter(e => e.score < 6.0).length,
      },
    };
  }
}

interface QAAgentInput {
  posts: WrittenPost[];
  assets: Record<string, PostAssets>;
}

interface PostEvaluation {
  postId: string;
  score: number;
  status: 'approved' | 'needs_review' | 'rejected';
  feedback: string[];
  criteria: {
    textQuality: string;
    visualQuality: string;
    referenceQuality: string;
  };
}

interface QASummary {
  totalEvaluated: number;
  approved: number;
  needsReview: number;
  rejected: number;
  averageScore: number;
  distribution: {
    excellent: number;
    good: number;
    needsWork: number;
  };
}

interface QAAgentOutput {
  evaluations: PostEvaluation[];
  summary: QASummary;
  metadata: {
    evaluatedAt: Date;
    qualityThreshold: number;
  };
}

/**
 * Create the full pipeline configuration
 */
export function createFullPipelineConfig(
  options: FullPipelineOptions
): PipelineConfig {
  const opts = { ...DEFAULT_FULL_PIPELINE_OPTIONS, ...options };
  const steps: PipelineStep<unknown, unknown>[] = [];

  // Step 1: Pesquisador - fetch trends from sources
  const researcherAgent = createResearcherAgent();
  steps.push({
    name: 'Pesquisador',
    agent: researcherAgent as unknown as PipelineStep<unknown, unknown>['agent'],
    timeout: 60000,
    retries: 2,
  });

  // Step 2: TopicGenerator - select best topics
  const topicGeneratorAgent = new TopicGeneratorAgent(opts.numPosts);
  steps.push({
    name: 'TopicGenerator',
    agent: topicGeneratorAgent as unknown as PipelineStep<unknown, unknown>['agent'],
    timeout: 30000,
    retries: 1,
  });

  // Step 3: Curador - fetch references for topics
  const curadorAgent = createCuradorAgent();
  steps.push({
    name: 'Curador',
    agent: curadorAgent as unknown as PipelineStep<unknown, unknown>['agent'],
    timeout: 90000,
    retries: 1,
  });

  // Step 4: Writer - generate post texts
  const writerAgent = new WriterAgent(opts.platforms);
  steps.push({
    name: 'Writer',
    agent: writerAgent as unknown as PipelineStep<unknown, unknown>['agent'],
    timeout: 120000,
    retries: 2,
  });

  // Step 5: Visual (conditional) - generate visual assets
  if (opts.includeVisual) {
    const visualAgent = new VisualPipelineAgent({
      numSlides: opts.carouselSlides,
      backgroundStyle: opts.backgroundStyle,
    });
    steps.push({
      name: 'Visual',
      agent: visualAgent as unknown as PipelineStep<unknown, unknown>['agent'],
      timeout: 300000, // 5 min for visual generation
      retries: 1,
    });
  }

  // Step 6: QAAnalyst - evaluate quality
  const qaAgent = new QAAnalystAgent(opts.qualityThreshold);
  steps.push({
    name: 'QAAnalyst',
    agent: qaAgent as unknown as PipelineStep<unknown, unknown>['agent'],
    timeout: 60000,
    retries: 1,
  });

  return {
    id: FULL_PIPELINE_CONFIG.id,
    name: FULL_PIPELINE_CONFIG.name,
    description: FULL_PIPELINE_CONFIG.description,
    steps,
    defaultTimeout: FULL_PIPELINE_CONFIG.defaultTimeout,
    defaultRetries: FULL_PIPELINE_CONFIG.defaultRetries,
  };
}

/**
 * Create the full pipeline orchestrator
 */
export function createFullPipeline(options: FullPipelineOptions = {}): PipelineOrchestrator {
  const config = createFullPipelineConfig(options);
  return new PipelineOrchestrator(config);
}

/**
 * Run the full pipeline with progress tracking
 */
export async function runFullPipeline(
  input: FullPipelineInput,
  options: FullPipelineOptions,
  callbacks: FullPipelineCallbacks = {}
): Promise<FullPipelineOutput> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_FULL_PIPELINE_OPTIONS, ...options };
  const stepProgress: Map<string, PipelineStepProgress> = new Map();

  logger.info('Starting full pipeline', { options: opts });

  const config = createFullPipelineConfig(opts);
  const orchestrator = new PipelineOrchestrator(config);

  // Setup event listeners for progress tracking
  orchestrator.on('pipeline:step:started', (event) => {
    stepProgress.set(event.stepName, {
      step: event.stepName,
      status: 'running',
      startedAt: event.timestamp,
    });
    callbacks.onStepStart?.(event.stepName, event.stepIndex, config.steps.length);
    callbacks.onProgress?.(
      Math.round((event.stepIndex / config.steps.length) * 100),
      event.stepName
    );
  });

  orchestrator.on('pipeline:step:completed', (event) => {
    const progress = stepProgress.get(event.stepName);
    if (progress) {
      progress.status = 'completed';
      progress.completedAt = event.timestamp;
      progress.durationMs = event.duration;
      progress.output = event.output;
    }
    callbacks.onStepComplete?.(event.stepName, event.output);
  });

  orchestrator.on('pipeline:step:failed', (event) => {
    const progress = stepProgress.get(event.stepName);
    if (progress) {
      progress.status = 'failed';
      progress.completedAt = event.timestamp;
      progress.error = event.error;
    }
    callbacks.onStepError?.(event.stepName, new Error(event.error));
  });

  // Prepare researcher input from sources configuration
  const sources = input.sources ?? { devto: true, hackernews: true, reddit: true };
  const researcherInput: ResearcherInput = {
    sources: Object.entries(sources)
      .filter(([_, enabled]) => enabled)
      .map(([name]) => name as 'devto' | 'hackernews' | 'reddit'),
    limit: 50,
    timeout: 10000,
  };

  try {
    const result = await orchestrator.run(researcherInput, {
      pipelineId: `full-${generateId()}`,
      abortSignal: callbacks.abortSignal,
      metadata: {
        options: opts,
        input,
      },
    });

    // Extract posts and calculate summary from result
    const { posts, summary } = extractResultsFromPipeline(result, opts);

    const output: FullPipelineOutput = {
      executionId: result.pipelineId,
      status: determineStatus(posts, opts),
      summary,
      posts,
      metadata: {
        startedAt: new Date(startTime),
        completedAt: new Date(),
        durationMs: Date.now() - startTime,
        options: opts,
      },
    };

    logger.info('Full pipeline completed', {
      executionId: output.executionId,
      status: output.status,
      postsGenerated: output.posts.length,
      durationMs: output.metadata.durationMs,
    });

    return output;
  } catch (error) {
    logger.error('Full pipeline failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Extract posts and summary from pipeline result
 */
function extractResultsFromPipeline(
  result: PipelineResult,
  _options: FullPipelineOptions
): { posts: GeneratedPost[]; summary: ExecutionSummary } {
  const posts: GeneratedPost[] = [];

  // Find the QA step result
  const qaStepResult = result.stepResults.find(s => s.stepName === 'QAAnalyst');
  const writerStepResult = result.stepResults.find(s => s.stepName === 'Writer');
  const visualStepResult = result.stepResults.find(s => s.stepName === 'Visual');

  if (qaStepResult?.output && writerStepResult?.output) {
    const qaOutput = qaStepResult.output as QAAgentOutput;
    const writerOutput = writerStepResult.output as WriterOutput;
    const visualOutput = visualStepResult?.output as VisualAgentOutput | undefined;

    // Create assets lookup
    const assetsMap = new Map<string, PostAssets>();
    if (visualOutput?.assets) {
      for (const asset of visualOutput.assets) {
        assetsMap.set(asset.postId, asset);
      }
    }

    // Build posts from writer output + QA evaluations
    for (const writtenPost of writerOutput.posts) {
      const evaluation = qaOutput.evaluations.find(e => e.postId === writtenPost.id);
      const assets = assetsMap.get(writtenPost.id);

      posts.push({
        id: writtenPost.id,
        topic: writtenPost.topic,
        textInstagram: writtenPost.textInstagram,
        textLinkedin: writtenPost.textLinkedin,
        score: evaluation?.score ?? 0,
        status: evaluation?.status ?? 'needs_review',
        assets: {
          backgroundPath: assets?.backgroundPath,
          carouselPaths: assets?.carouselPaths,
          pdfPath: assets?.pdfPath,
        },
        qaFeedback: evaluation?.feedback,
      });
    }
  }

  // Calculate summary
  const summary: ExecutionSummary = {
    totalGenerated: posts.length,
    totalApproved: posts.filter(p => p.status === 'approved').length,
    totalNeedsReview: posts.filter(p => p.status === 'needs_review').length,
    averageScore: posts.length > 0
      ? Math.round((posts.reduce((sum, p) => sum + p.score, 0) / posts.length) * 100) / 100
      : 0,
    scoreDistribution: {
      excellent: posts.filter(p => p.score >= 8.0).length,
      good: posts.filter(p => p.score >= 6.0 && p.score < 8.0).length,
      needsWork: posts.filter(p => p.score < 6.0).length,
    },
    assetsGenerated: {
      backgrounds: posts.filter(p => p.assets.backgroundPath).length,
      carouselSlides: posts.reduce((sum, p) => sum + (p.assets.carouselPaths?.length || 0), 0),
      pdfs: posts.filter(p => p.assets.pdfPath).length,
    },
  };

  return { posts, summary };
}

/**
 * Determine final pipeline status based on posts
 */
function determineStatus(
  posts: GeneratedPost[],
  _options: FullPipelineOptions
): 'completed' | 'partial' | 'failed' {
  if (posts.length === 0) return 'failed';
  const approved = posts.filter(p => p.status === 'approved').length;
  if (approved === posts.length) return 'completed';
  if (approved > 0) return 'partial';
  return 'failed';
}

/**
 * Get the full pipeline configuration
 */
export function getFullPipelineConfig(): typeof FULL_PIPELINE_CONFIG {
  return { ...FULL_PIPELINE_CONFIG };
}
