/**
 * Curador Agent
 * Curates and processes content from multiple sources
 */

import { EventEmitter } from 'events';
import type { Agent, AgentResult } from '../types';
import { AgentStatus } from '../types';
import type {
  AgentState,
  CuradorConfig,
  CuradorInput,
  CuradorOutput,
  CurationResult,
  StateChangeEvent,
} from './types';
import { AgentState as CuradorAgentState } from './types';

/**
 * CuradorAgent class
 * Implements content curation with lifecycle management
 */
export class CuradorAgent
  extends EventEmitter
  implements Agent<CuradorInput, CuradorOutput>
{
  readonly name = 'CuradorAgent';
  status: AgentStatus = AgentStatus.IDLE;

  private state: AgentState = CuradorAgentState.IDLE;
  private readonly config: CuradorConfig;

  constructor(config: CuradorConfig) {
    super();
    this.config = config;
  }

  /**
   * Get the current agent state
   */
  getState(): AgentState {
    return this.state;
  }

  /**
   * Get the agent configuration
   */
  getConfig(): CuradorConfig {
    return { ...this.config };
  }

  /**
   * Set a new state and emit stateChange event
   */
  private setState(newState: AgentState): void {
    const previousState = this.state;
    this.state = newState;

    // Sync status with state
    switch (newState) {
      case CuradorAgentState.IDLE:
        this.status = AgentStatus.IDLE;
        break;
      case CuradorAgentState.RUNNING:
        this.status = AgentStatus.RUNNING;
        break;
      case CuradorAgentState.SUCCESS:
        this.status = AgentStatus.SUCCESS;
        break;
      case CuradorAgentState.ERROR:
        this.status = AgentStatus.ERROR;
        break;
    }

    const event: StateChangeEvent = {
      previous: previousState,
      current: newState,
    };

    this.emit('stateChange', event);
  }

  /**
   * Run the curador agent
   */
  async run(input: CuradorInput): Promise<AgentResult<CuradorOutput>> {
    const startTime = Date.now();
    this.setState(CuradorAgentState.RUNNING);

    try {
      // Skeleton implementation - actual curation logic in future stories
      const result: CurationResult = {
        success: true,
        content: [],
        stats: {
          totalProcessed: input.trends.length,
          totalCurated: 0,
          totalFiltered: 0,
          processingTimeMs: 0,
        },
        errors: [],
        timestamp: new Date(),
      };

      const processingTimeMs = Date.now() - startTime;
      result.stats.processingTimeMs = processingTimeMs;

      this.setState(CuradorAgentState.SUCCESS);

      const output: CuradorOutput = {
        result,
        state: this.state,
      };

      return {
        success: true,
        data: output,
        duration: processingTimeMs,
        timestamp: new Date(),
      };
    } catch (error) {
      this.setState(CuradorAgentState.ERROR);
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        error: errorMessage,
        duration,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Start the agent (transition to running state)
   */
  start(): void {
    if (this.state === CuradorAgentState.IDLE) {
      this.setState(CuradorAgentState.RUNNING);
    }
  }

  /**
   * Stop the agent (transition to idle state)
   */
  stop(): void {
    this.setState(CuradorAgentState.IDLE);
  }

  /**
   * Reset the agent to idle state
   */
  reset(): void {
    this.setState(CuradorAgentState.IDLE);
  }
}
