/**
 * Curador Agent
 * Curates and processes content from multiple sources
 * Generates platform-specific social media content using LLM
 */

import { EventEmitter } from 'events';
import { createLogger, generateId } from '@social-content/shared';
import type { Agent, AgentResult } from '../types';
import { AgentStatus } from '../types';
import type {
  AgentState,
  CuradorConfig,
  CuradorInput,
  CuradorOutput,
  CurationResult,
  CuratedContent,
  StateChangeEvent,
  CodeSnippet,
} from './types';
import { AgentState as CuradorAgentState } from './types';
import type { LLMService } from '../../services/llm';
import type { ContentSearchService, SearchResult } from '../../services/search';
import type { ContentRanker, RankedContent } from '../../services/ranking';
import type { CodeExtractor } from '../../services/extractors';
import { ContentGenerator } from './content-generator';

const logger = createLogger('agent:curador');

/**
 * Dependencies for CuradorAgent
 */
export interface CuradorDependencies {
  llmService?: LLMService | null;
  searchService?: ContentSearchService;
  ranker?: ContentRanker;
  codeExtractor?: CodeExtractor;
}

/**
 * CuradorAgent class
 * Implements content curation with lifecycle management
 */
export class CuradorAgent
  extends EventEmitter
  implements Agent<CuradorInput, CuradorOutput>
{
  readonly name = 'CuradorAgent';
  status: AgentStatus = AgentStatus.IDLE;

  private state: AgentState = CuradorAgentState.IDLE;
  private readonly config: CuradorConfig;
  private readonly llmService: LLMService | null;
  private readonly searchService?: ContentSearchService;
  private readonly ranker?: ContentRanker;
  private readonly codeExtractor?: CodeExtractor;
  private readonly contentGenerator: ContentGenerator;

  constructor(config: CuradorConfig, dependencies: CuradorDependencies = {}) {
    super();
    this.config = config;
    this.llmService = dependencies.llmService ?? null;
    this.searchService = dependencies.searchService;
    this.ranker = dependencies.ranker;
    this.codeExtractor = dependencies.codeExtractor;
    this.contentGenerator = new ContentGenerator(this.llmService);

    logger.info('CuradorAgent initialized', {
      hasLLMService: !!this.llmService,
      hasSearchService: !!this.searchService,
      hasRanker: !!this.ranker,
      hasCodeExtractor: !!this.codeExtractor,
    });
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
  getConfig(): CuradorConfig {
    return { ...this.config };
  }

  /**
   * Set a new state and emit stateChange event
   */
  private setState(newState: AgentState): void {
    const previousState = this.state;
    this.state = newState;

    // Sync status with state
    switch (newState) {
      case CuradorAgentState.IDLE:
        this.status = AgentStatus.IDLE;
        break;
      case CuradorAgentState.RUNNING:
        this.status = AgentStatus.RUNNING;
        break;
      case CuradorAgentState.SUCCESS:
        this.status = AgentStatus.SUCCESS;
        break;
      case CuradorAgentState.ERROR:
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
   * Run the curador agent
   * Pipeline: Trends -> Keywords -> Search -> Extract Code -> Rank -> Generate Content
   */
  async run(input: CuradorInput): Promise<AgentResult<CuradorOutput>> {
    const startTime = Date.now();
    this.setState(CuradorAgentState.RUNNING);

    const errors: Array<{ sourceId: string; trendId?: string; message: string; code: string }> = [];
    const curatedContent: CuratedContent[] = [];

    try {
      logger.info('Starting curation pipeline', {
        trendsCount: input.trends.length,
        options: input.options,
      });

      // Process each trend
      for (const trend of input.trends) {
        try {
          const content = await this.processTrend(trend);
          if (content) {
            curatedContent.push(content);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error('Failed to process trend', {
            trendId: trend.id,
            error: errorMessage,
          });
          errors.push({
            sourceId: trend.source,
            trendId: trend.id,
            message: errorMessage,
            code: 'TREND_PROCESSING_ERROR',
          });
        }
      }

      const processingTimeMs = Date.now() - startTime;

      const result: CurationResult = {
        success: errors.length === 0 || curatedContent.length > 0,
        content: curatedContent,
        stats: {
          totalProcessed: input.trends.length,
          totalCurated: curatedContent.length,
          totalFiltered: input.trends.length - curatedContent.length,
          processingTimeMs,
        },
        errors,
        timestamp: new Date(),
      };

      this.setState(CuradorAgentState.SUCCESS);

      logger.info('Curation pipeline completed', {
        totalProcessed: result.stats.totalProcessed,
        totalCurated: result.stats.totalCurated,
        errors: errors.length,
        durationMs: processingTimeMs,
      });

      const output: CuradorOutput = {
        result,
        state: this.state,
      };

      return {
        success: true,
        data: output,
        duration: processingTimeMs,
        timestamp: new Date(),
      };
    } catch (error) {
      this.setState(CuradorAgentState.ERROR);
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      logger.error('Curation pipeline failed', {
        error: errorMessage,
        duration,
      });

      return {
        success: false,
        error: errorMessage,
        duration,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Process a single trend through the curation pipeline
   */
  private async processTrend(trend: { id: string; title: string; description?: string; source: string; url?: string; tags?: string[] }): Promise<CuratedContent | null> {
    logger.debug('Processing trend', { trendId: trend.id, title: trend.title });

    // 1. Extract keywords from trend
    const keywords = this.extractKeywords(trend);
    logger.debug('Extracted keywords', { trendId: trend.id, keywords });

    // 2. Search for related content
    let searchResults: SearchResult[] = [];
    if (this.searchService && keywords.length > 0) {
      try {
        const searchResponse = await this.searchService.search({
          keywords,
          limit: 5,
        });
        searchResults = searchResponse.results;
        logger.debug('Search completed', {
          trendId: trend.id,
          resultsCount: searchResults.length,
        });
      } catch (error) {
        logger.warn('Search failed, continuing without results', {
          trendId: trend.id,
          error: (error as Error).message,
        });
      }
    }

    // 3. Extract code snippets from search results (using description as content source)
    const codeSnippets: CodeSnippet[] = [];
    if (this.codeExtractor && searchResults.length > 0) {
      for (const result of searchResults.slice(0, 3)) {
        try {
          // Use description as content source since SearchResult doesn't have 'content' field
          const contentToExtract = result.description || result.title;
          if (contentToExtract) {
            const extracted = await this.codeExtractor.extract(contentToExtract);
            for (const snippet of extracted.snippets.slice(0, 2)) {
              codeSnippets.push({
                code: snippet.code,
                language: snippet.language,
                context: result.title,
              });
            }
          }
        } catch (error) {
          logger.debug('Code extraction failed for result', {
            resultId: result.id,
            error: (error as Error).message,
          });
        }
      }
      logger.debug('Code extraction completed', {
        trendId: trend.id,
        snippetsCount: codeSnippets.length,
      });
    }

    // 4. Rank content (if we have search results)
    let rankedContent: RankedContent[] = [];
    if (this.ranker && searchResults.length > 0) {
      // Map SearchResult to ContentToRank (which requires id, title, url, source, publishedAt)
      const contentToRank = searchResults.map((r) => ({
        id: r.id,
        title: r.title,
        content: r.description || '', // Use description as content
        url: r.url,
        source: r.source,
        publishedAt: r.publishedAt,
        tags: r.tags || [],
      }));

      const rankingResult = this.ranker.rank(contentToRank);
      rankedContent = rankingResult.items;
      logger.debug('Ranking completed', {
        trendId: trend.id,
        rankedCount: rankedContent.length,
      });
    }

    // 5. Build references from ranked content
    // RankedContent extends ContentToRank which doesn't have description, use content field
    const references = rankedContent
      .slice(0, 3)
      .map((r) => `[${r.title}](${r.url}) - ${r.content || ''}`);

    // 6. Generate platform-specific content using LLM
    const generationResult = await this.contentGenerator.generateAll({
      trend: trend as any, // Type coercion - trend from input matches Trend structure
      references,
      codeSnippets,
      platforms: ['instagram', 'linkedin', 'twitter'],
      useFallback: true,
    });

    logger.debug('Content generation completed', {
      trendId: trend.id,
      generatedBy: generationResult.generatedBy,
      platforms: Object.keys(generationResult.platformContent),
    });

    // 7. Build curated content object
    const curatedContent: CuratedContent = {
      id: generateId(),
      originalTrend: trend as any,
      title: trend.title,
      summary: trend.description || '',
      relevanceScore: rankedContent.length > 0 ? Math.round(rankedContent[0]!.score * 100) : 70,
      categories: this.config.categories,
      tags: trend.tags || [],
      sourceId: trend.source,
      curatedAt: new Date(),
      metadata: {
        wordCount: this.countWords(trend.title + ' ' + (trend.description || '')),
        readingTime: Math.ceil(this.countWords(trend.title + ' ' + (trend.description || '')) / 200),
        language: 'pt-BR',
      },
      platformContent: generationResult.platformContent,
      codeSnippets,
      generatedBy: generationResult.generatedBy,
      llmProvider: generationResult.provider,
    };

    return curatedContent;
  }

  /**
   * Extract keywords from a trend
   */
  private extractKeywords(trend: { title: string; description?: string; tags?: string[] }): string[] {
    const keywords = new Set<string>();

    // Add tags
    if (trend.tags) {
      for (const tag of trend.tags) {
        keywords.add(tag.toLowerCase());
      }
    }

    // Extract important words from title (skip common words)
    const stopWords = new Set([
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
      'of', 'to', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
      'into', 'through', 'during', 'before', 'after', 'above', 'below',
      'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where', 'why',
      'how', 'what', 'which', 'who', 'whom', 'this', 'that', 'these',
      'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your',
      'his', 'her', 'its', 'our', 'their', 'um', 'uma', 'o', 'os', 'as',
      'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas',
      'para', 'por', 'com', 'sem', 'sobre', 'entre', 'e', 'ou', 'mas',
      'se', 'que', 'como', 'quando', 'onde', 'porque', 'qual', 'quem',
    ]);

    const titleWords = trend.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    for (const word of titleWords) {
      keywords.add(word);
    }

    // Limit to top 5 keywords
    return Array.from(keywords).slice(0, 5);
  }

  /**
   * Count words in a string
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
  }

  /**
   * Start the agent (transition to running state)
   */
  start(): void {
    if (this.state === CuradorAgentState.IDLE) {
      this.setState(CuradorAgentState.RUNNING);
    }
  }

  /**
   * Stop the agent (transition to idle state)
   */
  stop(): void {
    this.setState(CuradorAgentState.IDLE);
  }

  /**
   * Reset the agent to idle state
   */
  reset(): void {
    this.setState(CuradorAgentState.IDLE);
  }
}
