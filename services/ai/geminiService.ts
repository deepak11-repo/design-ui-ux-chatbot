// File: ./services/ai/geminiService.ts

import { handleGeminiError, validateGeminiResponse } from './geminiErrorHandler';
import { withRetry } from './retryHandler';
import { createGeminiClient, buildTextParams, buildImageParams } from './geminiApiHelpers';
import { sanitizeBase64 } from '../../utils/base64Utils';
import { logger } from '../../utils/logger';
import { logTokenUsage } from '../../utils/tokenLogger';

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
    // VERIFICATION: @google/genai SDK uses response.text as a getter property (not a method)
    // This is confirmed by the TypeScript definitions: get text(): string | undefined;
    const text = response.text;
    validateGeminiResponse(text);
    
    // VERIFICATION: @google/genai SDK has usageMetadata as a direct property on GenerateContentResponse
    // This is confirmed by the TypeScript definitions: usageMetadata?: GenerateContentResponseUsageMetadata;
    const usage = response.usageMetadata;
    const inputTokens = usage?.promptTokenCount ?? 'unknown';
    const outputTokens = usage?.candidatesTokenCount ?? 'unknown';
    logTokenUsage('Gemini', inputTokens, outputTokens);
    return text!;
  } catch (error: any) {
    throw handleGeminiError(error);
  }
}

/**
 * Calls the Gemini API with image input using the official SDK
 * @param imageBase64 - Base64 encoded image data (ONLY the image, no extracted text)
 * @param prompt - The text prompt to send with the image (must NOT include extracted text)
 * @param apiKey - The Gemini API key
 * @returns The generated content text
 * @throws GeminiApiError if the request fails
 * 
 * Security: Only image and prompt are sent - extracted text is explicitly excluded.
 * Extracted text is stored separately and used for content reuse, not for analysis.
 */
async function callGeminiApiWithImage(
  imageBase64: string,
  prompt: string,
  apiKey: string
): Promise<string> {
  try {
    const genai = createGeminiClient(apiKey);

    // Sanitize base64: remove data URI prefix if present (e.g., "data:image/png;base64,")
    // The Gemini API expects raw base64 data only
    const cleanBase64 = sanitizeBase64(imageBase64);

    // Only image and prompt are sent - extracted text is stored separately for content reuse
    const contents = [
      {
        inlineData: {
          mimeType: 'image/png',
          data: cleanBase64,
        },
      },
      { text: prompt },
    ];

    const params = buildImageParams(contents);
    const response = await genai.models.generateContent(params);

    // Extract text from response
    // VERIFICATION: @google/genai SDK uses response.text as a getter property (not a method)
    // This is confirmed by the TypeScript definitions: get text(): string | undefined;
    const text = response.text;
    validateGeminiResponse(text);
    
    // VERIFICATION: @google/genai SDK has usageMetadata as a direct property on GenerateContentResponse
    // This is confirmed by the TypeScript definitions: usageMetadata?: GenerateContentResponseUsageMetadata;
    const usage = response.usageMetadata;
    const inputTokens = usage?.promptTokenCount ?? 'unknown';
    const outputTokens = usage?.candidatesTokenCount ?? 'unknown';
    logTokenUsage('Gemini-image', inputTokens, outputTokens);
    return text!;
  } catch (error: any) {
    throw handleGeminiError(error);
  }
}

/**
 * Generates redesign specification using Gemini API with image and retry logic
 * @param prompt - The full prompt to send to Gemini (should include system + user prompt combined)
 * @param imageBase64 - Base64 encoded screenshot of current webpage
 * @param apiKey - The Gemini API key
 * @returns The generated JSON specification
 * @throws GeminiApiError if all retries fail
 */
async function callGeminiApiWithImageForRedesignSpec(
  prompt: string,
  imageBase64: string,
  apiKey: string
): Promise<string> {
  try {
    const genai = createGeminiClient(apiKey);

    // Sanitize base64: remove data URI prefix if present
    const cleanBase64 = sanitizeBase64(imageBase64);

    const contents = [
      {
        inlineData: {
          mimeType: 'image/png',
          data: cleanBase64,
        },
      },
      { text: prompt },
    ];

    const params = buildImageParams(contents);
    const response = await genai.models.generateContent(params);

    const text = response.text;
    validateGeminiResponse(text);
    
    // Log tokens specifically for redesign specification generation
    const usage = response.usageMetadata;
    const inputTokens = usage?.promptTokenCount ?? 'unknown';
    const outputTokens = usage?.candidatesTokenCount ?? 'unknown';
    logTokenUsage('Gemini-redesign-spec', inputTokens, outputTokens);
    
    return text!;
  } catch (error: any) {
    throw handleGeminiError(error);
  }
}

export async function generateRedesignSpecificationWithGemini(
  prompt: string,
  imageBase64: string,
  apiKey: string
): Promise<string> {
  return withRetry(() => callGeminiApiWithImageForRedesignSpec(prompt, imageBase64, apiKey));
}

/**
 * Analyzes a webpage screenshot using Gemini API with retry logic
 * @param imageBase64 - Base64 encoded PNG image data (ONLY the image)
 * @param prompt - The prompt to send with the image (must NOT include extracted text)
 * @param apiKey - The Gemini API key
 * @returns The generated analysis text
 * @throws GeminiApiError if all retries fail
 * 
 * Security: Only image and prompt are sent - extracted text is explicitly excluded.
 * Extracted text is stored separately in userResponses.redesignExtractedText and used for content reuse.
 */
export async function analyzeScreenshotWithGemini(
  imageBase64: string,
  prompt: string,
  apiKey: string
): Promise<string> {
  // Only image and prompt are sent - extracted text is stored separately for content reuse
  return withRetry(() => callGeminiApiWithImage(imageBase64, prompt, apiKey));
}

/**
 * Calls Gemini API with image for reference website analysis and logs tokens specifically
 * @param imageBase64 - Base64 encoded PNG image data
 * @param prompt - The prompt to send with the image
 * @param apiKey - The Gemini API key
 * @param url - The URL being analyzed (for logging context)
 * @returns The generated response text
 * @throws GeminiApiError if the request fails
 */
async function callGeminiApiWithImageForReference(
  imageBase64: string,
  prompt: string,
  apiKey: string,
  url: string
): Promise<string> {
  try {
    const genai = createGeminiClient(apiKey);

    // Sanitize base64: remove data URI prefix if present
    const cleanBase64 = sanitizeBase64(imageBase64);

    const contents = [
      {
        inlineData: {
          mimeType: 'image/png',
          data: cleanBase64,
        },
      },
      { text: prompt },
    ];

    const params = buildImageParams(contents);
    const response = await genai.models.generateContent(params);

    const text = response.text;
    validateGeminiResponse(text);
    
    // Log tokens specifically for reference website analysis
    const usage = response.usageMetadata;
    const inputTokens = usage?.promptTokenCount ?? 'unknown';
    const outputTokens = usage?.candidatesTokenCount ?? 'unknown';
    logTokenUsage('Gemini-reference-website', inputTokens, outputTokens, url);
    
    return text!;
  } catch (error: any) {
    throw handleGeminiError(error);
  }
}

/**
 * Analyzes a reference website screenshot using Gemini API with retry logic
 * @param imageBase64 - Base64 encoded PNG image data
 * @param prompt - The prompt to send with the image (reference website extraction prompt)
 * @param apiKey - The Gemini API key
 * @param url - The URL being analyzed (for logging context)
 * @returns The generated JSON response text
 * @throws GeminiApiError if all retries fail
 */
export async function analyzeReferenceWebsiteWithGemini(
  imageBase64: string,
  prompt: string,
  apiKey: string,
  url?: string
): Promise<string> {
  if (url) {
    // Use custom function with specific logging
    return withRetry(() => callGeminiApiWithImageForReference(imageBase64, prompt, apiKey, url));
  } else {
    // Fallback to generic function
    return withRetry(() => callGeminiApiWithImage(imageBase64, prompt, apiKey));
  }
}

/**
 * Validates that the API key is present
 * @param apiKey - The API key to validate
 * @returns true if valid, false otherwise
 */
export function validateApiKey(apiKey: string | undefined): boolean {
  return !!apiKey && apiKey.trim().length > 0;
}
