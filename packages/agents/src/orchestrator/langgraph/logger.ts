/**
 * LangGraph Transition Logger
 * Logging utilities for tracking node transitions and pipeline execution
 */

import { createLogger } from '@social-content/shared';
import type {
  TransitionLog,
  TransitionLogger,
  LangGraphPipelineState,
} from './types';
import { LOGGING_CONFIG } from './config';

const logger = createLogger('langgraph:transitions');

/**
 * Default implementation of the TransitionLogger interface
 */
class DefaultTransitionLogger implements TransitionLogger {
  private history: Map<string, TransitionLog[]> = new Map();

  /**
   * Log a transition between nodes
   */
  log(transition: TransitionLog): void {
    // Log to console/file using the shared logger
    const level = transition.success ? 'info' : 'error';
    logger[level](`Transition: ${transition.from} -> ${transition.to}`, {
      duration: transition.durationMs,
      success: transition.success,
      input: this.truncateString(transition.inputSummary),
      output: this.truncateString(transition.outputSummary),
      error: transition.error,
    });

    // Store in history by extracting execution ID from context
    // The from field contains node name, we use a fallback key
    const executionId = this.extractExecutionId(transition);
    if (!this.history.has(executionId)) {
      this.history.set(executionId, []);
    }
    this.history.get(executionId)!.push(transition);
  }

  /**
   * Get all transitions for a specific execution
   */
  getHistory(executionId: string): TransitionLog[] {
    return this.history.get(executionId) ?? [];
  }

  /**
   * Clear history for an execution
   */
  clearHistory(executionId: string): void {
    this.history.delete(executionId);
  }

  /**
   * Get all execution IDs with history
   */
  getExecutionIds(): string[] {
    return Array.from(this.history.keys());
  }

  /**
   * Get total transition count across all executions
   */
  getTotalTransitions(): number {
    let total = 0;
    for (const transitions of this.history.values()) {
      total += transitions.length;
    }
    return total;
  }

  /**
   * Extract execution ID from transition context
   */
  private extractExecutionId(transition: TransitionLog): string {
    // Try to parse execution ID from output summary if available
    const match = transition.outputSummary.match(/executionId:([^\s,]+)/);
    if (match) {
      return match[1]!;
    }
    // Fallback to a default key based on timestamp
    return `execution-${transition.timestamp.toISOString().split('T')[0]}`;
  }

  /**
   * Truncate long strings for logging
   */
  private truncateString(str: string): string {
    if (!LOGGING_CONFIG.includeFullState && str.length > LOGGING_CONFIG.maxStringLength) {
      return str.substring(0, LOGGING_CONFIG.maxStringLength) + '...';
    }
    return str;
  }
}

/**
 * Create a new TransitionLogger instance
 */
export function createTransitionLogger(): TransitionLogger {
  return new DefaultTransitionLogger();
}

/**
 * Summarize pipeline state for logging purposes
 */
export function summarizeState(state: Partial<LangGraphPipelineState>): string {
  const parts: string[] = [];

  if (state.executionId) {
    parts.push(`executionId:${state.executionId}`);
  }
  if (state.trends?.length) {
    parts.push(`trends:${state.trends.length}`);
  }
  if (state.topics?.length) {
    parts.push(`topics:${state.topics.length}`);
  }
  if (state.curatedContent?.length) {
    parts.push(`curated:${state.curatedContent.length}`);
  }
  if (state.posts?.length) {
    parts.push(`posts:${state.posts.length}`);
  }
  if (state.images?.length) {
    parts.push(`images:${state.images.length}`);
  }
  if (state.carouselPaths?.length) {
    parts.push(`carousels:${state.carouselPaths.length}`);
  }
  if (state.pdfPaths?.length) {
    parts.push(`pdfs:${state.pdfPaths.length}`);
  }
  if (state.qaResults?.length) {
    parts.push(`qa:${state.qaResults.length}`);
  }
  if (state.errors?.length) {
    parts.push(`errors:${state.errors.length}`);
  }

  return parts.length > 0 ? parts.join(', ') : 'empty';
}

/**
 * Create a transition log entry
 */
export function createTransitionLog(
  from: string,
  to: string,
  startTime: Date,
  state: Partial<LangGraphPipelineState>,
  success: boolean,
  error?: string
): TransitionLog {
  return {
    from,
    to,
    timestamp: new Date(),
    durationMs: Date.now() - startTime.getTime(),
    inputSummary: summarizeState(state),
    outputSummary: summarizeState(state),
    success,
    error,
  };
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${Math.floor(ms / 60000)}m ${((ms % 60000) / 1000).toFixed(0)}s`;
}

/**
 * Logger with execution context
 */
export class ExecutionLogger {
  private executionId: string;
  private transitionLogger: TransitionLogger;

  constructor(executionId: string, transitionLogger?: TransitionLogger) {
    this.executionId = executionId;
    this.transitionLogger = transitionLogger ?? createTransitionLogger();
  }

  /**
   * Log the start of a node
   */
  nodeStart(nodeName: string, state: LangGraphPipelineState): void {
    logger.info(`Node starting: ${nodeName}`, {
      executionId: this.executionId,
      currentNode: nodeName,
      status: state.status,
    });
  }

  /**
   * Log the completion of a node
   */
  nodeEnd(
    nodeName: string,
    previousNode: string,
    state: LangGraphPipelineState,
    duration: number
  ): void {
    logger.info(`Node completed: ${nodeName}`, {
      executionId: this.executionId,
      duration: formatDuration(duration),
      status: state.status,
    });

    this.transitionLogger.log({
      from: previousNode,
      to: nodeName,
      timestamp: new Date(),
      durationMs: duration,
      inputSummary: summarizeState(state),
      outputSummary: summarizeState(state),
      success: true,
    });
  }

  /**
   * Log a node error
   */
  nodeError(nodeName: string, previousNode: string, error: Error): void {
    logger.error(`Node failed: ${nodeName}`, {
      executionId: this.executionId,
      error: error.message,
      stack: error.stack,
    });

    this.transitionLogger.log({
      from: previousNode,
      to: nodeName,
      timestamp: new Date(),
      durationMs: 0,
      inputSummary: '',
      outputSummary: '',
      success: false,
      error: error.message,
    });
  }

  /**
   * Get the transition history for this execution
   */
  getHistory(): TransitionLog[] {
    return this.transitionLogger.getHistory(this.executionId);
  }
}
