/**
 * LangGraph Checkpointer
 * Checkpoint persistence for pipeline state recovery
 */

import { MemorySaver } from '@langchain/langgraph';
import type { CheckpointData, Checkpointer, LangGraphPipelineState } from './types';
import { createLogger } from '@social-content/shared';

const logger = createLogger('langgraph:checkpointer');

/**
 * In-memory checkpointer implementation for development
 */
export class MemoryCheckpointer implements Checkpointer {
  private checkpoints: Map<string, CheckpointData> = new Map();

  /**
   * Save a checkpoint
   */
  async save(data: CheckpointData): Promise<void> {
    logger.debug('Saving checkpoint', {
      threadId: data.threadId,
      node: data.node,
      version: data.version,
    });
    this.checkpoints.set(data.threadId, data);
  }

  /**
   * Load a checkpoint by thread ID
   */
  async load(threadId: string): Promise<CheckpointData | null> {
    const checkpoint = this.checkpoints.get(threadId) ?? null;
    if (checkpoint) {
      logger.debug('Loaded checkpoint', {
        threadId,
        node: checkpoint.node,
        version: checkpoint.version,
      });
    } else {
      logger.debug('No checkpoint found', { threadId });
    }
    return checkpoint;
  }

  /**
   * List all checkpoints for an execution
   */
  async list(executionId: string): Promise<CheckpointData[]> {
    const results: CheckpointData[] = [];
    for (const checkpoint of this.checkpoints.values()) {
      if (checkpoint.state.executionId === executionId) {
        results.push(checkpoint);
      }
    }
    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Delete a checkpoint by thread ID
   */
  async delete(threadId: string): Promise<void> {
    logger.debug('Deleting checkpoint', { threadId });
    this.checkpoints.delete(threadId);
  }

  /**
   * Clear all checkpoints
   */
  async clear(): Promise<void> {
    logger.debug('Clearing all checkpoints');
    this.checkpoints.clear();
  }

  /**
   * Get the number of stored checkpoints
   */
  get size(): number {
    return this.checkpoints.size;
  }
}

/**
 * Wrapper for LangGraph MemorySaver with our Checkpointer interface
 */
export class LangGraphMemorySaverWrapper {
  private memorySaver: MemorySaver;
  private internalCheckpointer: MemoryCheckpointer;

  constructor() {
    this.memorySaver = new MemorySaver();
    this.internalCheckpointer = new MemoryCheckpointer();
  }

  /**
   * Get the underlying LangGraph MemorySaver for use with StateGraph
   */
  getMemorySaver(): MemorySaver {
    return this.memorySaver;
  }

  /**
   * Save additional checkpoint metadata
   */
  async saveMetadata(data: CheckpointData): Promise<void> {
    await this.internalCheckpointer.save(data);
  }

  /**
   * Load checkpoint metadata
   */
  async loadMetadata(threadId: string): Promise<CheckpointData | null> {
    return this.internalCheckpointer.load(threadId);
  }

  /**
   * List all checkpoint metadata for an execution
   */
  async listMetadata(executionId: string): Promise<CheckpointData[]> {
    return this.internalCheckpointer.list(executionId);
  }
}

/**
 * Create a memory-based checkpointer for development
 */
export function createMemoryCheckpointer(): MemoryCheckpointer {
  return new MemoryCheckpointer();
}

/**
 * Create a LangGraph MemorySaver wrapper
 */
export function createLangGraphCheckpointer(): LangGraphMemorySaverWrapper {
  return new LangGraphMemorySaverWrapper();
}

/**
 * Create a native LangGraph MemorySaver
 */
export function createMemorySaver(): MemorySaver {
  return new MemorySaver();
}

/**
 * Helper to build checkpoint data from pipeline state
 */
export function buildCheckpointData(
  threadId: string,
  state: Partial<LangGraphPipelineState>,
  node: string,
  version: number = 1
): CheckpointData {
  return {
    threadId,
    state,
    timestamp: new Date(),
    node,
    version,
  };
}

/**
 * Resume helper - validates checkpoint can be resumed
 */
export function validateCheckpointForResume(
  checkpoint: CheckpointData | null
): checkpoint is CheckpointData {
  if (!checkpoint) {
    logger.warn('No checkpoint to resume from');
    return false;
  }

  if (!checkpoint.state.executionId) {
    logger.warn('Checkpoint missing execution ID');
    return false;
  }

  logger.info('Checkpoint valid for resume', {
    threadId: checkpoint.threadId,
    node: checkpoint.node,
    executionId: checkpoint.state.executionId,
  });

  return true;
}
