// File: ./services/ai/geminiErrorHandler.ts

import { GeminiApiError } from './geminiService';

/**
 * Handles Gemini API errors and converts them to standardized GeminiApiError format
 * @param error - The error object from the API call
 * @returns Standardized GeminiApiError
 */
export function handleGeminiError(error: any): GeminiApiError {
  let errorMessage = error.message || 'Unknown error occurred';
  let errorCode = error.code || 'UNKNOWN';
  let retryable = false;

  // Determine if error is retryable based on error type
  if (error.status === 429 || error.status >= 500) {
    retryable = true;
  } else if (error.status === 503 || error.message?.includes('503') || error.message?.includes('UNAVAILABLE') || error.message?.includes('Service Unavailable')) {
    retryable = true; // Service unavailable is retryable
  } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
    retryable = true;
  } else if (error.message?.includes('network') || error.message?.includes('timeout')) {
    retryable = true;
  }

  // Extract error code from various error formats
  if (error.status) {
    errorCode = error.status.toString();
  } else if (error.code) {
    errorCode = error.code;
  }

  return {
    message: errorMessage,
    code: errorCode,
    retryable,
  };
}

/**
 * Validates that the API response contains text content
 * @param text - The text from the API response
 * @throws GeminiApiError if text is empty
 */
export function validateGeminiResponse(text: string | undefined | null): void {
  if (!text || text.trim().length === 0) {
    throw {
      message: 'Empty response from Gemini API',
      code: 'EMPTY_RESPONSE',
      retryable: false,
    } as GeminiApiError;
  }
}
