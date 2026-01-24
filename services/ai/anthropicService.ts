// File: ./services/ai/anthropicService.ts

import Anthropic from '@anthropic-ai/sdk';
import { withRetry } from './retryHandler';

export interface AnthropicApiError {
  message: string;
  code?: string;
  retryable: boolean;
}

/**
 * Creates an Anthropic client instance
 * @param apiKey - The Anthropic API key
 * @returns Anthropic client instance
 * 
 * NOTE: dangerouslyAllowBrowser is set to true because this is a client-side application.
 * In production, consider moving API calls to a backend server for better security.
 */
function createAnthropicClient(apiKey: string): Anthropic {
  return new Anthropic({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });
}

/**
 * Handles Anthropic API errors and converts them to AnthropicApiError
 * @param error - The error object from Anthropic API
 * @returns AnthropicApiError with appropriate retry flag
 */
function handleAnthropicError(error: any): AnthropicApiError {
  const errorMessage = error.message || 'Unknown error occurred';
  const status = error.status || error.code;

  // Determine if error is retryable
  const retryable = status === 429 || status === 503 || status === 500;

  return {
    message: errorMessage,
    code: status?.toString(),
    retryable,
  };
}

/**
 * Validates that the API response contains content
 * @param text - The text content from the API response
 * @throws Error if content is invalid
 */
function validateAnthropicResponse(text: string | null | undefined): void {
  if (!text || text.trim().length === 0) {
    throw {
      message: 'INVALID_RESPONSE: Empty response from Anthropic API',
      code: 'INVALID_RESPONSE',
      retryable: false,
    } as AnthropicApiError;
  }
}

/**
 * Collects streamed Anthropic response text and usage
 */
async function collectStreamedResponse(stream: AsyncIterable<any>) {
  let text = '';
  let usage: any = null;

  for await (const event of stream) {
    if (event?.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
      text += event.delta.text ?? '';
    }
    if (event?.type === 'message_delta' && event?.usage) {
      usage = event.usage;
    }
  }

  return { text, usage };
}

/**
 * Saves text content to a downloadable .txt file
 */
function saveToTextFile(content: string, filename: string = 'anthropic-response.txt'): void {
  try {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    // Silently fail - file save is optional
    if (import.meta.env.DEV) {
      console.error('Failed to save file:', error);
    }
  }
}

/**
 * Calls the Anthropic API for webpage redesign generation
 * @param prompt - The full prompt to send to the LLM
 * @param apiKey - The Anthropic API key
 * @returns The generated content text
 * @throws AnthropicApiError if the request fails
 */
async function callAnthropicApi(prompt: string, apiKey: string): Promise<string> {
  try {
    const client = createAnthropicClient(apiKey);

    // Heuristic token estimate: ~4 chars per token
    const estimatedInputTokens = Math.ceil(prompt.length / 4);
    // Heuristic with hard upper bound per model limit (64k)
    const maxTokens = Math.min(64000, Math.max(1000, 400000 - estimatedInputTokens - 3000));
    
    const stream = await client.messages.create({
      model: "claude-opus-4-5-20251101",
      max_tokens: maxTokens,
      stream: true,
      messages: [
        { role: "user", content: prompt }
      ],
      tools: [{
        type: "web_search_20250305",
        name: "web_search",
      }],
    });

    // Collect streamed text and usage
    const { text, usage } = await collectStreamedResponse(stream);

    validateAnthropicResponse(text);
    
    // Token usage logging
    if (usage) {
      const inputTokens = usage.input_tokens ?? 'unknown';
      const outputTokens = usage.output_tokens ?? 'unknown';
      console.log(`[Anthropic] tokens -> input: ${inputTokens}, output: ${outputTokens}`);
    } else {
      console.log(`[Anthropic] tokens -> input: unknown, output: unknown`);
    }
    
    // Save response to .txt file for debugging
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    saveToTextFile(text, `anthropic-response-${timestamp}.txt`);
    
    return text;
  } catch (error: any) {
    throw handleAnthropicError(error);
  }
}

/**
 * Generates HTML content using Anthropic API with retry logic
 * @param prompt - The full prompt to send to the LLM
 * @param apiKey - The Anthropic API key
 * @returns The generated HTML content
 * @throws AnthropicApiError if all retries fail
 */
export async function generateHtmlWithAnthropic(
  prompt: string,
  apiKey: string
): Promise<string> {
  return withRetry(() => callAnthropicApi(prompt, apiKey));
}

/**
 * Validates that the API key is present
 * @param apiKey - The API key to validate
 * @returns true if valid, false otherwise
 */
export function validateAnthropicApiKey(apiKey: string | undefined): boolean {
  return !!apiKey && apiKey.trim().length > 0;
}
