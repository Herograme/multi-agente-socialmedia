/**
 * ImageDesigner Agent
 * Generates optimized prompts and coordinates image generation for tech-themed backgrounds
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import type { Agent, AgentResult } from '../types';
import { AgentStatus } from '../types';
import type {
  ImageDesignerConfig,
  ImageDesignerInput,
  ImageDesignerOutput,
  StateChangeEvent,
  AttemptEvent,
} from './types';
import { AgentState } from './types';
import {
  generateBackgroundPrompt,
  generateAlternativePrompt,
  getAlternativeStyle,
} from './prompt-generator';
import {
  validateImage,
  getOutputPath,
  ensureOutputDirectory,
} from './image-validator';
import type {
  ImageGenService,
  ImageGenOptions,
} from '../../services/image-gen';
import { AspectRatio } from '../../services/image-gen';

/**
 * ImageDesignerAgent class
 * Implements background image design with prompt generation and retry logic
 */
export class ImageDesignerAgent
  extends EventEmitter
  implements Agent<ImageDesignerInput, ImageDesignerOutput>
{
  readonly name = 'ImageDesignerAgent';
  status: AgentStatus = AgentStatus.IDLE;

  private state: AgentState = AgentState.IDLE;
  private readonly config: ImageDesignerConfig;
  private imageGenService?: ImageGenService;

  constructor(config: ImageDesignerConfig, imageGenService?: ImageGenService) {
    super();
    this.config = config;
    this.imageGenService = imageGenService;
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
  getConfig(): ImageDesignerConfig {
    return { ...this.config };
  }

  /**
   * Set the ImageGenService (for dependency injection)
   */
  setImageGenService(service: ImageGenService): void {
    this.imageGenService = service;
  }

  /**
   * Check if ImageGenService is configured
   */
  hasImageGenService(): boolean {
    return this.imageGenService !== undefined;
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
    };

    this.emit('stateChange', event);
  }

  /**
   * Run the ImageDesigner agent
   * Generates a prompt and coordinates image generation with retry logic
   */
  async run(input: ImageDesignerInput): Promise<AgentResult<ImageDesignerOutput>> {
    const startTime = Date.now();
    this.setState(AgentState.RUNNING);

    // Validate ImageGenService is available
    if (!this.imageGenService) {
      this.setState(AgentState.ERROR);
      return {
        success: false,
        error: 'ImageGenService is not configured. Call setImageGenService() first.',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }

    const style = input.style ?? this.config.defaultStyle;
    let retryCount = 0;
    let lastError: string | undefined;
    let currentPrompt = generateBackgroundPrompt(input.topic, input.content, style);
    let currentStyle = style;

    try {
      while (retryCount <= this.config.maxRetries) {
        // Emit attempt event
        const attemptEvent: AttemptEvent = {
          retryCount,
          prompt: currentPrompt,
          style: currentStyle,
        };
        this.emit('attempt', attemptEvent);

        try {
          // Generate image via ImageGenService
          const genOptions: ImageGenOptions = {
            prompt: currentPrompt,
            style: currentStyle,
            aspectRatio: AspectRatio.SQUARE,
            size: {
              width: this.config.minWidth,
              height: this.config.minHeight,
            },
            outputPath: this.config.outputDir,
            metadata: {
              postId: input.postId,
            },
          };

          const generatedImage = await this.imageGenService.generate(genOptions);

          // Define output path
          const outputDir = path.join(this.config.outputDir, input.postId);
          const outputPath = getOutputPath(
            this.config.outputDir,
            input.postId,
            generatedImage.format
          );

          // Ensure directory exists
          ensureOutputDirectory(outputDir);

          // Move/copy image to final destination if needed
          if (generatedImage.localPath !== outputPath) {
            await this.copyImageToOutput(generatedImage.localPath, outputPath);
          }

          // Validate the image
          const validationResult = await validateImage(
            outputPath,
            this.config,
            currentPrompt,
            generatedImage.provider
          );

          if (validationResult.valid && validationResult.metadata) {
            this.setState(AgentState.SUCCESS);

            return {
              success: true,
              data: {
                success: true,
                imagePath: outputPath,
                metadata: validationResult.metadata,
                retryCount,
              },
              duration: Date.now() - startTime,
              timestamp: new Date(),
            };
          }

          // Validation failed
          lastError = validationResult.errors.join('; ');
          this.emit('validationFailed', { errors: validationResult.errors, retryCount });
        } catch (genError) {
          lastError = genError instanceof Error ? genError.message : 'Image generation failed';
          this.emit('generationFailed', { error: lastError, retryCount });
        }

        // Prepare for retry
        retryCount++;
        if (retryCount <= this.config.maxRetries) {
          currentStyle = getAlternativeStyle(style, retryCount);
          currentPrompt = generateAlternativePrompt(
            input.topic,
            input.content,
            style,
            retryCount
          );
        }
      }

      // Exhausted all retries
      this.setState(AgentState.ERROR);
      return {
        success: false,
        error: `Failed after ${this.config.maxRetries} retries. Last error: ${lastError}`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      this.setState(AgentState.ERROR);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Copy image file to output location
   */
  private async copyImageToOutput(sourcePath: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      fs.copyFile(sourcePath, destPath, (err) => {
        if (err) {
          reject(new Error(`Failed to copy image: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
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
}
