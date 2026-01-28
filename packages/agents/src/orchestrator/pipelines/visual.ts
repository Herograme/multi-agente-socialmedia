/**
 * Visual Pipeline Implementation
 * Story 3.7 - Integracao Pipeline Visual
 *
 * Orchestrates ImageDesigner -> CarouselBuilder -> PDFMaker pipeline
 */

import { createLogger, generateId } from '@social-content/shared';
import { PipelineOrchestrator } from '../pipeline';
import type { PipelineConfig, PipelineStep, PipelineResult } from '../types';
import { createFileCleanupService } from '../../services/cleanup/file-cleanup';
import {
  createImageDesignerAgent,
  type ImageDesignerInput,
  type ImageDesignerOutput,
} from '../../agents/image-designer';
import {
  createCarouselBuilderAgent,
  type CarouselBuilderInput,
  type CarouselBuilderOutput,
} from '../../agents/carousel-builder';
import {
  createPDFMakerAgent,
  PDFRenderMode,
  type PDFMakerInput,
  type PDFMakerOutput,
} from '../../agents/pdf-maker';
import { createHTMLRendererService } from '../../services/renderer';
import type {
  VisualPipelineInput,
  VisualPipelineOptions,
  VisualPipelineOutput,
  GeneratedAsset,
  VisualPipelineConfig,
} from './visual-pipeline.types';
import { ImageStyle } from '../../services/image-gen';

const logger = createLogger('pipeline:visual');

/**
 * Visual Pipeline configuration
 */
export const VISUAL_PIPELINE_CONFIG: VisualPipelineConfig = {
  id: 'visual-pipeline',
  name: 'Visual Content Pipeline',
  description: 'Generates visual assets (background, carousel, PDF) for social media posts',
  defaultTimeout: 120000,
  defaultRetries: 1,
  outputDir: 'output/posts',
  defaultAuthorHandle: '@socialmedia',
};

/**
 * Adapter to transform ImageDesigner output to CarouselBuilder input
 */
export function imageDesignerToCarouselAdapter(
  imageOutput: ImageDesignerOutput,
  content: string,
  postId: string,
  options: VisualPipelineOptions
): CarouselBuilderInput {
  return {
    postId,
    content,
    backgroundImagePath: imageOutput.imagePath,
    maxSlides: options.numSlides ?? 5,
    authorHandle: options.authorHandle ?? VISUAL_PIPELINE_CONFIG.defaultAuthorHandle,
    ctaText: options.ctaText,
    codeExamples: [], // Will be populated from content if available
  };
}

/**
 * Adapter to transform CarouselBuilder output to PDFMaker input
 */
export function carouselToPDFAdapter(
  carouselOutput: CarouselBuilderOutput,
  postId: string
): PDFMakerInput {
  const imagePaths = carouselOutput.slides.map((slide) => slide.path);

  return {
    postId,
    mode: PDFRenderMode.FROM_IMAGES,
    imagePaths,
    metadata: {
      title: `Carousel ${postId}`,
      author: 'Social Content Generator',
      subject: 'Social Media Carousel',
      keywords: ['carousel', 'social media', 'content'],
      creator: 'Visual Pipeline',
      creationDate: new Date(),
    },
  };
}

/**
 * Extract assets from pipeline result
 */
export function extractAssetsFromResult(
  result: PipelineResult,
  options: VisualPipelineOptions
): GeneratedAsset[] {
  const assets: GeneratedAsset[] = [];
  let stepIndex = 0;

  // Extract ImageDesigner output
  if (result.stepResults[stepIndex]) {
    const imageStep = result.stepResults[stepIndex];
    if (imageStep.output && typeof imageStep.output === 'object') {
      const output = imageStep.output as ImageDesignerOutput;
      if (output.imagePath) {
        assets.push({
          id: `asset-${generateId()}`,
          type: 'background',
          path: output.imagePath,
          filename: output.imagePath.split('/').pop() ?? 'background.png',
          size: output.metadata?.sizeBytes ?? 0,
          mimeType: `image/${output.metadata?.format ?? 'png'}`,
          metadata: {
            width: output.metadata?.width,
            height: output.metadata?.height,
            provider: output.metadata?.provider,
          },
        });
      }
    }
    stepIndex++;
  }

  // Extract CarouselBuilder output if carousel was generated
  if (options.gerarCarousel !== false && result.stepResults[stepIndex]) {
    const carouselStep = result.stepResults[stepIndex];
    if (carouselStep.output && typeof carouselStep.output === 'object') {
      const output = carouselStep.output as CarouselBuilderOutput;
      for (const slide of output.slides) {
        assets.push({
          id: `asset-${generateId()}`,
          type: 'carousel_slide',
          path: slide.path,
          filename: slide.path.split('/').pop() ?? `slide-${slide.index}.png`,
          size: slide.sizeBytes,
          mimeType: 'image/png',
          slideIndex: slide.index,
          metadata: {
            type: slide.type,
            dimensions: slide.dimensions,
            renderedAt: slide.renderedAt,
          },
        });
      }
    }
    stepIndex++;
  }

  // Extract PDFMaker output if PDF was generated
  if (options.gerarPdf !== false && result.stepResults[stepIndex]) {
    const pdfStep = result.stepResults[stepIndex];
    if (pdfStep.output && typeof pdfStep.output === 'object') {
      const output = pdfStep.output as PDFMakerOutput;
      if (output.pdfPath) {
        assets.push({
          id: `asset-${generateId()}`,
          type: 'pdf',
          path: output.pdfPath,
          filename: output.pdfPath.split('/').pop() ?? 'carousel.pdf',
          size: output.fileSize,
          mimeType: 'application/pdf',
          metadata: {
            pageCount: output.pageCount,
            renderMode: output.renderMode,
            generatedAt: output.generatedAt,
          },
        });
      }
    }
  }

  return assets;
}

/**
 * Create the visual pipeline configuration
 */
export function createVisualPipelineConfig(
  options: VisualPipelineOptions
): PipelineConfig {
  const steps: PipelineStep<unknown, unknown>[] = [];

  // Create agents
  const imageDesignerAgent = createImageDesignerAgent({
    defaultStyle: options.backgroundStyle ?? ImageStyle.TECH,
  });

  // Step 1: ImageDesigner - always executes to generate background
  steps.push({
    name: 'ImageDesigner',
    agent: imageDesignerAgent as unknown as PipelineStep<unknown, unknown>['agent'],
    timeout: 120000, // 2 min for image generation
    retries: 2,
  });

  // Step 2: CarouselBuilder - conditional
  if (options.gerarCarousel !== false) {
    // Create an adapter renderer that wraps the HTML renderer
    const htmlRenderer = createHTMLRendererService();
    const rendererAdapter = {
      renderToImage: async (html: string, renderOptions: { width: number; height: number; backgroundImage?: string; overlayOpacity?: number }): Promise<Buffer> => {
        const result = await htmlRenderer.renderToImage(html, {
          width: renderOptions.width,
          height: renderOptions.height,
          backgroundImage: renderOptions.backgroundImage,
        });
        return result;
      },
    };

    const carouselAgent = createCarouselBuilderAgent(
      rendererAdapter,
      { maxSlides: options.numSlides ?? 5 }
    );

    steps.push({
      name: 'CarouselBuilder',
      agent: carouselAgent as unknown as PipelineStep<unknown, unknown>['agent'],
      timeout: 180000, // 3 min for rendering all slides
      retries: 1,
    });
  }

  // Step 3: PDFMaker - conditional
  if (options.gerarPdf !== false && options.gerarCarousel !== false) {
    const pdfAgent = createPDFMakerAgent();

    steps.push({
      name: 'PDFMaker',
      agent: pdfAgent as unknown as PipelineStep<unknown, unknown>['agent'],
      timeout: 60000, // 1 min for PDF generation
      retries: 1,
    });
  }

  return {
    id: VISUAL_PIPELINE_CONFIG.id,
    name: VISUAL_PIPELINE_CONFIG.name,
    description: VISUAL_PIPELINE_CONFIG.description,
    steps,
    defaultTimeout: VISUAL_PIPELINE_CONFIG.defaultTimeout,
    defaultRetries: VISUAL_PIPELINE_CONFIG.defaultRetries,
  };
}

/**
 * Create a configured Visual Pipeline
 */
export function createVisualPipeline(options: VisualPipelineOptions = {}): PipelineOrchestrator {
  const config = createVisualPipelineConfig(options);
  return new PipelineOrchestrator(config);
}

/**
 * Run the visual pipeline with error handling and cleanup
 */
export async function runVisualPipeline(
  input: VisualPipelineInput,
  options: VisualPipelineOptions = {}
): Promise<VisualPipelineOutput> {
  const cleanup = createFileCleanupService();
  const startTime = Date.now();
  const postId = input.postId ?? `direct-${generateId()}`;

  logger.info('Starting visual pipeline', {
    postId,
    hasContent: !!input.content,
    options,
  });

  // Validate input
  if (!input.postId && !input.content) {
    throw new Error('Either postId or content must be provided');
  }

  if (input.postId && input.content) {
    throw new Error('Provide either postId or content, not both');
  }

  if (input.content && (!input.content.title || !input.content.text)) {
    throw new Error('Content must have title and text');
  }

  // Create pipeline configuration and orchestrator
  const config = createVisualPipelineConfig(options);
  const orchestrator = new PipelineOrchestrator(config);

  // Track generated files for cleanup on error
  orchestrator.on('pipeline:step:completed', (event) => {
    if (event.output && typeof event.output === 'object') {
      const output = event.output as Record<string, unknown>;

      // Track single path
      if (output.path && typeof output.path === 'string') {
        cleanup.trackFile(output.path);
      }

      // Track imagePath from ImageDesigner
      if (output.imagePath && typeof output.imagePath === 'string') {
        cleanup.trackFile(output.imagePath);
      }

      // Track pdfPath from PDFMaker
      if (output.pdfPath && typeof output.pdfPath === 'string') {
        cleanup.trackFile(output.pdfPath);
      }

      // Track slides from CarouselBuilder
      if (Array.isArray(output.slides)) {
        for (const slide of output.slides) {
          if (slide && typeof slide === 'object' && 'path' in slide && typeof slide.path === 'string') {
            cleanup.trackFile(slide.path);
          }
        }
      }

      // Track array of paths
      if (Array.isArray(output.paths)) {
        for (const p of output.paths) {
          if (typeof p === 'string') cleanup.trackFile(p);
        }
      }
    }
  });

  try {
    // Prepare input for ImageDesigner (first step)
    const imageDesignerInput: ImageDesignerInput = {
      postId,
      topic: input.content?.topic ?? 'technology',
      content: input.content?.text ?? '',
      style: options.backgroundStyle,
      keywords: input.content?.topic ? [input.content.topic] : undefined,
    };

    // Register cleanup handlers for each step
    orchestrator.registerCleanupHandler('ImageDesigner', async () => {
      logger.debug('Running ImageDesigner cleanup');
      await cleanup.cleanupTrackedFiles();
    });

    orchestrator.registerCleanupHandler('CarouselBuilder', async () => {
      logger.debug('Running CarouselBuilder cleanup');
      await cleanup.cleanupTrackedFiles();
    });

    orchestrator.registerCleanupHandler('PDFMaker', async () => {
      logger.debug('Running PDFMaker cleanup');
      await cleanup.cleanupTrackedFiles();
    });

    // Run the pipeline
    const result = await orchestrator.run(imageDesignerInput, {
      pipelineId: `visual-${postId}-${generateId()}`,
      metadata: {
        postId,
        options,
        content: input.content,
      },
    });

    // Check if pipeline completed successfully
    if (result.status !== 'completed') {
      const errorMsg = result.errors[0]?.message ?? 'Pipeline execution failed';
      logger.error('Visual pipeline failed', {
        postId,
        error: errorMsg,
        errors: result.errors,
      });

      // Cleanup on failure
      const cleanupResult = await cleanup.cleanupTrackedFiles();
      logger.info('Cleanup after failure', {
        success: cleanupResult.success,
        failed: cleanupResult.failed,
      });

      throw new Error(errorMsg);
    }

    // Commit files - prevent cleanup
    cleanup.commitFiles();

    // Extract assets from result
    const assets = extractAssetsFromResult(result, options);

    const output: VisualPipelineOutput = {
      postId,
      assets,
      metadata: {
        processingTimeMs: Date.now() - startTime,
        generatedAt: new Date(),
        options,
        stepsExecuted: result.stepResults.length,
      },
    };

    logger.info('Visual pipeline completed', {
      postId,
      assetCount: assets.length,
      processingTimeMs: output.metadata.processingTimeMs,
    });

    return output;
  } catch (error) {
    // Cleanup tracked files on any error
    const cleanupResult = await cleanup.cleanupTrackedFiles();
    logger.error('Visual pipeline error, cleaned up files', {
      postId,
      error: error instanceof Error ? error.message : 'Unknown error',
      cleanupSuccess: cleanupResult.success.length,
      cleanupFailed: cleanupResult.failed.length,
    });

    throw error;
  }
}

/**
 * Get the visual pipeline configuration
 */
export function getVisualPipelineConfig(): VisualPipelineConfig {
  return { ...VISUAL_PIPELINE_CONFIG };
}
