/**
 * Content Generator
 * Generates platform-specific content using LLM service
 */

import { createLogger } from '@social-content/shared';
import type { Trend } from '@social-content/shared';
import type { LLMService } from '../../services/llm';
import { LLMError, LLMErrorCode } from '../../services/llm';
import {
  SYSTEM_PROMPT,
  getInstagramPrompt,
  getLinkedInPrompt,
  getTwitterPrompt,
  getMultiPlatformPrompt,
  FALLBACK_TEMPLATES,
} from './prompts';
import type { PlatformContent, CodeSnippet } from './types';

const logger = createLogger('curador:content-generator');

/**
 * Content generation options
 */
export interface ContentGenerationOptions {
  trend: Trend;
  references?: string[];
  codeSnippets?: CodeSnippet[];
  platforms?: ('instagram' | 'linkedin' | 'twitter')[];
  useFallback?: boolean;
}

/**
 * Content generation result
 */
export interface ContentGenerationResult {
  platformContent: PlatformContent;
  generatedBy: 'llm' | 'fallback';
  provider?: string;
  tokensUsed?: number;
}

/**
 * Instagram content structure
 */
interface InstagramContent {
  caption: string;
  hashtags: string[];
  imagePrompt?: string;
}

/**
 * LinkedIn content structure
 */
interface LinkedInContent {
  post: string;
  hashtags: string[];
}

/**
 * Twitter content structure
 */
interface TwitterContent {
  thread: string[];
  hashtags: string[];
}

/**
 * Multi-platform LLM response structure
 */
interface MultiPlatformResponse {
  instagram?: InstagramContent;
  linkedin?: LinkedInContent;
  twitter?: TwitterContent;
}

/**
 * Content Generator class
 * Uses LLM to generate platform-specific social media content
 */
export class ContentGenerator {
  private llmService: LLMService | null;

  constructor(llmService: LLMService | null) {
    this.llmService = llmService;
    logger.info('ContentGenerator initialized', {
      hasLLMService: !!llmService,
    });
  }

  /**
   * Generate content for all requested platforms
   */
  async generateAll(
    options: ContentGenerationOptions
  ): Promise<ContentGenerationResult> {
    const {
      trend,
      references = [],
      codeSnippets = [],
      platforms = ['instagram', 'linkedin', 'twitter'],
      useFallback = true,
    } = options;

    logger.info('Generating content', {
      trendId: trend.id,
      trendTitle: trend.title,
      platforms,
      hasReferences: references.length > 0,
      hasCodeSnippets: codeSnippets.length > 0,
    });

    // If no LLM service, use fallback immediately
    if (!this.llmService) {
      if (useFallback) {
        logger.warn('No LLM service available, using fallback templates');
        return this.generateFallback(trend, platforms);
      }
      throw new Error('No LLM service available and fallback disabled');
    }

    try {
      // Try multi-platform generation first (more efficient)
      return await this.generateMultiPlatform(
        trend,
        references,
        codeSnippets,
        platforms
      );
    } catch (error) {
      logger.error('Multi-platform generation failed', {
        error: (error as Error).message,
        trendId: trend.id,
      });

      // Try individual platform generation as fallback
      try {
        return await this.generateIndividually(
          trend,
          references,
          codeSnippets,
          platforms
        );
      } catch (individualError) {
        logger.error('Individual generation also failed', {
          error: (individualError as Error).message,
        });

        if (useFallback) {
          logger.warn('Using fallback templates after LLM failure');
          return this.generateFallback(trend, platforms);
        }

        throw individualError;
      }
    }
  }

  /**
   * Generate content for all platforms in a single LLM call
   */
  private async generateMultiPlatform(
    trend: Trend,
    references: string[],
    codeSnippets: CodeSnippet[],
    platforms: ('instagram' | 'linkedin' | 'twitter')[]
  ): Promise<ContentGenerationResult> {
    const codeTexts = codeSnippets.map(
      (cs) => `\`\`\`${cs.language || ''}\n${cs.code}\n\`\`\``
    );

    const prompt = getMultiPlatformPrompt(trend, references, codeTexts);

    const result = await this.llmService!.generate({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 3000,
      responseFormat: 'json',
    });

    const parsed = this.parseJsonResponse<MultiPlatformResponse>(result.content);
    const platformContent = this.mapToPlatformContent(parsed, platforms);

    logger.info('Multi-platform content generated', {
      trendId: trend.id,
      provider: result.provider,
      tokensUsed: result.usage?.totalTokens,
      platforms: Object.keys(platformContent),
    });

    return {
      platformContent,
      generatedBy: 'llm',
      provider: result.provider,
      tokensUsed: result.usage?.totalTokens,
    };
  }

  /**
   * Generate content for each platform individually
   */
  private async generateIndividually(
    trend: Trend,
    references: string[],
    codeSnippets: CodeSnippet[],
    platforms: ('instagram' | 'linkedin' | 'twitter')[]
  ): Promise<ContentGenerationResult> {
    const platformContent: PlatformContent = {};
    let totalTokens = 0;
    let lastProvider: string | undefined;

    for (const platform of platforms) {
      try {
        const result = await this.generateForPlatform(
          platform,
          trend,
          references
        );
        Object.assign(platformContent, result.content);
        totalTokens += result.tokensUsed || 0;
        lastProvider = result.provider;
      } catch (error) {
        logger.error(`Failed to generate for ${platform}`, {
          error: (error as Error).message,
        });
        // Continue with other platforms
      }
    }

    if (Object.keys(platformContent).length === 0) {
      throw new Error('Failed to generate content for any platform');
    }

    return {
      platformContent,
      generatedBy: 'llm',
      provider: lastProvider,
      tokensUsed: totalTokens,
    };
  }

  /**
   * Generate content for a single platform
   */
  private async generateForPlatform(
    platform: 'instagram' | 'linkedin' | 'twitter',
    trend: Trend,
    references: string[]
  ): Promise<{
    content: PlatformContent;
    tokensUsed?: number;
    provider?: string;
  }> {
    let prompt: string;

    switch (platform) {
      case 'instagram':
        prompt = getInstagramPrompt(trend, references);
        break;
      case 'linkedin':
        prompt = getLinkedInPrompt(trend, references);
        break;
      case 'twitter':
        prompt = getTwitterPrompt(trend, references);
        break;
    }

    const result = await this.llmService!.generate({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 1500,
      responseFormat: 'json',
    });

    const content: PlatformContent = {};

    if (platform === 'instagram') {
      const parsed = this.parseJsonResponse<InstagramContent>(result.content);
      content.instagram = parsed;
    } else if (platform === 'linkedin') {
      const parsed = this.parseJsonResponse<LinkedInContent>(result.content);
      content.linkedin = parsed;
    } else if (platform === 'twitter') {
      const parsed = this.parseJsonResponse<TwitterContent>(result.content);
      content.twitter = parsed;
    }

    return {
      content,
      tokensUsed: result.usage?.totalTokens,
      provider: result.provider,
    };
  }

  /**
   * Generate fallback content using templates
   */
  private generateFallback(
    trend: Trend,
    platforms: ('instagram' | 'linkedin' | 'twitter')[]
  ): ContentGenerationResult {
    const platformContent: PlatformContent = {};

    for (const platform of platforms) {
      if (platform === 'instagram') {
        platformContent.instagram = FALLBACK_TEMPLATES.instagram(trend);
      } else if (platform === 'linkedin') {
        platformContent.linkedin = FALLBACK_TEMPLATES.linkedin(trend);
      } else if (platform === 'twitter') {
        platformContent.twitter = FALLBACK_TEMPLATES.twitter(trend);
      }
    }

    logger.info('Fallback content generated', {
      trendId: trend.id,
      platforms: Object.keys(platformContent),
    });

    return {
      platformContent,
      generatedBy: 'fallback',
    };
  }

  /**
   * Parse JSON response from LLM
   * Handles potential issues with markdown code blocks or extra text
   */
  private parseJsonResponse<T>(content: string): T {
    let jsonStr = content.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }

    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }

    jsonStr = jsonStr.trim();

    // Try to find JSON object in the response
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    try {
      return JSON.parse(jsonStr) as T;
    } catch (error) {
      logger.error('Failed to parse JSON response', {
        error: (error as Error).message,
        contentPreview: content.substring(0, 200),
      });

      throw new LLMError(
        'Failed to parse LLM response as JSON',
        'service',
        LLMErrorCode.JSON_PARSE_ERROR,
        false
      );
    }
  }

  /**
   * Map parsed response to PlatformContent structure
   */
  private mapToPlatformContent(
    response: MultiPlatformResponse,
    requestedPlatforms: ('instagram' | 'linkedin' | 'twitter')[]
  ): PlatformContent {
    const content: PlatformContent = {};

    if (requestedPlatforms.includes('instagram') && response.instagram) {
      content.instagram = {
        caption: response.instagram.caption,
        hashtags: this.normalizeHashtags(response.instagram.hashtags),
        imagePrompt: response.instagram.imagePrompt,
      };
    }

    if (requestedPlatforms.includes('linkedin') && response.linkedin) {
      content.linkedin = {
        post: response.linkedin.post,
        hashtags: this.normalizeHashtags(response.linkedin.hashtags),
      };
    }

    if (requestedPlatforms.includes('twitter') && response.twitter) {
      content.twitter = {
        thread: this.normalizeThread(response.twitter.thread),
        hashtags: this.normalizeHashtags(response.twitter.hashtags),
      };
    }

    return content;
  }

  /**
   * Normalize hashtags (ensure # prefix)
   */
  private normalizeHashtags(hashtags: string[]): string[] {
    if (!Array.isArray(hashtags)) {
      return [];
    }

    return hashtags.map((tag) => {
      const trimmed = tag.trim();
      return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
    });
  }

  /**
   * Normalize Twitter thread (ensure max 280 chars per tweet)
   */
  private normalizeThread(thread: string[]): string[] {
    if (!Array.isArray(thread)) {
      return [];
    }

    return thread.map((tweet) => {
      const trimmed = tweet.trim();
      if (trimmed.length > 280) {
        return trimmed.substring(0, 277) + '...';
      }
      return trimmed;
    });
  }

  /**
   * Check if LLM service is available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.llmService) {
      return false;
    }
    return this.llmService.isAvailable();
  }
}

/**
 * Create a ContentGenerator instance
 */
export function createContentGenerator(
  llmService: LLMService | null
): ContentGenerator {
  return new ContentGenerator(llmService);
}
