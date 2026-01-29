/**
 * Content Generation Prompts
 * Prompts in Portuguese for generating social media content
 */

import type { Trend } from '@social-content/shared';

/**
 * Platform-specific content configuration
 */
export interface PlatformConfig {
  name: string;
  maxLength: number;
  hashtagCount: { min: number; max: number };
  style: string;
}

/**
 * Platform configurations
 */
export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  instagram: {
    name: 'Instagram',
    maxLength: 2200,
    hashtagCount: { min: 5, max: 10 },
    style: 'visual, engaging, emoji-friendly',
  },
  linkedin: {
    name: 'LinkedIn',
    maxLength: 3000,
    hashtagCount: { min: 3, max: 5 },
    style: 'professional, insightful, actionable',
  },
  twitter: {
    name: 'Twitter/X',
    maxLength: 280,
    hashtagCount: { min: 2, max: 3 },
    style: 'concise, punchy, thread-optimized',
  },
};

/**
 * System prompt for content generation
 */
export const SYSTEM_PROMPT = `Você é um especialista em criação de conteúdo para redes sociais focado em tecnologia, programação e desenvolvimento de software.

Seu objetivo é criar conteúdo:
- 100% em português brasileiro
- Engajante e relevante para desenvolvedores e profissionais de tech
- Informativo mas acessível
- Com linguagem natural e autêntica (não robótica)

Regras importantes:
1. SEMPRE responda em JSON válido
2. NUNCA use markdown no conteúdo (apenas texto puro)
3. Use emojis de forma moderada e estratégica
4. Inclua código quando relevante (formatado corretamente)
5. Mantenha tom profissional mas amigável
6. Foque em valor prático para o leitor`;

/**
 * Extended trend interface with optional tags
 */
export interface TrendWithTags extends Trend {
  tags?: string[];
}

/**
 * Generate Instagram prompt
 */
export function getInstagramPrompt(
  trend: TrendWithTags,
  references: string[]
): string {
  const referencesText =
    references.length > 0
      ? `\n\nReferências para contexto:\n${references.join('\n')}`
      : '';

  return `Crie um post para Instagram sobre o seguinte tema de tecnologia:

**Título:** ${trend.title}
**Descrição:** ${trend.description || 'N/A'}
**Fonte:** ${trend.source}
**Tags:** ${(trend as TrendWithTags).tags?.join(', ') || 'N/A'}
${referencesText}

Gere o conteúdo no seguinte formato JSON:
{
  "caption": "Caption do post com 150-300 palavras. Comece com um hook forte para capturar atenção. Inclua insights práticos e termine com uma chamada para ação.",
  "hashtags": ["#hashtag1", "#hashtag2", ...], // 5-10 hashtags relevantes em português
  "imagePrompt": "Descrição em inglês para gerar uma imagem que ilustre o tema. Seja específico sobre elementos visuais, estilo e composição."
}

Diretrizes para Instagram:
- Hook forte nos primeiros 125 caracteres (preview)
- Use emojis estrategicamente (2-5 por post)
- Quebre o texto em parágrafos curtos
- Inclua uma pergunta para gerar engajamento
- Hashtags devem incluir mix de populares e nichadas`;
}

/**
 * Generate LinkedIn prompt
 */
export function getLinkedInPrompt(
  trend: TrendWithTags,
  references: string[]
): string {
  const referencesText =
    references.length > 0
      ? `\n\nReferências para contexto:\n${references.join('\n')}`
      : '';

  return `Crie um post para LinkedIn sobre o seguinte tema de tecnologia:

**Título:** ${trend.title}
**Descrição:** ${trend.description || 'N/A'}
**Fonte:** ${trend.source}
**Tags:** ${(trend as TrendWithTags).tags?.join(', ') || 'N/A'}
${referencesText}

Gere o conteúdo no seguinte formato JSON:
{
  "post": "Post profissional com 300-500 palavras. Estruture com introdução impactante, desenvolvimento com insights acionáveis, e conclusão com reflexão ou call-to-action.",
  "hashtags": ["#hashtag1", "#hashtag2", ...] // 3-5 hashtags profissionais
}

Diretrizes para LinkedIn:
- Tom profissional mas acessível
- Primeira linha deve ser impactante (hook)
- Use formatação com quebras de linha
- Inclua insights baseados em experiência
- Termine com pergunta ou reflexão
- Evite emojis em excesso (máximo 2-3)
- Foque em valor prático para a carreira
- Mencione tendências de mercado quando relevante`;
}

/**
 * Generate Twitter/X prompt
 */
export function getTwitterPrompt(
  trend: TrendWithTags,
  references: string[]
): string {
  const referencesText =
    references.length > 0
      ? `\n\nReferências para contexto:\n${references.join('\n')}`
      : '';

  return `Crie uma thread para Twitter/X sobre o seguinte tema de tecnologia:

**Título:** ${trend.title}
**Descrição:** ${trend.description || 'N/A'}
**Fonte:** ${trend.source}
**Tags:** ${(trend as TrendWithTags).tags?.join(', ') || 'N/A'}
${referencesText}

Gere o conteúdo no seguinte formato JSON:
{
  "thread": [
    "Tweet 1 - Hook forte que introduz o tema (max 280 chars)",
    "Tweet 2 - Ponto principal ou contexto",
    "Tweet 3 - Insight ou exemplo prático",
    "Tweet 4 - Mais detalhes ou dica",
    "Tweet 5 - Conclusão ou call-to-action"
  ], // 3-7 tweets
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"] // 2-3 hashtags
}

Diretrizes para Twitter/X:
- Cada tweet DEVE ter no máximo 280 caracteres
- Primeiro tweet deve ser impactante (hook)
- Use numeração implícita ou explícita
- Linguagem direta e concisa
- Emojis apenas onde agregam valor
- Último tweet deve ter call-to-action
- Thread deve contar uma história completa`;
}

/**
 * Generate combined prompt for all platforms
 */
export function getMultiPlatformPrompt(
  trend: TrendWithTags,
  references: string[],
  codeSnippets: string[]
): string {
  const referencesText =
    references.length > 0
      ? `\n\n**Referências:**\n${references.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
      : '';

  const codeText =
    codeSnippets.length > 0
      ? `\n\n**Exemplos de Código:**\n${codeSnippets.join('\n\n')}`
      : '';

  return `Crie conteúdo para múltiplas redes sociais sobre o seguinte tema de tecnologia:

**Título:** ${trend.title}
**Descrição:** ${trend.description || 'N/A'}
**Fonte:** ${trend.source}
**Tags:** ${(trend as TrendWithTags).tags?.join(', ') || 'N/A'}
${referencesText}
${codeText}

Gere conteúdo para TODAS as plataformas no seguinte formato JSON:
{
  "instagram": {
    "caption": "Caption engajante de 150-300 palavras com hook forte, emojis estratégicos e call-to-action",
    "hashtags": ["#hashtag1", ...], // 5-10 hashtags
    "imagePrompt": "Descrição em inglês para geração de imagem"
  },
  "linkedin": {
    "post": "Post profissional de 300-500 palavras com insights acionáveis",
    "hashtags": ["#hashtag1", ...] // 3-5 hashtags
  },
  "twitter": {
    "thread": ["Tweet 1 (max 280 chars)", "Tweet 2", ...], // 3-7 tweets
    "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"] // 2-3 hashtags
  }
}

IMPORTANTE:
- Todo conteúdo DEVE ser em português brasileiro
- Adapte o tom para cada plataforma
- Mantenha coerência temática entre plataformas
- Tweets devem ter no máximo 280 caracteres cada
- Use código apenas quando agregar valor
- Retorne APENAS o JSON, sem explicações adicionais`;
}

/**
 * Prompt for code extraction context
 */
export function getCodeContextPrompt(code: string, language: string): string {
  return `Analise o seguinte código e extraia informações relevantes para criação de conteúdo:

\`\`\`${language}
${code}
\`\`\`

Forneça:
1. Resumo do que o código faz (1-2 frases)
2. Conceitos-chave demonstrados
3. Possíveis casos de uso
4. Dicas ou boas práticas relacionadas`;
}

/**
 * Fallback templates when LLM is unavailable
 */
export const FALLBACK_TEMPLATES = {
  instagram: (trend: TrendWithTags) => ({
    caption: `${trend.title}\n\nDescubra mais sobre essa tendência interessante em tech!\n\n${trend.description || 'Confira os detalhes.'}\n\nO que você acha? Deixe seu comentário!`,
    hashtags: ['#Tech', '#Programacao', '#Desenvolvimento', '#Dev', '#Tecnologia'],
    imagePrompt: `Tech illustration about ${trend.title}, modern digital art style`,
  }),

  linkedin: (trend: TrendWithTags) => ({
    post: `${trend.title}\n\n${trend.description || 'Uma tendência interessante no mundo tech.'}\n\nEssa é uma área que merece atenção de profissionais de tecnologia.\n\nO que você acha dessa tendência? Compartilhe sua experiência nos comentários.`,
    hashtags: ['#Tech', '#Desenvolvimento', '#Inovacao'],
  }),

  twitter: (trend: TrendWithTags) => ({
    thread: [
      `${trend.title.length > 250 ? trend.title.substring(0, 247) + '...' : trend.title} - Thread`,
      trend.description
        ? trend.description.length > 280
          ? trend.description.substring(0, 277) + '...'
          : trend.description
        : 'Confira essa tendência interessante!',
      'O que vocês acham? Deixem suas opiniões!',
    ],
    hashtags: ['#Tech', '#Dev'],
  }),
};
