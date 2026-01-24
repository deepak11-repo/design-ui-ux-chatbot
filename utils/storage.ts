// File: ./utils/storage.ts

import { logger } from './logger';

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
    // Don't save File objects to localStorage (they can't be serialized)
    const { brandFiles, redesignBrandFiles, ...responsesToSave } = state.userResponses;
    const chatState = JSON.stringify({
      messages: state.messages,
      currentPhase: state.currentPhase,
      userResponses: responsesToSave,
      currentQuestionIndex: state.currentQuestionIndex,
    });
    localStorage.setItem(STORAGE_KEY, chatState);
    return true;
  } catch (error) {
    logger.error("Could not save chat state:", error);
    // Handle quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      logger.warn("LocalStorage quota exceeded. Clearing old state.");
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

