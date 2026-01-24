// File: ./utils/logger.ts

/**
 * Development-only logger utility
 * In production, these logs are suppressed
 */
const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args);
  },
  
  warn: (...args: any[]) => {
    // Always log warnings, even in production
    console.warn(...args);
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  }
};
