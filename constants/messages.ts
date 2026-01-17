// File: ./constants/messages.ts

/**
 * Validation messages for empty responses
 */
export const VALIDATION_MESSAGES = {
  business: "Please tell me about your business. This information is important.",
  audience: "Please describe your target audience. This helps us design better for your users.",
  goals: "Please share your webpage goals. This helps us prioritize features and design elements.",
  brandDetails: "Please share details about your brand guidelines. This information helps us design according to your brand identity.",
  inspirationLinks: "I didn't detect any webpage links. Please paste the URLs (e.g., https://example.com).",
  competitors: "I didn't detect any webpage links. Please paste the URLs (e.g., https://example.com) or select 'I don't have any'.",
} as const;

/**
 * Messages for "Other" input handling
 */
export const OTHER_INPUT_MESSAGES = {
  role: {
    prompt: "Please tell me what your role is:",
    again: "I see you selected 'Other' again. Please type your actual role (e.g., 'Project Manager', 'Designer', etc.).",
    empty: "Please tell me what your role is. I need this information to continue.",
  },
  redesignRole: {
    prompt: "Please tell me what your role is:",
    again: "I see you selected 'Other' again. Please type your actual role (e.g., 'Project Manager', 'Designer', etc.).",
    empty: "Please tell me what your role is. I need this information to continue.",
  },
  pageType: {
    prompt: "Please tell me what type of page you want to create:",
    again: "I see you selected 'Other' again. Please type the actual page type you want to create (e.g., 'FAQ Page', 'Testimonials Page', etc.).",
    empty: "Please tell me what type of page you want to create. I need this information to continue.",
  },
  redesignIssues: {
    prompt: "Please tell us what else is not working with your current webpage:",
    again: "I see you selected 'Other' again. Please type what else is not working with your current webpage.",
    empty: "Please tell us what else is not working with your current webpage. I need this information to continue.",
  },
} as const;

/**
 * Completion message
 */
export const COMPLETION_MESSAGE = "Perfect! I've gathered all the information I need. Thank you for sharing these details with me. Our team will review your requirements and get back to you soon!";

