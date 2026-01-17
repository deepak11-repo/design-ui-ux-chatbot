// File: ./utils/validation.ts

/**
 * Validates if a string contains valid URLs
 * @param text - The text to validate
 * @returns Array of found URLs or null if none found
 */
export const extractUrls = (text: string): string[] | null => {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const matches = text.match(urlRegex);
  return matches && matches.length > 0 ? matches : null;
};

/**
 * Validates if a string contains at least one URL
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

