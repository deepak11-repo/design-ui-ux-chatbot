// File: ./utils/jsonValidationHelpers.ts

import { logger } from './logger';
import { extractJsonFromResponse } from './jsonValidator';

/**
 * Logs detailed information about JSON validation failures for debugging
 * @param url - The URL being processed (for context)
 * @param response - The raw response from Gemini
 */
export function logJsonValidationError(url: string, response: string): void {
  logger.error(`Failed to validate JSON response for ${url}`);
  logger.error(`Raw Gemini response (first 500 chars): ${response.substring(0, 500)}`);
  
  // Try to extract JSON to see what we got
  const jsonString = extractJsonFromResponse(response);
  if (jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      logger.error(`Parsed JSON structure:`, {
        has_website_url: typeof parsed.website_url === 'string',
        has_user_likes: typeof parsed.user_likes_about_this === 'string',
        has_layout_notes: typeof parsed.layout_notes === 'string',
        has_colors: Array.isArray(parsed.colors),
        has_typography_notes: typeof parsed.typography_notes === 'string',
        has_components_liked: Array.isArray(parsed.components_liked),
        has_interaction_notes: typeof parsed.interaction_notes === 'string',
        has_design_principles: Array.isArray(parsed.design_principles),
        keys: Object.keys(parsed)
      });
    } catch (e) {
      logger.error(`Could not parse extracted JSON: ${e}`);
    }
  } else {
    logger.error(`Could not extract JSON from response`);
  }
}
