/**
 * LangGraph Pipeline Graph
 * Main pipeline graph implementation using LangGraph.js
 */

import { StateGraph, START, END, Annotation } from '@langchain/langgraph';
import { MemorySaver } from '@langchain/langgraph';
import type { RunnableConfig } from '@langchain/core/runnables';
import { createLogger } from '@social-content/shared';
import type {
  LangGraphPipelineState,
  LangGraphPipelineConfig,
  LangGraphPipelineResult,
  GraphOptions,
  NodeFunction,
} from './types';
import { LangGraphPipelineStatus } from './types';
import { DEFAULT_PIPELINE_CONFIG, NODE_NAMES } from './config';
import {
  researcherNode,
  topicGeneratorNode,
  curatorNode,
  writerNode,
  imageDesignerNode,
  carouselBuilderNode,
  pdfMakerNode,
  qaAnalystNode,
} from './nodes';
import { createTransitionLogger, summarizeState } from './logger';

const logger = createLogger('langgraph:pipeline-graph');

/**
 * State annotation for LangGraph
 * Defines how state properties are merged between nodes
 */
const PipelineStateAnnotation = Annotation.Root({
  executionId: Annotation<string>({
    reducer: (_, b) => b,
    default: () => '',
  }),
  threadId: Annotation<string>({
    reducer: (_, b) => b,
    default: () => '',
  }),
  status: Annotation<LangGraphPipelineStatus>({
    reducer: (_, b) => b,
    default: () => LangGraphPipelineStatus.PENDING,
  }),
  config: Annotation<LangGraphPipelineConfig>({
    reducer: (_, b) => b,
    default: () => DEFAULT_PIPELINE_CONFIG,
  }),
  trends: Annotation<LangGraphPipelineState['trends']>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  topics: Annotation<LangGraphPipelineState['topics']>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  curatedContent: Annotation<LangGraphPipelineState['curatedContent']>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  posts: Annotation<LangGraphPipelineState['posts']>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  images: Annotation<LangGraphPipelineState['images']>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  carouselPaths: Annotation<string[][]>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  pdfPaths: Annotation<string[]>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  qaResults: Annotation<LangGraphPipelineState['qaResults']>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  currentNode: Annotation<string>({
    reducer: (_, b) => b,
    default: () => '',
  }),
  startedAt: Annotation<Date>({
    reducer: (a, b) => b ?? a,
    default: () => new Date(),
  }),
  completedAt: Annotation<Date | undefined>({
    reducer: (_, b) => b,
    default: () => undefined,
  }),
  errors: Annotation<LangGraphPipelineState['errors']>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  lastCheckpoint: Annotation<string | undefined>({
    reducer: (_, b) => b,
    default: () => undefined,
  }),
  checkpointData: Annotation<Record<string, unknown> | undefined>({
    reducer: (_, b) => b,
    default: () => undefined,
  }),
});

// Extract the state type from the annotation
type AnnotatedPipelineState = typeof PipelineStateAnnotation.State;

/**
 * Create initial pipeline state
 */
export function createInitialState(
  executionId: string,
  config: LangGraphPipelineConfig
): LangGraphPipelineState {
  return {
    executionId,
    threadId: `thread_${executionId}`,
    status: LangGraphPipelineStatus.PENDING,
    config,
    trends: [],
    topics: [],
    curatedContent: [],
    posts: [],
    images: [],
    carouselPaths: [],
    pdfPaths: [],
    qaResults: [],
    currentNode: '',
    startedAt: new Date(),
    errors: [],
  };
}

/**
 * Create a node wrapper with logging and error handling
 */
function createNodeWrapper(
  nodeName: string,
  nodeFunction: NodeFunction,
  options: GraphOptions
): (state: AnnotatedPipelineState) => Promise<Partial<AnnotatedPipelineState>> {
  return async (state: AnnotatedPipelineState): Promise<Partial<AnnotatedPipelineState>> => {
    const startTime = Date.now();
    const previousNode = state.currentNode || START;

    // Notify start
    options.onNodeStart?.(nodeName, state as unknown as LangGraphPipelineState);

    try {
      // Update state with current node and running status
      const updatedState: LangGraphPipelineState = {
        ...(state as unknown as LangGraphPipelineState),
        currentNode: nodeName,
        status: LangGraphPipelineStatus.RUNNING,
      };

      // Execute the node function
      const result = await nodeFunction(updatedState);

      const duration = Date.now() - startTime;

      // Notify end
      options.onNodeEnd?.(
        nodeName,
        { ...state, ...result } as unknown as LangGraphPipelineState,
        duration
      );

      // Log transition
      options.logger?.log({
        from: previousNode,
        to: nodeName,
        timestamp: new Date(),
        durationMs: duration,
        inputSummary: summarizeState(state as unknown as Partial<LangGraphPipelineState>),
        outputSummary: summarizeState({
          ...(state as unknown as Partial<LangGraphPipelineState>),
          ...result,
        }),
        success: true,
      });

      logger.debug(`Node ${nodeName} completed`, {
        executionId: state.executionId,
        duration,
      });

      return result as Partial<AnnotatedPipelineState>;
    } catch (error) {
      const err = error as Error;
      const duration = Date.now() - startTime;

      // Notify error
      options.onError?.(nodeName, err);

      // Log failed transition
      options.logger?.log({
        from: previousNode,
        to: nodeName,
        timestamp: new Date(),
        durationMs: duration,
        inputSummary: summarizeState(state as unknown as Partial<LangGraphPipelineState>),
        outputSummary: '',
        success: false,
        error: err.message,
      });

      logger.error(`Node ${nodeName} failed`, {
        executionId: state.executionId,
        error: err.message,
        duration,
      });

      throw error;
    }
  };
}

/**
 * Conditional routing: check if visual content should be included
 */
function shouldIncludeVisual(state: AnnotatedPipelineState): string {
  if (state.config.includeVisual) {
    return NODE_NAMES.IMAGE_DESIGNER;
  }
  return NODE_NAMES.QA_ANALYST;
}

/**
 * Create and compile the pipeline graph
 */
export function createPipelineGraph(options: GraphOptions = {}) {
  const transitionLogger = options.logger ?? createTransitionLogger();
  const mergedOptions: GraphOptions = { ...options, logger: transitionLogger };

  // Create the state graph with annotation - using 'any' to bypass strict typing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graph = new StateGraph(PipelineStateAnnotation) as any;

  // Add all nodes with wrappers
  graph.addNode(
    NODE_NAMES.RESEARCHER,
    createNodeWrapper(NODE_NAMES.RESEARCHER, researcherNode, mergedOptions)
  );

  graph.addNode(
    NODE_NAMES.TOPIC_GENERATOR,
    createNodeWrapper(NODE_NAMES.TOPIC_GENERATOR, topicGeneratorNode, mergedOptions)
  );

  graph.addNode(
    NODE_NAMES.CURATOR,
    createNodeWrapper(NODE_NAMES.CURATOR, curatorNode, mergedOptions)
  );

  graph.addNode(
    NODE_NAMES.WRITER,
    createNodeWrapper(NODE_NAMES.WRITER, writerNode, mergedOptions)
  );

  graph.addNode(
    NODE_NAMES.IMAGE_DESIGNER,
    createNodeWrapper(NODE_NAMES.IMAGE_DESIGNER, imageDesignerNode, mergedOptions)
  );

  graph.addNode(
    NODE_NAMES.CAROUSEL_BUILDER,
    createNodeWrapper(NODE_NAMES.CAROUSEL_BUILDER, carouselBuilderNode, mergedOptions)
  );

  graph.addNode(
    NODE_NAMES.PDF_MAKER,
    createNodeWrapper(NODE_NAMES.PDF_MAKER, pdfMakerNode, mergedOptions)
  );

  graph.addNode(
    NODE_NAMES.QA_ANALYST,
    createNodeWrapper(NODE_NAMES.QA_ANALYST, qaAnalystNode, mergedOptions)
  );

  // Define edges using START and END constants
  graph.addEdge(START, NODE_NAMES.RESEARCHER);
  graph.addEdge(NODE_NAMES.RESEARCHER, NODE_NAMES.TOPIC_GENERATOR);
  graph.addEdge(NODE_NAMES.TOPIC_GENERATOR, NODE_NAMES.CURATOR);
  graph.addEdge(NODE_NAMES.CURATOR, NODE_NAMES.WRITER);

  // Conditional edge: visual or direct to QA
  graph.addConditionalEdges(NODE_NAMES.WRITER, shouldIncludeVisual, {
    [NODE_NAMES.IMAGE_DESIGNER]: NODE_NAMES.IMAGE_DESIGNER,
    [NODE_NAMES.QA_ANALYST]: NODE_NAMES.QA_ANALYST,
  });

  // Visual flow with parallel execution of carousel and PDF generation
  graph.addEdge(NODE_NAMES.IMAGE_DESIGNER, NODE_NAMES.CAROUSEL_BUILDER);
  graph.addEdge(NODE_NAMES.CAROUSEL_BUILDER, NODE_NAMES.PDF_MAKER);
  graph.addEdge(NODE_NAMES.PDF_MAKER, NODE_NAMES.QA_ANALYST);

  // End node
  graph.addEdge(NODE_NAMES.QA_ANALYST, END);

  // Compile with checkpointer if needed
  const checkpointer = options.checkpointer ? new MemorySaver() : undefined;

  return graph.compile({
    checkpointer,
  });
}

/**
 * Run the full pipeline
 */
export async function runPipeline(
  executionId: string,
  config: Partial<LangGraphPipelineConfig> = {},
  options: GraphOptions = {}
): Promise<LangGraphPipelineResult> {
  const mergedConfig: LangGraphPipelineConfig = {
    ...DEFAULT_PIPELINE_CONFIG,
    ...config,
  };

  const initialState = createInitialState(executionId, mergedConfig);
  const graph = createPipelineGraph(options);

  const runnableConfig: RunnableConfig = {
    configurable: {
      thread_id: initialState.threadId,
    },
  };

  logger.info('Pipeline started', {
    executionId,
    config: mergedConfig,
  });

  try {
    const finalState = await graph.invoke(
      initialState as unknown as AnnotatedPipelineState,
      runnableConfig
    );

    // Calculate statistics
    const approvedPosts = finalState.qaResults.filter(
      (r: { approved: boolean }) => r.approved
    ).length;

    const totalScore = finalState.qaResults.reduce(
      (sum: number, r: { overallScore: number }) => sum + r.overallScore,
      0
    );

    const averageScore =
      finalState.qaResults.length > 0
        ? totalScore / finalState.qaResults.length
        : 0;

    logger.info('Pipeline completed successfully', {
      executionId,
      postsGenerated: finalState.posts.length,
      postsApproved: approvedPosts,
      averageScore: Math.round(averageScore * 10) / 10,
      duration: Date.now() - initialState.startedAt.getTime(),
    });

    return {
      executionId,
      status: LangGraphPipelineStatus.COMPLETED,
      posts: finalState.posts,
      qaResults: finalState.qaResults,
      stats: {
        totalGenerated: finalState.posts.length,
        totalApproved: approvedPosts,
        averageScore: Math.round(averageScore * 10) / 10,
        durationMs: Date.now() - initialState.startedAt.getTime(),
      },
      errors: finalState.errors,
    };
  } catch (error) {
    const err = error as Error;

    logger.error('Pipeline failed', {
      executionId,
      error: err.message,
      duration: Date.now() - initialState.startedAt.getTime(),
    });

    return {
      executionId,
      status: LangGraphPipelineStatus.FAILED,
      posts: [],
      qaResults: [],
      stats: {
        totalGenerated: 0,
        totalApproved: 0,
        averageScore: 0,
        durationMs: Date.now() - initialState.startedAt.getTime(),
      },
      errors: [
        {
          node: 'pipeline',
          message: err.message,
          code: 'PIPELINE_FAILED',
          timestamp: new Date(),
          retriable: true,
          stack: err.stack,
        },
      ],
    };
  }
}

/**
 * Get the list of node names in execution order
 */
export function getNodeNames(): string[] {
  return [
    NODE_NAMES.RESEARCHER,
    NODE_NAMES.TOPIC_GENERATOR,
    NODE_NAMES.CURATOR,
    NODE_NAMES.WRITER,
    NODE_NAMES.IMAGE_DESIGNER,
    NODE_NAMES.CAROUSEL_BUILDER,
    NODE_NAMES.PDF_MAKER,
    NODE_NAMES.QA_ANALYST,
  ];
}

/**
 * Check if a node name is valid
 */
export function isValidNodeName(name: string): boolean {
  return Object.values(NODE_NAMES).includes(
    name as (typeof NODE_NAMES)[keyof typeof NODE_NAMES]
  );
}
