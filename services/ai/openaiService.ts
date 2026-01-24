// File: ./services/ai/openaiService.ts

import OpenAI from 'openai';
import { withRetry } from './retryHandler';

export interface OpenAIApiError {
  message: string;
  code?: string;
  retryable: boolean;
}

/**
 * Creates an OpenAI client instance
 * NOTE: Client-side usage is NOT recommended for production
 */
function createOpenAIClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}

/**
 * Normalizes OpenAI errors into OpenAIApiError
 */
function handleOpenAIError(error: any): OpenAIApiError {
  const status =
    error?.status ||
    error?.response?.status ||
    error?.code;

  const message =
    error?.message ||
    error?.response?.data?.error?.message ||
    'Unknown OpenAI error';

  const retryable = status === 429 || status === 500 || status === 503;

  return {
    message,
    code: status ? String(status) : undefined,
    retryable,
  };
}

/**
 * Validates OpenAI response text
 */
function validateOpenAIResponse(text: string | null | undefined): void {
  if (!text || text.trim().length === 0) {
    throw {
      message: 'INVALID_RESPONSE: Empty response from OpenAI',
      code: 'INVALID_RESPONSE',
      retryable: false,
    } as OpenAIApiError;
  }
}

/**
 * Saves text content to a downloadable .txt file
 */
function saveToTextFile(content: string, filename: string = 'openai-response.txt'): void {
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
 * Calls OpenAI Responses API (GPT-5) with web search enabled
 */
async function callOpenAIApi(prompt: string, apiKey: string): Promise<string> {
  try {
    const client = createOpenAIClient(apiKey);

    // Heuristic token estimate: ~4 chars per token
    const estimatedInputTokens = Math.ceil(prompt.length / 4);
    const maxOutputTokens = Math.max(1000, 400000 - estimatedInputTokens - 3000);

    const response = await client.responses.create({
      model: 'gpt-5.2',
      input: prompt,
      tools: [{ type: 'web_search' }],
      max_output_tokens: maxOutputTokens,
    });

    const text = response.output_text;

    validateOpenAIResponse(text);
    
    // Token usage logging
    const usage = (response as any)?.usage;
    if (usage) {
      const inputTokens = usage.input_tokens ?? 'unknown';
      const outputTokens = usage.output_tokens ?? 'unknown';
      console.log(`[OpenAI] tokens -> input: ${inputTokens}, output: ${outputTokens}`);
    } else {
      console.log(`[OpenAI] tokens -> input: unknown, output: unknown`);
    }
    
    // Save response to .txt file for debugging
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    saveToTextFile(text, `openai-response-${timestamp}.txt`);
    
    return text;
  } catch (error: any) {
    throw handleOpenAIError(error);
  }
}

/**
 * Generates HTML using OpenAI with retry support
 */
export async function generateHtmlWithOpenAI(
  prompt: string,
  apiKey: string
): Promise<string> {
  return withRetry(() => callOpenAIApi(prompt, apiKey));
}

/**
 * Validates OpenAI API key
 */
export function validateOpenAIApiKey(apiKey: string | undefined): boolean {
  return typeof apiKey === 'string' && apiKey.trim().length > 0;
}
