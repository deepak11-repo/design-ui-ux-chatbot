// File: ./services/ai/anthropic/sonnetService.ts

import { callAnthropicApiWithSystem } from './shared/apiCaller';
import { withRetry } from '../retryHandler';
import { HTML_GENERATION_SYSTEM_PROMPT, buildHtmlGenerationUserPrompt } from '../../prompts/anthropic/htmlGenerationPrompt';
import { REDESIGN_HTML_GENERATION_SYSTEM_PROMPT, buildRedesignHtmlGenerationUserPrompt } from '../../prompts/anthropic/redesignHtmlGenerationPrompt';

const SONNET_MODEL = "claude-sonnet-4-5-20250929";

/**
 * Generates webpage specification using Anthropic API (Sonnet model)
 * @param systemPrompt - The system prompt
 * @param userPrompt - The user prompt with inputs
 * @param apiKey - The Anthropic API key
 * @returns The generated JSON specification
 * @throws AnthropicApiError if all retries fail
 */
export async function generateSpecificationWithSonnet(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string
): Promise<string> {
  return withRetry(() => callAnthropicApiWithSystem({
    model: SONNET_MODEL,
    systemPrompt,
    userPrompt,
    apiKey,
    logPrefix: "Sonnet-Spec",
    filenamePrefix: "anthropic-specification-response"
  }));
}

/**
 * Generates HTML from webpage specification using Anthropic API (Sonnet model)
 * @param specificationJson - The webpage specification JSON string
 * @param apiKey - The Anthropic API key
 * @returns The generated HTML content
 * @throws AnthropicApiError if all retries fail
 */
/**
 * Generates redesign specification using Anthropic API (Sonnet model) with screenshot image
 * @param systemPrompt - The system prompt
 * @param userPrompt - The user prompt with redesign inputs
 * @param imageBase64 - Base64 encoded screenshot of current webpage
 * @param apiKey - The Anthropic API key
 * @returns The generated JSON specification
 * @throws AnthropicApiError if all retries fail
 */
export async function generateRedesignSpecificationWithSonnet(
  systemPrompt: string,
  userPrompt: string,
  imageBase64: string,
  apiKey: string
): Promise<string> {
  return withRetry(() => callAnthropicApiWithSystem({
    model: SONNET_MODEL,
    systemPrompt,
    userPrompt,
    apiKey,
    logPrefix: "Sonnet-Redesign-Spec",
    filenamePrefix: "anthropic-redesign-specification-response",
    imageBase64
  }));
}

/**
 * Generates HTML from webpage specification using Anthropic API (Sonnet model)
 * @param specificationJson - The webpage specification JSON string
 * @param apiKey - The Anthropic API key
 * @returns The generated HTML content
 * @throws AnthropicApiError if all retries fail
 */
export async function generateHtmlFromSpecificationWithSonnet(
  specificationJson: string,
  apiKey: string
): Promise<string> {
  const systemPrompt = HTML_GENERATION_SYSTEM_PROMPT;
  const userPrompt = buildHtmlGenerationUserPrompt(specificationJson);

  return withRetry(() => callAnthropicApiWithSystem({
    model: SONNET_MODEL,
    systemPrompt,
    userPrompt,
    apiKey,
    logPrefix: "Sonnet-HTML",
    filenamePrefix: "anthropic-html-response"
  }));
}

/**
 * Generates HTML from redesign specification using Anthropic API (Sonnet model)
 * @param specificationJson - The redesign specification JSON string
 * @param apiKey - The Anthropic API key
 * @returns The generated HTML content
 * @throws AnthropicApiError if all retries fail
 */
export async function generateHtmlFromRedesignSpecificationWithSonnet(
  specificationJson: string,
  apiKey: string
): Promise<string> {
  const systemPrompt = REDESIGN_HTML_GENERATION_SYSTEM_PROMPT;
  const userPrompt = buildRedesignHtmlGenerationUserPrompt(specificationJson);

  return withRetry(() => callAnthropicApiWithSystem({
    model: SONNET_MODEL,
    systemPrompt,
    userPrompt,
    apiKey,
    logPrefix: "Sonnet-Redesign-HTML",
    filenamePrefix: "anthropic-redesign-html-response"
  }));
}
