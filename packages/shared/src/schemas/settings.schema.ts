// Settings validation schema - Social Content Agent
// Story 5.6: Pagina de Configuracoes

import { z } from 'zod';

/**
 * Schema para validacao de fontes
 */
export const SourcesSettingsSchema = z
  .object({
    devto: z.boolean(),
    hackernews: z.boolean(),
    reddit: z.boolean(),
  })
  .refine((data) => data.devto || data.hackernews || data.reddit, {
    message: 'Pelo menos uma fonte deve estar ativa',
  });

/**
 * Schema para validacao de LLM
 */
export const LLMSettingsSchema = z.object({
  primaryProvider: z.enum(['groq', 'gemini']),
  fallbackOrder: z.array(z.enum(['groq', 'gemini'])),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(100).max(8192).optional(),
});

/**
 * Schema para validacao de imagem
 */
export const ImageSettingsSchema = z.object({
  provider: z.enum(['ideogram', 'leonardo']),
  enabled: z.boolean(),
  preferredStyle: z.string().min(3).max(200),
  aspectRatio: z.enum(['1:1', '16:9', '9:16']),
});

/**
 * Schema para validacao de qualidade
 */
export const QualitySettingsSchema = z.object({
  threshold: z.number().min(0).max(10),
  autoRegenerate: z.boolean(),
  maxRegenerations: z.number().min(1).max(5),
});

/**
 * Schema para validacao de output
 */
export const OutputSettingsSchema = z.object({
  directory: z.string().min(1),
  enableCarousel: z.boolean(),
  enablePdf: z.boolean(),
  slidesPerCarousel: z.number().min(1).max(10),
  imageResolution: z.enum(['1080x1080', '1200x1200']),
});

/**
 * Schema completo de configuracoes
 */
export const SettingsSchema = z.object({
  sources: SourcesSettingsSchema,
  llm: LLMSettingsSchema,
  image: ImageSettingsSchema,
  quality: QualitySettingsSchema,
  output: OutputSettingsSchema,
});

/**
 * Schema parcial para atualizacoes
 */
export const PartialSettingsSchema = z
  .object({
    sources: SourcesSettingsSchema.optional(),
    llm: LLMSettingsSchema.optional(),
    image: ImageSettingsSchema.optional(),
    quality: QualitySettingsSchema.optional(),
    output: OutputSettingsSchema.optional(),
  })
  .partial();

/**
 * Tipos inferidos dos schemas
 */
export type SettingsInput = z.infer<typeof SettingsSchema>;
export type PartialSettingsInput = z.infer<typeof PartialSettingsSchema>;
