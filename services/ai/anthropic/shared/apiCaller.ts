// File: ./services/ai/anthropic/shared/apiCaller.ts

/**
 * Shared Anthropic API calling logic
 * Consolidates duplicate code from opusService and sonnetService
 */

import { createAnthropicClient } from './client';
import { handleAnthropicError } from './errorHandler';
import { validateAnthropicResponse, collectStreamedResponse, saveToHtmlFile, calculateMaxTokens, logTokenUsage } from './helpers';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Configuration for Anthropic API call
 */
export interface AnthropicApiCallConfig {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  apiKey: string;
  logPrefix: string;
  filenamePrefix: string;
  imageBase64?: string;
}

/**
 * Makes an Anthropic API call with system and user messages
 * Handles streaming, validation, token logging, and file saving
 * @param config - API call configuration
 * @returns The generated content text
 * @throws AnthropicApiError if the request fails
 */
export async function callAnthropicApiWithSystem(
  config: AnthropicApiCallConfig
): Promise<string> {
  try {
    const client = createAnthropicClient(config.apiKey);

    // Calculate max tokens
    let maxTokens: number;
    if (config.imageBase64) {
      // For image requests, estimate image tokens
      const cleanBase64 = config.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const imageTokenEstimate = Math.ceil((cleanBase64.length * 4 / 3) / 1024 * 170);
      const totalPromptLength = config.systemPrompt.length + config.userPrompt.length;
      const textTokenEstimate = Math.ceil(totalPromptLength / 4);
      const totalTokenEstimate = imageTokenEstimate + textTokenEstimate;
      maxTokens = Math.min(64000, Math.max(1000, 400000 - totalTokenEstimate - 3000));
    } else {
      const totalPromptLength = config.systemPrompt.length + config.userPrompt.length;
      maxTokens = calculateMaxTokens(totalPromptLength);
    }

    // Build messages array
    let messages: Anthropic.MessageParam[];
    if (config.imageBase64) {
      const cleanBase64 = config.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      messages = [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: cleanBase64,
              },
            },
            {
              type: "text",
              text: config.userPrompt,
            },
          ],
        },
      ];
    } else {
      messages = [
        { role: "user", content: config.userPrompt }
      ];
    }

    const stream = await client.messages.create({
      model: config.model,
      max_tokens: maxTokens,
      stream: true,
      system: config.systemPrompt,
      messages,
      tools: [{
        type: "web_search_20250305",
        name: "web_search",
      }],
    });

    // Collect streamed text and usage
    const { text, usage } = await collectStreamedResponse(stream);

    validateAnthropicResponse(text);
    
    // Token usage logging
    logTokenUsage(config.logPrefix, usage);
    
    // Save HTML response to .html file (only for HTML generation, not specifications)
    if (config.filenamePrefix.includes('html')) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      saveToHtmlFile(text, `${config.filenamePrefix}-${timestamp}.html`);
    }
    
    return text;
  } catch (error: any) {
    throw handleAnthropicError(error);
  }
}
