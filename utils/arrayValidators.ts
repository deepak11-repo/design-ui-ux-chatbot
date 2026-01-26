// File: ./utils/arrayValidators.ts

/**
 * Validates that an array contains only strings
 * @param array - The array to validate
 * @returns true if all elements are strings, false otherwise
 */
export function validateStringArray(array: any[]): boolean {
  if (!Array.isArray(array)) {
    return false;
  }
  
  for (const item of array) {
    if (typeof item !== 'string') {
      return false;
    }
  }
  
  return true;
}

/**
 * Validates that an array contains objects with specific required string properties
 * @param array - The array to validate
 * @param requiredProps - Array of required property names that must be strings
 * @returns true if all elements are objects with required string properties, false otherwise
 */
export function validateObjectArrayWithProps(
  array: any[],
  requiredProps: string[]
): boolean {
  if (!Array.isArray(array)) {
    return false;
  }
  
  for (const item of array) {
    if (!item || typeof item !== 'object') {
      return false;
    }
    
    for (const prop of requiredProps) {
      if (typeof item[prop] !== 'string') {
        return false;
      }
    }
  }
  
  return true;
}
