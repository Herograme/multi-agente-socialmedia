/**
 * Prompt Generator for ImageDesigner
 * Generates optimized prompts for tech-themed background images
 */

import type { PromptTemplate } from './types';
import { ImageStyle } from '../../services/image-gen';

/**
 * Templates for different image styles
 * Aligned with ImageStyle enum from ImageGenService
 */
const PROMPT_TEMPLATES: Record<ImageStyle, PromptTemplate[]> = {
  [ImageStyle.ABSTRACT]: [
    {
      id: 'abstract-1',
      name: 'Abstract Tech Flow',
      template: `Abstract digital background with flowing {color} and {accent} gradients, futuristic tech aesthetic, smooth curves and waves, ethereal glow effects, dark background with luminescent accents, {topic_essence}, no text, no words, no letters, no numbers, no symbols, high resolution, 4k quality, professional design`,
      variables: ['color', 'accent', 'topic_essence'],
    },
    {
      id: 'abstract-2',
      name: 'Abstract Data Streams',
      template: `Abstract visualization of data streams, {color} neon lines on dark background, digital particles flowing, tech-inspired patterns, {topic_essence}, minimalist and modern, no text, no words, no letters, clean composition, professional quality`,
      variables: ['color', 'topic_essence'],
    },
    {
      id: 'abstract-3',
      name: 'Abstract Neural Network',
      template: `Abstract neural network visualization, interconnected nodes with {color} glow, dark background, digital synapses, {topic_essence}, futuristic aesthetic, no text, no words, no letters, high resolution, cinematic lighting`,
      variables: ['color', 'topic_essence'],
    },
  ],
  [ImageStyle.TECH]: [
    {
      id: 'tech-1',
      name: 'Circuit Board Abstract',
      template: `Abstract circuit board pattern, glowing {color} traces on dark background, futuristic technology aesthetic, {topic_essence}, subtle depth effect, no text, no words, no letters, professional quality, modern design`,
      variables: ['color', 'topic_essence'],
    },
    {
      id: 'tech-2',
      name: 'Code Matrix',
      template: `Digital code matrix visualization, falling {color} light streams on dark background, Matrix-inspired, {topic_essence}, no text, no words, no letters, tech aesthetic, cinematic`,
      variables: ['color', 'topic_essence'],
    },
    {
      id: 'tech-3',
      name: 'Chip Architecture',
      template: `Abstract microchip architecture visualization, {color} pathways on dark substrate, silicon valley aesthetic, {topic_essence}, no text, no words, no letters, professional quality`,
      variables: ['color', 'topic_essence'],
    },
  ],
  [ImageStyle.GRADIENT]: [
    {
      id: 'gradient-1',
      name: 'Tech Gradient',
      template: `Smooth gradient background transitioning from {color} to {accent}, subtle tech-inspired texture overlay, soft glow effects, modern and professional, {topic_essence}, no text, no words, no letters, 4k quality`,
      variables: ['color', 'accent', 'topic_essence'],
    },
    {
      id: 'gradient-2',
      name: 'Aurora Gradient',
      template: `Aurora-like gradient background, {color} and {accent} flowing colors, dark sky aesthetic, {topic_essence}, ethereal and modern, no text, no words, no letters, high resolution`,
      variables: ['color', 'accent', 'topic_essence'],
    },
  ],
  [ImageStyle.MINIMAL]: [
    {
      id: 'minimal-1',
      name: 'Minimal Dark',
      template: `Minimalist dark background with subtle {color} accent gradient, clean and professional, soft vignette effect, {topic_essence}, no text, no words, no letters, high resolution`,
      variables: ['color', 'topic_essence'],
    },
    {
      id: 'minimal-2',
      name: 'Subtle Glow',
      template: `Minimal background with soft {color} glow in center, dark edges, professional and clean, {topic_essence}, no text, no words, no letters, modern aesthetic`,
      variables: ['color', 'topic_essence'],
    },
  ],
  [ImageStyle.FUTURISTIC]: [
    {
      id: 'futuristic-1',
      name: 'Cyberpunk Cityscape',
      template: `Futuristic cyberpunk background, {color} neon lights, dark cityscape silhouette, rain effects, {topic_essence}, sci-fi aesthetic, no text, no words, no letters, cinematic quality`,
      variables: ['color', 'topic_essence'],
    },
    {
      id: 'futuristic-2',
      name: 'Space Tech',
      template: `Futuristic space technology background, {color} holographic elements, dark void with distant stars, {topic_essence}, sci-fi inspired, no text, no words, no letters, high resolution`,
      variables: ['color', 'topic_essence'],
    },
  ],
  [ImageStyle.GEOMETRIC]: [
    {
      id: 'geometric-1',
      name: 'Tech Geometry',
      template: `Geometric abstract background with {color} polygons and triangles, low-poly style, tech aesthetic, dark navy background, subtle gradient overlays, {topic_essence}, no text, no words, no letters, clean design`,
      variables: ['color', 'topic_essence'],
    },
    {
      id: 'geometric-2',
      name: 'Hexagonal Grid',
      template: `Hexagonal grid pattern, glowing {color} edges on dark background, futuristic honeycomb structure, {topic_essence}, tech-inspired, no text, no words, no letters, professional quality`,
      variables: ['color', 'topic_essence'],
    },
  ],
  [ImageStyle.NEON]: [
    {
      id: 'neon-1',
      name: 'Neon Grid',
      template: `Neon grid background, glowing {color} and {accent} lines forming perspective grid, synthwave aesthetic, dark background, {topic_essence}, no text, no words, no letters, retro-futuristic`,
      variables: ['color', 'accent', 'topic_essence'],
    },
    {
      id: 'neon-2',
      name: 'Neon Shapes',
      template: `Floating neon shapes, {color} glowing geometric forms on dark background, {topic_essence}, modern aesthetic, no text, no words, no letters, professional quality, vivid colors`,
      variables: ['color', 'topic_essence'],
    },
  ],
};

/**
 * Tech-themed color palette
 */
export const TECH_COLORS = {
  primary: ['deep blue', 'electric blue', 'cyan', 'teal', 'indigo', 'cobalt blue'],
  accent: ['purple', 'magenta', 'violet', 'pink', 'orange', 'electric green'],
  neutral: ['dark gray', 'charcoal', 'midnight blue', 'dark navy', 'black'],
} as const;

/**
 * Tech keywords for topic extraction
 */
const TECH_KEYWORDS = [
  'code',
  'coding',
  'programming',
  'software',
  'development',
  'developer',
  'data',
  'cloud',
  'api',
  'database',
  'algorithm',
  'machine learning',
  'artificial intelligence',
  'ai',
  'ml',
  'web',
  'mobile',
  'security',
  'devops',
  'backend',
  'frontend',
  'fullstack',
  'javascript',
  'typescript',
  'python',
  'react',
  'node',
  'docker',
  'kubernetes',
  'aws',
  'azure',
  'microservices',
  'blockchain',
  'crypto',
  'iot',
  'robotics',
  'automation',
];

/**
 * Extract essence of the topic for prompt generation
 *
 * @param topic - The main topic
 * @param content - Additional content context
 * @returns A description to include in the prompt
 */
export function extractTopicEssence(topic: string, content: string): string {
  const combined = `${topic} ${content}`.toLowerCase();
  const foundKeywords = TECH_KEYWORDS.filter((kw) => combined.includes(kw));

  if (foundKeywords.length > 0) {
    const topKeywords = foundKeywords.slice(0, 2);
    return `inspired by ${topKeywords.join(' and ')} concepts`;
  }

  return 'tech-inspired modern aesthetic';
}

/**
 * Select a random item from an array
 */
function randomFrom<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get template for a given style (deterministic based on index)
 */
export function getTemplateForStyle(
  style: ImageStyle,
  index: number = 0
): PromptTemplate {
  const templates = PROMPT_TEMPLATES[style];
  return templates[index % templates.length];
}

/**
 * Generate an optimized background prompt for image generation
 *
 * @param topic - The main topic of the content
 * @param content - The content text
 * @param style - The desired image style
 * @returns Generated prompt string
 */
export function generateBackgroundPrompt(
  topic: string,
  content: string,
  style: ImageStyle = ImageStyle.ABSTRACT
): string {
  const templates = PROMPT_TEMPLATES[style];
  const template = randomFrom(templates);

  const color = randomFrom(TECH_COLORS.primary);
  const accent = randomFrom(TECH_COLORS.accent);
  const topicEssence = extractTopicEssence(topic, content);

  let prompt = template.template;
  prompt = prompt.replace(/{color}/g, color);
  prompt = prompt.replace(/{accent}/g, accent);
  prompt = prompt.replace(/{topic_essence}/g, topicEssence);

  // Normalize whitespace
  return prompt.trim().replace(/\s+/g, ' ');
}

/**
 * Generate an alternative prompt for retry attempts
 * Uses a different style to increase variety
 *
 * @param topic - The main topic of the content
 * @param content - The content text
 * @param previousStyle - The style used in the previous attempt
 * @param attemptNumber - The current retry attempt number (1-based)
 * @returns Generated alternative prompt string
 */
export function generateAlternativePrompt(
  topic: string,
  content: string,
  previousStyle: ImageStyle,
  attemptNumber: number
): string {
  // Rotate through available styles
  const styles = Object.values(ImageStyle);
  const previousIndex = styles.indexOf(previousStyle);
  const newIndex = (previousIndex + attemptNumber) % styles.length;
  const newStyle = styles[newIndex];

  return generateBackgroundPrompt(topic, content, newStyle);
}

/**
 * Get style used in alternative prompt
 * Useful for tracking which style was used in a retry
 */
export function getAlternativeStyle(
  previousStyle: ImageStyle,
  attemptNumber: number
): ImageStyle {
  const styles = Object.values(ImageStyle);
  const previousIndex = styles.indexOf(previousStyle);
  const newIndex = (previousIndex + attemptNumber) % styles.length;
  return styles[newIndex];
}

/**
 * Validate that a prompt contains required safety instructions
 */
export function validatePromptSafety(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase();
  return (
    lowerPrompt.includes('no text') &&
    lowerPrompt.includes('no words') &&
    lowerPrompt.includes('no letters')
  );
}

/**
 * Get all available templates for testing/inspection
 */
export function getAllTemplates(): Record<ImageStyle, PromptTemplate[]> {
  return { ...PROMPT_TEMPLATES };
}
