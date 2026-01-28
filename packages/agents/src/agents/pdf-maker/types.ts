/**
 * PDFMaker Agent Types
 * Types and interfaces for PDF generation functionality
 */

// AgentStatus is imported in the agent file that uses this module

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
 * Mode of PDF rendering
 */
export enum PDFRenderMode {
  FROM_IMAGES = 'from_images',
  FROM_HTML = 'from_html',
}

/**
 * Metadata for the PDF document
 */
export interface PDFMetadata {
  title: string;
  author: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  creationDate?: Date;
}

/**
 * Compression level for PDF
 */
export type CompressionLevel = 'none' | 'low' | 'medium' | 'high';

/**
 * Dimensions configuration
 */
export interface Dimensions {
  width: number; // in pixels
  height: number; // in pixels
}

/**
 * Margin configuration
 */
export interface Margin {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Configuration for the PDFMaker agent
 */
export interface PDFMakerConfig {
  outputDir: string;
  defaultAuthor: string;
  compression: CompressionLevel;
  dimensions: Dimensions;
  margin: Margin;
}

/**
 * Input for the PDFMaker agent
 */
export interface PDFMakerInput {
  postId: string;
  mode: PDFRenderMode;
  // For FROM_IMAGES mode
  imagePaths?: string[];
  // For FROM_HTML mode
  htmlContent?: string;
  cssStyles?: string;
  // Metadata
  metadata: PDFMetadata;
}

/**
 * Output from the PDFMaker agent
 */
export interface PDFMakerOutput {
  success: boolean;
  pdfPath: string;
  fileSize: number; // in bytes
  pageCount: number;
  metadata: PDFMetadata;
  renderMode: PDFRenderMode;
  generatedAt: Date;
}

/**
 * Options for PDF generation
 */
export interface PDFGenerationOptions {
  format?: 'A4' | 'Letter' | 'custom';
  landscape?: boolean;
  printBackground?: boolean;
  preferCSSPageSize?: boolean;
  scale?: number;
  displayHeaderFooter?: boolean;
}

/**
 * State change event payload
 */
export interface StateChangeEvent {
  previous: AgentState;
  current: AgentState;
  timestamp: Date;
}

/**
 * Result of PDF generation from service
 */
export interface PDFGenerationResult {
  buffer: Buffer;
  pageCount: number;
}

/**
 * Supported image format for validation
 */
export type SupportedImageFormat = 'png' | 'jpg' | 'jpeg' | 'webp';
