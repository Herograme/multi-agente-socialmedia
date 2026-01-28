/**
 * PDFMaker Agent
 * Compiles carousel slide images into PDF documents for LinkedIn
 */

import { EventEmitter } from 'events';
import type { Agent, AgentResult } from '../types';
import { AgentStatus } from '../types';
import type {
  PDFMakerConfig,
  PDFMakerInput,
  PDFMakerOutput,
  StateChangeEvent,
} from './types';
import { AgentState, PDFRenderMode } from './types';
import { PDFService } from './pdf-service';
import { ensureOutputDirectory, getOutputPath, getFileSize } from './utils';

/**
 * PDFMakerAgent class
 * Implements PDF generation with lifecycle management
 */
export class PDFMakerAgent
  extends EventEmitter
  implements Agent<PDFMakerInput, PDFMakerOutput>
{
  readonly name = 'PDFMakerAgent';
  status: AgentStatus = AgentStatus.IDLE;

  private state: AgentState = AgentState.IDLE;
  private readonly config: PDFMakerConfig;
  private pdfService: PDFService;

  constructor(config: PDFMakerConfig) {
    super();
    this.config = config;
    this.pdfService = new PDFService(config);
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
  getConfig(): PDFMakerConfig {
    return {
      ...this.config,
      dimensions: { ...this.config.dimensions },
      margin: { ...this.config.margin },
    };
  }

  /**
   * Set a new state and emit stateChange event
   */
  private setState(newState: AgentState): void {
    const previousState = this.state;
    this.state = newState;

    // Sync status with state
    switch (newState) {
      case AgentState.IDLE:
        this.status = AgentStatus.IDLE;
        break;
      case AgentState.RUNNING:
        this.status = AgentStatus.RUNNING;
        break;
      case AgentState.SUCCESS:
        this.status = AgentStatus.SUCCESS;
        break;
      case AgentState.ERROR:
        this.status = AgentStatus.ERROR;
        break;
    }

    const event: StateChangeEvent = {
      previous: previousState,
      current: newState,
      timestamp: new Date(),
    };

    this.emit('stateChange', event);
  }

  /**
   * Run the PDFMaker agent
   * Generates a PDF from images or HTML content
   */
  async run(input: PDFMakerInput): Promise<AgentResult<PDFMakerOutput>> {
    const startTime = Date.now();
    this.setState(AgentState.RUNNING);

    try {
      // Validate input
      this.validateInput(input);

      // Ensure output directory exists
      await ensureOutputDirectory(input.postId, this.config.outputDir);

      // Generate PDF based on mode
      let pdfBuffer: Buffer;
      let pageCount: number;

      if (input.mode === PDFRenderMode.FROM_IMAGES) {
        const result = await this.pdfService.createPDFFromImages(
          input.imagePaths!,
          input.metadata
        );
        pdfBuffer = result.buffer;
        pageCount = result.pageCount;
      } else {
        const result = await this.pdfService.createPDFFromHTML(
          input.htmlContent!,
          input.cssStyles,
          input.metadata
        );
        pdfBuffer = result.buffer;
        pageCount = result.pageCount;
      }

      // Save PDF
      const pdfPath = getOutputPath(
        input.postId,
        'document.pdf',
        this.config.outputDir
      );
      await this.pdfService.savePDF(pdfBuffer, pdfPath);

      // Get file size
      const fileSize = await getFileSize(pdfPath);

      const output: PDFMakerOutput = {
        success: true,
        pdfPath,
        fileSize,
        pageCount,
        metadata: input.metadata,
        renderMode: input.mode,
        generatedAt: new Date(),
      };

      this.setState(AgentState.SUCCESS);

      return {
        success: true,
        data: output,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      this.setState(AgentState.ERROR);
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
   * Validates the input for PDF generation
   * @param input - PDFMakerInput to validate
   * @throws Error if validation fails
   */
  private validateInput(input: PDFMakerInput): void {
    if (!input.postId) {
      throw new Error('postId is required');
    }

    if (!input.metadata?.title) {
      throw new Error('metadata.title is required');
    }

    if (!input.metadata?.author) {
      throw new Error('metadata.author is required');
    }

    if (input.mode === PDFRenderMode.FROM_IMAGES) {
      if (!input.imagePaths || input.imagePaths.length === 0) {
        throw new Error('imagePaths is required for FROM_IMAGES mode');
      }
    } else if (input.mode === PDFRenderMode.FROM_HTML) {
      if (!input.htmlContent) {
        throw new Error('htmlContent is required for FROM_HTML mode');
      }
    } else {
      throw new Error('Invalid render mode');
    }
  }

  /**
   * Start the agent (transition to running state)
   */
  start(): void {
    if (this.state === AgentState.IDLE) {
      this.setState(AgentState.RUNNING);
    }
  }

  /**
   * Stop the agent (transition to idle state)
   */
  stop(): void {
    this.setState(AgentState.IDLE);
  }

  /**
   * Reset the agent to idle state
   */
  reset(): void {
    this.setState(AgentState.IDLE);
  }

  /**
   * Close the PDF service and release resources
   */
  async close(): Promise<void> {
    await this.pdfService.close();
  }
}
