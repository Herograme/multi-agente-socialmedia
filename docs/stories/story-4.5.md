# Story 4.5: Orquestrador - Retry e Error Handling

> Epic 4: Qualidade & Orquestracao

---

## Story

**Como** usuario,
**Quero** que o sistema tente novamente em caso de falhas,
**Para que** problemas temporarios nao interrompam a geracao.

---

## Status

`QA Passed`

---

## Acceptance Criteria

| # | Criterio | Validacao |
|---|----------|-----------|
| AC1 | Retry automatico configuravel por agente (default: 3 tentativas) | Interface `RetryConfig` com `maxAttempts` por agente, default 3 |
| AC2 | Backoff exponencial entre tentativas | Delay cresce exponencialmente (1s, 2s, 4s...) com jitter opcional |
| AC3 | Fallback para provider alternativo apos N falhas | `FallbackManager` tenta provider secundario apos N falhas consecutivas |
| AC4 | Erros categorizados: retriable vs fatal | Enum `ErrorCategory` com logica de classificacao automatica |
| AC5 | State preservado entre retries | Contexto de execucao mantido, apenas operacao falha e repetida |
| AC6 | Timeout configuravel por agente | Interface `TimeoutConfig` com timeout individual por agente |
| AC7 | Log detalhado de erros e tentativas | Logger estruturado registra cada tentativa, erro e recuperacao |
| AC8 | Notificacao ao final se houve degradacao (fallback usado) | `DegradationReport` incluso no resultado do pipeline |
| AC9 | Testes simulando falhas e validando recovery | Suite de testes com mocks simulando falhas e validando retry/fallback |

---

## Tasks

- [x] **Task 1:** Criar interfaces TypeScript para Retry e Error Handling
  - [x] Criar `packages/agents/src/orchestrator/retry/types.ts`
  - [x] Definir interface `RetryConfig` (maxAttempts, initialDelay, maxDelay, backoffFactor, jitter)
  - [x] Definir interface `TimeoutConfig` (timeout por agente, default global)
  - [x] Definir interface `FallbackConfig` (provider alternativo, threshold)
  - [x] Definir enum `ErrorCategory` (RETRIABLE, FATAL, RATE_LIMITED, TIMEOUT, NETWORK)
  - [x] Definir interface `RetryState` (attempts, lastError, totalDelay)
  - [x] Definir interface `DegradationReport` (fallbacksUsed, retriesPerStep, degradedSteps)

- [x] **Task 2:** Implementar ErrorClassifier - Categorizacao de Erros
  - [x] Criar `packages/agents/src/orchestrator/retry/error-classifier.ts`
  - [x] Implementar `classifyError(error: Error): ErrorCategory`
  - [x] Detectar erros de rate limit (429, rate_limit keywords)
  - [x] Detectar erros de timeout (timeout, ETIMEDOUT)
  - [x] Detectar erros de rede (network, ECONNREFUSED, ENOTFOUND)
  - [x] Detectar erros fatais (auth, invalid_key, quota_exceeded)
  - [x] Permitir registro de classificadores customizados
  - [x] Adicionar testes para cada categoria de erro

- [x] **Task 3:** Implementar RetryManager com Backoff Exponencial
  - [x] Criar `packages/agents/src/orchestrator/retry/retry-manager.ts`
  - [x] Implementar `calculateDelay(attempt: number, config: RetryConfig): number`
  - [x] Implementar backoff exponencial com formula: `initialDelay * (backoffFactor ^ attempt)`
  - [x] Implementar jitter opcional para evitar thundering herd
  - [x] Implementar cap de delay maximo (`maxDelay`)
  - [x] Implementar metodo `shouldRetry(error: Error, attempt: number, config: RetryConfig): boolean`
  - [x] Integrar com ErrorClassifier para decidir retry
  - [x] Preservar estado entre retries

- [x] **Task 4:** Implementar FallbackManager - Gestao de Fallbacks
  - [x] Criar `packages/agents/src/orchestrator/retry/fallback-manager.ts`
  - [x] Definir interface `ProviderHealth` (consecutiveFailures, lastFailure, isHealthy)
  - [x] Implementar tracking de falhas por provider
  - [x] Implementar `shouldFallback(provider: string, config: FallbackConfig): boolean`
  - [x] Implementar `getNextProvider(currentProvider: string): string | null`
  - [x] Implementar circuit breaker simples (open, half-open, closed)
  - [x] Emitir evento quando fallback e ativado
  - [x] Adicionar metricas de uso de fallback

- [x] **Task 5:** Criar AgentRetryConfig - Configuracao por Agente
  - [x] Criar `packages/agents/src/orchestrator/retry/agent-retry-config.ts`
  - [x] Definir configuracao default global
  - [x] Permitir override por agente
  - [x] Implementar `getConfigForAgent(agentName: string): RetryConfig & TimeoutConfig`
  - [x] Suportar configuracao via objeto ou arquivo de config
  - [x] Validar configuracao (ranges, tipos)
  - [x] Documentar configuracoes disponiveis

- [x] **Task 6:** Integrar Retry ao PipelineOrchestrator
  - [x] Modificar `packages/agents/src/orchestrator/pipeline.ts`
  - [x] Injetar RetryManager e FallbackManager no construtor
  - [x] Substituir loop de retry simples por RetryManager
  - [x] Implementar execucao com fallback quando configurado
  - [x] Preservar context entre tentativas
  - [x] Atualizar StepResult com informacoes de retry
  - [x] Emitir eventos de retry: `pipeline:step:retry`, `pipeline:step:fallback`

- [x] **Task 7:** Implementar DegradationReport
  - [x] Criar `packages/agents/src/orchestrator/retry/degradation-report.ts`
  - [x] Coletar dados durante execucao do pipeline
  - [x] Registrar cada fallback utilizado (step, from, to)
  - [x] Registrar total de retries por step
  - [x] Calcular score de degradacao (0-100)
  - [x] Incluir recomendacoes baseadas nos dados
  - [x] Adicionar ao PipelineResult

- [x] **Task 8:** Implementar Logging Estruturado de Retry
  - [x] Atualizar logging em RetryManager
  - [x] Atualizar logging em FallbackManager
  - [x] Incluir campos: `attempt`, `maxAttempts`, `delay`, `errorCategory`, `provider`
  - [x] Logar inicio de retry com contexto completo
  - [x] Logar sucesso apos retry
  - [x] Logar fallback ativado
  - [x] Logar exaustao de tentativas

- [x] **Task 9:** Criar barrel exports e factory functions
  - [x] Criar `packages/agents/src/orchestrator/retry/index.ts`
  - [x] Criar `createRetryManager(config?: Partial<RetryConfig>)`
  - [x] Criar `createFallbackManager(config?: Partial<FallbackConfig>)`
  - [x] Atualizar `packages/agents/src/orchestrator/index.ts`
  - [x] Garantir exports publicos corretos

- [x] **Task 10:** Escrever testes unitarios e de integracao
  - [x] Criar `packages/agents/src/__tests__/retry-manager.test.ts`
  - [x] Criar `packages/agents/src/__tests__/fallback-manager.test.ts`
  - [x] Criar `packages/agents/src/__tests__/error-classifier.test.ts`
  - [x] Testar backoff exponencial com diferentes configuracoes
  - [x] Testar jitter mantem delay dentro de bounds
  - [x] Testar classificacao de erros diversos
  - [x] Testar fallback apos N falhas
  - [x] Testar preservacao de estado entre retries
  - [x] Testar pipeline end-to-end com falhas simuladas
  - [x] Testar DegradationReport gerado corretamente

---

## Dev Notes

### Estrutura do Modulo de Retry

```
packages/agents/
├── src/
│   ├── orchestrator/
│   │   ├── retry/
│   │   │   ├── types.ts
│   │   │   ├── error-classifier.ts
│   │   │   ├── retry-manager.ts
│   │   │   ├── fallback-manager.ts
│   │   │   ├── agent-retry-config.ts
│   │   │   ├── degradation-report.ts
│   │   │   └── index.ts
│   │   ├── pipeline.ts (modified)
│   │   ├── types.ts (modified)
│   │   └── index.ts (modified)
│   ├── __tests__/
│   │   ├── retry-manager.test.ts
│   │   ├── fallback-manager.test.ts
│   │   ├── error-classifier.test.ts
│   │   └── pipeline-retry.integration.test.ts
│   └── index.ts
```

### Interfaces TypeScript

```typescript
// types.ts - Interfaces de Retry e Error Handling

/**
 * Categorias de erro para decisao de retry
 */
export enum ErrorCategory {
  /** Erro pode ser retentado (erros transientes) */
  RETRIABLE = 'retriable',
  /** Erro fatal, nao retentar (auth, config, etc) */
  FATAL = 'fatal',
  /** Erro de rate limit, retentar com backoff maior */
  RATE_LIMITED = 'rate_limited',
  /** Erro de timeout, pode retentar */
  TIMEOUT = 'timeout',
  /** Erro de rede, pode retentar */
  NETWORK = 'network',
}

/**
 * Configuracao de retry por agente
 */
export interface RetryConfig {
  /** Numero maximo de tentativas (default: 3) */
  maxAttempts: number;
  /** Delay inicial em ms (default: 1000) */
  initialDelay: number;
  /** Delay maximo em ms (default: 30000) */
  maxDelay: number;
  /** Fator de multiplicacao do backoff (default: 2) */
  backoffFactor: number;
  /** Adicionar jitter aleatorio ao delay (default: true) */
  jitter: boolean;
  /** Porcentagem maxima de jitter (default: 0.25 = 25%) */
  jitterFactor: number;
  /** Categorias de erro que permitem retry */
  retriableCategories: ErrorCategory[];
}

/**
 * Configuracao de timeout por agente
 */
export interface TimeoutConfig {
  /** Timeout em ms (default: 60000) */
  timeout: number;
  /** Timeout para operacoes de inicializacao */
  initTimeout?: number;
}

/**
 * Configuracao de fallback entre providers
 */
export interface FallbackConfig {
  /** Numero de falhas consecutivas antes de fallback */
  failureThreshold: number;
  /** Tempo em ms para resetar contador de falhas */
  resetTimeout: number;
  /** Lista ordenada de providers (primario primeiro) */
  providers: string[];
  /** Tentar voltar ao primario apos sucesso no fallback */
  autoRecover: boolean;
  /** Tempo minimo antes de tentar recuperar provider primario */
  recoveryDelay: number;
}

/**
 * Estado de retry durante execucao
 */
export interface RetryState {
  /** Numero atual de tentativas */
  attempts: number;
  /** Ultimo erro ocorrido */
  lastError: Error | null;
  /** Categoria do ultimo erro */
  lastErrorCategory: ErrorCategory | null;
  /** Delay total acumulado entre retries */
  totalDelay: number;
  /** Provider atual em uso */
  currentProvider: string;
  /** Se fallback foi ativado */
  fallbackActive: boolean;
  /** Timestamp da primeira tentativa */
  startedAt: Date;
}

/**
 * Saude de um provider
 */
export interface ProviderHealth {
  /** Nome do provider */
  provider: string;
  /** Numero de falhas consecutivas */
  consecutiveFailures: number;
  /** Timestamp da ultima falha */
  lastFailure: Date | null;
  /** Timestamp do ultimo sucesso */
  lastSuccess: Date | null;
  /** Se o provider esta saudavel */
  isHealthy: boolean;
  /** Estado do circuit breaker */
  circuitState: 'closed' | 'open' | 'half-open';
}

/**
 * Relatorio de degradacao do pipeline
 */
export interface DegradationReport {
  /** Se houve degradacao */
  hasDegradation: boolean;
  /** Score de degradacao (0 = nenhuma, 100 = total) */
  degradationScore: number;
  /** Fallbacks utilizados */
  fallbacksUsed: Array<{
    step: string;
    fromProvider: string;
    toProvider: string;
    timestamp: Date;
  }>;
  /** Retries por step */
  retriesPerStep: Record<string, {
    attempts: number;
    totalDelay: number;
    errors: string[];
  }>;
  /** Steps que tiveram degradacao */
  degradedSteps: string[];
  /** Recomendacoes baseadas nos dados */
  recommendations: string[];
}

/**
 * Configuracao completa de um agente
 */
export interface AgentExecutionConfig {
  name: string;
  retry: RetryConfig;
  timeout: TimeoutConfig;
  fallback?: FallbackConfig;
}

/**
 * Evento de retry emitido pelo pipeline
 */
export interface RetryEvent {
  pipelineId: string;
  stepName: string;
  attempt: number;
  maxAttempts: number;
  delay: number;
  error: string;
  errorCategory: ErrorCategory;
  timestamp: Date;
}

/**
 * Evento de fallback emitido pelo pipeline
 */
export interface FallbackEvent {
  pipelineId: string;
  stepName: string;
  fromProvider: string;
  toProvider: string;
  reason: string;
  timestamp: Date;
}
```

### ErrorClassifier - Categorizacao de Erros

```typescript
// error-classifier.ts

import { ErrorCategory } from './types';

/**
 * Padroes de erro para cada categoria
 */
const ERROR_PATTERNS: Record<ErrorCategory, RegExp[]> = {
  [ErrorCategory.RATE_LIMITED]: [
    /rate.?limit/i,
    /too.?many.?requests/i,
    /429/,
    /quota.?exceeded/i,
    /throttl/i,
  ],
  [ErrorCategory.TIMEOUT]: [
    /timeout/i,
    /ETIMEDOUT/,
    /ESOCKETTIMEDOUT/,
    /timed?.?out/i,
  ],
  [ErrorCategory.NETWORK]: [
    /ECONNREFUSED/,
    /ENOTFOUND/,
    /ECONNRESET/,
    /ENETUNREACH/,
    /network/i,
    /socket.?hang.?up/i,
    /EPIPE/,
  ],
  [ErrorCategory.FATAL]: [
    /auth/i,
    /unauthorized/i,
    /forbidden/i,
    /invalid.?key/i,
    /invalid.?token/i,
    /not.?found/i,
    /404/,
    /403/,
    /401/,
    /invalid.?config/i,
    /missing.?required/i,
  ],
  [ErrorCategory.RETRIABLE]: [], // Default for unmatched errors
};

/**
 * Classificadores customizados registrados
 */
const customClassifiers: Array<(error: Error) => ErrorCategory | null> = [];

/**
 * Classifica um erro em uma categoria
 */
export function classifyError(error: Error): ErrorCategory {
  const errorString = `${error.name} ${error.message} ${(error as any).code || ''}`;

  // Tenta classificadores customizados primeiro
  for (const classifier of customClassifiers) {
    const category = classifier(error);
    if (category !== null) {
      return category;
    }
  }

  // Verifica padroes predefinidos
  for (const [category, patterns] of Object.entries(ERROR_PATTERNS)) {
    if (category === ErrorCategory.RETRIABLE) continue; // Skip default

    for (const pattern of patterns as RegExp[]) {
      if (pattern.test(errorString)) {
        return category as ErrorCategory;
      }
    }
  }

  // Default: erros desconhecidos sao retriable
  return ErrorCategory.RETRIABLE;
}

/**
 * Verifica se uma categoria de erro permite retry
 */
export function isRetriable(
  category: ErrorCategory,
  retriableCategories: ErrorCategory[] = [
    ErrorCategory.RETRIABLE,
    ErrorCategory.TIMEOUT,
    ErrorCategory.NETWORK,
    ErrorCategory.RATE_LIMITED,
  ]
): boolean {
  return retriableCategories.includes(category);
}

/**
 * Registra um classificador customizado
 * Classificadores customizados tem prioridade sobre padroes predefinidos
 */
export function registerClassifier(
  classifier: (error: Error) => ErrorCategory | null
): () => void {
  customClassifiers.push(classifier);

  // Retorna funcao para remover o classificador
  return () => {
    const index = customClassifiers.indexOf(classifier);
    if (index > -1) {
      customClassifiers.splice(index, 1);
    }
  };
}

/**
 * Limpa todos os classificadores customizados
 */
export function clearCustomClassifiers(): void {
  customClassifiers.length = 0;
}

/**
 * Retorna descricao legivel da categoria
 */
export function getCategoryDescription(category: ErrorCategory): string {
  const descriptions: Record<ErrorCategory, string> = {
    [ErrorCategory.RETRIABLE]: 'Transient error, can be retried',
    [ErrorCategory.FATAL]: 'Fatal error, should not retry',
    [ErrorCategory.RATE_LIMITED]: 'Rate limit exceeded, retry with longer delay',
    [ErrorCategory.TIMEOUT]: 'Operation timed out, can be retried',
    [ErrorCategory.NETWORK]: 'Network error, can be retried',
  };
  return descriptions[category];
}
```

### RetryManager - Gestao de Retry com Backoff

```typescript
// retry-manager.ts

import { createLogger } from '@social-content/shared';
import {
  ErrorCategory,
  RetryConfig,
  RetryState,
} from './types';
import { classifyError, isRetriable } from './error-classifier';

const logger = createLogger('orchestrator:retry-manager');

/**
 * Configuracao padrao de retry
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitter: true,
  jitterFactor: 0.25,
  retriableCategories: [
    ErrorCategory.RETRIABLE,
    ErrorCategory.TIMEOUT,
    ErrorCategory.NETWORK,
    ErrorCategory.RATE_LIMITED,
  ],
};

/**
 * Gerenciador de retry com backoff exponencial
 */
export class RetryManager {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * Calcula o delay para a proxima tentativa
   * Formula: initialDelay * (backoffFactor ^ attempt) + jitter
   */
  calculateDelay(attempt: number): number {
    const baseDelay = this.config.initialDelay *
      Math.pow(this.config.backoffFactor, attempt - 1);

    let delay = Math.min(baseDelay, this.config.maxDelay);

    // Aplica jitter se configurado
    if (this.config.jitter) {
      const jitterRange = delay * this.config.jitterFactor;
      const jitter = Math.random() * jitterRange * 2 - jitterRange;
      delay = Math.max(0, delay + jitter);
    }

    return Math.round(delay);
  }

  /**
   * Verifica se deve retentar apos um erro
   */
  shouldRetry(error: Error, attempt: number): boolean {
    // Verifica se ainda tem tentativas
    if (attempt >= this.config.maxAttempts) {
      logger.debug('Max attempts reached', {
        attempt,
        maxAttempts: this.config.maxAttempts,
      });
      return false;
    }

    // Classifica o erro
    const category = classifyError(error);

    // Verifica se a categoria permite retry
    const canRetry = isRetriable(category, this.config.retriableCategories);

    logger.debug('Retry decision', {
      attempt,
      category,
      canRetry,
      errorMessage: error.message,
    });

    return canRetry;
  }

  /**
   * Cria estado inicial de retry
   */
  createInitialState(provider: string): RetryState {
    return {
      attempts: 0,
      lastError: null,
      lastErrorCategory: null,
      totalDelay: 0,
      currentProvider: provider,
      fallbackActive: false,
      startedAt: new Date(),
    };
  }

  /**
   * Atualiza estado apos uma tentativa falha
   */
  updateStateAfterFailure(
    state: RetryState,
    error: Error,
    delay: number
  ): RetryState {
    return {
      ...state,
      attempts: state.attempts + 1,
      lastError: error,
      lastErrorCategory: classifyError(error),
      totalDelay: state.totalDelay + delay,
    };
  }

  /**
   * Executa uma funcao com retry automatico
   */
  async execute<T>(
    fn: () => Promise<T>,
    options: {
      onRetry?: (state: RetryState, delay: number) => void;
      initialProvider?: string;
    } = {}
  ): Promise<{ result: T; state: RetryState }> {
    let state = this.createInitialState(options.initialProvider ?? 'default');

    while (true) {
      try {
        state = { ...state, attempts: state.attempts + 1 };
        const result = await fn();

        logger.info('Execution succeeded', {
          attempts: state.attempts,
          totalDelay: state.totalDelay,
        });

        return { result, state };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        const category = classifyError(err);

        logger.warn('Execution failed', {
          attempt: state.attempts,
          error: err.message,
          category,
        });

        if (!this.shouldRetry(err, state.attempts)) {
          throw err;
        }

        const delay = this.calculateDelay(state.attempts);
        state = this.updateStateAfterFailure(state, err, delay);

        if (options.onRetry) {
          options.onRetry(state, delay);
        }

        logger.info('Retrying after delay', {
          attempt: state.attempts + 1,
          delay,
          totalDelay: state.totalDelay,
        });

        await this.sleep(delay);
      }
    }
  }

  /**
   * Funcao de sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retorna a configuracao atual
   */
  getConfig(): RetryConfig {
    return { ...this.config };
  }

  /**
   * Atualiza a configuracao
   */
  updateConfig(config: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Cria uma instancia de RetryManager
 */
export function createRetryManager(
  config?: Partial<RetryConfig>
): RetryManager {
  return new RetryManager(config);
}
```

### FallbackManager - Gestao de Fallbacks

```typescript
// fallback-manager.ts

import { EventEmitter } from 'events';
import { createLogger } from '@social-content/shared';
import { FallbackConfig, ProviderHealth } from './types';

const logger = createLogger('orchestrator:fallback-manager');

/**
 * Configuracao padrao de fallback
 */
export const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  failureThreshold: 3,
  resetTimeout: 60000, // 1 minuto
  providers: [],
  autoRecover: true,
  recoveryDelay: 30000, // 30 segundos
};

/**
 * Gerenciador de fallback entre providers
 */
export class FallbackManager extends EventEmitter {
  private config: FallbackConfig;
  private healthMap: Map<string, ProviderHealth> = new Map();
  private currentProviderIndex: number = 0;

  constructor(config: Partial<FallbackConfig> = {}) {
    super();
    this.config = { ...DEFAULT_FALLBACK_CONFIG, ...config };
    this.initializeHealthMap();
  }

  /**
   * Inicializa o mapa de saude dos providers
   */
  private initializeHealthMap(): void {
    for (const provider of this.config.providers) {
      this.healthMap.set(provider, {
        provider,
        consecutiveFailures: 0,
        lastFailure: null,
        lastSuccess: null,
        isHealthy: true,
        circuitState: 'closed',
      });
    }
  }

  /**
   * Registra uma falha para um provider
   */
  recordFailure(provider: string): void {
    const health = this.healthMap.get(provider);
    if (!health) return;

    health.consecutiveFailures++;
    health.lastFailure = new Date();

    // Verifica se deve abrir o circuit breaker
    if (health.consecutiveFailures >= this.config.failureThreshold) {
      health.isHealthy = false;
      health.circuitState = 'open';

      logger.warn('Provider marked unhealthy', {
        provider,
        consecutiveFailures: health.consecutiveFailures,
      });

      this.emit('provider:unhealthy', { provider, health: { ...health } });

      // Agenda tentativa de recuperacao
      if (this.config.autoRecover) {
        this.scheduleRecoveryAttempt(provider);
      }
    }

    this.healthMap.set(provider, health);
  }

  /**
   * Registra sucesso para um provider
   */
  recordSuccess(provider: string): void {
    const health = this.healthMap.get(provider);
    if (!health) return;

    const wasUnhealthy = !health.isHealthy;

    health.consecutiveFailures = 0;
    health.lastSuccess = new Date();
    health.isHealthy = true;
    health.circuitState = 'closed';

    this.healthMap.set(provider, health);

    if (wasUnhealthy) {
      logger.info('Provider recovered', { provider });
      this.emit('provider:recovered', { provider, health: { ...health } });
    }
  }

  /**
   * Verifica se deve fazer fallback
   */
  shouldFallback(provider: string): boolean {
    const health = this.healthMap.get(provider);
    return health ? !health.isHealthy : false;
  }

  /**
   * Obtem o proximo provider disponivel
   */
  getNextProvider(currentProvider: string): string | null {
    const currentIndex = this.config.providers.indexOf(currentProvider);
    if (currentIndex === -1) return null;

    // Procura o proximo provider saudavel
    for (let i = 1; i < this.config.providers.length; i++) {
      const nextIndex = (currentIndex + i) % this.config.providers.length;
      const nextProvider = this.config.providers[nextIndex];
      const health = this.healthMap.get(nextProvider!);

      if (health?.isHealthy) {
        logger.info('Falling back to next provider', {
          from: currentProvider,
          to: nextProvider,
        });

        this.emit('fallback:activated', {
          from: currentProvider,
          to: nextProvider,
        });

        return nextProvider!;
      }
    }

    logger.error('No healthy providers available');
    return null;
  }

  /**
   * Obtem o provider primario (primeiro da lista)
   */
  getPrimaryProvider(): string | null {
    return this.config.providers[0] ?? null;
  }

  /**
   * Obtem o melhor provider disponivel
   */
  getBestAvailableProvider(): string | null {
    for (const provider of this.config.providers) {
      const health = this.healthMap.get(provider);
      if (health?.isHealthy) {
        return provider;
      }
    }
    return this.config.providers[0] ?? null;
  }

  /**
   * Agenda tentativa de recuperacao para um provider
   */
  private scheduleRecoveryAttempt(provider: string): void {
    setTimeout(() => {
      const health = this.healthMap.get(provider);
      if (health && !health.isHealthy) {
        health.circuitState = 'half-open';
        this.healthMap.set(provider, health);

        logger.info('Provider entering half-open state', { provider });
        this.emit('provider:half-open', { provider });
      }
    }, this.config.recoveryDelay);
  }

  /**
   * Obtem a saude de um provider
   */
  getProviderHealth(provider: string): ProviderHealth | undefined {
    return this.healthMap.get(provider);
  }

  /**
   * Obtem a saude de todos os providers
   */
  getAllProviderHealth(): ProviderHealth[] {
    return Array.from(this.healthMap.values());
  }

  /**
   * Reseta a saude de um provider
   */
  resetProvider(provider: string): void {
    const health = this.healthMap.get(provider);
    if (health) {
      health.consecutiveFailures = 0;
      health.isHealthy = true;
      health.circuitState = 'closed';
      this.healthMap.set(provider, health);
    }
  }

  /**
   * Reseta todos os providers
   */
  resetAll(): void {
    for (const provider of this.config.providers) {
      this.resetProvider(provider);
    }
    this.currentProviderIndex = 0;
  }
}

/**
 * Cria uma instancia de FallbackManager
 */
export function createFallbackManager(
  config?: Partial<FallbackConfig>
): FallbackManager {
  return new FallbackManager(config);
}
```

### DegradationReport - Relatorio de Degradacao

```typescript
// degradation-report.ts

import { DegradationReport, RetryState } from './types';

/**
 * Builder para criar DegradationReport
 */
export class DegradationReportBuilder {
  private fallbacksUsed: DegradationReport['fallbacksUsed'] = [];
  private retriesPerStep: DegradationReport['retriesPerStep'] = {};

  /**
   * Registra uso de fallback
   */
  recordFallback(
    step: string,
    fromProvider: string,
    toProvider: string
  ): void {
    this.fallbacksUsed.push({
      step,
      fromProvider,
      toProvider,
      timestamp: new Date(),
    });
  }

  /**
   * Registra estado de retry para um step
   */
  recordRetryState(step: string, state: RetryState): void {
    this.retriesPerStep[step] = {
      attempts: state.attempts,
      totalDelay: state.totalDelay,
      errors: state.lastError ? [state.lastError.message] : [],
    };
  }

  /**
   * Adiciona erro a um step existente
   */
  addError(step: string, error: string): void {
    if (!this.retriesPerStep[step]) {
      this.retriesPerStep[step] = {
        attempts: 0,
        totalDelay: 0,
        errors: [],
      };
    }
    this.retriesPerStep[step].errors.push(error);
  }

  /**
   * Constroi o relatorio final
   */
  build(): DegradationReport {
    const degradedSteps = [
      ...new Set([
        ...this.fallbacksUsed.map(f => f.step),
        ...Object.entries(this.retriesPerStep)
          .filter(([_, data]) => data.attempts > 1)
          .map(([step]) => step),
      ]),
    ];

    const hasDegradation = degradedSteps.length > 0;

    // Calcula score de degradacao (0-100)
    const degradationScore = this.calculateDegradationScore();

    // Gera recomendacoes
    const recommendations = this.generateRecommendations();

    return {
      hasDegradation,
      degradationScore,
      fallbacksUsed: this.fallbacksUsed,
      retriesPerStep: this.retriesPerStep,
      degradedSteps,
      recommendations,
    };
  }

  /**
   * Calcula score de degradacao baseado nos dados
   */
  private calculateDegradationScore(): number {
    let score = 0;

    // Cada fallback adiciona 20 pontos
    score += this.fallbacksUsed.length * 20;

    // Cada retry adiciona pontos baseado no numero de tentativas
    for (const data of Object.values(this.retriesPerStep)) {
      score += (data.attempts - 1) * 5; // -1 porque a primeira nao e retry
    }

    return Math.min(100, score);
  }

  /**
   * Gera recomendacoes baseadas nos dados
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Analisa fallbacks
    if (this.fallbacksUsed.length > 0) {
      const uniqueProviders = new Set(
        this.fallbacksUsed.map(f => f.fromProvider)
      );
      for (const provider of uniqueProviders) {
        recommendations.push(
          `Provider "${provider}" apresentou instabilidade. Verifique status e limites.`
        );
      }
    }

    // Analisa retries
    const highRetrySteps = Object.entries(this.retriesPerStep)
      .filter(([_, data]) => data.attempts >= 3)
      .map(([step]) => step);

    if (highRetrySteps.length > 0) {
      recommendations.push(
        `Steps com muitos retries: ${highRetrySteps.join(', ')}. ` +
        `Considere aumentar timeouts ou investigar a causa.`
      );
    }

    // Analisa delays acumulados
    const totalDelay = Object.values(this.retriesPerStep)
      .reduce((sum, data) => sum + data.totalDelay, 0);

    if (totalDelay > 30000) {
      recommendations.push(
        `Delay total de ${Math.round(totalDelay / 1000)}s acumulado em retries. ` +
        `Pipeline pode estar mais lento que o normal.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Nenhuma recomendacao - pipeline executou normalmente.');
    }

    return recommendations;
  }
}

/**
 * Cria uma nova instancia do builder
 */
export function createDegradationReportBuilder(): DegradationReportBuilder {
  return new DegradationReportBuilder();
}
```

### Integracao com Pipeline

```typescript
// Modificacoes em pipeline.ts

import { RetryManager, createRetryManager } from './retry/retry-manager';
import { FallbackManager, createFallbackManager } from './retry/fallback-manager';
import { DegradationReportBuilder, createDegradationReportBuilder } from './retry/degradation-report';
import { AgentExecutionConfig, DegradationReport, RetryEvent, FallbackEvent } from './retry/types';

// Adicionar ao PipelineResult
export interface PipelineResult {
  // ... campos existentes ...
  degradationReport: DegradationReport;
}

// Adicionar eventos ao PipelineEvents
export interface PipelineEvents {
  // ... eventos existentes ...
  'pipeline:step:retry': RetryEvent;
  'pipeline:step:fallback': FallbackEvent;
}

// No construtor do PipelineOrchestrator
constructor(
  config: PipelineConfig,
  options?: {
    retryManager?: RetryManager;
    fallbackManager?: FallbackManager;
    agentConfigs?: Map<string, AgentExecutionConfig>;
  }
) {
  super();
  this.config = config;
  this.retryManager = options?.retryManager ?? createRetryManager();
  this.fallbackManager = options?.fallbackManager ?? createFallbackManager();
  this.agentConfigs = options?.agentConfigs ?? new Map();
}

// Modificar executeStep para usar RetryManager
private async executeStep(
  step: PipelineStep,
  input: unknown,
  context: PipelineContext,
  options: PipelineRunOptions,
  reportBuilder: DegradationReportBuilder
): Promise<StepResult> {
  const agentConfig = this.agentConfigs.get(step.name);
  const timeout = agentConfig?.timeout.timeout ?? step.timeout ?? this.defaultTimeout;

  const { result, state } = await this.retryManager.execute(
    () => this.executeWithTimeout(step.agent.run(input), timeout, step.name, options.abortSignal),
    {
      initialProvider: this.fallbackManager.getBestAvailableProvider() ?? 'default',
      onRetry: (retryState, delay) => {
        this.emit('pipeline:step:retry', {
          pipelineId: context.pipelineId,
          stepName: step.name,
          attempt: retryState.attempts,
          maxAttempts: this.retryManager.getConfig().maxAttempts,
          delay,
          error: retryState.lastError?.message ?? 'Unknown error',
          errorCategory: retryState.lastErrorCategory!,
          timestamp: new Date(),
        });
      },
    }
  );

  // Registra estado de retry no report
  reportBuilder.recordRetryState(step.name, state);

  // ... resto da implementacao ...
}
```

---

## Testing

### Testes do ErrorClassifier

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  classifyError,
  isRetriable,
  registerClassifier,
  clearCustomClassifiers,
} from '../orchestrator/retry/error-classifier';
import { ErrorCategory } from '../orchestrator/retry/types';

describe('ErrorClassifier', () => {
  afterEach(() => {
    clearCustomClassifiers();
  });

  describe('classifyError', () => {
    it('should classify rate limit errors', () => {
      const errors = [
        new Error('Rate limit exceeded'),
        new Error('Too many requests'),
        new Error('API returned 429'),
        new Error('Quota exceeded for today'),
      ];

      for (const error of errors) {
        expect(classifyError(error)).toBe(ErrorCategory.RATE_LIMITED);
      }
    });

    it('should classify timeout errors', () => {
      const errors = [
        new Error('Request timeout'),
        new Error('ETIMEDOUT'),
        new Error('Operation timed out'),
      ];

      for (const error of errors) {
        expect(classifyError(error)).toBe(ErrorCategory.TIMEOUT);
      }
    });

    it('should classify network errors', () => {
      const errors = [
        new Error('ECONNREFUSED'),
        new Error('ENOTFOUND'),
        new Error('Network error'),
        new Error('socket hang up'),
      ];

      for (const error of errors) {
        expect(classifyError(error)).toBe(ErrorCategory.NETWORK);
      }
    });

    it('should classify fatal errors', () => {
      const errors = [
        new Error('Authentication failed'),
        new Error('Invalid API key'),
        new Error('401 Unauthorized'),
        new Error('Resource not found'),
      ];

      for (const error of errors) {
        expect(classifyError(error)).toBe(ErrorCategory.FATAL);
      }
    });

    it('should default to RETRIABLE for unknown errors', () => {
      const error = new Error('Something went wrong');
      expect(classifyError(error)).toBe(ErrorCategory.RETRIABLE);
    });

    it('should use custom classifiers first', () => {
      const customError = new Error('Custom error type');

      registerClassifier((error) => {
        if (error.message.includes('Custom')) {
          return ErrorCategory.FATAL;
        }
        return null;
      });

      expect(classifyError(customError)).toBe(ErrorCategory.FATAL);
    });
  });

  describe('isRetriable', () => {
    it('should return true for retriable categories', () => {
      expect(isRetriable(ErrorCategory.RETRIABLE)).toBe(true);
      expect(isRetriable(ErrorCategory.TIMEOUT)).toBe(true);
      expect(isRetriable(ErrorCategory.NETWORK)).toBe(true);
      expect(isRetriable(ErrorCategory.RATE_LIMITED)).toBe(true);
    });

    it('should return false for fatal errors', () => {
      expect(isRetriable(ErrorCategory.FATAL)).toBe(false);
    });

    it('should respect custom retriable categories', () => {
      expect(
        isRetriable(ErrorCategory.TIMEOUT, [ErrorCategory.RETRIABLE])
      ).toBe(false);
    });
  });
});
```

### Testes do RetryManager

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RetryManager, DEFAULT_RETRY_CONFIG } from '../orchestrator/retry/retry-manager';
import { ErrorCategory } from '../orchestrator/retry/types';

describe('RetryManager', () => {
  let manager: RetryManager;

  beforeEach(() => {
    manager = new RetryManager();
  });

  describe('calculateDelay', () => {
    it('should calculate exponential backoff', () => {
      const noJitterManager = new RetryManager({ jitter: false });

      expect(noJitterManager.calculateDelay(1)).toBe(1000); // 1000 * 2^0
      expect(noJitterManager.calculateDelay(2)).toBe(2000); // 1000 * 2^1
      expect(noJitterManager.calculateDelay(3)).toBe(4000); // 1000 * 2^2
      expect(noJitterManager.calculateDelay(4)).toBe(8000); // 1000 * 2^3
    });

    it('should cap delay at maxDelay', () => {
      const noJitterManager = new RetryManager({
        jitter: false,
        maxDelay: 5000,
      });

      expect(noJitterManager.calculateDelay(10)).toBe(5000);
    });

    it('should add jitter when enabled', () => {
      const delays = new Set<number>();

      for (let i = 0; i < 10; i++) {
        delays.add(manager.calculateDelay(1));
      }

      // Com jitter, nem todos os delays devem ser iguais
      expect(delays.size).toBeGreaterThan(1);
    });

    it('should keep jitter within bounds', () => {
      const config = { jitter: true, jitterFactor: 0.25, initialDelay: 1000 };
      const jitterManager = new RetryManager(config);

      for (let i = 0; i < 100; i++) {
        const delay = jitterManager.calculateDelay(1);
        expect(delay).toBeGreaterThanOrEqual(750); // 1000 - 25%
        expect(delay).toBeLessThanOrEqual(1250);   // 1000 + 25%
      }
    });
  });

  describe('shouldRetry', () => {
    it('should return true for retriable errors below max attempts', () => {
      const error = new Error('Network error');
      expect(manager.shouldRetry(error, 1)).toBe(true);
      expect(manager.shouldRetry(error, 2)).toBe(true);
    });

    it('should return false when max attempts reached', () => {
      const error = new Error('Network error');
      expect(manager.shouldRetry(error, 3)).toBe(false);
    });

    it('should return false for fatal errors', () => {
      const error = new Error('Invalid API key');
      expect(manager.shouldRetry(error, 1)).toBe(false);
    });
  });

  describe('execute', () => {
    it('should succeed on first try', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const { result, state } = await manager.execute(fn);

      expect(result).toBe('success');
      expect(state.attempts).toBe(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const { result, state } = await manager.execute(fn);

      expect(result).toBe('success');
      expect(state.attempts).toBe(3);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries exhausted', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(manager.execute(fn)).rejects.toThrow('Network error');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should call onRetry callback', async () => {
      const onRetry = vi.fn();
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      await manager.execute(fn, { onRetry });

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should preserve state between retries', async () => {
      const states: number[] = [];
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      await manager.execute(fn, {
        onRetry: (state) => states.push(state.attempts),
      });

      expect(states).toEqual([1]);
    });
  });
});
```

### Testes do FallbackManager

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FallbackManager } from '../orchestrator/retry/fallback-manager';

describe('FallbackManager', () => {
  let manager: FallbackManager;

  beforeEach(() => {
    manager = new FallbackManager({
      providers: ['groq', 'gemini', 'openai'],
      failureThreshold: 3,
    });
  });

  describe('recordFailure', () => {
    it('should track consecutive failures', () => {
      manager.recordFailure('groq');
      manager.recordFailure('groq');

      const health = manager.getProviderHealth('groq');
      expect(health?.consecutiveFailures).toBe(2);
      expect(health?.isHealthy).toBe(true);
    });

    it('should mark provider unhealthy after threshold', () => {
      manager.recordFailure('groq');
      manager.recordFailure('groq');
      manager.recordFailure('groq');

      const health = manager.getProviderHealth('groq');
      expect(health?.consecutiveFailures).toBe(3);
      expect(health?.isHealthy).toBe(false);
      expect(health?.circuitState).toBe('open');
    });

    it('should emit unhealthy event', () => {
      const listener = vi.fn();
      manager.on('provider:unhealthy', listener);

      manager.recordFailure('groq');
      manager.recordFailure('groq');
      manager.recordFailure('groq');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'groq' })
      );
    });
  });

  describe('recordSuccess', () => {
    it('should reset consecutive failures', () => {
      manager.recordFailure('groq');
      manager.recordFailure('groq');
      manager.recordSuccess('groq');

      const health = manager.getProviderHealth('groq');
      expect(health?.consecutiveFailures).toBe(0);
    });

    it('should emit recovered event when unhealthy provider succeeds', () => {
      const listener = vi.fn();
      manager.on('provider:recovered', listener);

      // Tornar unhealthy
      manager.recordFailure('groq');
      manager.recordFailure('groq');
      manager.recordFailure('groq');

      // Recuperar
      manager.recordSuccess('groq');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'groq' })
      );
    });
  });

  describe('getNextProvider', () => {
    it('should return next healthy provider', () => {
      // Tornar groq unhealthy
      manager.recordFailure('groq');
      manager.recordFailure('groq');
      manager.recordFailure('groq');

      const next = manager.getNextProvider('groq');
      expect(next).toBe('gemini');
    });

    it('should return null if no healthy providers', () => {
      // Tornar todos unhealthy
      for (const provider of ['groq', 'gemini', 'openai']) {
        manager.recordFailure(provider);
        manager.recordFailure(provider);
        manager.recordFailure(provider);
      }

      const next = manager.getNextProvider('groq');
      expect(next).toBeNull();
    });

    it('should emit fallback event', () => {
      const listener = vi.fn();
      manager.on('fallback:activated', listener);

      manager.recordFailure('groq');
      manager.recordFailure('groq');
      manager.recordFailure('groq');

      manager.getNextProvider('groq');

      expect(listener).toHaveBeenCalledWith({
        from: 'groq',
        to: 'gemini',
      });
    });
  });

  describe('getBestAvailableProvider', () => {
    it('should return primary when healthy', () => {
      expect(manager.getBestAvailableProvider()).toBe('groq');
    });

    it('should return fallback when primary unhealthy', () => {
      manager.recordFailure('groq');
      manager.recordFailure('groq');
      manager.recordFailure('groq');

      expect(manager.getBestAvailableProvider()).toBe('gemini');
    });
  });
});
```

### Teste de Integracao do Pipeline

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PipelineOrchestrator } from '../orchestrator/pipeline';
import { createRetryManager } from '../orchestrator/retry/retry-manager';
import { createFallbackManager } from '../orchestrator/retry/fallback-manager';
import { PipelineStatus, StepStatus } from '../orchestrator/types';

describe('Pipeline with Retry Integration', () => {
  let orchestrator: PipelineOrchestrator;
  let retryManager = createRetryManager({ maxAttempts: 3 });
  let fallbackManager = createFallbackManager({
    providers: ['primary', 'fallback'],
    failureThreshold: 2,
  });

  beforeEach(() => {
    retryManager = createRetryManager({ maxAttempts: 3 });
    fallbackManager = createFallbackManager({
      providers: ['primary', 'fallback'],
      failureThreshold: 2,
    });
  });

  it('should retry failed steps and succeed', async () => {
    let callCount = 0;
    const mockAgent = {
      name: 'TestAgent',
      run: vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Network error');
        }
        return { success: true, data: 'result' };
      }),
    };

    orchestrator = new PipelineOrchestrator(
      {
        id: 'test',
        name: 'Test Pipeline',
        steps: [{ name: 'step1', agent: mockAgent }],
      },
      { retryManager, fallbackManager }
    );

    const result = await orchestrator.run({});

    expect(result.status).toBe(PipelineStatus.COMPLETED);
    expect(callCount).toBe(3);
  });

  it('should include degradation report', async () => {
    let callCount = 0;
    const mockAgent = {
      name: 'TestAgent',
      run: vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount < 2) {
          throw new Error('Network error');
        }
        return { success: true, data: 'result' };
      }),
    };

    orchestrator = new PipelineOrchestrator(
      {
        id: 'test',
        name: 'Test Pipeline',
        steps: [{ name: 'step1', agent: mockAgent }],
      },
      { retryManager, fallbackManager }
    );

    const result = await orchestrator.run({});

    expect(result.degradationReport).toBeDefined();
    expect(result.degradationReport.hasDegradation).toBe(true);
    expect(result.degradationReport.retriesPerStep['step1']).toBeDefined();
  });

  it('should emit retry events', async () => {
    const retryListener = vi.fn();
    let callCount = 0;

    const mockAgent = {
      name: 'TestAgent',
      run: vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount < 2) {
          throw new Error('Network error');
        }
        return { success: true, data: 'result' };
      }),
    };

    orchestrator = new PipelineOrchestrator(
      {
        id: 'test',
        name: 'Test Pipeline',
        steps: [{ name: 'step1', agent: mockAgent }],
      },
      { retryManager, fallbackManager }
    );

    orchestrator.on('pipeline:step:retry', retryListener);

    await orchestrator.run({});

    expect(retryListener).toHaveBeenCalled();
  });

  it('should fail after exhausting retries', async () => {
    const mockAgent = {
      name: 'TestAgent',
      run: vi.fn().mockRejectedValue(new Error('Persistent error')),
    };

    orchestrator = new PipelineOrchestrator(
      {
        id: 'test',
        name: 'Test Pipeline',
        steps: [{ name: 'step1', agent: mockAgent }],
      },
      { retryManager, fallbackManager }
    );

    const result = await orchestrator.run({});

    expect(result.status).toBe(PipelineStatus.FAILED);
    expect(mockAgent.run).toHaveBeenCalledTimes(3);
  });

  it('should not retry fatal errors', async () => {
    const mockAgent = {
      name: 'TestAgent',
      run: vi.fn().mockRejectedValue(new Error('Invalid API key')),
    };

    orchestrator = new PipelineOrchestrator(
      {
        id: 'test',
        name: 'Test Pipeline',
        steps: [{ name: 'step1', agent: mockAgent }],
      },
      { retryManager, fallbackManager }
    );

    const result = await orchestrator.run({});

    expect(result.status).toBe(PipelineStatus.FAILED);
    expect(mockAgent.run).toHaveBeenCalledTimes(1); // Nao retentou
  });
});
```

---

## References

- [PRD](../prd.md) - Epic 4: Qualidade & Orquestracao, Story 4.5
- [Architecture](../architecture.md) - Orchestrator Layer
- [Story 4.4](./story-4.4.md) - Orquestrador LangGraph - Setup Base (dependencia)
- [Shared Retry Utility](../../packages/shared/src/utils/retry.ts) - Utility existente de retry
- [Orchestrator Pipeline](../../packages/agents/src/orchestrator/pipeline.ts) - Implementacao existente do orquestrador

---

## Dev Agent Record

### File List

| Status | File | Changes |
|--------|------|---------|
| Created | packages/agents/src/orchestrator/retry/types.ts | TypeScript interfaces and enums for retry/error handling |
| Created | packages/agents/src/orchestrator/retry/error-classifier.ts | Error classification with pattern matching and custom classifiers |
| Created | packages/agents/src/orchestrator/retry/retry-manager.ts | RetryManager with exponential backoff and jitter |
| Created | packages/agents/src/orchestrator/retry/fallback-manager.ts | FallbackManager with circuit breaker pattern |
| Created | packages/agents/src/orchestrator/retry/agent-retry-config.ts | Per-agent configuration with presets |
| Created | packages/agents/src/orchestrator/retry/degradation-report.ts | DegradationReportBuilder with scoring and recommendations |
| Created | packages/agents/src/orchestrator/retry/index.ts | Barrel exports for retry module |
| Modified | packages/agents/src/orchestrator/pipeline.ts | Integrated RetryManager and FallbackManager, added DegradationReport |
| Modified | packages/agents/src/orchestrator/index.ts | Added exports for retry module |
| Created | packages/agents/src/__tests__/error-classifier.test.ts | Unit tests for error classification |
| Created | packages/agents/src/__tests__/retry-manager.test.ts | Unit tests for RetryManager |
| Created | packages/agents/src/__tests__/fallback-manager.test.ts | Unit tests for FallbackManager |
| Created | packages/agents/src/__tests__/pipeline-retry.integration.test.ts | Integration tests for pipeline retry |

### Debug Log

- Fixed test failures due to attempt counting in updateStateAfterFailure (was double-incrementing)
- Fixed DNS error classification test (ENOTFOUND contains "not found" which matched FATAL pattern)
- Fixed lint errors: removed unused imports, added eslint-disable for while(true)

### Completion Notes

All 10 tasks completed successfully:
- 121 tests passing (all retry module tests)
- Lint clean for all retry module files
- TypeScript compilation successful
- All acceptance criteria met (AC1-AC9)

Key features implemented:
- Configurable retry with exponential backoff and jitter (AC1, AC2)
- FallbackManager with circuit breaker pattern (AC3)
- ErrorClassifier with 5 categories (AC4)
- RetryState preservation between attempts (AC5)
- Per-agent timeout configuration (AC6)
- Structured logging in all components (AC7)
- DegradationReport with scoring and recommendations (AC8)
- Comprehensive test suite with failure simulation (AC9)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story criada | Claude (Dev Agent) |
| 2026-01-28 | Implemented all 10 tasks, all tests passing | Claude (Dev Agent) |
| 2026-01-28 | QA Review completed - PASS | Quinn (QA Agent) |

---

## QA Results

### Gate Decision: PASS

The Story 4.5 implementation has been thoroughly reviewed and meets all acceptance criteria. The retry and error handling module is well-designed, properly tested, and correctly integrated with the pipeline orchestrator.

---

### Test Results Summary

| Metric | Result |
|--------|--------|
| Test Files | 4 passed |
| Total Tests | 121 passed |
| Test Duration | 13.68s |
| Lint (retry module) | PASS (0 errors, 0 warnings) |
| TypeCheck | PASS |

**Test Breakdown:**
- `error-classifier.test.ts`: 40 tests passed
- `retry-manager.test.ts`: 30 tests passed
- `fallback-manager.test.ts`: 37 tests passed
- `pipeline-retry.integration.test.ts`: 14 tests passed

**Note:** The global lint has 32 errors and 2 warnings, but these are in files outside the scope of Story 4.5 (e.g., `langgraph/*.ts`, `qa-analyst/*.ts`, `pipelines/full.ts`). All retry module files are lint-clean.

---

### Acceptance Criteria Verification

| AC# | Criterion | Status | Evidence |
|-----|-----------|--------|----------|
| AC1 | Retry automatico configuravel por agente (default: 3 tentativas) | PASS | `RetryConfig` interface with `maxAttempts` (default: 3), `AgentRetryConfigManager` provides per-agent overrides |
| AC2 | Backoff exponencial entre tentativas | PASS | `calculateDelay()` implements formula `initialDelay * (backoffFactor ^ attempt)` with optional jitter (default 25%) |
| AC3 | Fallback para provider alternativo apos N falhas | PASS | `FallbackManager` tracks consecutive failures, `shouldFallback()` and `getNextProvider()` handle fallback logic |
| AC4 | Erros categorizados: retriable vs fatal | PASS | `ErrorCategory` enum with 5 categories (RETRIABLE, FATAL, RATE_LIMITED, TIMEOUT, NETWORK), `classifyError()` function with pattern matching |
| AC5 | State preservado entre retries | PASS | `RetryState` interface tracks attempts, lastError, totalDelay; state preserved across retry iterations in `execute()` |
| AC6 | Timeout configuravel por agente | PASS | `TimeoutConfig` interface with `timeout` and `initTimeout`, configurable per agent via `AgentRetryConfigManager` |
| AC7 | Log detalhado de erros e tentativas | PASS | Structured logging in RetryManager, FallbackManager, DegradationReportBuilder with fields: attempt, delay, errorCategory, provider |
| AC8 | Notificacao ao final se houve degradacao (fallback usado) | PASS | `DegradationReport` included in `PipelineResult`, includes score (0-100), recommendations, degradedSteps list |
| AC9 | Testes simulando falhas e validando recovery | PASS | Integration tests simulate network errors, fatal errors, retry exhaustion, abort signals, multi-step pipelines |

---

### Code Quality Review

**Strengths:**

1. **Well-structured architecture**: Clean separation of concerns with dedicated modules for error classification, retry management, fallback handling, and degradation reporting.

2. **Comprehensive TypeScript typing**: All interfaces are properly typed with JSDoc documentation explaining each field.

3. **Extensibility**: Custom error classifiers can be registered via `registerClassifier()`, configuration presets available (`FAST_FAIL`, `PATIENT`, `LLM_API`, `IMAGE_GENERATION`).

4. **Circuit breaker pattern**: FallbackManager implements proper circuit breaker states (closed, open, half-open) with auto-recovery.

5. **Configuration validation**: `AgentRetryConfigManager` validates all configuration values with descriptive error messages.

6. **Factory functions**: All major classes have corresponding factory functions (`createRetryManager`, `createFallbackManager`, etc.).

7. **Resource cleanup**: Both `RetryManager` and `FallbackManager` have `dispose()` methods for proper cleanup.

8. **Abort signal support**: RetryManager respects `AbortSignal` for cancellation during retry delays.

**Minor Observations:**

1. The `eslint-disable no-constant-condition` comment in retry-manager.ts is appropriately used for the `while(true)` retry loop.

2. Jitter implementation correctly bounds values between 0 and the calculated maximum.

3. DegradationReport scoring algorithm is reasonable (fallbacks = 25 points, extra attempts = 5 points each).

---

### Files Reviewed

| File | Lines | Status |
|------|-------|--------|
| `packages/agents/src/orchestrator/retry/types.ts` | 250 | Clean, well-documented interfaces |
| `packages/agents/src/orchestrator/retry/error-classifier.ts` | 294 | Comprehensive error pattern matching |
| `packages/agents/src/orchestrator/retry/retry-manager.ts` | 364 | Proper backoff implementation |
| `packages/agents/src/orchestrator/retry/fallback-manager.ts` | 464 | Full circuit breaker implementation |
| `packages/agents/src/orchestrator/retry/agent-retry-config.ts` | 532 | Validation and presets |
| `packages/agents/src/orchestrator/retry/degradation-report.ts` | 446 | Score calculation and recommendations |
| `packages/agents/src/orchestrator/retry/index.ts` | 78 | Complete barrel exports |
| `packages/agents/src/orchestrator/pipeline.ts` | Modified | Proper integration |
| `packages/agents/src/orchestrator/index.ts` | Modified | Re-exports retry module |

---

### Recommendations

1. **Consider adding circuit breaker metrics**: Track open/close transitions over time for observability.

2. **Future enhancement**: Consider adding Prometheus-style metrics export for production monitoring.

3. **Documentation**: The inline JSDoc is excellent; consider adding a README.md for the retry module if standalone documentation is needed.

---

### QA Reviewer

**Quinn (QA Agent)**
**Date:** 2026-01-28
