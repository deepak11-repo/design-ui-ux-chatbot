// File: ./utils/responseHelpers.ts

/**
 * Constants for multi-select storage
 */
export const MULTI_SELECT_DELIMITER = '|';

/**
 * Checks if response is "I don't have any"
 */
export const isIDontHaveAny = (response: string): boolean => {
  const normalized = response.trim().toLowerCase();
  return normalized === "i don't have any" || response.trim() === "I don't have any";
};

/**
 * Validates that a response is not empty
 */
export const validateNonEmpty = (response: string, errorMessage: string): string | null => {
  const trimmed = response.trim();
  if (!trimmed) {
    return errorMessage;
  }
  return null;
};

/**
 * Parses multi-select values from stored string
 */
export const parseMultiSelect = (storedValue: string | undefined): string[] => {
  if (!storedValue) return [];
  return storedValue
    .split(MULTI_SELECT_DELIMITER)
    .map((item) => item.trim())
    .filter(Boolean);
};

/**
 * Joins multi-select values into storage string
 */
export const joinMultiSelect = (values: string[]): string => {
  return values.filter(Boolean).join(MULTI_SELECT_DELIMITER);
};

/**
 * Toggles an option in a multi-select list
 */
export const toggleMultiSelectOption = (
  storedValue: string | undefined,
  option: string,
  options: string[]
): string => {
  const existing = parseMultiSelect(storedValue);
  
  // Check if option is already selected (handle "Other" and "Other: [text]" cases)
  const isAlreadySelected = existing.some(item => {
    if (option === 'Other') {
      return item === 'Other' || item.startsWith('Other: ');
    }
    return item === option;
  });
  
  if (isAlreadySelected) {
    // Remove the option (toggle off)
    const filtered = existing.filter(item => {
      if (option === 'Other') {
        return item !== 'Other' && !item.startsWith('Other: ');
      }
      return item !== option;
    });
    return joinMultiSelect(filtered);
  } else {
    // Add the option (toggle on)
    existing.push(option);
    return joinMultiSelect(existing);
  }
};

/**
 * Normalizes multi-select values for display matching
 * Converts "Other: [text]" to "Other" for UI matching
 */
export const normalizeMultiSelectForDisplay = (values: string[]): string[] => {
  return values.map((item) => {
    if (item.startsWith('Other: ')) {
      return 'Other';
    }
    return item;
  });
};
