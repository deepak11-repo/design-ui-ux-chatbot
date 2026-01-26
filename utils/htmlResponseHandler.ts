// File: ./utils/htmlResponseHandler.ts

/**
 * Shared helper for handling HTML generation responses
 * Consolidates duplicate HTML extraction and message creation logic
 */

import { extractHtmlFromResponse } from '../services/ai/htmlProcessor';
import { Message, MessageSender } from '../types';

/**
 * Result of HTML response handling
 */
export interface HtmlResponseResult {
  success: boolean;
  html?: string;
  message?: Message;
  error?: string;
}

/**
 * Processes HTML generation response and creates a message
 * @param htmlResponse - Raw HTML response from API
 * @param successMessage - Message to show when HTML is ready
 * @returns Result with success status, HTML content, and message
 */
export function processHtmlResponse(
  htmlResponse: string,
  successMessage: string = "Your webpage is ready! Here's a preview:"
): HtmlResponseResult {
  try {
    // Extract HTML from response
    const extractionResult = extractHtmlFromResponse(htmlResponse);
    
    if (!extractionResult.success) {
      return {
        success: false,
        error: extractionResult.error || 'Failed to extract HTML from response'
      };
    }
    
    // Create message with HTML preview
    const htmlMessage: Message = {
      id: `html-${Date.now()}`,
      text: successMessage,
      sender: MessageSender.BOT,
      htmlContent: extractionResult.html,
      isHtmlMessage: true,
    };
    
    return {
      success: true,
      html: extractionResult.html,
      message: htmlMessage
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to process HTML response'
    };
  }
}
