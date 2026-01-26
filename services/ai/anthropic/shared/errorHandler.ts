// File: ./services/ai/anthropic/shared/errorHandler.ts

import { AnthropicApiError } from './types';

/**
 * Handles Anthropic API errors and converts them to AnthropicApiError
 * @param error - The error object from Anthropic API
 * @returns AnthropicApiError with appropriate retry flag
 */
export function handleAnthropicError(error: any): AnthropicApiError {
  let errorMessage = error.message || 'Unknown error occurred';
  let status = error.status || error.code;
  let errorType: string | undefined;

  // Try to parse JSON error message if it exists
  try {
    if (typeof errorMessage === 'string' && errorMessage.startsWith('{')) {
      const parsedError = JSON.parse(errorMessage);
      if (parsedError.error) {
        errorType = parsedError.error.type;
        errorMessage = parsedError.error.message || errorType || errorMessage;
        // Extract status from error details if available
        if (parsedError.error.status_code) {
          status = parsedError.error.status_code;
        }
      } else if (parsedError.type === 'error' && parsedError.error) {
        errorType = parsedError.error.type;
        errorMessage = parsedError.error.message || errorType || errorMessage;
        if (parsedError.error.status_code) {
          status = parsedError.error.status_code;
        }
      }
    }
  } catch (parseError) {
    // If parsing fails, use original error message
    // Log for debugging
    if (import.meta.env.DEV) {
      console.warn('Failed to parse error message as JSON:', parseError);
    }
  }

  // Check for specific error types that indicate retryability
  const retryable = 
    status === 429 || 
    status === 503 || 
    status === 500 ||
    errorType === 'overloaded' ||
    errorType === 'rate_limit_error' ||
    errorType === 'server_error';

  // Build a more informative error message
  let finalMessage = errorMessage;
  if (errorType && errorType !== errorMessage) {
    finalMessage = `${errorType}: ${errorMessage}`;
  }

  return {
    message: finalMessage,
    code: status?.toString() || errorType,
    retryable,
  };
}
