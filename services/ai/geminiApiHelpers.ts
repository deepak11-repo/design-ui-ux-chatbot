// File: ./services/ai/geminiApiHelpers.ts

import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = "gemini-2.5-flash";

/**
 * Creates a GoogleGenAI instance with the provided API key
 */
export function createGeminiClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: apiKey,
  });
}

/**
 * Builds the base configuration for Gemini API calls
 */
export function getGeminiConfig() {
  return {
    temperature: 1.0,
    topP: 0.95,
  };
}

/**
 * Builds the tools array for Gemini API calls (includes Google Search)
 */
export function getGeminiTools() {
  return [
    {
      googleSearch: {},
    },
  ];
}

/**
 * Builds the complete params object for text-only Gemini API calls
 */
export function buildTextParams(contents: string): any {
  return {
    model: MODEL_NAME,
    contents: contents,
    tools: getGeminiTools(),
    config: getGeminiConfig(),
  };
}

/**
 * Builds the complete params object for image+text Gemini API calls
 */
export function buildImageParams(contents: any[]): any {
  return {
    model: MODEL_NAME,
    contents: contents,
    tools: getGeminiTools(),
    config: getGeminiConfig(),
  };
}
