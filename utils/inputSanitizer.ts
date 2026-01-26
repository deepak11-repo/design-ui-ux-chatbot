// File: ./utils/inputSanitizer.ts

/**
 * Security utilities for input sanitization and validation
 */

/**
 * Maximum length limits for user inputs
 */
export const INPUT_LIMITS = {
  EMAIL: 254, // RFC 5321
  URL: 2048, // Common browser limit
  TEXT_FIELD: 5000, // General text fields
  DESCRIPTION: 2000, // Descriptions
  BUSINESS_DESCRIPTION: 10000, // Business descriptions
  GOALS: 5000, // Business goals
  FEEDBACK: 5000, // User feedback
} as const;

/**
 * Sanitizes text input by removing potentially dangerous characters
 * Removes null bytes, control characters (except newlines/tabs), and trims
 * @param input - The input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x01-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars except \n, \t, \r
    .trim();
}

/**
 * Validates and sanitizes email address
 * @param email - Email address to validate
 * @returns Sanitized email if valid, null otherwise
 */
export function validateAndSanitizeEmail(email: string): string | null {
  const sanitized = sanitizeText(email);
  
  if (!sanitized || sanitized.length > INPUT_LIMITS.EMAIL) {
    return null;
  }

  // RFC 5322 compliant email regex (simplified but more strict than basic)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(sanitized)) {
    return null;
  }

  return sanitized.toLowerCase();
}

/**
 * Validates URL to prevent SSRF attacks
 * Only allows http:// and https:// protocols
 * @param url - URL to validate
 * @returns true if URL is safe, false otherwise
 */
export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const trimmed = url.trim();
  
  // Check length
  if (trimmed.length > INPUT_LIMITS.URL) {
    return false;
  }

  // Only allow http:// and https://
  if (!/^https?:\/\//i.test(trimmed)) {
    return false;
  }

  // Prevent localhost and private IP addresses (basic SSRF protection)
  try {
    const urlObj = new URL(trimmed);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Block localhost variations
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return false;
    }
    
    // Block private IP ranges (basic check)
    if (/^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(hostname)) {
      return false;
    }
    
    // Block .local domains
    if (hostname.endsWith('.local')) {
      return false;
    }
  } catch {
    // Invalid URL format
    return false;
  }

  return true;
}

/**
 * Validates and sanitizes text input with length limit
 * @param input - Text input to validate
 * @param maxLength - Maximum allowed length
 * @returns Sanitized text if valid, null otherwise
 */
export function validateAndSanitizeText(input: string, maxLength: number = INPUT_LIMITS.TEXT_FIELD): string | null {
  const sanitized = sanitizeText(input);
  
  if (!sanitized || sanitized.length > maxLength) {
    return null;
  }

  return sanitized;
}

/**
 * Sanitizes data for webhook payloads
 * Removes potentially dangerous characters and limits length
 * @param data - Data to sanitize
 * @returns Sanitized data
 */
export function sanitizeForWebhook(data: string): string {
  return sanitizeText(data).slice(0, INPUT_LIMITS.TEXT_FIELD);
}

/**
 * Validates URL and normalizes it safely
 * @param url - URL to validate and normalize
 * @returns Normalized URL if valid, null otherwise
 */
export function validateAndNormalizeUrl(url: string): string | null {
  const sanitized = sanitizeText(url);
  
  if (!sanitized) {
    return null;
  }

  // Normalize URL (add https:// if missing)
  let normalized: string;
  if (/^https?:\/\//i.test(sanitized)) {
    normalized = sanitized;
  } else {
    // Check if it looks like a domain
    const domainPattern = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/.*)?$/;
    if (domainPattern.test(sanitized) && !sanitized.includes(' ')) {
      normalized = `https://${sanitized}`;
    } else {
      return null;
    }
  }

  // Validate it's a safe URL
  if (!isSafeUrl(normalized)) {
    return null;
  }

  return normalized;
}
