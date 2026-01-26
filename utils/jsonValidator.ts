// File: ./utils/jsonValidator.ts

import { validateStringArray, validateObjectArrayWithProps } from './arrayValidators';

/**
 * Extracts JSON from a response string, removing markdown code blocks and extra text
 * @param response - The raw response from Gemini
 * @returns Clean JSON string or null if extraction fails
 */
export function extractJsonFromResponse(response: string): string | null {
  if (!response || typeof response !== 'string') {
    return null;
  }

  let cleaned = response.trim();

  // Remove markdown code blocks (```json ... ``` or ``` ... ```)
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/gm, '');
  cleaned = cleaned.replace(/\n?```\s*$/gm, '');

  // Find the first { and last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    return null;
  }

  // Extract only the JSON portion
  cleaned = cleaned.substring(firstBrace, lastBrace + 1);

  return cleaned.trim();
}

/**
 * Validates that the JSON matches the required schema for reference website analysis
 * The prompt allows flexible schemas based on user preferences, so we validate:
 * - Required fields: website_url, user_likes_about_this
 * - Optional fields: layout_notes, colors, typography_notes, components_liked, interaction_notes, design_principles
 * - If present, optional fields must match their expected types
 * @param jsonString - The JSON string to validate
 * @returns The parsed and validated JSON object, or null if validation fails
 */
export function validateReferenceWebsiteJson(jsonString: string): any | null {
  if (!jsonString || typeof jsonString !== 'string') {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonString);

    // REQUIRED fields - must be present
    if (typeof parsed.website_url !== 'string' || !parsed.website_url.trim()) {
      return null;
    }

    if (typeof parsed.user_likes_about_this !== 'string') {
      return null;
    }

    // OPTIONAL fields - validate only if present
    // layout_notes (optional)
    if (parsed.layout_notes !== undefined && typeof parsed.layout_notes !== 'string') {
      return null;
    }

    // typography_notes (optional)
    if (parsed.typography_notes !== undefined && typeof parsed.typography_notes !== 'string') {
      return null;
    }

    // interaction_notes (optional)
    if (parsed.interaction_notes !== undefined && typeof parsed.interaction_notes !== 'string') {
      return null;
    }

    // colors array (optional)
    if (parsed.colors !== undefined) {
      if (!validateObjectArrayWithProps(parsed.colors, ['hex', 'type'])) {
        return null;
      }
    }

    // components_liked array (optional)
    if (parsed.components_liked !== undefined) {
      if (!validateStringArray(parsed.components_liked)) {
        return null;
      }
    }

    // design_principles array (optional)
    if (parsed.design_principles !== undefined) {
      if (!validateStringArray(parsed.design_principles)) {
        return null;
      }
    }

    // Ensure at least one optional field is present (to validate the response has useful data)
    const hasOptionalFields = 
      parsed.layout_notes !== undefined ||
      parsed.colors !== undefined ||
      parsed.typography_notes !== undefined ||
      parsed.components_liked !== undefined ||
      parsed.interaction_notes !== undefined ||
      parsed.design_principles !== undefined;

    if (!hasOptionalFields) {
      // At least one optional field should be present for a valid analysis
      return null;
    }

    return parsed;
  } catch (error) {
    // JSON parsing failed
    return null;
  }
}

/**
 * Extracts, validates, and returns the reference website analysis JSON
 * @param response - The raw response from Gemini
 * @returns Validated JSON object or null if extraction/validation fails
 */
export function extractAndValidateReferenceWebsiteJson(response: string): any | null {
  const jsonString = extractJsonFromResponse(response);
  if (!jsonString) {
    return null;
  }

  return validateReferenceWebsiteJson(jsonString);
}
