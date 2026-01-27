// File: ./services/ai/htmlProcessor.ts

export interface HtmlExtractionResult {
  html: string;
  success: boolean;
  error?: string;
}

/**
 * Extracts and cleans HTML from LLM response
 * Finds content between <!DOCTYPE html> or <html> and </html>
 * Removes any text before or after these tags
 */
export function extractHtmlFromResponse(response: string): HtmlExtractionResult {
  if (!response || typeof response !== 'string') {
    return {
      html: '',
      success: false,
      error: 'Invalid response: response is empty or not a string',
    };
  }

  // Normalize the response (handle markdown code blocks if present)
  let normalizedResponse = response.trim();

  // Remove markdown code fences more aggressively
  // Handle various formats: ```html, ```, ```html\n, etc.
  // Strategy: Remove code fences that appear at line boundaries first, then handle any remaining
  
  // Remove opening code fences at start of lines (with optional language identifier)
  normalizedResponse = normalizedResponse.replace(/^```[a-z]*\s*\n?/gim, '');
  
  // Remove closing code fences at end of lines
  normalizedResponse = normalizedResponse.replace(/\n?\s*```\s*$/gim, '');
  
  // Remove any remaining standalone code fences (```html or ```) anywhere in the text
  // This handles cases where code fences appear mid-text or without proper line breaks
  normalizedResponse = normalizedResponse.replace(/```html\s*/gi, '');
  normalizedResponse = normalizedResponse.replace(/```\s*/g, '');
  
  // Clean up any remaining leading/trailing whitespace
  normalizedResponse = normalizedResponse.trim();

  // Find the start of HTML
  // Look for <!DOCTYPE html> or <html> (case-insensitive)
  const doctypeMatch = normalizedResponse.match(/<!DOCTYPE\s+html[^>]*>/i);
  const htmlStartMatch = normalizedResponse.match(/<html[^>]*>/i);

  let startIndex = -1;
  let htmlStartTag = '';

  if (doctypeMatch) {
    startIndex = doctypeMatch.index!;
    htmlStartTag = doctypeMatch[0];
  } else if (htmlStartMatch) {
    startIndex = htmlStartMatch.index!;
    htmlStartTag = htmlStartMatch[0];
  }

  if (startIndex === -1) {
    return {
      html: '',
      success: false,
      error: 'Could not find HTML start tag (<!DOCTYPE html> or <html>)',
    };
  }

  // Find the end of HTML (last </html> tag, case-insensitive)
  const htmlEndMatch = normalizedResponse.match(/<\/html>/i);
  if (!htmlEndMatch) {
    return {
      html: '',
      success: false,
      error: 'Could not find HTML end tag (</html>)',
    };
  }

  const endIndex = htmlEndMatch.index! + htmlEndMatch[0].length;

  // Extract the HTML content
  let extractedHtml = normalizedResponse.substring(startIndex, endIndex);

  // Final cleanup: Remove any markdown code fences that might have been captured within the HTML
  // This handles edge cases where code fences appear inside the HTML content
  extractedHtml = extractedHtml.replace(/```html\s*/gi, '');
  extractedHtml = extractedHtml.replace(/```\s*/g, '');

  // If we found <!DOCTYPE html> but not <html>, we need to add it
  if (doctypeMatch && !htmlStartMatch) {
    // Check if <html> tag exists after DOCTYPE
    const htmlTagAfterDoctype = extractedHtml.match(/<html[^>]*>/i);
    if (!htmlTagAfterDoctype) {
      // This is unusual but handle it gracefully
      extractedHtml = htmlStartTag + '\n<html>\n' + extractedHtml.substring(htmlStartTag.length);
    }
  }

  // Ensure we have a complete HTML structure
  if (!extractedHtml.includes('</html>')) {
    return {
      html: '',
      success: false,
      error: 'Extracted HTML is incomplete (missing closing </html> tag)',
    };
  }

  // Clean up any extra whitespace at the beginning/end
  extractedHtml = extractedHtml.trim();

  return {
    html: extractedHtml,
    success: true,
  };
}

/**
 * Validates that the extracted HTML is well-formed
 * Basic validation - checks for opening and closing html tags
 */
export function validateHtml(html: string): boolean {
  if (!html || html.trim().length === 0) {
    return false;
  }

  // Check for opening html tag
  const hasHtmlStart = /<html[^>]*>/i.test(html);
  
  // Check for closing html tag
  const hasHtmlEnd = /<\/html>/i.test(html);

  return hasHtmlStart && hasHtmlEnd;
}
