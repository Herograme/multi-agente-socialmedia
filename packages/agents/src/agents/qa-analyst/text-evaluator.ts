/**
 * TextEvaluator - Evaluates text quality criteria using LLM
 */

import type { LLMService, CriteriaScore, Platform } from './types';
import { QACriterion } from './types';

/**
 * Text criteria type
 */
type TextCriterion =
  | QACriterion.CLARITY
  | QACriterion.RELEVANCE
  | QACriterion.ENGAGEMENT
  | QACriterion.GRAMMAR;

/**
 * Evaluation prompts for each text criterion
 */
const EVALUATION_PROMPTS: Record<TextCriterion, string> = {
  [QACriterion.CLARITY]: `
Avalie a CLAREZA do seguinte texto para {platform}.

Criterios:
- Linguagem clara e direta
- Ideias bem organizadas
- Facil de entender na primeira leitura
- Sem jargoes desnecessarios
- Paragrafos e frases bem estruturados

Texto:
{text}

Responda APENAS com um JSON no formato:
{
  "score": <numero de 0 a 10 com 1 casa decimal>,
  "reasoning": "<explicacao breve de 1-2 frases>"
}
`,

  [QACriterion.RELEVANCE]: `
Avalie a RELEVANCIA do seguinte texto sobre o topico "{topic}" para {platform}.

Criterios:
- Conteudo alinhado com o topico
- Informacoes uteis e atuais para desenvolvedores
- Profundidade adequada ao formato
- Valor pratico para o leitor

Texto:
{text}

Responda APENAS com um JSON no formato:
{
  "score": <numero de 0 a 10 com 1 casa decimal>,
  "reasoning": "<explicacao breve de 1-2 frases>"
}
`,

  [QACriterion.ENGAGEMENT]: `
Avalie o ENGAJAMENTO do seguinte texto para {platform}.

Criterios:
- Hook forte no inicio (primeira linha)
- Call-to-action claro no final
- Tom adequado a plataforma
- Uso estrategico de emojis (se Instagram)
- Estrutura que incentiva leitura completa
- Potencial de gerar interacao (curtidas, comentarios, compartilhamentos)

Texto:
{text}

Responda APENAS com um JSON no formato:
{
  "score": <numero de 0 a 10 com 1 casa decimal>,
  "reasoning": "<explicacao breve de 1-2 frases>"
}
`,

  [QACriterion.GRAMMAR]: `
Avalie a GRAMATICA e ORTOGRAFIA do seguinte texto em portugues.

Criterios:
- Ortografia correta
- Concordancia verbal e nominal
- Pontuacao adequada
- Uso correto de acentuacao
- Sintaxe clara

Texto:
{text}

Responda APENAS com um JSON no formato:
{
  "score": <numero de 0 a 10 com 1 casa decimal>,
  "reasoning": "<explicacao breve mencionando erros encontrados ou confirmando ausencia de erros>"
}
`,
};

/**
 * Default weights for text criteria
 */
const DEFAULT_TEXT_WEIGHTS = {
  [QACriterion.CLARITY]: 0.25,
  [QACriterion.RELEVANCE]: 0.3,
  [QACriterion.ENGAGEMENT]: 0.25,
  [QACriterion.GRAMMAR]: 0.2,
};

/**
 * TextEvaluator class for evaluating text quality
 */
export class TextEvaluator {
  private llmService: LLMService;

  constructor(llmService: LLMService) {
    this.llmService = llmService;
  }

  /**
   * Evaluate text clarity
   */
  async evaluateClarity(text: string, platform: Platform): Promise<CriteriaScore> {
    return this.evaluateCriterion(
      QACriterion.CLARITY,
      text,
      platform,
      DEFAULT_TEXT_WEIGHTS[QACriterion.CLARITY]
    );
  }

  /**
   * Evaluate text relevance
   */
  async evaluateRelevance(
    text: string,
    platform: Platform,
    topic?: string
  ): Promise<CriteriaScore> {
    const prompt = EVALUATION_PROMPTS[QACriterion.RELEVANCE]
      .replace('{text}', text)
      .replace('{platform}', platform)
      .replace('{topic}', topic ?? 'tecnologia e desenvolvimento');

    const result = await this.callLLM(prompt);

    return {
      criterion: QACriterion.RELEVANCE,
      score: result.score,
      weight: DEFAULT_TEXT_WEIGHTS[QACriterion.RELEVANCE],
      feedback: result.score < 7 ? result.reasoning : undefined,
      details: result.reasoning,
    };
  }

  /**
   * Evaluate engagement potential
   */
  async evaluateEngagement(text: string, platform: Platform): Promise<CriteriaScore> {
    return this.evaluateCriterion(
      QACriterion.ENGAGEMENT,
      text,
      platform,
      DEFAULT_TEXT_WEIGHTS[QACriterion.ENGAGEMENT]
    );
  }

  /**
   * Evaluate grammar and spelling
   */
  async evaluateGrammar(text: string): Promise<CriteriaScore> {
    const prompt = EVALUATION_PROMPTS[QACriterion.GRAMMAR].replace('{text}', text);

    const result = await this.callLLM(prompt);

    return {
      criterion: QACriterion.GRAMMAR,
      score: result.score,
      weight: DEFAULT_TEXT_WEIGHTS[QACriterion.GRAMMAR],
      feedback: result.score < 7 ? result.reasoning : undefined,
      details: result.reasoning,
    };
  }

  /**
   * Evaluate all text criteria
   */
  async evaluateAll(text: string, platform: Platform, topic?: string): Promise<CriteriaScore[]> {
    const [clarity, relevance, engagement, grammar] = await Promise.all([
      this.evaluateClarity(text, platform),
      this.evaluateRelevance(text, platform, topic),
      this.evaluateEngagement(text, platform),
      this.evaluateGrammar(text),
    ]);

    return [clarity, relevance, engagement, grammar];
  }

  /**
   * Evaluate a generic criterion
   */
  private async evaluateCriterion(
    criterion: TextCriterion,
    text: string,
    platform: Platform,
    weight: number
  ): Promise<CriteriaScore> {
    const promptTemplate = EVALUATION_PROMPTS[criterion];
    if (!promptTemplate) {
      throw new Error(`No prompt template for criterion: ${criterion}`);
    }

    const prompt = promptTemplate.replace('{text}', text).replace('{platform}', platform);

    const result = await this.callLLM(prompt);

    return {
      criterion,
      score: result.score,
      weight,
      feedback: result.score < 7 ? result.reasoning : undefined,
      details: result.reasoning,
    };
  }

  /**
   * Call LLM and parse JSON response
   */
  private async callLLM(prompt: string): Promise<{ score: number; reasoning: string }> {
    const response = await this.llmService.generate({
      messages: [
        {
          role: 'system',
          content: 'Voce e um avaliador de qualidade de conteudo. Responda sempre em JSON valido.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3, // Low temperature for consistency
      maxTokens: 200,
    });

    try {
      const parsed = JSON.parse(response.content);
      return {
        score: Math.min(10, Math.max(0, Number(parsed.score))),
        reasoning: String(parsed.reasoning),
      };
    } catch {
      // Fallback if parsing fails
      return { score: 5.0, reasoning: 'Avaliacao automatica nao conclusiva' };
    }
  }
}

/**
 * Get default text weights
 */
export function getDefaultTextWeights(): typeof DEFAULT_TEXT_WEIGHTS {
  return { ...DEFAULT_TEXT_WEIGHTS };
}
