// File: ./services/ai/anthropic/shared/fallbackHelper.ts

/**
 * Shared helper for model fallback patterns
 * Consolidates duplicate fallback logic between different HTML generation functions
 */

import { logger } from '../../../../utils/logger';

/**
 * Configuration for fallback execution
 */
export interface FallbackConfig<T> {
  primaryModel: string;
  fallbackModel: string;
  operationName: string;
  primaryCall: () => Promise<T>;
  fallbackCall: () => Promise<T>;
}

/**
 * Executes a primary operation with automatic fallback to secondary operation
 * @param config - Fallback configuration
 * @returns Result from primary or fallback operation
 * @throws Error if both operations fail
 */
export async function executeWithFallback<T>(config: FallbackConfig<T>): Promise<T> {
  const { primaryModel, fallbackModel, operationName, primaryCall, fallbackCall } = config;

  try {
    const response = await primaryCall();
    return response;
  } catch (primaryError: any) {
    try {
      const response = await fallbackCall();
      return response;
    } catch (fallbackError: any) {
      logger.error(`Both ${primaryModel} and ${fallbackModel} failed for ${operationName}:`, {
        primaryError: primaryError.message,
        fallbackError: fallbackError.message
      });
      // Re-throw the fallback error as it's the last attempt
      throw fallbackError;
    }
  }
}
