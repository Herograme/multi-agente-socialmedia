/**
 * CarouselBuilder Agent Types
 * Story 3.5 - Agente Carousel Builder
 *
 * Types and interfaces for carousel generation functionality.
 */

/**
 * Types of slides supported by the carousel builder
 */
export enum SlideType {
  /** Cover slide with impactful title */
  COVER = 'cover',
  /** Content slide with text */
  CONTENT = 'content',
  /** Code slide with syntax highlighting */
  CODE = 'code',
  /** Call-to-action slide with author handle */
  CTA = 'cta',
}

/**
 * Code example to be displayed in a code slide
 */
export interface CodeExample {
  /** Source code to display */
  code: string;
  /** Programming language for syntax highlighting */
  language: string;
  /** Optional explanation text below the code */
  explanation?: string;
}

/**
 * Configuration for a carousel slide
 */
export interface CarouselSlide {
  /** Zero-based index of the slide */
  index: number;
  /** Type of slide content */
  type: SlideType;
  /** Title text (for cover slides) */
  title?: string;
  /** Main content text (for content slides) */
  content?: string;
  /** Code example (for code slides) */
  code?: CodeExample;
  /** Path to rendered image */
  imagePath?: string;
}

/**
 * Metadata for a rendered slide
 */
export interface SlideMetadata {
  /** Zero-based index of the slide */
  index: number;
  /** Type of slide content */
  type: SlideType;
  /** Absolute path to the rendered image */
  path: string;
  /** Size of the image file in bytes */
  sizeBytes: number;
  /** Dimensions of the rendered image */
  dimensions: {
    width: number;
    height: number;
  };
  /** Timestamp when the slide was rendered */
  renderedAt: Date;
}

/**
 * Input for the CarouselBuilder agent
 */
export interface CarouselBuilderInput {
  /** Unique identifier for the post */
  postId: string;
  /** Full content text to be split into slides */
  content: string;
  /** Path to the background image */
  backgroundImagePath: string;
  /** Maximum number of slides (default: 10, Instagram limit) */
  maxSlides?: number;
  /** Author's social media handle (e.g., @username) */
  authorHandle: string;
  /** Custom CTA text (default: "Siga para mais conteudo!") */
  ctaText?: string;
  /** Code examples to include in the carousel */
  codeExamples?: CodeExample[];
}

/**
 * Output from the CarouselBuilder agent
 */
export interface CarouselBuilderOutput {
  /** Post identifier this carousel belongs to */
  postId: string;
  /** Metadata for each rendered slide */
  slides: SlideMetadata[];
  /** Total number of slides generated */
  totalSlides: number;
  /** Base directory path for carousel images */
  carouselPath: string;
  /** Generation metadata */
  metadata: {
    /** When the carousel was generated */
    generatedAt: Date;
    /** Total processing time in milliseconds */
    processingTimeMs: number;
    /** Path to background image used */
    backgroundUsed: string;
    /** Dimensions of the slides */
    dimensions: {
      width: number;
      height: number;
    };
  };
}

/**
 * Configuration for the CarouselBuilder agent
 */
export interface CarouselConfig {
  /** Base directory for output files (default: 'output/posts') */
  outputBaseDir: string;
  /** Slide dimensions (default: 1080x1080 for Instagram) */
  dimensions: {
    width: number;
    height: number;
  };
  /** Maximum number of slides (default: 10) */
  maxSlides: number;
  /** Opacity of the dark overlay on background (0-1, default: 0.6) */
  overlayOpacity: number;
  /** Shiki theme for code highlighting (default: 'dracula') */
  codeTheme: string;
  /** Default CTA text */
  defaultCtaText: string;
  /** Font families for different elements */
  fonts: {
    /** Font for titles */
    title: string;
    /** Font for body text */
    body: string;
    /** Font for code */
    code: string;
  };
}

/**
 * Result of splitting content into slides
 */
export interface ContentSplitResult {
  /** Array of split slides */
  slides: SplitSlide[];
  /** Whether any code examples were included */
  hasCode: boolean;
  /** Total character count of original content */
  totalCharacters: number;
}

/**
 * A slide after content splitting (before rendering)
 */
export interface SplitSlide {
  /** Type of slide */
  type: SlideType;
  /** Title text (for cover) */
  title?: string;
  /** Content text (for content slides) */
  content?: string;
  /** Code example (for code slides) */
  code?: CodeExample;
}

/**
 * Configuration for the content splitter
 */
export interface SplitterConfig {
  /** Maximum number of slides to generate */
  maxSlides: number;
  /** Maximum characters per content slide */
  maxCharsPerSlide: number;
  /** Minimum characters per content slide */
  minCharsPerSlide: number;
}

/**
 * State of the CarouselBuilder agent lifecycle
 */
export enum AgentState {
  IDLE = 'idle',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
}

/**
 * State change event for agent lifecycle
 */
export interface StateChangeEvent {
  /** Previous agent state */
  previous: AgentState;
  /** Current agent state */
  current: AgentState;
}

/**
 * Interface for the RendererService
 * Used to render HTML to images via Puppeteer
 */
export interface RendererService {
  /** Renders HTML content to an image buffer */
  renderToImage(html: string, options: RenderOptions): Promise<Buffer>;
}

/**
 * Options for rendering HTML to image
 */
export interface RenderOptions {
  /** Width of the output image */
  width: number;
  /** Height of the output image */
  height: number;
  /** Path to background image */
  backgroundImage?: string;
  /** Opacity of the overlay (0-1) */
  overlayOpacity?: number;
}
