// File: ./services/ai/anthropic/shared/validation.ts

/**
 * Validates that the API key is present
 * @param apiKey - The API key to validate
 * @returns true if valid, false otherwise
 */
export function validateAnthropicApiKey(apiKey: string | undefined): boolean {
  return !!apiKey && apiKey.trim().length > 0;
}
