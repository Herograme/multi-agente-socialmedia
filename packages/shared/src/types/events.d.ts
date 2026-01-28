import type { AgentStatus } from './agents';
export declare enum WSEventType {
    PIPELINE_START = "pipeline:start",
    PIPELINE_PROGRESS = "pipeline:progress",
    PIPELINE_COMPLETE = "pipeline:complete",
    PIPELINE_ERROR = "pipeline:error",
    AGENT_START = "agent:start",
    AGENT_PROGRESS = "agent:progress",
    AGENT_COMPLETE = "agent:complete",
    AGENT_ERROR = "agent:error",
    POST_GENERATED = "post:generated",
    POST_SCORED = "post:scored"
}
export interface WSEvent<T = unknown> {
    type: WSEventType;
    payload: T;
    timestamp: Date;
}
export interface AgentEvent {
    agentId: string;
    agentName: string;
    status: AgentStatus;
    progress?: number;
    message?: string;
    data?: unknown;
}
export interface PipelineEvent {
    executionId: string;
    currentAgent?: string;
    progress: number;
    message?: string;
}
//# sourceMappingURL=events.d.ts.map