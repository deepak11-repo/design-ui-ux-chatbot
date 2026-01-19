// File: ./utils/auditParser.ts

/**
 * Parses the Gemini UI/UX audit response to extract individual issues
 * @param auditResponse - The raw text response from Gemini
 * @returns Array of issue descriptions
 */
export function parseAuditResponse(auditResponse: string): string[] {
  if (!auditResponse || !auditResponse.trim()) {
    return [];
  }

  // Split by lines and filter out empty lines and headers
  const lines = auditResponse
    .split('\n')
    .map(line => line.trim())
    .filter(line => {
      // Remove empty lines
      if (!line) return false;
      // Remove header lines (case-insensitive)
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('high impact:') || lowerLine === 'high impact') {
        return false;
      }
      // Remove lines that are just separators or formatting
      if (line.match(/^[-=]+$/)) {
        return false;
      }
      return true;
    })
    .filter(line => line.length > 0); // Double-check for empty strings

  // Return the issues (should be maximum 5)
  return lines.slice(0, 5);
}
