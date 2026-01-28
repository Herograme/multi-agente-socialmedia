// WebSocket Event types - Social Content Agent
export var WSEventType;
(function (WSEventType) {
    // Pipeline events
    WSEventType["PIPELINE_START"] = "pipeline:start";
    WSEventType["PIPELINE_PROGRESS"] = "pipeline:progress";
    WSEventType["PIPELINE_COMPLETE"] = "pipeline:complete";
    WSEventType["PIPELINE_ERROR"] = "pipeline:error";
    // Agent events
    WSEventType["AGENT_START"] = "agent:start";
    WSEventType["AGENT_PROGRESS"] = "agent:progress";
    WSEventType["AGENT_COMPLETE"] = "agent:complete";
    WSEventType["AGENT_ERROR"] = "agent:error";
    // Post events
    WSEventType["POST_GENERATED"] = "post:generated";
    WSEventType["POST_SCORED"] = "post:scored";
})(WSEventType || (WSEventType = {}));
//# sourceMappingURL=events.js.map