// File: ./services/ai/geminiService.ts

import { handleGeminiError, validateGeminiResponse } from './geminiErrorHandler';
import { withRetry } from './retryHandler';
import { createGeminiClient, buildTextParams, buildImageParams } from './geminiApiHelpers';

export interface GeminiApiError {
  message: string;
  code?: string;
  retryable: boolean;
}

/**
 * Calls the Gemini API using the official SDK
 * @param prompt - The full prompt to send to the LLM
 * @param apiKey - The Gemini API key
 * @returns The generated content text
 * @throws GeminiApiError if the request fails
 */
async function callGeminiApi(prompt: string, apiKey: string): Promise<string> {
  try {
    const genai = createGeminiClient(apiKey);
    const params = buildTextParams(prompt);
    const response = await genai.models.generateContent(params);

    // Extract text from response
    const text = response.text;
    validateGeminiResponse(text);
    const usage = (response as any)?.usageMetadata;
    if (usage) {
      const inputTokens = usage.promptTokenCount ?? 'unknown';
      const outputTokens = usage.candidatesTokenCount ?? 'unknown';
      console.log(`[Gemini] tokens -> input: ${inputTokens}, output: ${outputTokens}`);
    } else {
      console.log(`[Gemini] tokens -> input: unknown, output: unknown`);
    }
    return text!;
  } catch (error: any) {
    throw handleGeminiError(error);
  }
}

/**
 * Calls the Gemini API with image input using the official SDK
 * @param imageBase64 - Base64 encoded image data
 * @param prompt - The text prompt to send with the image
 * @param apiKey - The Gemini API key
 * @returns The generated content text
 * @throws GeminiApiError if the request fails
 */
async function callGeminiApiWithImage(
  imageBase64: string,
  prompt: string,
  apiKey: string
): Promise<string> {
  try {
    const genai = createGeminiClient(apiKey);

    // Format contents array with image and text
    const contents = [
      {
        inlineData: {
          mimeType: 'image/png',
          data: imageBase64,
        },
      },
      { text: prompt },
    ];

    const params = buildImageParams(contents);
    const response = await genai.models.generateContent(params);

    // Extract text from response
    const text = response.text;
    validateGeminiResponse(text);
    const usage = (response as any)?.usageMetadata;
    if (usage) {
      const inputTokens = usage.promptTokenCount ?? 'unknown';
      const outputTokens = usage.candidatesTokenCount ?? 'unknown';
      console.log(`[Gemini-image] tokens -> input: ${inputTokens}, output: ${outputTokens}`);
    } else {
      console.log(`[Gemini-image] tokens -> input: unknown, output: unknown`);
    }
    return text!;
  } catch (error: any) {
    throw handleGeminiError(error);
  }
}

/**
 * Generates HTML content using Gemini API with retry logic
 * @param prompt - The full prompt to send to the LLM
 * @param apiKey - The Gemini API key
 * @returns The generated HTML content
 * @throws GeminiApiError if all retries fail
 * 
 * NOTE: This function is still used for the scratch route.
 * For the redesign route, Anthropic is used instead (see anthropicService.ts).
 */
export async function generateHtmlWithGemini(
  prompt: string,
  apiKey: string
): Promise<string> {
  return withRetry(() => callGeminiApi(prompt, apiKey));
}

/**
 * Analyzes a webpage screenshot using Gemini API with retry logic
 * @param imageBase64 - Base64 encoded PNG image data
 * @param prompt - The prompt to send with the image
 * @param apiKey - The Gemini API key
 * @returns The generated analysis text
 * @throws GeminiApiError if all retries fail
 */
export async function analyzeScreenshotWithGemini(
  imageBase64: string,
  prompt: string,
  apiKey: string
): Promise<string> {
  return withRetry(() => callGeminiApiWithImage(imageBase64, prompt, apiKey));
}

/**
 * Validates that the API key is present
 * @param apiKey - The API key to validate
 * @returns true if valid, false otherwise
 */
export function validateApiKey(apiKey: string | undefined): boolean {
  return !!apiKey && apiKey.trim().length > 0;
}
