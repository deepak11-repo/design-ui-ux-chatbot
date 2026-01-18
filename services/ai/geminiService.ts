// File: ./services/ai/geminiService.ts

import { GoogleGenAI } from "@google/genai";

const MAX_RETRIES = 3;
const MODEL_NAME = "gemini-2.5-flash";

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
    const genai = new GoogleGenAI({
      apiKey: apiKey,
    });

    const response = await genai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        temperature: 1.0,
        topP: 0.95,
      },
    });

    // Extract text from response
    const text = response.text;

    if (!text || text.trim().length === 0) {
      throw {
        message: 'Empty response from Gemini API',
        code: 'EMPTY_RESPONSE',
        retryable: false,
      } as GeminiApiError;
    }

    return text;
  } catch (error: any) {
    // Handle SDK errors
    let errorMessage = error.message || 'Unknown error occurred';
    let errorCode = error.code || 'UNKNOWN';
    let retryable = false;

    // Determine if error is retryable based on error type
    if (error.status === 429 || error.status >= 500) {
      retryable = true;
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

    throw {
      message: errorMessage,
      code: errorCode,
      retryable,
    } as GeminiApiError;
  }
}

/**
 * Generates HTML content using Gemini API with retry logic
 * @param prompt - The full prompt to send to the LLM
 * @param apiKey - The Gemini API key
 * @returns The generated HTML content
 * @throws GeminiApiError if all retries fail
 */
export async function generateHtmlWithGemini(
  prompt: string,
  apiKey: string
): Promise<string> {
  let lastError: GeminiApiError | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callGeminiApi(prompt, apiKey);
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

/**
 * Validates that the API key is present
 * @param apiKey - The API key to validate
 * @returns true if valid, false otherwise
 */
export function validateApiKey(apiKey: string | undefined): boolean {
  return !!apiKey && apiKey.trim().length > 0;
}
