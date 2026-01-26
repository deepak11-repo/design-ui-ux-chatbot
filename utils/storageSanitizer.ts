// File: ./utils/storageSanitizer.ts

/**
 * Sanitizes user responses before storing in localStorage
 * Prevents XSS and ensures data integrity
 */

import { sanitizeText, validateAndSanitizeText, INPUT_LIMITS } from './inputSanitizer';
import { UserResponses } from '../types';

/**
 * Sanitizes a string value for storage
 */
function sanitizeString(value: string | undefined, maxLength: number = INPUT_LIMITS.TEXT_FIELD): string | undefined {
  if (!value) return value;
  return validateAndSanitizeText(value, maxLength) || undefined;
}

/**
 * Sanitizes user responses before storing in localStorage
 * @param userResponses - User responses to sanitize
 * @returns Sanitized user responses
 */
export function sanitizeUserResponsesForStorage(userResponses: any): Partial<UserResponses> {
  const sanitized: any = {};

  // Sanitize all string fields
  if (userResponses.business) {
    sanitized.business = sanitizeString(userResponses.business, INPUT_LIMITS.BUSINESS_DESCRIPTION);
  }
  if (userResponses.audience) {
    sanitized.audience = sanitizeString(userResponses.audience, INPUT_LIMITS.DESCRIPTION);
  }
  if (userResponses.goals) {
    sanitized.goals = sanitizeString(userResponses.goals, INPUT_LIMITS.GOALS);
  }
  if (userResponses.pageType) {
    sanitized.pageType = sanitizeString(userResponses.pageType);
  }
  if (userResponses.brandDetails) {
    sanitized.brandDetails = sanitizeString(userResponses.brandDetails, INPUT_LIMITS.DESCRIPTION);
  }
  if (userResponses.referencesAndCompetitors) {
    sanitized.referencesAndCompetitors = sanitizeString(userResponses.referencesAndCompetitors);
  }

  // Redesign fields
  if (userResponses.redesignCurrentUrl) {
    sanitized.redesignCurrentUrl = sanitizeString(userResponses.redesignCurrentUrl, INPUT_LIMITS.URL);
  }
  if (userResponses.redesignBusiness) {
    sanitized.redesignBusiness = sanitizeString(userResponses.redesignBusiness, INPUT_LIMITS.BUSINESS_DESCRIPTION);
  }
  if (userResponses.redesignAudience) {
    sanitized.redesignAudience = sanitizeString(userResponses.redesignAudience, INPUT_LIMITS.DESCRIPTION);
  }
  if (userResponses.redesignIssues) {
    sanitized.redesignIssues = sanitizeString(userResponses.redesignIssues, INPUT_LIMITS.DESCRIPTION);
  }
  if (userResponses.redesignBrandDetails) {
    sanitized.redesignBrandDetails = sanitizeString(userResponses.redesignBrandDetails, INPUT_LIMITS.DESCRIPTION);
  }
  if (userResponses.redesignReferencesAndCompetitors) {
    sanitized.redesignReferencesAndCompetitors = sanitizeString(userResponses.redesignReferencesAndCompetitors);
  }
  if (userResponses.redesignExtractedText) {
    // Extracted text can be longer, but still sanitize
    sanitized.redesignExtractedText = sanitizeString(userResponses.redesignExtractedText, INPUT_LIMITS.BUSINESS_DESCRIPTION * 2);
  }

  // Preserve non-string fields (booleans, arrays, etc.)
  const nonStringFields = [
    'hasBrand', 'brandDetailsMethod', 'hasInspiration', 'hasCompetitors',
    'referenceWebsiteAnalysis', 'redesignReferenceWebsiteAnalysis',
    'redesignReuseContent', 'redesignHasBrand', 'redesignBrandDetailsMethod',
    'redesignHasInspiration', 'redesignHasCompetitors', 'waitingForOtherInput'
  ];

  for (const field of nonStringFields) {
    if (userResponses[field] !== undefined) {
      sanitized[field] = userResponses[field];
    }
  }

  // Sanitize reference website analysis arrays
  if (userResponses.referenceWebsiteAnalysis && Array.isArray(userResponses.referenceWebsiteAnalysis)) {
    sanitized.referenceWebsiteAnalysis = userResponses.referenceWebsiteAnalysis.map((entry: any) => ({
      url: sanitizeString(entry.url, INPUT_LIMITS.URL),
      description: sanitizeString(entry.description, INPUT_LIMITS.DESCRIPTION),
      analysis: entry.analysis // JSON object, keep as-is
    }));
  }

  if (userResponses.redesignReferenceWebsiteAnalysis && Array.isArray(userResponses.redesignReferenceWebsiteAnalysis)) {
    sanitized.redesignReferenceWebsiteAnalysis = userResponses.redesignReferenceWebsiteAnalysis.map((entry: any) => ({
      url: sanitizeString(entry.url, INPUT_LIMITS.URL),
      description: sanitizeString(entry.description, INPUT_LIMITS.DESCRIPTION),
      analysis: entry.analysis // JSON object, keep as-is
    }));
  }

  return sanitized;
}
