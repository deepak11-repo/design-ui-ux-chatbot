// File: ./services/ai/anthropic/htmlGenerationWithFallback.ts

import { executeWithFallback } from './shared/fallbackHelper';
import { generateHtmlFromSpecificationWithOpus, generateHtmlFromRedesignSpecificationWithOpus } from './opusService';
import { generateHtmlFromSpecificationWithSonnet, generateHtmlFromRedesignSpecificationWithSonnet } from './sonnetService';

/**
 * Generates HTML from webpage specification with Opus as primary model and Sonnet as fallback
 * @param specificationJson - The webpage specification JSON string
 * @param apiKey - The Anthropic API key
 * @returns The generated HTML content
 * @throws Error if both models fail
 */
export async function generateHtmlFromSpecificationWithFallback(
  specificationJson: string,
  apiKey: string
): Promise<string> {
  return executeWithFallback({
    primaryModel: 'Claude Opus',
    fallbackModel: 'Claude Sonnet',
    operationName: 'HTML generation',
    primaryCall: () => generateHtmlFromSpecificationWithOpus(specificationJson, apiKey),
    fallbackCall: () => generateHtmlFromSpecificationWithSonnet(specificationJson, apiKey)
  });
}

/**
 * Generates HTML from redesign specification with Opus as primary model and Sonnet as fallback
 * @param specificationJson - The redesign specification JSON string
 * @param apiKey - The Anthropic API key
 * @returns The generated HTML content
 * @throws Error if both models fail
 */
export async function generateHtmlFromRedesignSpecificationWithFallback(
  specificationJson: string,
  apiKey: string
): Promise<string> {
  return executeWithFallback({
    primaryModel: 'Claude Opus',
    fallbackModel: 'Claude Sonnet',
    operationName: 'redesign HTML generation',
    primaryCall: () => generateHtmlFromRedesignSpecificationWithOpus(specificationJson, apiKey),
    fallbackCall: () => generateHtmlFromRedesignSpecificationWithSonnet(specificationJson, apiKey)
  });
}
