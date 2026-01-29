// Settings types - Social Content Agent
// Story 5.6: Pagina de Configuracoes

/**
 * Configuracao de fontes de tendencias
 */
export interface SourcesSettings {
  devto: boolean;
  hackernews: boolean;
  reddit: boolean;
}

/**
 * Providers de LLM disponiveis
 */
export type LLMProviderType = 'groq' | 'gemini';

/**
 * Configuracao de LLM
 */
export interface LLMSettings {
  primaryProvider: LLMProviderType;
  fallbackOrder: LLMProviderType[];
  temperature?: number;
  maxTokens?: number;
}

/**
 * Providers de geracao de imagem disponiveis
 */
export type ImageProviderType = 'ideogram' | 'leonardo';

/**
 * Aspect ratios disponiveis
 */
export type AspectRatio = '1:1' | '16:9' | '9:16';

/**
 * Configuracao de geracao de imagens
 */
export interface ImageSettings {
  provider: ImageProviderType;
  enabled: boolean;
  preferredStyle: string;
  aspectRatio: AspectRatio;
}

/**
 * Configuracao do Quality Gate
 */
export interface QualitySettings {
  threshold: number; // 0-10
  autoRegenerate: boolean;
  maxRegenerations: number; // 1-5
}

/**
 * Resolucao de imagem
 */
export type ImageResolution = '1080x1080' | '1200x1200';

/**
 * Configuracao de output
 */
export interface OutputSettings {
  directory: string;
  enableCarousel: boolean;
  enablePdf: boolean;
  slidesPerCarousel: number; // 1-10
  imageResolution: ImageResolution;
}

/**
 * Configuracoes completas do sistema
 */
export interface Settings {
  sources: SourcesSettings;
  llm: LLMSettings;
  image: ImageSettings;
  quality: QualitySettings;
  output: OutputSettings;
  updatedAt?: string;
}

/**
 * Valores default das configuracoes
 */
export const DEFAULT_SETTINGS: Settings = {
  sources: {
    devto: true,
    hackernews: true,
    reddit: true,
  },
  llm: {
    primaryProvider: 'groq',
    fallbackOrder: ['gemini'],
    temperature: 0.7,
    maxTokens: 4096,
  },
  image: {
    provider: 'ideogram',
    enabled: true,
    preferredStyle: 'tech, abstract, modern, dark background',
    aspectRatio: '1:1',
  },
  quality: {
    threshold: 6.0,
    autoRegenerate: true,
    maxRegenerations: 1,
  },
  output: {
    directory: './output',
    enableCarousel: true,
    enablePdf: true,
    slidesPerCarousel: 8,
    imageResolution: '1080x1080',
  },
};

/**
 * Request para atualizar configuracoes
 */
export interface UpdateSettingsRequest {
  settings: Partial<Settings>;
}

/**
 * Response da API de configuracoes
 */
export interface SettingsResponse {
  settings: Settings;
  isDefault: boolean;
  updatedAt: string;
}
