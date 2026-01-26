// File: ./services/api/apiflashService.ts

import { arrayBufferToBase64 } from '../../utils/binaryUtils';
import { normalizeUrl } from '../../utils/validation';
import { validateAndNormalizeUrl as validateUrlSecurity } from '../../utils/inputSanitizer';
import { logger } from '../../utils/logger';

// Get API key from environment variable (required for security)
const APIFLASH_ACCESS_KEY = import.meta.env.VITE_APIFLASH_ACCESS_KEY;
const APIFLASH_BASE_URL = 'https://api.apiflash.com/v1/urltoimage';

if (!APIFLASH_ACCESS_KEY) {
  logger.error('VITE_APIFLASH_ACCESS_KEY environment variable is not set');
  throw new Error('APIFlash access key is required. Please set VITE_APIFLASH_ACCESS_KEY in your environment variables.');
}

/**
 * Builds base APIFlash query parameters (common to all endpoints)
 * @param formattedUrl - The normalized URL
 * @returns URLSearchParams with base query parameters
 */
function buildBaseApiflashParams(formattedUrl: string): URLSearchParams {
  return new URLSearchParams({
    access_key: APIFLASH_ACCESS_KEY,
    url: formattedUrl,
    format: 'png',
    width: '1920',
    height: '1080',
    full_page: 'true',
    fresh: 'true',
    delay: '5',
    scroll_page: 'true',
    no_cookie_banners: 'true',
    no_ads: 'true',
    no_tracking: 'true',
    scale_factor: '1',
    wait_until: 'page_loaded',
  });
}

/**
 * Builds common APIFlash query parameters
 * @param formattedUrl - The normalized URL
 * @param extractText - Whether to include text extraction parameters
 * @returns URLSearchParams with all query parameters
 */
function buildApiflashParams(formattedUrl: string, extractText: boolean = false): URLSearchParams {
  const params = buildBaseApiflashParams(formattedUrl);

  if (extractText) {
    params.set('extract_text', 'true');
    params.set('response_type', 'json');
  }

  return params;
}

/**
 * Validates and normalizes a URL for APIFlash
 * Includes security checks to prevent SSRF attacks
 * @param url - The URL to validate and normalize
 * @returns Normalized URL
 * @throws Error if URL is invalid or unsafe
 */
function validateAndNormalizeUrl(url: string): string {
  if (!url || !url.trim()) {
    throw new Error('URL is required');
  }
  
  // First normalize the URL
  const normalized = normalizeUrl(url.trim());
  
  // Then validate it's safe (prevents SSRF)
  const safeUrl = validateUrlSecurity(normalized);
  if (!safeUrl) {
    throw new Error('Invalid or unsafe URL. Only public https:// URLs are allowed.');
  }
  
  return safeUrl;
}

/**
 * Fetches a screenshot of a webpage using the Apiflash API
 * @param url - The URL of the webpage to screenshot
 * @returns Promise that resolves to the binary data of the PNG image
 * @throws Error if the API request fails
 */
export async function captureWebpageScreenshot(url: string): Promise<ArrayBuffer> {
  try {
    const formattedUrl = validateAndNormalizeUrl(url);
    const params = buildApiflashParams(formattedUrl, false);
    const apiUrl = `${APIFLASH_BASE_URL}?${params.toString()}`;

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Apiflash API error: ${response.status} ${response.statusText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    return imageBuffer;
  } catch (error: any) {
    logger.error('Error capturing webpage screenshot:', error);
    throw new Error(`Failed to capture webpage screenshot: ${error.message}`);
  }
}

/**
 * Interface for APIFlash JSON response when extract_text=true and response_type=json
 */
interface ApiflashJsonResponse {
  extracted_text: string; // URL to text file
  url: string; // URL to cached image
}

/**
 * Result type for screenshot capture with optional text extraction
 */
export interface ScreenshotResult {
  image: ArrayBuffer;
  text?: string; // Only present when extractText is true
}

/**
 * Fetches a screenshot of a webpage using the Apiflash API
 * Optionally extracts text content when reuse content is requested
 * @param url - The URL of the webpage to screenshot
 * @param extractText - Whether to extract text content (requires response_type=json)
 * @returns Promise that resolves to screenshot result with optional text
 * @throws Error if the API request fails
 */
export async function captureWebpageScreenshotWithText(
  url: string,
  extractText: boolean = false
): Promise<ScreenshotResult> {
  try {
    const formattedUrl = validateAndNormalizeUrl(url);
    const params = buildApiflashParams(formattedUrl, extractText);
    const apiUrl = `${APIFLASH_BASE_URL}?${params.toString()}`;

    // Make the API request
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Apiflash API error: ${response.status} ${response.statusText}`);
    }

    let imageBuffer: ArrayBuffer;
    let extractedText: string | undefined;

    if (extractText) {
      // Parse JSON response
      const jsonData: ApiflashJsonResponse = await response.json();
      
      // Validate JSON structure
      if (!jsonData.url || !jsonData.extracted_text) {
        throw new Error('Invalid JSON response from APIFlash: missing url or extracted_text fields');
      }

      // Fetch image from the cached URL
      const imageResponse = await fetch(jsonData.url);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image from cache: ${imageResponse.status} ${imageResponse.statusText}`);
      }
      imageBuffer = await imageResponse.arrayBuffer();

      // Fetch text content from the extracted_text URL
      try {
        const textResponse = await fetch(jsonData.extracted_text);
        if (!textResponse.ok) {
          // Continue without text if fetch fails
          extractedText = undefined;
        } else {
          extractedText = await textResponse.text();
          if (!extractedText || extractedText.trim().length === 0) {
            extractedText = undefined;
          }
        }
      } catch (textError: any) {
        logger.error('Error fetching extracted text:', textError);
        // Continue without text if fetch fails
        extractedText = undefined;
      }
    } else {
      // Get the image as ArrayBuffer (binary data) directly
      imageBuffer = await response.arrayBuffer();
    }

    return {
      image: imageBuffer,
      ...(extractedText && { text: extractedText }),
    };
  } catch (error: any) {
    logger.error('Error capturing webpage screenshot:', error);
    throw new Error(`Failed to capture webpage screenshot: ${error.message}`);
  }
}


/**
 * Builds query parameters for reference website screenshot (direct image endpoint)
 * Uses the same base parameters as other screenshot endpoints
 * @param formattedUrl - The normalized URL
 * @returns URLSearchParams with all query parameters
 */
function buildReferenceWebsiteParams(formattedUrl: string): URLSearchParams {
  return buildBaseApiflashParams(formattedUrl);
}

/**
 * Fetches a screenshot of a reference website using the Apiflash API (direct image endpoint)
 * This is separate from the existing screenshot functions and uses the direct image response
 * @param url - The URL of the reference website to screenshot
 * @returns Promise that resolves to the binary data of the PNG image
 * @throws Error if the API request fails
 */
export async function captureReferenceWebsiteScreenshot(url: string): Promise<ArrayBuffer> {
  try {
    const formattedUrl = validateAndNormalizeUrl(url);
    const params = buildReferenceWebsiteParams(formattedUrl);
    const apiUrl = `${APIFLASH_BASE_URL}?${params.toString()}`;

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Apiflash API error: ${response.status} ${response.statusText}`);
    }

    // Get the image as ArrayBuffer (binary data) directly
    const imageBuffer = await response.arrayBuffer();
    return imageBuffer;
  } catch (error: any) {
    logger.error('Error capturing reference website screenshot:', error);
    throw new Error(`Failed to capture reference website screenshot: ${error.message}`);
  }
}

// Re-export binary utility functions for convenience
export { arrayBufferToBase64 } from '../../utils/binaryUtils';
