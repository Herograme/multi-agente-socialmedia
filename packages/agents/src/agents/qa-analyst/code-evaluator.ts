/**
 * CodeEvaluator - Evaluates code quality criteria using LLM
 */

import type { LLMService, CriteriaScore, CodeSnippet } from './types';
import { QACriterion } from './types';

/**
 * Default weights for code criteria
 */
const DEFAULT_CODE_WEIGHTS = {
  [QACriterion.CODE_SYNTAX]: 0.5,
  [QACriterion.CODE_EXPLANATION]: 0.5,
};

/**
 * Prompts for code evaluation
 */
const CODE_PROMPTS = {
  syntax: `
Avalie a SINTAXE do seguinte codigo {language}:

\`\`\`{language}
{code}
\`\`\`

Criterios:
- Sintaxe valida da linguagem
- Boas praticas de formatacao
- Nomes de variaveis/funcoes descritivos
- Codigo executavel (sem erros obvios)

Responda APENAS com um JSON no formato:
{
  "score": <numero de 0 a 10 com 1 casa decimal>,
  "reasoning": "<explicacao breve mencionando problemas ou confirmando qualidade>",
  "issues": ["<lista de problemas especificos, se houver>"]
}
`,

  explanation: `
Avalie se o codigo esta BEM EXPLICADO no contexto do texto:

Texto de contexto:
{context}

Codigo:
\`\`\`{language}
{code}
\`\`\`

Criterios:
- O texto explica o que o codigo faz?
- O proposito do codigo esta claro?
- Ha comentarios ou explicacoes uteis?
- Um iniciante entenderia o codigo com a explicacao?

Responda APENAS com um JSON no formato:
{
  "score": <numero de 0 a 10 com 1 casa decimal>,
  "reasoning": "<explicacao breve>"
}
`,
};

/**
 * Language detection patterns
 */
const LANGUAGE_PATTERNS: Record<string, RegExp[]> = {
  typescript: [/: \w+[[\]<>]*\s*[=;{(]/, /interface\s+\w+/, /type\s+\w+\s*=/],
  javascript: [/const\s+\w+\s*=/, /function\s+\w+/, /=>\s*{/],
  python: [/def\s+\w+\(/, /import\s+\w+/, /:\s*$/m],
  java: [/public\s+class/, /System\.out\./, /void\s+main/],
  rust: [/fn\s+\w+/, /let\s+mut/, /impl\s+\w+/],
  go: [/func\s+\w+/, /package\s+\w+/, /:=\s*/],
  csharp: [/public\s+class/, /namespace\s+/, /using\s+System/],
  cpp: [/#include\s*</, /std::/, /int\s+main/],
  ruby: [/def\s+\w+/, /class\s+\w+/, /end$/m],
  php: [/<\?php/, /function\s+\w+/, /\$\w+/],
  swift: [/func\s+\w+/, /var\s+\w+:/, /let\s+\w+:/],
  kotlin: [/fun\s+\w+/, /val\s+\w+/, /var\s+\w+:/],
};

/**
 * CodeEvaluator class for evaluating code quality
 */
export class CodeEvaluator {
  private llmService: LLMService;

  constructor(llmService: LLMService) {
    this.llmService = llmService;
  }

  /**
   * Detect programming language from code
   */
  detectLanguage(code: string): string {
    for (const [lang, regexes] of Object.entries(LANGUAGE_PATTERNS)) {
      const matches = regexes.filter((r) => r.test(code)).length;
      if (matches >= 2) return lang;
    }

    return 'javascript'; // Default
  }

  /**
   * Evaluate code syntax
   */
  async evaluateCodeSyntax(snippets: CodeSnippet[]): Promise<CriteriaScore> {
    if (snippets.length === 0) {
      return {
        criterion: QACriterion.CODE_SYNTAX,
        score: 10.0,
        weight: DEFAULT_CODE_WEIGHTS[QACriterion.CODE_SYNTAX],
        details: 'Nenhum codigo para avaliar',
      };
    }

    const scores: number[] = [];
    const issues: string[] = [];

    for (const snippet of snippets) {
      const language = snippet.language ?? this.detectLanguage(snippet.code);

      const prompt = CODE_PROMPTS.syntax
        .replace(/{language}/g, language)
        .replace('{code}', snippet.code);

      const result = await this.callLLM(prompt);
      scores.push(result.score);

      if (result.issues) {
        issues.push(...result.issues);
      }
    }

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    return {
      criterion: QACriterion.CODE_SYNTAX,
      score: Number(avgScore.toFixed(1)),
      weight: DEFAULT_CODE_WEIGHTS[QACriterion.CODE_SYNTAX],
      feedback:
        avgScore < 7 ? `Problemas encontrados: ${issues.slice(0, 3).join('; ')}` : undefined,
      details: `Avaliados ${snippets.length} snippet(s) de codigo`,
    };
  }

  /**
   * Evaluate code explanation
   */
  async evaluateCodeExplanation(
    snippets: CodeSnippet[],
    surroundingText: string
  ): Promise<CriteriaScore> {
    if (snippets.length === 0) {
      return {
        criterion: QACriterion.CODE_EXPLANATION,
        score: 10.0,
        weight: DEFAULT_CODE_WEIGHTS[QACriterion.CODE_EXPLANATION],
        details: 'Nenhum codigo para avaliar',
      };
    }

    const scores: number[] = [];

    for (const snippet of snippets) {
      const language = snippet.language ?? this.detectLanguage(snippet.code);
      const context = snippet.context ?? surroundingText;

      const prompt = CODE_PROMPTS.explanation
        .replace(/{language}/g, language)
        .replace('{code}', snippet.code)
        .replace('{context}', context);

      const result = await this.callLLM(prompt);
      scores.push(result.score);
    }

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    return {
      criterion: QACriterion.CODE_EXPLANATION,
      score: Number(avgScore.toFixed(1)),
      weight: DEFAULT_CODE_WEIGHTS[QACriterion.CODE_EXPLANATION],
      feedback: avgScore < 7 ? 'Codigo precisa de explicacao mais clara' : undefined,
      details: `Avaliadas explicacoes de ${snippets.length} snippet(s)`,
    };
  }

  /**
   * Evaluate all code criteria
   */
  async evaluateAll(snippets: CodeSnippet[], surroundingText: string): Promise<CriteriaScore[]> {
    const [syntax, explanation] = await Promise.all([
      this.evaluateCodeSyntax(snippets),
      this.evaluateCodeExplanation(snippets, surroundingText),
    ]);

    return [syntax, explanation];
  }

  /**
   * Call LLM and parse JSON response
   */
  private async callLLM(
    prompt: string
  ): Promise<{ score: number; reasoning: string; issues?: string[] }> {
    const response = await this.llmService.generate({
      messages: [
        {
          role: 'system',
          content: 'Voce e um code reviewer experiente. Responda sempre em JSON valido.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      maxTokens: 300,
    });

    try {
      const parsed = JSON.parse(response.content);
      return {
        score: Math.min(10, Math.max(0, Number(parsed.score))),
        reasoning: String(parsed.reasoning),
        issues: parsed.issues,
      };
    } catch {
      return { score: 5.0, reasoning: 'Avaliacao automatica nao conclusiva' };
    }
  }
}

/**
 * Get default code weights
 */
export function getDefaultCodeWeights(): typeof DEFAULT_CODE_WEIGHTS {
  return { ...DEFAULT_CODE_WEIGHTS };
}
