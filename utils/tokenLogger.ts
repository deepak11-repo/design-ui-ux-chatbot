// File: ./utils/tokenLogger.ts

import { logger } from './logger';

/**
 * Logs token usage information for API calls (dev-only)
 * @param serviceName - Name of the service (e.g., "Gemini", "Anthropic")
 * @param context - Optional context string (e.g., URL for reference website analysis)
 * @param inputTokens - Number of input tokens (or 'unknown')
 * @param outputTokens - Number of output tokens (or 'unknown')
 */
export function logTokenUsage(
  serviceName: string,
  inputTokens: number | string,
  outputTokens: number | string,
  context?: string
): void {
  const contextStr = context ? ` ${context}` : '';
  const tokenMessage = `${serviceName}${contextStr} -> tokens -> input: ${inputTokens}, output: ${outputTokens}`;
  
  // Log via logger (dev-only, suppressed in production)
  logger.debug(tokenMessage);
}
