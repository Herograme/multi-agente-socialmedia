/**
 * Visual Nodes
 * Node wrappers for visual content generation in the LangGraph pipeline
 * Includes: ImageDesigner, CarouselBuilder, and PDFMaker
 */

import { createLogger } from '@social-content/shared';
import type { LangGraphPipelineState, NodeFunction } from '../types';
import type { GeneratedImage } from '../../../services/image-gen/types';
import { NODE_NAMES } from '../config';

const loggerImage = createLogger('langgraph:image-designer-node');
const loggerCarousel = createLogger('langgraph:carousel-builder-node');
const loggerPdf = createLogger('langgraph:pdf-maker-node');

/**
 * Image Designer node function
 * Generates background images for posts
 */
export const imageDesignerNode: NodeFunction = async (
  state: LangGraphPipelineState
): Promise<Partial<LangGraphPipelineState>> => {
  loggerImage.info('Image Designer node starting', {
    executionId: state.executionId,
    postsCount: state.posts.length,
  });

  try {
    // TODO: Integrate with actual ImageDesignerAgent when available
    // For now, generate placeholder image data

    const images: GeneratedImage[] = state.posts.map((post, index) => ({
      id: `image-${Date.now()}-${index}`,
      provider: 'placeholder',
      prompt: `Generate image for post: ${post.id}`,
      url: undefined,
      localPath: `/tmp/generated-images/image-${post.id}.png`,
      size: { width: 1080, height: 1080 },
      format: 'png' as const,
      fileSize: 1024 * 100, // 100KB placeholder
      generatedAt: new Date(),
      metadata: { postId: post.id },
    }));

    loggerImage.info('Image Designer node completed', {
      executionId: state.executionId,
      imagesGenerated: images.length,
    });

    return {
      images,
      currentNode: NODE_NAMES.IMAGE_DESIGNER,
    };
  } catch (error) {
    loggerImage.error('Image Designer node failed', {
      executionId: state.executionId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Carousel Builder node function
 * Creates carousel slides from posts with code snippets
 */
export const carouselBuilderNode: NodeFunction = async (
  state: LangGraphPipelineState
): Promise<Partial<LangGraphPipelineState>> => {
  loggerCarousel.info('Carousel Builder node starting', {
    executionId: state.executionId,
    postsCount: state.posts.length,
  });

  try {
    // TODO: Integrate with actual CarouselBuilderAgent when available
    // For now, generate placeholder carousel paths

    const carouselPaths: string[][] = state.posts.map((post, _postIndex) => {
      // Generate 3-5 slides per carousel
      const slideCount = 3 + Math.floor(Math.random() * 3);
      return Array.from({ length: slideCount }, (_, slideIndex) =>
        `/tmp/carousels/post-${post.id}/slide-${slideIndex + 1}.png`
      );
    });

    loggerCarousel.info('Carousel Builder node completed', {
      executionId: state.executionId,
      carouselsCreated: carouselPaths.length,
      totalSlides: carouselPaths.reduce((sum, slides) => sum + slides.length, 0),
    });

    return {
      carouselPaths,
      currentNode: NODE_NAMES.CAROUSEL_BUILDER,
    };
  } catch (error) {
    loggerCarousel.error('Carousel Builder node failed', {
      executionId: state.executionId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * PDF Maker node function
 * Generates PDF documents from posts for LinkedIn
 */
export const pdfMakerNode: NodeFunction = async (
  state: LangGraphPipelineState
): Promise<Partial<LangGraphPipelineState>> => {
  loggerPdf.info('PDF Maker node starting', {
    executionId: state.executionId,
    postsCount: state.posts.length,
  });

  try {
    // TODO: Integrate with actual PDFMakerAgent when available
    // For now, generate placeholder PDF paths

    const pdfPaths: string[] = state.posts
      .filter(() => state.config.platforms.includes('linkedin'))
      .map((post) => `/tmp/pdfs/post-${post.id}.pdf`);

    loggerPdf.info('PDF Maker node completed', {
      executionId: state.executionId,
      pdfsCreated: pdfPaths.length,
    });

    return {
      pdfPaths,
      currentNode: NODE_NAMES.PDF_MAKER,
    };
  } catch (error) {
    loggerPdf.error('PDF Maker node failed', {
      executionId: state.executionId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};
