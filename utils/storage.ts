// File: ./utils/storage.ts

import { logger } from './logger';
import { sanitizeUserResponsesForStorage } from './storageSanitizer';

const STORAGE_KEY = 'designChatState';

export interface ChatState {
  messages: any[];
  currentPhase: any;
  userResponses: any;
  currentQuestionIndex: number;
}

/**
 * Loads chat state from localStorage
 * @returns ChatState or null if not found or invalid
 */
export const loadChatState = (): ChatState | null => {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (!savedState) return null;

    const parsedState = JSON.parse(savedState);
    const { messages, currentPhase, userResponses, currentQuestionIndex } = parsedState;

    // Validate parsed data structure
    if (Array.isArray(messages) && messages.length > 2) {
      return {
        messages,
        currentPhase: currentPhase || null,
        userResponses: userResponses || {},
        currentQuestionIndex: typeof currentQuestionIndex === 'number' ? currentQuestionIndex : 0,
      };
    }
    return null;
  } catch (error) {
    logger.error("Could not load chat state:", error);
    // Clear corrupted state
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (clearError) {
      logger.error("Could not clear corrupted chat state:", clearError);
    }
    return null;
  }
};

/**
 * Saves chat state to localStorage
 * @param state - The chat state to save
 * @returns true if successful, false otherwise
 */
export const saveChatState = (state: Omit<ChatState, 'userResponses'> & { userResponses: any }): boolean => {
  try {
    // Don't save File objects or large base64 images to localStorage (they can't be serialized or exceed quota)
    const { brandFiles, redesignBrandFiles, redesignScreenshotBase64, ...responsesToSave } = state.userResponses;
    
    // Sanitize user responses before storing (security: prevent XSS and ensure data integrity)
    const sanitizedResponses = sanitizeUserResponsesForStorage(responsesToSave);
    
    
    const chatState = JSON.stringify({
      messages: state.messages,
      currentPhase: state.currentPhase,
      userResponses: sanitizedResponses,
      currentQuestionIndex: state.currentQuestionIndex,
    });
    localStorage.setItem(STORAGE_KEY, chatState);
    return true;
  } catch (error) {
    logger.error("Could not save chat state:", error);
    // Handle quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      logger.error("LocalStorage quota exceeded. Clearing old state.");
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (clearError) {
        logger.error("Could not clear localStorage:", clearError);
      }
    }
    return false;
  }
};

/**
 * Clears chat state from localStorage
 */
export const clearChatState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    logger.error("Could not clear chat state:", error);
  }
};

/**
 * Session counter storage key
 */
const SESSION_COUNT_KEY = 'designChatSessionCount';
const MAX_SESSIONS = 2;

/**
 * Gets the current session count from localStorage
 * @returns Current session count (0-2), defaults to 0 if not set
 */
export const getSessionCount = (): number => {
  try {
    const count = localStorage.getItem(SESSION_COUNT_KEY);
    if (count === null) return 0;
    const parsedCount = parseInt(count, 10);
    return isNaN(parsedCount) ? 0 : Math.max(0, Math.min(parsedCount, MAX_SESSIONS));
  } catch (error) {
    logger.error("Could not get session count:", error);
    return 0;
  }
};

/**
 * Increments the session count in localStorage
 * @returns New session count after increment
 */
export const incrementSessionCount = (): number => {
  try {
    const currentCount = getSessionCount();
    const newCount = Math.min(currentCount + 1, MAX_SESSIONS);
    localStorage.setItem(SESSION_COUNT_KEY, newCount.toString());
    return newCount;
  } catch (error) {
    logger.error("Could not increment session count:", error);
    return getSessionCount(); // Return current count as fallback
  }
};

/**
 * Checks if the session limit has been reached
 * @returns true if session count >= MAX_SESSIONS, false otherwise
 */
export const isSessionLimitReached = (): boolean => {
  return getSessionCount() >= MAX_SESSIONS;
};

/**
 * Resets the session count to 0 (useful for testing or admin purposes)
 */
export const resetSessionCount = (): void => {
  try {
    localStorage.removeItem(SESSION_COUNT_KEY);
  } catch (error) {
    logger.error("Could not reset session count:", error);
  }
};

