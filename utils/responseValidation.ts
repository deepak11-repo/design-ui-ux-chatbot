// File: ./utils/responseValidation.ts

import { validateNonEmpty } from './responseHelpers';
import { MessageSender } from '../types';

/**
 * Validates a response and adds an error message if validation fails
 * @param response - The user's response to validate
 * @param errorMessage - The error message to show if validation fails
 * @param addMessage - Function to add error message to chat
 * @returns true if validation passed, false if it failed
 */
export function validateAndHandleError(
  response: string,
  errorMessage: string,
  addMessage: (text: string, sender: MessageSender) => void
): boolean {
  const validationError = validateNonEmpty(response, errorMessage);
  if (validationError) {
    addMessage(validationError, MessageSender.BOT);
    return false;
  }
  return true;
}

/**
 * Validates a response and trims it, returning null if validation fails
 * @param response - The user's response to validate
 * @param errorMessage - The error message to show if validation fails
 * @param addMessage - Function to add error message to chat
 * @returns Trimmed response if valid, null if invalid
 */
export function validateAndTrim(
  response: string,
  errorMessage: string,
  addMessage: (text: string, sender: MessageSender) => void
): string | null {
  if (!validateAndHandleError(response, errorMessage, addMessage)) {
    return null;
  }
  return response.trim();
}
