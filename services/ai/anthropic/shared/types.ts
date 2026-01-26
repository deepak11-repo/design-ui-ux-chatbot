// File: ./services/ai/anthropic/shared/types.ts

/**
 * Error interface for Anthropic API errors
 */
export interface AnthropicApiError {
  message: string;
  code?: string;
  retryable: boolean;
}
