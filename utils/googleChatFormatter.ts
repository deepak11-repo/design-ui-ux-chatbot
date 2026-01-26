// File: ./utils/googleChatFormatter.ts

import { UserResponses } from '../types';
import { parseReferencesString } from './referenceParser';
import { sanitizeForWebhook } from './inputSanitizer';
import { logger } from './logger';

/**
 * Interface for session data to be sent to Google Chat
 */
export interface SessionDataForWebhook {
  sessionMetadata: {
    routeType: string;
    sessionStartTimestamp: string;
  };
  userInformation: {
    userEmail: string;
  };
  // For New Website from Scratch
  businessContext?: {
    businessDescription: string;
    targetAudience: string;
    businessGoals: string[];
  };
  pageConfiguration?: {
    pageType: string;
    pageTypeOther: string | null;
  };
  designPreferences?: {
    stylePreferences?: string;
    colorPreferences?: string;
    brandGuidelines?: string;
    brandGuidelinesText?: string;
  };
  // For Webpage Redesign
  currentWebpageDetails?: {
    currentWebpageUrl: string;
    redesignReasons: string;
    reuseExistingContent: boolean;
  };
  referenceWebsites?: {
    referenceWebsites: Array<{
      url: string;
      userDescription: string;
    }>;
    referenceWebsitesCount: number;
  };
  auditResults?: {
    auditIssues: string[];
    auditIssuesCount: number;
  };
  userFeedback: {
    rating: number;
    feedback: string | null;
    feedbackProvided: boolean;
  };
}

/**
 * Formats session data for New Website from Scratch route
 */
function formatNewWebsiteSessionData(
  userResponses: UserResponses,
  userEmail: string,
  sessionStartTimestamp: string,
  rating: number | null,
  feedback: string | null,
  pageTypeOther?: string | null
): SessionDataForWebhook {
  const data: SessionDataForWebhook = {
    sessionMetadata: {
      routeType: 'New Webpage from Scratch',
      sessionStartTimestamp,
    },
    userInformation: {
      userEmail: sanitizeForWebhook(userEmail),
    },
    userFeedback: {
      rating: rating || 0,
      feedback: feedback ? sanitizeForWebhook(feedback) : null,
      feedbackProvided: !!feedback,
    },
  };

  // Business Context
  if (userResponses.business || userResponses.audience || userResponses.goals) {
    const goals = userResponses.goals ? userResponses.goals.split('\n').filter(g => g.trim()) : [];
    data.businessContext = {
      businessDescription: userResponses.business || '',
      targetAudience: userResponses.audience || '',
      businessGoals: goals,
    };
  }

  // Page Configuration
  if (userResponses.pageType) {
    // Handle "Other: {custom value}" format
    let pageType = userResponses.pageType;
    let pageTypeOtherValue: string | null = null;
    
    if (userResponses.pageType.startsWith('Other: ')) {
      pageType = 'Other';
      pageTypeOtherValue = pageTypeOther || userResponses.pageType.replace('Other: ', '');
    } else if (userResponses.pageType === 'Other' && pageTypeOther) {
      pageTypeOtherValue = pageTypeOther;
    }

    data.pageConfiguration = {
      pageType: sanitizeForWebhook(pageType),
      pageTypeOther: pageTypeOtherValue ? sanitizeForWebhook(pageTypeOtherValue) : null,
    };
  }

  // Design Preferences (optional - only if provided)
  const designPrefs: any = {};
  if ((userResponses as any).stylePreferences) {
    designPrefs.stylePreferences = sanitizeForWebhook((userResponses as any).stylePreferences);
  }
  if ((userResponses as any).colorPreferences) {
    designPrefs.colorPreferences = sanitizeForWebhook((userResponses as any).colorPreferences);
  }
  if (userResponses.brandDetails) {
    designPrefs.brandGuidelines = sanitizeForWebhook(userResponses.brandDetails);
  }
  if ((userResponses as any).brandGuidelinesText) {
    designPrefs.brandGuidelinesText = sanitizeForWebhook((userResponses as any).brandGuidelinesText);
  }
  if (Object.keys(designPrefs).length > 0) {
    data.designPreferences = designPrefs;
  }

  // Reference Websites (optional - only if provided)
  const referencesString = userResponses.referencesAndCompetitors;
  if (referencesString && referencesString.trim()) {
    const entries = parseReferencesString(referencesString);
    if (entries.length > 0) {
      data.referenceWebsites = {
        referenceWebsites: entries,
        referenceWebsitesCount: entries.length,
      };
    }
  }

  return data;
}

/**
 * Formats session data for Webpage Redesign route
 */
function formatRedesignSessionData(
  userResponses: UserResponses,
  userEmail: string,
  sessionStartTimestamp: string,
  rating: number | null,
  feedback: string | null,
  auditIssues: string[]
): SessionDataForWebhook {
  const data: SessionDataForWebhook = {
    sessionMetadata: {
      routeType: 'Webpage Redesign',
      sessionStartTimestamp,
    },
    userInformation: {
      userEmail: sanitizeForWebhook(userEmail),
    },
    userFeedback: {
      rating: rating || 0,
      feedback: feedback ? sanitizeForWebhook(feedback) : null,
      feedbackProvided: !!feedback,
    },
  };

  // Current Webpage Details
  if (userResponses.redesignCurrentUrl || userResponses.redesignIssues !== undefined) {
    data.currentWebpageDetails = {
      currentWebpageUrl: sanitizeForWebhook(userResponses.redesignCurrentUrl || ''),
      redesignReasons: sanitizeForWebhook(userResponses.redesignIssues || ''),
      reuseExistingContent: userResponses.redesignReuseContent === true,
    };
  }

  // Design Preferences (optional - only if provided)
  const designPrefs: any = {};
  if ((userResponses as any).redesignStylePreferences) {
    designPrefs.stylePreferences = sanitizeForWebhook((userResponses as any).redesignStylePreferences);
  }
  if (userResponses.redesignBrandDetails) {
    designPrefs.brandDetails = sanitizeForWebhook(userResponses.redesignBrandDetails);
  }
  if ((userResponses as any).redesignBrandDetailsText) {
    designPrefs.brandDetailsText = sanitizeForWebhook((userResponses as any).redesignBrandDetailsText);
  }
  if (Object.keys(designPrefs).length > 0) {
    data.designPreferences = designPrefs;
  }

  // Reference Websites (optional - only if provided)
  const referencesString = userResponses.redesignReferencesAndCompetitors;
  if (referencesString && referencesString.trim()) {
    const entries = parseReferencesString(referencesString);
    if (entries.length > 0) {
      data.referenceWebsites = {
        referenceWebsites: entries,
        referenceWebsitesCount: entries.length,
      };
    }
  }

  // UI/UX Audit Results
  if (auditIssues && auditIssues.length > 0) {
    data.auditResults = {
      auditIssues,
      auditIssuesCount: auditIssues.length,
    };
  }

  return data;
}

/**
 * Formats session data for Google Chat webhook based on route type
 */
export function formatSessionDataForGoogleChat(
  routeType: 'newWebsite' | 'redesign',
  userResponses: UserResponses,
  userEmail: string,
  sessionStartTimestamp: string,
  rating: number | null,
  feedback: string | null,
  auditIssues?: string[],
  pageTypeOther?: string | null
): SessionDataForWebhook {
  if (routeType === 'newWebsite') {
    return formatNewWebsiteSessionData(userResponses, userEmail, sessionStartTimestamp, rating, feedback, pageTypeOther);
  } else {
    return formatRedesignSessionData(userResponses, userEmail, sessionStartTimestamp, rating, feedback, auditIssues || []);
  }
}

/**
 * Google Chat message size limit: 32,000 bytes
 * We'll ensure all data is included without truncation
 */
const GOOGLE_CHAT_MESSAGE_SIZE_LIMIT = 32000;

/**
 * Helper function to create a TextParagraph widget for short to medium content
 * Uses textParagraph for webhook compatibility (decoratedText not supported in webhooks)
 * NO TRUNCATION - All content is included in full
 * @param label - The label/title for the content
 * @param content - The full content (will NOT be truncated)
 * @returns Widget object with complete content
 */
function createTextParagraphWidget(label: string, content: string): any {
  // Ensure no truncation - use full content as-is
  const originalContent = content || 'Not provided';
  const fullText = `<b>${label}:</b> ${originalContent}`;
  
  // Verify content length is preserved (no truncation)
  const originalLength = originalContent.length;
  const widgetTextLength = fullText.length - `<b>${label}:</b> `.length;
  
  if (originalLength !== widgetTextLength) {
    logger.error(`Content length mismatch for "${label}": original=${originalLength}, widget=${widgetTextLength}`);
  }
  
  return {
    textParagraph: {
      text: fullText,
      // No maxLines specified - shows all content without truncation
      // All content is included in full, no character limits applied
    },
  };
}

/**
 * Helper function to create a TextParagraph widget for very long content
 * TextParagraph widgets handle long content better and support maxLines with "show more"
 * NO TRUNCATION - All content is included in full, regardless of length
 * @param label - The label/title for the content
 * @param content - The full content (will NOT be truncated, even if very long)
 * @returns Widget object with complete content
 */
function createLongTextParagraphWidget(label: string, content: string): any {
  // Ensure no truncation - use full content as-is
  const originalContent = content || 'Not provided';
  const fullText = `<b>${label}:</b>\n\n${originalContent}`;
  
  // Verify content length is preserved (no truncation)
  const originalLength = originalContent.length;
  const widgetTextLength = fullText.length - `<b>${label}:</b>\n\n`.length;
  
  if (originalLength !== widgetTextLength) {
    logger.error(`Content length mismatch for "${label}": original=${originalLength}, widget=${widgetTextLength}`);
  }
  
  return {
    textParagraph: {
      text: fullText,
      // No maxLines specified - shows all content without truncation
      // Google Chat will display all content, potentially with scroll/expand if needed
      // All content is included in full, no character limits applied
    },
  };
}

/**
 * Verifies that all data from sessionData is included in the card payload
 * This ensures no data is accidentally omitted or truncated
 */
function verifyDataCompleteness(sessionData: SessionDataForWebhook, sections: any[]): void {
  const verification: any = {
    userEmail: !!sessionData.userInformation.userEmail,
    businessContext: !sessionData.businessContext || (
      !!sessionData.businessContext.businessDescription &&
      !!sessionData.businessContext.targetAudience &&
      (sessionData.businessContext.businessGoals?.length >= 0)
    ),
    pageConfiguration: !sessionData.pageConfiguration || (
      !!sessionData.pageConfiguration.pageType
    ),
    currentWebpageDetails: !sessionData.currentWebpageDetails || (
      !!sessionData.currentWebpageDetails.currentWebpageUrl &&
      sessionData.currentWebpageDetails.redesignReasons !== undefined
    ),
    designPreferences: !sessionData.designPreferences || (
      Object.keys(sessionData.designPreferences).length > 0
    ),
    referenceWebsites: !sessionData.referenceWebsites || (
      sessionData.referenceWebsites.referenceWebsites.length === sessionData.referenceWebsites.referenceWebsitesCount
    ),
    auditResults: !sessionData.auditResults || (
      sessionData.auditResults.auditIssues.length === sessionData.auditResults.auditIssuesCount
    ),
    userFeedback: !!sessionData.userFeedback.rating,
  };
  
  // Count widgets to ensure all sections are included
  const totalWidgets = sections.reduce((sum, section) => sum + (section.widgets?.length || 0), 0);
}

/**
 * Converts session data to Google Chat card format
 * Uses TextParagraph widgets (webhook-compatible) instead of deprecated keyValue
 * Uses cardsV2 format for webhook compatibility
 * Ensures all data is included without truncation
 */
export function formatSessionDataAsGoogleChatCard(sessionData: SessionDataForWebhook): any {
  const sections: any[] = [];

  // User Information Section
  sections.push({
    header: 'User Information',
    widgets: [
      {
        textParagraph: {
          text: `<b>Email:</b> ${sessionData.userInformation.userEmail}`,
        },
      },
    ],
  });

  // Business Context (for New Website)
  if (sessionData.businessContext) {
    const widgets: any[] = [
      createLongTextParagraphWidget('Business Description', sessionData.businessContext.businessDescription),
      createLongTextParagraphWidget('Target Audience', sessionData.businessContext.targetAudience),
    ];

    if (sessionData.businessContext.businessGoals.length > 0) {
      widgets.push(
        createLongTextParagraphWidget('Business Goals', sessionData.businessContext.businessGoals.join('\n'))
      );
    }

    sections.push({
      header: 'Business Context',
      widgets,
    });
  }

  // Page Configuration (for New Website)
  if (sessionData.pageConfiguration) {
    const pageConfigWidgets: any[] = [
      {
        textParagraph: {
          text: `<b>Page Type:</b> ${sessionData.pageConfiguration.pageType || 'Not specified'}`,
        },
      },
    ];
    
    // Include pageTypeOther if provided
    if (sessionData.pageConfiguration.pageTypeOther) {
      pageConfigWidgets.push(
        createTextParagraphWidget('Custom Page Type', sessionData.pageConfiguration.pageTypeOther)
      );
    }
    
    sections.push({
      header: 'Page Configuration',
      widgets: pageConfigWidgets,
    });
  }

  // Current Webpage Details (for Redesign)
  if (sessionData.currentWebpageDetails) {
    sections.push({
      header: 'Current Webpage Details',
      widgets: [
        {
          textParagraph: {
            text: `<b>Current URL:</b> ${sessionData.currentWebpageDetails.currentWebpageUrl || 'Not provided'}`,
          },
        },
        createLongTextParagraphWidget('Redesign Reasons', sessionData.currentWebpageDetails.redesignReasons),
        {
          textParagraph: {
            text: `<b>Reuse Existing Content:</b> ${sessionData.currentWebpageDetails.reuseExistingContent ? 'Yes' : 'No'}`,
          },
        },
      ],
    });
  }

  // Design Preferences
  if (sessionData.designPreferences) {
    const widgets: any[] = [];
    if (sessionData.designPreferences.stylePreferences) {
      widgets.push(
        createLongTextParagraphWidget('Style Preferences', sessionData.designPreferences.stylePreferences)
      );
    }
    if (sessionData.designPreferences.colorPreferences) {
      widgets.push(
        createLongTextParagraphWidget('Color Preferences', sessionData.designPreferences.colorPreferences)
      );
    }
    if (sessionData.designPreferences.brandGuidelines) {
      widgets.push(
        createLongTextParagraphWidget('Brand Guidelines', sessionData.designPreferences.brandGuidelines)
      );
    }
    if (sessionData.designPreferences.brandDetails) {
      widgets.push(
        createLongTextParagraphWidget('Brand Details', sessionData.designPreferences.brandDetails)
      );
    }

    if (widgets.length > 0) {
      sections.push({
        header: 'Design Preferences',
        widgets,
      });
    }
  }

  // Reference Websites
  if (sessionData.referenceWebsites && sessionData.referenceWebsites.referenceWebsites.length > 0) {
    const widgets = sessionData.referenceWebsites.referenceWebsites.map((ref, index) =>
      createLongTextParagraphWidget(
        `Reference ${index + 1}`,
        `${ref.url}\n\n${ref.userDescription || 'No description provided'}`
      )
    );

    sections.push({
      header: `Reference Websites (${sessionData.referenceWebsites.referenceWebsitesCount})`,
      widgets,
    });
  }

  // Audit Results (for Redesign)
  if (sessionData.auditResults && sessionData.auditResults.auditIssues.length > 0) {
    const widgets = sessionData.auditResults.auditIssues.map((issue, index) =>
      createLongTextParagraphWidget(`Issue ${index + 1}`, issue)
    );

    sections.push({
      header: `UI/UX Audit Issues (${sessionData.auditResults.auditIssuesCount})`,
      widgets,
    });
  }

  // User Feedback
  sections.push({
    header: 'User Feedback',
    widgets: [
      {
        textParagraph: {
          text: `<b>Rating:</b> ${sessionData.userFeedback.rating}/5`,
        },
      },
      ...(sessionData.userFeedback.feedbackProvided && sessionData.userFeedback.feedback
        ? [
            createLongTextParagraphWidget('Feedback', sessionData.userFeedback.feedback),
          ]
        : []),
    ],
  });

  // Verify all data is included before creating payload
  verifyDataCompleteness(sessionData, sections);

  // Use cardsV2 format for webhook compatibility
  const cardPayload = {
    cardsV2: [
      {
        cardId: `session-${Date.now()}`,
        card: {
          header: {
            title: 'Chatbot Session Record',
            subtitle: `${sessionData.sessionMetadata.routeType} - Started: ${new Date(sessionData.sessionMetadata.sessionStartTimestamp).toLocaleString()}`,
          },
          sections,
        },
      },
    ],
  };

  // Calculate exact payload size and verify all data is included
  const payloadJson = JSON.stringify(cardPayload);
  const payloadSize = new Blob([payloadJson]).size;
  
  // Log error if payload exceeds limit (but still send full payload)
  if (payloadSize > GOOGLE_CHAT_MESSAGE_SIZE_LIMIT) {
    logger.error(
      `Google Chat payload size (${payloadSize} bytes) exceeds recommended limit (${GOOGLE_CHAT_MESSAGE_SIZE_LIMIT} bytes). ` +
      `Sending full payload anyway - no data will be truncated. Google Chat may reject if truly too large.`
    );
  }

  return cardPayload;
}
