// File: ./utils/modelCallDelay.ts

import { logger } from './logger';

/**
 * Delay configuration for AI model calls
 */
const SAME_MODEL_DELAY_MS = 5000; // 5 seconds delay between consecutive calls to the same model

/**
 * Adds a delay between consecutive calls to the same AI model
 * No delay is added for calls to different models
 * @param previousModel - The model used in the previous call ('gemini' | 'claude' | null)
 * @param currentModel - The model being used in the current call ('gemini' | 'claude')
 * @returns Promise that resolves after delay (if needed) or immediately
 */
export async function addModelCallDelay(
  previousModel: 'gemini' | 'claude' | null,
  currentModel: 'gemini' | 'claude'
): Promise<void> {
  // Only add delay if previous and current models are the same
  if (previousModel && previousModel === currentModel) {
    await new Promise(resolve => setTimeout(resolve, SAME_MODEL_DELAY_MS));
  }
}

/**
 * Helper to track the last model used in a sequence of calls
 * Use this to maintain state across multiple async calls
 */
export type ModelType = 'gemini' | 'claude' | null;
