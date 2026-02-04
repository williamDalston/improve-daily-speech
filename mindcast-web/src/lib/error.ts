/**
 * Error Handling Utilities
 *
 * Centralized error handling with Sentry integration.
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Log an error to Sentry and console
 */
export function logError(
  error: Error | unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    user?: { id: string; email?: string };
  }
): void {
  // Always log to console
  console.error('Error:', error);

  // Send to Sentry in production
  if (process.env.NODE_ENV === 'production') {
    Sentry.withScope((scope) => {
      // Add tags
      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }

      // Add extra context
      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }

      // Add user context
      if (context?.user) {
        scope.setUser({
          id: context.user.id,
          email: context.user.email,
        });
      }

      // Capture the error
      if (error instanceof Error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(String(error), 'error');
      }
    });
  }
}

/**
 * Create a standardized API error response
 */
export function createErrorResponse(
  message: string,
  status: number,
  details?: Record<string, unknown>
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      ...details,
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Wrap an async API handler with error handling
 */
export function withErrorHandling<T>(
  handler: () => Promise<T>,
  context?: { endpoint: string; userId?: string }
): Promise<T> {
  return handler().catch((error) => {
    logError(error, {
      tags: { endpoint: context?.endpoint || 'unknown' },
      extra: { userId: context?.userId },
    });
    throw error;
  });
}

/**
 * Common error messages for user-facing errors
 */
export const ErrorMessages = {
  UNAUTHORIZED: 'You must be logged in to access this resource',
  FORBIDDEN: 'You do not have permission to access this resource',
  NOT_FOUND: 'The requested resource was not found',
  RATE_LIMITED: 'Too many requests. Please slow down.',
  VALIDATION_ERROR: 'Invalid input. Please check your data.',
  SERVER_ERROR: 'Something went wrong. Please try again.',
  GENERATION_FAILED: 'Failed to generate content. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
} as const;

/**
 * Check if error is a known/expected error type
 */
export function isExpectedError(error: unknown): boolean {
  if (error instanceof Error) {
    // User aborted request
    if (error.name === 'AbortError') return true;
    // Network errors on client
    if (error.message === 'Failed to fetch') return true;
  }
  return false;
}
