// File: ./services/ai/anthropic/opusService.ts

import { callAnthropicApiWithSystem } from './shared/apiCaller';
import { withRetry } from '../retryHandler';
import { HTML_GENERATION_SYSTEM_PROMPT, buildHtmlGenerationUserPrompt } from '../../prompts/anthropic/htmlGenerationPrompt';
import { REDESIGN_HTML_GENERATION_SYSTEM_PROMPT, buildRedesignHtmlGenerationUserPrompt } from '../../prompts/anthropic/redesignHtmlGenerationPrompt';

const OPUS_MODEL = "claude-opus-4-5-20251101";

/**
 * Generates HTML from webpage specification using Anthropic API (Opus model)
 * @param specificationJson - The webpage specification JSON string
 * @param apiKey - The Anthropic API key
 * @returns The generated HTML content
 * @throws AnthropicApiError if all retries fail
 */
export async function generateHtmlFromSpecificationWithOpus(
  specificationJson: string,
  apiKey: string
): Promise<string> {
  const systemPrompt = HTML_GENERATION_SYSTEM_PROMPT;
  const userPrompt = buildHtmlGenerationUserPrompt(specificationJson);

  return withRetry(() => callAnthropicApiWithSystem({
    model: OPUS_MODEL,
    systemPrompt,
    userPrompt,
    apiKey,
    logPrefix: "Opus-HTML",
    filenamePrefix: "anthropic-opus-html-response"
  }));
}

/**
 * Generates HTML from redesign specification using Anthropic API (Opus model)
 * @param specificationJson - The redesign specification JSON string
 * @param apiKey - The Anthropic API key
 * @returns The generated HTML content
 * @throws AnthropicApiError if all retries fail
 */
export async function generateHtmlFromRedesignSpecificationWithOpus(
  specificationJson: string,
  apiKey: string
): Promise<string> {
  const systemPrompt = REDESIGN_HTML_GENERATION_SYSTEM_PROMPT;
  const userPrompt = buildRedesignHtmlGenerationUserPrompt(specificationJson);

  return withRetry(() => callAnthropicApiWithSystem({
    model: OPUS_MODEL,
    systemPrompt,
    userPrompt,
    apiKey,
    logPrefix: "Opus-Redesign-HTML",
    filenamePrefix: "anthropic-opus-redesign-html-response"
  }));
}
