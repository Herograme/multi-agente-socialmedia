/**
 * Error Classifier
 * Categorizes errors to determine retry strategy
 * Story 4.5: Orquestrador - Retry e Error Handling
 */

import { ErrorCategory, ErrorClassifierFn } from './types';

/**
 * Patterns for detecting rate limit errors
 */
const RATE_LIMIT_PATTERNS: RegExp[] = [
  /rate.?limit/i,
  /too.?many.?requests/i,
  /429/,
  /quota.?exceeded/i,
  /throttl/i,
  /slow.?down/i,
  /retry.?after/i,
];

/**
 * Patterns for detecting timeout errors
 */
const TIMEOUT_PATTERNS: RegExp[] = [
  /timeout/i,
  /ETIMEDOUT/,
  /ESOCKETTIMEDOUT/,
  /timed?.?out/i,
  /deadline.?exceeded/i,
  /request.?took.?too.?long/i,
];

/**
 * Patterns for detecting network errors
 */
const NETWORK_PATTERNS: RegExp[] = [
  /ECONNREFUSED/,
  /ENOTFOUND/,
  /ECONNRESET/,
  /ENETUNREACH/,
  /EHOSTUNREACH/,
  /network/i,
  /socket.?hang.?up/i,
  /EPIPE/,
  /getaddrinfo/i,
  /ECONNABORTED/,
  /connection.?closed/i,
  /connection.?reset/i,
];

/**
 * Patterns for detecting fatal errors (should not retry)
 */
const FATAL_PATTERNS: RegExp[] = [
  /auth/i,
  /unauthorized/i,
  /forbidden/i,
  /invalid.?key/i,
  /invalid.?token/i,
  /invalid.?api/i,
  /not.?found/i,
  /404/,
  /403/,
  /401/,
  /invalid.?config/i,
  /missing.?required/i,
  /permission/i,
  /access.?denied/i,
  /invalid.?request/i,
  /bad.?request/i,
  /400/,
  /malformed/i,
  /invalid.?parameter/i,
  /unsupported/i,
];

/**
 * Map of categories to their patterns
 */
const ERROR_PATTERNS: Record<ErrorCategory, RegExp[]> = {
  [ErrorCategory.RATE_LIMITED]: RATE_LIMIT_PATTERNS,
  [ErrorCategory.TIMEOUT]: TIMEOUT_PATTERNS,
  [ErrorCategory.NETWORK]: NETWORK_PATTERNS,
  [ErrorCategory.FATAL]: FATAL_PATTERNS,
  [ErrorCategory.RETRIABLE]: [], // Default for unmatched errors
};

/**
 * Custom classifiers registered at runtime
 */
const customClassifiers: ErrorClassifierFn[] = [];

/**
 * Build a string representation of an error for pattern matching
 */
function buildErrorString(error: Error): string {
  const parts: string[] = [error.name, error.message];

  // Include error code if present
  if ('code' in error && typeof error.code === 'string') {
    parts.push(error.code);
  }

  // Include status code if present
  if ('statusCode' in error && typeof error.statusCode === 'number') {
    parts.push(String(error.statusCode));
  }

  if ('status' in error && typeof error.status === 'number') {
    parts.push(String(error.status));
  }

  // Include response status if present (common in HTTP errors)
  if ('response' in error && error.response && typeof error.response === 'object') {
    const response = error.response as Record<string, unknown>;
    if ('status' in response && typeof response.status === 'number') {
      parts.push(String(response.status));
    }
    if ('statusText' in response && typeof response.statusText === 'string') {
      parts.push(response.statusText);
    }
  }

  return parts.join(' ');
}

/**
 * Classify an error into a category
 *
 * @param error - The error to classify
 * @returns The error category
 *
 * @example
 * const category = classifyError(new Error('Rate limit exceeded'));
 * // Returns: ErrorCategory.RATE_LIMITED
 */
export function classifyError(error: Error): ErrorCategory {
  const errorString = buildErrorString(error);

  // Try custom classifiers first (they have priority)
  for (const classifier of customClassifiers) {
    const category = classifier(error);
    if (category !== null) {
      return category;
    }
  }

  // Check predefined patterns in order of specificity
  // Rate limit and timeout should be checked before network
  const checkOrder: ErrorCategory[] = [
    ErrorCategory.FATAL,
    ErrorCategory.RATE_LIMITED,
    ErrorCategory.TIMEOUT,
    ErrorCategory.NETWORK,
  ];

  for (const category of checkOrder) {
    const patterns = ERROR_PATTERNS[category];
    for (const pattern of patterns) {
      if (pattern.test(errorString)) {
        return category;
      }
    }
  }

  // Default: unknown errors are retriable (transient until proven otherwise)
  return ErrorCategory.RETRIABLE;
}

/**
 * Check if an error category allows retry
 *
 * @param category - The error category to check
 * @param retriableCategories - Optional list of categories that allow retry
 * @returns Whether the category allows retry
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
 * Register a custom error classifier
 * Custom classifiers are called before built-in patterns
 *
 * @param classifier - Function that returns a category or null
 * @returns Function to unregister the classifier
 *
 * @example
 * const unregister = registerClassifier((error) => {
 *   if (error.message.includes('custom')) {
 *     return ErrorCategory.FATAL;
 *   }
 *   return null;
 * });
 *
 * // Later, to remove:
 * unregister();
 */
export function registerClassifier(classifier: ErrorClassifierFn): () => void {
  customClassifiers.push(classifier);

  return () => {
    const index = customClassifiers.indexOf(classifier);
    if (index > -1) {
      customClassifiers.splice(index, 1);
    }
  };
}

/**
 * Clear all custom classifiers
 * Useful for testing
 */
export function clearCustomClassifiers(): void {
  customClassifiers.length = 0;
}

/**
 * Get the number of registered custom classifiers
 */
export function getCustomClassifierCount(): number {
  return customClassifiers.length;
}

/**
 * Get a human-readable description for an error category
 *
 * @param category - The error category
 * @returns Description of the category
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

/**
 * Check if an error is a rate limit error specifically
 * Useful when you need to apply special handling for rate limits
 */
export function isRateLimitError(error: Error): boolean {
  return classifyError(error) === ErrorCategory.RATE_LIMITED;
}

/**
 * Check if an error is a timeout error specifically
 */
export function isTimeoutError(error: Error): boolean {
  return classifyError(error) === ErrorCategory.TIMEOUT;
}

/**
 * Check if an error is a network error specifically
 */
export function isNetworkError(error: Error): boolean {
  return classifyError(error) === ErrorCategory.NETWORK;
}

/**
 * Check if an error is a fatal error specifically
 */
export function isFatalError(error: Error): boolean {
  return classifyError(error) === ErrorCategory.FATAL;
}

/**
 * Get suggested delay multiplier for an error category
 * Rate limited errors should wait longer
 */
export function getDelayMultiplier(category: ErrorCategory): number {
  switch (category) {
    case ErrorCategory.RATE_LIMITED:
      return 3; // Triple the delay for rate limits
    case ErrorCategory.TIMEOUT:
      return 1.5; // Slightly longer for timeouts
    default:
      return 1;
  }
}
