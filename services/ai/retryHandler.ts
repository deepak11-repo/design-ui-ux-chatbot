// File: ./services/ai/retryHandler.ts

import { GeminiApiError } from './geminiService';

const MAX_RETRIES = 3;

/**
 * Executes a function with retry logic and exponential backoff
 * @param fn - The async function to execute
 * @returns The result of the function
 * @throws GeminiApiError if all retries fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>
): Promise<T> {
  let lastError: GeminiApiError | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as GeminiApiError;

      // If not retryable, throw immediately
      if (!lastError.retryable) {
        throw lastError;
      }

      // If this was the last attempt, throw the error
      if (attempt === MAX_RETRIES) {
        throw lastError;
      }

      // Wait before retrying (exponential backoff: 1s, 2s, 4s)
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || {
    message: 'Unknown error occurred',
    code: 'UNKNOWN',
    retryable: false,
  } as GeminiApiError;
}
