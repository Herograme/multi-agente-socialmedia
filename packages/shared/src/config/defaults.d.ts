import type { ServerConfig, SourcesConfig, QualityConfig } from './types';
export declare const DEFAULT_SERVER: ServerConfig;
export declare const DEFAULT_SOURCES: SourcesConfig;
export declare const DEFAULT_QUALITY: QualityConfig;
export declare const DEFAULT_LLM_MODELS: {
    readonly groq: "llama-3.3-70b-versatile";
    readonly gemini: "gemini-1.5-flash";
    readonly openai: "gpt-4o-mini";
    readonly anthropic: "claude-3-haiku-20240307";
};
export declare const DEFAULT_IMAGE_STYLES: {
    readonly ideogram: "REALISTIC";
    readonly leonardo: "CINEMATIC";
    readonly dalle: "vivid";
};
//# sourceMappingURL=defaults.d.ts.map