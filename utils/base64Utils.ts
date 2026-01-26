// File: ./utils/base64Utils.ts

/**
 * Sanitizes base64 string by removing data URI prefix if present
 * The Gemini API expects raw base64 data only, not data URIs
 * @param base64String - Base64 string that may include data URI prefix
 * @returns Clean base64 string without prefix
 * @example
 * sanitizeBase64('data:image/png;base64,iVBORw0KG...') // Returns 'iVBORw0KG...'
 * sanitizeBase64('iVBORw0KG...') // Returns 'iVBORw0KG...' (unchanged)
 */
export function sanitizeBase64(base64String: string): string {
  if (!base64String || typeof base64String !== 'string') {
    return base64String;
  }
  
  // Remove data URI prefix if present (e.g., "data:image/png;base64,")
  // This regex matches: data:image/<any-word>;base64,
  return base64String.replace(/^data:image\/\w+;base64,/, '');
}
