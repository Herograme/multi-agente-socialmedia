/**
 * Degradation Report
 * Collects and reports on degradation during pipeline execution
 * Story 4.5: Orquestrador - Retry e Error Handling
 */

import { createLogger } from '@social-content/shared';
import {
  DegradationReport,
  FallbackRecord,
  StepRetryRecord,
  RetryState,
} from './types';

const logger = createLogger('orchestrator:degradation-report');

/**
 * Default empty degradation report
 */
export const EMPTY_DEGRADATION_REPORT: DegradationReport = {
  hasDegradation: false,
  degradationScore: 0,
  fallbacksUsed: [],
  retriesPerStep: {},
  degradedSteps: [],
  recommendations: [],
};

/**
 * Builder class for creating DegradationReport
 * Collects data during pipeline execution and builds the final report
 */
export class DegradationReportBuilder {
  private fallbacksUsed: FallbackRecord[] = [];
  private retriesPerStep: Record<string, StepRetryRecord> = {};
  private pipelineId: string;

  constructor(pipelineId: string) {
    this.pipelineId = pipelineId;
  }

  /**
   * Record when a fallback is activated
   *
   * @param step - Step name where fallback occurred
   * @param fromProvider - Provider that failed
   * @param toProvider - Provider being used as fallback
   */
  recordFallback(step: string, fromProvider: string, toProvider: string): void {
    this.fallbacksUsed.push({
      step,
      fromProvider,
      toProvider,
      timestamp: new Date(),
    });

    logger.debug('Fallback recorded', {
      pipelineId: this.pipelineId,
      step,
      fromProvider,
      toProvider,
    });
  }

  /**
   * Record the retry state for a completed step
   *
   * @param step - Step name
   * @param state - Final retry state
   */
  recordRetryState(step: string, state: RetryState): void {
    const existing = this.retriesPerStep[step];

    this.retriesPerStep[step] = {
      attempts: state.attempts,
      totalDelay: state.totalDelay,
      errors: existing?.errors ?? [],
    };

    // Add the last error if present
    if (state.lastError) {
      this.addError(step, state.lastError.message);
    }

    logger.debug('Retry state recorded', {
      pipelineId: this.pipelineId,
      step,
      attempts: state.attempts,
      totalDelay: state.totalDelay,
    });
  }

  /**
   * Add an error message to a step's record
   *
   * @param step - Step name
   * @param error - Error message
   */
  addError(step: string, error: string): void {
    if (!this.retriesPerStep[step]) {
      this.retriesPerStep[step] = {
        attempts: 0,
        totalDelay: 0,
        errors: [],
      };
    }

    // Avoid duplicate errors
    if (!this.retriesPerStep[step].errors.includes(error)) {
      this.retriesPerStep[step].errors.push(error);
    }
  }

  /**
   * Record a successful step with no retries
   *
   * @param step - Step name
   */
  recordSuccessfulStep(step: string): void {
    if (!this.retriesPerStep[step]) {
      this.retriesPerStep[step] = {
        attempts: 1,
        totalDelay: 0,
        errors: [],
      };
    }
  }

  /**
   * Build the final degradation report
   */
  build(): DegradationReport {
    // Determine degraded steps
    const degradedSteps = this.calculateDegradedSteps();

    // Calculate degradation score
    const degradationScore = this.calculateDegradationScore();

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    const report: DegradationReport = {
      hasDegradation: degradedSteps.length > 0,
      degradationScore,
      fallbacksUsed: [...this.fallbacksUsed],
      retriesPerStep: { ...this.retriesPerStep },
      degradedSteps,
      recommendations,
    };

    logger.info('Degradation report built', {
      pipelineId: this.pipelineId,
      hasDegradation: report.hasDegradation,
      degradationScore,
      degradedStepCount: degradedSteps.length,
      fallbackCount: this.fallbacksUsed.length,
    });

    return report;
  }

  /**
   * Calculate which steps experienced degradation
   */
  private calculateDegradedSteps(): string[] {
    const degraded = new Set<string>();

    // Steps where fallback was used
    for (const fallback of this.fallbacksUsed) {
      degraded.add(fallback.step);
    }

    // Steps with multiple retry attempts
    for (const [step, record] of Object.entries(this.retriesPerStep)) {
      if (record.attempts > 1 || record.errors.length > 0) {
        degraded.add(step);
      }
    }

    return Array.from(degraded).sort();
  }

  /**
   * Calculate a degradation score (0-100)
   * Higher score means more degradation
   */
  private calculateDegradationScore(): number {
    let score = 0;

    // Each fallback adds significant degradation
    score += this.fallbacksUsed.length * 25;

    // Retries add degradation proportional to attempts
    for (const record of Object.values(this.retriesPerStep)) {
      // Extra attempts beyond the first add to degradation
      const extraAttempts = Math.max(0, record.attempts - 1);
      score += extraAttempts * 5;

      // Errors add degradation
      score += record.errors.length * 3;
    }

    // Calculate delay-based degradation
    const totalDelay = Object.values(this.retriesPerStep).reduce(
      (sum, record) => sum + record.totalDelay,
      0
    );

    // Every 10 seconds of delay adds 5 points
    score += Math.floor(totalDelay / 10000) * 5;

    // Cap at 100
    return Math.min(100, Math.round(score));
  }

  /**
   * Generate recommendations based on collected data
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Analyze fallback patterns
    if (this.fallbacksUsed.length > 0) {
      const failedProviders = new Map<string, number>();

      for (const fallback of this.fallbacksUsed) {
        const count = failedProviders.get(fallback.fromProvider) ?? 0;
        failedProviders.set(fallback.fromProvider, count + 1);
      }

      for (const [provider, count] of failedProviders) {
        if (count > 1) {
          recommendations.push(
            `Provider "${provider}" failed ${count} times. Consider reviewing its health or rate limits.`
          );
        } else {
          recommendations.push(
            `Provider "${provider}" required fallback. Check for transient issues or capacity.`
          );
        }
      }
    }

    // Analyze retry patterns
    const highRetrySteps: string[] = [];
    const errorPatterns = new Map<string, number>();

    for (const [step, record] of Object.entries(this.retriesPerStep)) {
      if (record.attempts >= 3) {
        highRetrySteps.push(step);
      }

      // Collect error patterns
      for (const error of record.errors) {
        // Extract key patterns
        const patterns = [
          error.includes('timeout') ? 'timeout' : null,
          error.includes('rate') || error.includes('limit') ? 'rate_limit' : null,
          error.includes('network') || error.includes('ECONN') ? 'network' : null,
        ].filter(Boolean) as string[];

        for (const pattern of patterns) {
          const count = errorPatterns.get(pattern) ?? 0;
          errorPatterns.set(pattern, count + 1);
        }
      }
    }

    if (highRetrySteps.length > 0) {
      recommendations.push(
        `Steps with high retry count: ${highRetrySteps.join(', ')}. ` +
          'Consider increasing timeouts or investigating root cause.'
      );
    }

    // Pattern-specific recommendations
    const timeoutCount = errorPatterns.get('timeout') ?? 0;
    if (timeoutCount >= 2) {
      recommendations.push(
        `${timeoutCount} timeout errors occurred. Consider increasing timeout values or optimizing operations.`
      );
    }

    const rateLimitCount = errorPatterns.get('rate_limit') ?? 0;
    if (rateLimitCount >= 2) {
      recommendations.push(
        `${rateLimitCount} rate limit errors occurred. Consider implementing request throttling or increasing quotas.`
      );
    }

    const networkCount = errorPatterns.get('network') ?? 0;
    if (networkCount >= 2) {
      recommendations.push(
        `${networkCount} network errors occurred. Check network stability and DNS resolution.`
      );
    }

    // Total delay recommendation
    const totalDelay = Object.values(this.retriesPerStep).reduce(
      (sum, record) => sum + record.totalDelay,
      0
    );

    if (totalDelay > 30000) {
      recommendations.push(
        `Total retry delay of ${(totalDelay / 1000).toFixed(1)}s. ` +
          'Pipeline execution was significantly delayed by retries.'
      );
    }

    // Default recommendation if nothing specific
    if (recommendations.length === 0 && this.calculateDegradationScore() > 0) {
      recommendations.push(
        'Minor degradation detected but within acceptable limits. ' +
          'Continue monitoring for recurring patterns.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('No degradation detected. Pipeline executed normally.');
    }

    return recommendations;
  }

  /**
   * Get current state summary (useful for debugging)
   */
  getSummary(): {
    fallbackCount: number;
    totalRetries: number;
    totalDelay: number;
    stepCount: number;
  } {
    const totalRetries = Object.values(this.retriesPerStep).reduce(
      (sum, record) => sum + Math.max(0, record.attempts - 1),
      0
    );

    const totalDelay = Object.values(this.retriesPerStep).reduce(
      (sum, record) => sum + record.totalDelay,
      0
    );

    return {
      fallbackCount: this.fallbacksUsed.length,
      totalRetries,
      totalDelay,
      stepCount: Object.keys(this.retriesPerStep).length,
    };
  }

  /**
   * Reset the builder for reuse
   */
  reset(): void {
    this.fallbacksUsed = [];
    this.retriesPerStep = {};
  }
}

/**
 * Create a DegradationReportBuilder instance
 *
 * @param pipelineId - ID of the pipeline being monitored
 * @returns Builder instance
 */
export function createDegradationReportBuilder(pipelineId: string): DegradationReportBuilder {
  return new DegradationReportBuilder(pipelineId);
}

/**
 * Merge multiple degradation reports into one
 * Useful when aggregating reports from multiple pipelines
 *
 * @param reports - Reports to merge
 * @returns Merged report
 */
export function mergeDegradationReports(reports: DegradationReport[]): DegradationReport {
  if (reports.length === 0) {
    return { ...EMPTY_DEGRADATION_REPORT };
  }

  if (reports.length === 1) {
    return { ...reports[0] };
  }

  const merged: DegradationReport = {
    hasDegradation: false,
    degradationScore: 0,
    fallbacksUsed: [],
    retriesPerStep: {},
    degradedSteps: [],
    recommendations: [],
  };

  const allDegradedSteps = new Set<string>();
  let totalScore = 0;

  for (const report of reports) {
    // Merge fallbacks
    merged.fallbacksUsed.push(...report.fallbacksUsed);

    // Merge retries per step (take max attempts if step appears in multiple)
    for (const [step, record] of Object.entries(report.retriesPerStep)) {
      const existing = merged.retriesPerStep[step];
      if (existing) {
        merged.retriesPerStep[step] = {
          attempts: Math.max(existing.attempts, record.attempts),
          totalDelay: existing.totalDelay + record.totalDelay,
          errors: [...new Set([...existing.errors, ...record.errors])],
        };
      } else {
        merged.retriesPerStep[step] = { ...record };
      }
    }

    // Collect degraded steps
    for (const step of report.degradedSteps) {
      allDegradedSteps.add(step);
    }

    // Sum scores
    totalScore += report.degradationScore;

    // Check degradation
    if (report.hasDegradation) {
      merged.hasDegradation = true;
    }
  }

  merged.degradedSteps = Array.from(allDegradedSteps).sort();
  merged.degradationScore = Math.min(100, Math.round(totalScore / reports.length));

  // Combine unique recommendations
  const allRecommendations = new Set<string>();
  for (const report of reports) {
    for (const rec of report.recommendations) {
      allRecommendations.add(rec);
    }
  }
  merged.recommendations = Array.from(allRecommendations);

  return merged;
}
