// File: ./utils/validation.ts

/**
 * Normalizes a URL by prepending https:// if it's a domain-only input
 * @param url - The URL string to normalize
 * @returns Normalized URL with protocol if needed
 */
export const normalizeUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  
  // If it already has a protocol, return as-is
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  
  // Check if it looks like a domain (contains at least one dot and no spaces)
  // Pattern: domain.com, www.domain.com, subdomain.domain.com, etc.
  const domainPattern = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/.*)?$/;
  if (domainPattern.test(trimmed) && !trimmed.includes(' ')) {
    return `https://${trimmed}`;
  }
  
  // Return as-is if it doesn't match domain pattern
  return trimmed;
};

/**
 * Normalizes all URLs in a text string
 * @param text - The text containing URLs
 * @returns Text with normalized URLs
 */
export const normalizeUrlsInText = (text: string): string => {
  // Split by common delimiters (space, comma, newline, pipe)
  const parts = text.split(/(\s+|,|\n|\|)/);
  return parts.map(part => {
    // Only normalize parts that look like URLs/domains
    if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(part.trim()) && !part.includes(' ')) {
      return normalizeUrl(part);
    }
    return part;
  }).join('');
};

/**
 * Validates if a string contains valid URLs (including domain-only patterns)
 * @param text - The text to validate
 * @returns Array of found URLs or null if none found
 */
export const extractUrls = (text: string): string[] | null => {
  // First, try to find URLs with protocol
  const urlRegex = /(https?:\/\/[^\s,|]+)/gi;
  const protocolMatches = text.match(urlRegex);
  
  // Also check for domain-only patterns
  const domainPattern = /([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/[^\s,|]*)?/gi;
  const domainMatches = text.match(domainPattern);
  
  // Combine and deduplicate
  const allMatches = [
    ...(protocolMatches || []),
    ...(domainMatches || [])
  ].filter((url, index, self) => {
    // Remove duplicates and filter out URLs that are already in protocol matches
    const normalized = normalizeUrl(url);
    return self.findIndex(u => normalizeUrl(u) === normalized) === index;
  });
  
  return allMatches.length > 0 ? allMatches : null;
};

/**
 * Validates if a string contains at least one URL (including domain-only patterns)
 * @param text - The text to validate
 * @returns true if URLs are found, false otherwise
 */
export const hasUrls = (text: string): boolean => {
  return extractUrls(text) !== null;
};

/**
 * Validates file type against accepted types
 * @param file - The file to validate
 * @param acceptedTypes - Comma-separated string of accepted types (e.g., "image/*,.pdf,.doc")
 * @returns true if file type is accepted, false otherwise
 */
export const isValidFileType = (file: File, acceptedTypes: string): boolean => {
  const types = acceptedTypes.split(',').map(type => type.trim());
  
  return types.some(type => {
    if (type.endsWith('/*')) {
      // Match MIME type prefix (e.g., "image/*" matches "image/png", "image/jpeg")
      const prefix = type.slice(0, -1);
      return file.type.startsWith(prefix);
    } else if (type.startsWith('.')) {
      // Match file extension (e.g., ".pdf")
      return file.name.toLowerCase().endsWith(type.toLowerCase());
    } else {
      // Exact MIME type match
      return file.type === type;
    }
  });
};

/**
 * Validates file size
 * @param file - The file to validate
 * @param maxSizeBytes - Maximum file size in bytes (default: 10MB)
 * @returns true if file size is valid, false otherwise
 */
export const isValidFileSize = (file: File, maxSizeBytes: number = 10 * 1024 * 1024): boolean => {
  return file.size <= maxSizeBytes;
};

/**
 * Formats file size for display
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

