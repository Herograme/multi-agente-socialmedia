/**
 * ImageDesigner Agent exports
 */

// Types
export type {
  ImageMetadata,
  ImageDesignerInput,
  ImageDesignerOutput,
  ImageDesignerConfig,
  PromptTemplate,
  ImageValidationResult,
  StateChangeEvent,
  AttemptEvent,
} from './types';

export { AgentState, ImageStyle } from './types';

// Agent class
export { ImageDesignerAgent } from './image-designer-agent';

// Factory
export {
  createImageDesignerAgent,
  getDefaultConfig,
  validatePartialConfig,
} from './factory';

// Prompt generator
export {
  generateBackgroundPrompt,
  generateAlternativePrompt,
  getAlternativeStyle,
  extractTopicEssence,
  validatePromptSafety,
  getAllTemplates,
  getTemplateForStyle,
  TECH_COLORS,
} from './prompt-generator';

// Image validator
export {
  getImageMetadata,
  validateImageDimensions,
  validateImageFormat,
  validateImageSize,
  validateImage,
  isImageFile,
  getOutputPath,
  ensureOutputDirectory,
} from './image-validator';

export type { SupportedFormat } from './image-validator';
