// File: ./utils/webhookSender.ts

import { logger } from './logger';
import { getSessionId } from './sessionId';

const WEBHOOK_SENT_KEY_PREFIX = 'designChatWebhookSent_';

/**
 * Checks if webhook has already been sent for the current session
 * @param sessionId - The session ID to check
 * @returns true if webhook was already sent, false otherwise
 */
export function isWebhookAlreadySent(sessionId: string | null): boolean {
  if (!sessionId) return false;

  try {
    const flag = localStorage.getItem(`${WEBHOOK_SENT_KEY_PREFIX}${sessionId}`);
    return flag === 'true';
  } catch (error) {
    logger.error('Error checking webhook sent flag:', error);
    return false;
  }
}

/**
 * Marks webhook as sent for the current session
 * @param sessionId - The session ID
 */
export function markWebhookAsSent(sessionId: string | null): void {
  if (!sessionId) return;

  try {
    localStorage.setItem(`${WEBHOOK_SENT_KEY_PREFIX}${sessionId}`, 'true');
  } catch (error) {
    logger.error('Error marking webhook as sent:', error);
  }
}

/**
 * Sends session data to Google Chat webhook
 * @param payload - The Google Chat message payload (card format)
 * @returns true if successful, false otherwise
 */
export async function sendSessionRecordToGoogleChat(payload: any): Promise<boolean> {
  try {
    const webhookUrl = import.meta.env.VITE_GOOGLE_CHAT_WEBHOOK_URL;

    if (!webhookUrl || !webhookUrl.trim()) {
      return false;
    }

    // Check if webhook already sent for this session
    const sessionId = getSessionId();
    if (isWebhookAlreadySent(sessionId)) {
      return true; // Return true to indicate it was "handled" (even though we skipped)
    }

    // Calculate exact payload size before sending
    const payloadJson = JSON.stringify(payload);
    const payloadSize = new Blob([payloadJson]).size;

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payloadJson, // Send exact JSON string - no modifications
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText}. ${errorText}`);
    }

    // Mark as sent only on success
    markWebhookAsSent(sessionId);
    return true;
  } catch (error: any) {
    logger.error('Failed to send session record to Google Chat:', error);
    return false;
  }
}
