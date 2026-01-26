// File: ./services/ai/anthropic/shared/client.ts

import Anthropic from '@anthropic-ai/sdk';

/**
 * Creates an Anthropic client instance
 * @param apiKey - The Anthropic API key
 * @returns Anthropic client instance
 * 
 * Security note: dangerouslyAllowBrowser is required for client-side API calls.
 * API keys are exposed in the client bundle. Consider using a backend proxy for production.
 */
export function createAnthropicClient(apiKey: string): Anthropic {
  return new Anthropic({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });
}
