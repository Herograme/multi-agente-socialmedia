/**
 * Researcher Service - Manages researcher agent execution and results persistence
 */

import { promises as fs } from 'fs';
import path from 'path';
import { createLogger, generateId } from '@social-content/shared';
import type { Trend } from '@social-content/shared';
import {
  createResearcherAgent,
  type ResearcherInput,
  type ResearcherOutput,
  type SourceName,
} from '@social-content/agents';

const logger = createLogger('service:researcher');

/**
 * Execution state
 */
interface ExecutionState {
  executionId: string;
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  result?: ResearcherServiceOutput;
  error?: string;
}

/**
 * Output from the researcher service
 */
export interface ResearcherServiceOutput {
  trends: Trend[];
  metadata: {
    executionId: string;
    sourcesQueried: string[];
    totalFound: number;
    timestamp: string;
    duration: number;
  };
}

/**
 * Persisted result format
 */
export interface PersistedResult extends ResearcherServiceOutput {
  persistedAt: string;
  filePath: string;
}

/**
 * Get the output directory path
 */
function getOutputDir(): string {
  // Navigate from packages/api to project root
  return path.resolve(process.cwd(), '../../output/trends');
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
 * Researcher Service class
 */
export class ResearcherService {
  private currentExecution: ExecutionState | null = null;
  private lastResult: PersistedResult | null = null;

  /**
   * Start the researcher agent execution
   */
  async run(input?: { sources?: SourceName[]; limit?: number }): Promise<{
    status: 'started';
    executionId: string;
    timestamp: string;
  }> {
    // Check if already running
    if (this.currentExecution?.status === 'running') {
      throw new Error('Researcher is already running');
    }

    const executionId = `exec-${generateId()}`;
    const startTime = new Date();

    logger.info('Starting researcher execution', { executionId, input });

    // Set initial state
    this.currentExecution = {
      executionId,
      status: 'running',
      startTime,
    };

    // Start async execution (don't await)
    this.executeResearcher(executionId, input).catch((error) => {
      logger.error('Researcher execution failed', { executionId, error: error.message });
    });

    return {
      status: 'started',
      executionId,
      timestamp: startTime.toISOString(),
    };
  }

  /**
   * Execute the researcher agent and persist results
   */
  private async executeResearcher(
    executionId: string,
    input?: { sources?: SourceName[]; limit?: number }
  ): Promise<void> {
    const agent = createResearcherAgent();

    try {
      logger.info('Executing researcher agent', { executionId });

      const agentInput: ResearcherInput = {
        sources: input?.sources,
        limit: input?.limit,
      };

      const result = await agent.run(agentInput);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Agent execution failed');
      }

      const output = this.transformOutput(result.data, executionId, result.duration);

      // Persist results
      const persisted = await this.persistResults(output);

      // Update state
      this.currentExecution = {
        ...this.currentExecution!,
        status: 'completed',
        endTime: new Date(),
        result: output,
      };

      this.lastResult = persisted;

      logger.info('Researcher execution completed', {
        executionId,
        trendsFound: output.trends.length,
        duration: output.metadata.duration,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.currentExecution = {
        ...this.currentExecution!,
        status: 'failed',
        endTime: new Date(),
        error: errorMessage,
      };

      logger.error('Researcher execution failed', { executionId, error: errorMessage });
      throw error;
    }
  }

  /**
   * Transform agent output to service output
   */
  private transformOutput(
    agentOutput: ResearcherOutput,
    executionId: string,
    duration: number
  ): ResearcherServiceOutput {
    return {
      trends: agentOutput.trends,
      metadata: {
        executionId,
        sourcesQueried: agentOutput.metadata.sourcesQueried,
        totalFound: agentOutput.metadata.totalFound,
        timestamp: agentOutput.metadata.timestamp.toISOString(),
        duration,
      },
    };
  }

  /**
   * Persist results to JSON file
   */
  private async persistResults(output: ResearcherServiceOutput): Promise<PersistedResult> {
    const outputDir = await ensureOutputDir();
    const timestamp = new Date(output.metadata.timestamp);
    const filename = generateFilename(timestamp);
    const filePath = path.join(outputDir, filename);

    const persisted: PersistedResult = {
      ...output,
      persistedAt: new Date().toISOString(),
      filePath,
    };

    await fs.writeFile(filePath, JSON.stringify(persisted, null, 2), 'utf-8');

    logger.info('Results persisted', { filePath, trendsCount: output.trends.length });

    return persisted;
  }

  /**
   * Get the latest results
   */
  async getLatestResults(): Promise<PersistedResult | null> {
    // Return cached result if available
    if (this.lastResult) {
      return this.lastResult;
    }

    // Try to load from disk
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
      const result = JSON.parse(content) as PersistedResult;

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
  getStatus(): ExecutionState | null {
    return this.currentExecution;
  }

  /**
   * Check if researcher is currently running
   */
  isRunning(): boolean {
    return this.currentExecution?.status === 'running';
  }
}

// Singleton instance
let serviceInstance: ResearcherService | null = null;

/**
 * Get the researcher service instance
 */
export function getResearcherService(): ResearcherService {
  if (!serviceInstance) {
    serviceInstance = new ResearcherService();
  }
  return serviceInstance;
}

/**
 * Create a new researcher service instance (for testing)
 */
export function createResearcherService(): ResearcherService {
  return new ResearcherService();
}
