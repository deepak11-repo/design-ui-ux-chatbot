// File: ./utils/errorMessages.ts

import { GeminiApiError } from '../services/ai/geminiService';

/**
 * Builds user-friendly error messages from Gemini API errors
 * @param error - The error object (can be GeminiApiError or any error)
 * @param context - Context string for the error (e.g., "generating your webpage", "analyzing your webpage")
 * @returns User-friendly error message
 */
export function buildUserFriendlyErrorMessage(error: any, context: string = "processing your request"): string {
  let errorMessage = `I encountered an error while ${context}. `;

  if (error.message) {
    // Check for specific error types
    if (error.message.includes('API key') || error.message.includes('authentication')) {
      return "There was an authentication error. Please check your API key configuration.";
    } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
      return "The API rate limit has been exceeded. Please try again in a few moments.";
    } else if (error.message.includes('503') || error.message?.includes('UNAVAILABLE') || error.message?.includes('Service Unavailable')) {
      return "The AI service is temporarily unavailable. Please try again in a few minutes.";
    } else if (error.message.includes('INVALID_RESPONSE') || error.message.includes('extract HTML')) {
      return "The AI generated an unexpected response format. Please try again.";
    } else if (error.message.includes('size') || error.message.includes('exceeds')) {
      return "The content is too large to process. Please try with a smaller input.";
    } else if (error.message.includes('Failed to capture')) {
      return "I couldn't capture a screenshot of the webpage. Please verify the URL is correct and accessible.";
    } else {
      errorMessage += error.message;
    }
  } else if (error.code) {
    // Handle error codes
    if (error.code === '503' || error.code === 'UNAVAILABLE') {
      return "The AI service is temporarily unavailable. Please try again in a few minutes.";
    }
    errorMessage += `Error code: ${error.code}. Please try again.`;
  } else {
    errorMessage += "Please try again or contact support.";
  }

  return errorMessage;
}

/**
 * Gets the Gemini API key from environment and validates it
 * Used for analysis (screenshot analysis)
 * @returns The API key if valid, null otherwise
 */
export function getAndValidateApiKey(): string | null {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return null;
  }
  return apiKey;
}

/**
 * Gets the Anthropic API key from environment and validates it
 * Used for webpage redesign generation
 * @returns The API key if valid, null otherwise
 */
export function getAndValidateAnthropicApiKey(): string | null {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return null;
  }
  return apiKey;
}

/**
 * Gets the OpenAI API key from environment and validates it
 * Used for webpage redesign generation
 * @returns The API key if valid, null otherwise
 */
export function getAndValidateOpenAIApiKey(): string | null {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return null;
  }
  return apiKey;
}

/**
 * Builds a message for missing API key
 * @param action - The action that requires the API key (e.g., "generate your webpage", "analyze your webpage screenshot")
 * @param isOpenAI - Whether this is for OpenAI (true) or Gemini (false)
 * @param isAnthropic - Whether this is for Anthropic (true) - takes precedence over isOpenAI
 * @returns User-friendly message about missing API key
 */
export function buildMissingApiKeyMessage(action: string, isOpenAI: boolean = false, isAnthropic: boolean = false): string {
  let apiKeyName: string;
  let envVarName: string;
  
  if (isAnthropic) {
    apiKeyName = 'Anthropic';
    envVarName = 'VITE_ANTHROPIC_API_KEY';
  } else if (isOpenAI) {
    apiKeyName = 'OpenAI';
    envVarName = 'VITE_OPENAI_API_KEY';
  } else {
    apiKeyName = 'Gemini';
    envVarName = 'VITE_GEMINI_API_KEY';
  }
  
  return `I need a ${apiKeyName} API key to ${action}. Please set ${envVarName} in your environment file and refresh the page.`;
}
