/**
 * Curador Service - Manages curador agent execution and results persistence
 */

import { promises as fs } from 'fs';
import path from 'path';
import { createLogger, generateId } from '@social-content/shared';
import type { Trend } from '@social-content/shared';
import {
  createCuradorAgent,
  type CuradorInput,
  type CuradorOutput,
} from '@social-content/agents';
import { getResearcherService } from './researcher.service';

const logger = createLogger('service:curador');

/**
 * Supported platforms for content curation
 */
export type Platform = 'instagram' | 'linkedin' | 'twitter';

/**
 * Options for starting curador execution
 */
export interface CuradorOptions {
  trendIds?: string[];
  useLatestTrends?: boolean;
  platforms?: Platform[];
  language?: string;
}

/**
 * Curador execution state
 */
export interface CuradorExecutionState {
  status: 'idle' | 'running' | 'completed' | 'failed';
  executionId: string | null;
  startedAt: Date | null;
  endTime?: Date;
  progress: {
    trendsTotal: number;
    trendsProcessed: number;
    percentComplete: number;
  };
  error?: string;
}

/**
 * Curated content for a platform
 */
export interface PlatformContent {
  instagram?: {
    caption: string;
    hashtags: string[];
    imagePrompt?: string;
  };
  linkedin?: {
    post: string;
    hashtags: string[];
  };
  twitter?: {
    thread: string[];
    hashtags: string[];
  };
}

/**
 * Curated content item
 */
export interface CuratedContentItem {
  trendId: string;
  trendTitle: string;
  platforms: PlatformContent;
  curatedAt: string;
}

/**
 * Curador service output
 */
export interface CuradorServiceOutput {
  curatedContent: CuratedContentItem[];
  metadata: {
    executionId: string;
    trendsProcessed: number;
    contentGenerated: number;
    platforms: Platform[];
    timestamp: string;
    duration: number;
  };
  sourceExecution?: {
    researcherExecutionId?: string;
    trendsUsed: number;
  };
}

/**
 * Persisted curador result format
 */
export interface PersistedCuradorResult extends CuradorServiceOutput {
  persistedAt: string;
  filePath: string;
}

/**
 * Get the output directory path
 */
function getOutputDir(): string {
  // Navigate from packages/api to project root
  return path.resolve(process.cwd(), '../../output/curated');
}

/**
 * Ensure output directory exists
 */
async function ensureOutputDir(): Promise<string> {
  const outputDir = getOutputDir();
  await fs.mkdir(outputDir, { recursive: true });
  return outputDir;
}

/**
 * Generate filename for persisted results
 */
function generateFilename(timestamp: Date): string {
  const isoString = timestamp.toISOString();
  // Replace colons with hyphens for filesystem compatibility
  const safeString = isoString.replace(/:/g, '-').replace(/\.\d{3}Z$/, '');
  return `${safeString}.json`;
}

/**
 * Curador Service class
 */
export class CuradorService {
  private currentExecution: CuradorExecutionState = {
    status: 'idle',
    executionId: null,
    startedAt: null,
    progress: {
      trendsTotal: 0,
      trendsProcessed: 0,
      percentComplete: 0,
    },
  };
  private lastResult: PersistedCuradorResult | null = null;

  /**
   * Start the curador agent execution
   */
  async startExecution(options: CuradorOptions = {}): Promise<{
    status: 'started';
    executionId: string;
    timestamp: string;
    message: string;
  }> {
    // Check if already running
    if (this.currentExecution.status === 'running') {
      throw new CuradorAlreadyRunningError(this.currentExecution.executionId!);
    }

    const executionId = `exec-curador-${generateId()}`;
    const startTime = new Date();

    // Get trends to curate
    const trends = await this.getTrendsForCuration(options);

    if (trends.length === 0) {
      throw new NoTrendsAvailableError();
    }

    logger.info('Starting curador execution', {
      executionId,
      trendsCount: trends.length,
      platforms: options.platforms ?? ['instagram', 'linkedin', 'twitter'],
    });

    // Set initial state
    this.currentExecution = {
      status: 'running',
      executionId,
      startedAt: startTime,
      progress: {
        trendsTotal: trends.length,
        trendsProcessed: 0,
        percentComplete: 0,
      },
    };

    // Start async execution (don't await)
    this.executeCurador(executionId, trends, options).catch((error) => {
      logger.error('Curador execution failed', { executionId, error: error.message });
    });

    return {
      status: 'started',
      executionId,
      timestamp: startTime.toISOString(),
      message: `Curadoria iniciada para ${trends.length} trends`,
    };
  }

  /**
   * Get trends for curation
   */
  private async getTrendsForCuration(options: CuradorOptions): Promise<Trend[]> {
    const researcherService = getResearcherService();

    // If specific trend IDs provided
    if (options.trendIds && options.trendIds.length > 0) {
      const results = await researcherService.getLatestResults();
      if (!results) {
        throw new NoTrendsAvailableError();
      }
      return results.trends.filter((t) => options.trendIds!.includes(t.id));
    }

    // Default: use latest trends
    if (options.useLatestTrends !== false) {
      const results = await researcherService.getLatestResults();
      if (!results) {
        throw new NoTrendsAvailableError();
      }

      logger.info('Using latest researcher trends', {
        trendsCount: results.trends.length,
        researcherExecutionId: results.metadata.executionId,
      });

      return results.trends;
    }

    return [];
  }

  /**
   * Execute the curador agent and persist results
   */
  private async executeCurador(
    executionId: string,
    trends: Trend[],
    options: CuradorOptions
  ): Promise<void> {
    const agent = createCuradorAgent();

    try {
      logger.info('Executing curador agent', {
        executionId,
        trendsCount: trends.length,
      });

      const agentInput: CuradorInput = {
        trends,
        options: {
          forceRefresh: false,
          minScore: 50,
        },
      };

      // Log trends being processed
      for (const trend of trends) {
        logger.debug('Processing trend', {
          executionId,
          trendId: trend.id,
          trendTitle: trend.title,
        });
      }

      const result = await agent.run(agentInput);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Agent execution failed');
      }

      // Update progress during processing
      this.updateProgress(trends.length, trends.length);

      const output = this.transformOutput(
        result.data,
        trends,
        executionId,
        options,
        result.duration
      );

      // Log curated content generated
      logger.info('Curated content generated', {
        executionId,
        contentCount: output.curatedContent.length,
        platforms: output.metadata.platforms,
      });

      // Persist results
      const persisted = await this.persistResults(output);

      // Update state
      this.currentExecution = {
        ...this.currentExecution,
        status: 'completed',
        endTime: new Date(),
        progress: {
          trendsTotal: trends.length,
          trendsProcessed: trends.length,
          percentComplete: 100,
        },
      };

      this.lastResult = persisted;

      logger.info('Curador execution completed', {
        executionId,
        trendsProcessed: output.metadata.trendsProcessed,
        contentGenerated: output.metadata.contentGenerated,
        duration: output.metadata.duration,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.currentExecution = {
        ...this.currentExecution,
        status: 'failed',
        endTime: new Date(),
        error: errorMessage,
      };

      logger.error('Curador execution failed', { executionId, error: errorMessage });
      throw error;
    }
  }

  /**
   * Update execution progress
   */
  private updateProgress(processed: number, total: number): void {
    this.currentExecution.progress = {
      trendsTotal: total,
      trendsProcessed: processed,
      percentComplete: Math.round((processed / total) * 100),
    };
  }

  /**
   * Transform agent output to service output
   */
  private transformOutput(
    agentOutput: CuradorOutput,
    trends: Trend[],
    executionId: string,
    options: CuradorOptions,
    duration: number
  ): CuradorServiceOutput {
    const platforms: Platform[] = options.platforms ?? ['instagram', 'linkedin', 'twitter'];

    // Transform curated content from agent output
    const curatedContent: CuratedContentItem[] = agentOutput.result.content.map((content) => ({
      trendId: content.id,
      trendTitle: content.title,
      platforms: this.generatePlatformContent(content, platforms),
      curatedAt: content.curatedAt.toISOString(),
    }));

    // If agent returns empty content, create placeholder entries for each trend
    // (skeleton implementation until actual LLM curation)
    if (curatedContent.length === 0) {
      for (const trend of trends) {
        curatedContent.push({
          trendId: trend.id,
          trendTitle: trend.title,
          platforms: this.generatePlatformContent(
            {
              id: trend.id,
              title: trend.title,
              summary: trend.description || '',
              tags: [],
              originalTrend: trend,
            },
            platforms
          ),
          curatedAt: new Date().toISOString(),
        });
      }
    }

    // Get researcher execution info
    const researcherService = getResearcherService();
    const researcherStatus = researcherService.getStatus();

    return {
      curatedContent,
      metadata: {
        executionId,
        trendsProcessed: trends.length,
        contentGenerated: curatedContent.length * platforms.length,
        platforms,
        timestamp: new Date().toISOString(),
        duration,
      },
      sourceExecution: {
        researcherExecutionId: researcherStatus?.executionId,
        trendsUsed: trends.length,
      },
    };
  }

  /**
   * Generate platform-specific content
   */
  private generatePlatformContent(
    content: {
      id: string;
      title: string;
      summary: string;
      tags?: string[];
      originalTrend: Trend;
    },
    platforms: Platform[]
  ): PlatformContent {
    const result: PlatformContent = {};
    const tags = content.tags ?? [];
    const hashtags = tags.length > 0 ? tags.map((t) => `#${t}`) : ['#Tech', '#Innovation'];

    if (platforms.includes('instagram')) {
      result.instagram = {
        caption: `${content.title}\n\n${content.summary}`,
        hashtags,
        imagePrompt: `Visual representation of ${content.title}`,
      };
    }

    if (platforms.includes('linkedin')) {
      result.linkedin = {
        post: `${content.title}\n\n${content.summary}\n\nO que voce acha dessa tendencia?`,
        hashtags,
      };
    }

    if (platforms.includes('twitter')) {
      result.twitter = {
        thread: [
          `${content.title} - Thread sobre essa tendencia interessante!`,
          content.summary.length > 280
            ? content.summary.substring(0, 277) + '...'
            : content.summary,
          'O que voces acham? Deixem seus comentarios!',
        ],
        hashtags: hashtags.slice(0, 3), // Twitter has fewer hashtag space
      };
    }

    return result;
  }

  /**
   * Persist results to JSON file
   */
  private async persistResults(output: CuradorServiceOutput): Promise<PersistedCuradorResult> {
    const outputDir = await ensureOutputDir();
    const timestamp = new Date(output.metadata.timestamp);
    const filename = generateFilename(timestamp);
    const filePath = path.join(outputDir, filename);

    const persisted: PersistedCuradorResult = {
      ...output,
      persistedAt: new Date().toISOString(),
      filePath,
    };

    await fs.writeFile(filePath, JSON.stringify(persisted, null, 2), 'utf-8');

    logger.info('Results persisted', {
      filePath,
      contentCount: output.curatedContent.length,
    });

    return persisted;
  }

  /**
   * Get the latest results
   */
  async getResults(executionId?: string): Promise<PersistedCuradorResult | null> {
    // If specific execution ID requested, try to find that file
    if (executionId) {
      return this.loadResultsByExecutionId(executionId);
    }

    // Return cached result if available
    if (this.lastResult) {
      return this.lastResult;
    }

    // Try to load from disk
    return this.loadLatestResults();
  }

  /**
   * Load results by execution ID
   */
  private async loadResultsByExecutionId(executionId: string): Promise<PersistedCuradorResult | null> {
    try {
      const outputDir = getOutputDir();
      const files = await fs.readdir(outputDir);
      const jsonFiles = files.filter((f) => f.endsWith('.json'));

      for (const file of jsonFiles) {
        const filePath = path.join(outputDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const result = JSON.parse(content) as PersistedCuradorResult;
        if (result.metadata.executionId === executionId) {
          return result;
        }
      }
      return null;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Load the latest results from disk
   */
  private async loadLatestResults(): Promise<PersistedCuradorResult | null> {
    try {
      const outputDir = getOutputDir();
      const files = await fs.readdir(outputDir);
      const jsonFiles = files.filter((f) => f.endsWith('.json')).sort().reverse();

      if (jsonFiles.length === 0) {
        return null;
      }

      const latestFileName = jsonFiles[0];
      if (!latestFileName) {
        return null;
      }
      const latestFile = path.join(outputDir, latestFileName);
      const content = await fs.readFile(latestFile, 'utf-8');
      const result = JSON.parse(content) as PersistedCuradorResult;

      this.lastResult = result;
      return result;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get current execution status
   */
  getStatus(): CuradorExecutionState {
    return { ...this.currentExecution };
  }

  /**
   * Check if curador is currently running
   */
  isRunning(): boolean {
    return this.currentExecution.status === 'running';
  }
}

/**
 * Error: Curador already running
 */
export class CuradorAlreadyRunningError extends Error {
  code = 'CURADOR_ALREADY_RUNNING';
  executionId: string;

  constructor(executionId: string) {
    super('Curador is already running. Check status endpoint.');
    this.name = 'CuradorAlreadyRunningError';
    this.executionId = executionId;
  }
}

/**
 * Error: No trends available
 */
export class NoTrendsAvailableError extends Error {
  code = 'NO_TRENDS_AVAILABLE';

  constructor() {
    super('No trends available for curation. Run researcher first.');
    this.name = 'NoTrendsAvailableError';
  }
}

/**
 * Error: No results found
 */
export class NoResultsFoundError extends Error {
  code = 'NO_RESULTS_FOUND';

  constructor() {
    super('No curador results available.');
    this.name = 'NoResultsFoundError';
  }
}

// Singleton instance
let serviceInstance: CuradorService | null = null;

/**
 * Get the curador service instance
 */
export function getCuradorService(): CuradorService {
  if (!serviceInstance) {
    serviceInstance = new CuradorService();
  }
  return serviceInstance;
}

/**
 * Create a new curador service instance (for testing)
 */
export function createCuradorService(): CuradorService {
  return new CuradorService();
}
