// File: ./services/ai/anthropic/shared/helpers.ts

import { AnthropicApiError } from './types';
import { logger } from '../../../../utils/logger';

/**
 * Validates that the API response contains content
 * @param text - The text content from the API response
 * @throws Error if content is invalid
 */
export function validateAnthropicResponse(text: string | null | undefined): void {
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
export async function collectStreamedResponse(stream: AsyncIterable<any>) {
  let text = '';
  let usage: any = null;

  try {
    for await (const event of stream) {
      // Check for error events
      if (event?.type === 'error') {
        throw new Error(`Stream error: ${JSON.stringify(event)}`);
      }
      
      if (event?.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        text += event.delta.text ?? '';
      }
      if (event?.type === 'message_delta' && event?.usage) {
        usage = event.usage;
      }
    }
  } catch (streamError: any) {
    // Re-throw with more context if it's a stream error
    if (streamError.message?.includes('Stream error')) {
      throw streamError;
    }
    // Otherwise, let it bubble up
    throw streamError;
  }

  return { text, usage };
}

/**
 * Saves HTML content to a downloadable .html file
 * Only saves if content appears to be HTML (contains HTML tags)
 */
export function saveToHtmlFile(content: string, filename: string = 'generated-webpage.html'): void {
  try {
    // Check if content appears to be HTML
    const isHtml = /<(!DOCTYPE|html|head|body)[\s>]/i.test(content.trim());
    
    if (!isHtml) {
      // Not HTML content, skip saving
      return;
    }
    
    // Ensure filename has .html extension
    const htmlFilename = filename.endsWith('.html') ? filename : `${filename}.html`;
    
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = htmlFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    // Silently fail - file save is optional
    if (import.meta.env.DEV) {
      console.error('Failed to save HTML file:', error);
    }
  }
}

/**
 * Calculates max tokens based on prompt length
 * @param promptLength - Length of the prompt in characters
 * @returns Maximum tokens to use
 */
export function calculateMaxTokens(promptLength: number): number {
  // Heuristic token estimate: ~4 chars per token
  const estimatedInputTokens = Math.ceil(promptLength / 4);
  // Heuristic with hard upper bound per model limit (64k)
  return Math.min(64000, Math.max(1000, 400000 - estimatedInputTokens - 3000));
}

/**
 * Logs token usage (dev-only, suppressed in production)
 * @param modelName - Name of the model for logging
 * @param usage - Usage object from API response
 */
export function logTokenUsage(modelName: string, usage: any): void {
  if (usage) {
    const inputTokens = usage.input_tokens ?? 'unknown';
    const outputTokens = usage.output_tokens ?? 'unknown';
    logger.debug(`[Anthropic-${modelName}] tokens -> input: ${inputTokens}, output: ${outputTokens}`);
  } else {
    logger.debug(`[Anthropic-${modelName}] tokens -> input: unknown, output: unknown`);
  }
}
