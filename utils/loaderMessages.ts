// File: ./utils/loaderMessages.ts

/**
 * User-friendly loader messages organized by loader type
 * Each type has 2-3 conversational messages that rotate randomly
 */

export type LoaderType =
  | 'analyzing_references'
  | 'reviewing_page'
  | 'generating_spec_new'
  | 'generating_spec_redesign'
  | 'generating_html_new'
  | 'generating_html_redesign'
  | 'processing_html'
  | 'preparing_html';

const LOADER_MESSAGES: Record<LoaderType, string[]> = {
  analyzing_references: [
    'Checking out your reference websites...',
    'Looking at your inspiration sites...',
    'Reviewing your reference examples...',
  ],
  reviewing_page: [
    'Taking a closer look at your page...',
    'Reviewing your current design...',
    'Analyzing your webpage...',
  ],
  generating_spec_new: [
    'Creating your webpage blueprint...',
    'Designing your page structure...',
    'Planning your website layout...',
  ],
  generating_spec_redesign: [
    'Planning your redesign...',
    'Creating your redesign blueprint...',
    'Designing your improved layout...',
  ],
  generating_html_new: [
    'Building your webpage...',
    'Putting your page together...',
    'Creating your website...',
  ],
  generating_html_redesign: [
    'Building your redesigned page...',
    'Putting your improvements together...',
    'Creating your new design...',
  ],
  processing_html: [
    'Finalizing your webpage...',
    'Polishing the details...',
    'Almost there...',
  ],
  preparing_html: [
    'Getting ready to build...',
    'Preparing everything...',
    'Setting things up...',
  ],
};

/**
 * Gets a random message for the specified loader type
 * @param type - The type of loader message needed
 * @returns A user-friendly, conversational message
 */
export function getLoaderMessage(type: LoaderType): string {
  const messages = LOADER_MESSAGES[type];
  if (!messages || messages.length === 0) {
    return 'Working on it...';
  }
  
  // Randomly select one of the available messages
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

/**
 * Gets a specific message by index (useful for cycling through messages)
 * @param type - The type of loader message needed
 * @param index - The index of the message to retrieve (0-based)
 * @returns A user-friendly, conversational message
 */
export function getLoaderMessageByIndex(type: LoaderType, index: number): string {
  const messages = LOADER_MESSAGES[type];
  if (!messages || messages.length === 0) {
    return 'Working on it...';
  }
  
  const normalizedIndex = index % messages.length;
  return messages[normalizedIndex];
}
