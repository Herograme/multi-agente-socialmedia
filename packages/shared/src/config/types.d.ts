export type NodeEnv = 'development' | 'production' | 'test';
export type LLMProvider = 'groq' | 'gemini' | 'openai' | 'anthropic';
export type ImageProvider = 'ideogram' | 'leonardo' | 'dalle';
export interface AppConfig {
    server: ServerConfig;
    database: DatabaseConfig;
    llm: LLMConfig;
    image: ImageConfig;
    sources: SourcesConfig;
    quality: QualityConfig;
}
export interface ServerConfig {
    port: number;
    nodeEnv: NodeEnv;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
}
export interface DatabaseConfig {
    url: string;
}
export interface LLMConfig {
    primary: LLMProviderConfig;
    fallback?: LLMProviderConfig;
}
export interface LLMProviderConfig {
    provider: LLMProvider;
    apiKey: string;
    model: string;
    maxTokens?: number;
    temperature?: number;
}
export interface ImageConfig {
    primary: ImageProviderConfig;
    fallback?: ImageProviderConfig;
}
export interface ImageProviderConfig {
    provider: ImageProvider;
    apiKey: string;
    defaultStyle?: string;
}
export interface SourcesConfig {
    devto: SourceConfig;
    hackernews: SourceConfig;
    reddit: SourceConfig;
}
export interface SourceConfig {
    enabled: boolean;
    url: string;
    rateLimit?: {
        maxRequests: number;
        windowMs: number;
    };
}
export interface QualityConfig {
    threshold: number;
    autoRetry: boolean;
    maxRetries: number;
}
export declare const ENV_VARS: {
    readonly GROQ_API_KEY: "GROQ_API_KEY";
    readonly IDEOGRAM_API_KEY: "IDEOGRAM_API_KEY";
    readonly GEMINI_API_KEY: "GEMINI_API_KEY";
    readonly LEONARDO_API_KEY: "LEONARDO_API_KEY";
    readonly PORT: "PORT";
    readonly NODE_ENV: "NODE_ENV";
    readonly LOG_LEVEL: "LOG_LEVEL";
    readonly DATABASE_URL: "DATABASE_URL";
    readonly DEVTO_ENABLED: "DEVTO_ENABLED";
    readonly HACKERNEWS_ENABLED: "HACKERNEWS_ENABLED";
    readonly REDDIT_ENABLED: "REDDIT_ENABLED";
    readonly QUALITY_THRESHOLD: "QUALITY_THRESHOLD";
};
export declare const REQUIRED_ENV_VARS: readonly ["GROQ_API_KEY", "IDEOGRAM_API_KEY"];
export declare const OPTIONAL_ENV_VARS: readonly ["GEMINI_API_KEY", "LEONARDO_API_KEY", "PORT", "NODE_ENV", "LOG_LEVEL", "DATABASE_URL", "DEVTO_ENABLED", "HACKERNEWS_ENABLED", "REDDIT_ENABLED", "QUALITY_THRESHOLD"];
//# sourceMappingURL=types.d.ts.map