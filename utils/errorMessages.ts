// File: ./utils/errorMessages.ts

import { GeminiApiError } from '../services/ai/geminiService';

/**
 * Standard user-friendly error message shown when any error occurs
 * This message is displayed instead of technical error details
 */
export const STANDARD_ERROR_MESSAGE = "Our server or AI agent is currently overloaded or busy due to many requests. Please try again later, or provide your email so that our agent can personally assist you.";


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
 * Builds a message for missing API key
 * @param action - The action that requires the API key (e.g., "generate your webpage", "analyze your webpage screenshot")
 * @param isAnthropic - Whether this is for Anthropic (true) or Gemini (false)
 * @returns User-friendly message about missing API key
 */
export function buildMissingApiKeyMessage(action: string, isAnthropic: boolean = false): string {
  let apiKeyName: string;
  let envVarName: string;
  
  if (isAnthropic) {
    apiKeyName = 'Anthropic';
    envVarName = 'VITE_ANTHROPIC_API_KEY';
  } else {
    apiKeyName = 'Gemini';
    envVarName = 'VITE_GEMINI_API_KEY';
  }
  
  return `I need a ${apiKeyName} API key to ${action}. Please set ${envVarName} in your environment file and refresh the page.`;
}
