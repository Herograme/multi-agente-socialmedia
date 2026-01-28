/**
 * ImageDesigner Agent Types
 * Types and interfaces for background image generation functionality
 */

// Re-export ImageStyle from ImageGenService for consistency
export { ImageStyle } from '../../services/image-gen';

/**
 * States of the agent lifecycle
 */
export enum AgentState {
  IDLE = 'idle',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
}

/**
 * Metadata for a generated image
 */
export interface ImageMetadata {
  width: number;
  height: number;
  format: 'png' | 'jpg' | 'webp';
  sizeBytes: number;
  generatedAt: Date;
  prompt: string;
  provider: string;
}

/**
 * Input for the ImageDesigner agent
 */
export interface ImageDesignerInput {
  postId: string;
  topic: string;
  content: string;
  style?: import('../../services/image-gen').ImageStyle;
  keywords?: string[];
}

/**
 * Output from the ImageDesigner agent
 */
export interface ImageDesignerOutput {
  success: boolean;
  imagePath: string;
  metadata: ImageMetadata;
  retryCount: number;
}

/**
 * Configuration for the ImageDesigner agent
 */
export interface ImageDesignerConfig {
  outputDir: string;
  minWidth: number;
  minHeight: number;
  maxRetries: number;
  defaultStyle: import('../../services/image-gen').ImageStyle;
  allowedFormats: ('png' | 'jpg' | 'webp')[];
}

/**
 * Template for generating image prompts
 */
export interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
}

/**
 * Result of image validation
 */
export interface ImageValidationResult {
  valid: boolean;
  errors: string[];
  metadata?: ImageMetadata;
}

/**
 * State change event payload
 */
export interface StateChangeEvent {
  previous: AgentState;
  current: AgentState;
}

/**
 * Attempt event payload (emitted during retries)
 */
export interface AttemptEvent {
  retryCount: number;
  prompt: string;
  style: import('../../services/image-gen').ImageStyle;
}
