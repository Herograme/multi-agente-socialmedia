/**
 * PDFMaker Agent exports
 */

// Types
export type {
  PDFMakerConfig,
  PDFMakerInput,
  PDFMakerOutput,
  PDFMetadata,
  StateChangeEvent,
  PDFGenerationOptions,
  PDFGenerationResult,
  CompressionLevel,
  Dimensions,
  Margin,
  SupportedImageFormat,
} from './types';

export { AgentState, PDFRenderMode } from './types';

// Agent class
export { PDFMakerAgent } from './pdf-maker-agent';

// PDF Service
export { PDFService } from './pdf-service';

// Factory
export {
  createPDFMakerAgent,
  getDefaultConfig,
  validatePartialConfig,
} from './factory';

// Utils
export {
  ensureOutputDirectory,
  ensureOutputDirectorySync,
  getOutputPath,
  getFileSize,
  validateImagePaths,
  formatFileSize,
  isSupportedImageFormat,
  getImageFormat,
  resolveAbsolutePath,
  fileExists,
} from './utils';
