// File: ./utils/referenceParser.ts

import { sanitizeText, INPUT_LIMITS } from './inputSanitizer';

/**
 * Parses the stored references/competitors string format into an array of entries
 * Format: "1. https://url.com - description\n2. https://url2.com - description"
 * Also supports: "https://url.com - description" (without numbering)
 * @param referencesString - The stored string from userResponses
 * @returns Array of {url: string, description: string} or empty array if invalid/empty
 */
export function parseReferencesString(referencesString: string | undefined): Array<{ url: string; description: string }> {
  if (!referencesString || !referencesString.trim()) {
    return [];
  }

  const entries: Array<{ url: string; description: string }> = [];
  const lines = referencesString.split('\n').filter(line => line.trim());

  // Unified regex pattern: matches both numbered and unnumbered entries
  // Pattern: optional number + dot + spaces, then URL, then " - ", then description
  const entryPattern = /^(?:\d+\.\s*)?(.+?)\s*-\s*(.+)$/;

  for (const line of lines) {
    const match = line.match(entryPattern);
    
    if (match) {
      const url = sanitizeText(match[1].trim()).slice(0, INPUT_LIMITS.URL);
      const description = sanitizeText(match[2].trim()).slice(0, INPUT_LIMITS.DESCRIPTION);
      
      // Only add if both URL and description are non-empty after sanitization
      if (url && description) {
        entries.push({ url, description });
      }
    }
  }

  return entries;
}
