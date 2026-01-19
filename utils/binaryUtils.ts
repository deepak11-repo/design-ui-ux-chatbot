// File: ./utils/binaryUtils.ts

/**
 * Converts ArrayBuffer to binary string representation
 * @param buffer - The ArrayBuffer to convert
 * @returns Binary string representation
 */
export function arrayBufferToBinaryString(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binaryString = '';
  for (let i = 0; i < bytes.length; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  return binaryString;
}

/**
 * Converts ArrayBuffer to base64 string
 * @param buffer - The ArrayBuffer to convert
 * @returns Base64 encoded string
 * @throws Error if conversion fails
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  try {
    const binaryString = arrayBufferToBinaryString(buffer);
    return btoa(binaryString);
  } catch (error: any) {
    throw new Error(`Failed to convert ArrayBuffer to base64: ${error.message}`);
  }
}

/**
 * Validates that the image buffer is within acceptable size limits
 * @param buffer - The image buffer to validate
 * @param maxSizeMB - Maximum size in MB (default: 7MB for Gemini API)
 * @throws Error if buffer exceeds size limit
 */
export function validateImageSize(buffer: ArrayBuffer, maxSizeMB: number = 7): void {
  const sizeMB = buffer.byteLength / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    throw new Error(`Image size (${sizeMB.toFixed(2)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`);
  }
}
