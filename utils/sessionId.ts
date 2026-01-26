// File: ./utils/sessionId.ts

import { logger } from './logger';

const SESSION_ID_KEY = 'designChatSessionId';
const SESSION_START_TIMESTAMP_KEY = 'designChatSessionStartTimestamp';

/**
 * Generates a unique session ID
 * @returns Session ID string (timestamp-based UUID format)
 */
function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${random}`;
}

/**
 * Gets or generates a session ID and stores it in localStorage
 * @returns Current session ID
 */
export function getOrCreateSessionId(): string {
  try {
    let sessionId = localStorage.getItem(SESSION_ID_KEY);
    
    if (!sessionId) {
      sessionId = generateSessionId();
      localStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    
    return sessionId;
  } catch (error) {
    logger.error('Error getting/creating session ID:', error);
    // Fallback: generate ID without storing
    return generateSessionId();
  }
}

/**
 * Gets the current session ID without creating a new one
 * @returns Session ID or null if not set
 */
export function getSessionId(): string | null {
  try {
    return localStorage.getItem(SESSION_ID_KEY);
  } catch (error) {
    logger.error('Error getting session ID:', error);
    return null;
  }
}

/**
 * Sets the session start timestamp
 * @param timestamp - ISO 8601 timestamp string (optional, defaults to now)
 */
export function setSessionStartTimestamp(timestamp?: string): void {
  try {
    const timestampToStore = timestamp || new Date().toISOString();
    localStorage.setItem(SESSION_START_TIMESTAMP_KEY, timestampToStore);
  } catch (error) {
    logger.error('Error setting session start timestamp:', error);
  }
}

/**
 * Gets the session start timestamp
 * @returns ISO 8601 timestamp string or null if not set
 */
export function getSessionStartTimestamp(): string | null {
  try {
    return localStorage.getItem(SESSION_START_TIMESTAMP_KEY);
  } catch (error) {
    logger.error('Error getting session start timestamp:', error);
    return null;
  }
}

/**
 * Clears session ID and start timestamp (called when starting new chat)
 */
export function clearSessionData(): void {
  try {
    localStorage.removeItem(SESSION_ID_KEY);
    localStorage.removeItem(SESSION_START_TIMESTAMP_KEY);
  } catch (error) {
    logger.error('Error clearing session data:', error);
  }
}
