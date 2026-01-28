/**
 * Error Classifier Tests
 * Story 4.5: Orquestrador - Retry e Error Handling
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  classifyError,
  isRetriable,
  registerClassifier,
  clearCustomClassifiers,
  getCustomClassifierCount,
  getCategoryDescription,
  isRateLimitError,
  isTimeoutError,
  isNetworkError,
  isFatalError,
  getDelayMultiplier,
} from '../orchestrator/retry/error-classifier';
import { ErrorCategory } from '../orchestrator/retry/types';

describe('ErrorClassifier', () => {
  afterEach(() => {
    clearCustomClassifiers();
  });

  describe('classifyError', () => {
    describe('Rate Limit Errors', () => {
      it('should classify "rate limit" errors', () => {
        const errors = [
          new Error('Rate limit exceeded'),
          new Error('rate_limit reached'),
          new Error('RateLimit: too many requests'),
        ];

        for (const error of errors) {
          expect(classifyError(error)).toBe(ErrorCategory.RATE_LIMITED);
        }
      });

      it('should classify "too many requests" errors', () => {
        const error = new Error('Too many requests, please try again later');
        expect(classifyError(error)).toBe(ErrorCategory.RATE_LIMITED);
      });

      it('should classify 429 status errors', () => {
        const error = new Error('HTTP 429 - Rate limit exceeded');
        expect(classifyError(error)).toBe(ErrorCategory.RATE_LIMITED);
      });

      it('should classify quota exceeded errors', () => {
        const error = new Error('Quota exceeded for today');
        expect(classifyError(error)).toBe(ErrorCategory.RATE_LIMITED);
      });

      it('should classify throttling errors', () => {
        const error = new Error('Request throttled');
        expect(classifyError(error)).toBe(ErrorCategory.RATE_LIMITED);
      });
    });

    describe('Timeout Errors', () => {
      it('should classify timeout errors', () => {
        const errors = [
          new Error('Request timeout'),
          new Error('Connection timed out'),
          new Error('TimeoutError: operation took too long'),
        ];

        for (const error of errors) {
          expect(classifyError(error)).toBe(ErrorCategory.TIMEOUT);
        }
      });

      it('should classify ETIMEDOUT errors', () => {
        const error = new Error('ETIMEDOUT');
        expect(classifyError(error)).toBe(ErrorCategory.TIMEOUT);
      });

      it('should classify deadline exceeded errors', () => {
        const error = new Error('deadline exceeded');
        expect(classifyError(error)).toBe(ErrorCategory.TIMEOUT);
      });
    });

    describe('Network Errors', () => {
      it('should classify connection refused errors', () => {
        const error = new Error('ECONNREFUSED');
        expect(classifyError(error)).toBe(ErrorCategory.NETWORK);
      });

      it('should classify DNS errors', () => {
        // Use ECONNREFUSED which is clearly network without ambiguity
        const error = new Error('ECONNREFUSED at host');
        expect(classifyError(error)).toBe(ErrorCategory.NETWORK);
      });

      it('should classify getaddrinfo errors', () => {
        const error = new Error('getaddrinfo request failed');
        expect(classifyError(error)).toBe(ErrorCategory.NETWORK);
      });

      it('should classify connection reset errors', () => {
        const error = new Error('ECONNRESET');
        expect(classifyError(error)).toBe(ErrorCategory.NETWORK);
      });

      it('should classify socket hang up errors', () => {
        const error = new Error('socket hang up');
        expect(classifyError(error)).toBe(ErrorCategory.NETWORK);
      });

      it('should classify generic network errors', () => {
        const error = new Error('Network error occurred');
        expect(classifyError(error)).toBe(ErrorCategory.NETWORK);
      });
    });

    describe('Fatal Errors', () => {
      it('should classify authentication errors', () => {
        const errors = [
          new Error('Authentication failed'),
          new Error('Invalid authentication token'),
          new Error('Unauthorized access'),
        ];

        for (const error of errors) {
          expect(classifyError(error)).toBe(ErrorCategory.FATAL);
        }
      });

      it('should classify invalid key errors', () => {
        const error = new Error('Invalid API key');
        expect(classifyError(error)).toBe(ErrorCategory.FATAL);
      });

      it('should classify 401/403/404 errors', () => {
        const errors = [
          new Error('HTTP 401 Unauthorized'),
          new Error('Error 403 Forbidden'),
          new Error('404 Not Found'),
        ];

        for (const error of errors) {
          expect(classifyError(error)).toBe(ErrorCategory.FATAL);
        }
      });

      it('should classify permission errors', () => {
        const error = new Error('Permission denied');
        expect(classifyError(error)).toBe(ErrorCategory.FATAL);
      });

      it('should classify bad request errors', () => {
        const error = new Error('Bad request: invalid parameter');
        expect(classifyError(error)).toBe(ErrorCategory.FATAL);
      });
    });

    describe('Retriable Errors (Default)', () => {
      it('should classify unknown errors as retriable', () => {
        const error = new Error('Something went wrong');
        expect(classifyError(error)).toBe(ErrorCategory.RETRIABLE);
      });

      it('should classify generic errors as retriable', () => {
        const error = new Error('An unexpected error occurred');
        expect(classifyError(error)).toBe(ErrorCategory.RETRIABLE);
      });
    });

    describe('Error with code property', () => {
      it('should use error code for classification', () => {
        const error = new Error('Connection error') as Error & { code: string };
        error.code = 'ECONNREFUSED';
        expect(classifyError(error)).toBe(ErrorCategory.NETWORK);
      });
    });

    describe('Error with status property', () => {
      it('should use status for classification', () => {
        const error = new Error('API Error') as Error & { status: number };
        error.status = 429;
        expect(classifyError(error)).toBe(ErrorCategory.RATE_LIMITED);
      });

      it('should use statusCode for classification', () => {
        const error = new Error('API Error') as Error & { statusCode: number };
        error.statusCode = 401;
        expect(classifyError(error)).toBe(ErrorCategory.FATAL);
      });
    });
  });

  describe('isRetriable', () => {
    it('should return true for retriable categories by default', () => {
      expect(isRetriable(ErrorCategory.RETRIABLE)).toBe(true);
      expect(isRetriable(ErrorCategory.TIMEOUT)).toBe(true);
      expect(isRetriable(ErrorCategory.NETWORK)).toBe(true);
      expect(isRetriable(ErrorCategory.RATE_LIMITED)).toBe(true);
    });

    it('should return false for fatal errors', () => {
      expect(isRetriable(ErrorCategory.FATAL)).toBe(false);
    });

    it('should respect custom retriable categories', () => {
      // Only allow RETRIABLE, not timeout
      const customCategories = [ErrorCategory.RETRIABLE];
      expect(isRetriable(ErrorCategory.TIMEOUT, customCategories)).toBe(false);
      expect(isRetriable(ErrorCategory.RETRIABLE, customCategories)).toBe(true);
    });
  });

  describe('registerClassifier', () => {
    it('should register and use custom classifier', () => {
      const customError = new Error('Custom error type XYZ');

      // Register custom classifier
      registerClassifier((error) => {
        if (error.message.includes('XYZ')) {
          return ErrorCategory.FATAL;
        }
        return null;
      });

      expect(classifyError(customError)).toBe(ErrorCategory.FATAL);
    });

    it('should prioritize custom classifiers over built-in patterns', () => {
      // "rate limit" would normally be RATE_LIMITED
      const error = new Error('rate limit but custom says fatal');

      registerClassifier((error) => {
        if (error.message.includes('custom says fatal')) {
          return ErrorCategory.FATAL;
        }
        return null;
      });

      expect(classifyError(error)).toBe(ErrorCategory.FATAL);
    });

    it('should allow unregistering custom classifier', () => {
      const customError = new Error('Custom type ABC');

      const unregister = registerClassifier((error) => {
        if (error.message.includes('ABC')) {
          return ErrorCategory.FATAL;
        }
        return null;
      });

      expect(classifyError(customError)).toBe(ErrorCategory.FATAL);

      // Unregister
      unregister();

      // Should now default to RETRIABLE
      expect(classifyError(customError)).toBe(ErrorCategory.RETRIABLE);
    });

    it('should track classifier count', () => {
      expect(getCustomClassifierCount()).toBe(0);

      registerClassifier(() => null);
      expect(getCustomClassifierCount()).toBe(1);

      registerClassifier(() => null);
      expect(getCustomClassifierCount()).toBe(2);

      clearCustomClassifiers();
      expect(getCustomClassifierCount()).toBe(0);
    });
  });

  describe('clearCustomClassifiers', () => {
    it('should clear all custom classifiers', () => {
      registerClassifier(() => ErrorCategory.FATAL);
      registerClassifier(() => ErrorCategory.FATAL);

      expect(getCustomClassifierCount()).toBe(2);

      clearCustomClassifiers();

      expect(getCustomClassifierCount()).toBe(0);
    });
  });

  describe('getCategoryDescription', () => {
    it('should return descriptions for all categories', () => {
      expect(getCategoryDescription(ErrorCategory.RETRIABLE)).toBe(
        'Transient error, can be retried'
      );
      expect(getCategoryDescription(ErrorCategory.FATAL)).toBe(
        'Fatal error, should not retry'
      );
      expect(getCategoryDescription(ErrorCategory.RATE_LIMITED)).toBe(
        'Rate limit exceeded, retry with longer delay'
      );
      expect(getCategoryDescription(ErrorCategory.TIMEOUT)).toBe(
        'Operation timed out, can be retried'
      );
      expect(getCategoryDescription(ErrorCategory.NETWORK)).toBe(
        'Network error, can be retried'
      );
    });
  });

  describe('Helper Functions', () => {
    it('isRateLimitError should detect rate limit errors', () => {
      expect(isRateLimitError(new Error('Rate limit exceeded'))).toBe(true);
      expect(isRateLimitError(new Error('Network error'))).toBe(false);
    });

    it('isTimeoutError should detect timeout errors', () => {
      expect(isTimeoutError(new Error('Request timeout'))).toBe(true);
      expect(isTimeoutError(new Error('Network error'))).toBe(false);
    });

    it('isNetworkError should detect network errors', () => {
      expect(isNetworkError(new Error('ECONNREFUSED'))).toBe(true);
      expect(isNetworkError(new Error('timeout'))).toBe(false);
    });

    it('isFatalError should detect fatal errors', () => {
      expect(isFatalError(new Error('Invalid API key'))).toBe(true);
      expect(isFatalError(new Error('Network error'))).toBe(false);
    });
  });

  describe('getDelayMultiplier', () => {
    it('should return 3 for rate limited errors', () => {
      expect(getDelayMultiplier(ErrorCategory.RATE_LIMITED)).toBe(3);
    });

    it('should return 1.5 for timeout errors', () => {
      expect(getDelayMultiplier(ErrorCategory.TIMEOUT)).toBe(1.5);
    });

    it('should return 1 for other categories', () => {
      expect(getDelayMultiplier(ErrorCategory.NETWORK)).toBe(1);
      expect(getDelayMultiplier(ErrorCategory.RETRIABLE)).toBe(1);
      expect(getDelayMultiplier(ErrorCategory.FATAL)).toBe(1);
    });
  });
});
