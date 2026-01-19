// File: ./services/api/apiflashService.ts

import { arrayBufferToBinaryString, arrayBufferToBase64, validateImageSize } from '../../utils/binaryUtils';

const APIFLASH_ACCESS_KEY = '7076c97250914b6fb1e9af79784e4ce0';
const APIFLASH_BASE_URL = 'https://api.apiflash.com/v1/urltoimage';
const MAX_IMAGE_SIZE_MB = 7; // Gemini API limit

/**
 * Fetches a screenshot of a webpage using the Apiflash API
 * @param url - The URL of the webpage to screenshot
 * @returns Promise that resolves to the binary data of the PNG image
 * @throws Error if the API request fails
 */
export async function captureWebpageScreenshot(url: string): Promise<ArrayBuffer> {
  try {
    // Validate URL
    if (!url || !url.trim()) {
      throw new Error('URL is required');
    }

    // Ensure URL is properly formatted
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    // Build API URL with query parameters
    const params = new URLSearchParams({
      access_key: APIFLASH_ACCESS_KEY,
      url: formattedUrl,
      format: 'png',
      width: '1920',
      height: '1080',
      fresh: 'true',
      delay: '5',
      scroll_page: 'true',
      no_cookie_banners: 'true',
      no_ads: 'true',
      no_tracking: 'true',
      scale_factor: '1',
      wait_until: 'page_loaded',
    });

    const apiUrl = `${APIFLASH_BASE_URL}?${params.toString()}`;

    // Make the API request
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Apiflash API error: ${response.status} ${response.statusText}`);
    }

    // Get the image as ArrayBuffer (binary data)
    const imageBuffer = await response.arrayBuffer();

    // Validate image size before returning
    validateImageSize(imageBuffer, MAX_IMAGE_SIZE_MB);

    return imageBuffer;
  } catch (error: any) {
    console.error('Error capturing webpage screenshot:', error);
    throw new Error(`Failed to capture webpage screenshot: ${error.message}`);
  }
}

// Re-export binary utility functions for convenience
export { arrayBufferToBinaryString, arrayBufferToBase64 } from '../../utils/binaryUtils';
