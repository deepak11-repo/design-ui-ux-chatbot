// File: ./services/api/referenceWebsiteService.ts

import { captureReferenceWebsiteScreenshot } from './apiflashService';
import { arrayBufferToBase64 } from '../../utils/binaryUtils';
import { analyzeReferenceWebsiteWithGemini } from '../ai/geminiService';
import { REFERENCE_WEBSITE_PROMPT } from '../prompts/referenceWebsitePrompt';
import { extractAndValidateReferenceWebsiteJson } from '../../utils/jsonValidator';
import { logger } from '../../utils/logger';
import { logJsonValidationError } from '../../utils/jsonValidationHelpers';
import { addModelCallDelay } from '../../utils/modelCallDelay';

/**
 * Result type for reference website analysis
 */
export interface ReferenceWebsiteAnalysisResult {
  url: string;
  description: string;
  analysis: any; // Validated JSON response
}

/**
 * Processes a single reference website: captures screenshot, converts to base64, sends to Gemini, validates JSON
 * @param url - The URL of the reference website
 * @param description - The user's description of what they liked about this website
 * @param apiKey - The Gemini API key
 * @returns Analysis result or null if processing fails
 */
async function processReferenceWebsite(
  url: string,
  description: string,
  apiKey: string
): Promise<ReferenceWebsiteAnalysisResult | null> {
  try {
    // Step 1: Capture screenshot using Apiflash
    const imageBuffer = await captureReferenceWebsiteScreenshot(url);

    // Step 2: Convert to base64
    const imageBase64 = arrayBufferToBase64(imageBuffer);

    // Step 3: Build prompt with user's description
    // The prompt already includes instructions, but we need to include the user's description
    // so Gemini knows what specific elements to extract based on user preferences
    const promptWithDescription = `${REFERENCE_WEBSITE_PROMPT}\n\nUser preferences for this website: ${description}`;

    // Step 4: Send to Gemini (with URL for specific token logging)
    const geminiResponse = await analyzeReferenceWebsiteWithGemini(
      imageBase64,
      promptWithDescription,
      apiKey,
      url
    );


    // Step 5: Extract and validate JSON
    const validatedJson = extractAndValidateReferenceWebsiteJson(geminiResponse);

    if (!validatedJson) {
      logJsonValidationError(url, geminiResponse);
      return null;
    }

    // Ensure website_url matches the processed URL
    validatedJson.website_url = url;


    return {
      url,
      description,
      analysis: validatedJson,
    };
  } catch (error: any) {
    logger.error(`Error processing reference website ${url}:`, error);
    return null;
  }
}

/**
 * Processes all reference websites from the provided entries
 * Executes sequentially, one at a time, storing only successful results
 * @param entries - Array of {url, description} entries
 * @param apiKey - The Gemini API key (must be validated before calling)
 * @returns Array of successful analysis results
 */
export async function processReferenceWebsites(
  entries: Array<{ url: string; description: string }>,
  apiKey: string
): Promise<ReferenceWebsiteAnalysisResult[]> {
  // Validate inputs
  if (!entries || entries.length === 0) {
    return [];
  }

  if (!apiKey || !apiKey.trim()) {
    logger.error('Cannot process reference websites: API key is missing or invalid');
    return [];
  }
  const results: ReferenceWebsiteAnalysisResult[] = [];

  // Process sequentially, one at a time
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    // Validate entry before processing
    if (!entry.url || !entry.url.trim() || !entry.description || !entry.description.trim()) {
      logger.error(`Skipping invalid entry ${i + 1}/${entries.length}: missing URL or description`);
      continue;
    }

    // Add 5-second delay between consecutive Gemini calls (same model)
    // Skip delay for the first call (no previous model)
    if (i > 0) {
      await addModelCallDelay('gemini', 'gemini');
    }

    const result = await processReferenceWebsite(entry.url.trim(), entry.description.trim(), apiKey);
    
    // Only store successful results
    if (result) {
      results.push(result);
    } else {
      logger.error(`Failed to process reference website ${i + 1}/${entries.length}: ${entry.url}`);
    }
  }
  return results;
}
