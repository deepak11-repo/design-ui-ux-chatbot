// File: ./services/ai/anthropic/index.ts

/**
 * Main export file for Anthropic AI services
 * Provides organized access to Sonnet and Opus model services
 */

// Re-export types
export type { AnthropicApiError } from './shared/types';

// Re-export Sonnet services
export { 
  generateSpecificationWithSonnet,
  generateRedesignSpecificationWithSonnet,
  generateHtmlFromSpecificationWithSonnet,
  generateHtmlFromRedesignSpecificationWithSonnet
} from './sonnetService';

// Re-export Opus services
export { 
  generateHtmlFromSpecificationWithOpus,
  generateHtmlFromRedesignSpecificationWithOpus
} from './opusService';

// Re-export fallback services
export {
  generateHtmlFromSpecificationWithFallback,
  generateHtmlFromRedesignSpecificationWithFallback
} from './htmlGenerationWithFallback';

// Re-export validation utility
export { validateAnthropicApiKey } from './shared/validation';
