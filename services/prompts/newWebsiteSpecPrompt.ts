// File: ./services/prompts/newWebsiteSpecPrompt.ts

import { UserResponses } from '../../types';

// Re-export from anthropic prompts for backward compatibility
export { SPECIFICATION_SYSTEM_PROMPT as NEW_WEBSITE_SYSTEM_PROMPT } from './anthropic/specificationPrompt';

/**
 * Base user prompt template
 */
const USER_PROMPT_TEMPLATE = `Generate a detailed webpage specification for a SINGLE webpage only, based on the structured inputs provided.

Inputs include:
- Business information
- Target audience
- Top 3 business goals
- Optional style or color preferences
- SELECTED PAGE TYPE (exactly one): landing page, homepage, product page, service page, portfolio page, or other
- Optional reference websites and extracted design signals

REQUIREMENTS:
- The specification must be strictly aligned to the selected page type and follow a mobile-first philosophy.
- Perform reference selection reasoning internally; do not expose reasoning, scores, or explanations.
- Use the PAGE-TYPE SECTION BLUEPRINTS below as the REQUIRED base for section_structure. You may remove sections if not relevant. You may only add a section if it clearly supports the user's goals AND fits the selected page type.
- Reference websites: apply extracted design signals ONLY when they match what the user explicitly liked. Ignore other extracted signals.
- WCAG 2.1 AA requirements: contrast minimum 4.5:1 for normal text and 3:1 for large text; minimum 48px touch targets; visible focus states for keyboard navigation.
- Do NOT generate HTML, CSS, components, or final marketing copy.
- Do NOT fabricate unknown specifics (exact font names, exact imagery, metrics). If unknown, set as "TBD" or provide 2–3 labeled options.

PAGE-TYPE SECTION BLUEPRINTS:
1) LANDING PAGE: Hero, Social Proof, Problem/Pain, Solution Overview, Benefits, How It Works, Feature Highlights, Use Cases, Testimonials, FAQ, Final CTA.
2) HOMEPAGE: Hero, What You Do, Primary Offerings, Why Choose Us, Proof, Featured Work, Process, Resources, FAQ, Footer CTA.
3) PRODUCT PAGE: Product Hero, Gallery/Preview, Key Benefits, Core Features, How It Works, Specs, Pricing/Plans, Reviews, FAQ, Final CTA.
4) SERVICE PAGE: Service Hero, Who It's For, Problems We Solve, Service Deliverables, Process, Proof, Packages, FAQ, Final CTA.
5) PORTFOLIO PAGE: Portfolio Hero, Work Gallery, Case Study Spotlights, Industries Served, Capabilities, Testimonials, Contact CTA.
6) OTHER: Propose a coherent single-page structure based on the user's goals; keep it focused and consistent.

OUTPUT FORMAT (VALID JSON ONLY):
- Output must start with '{' and end with '}'. No markdown.
- Keys required:
1) page_overview: {page_type, primary_goal, secondary_goals, success_criteria}
2) audience_context: {audience_summary, key_pain_points, key_objections, how_design_addresses_them}
3) section_structure: [{section_name, purpose, content_intent, key_elements, CTA_behavior, mobile_vs_desktop_layout_behavior}]
4) design_guidelines: {color_usage, typography_direction, layout_patterns, spacing_hierarchy, visual_emphasis, accessibility_requirements}
5) functional_elements: {buttons, forms, validation_and_error_states, navigation_if_applicable, micro_interactions}
6) tone_and_experience: {tone, trust_builders, clarity_principles, urgency_use_if_applicable}
7) constraints_and_notes: {single_page_scope, performance_best_practices, assumptions_and_TBDs}

Return JSON only.`;

/**
 * Builds the user prompt with all collected inputs (omits missing ones)
 * @param userResponses - All collected user responses
 * @returns Complete user prompt with inputs
 */
export function buildNewWebsiteUserPrompt(userResponses: UserResponses): string {
  const inputs: string[] = [];

  // Business information
  if (userResponses.business && userResponses.business.trim()) {
    inputs.push(`Business Information: ${userResponses.business.trim()}`);
  }

  // Target audience
  if (userResponses.audience && userResponses.audience.trim()) {
    inputs.push(`Target Audience: ${userResponses.audience.trim()}`);
  }

  // Top 3 business goals
  if (userResponses.goals && userResponses.goals.trim()) {
    inputs.push(`Top 3 Business Goals: ${userResponses.goals.trim()}`);
  }

  // Page type (required)
  if (userResponses.pageType && userResponses.pageType.trim()) {
    // Remove "Other: " prefix if present
    const pageType = userResponses.pageType.replace(/^Other:\s*/i, '').trim();
    // Normalize to lowercase for matching
    const normalizedPageType = pageType.toLowerCase();
    let selectedPageType = pageType;
    
    // Map to expected values
    if (normalizedPageType.includes('home') || normalizedPageType === 'home page') {
      selectedPageType = 'homepage';
    } else if (normalizedPageType.includes('landing') || normalizedPageType === 'landing page') {
      selectedPageType = 'landing page';
    } else if (normalizedPageType.includes('product') || normalizedPageType === 'product page') {
      selectedPageType = 'product page';
    } else if (normalizedPageType.includes('service') || normalizedPageType === 'service page') {
      selectedPageType = 'service page';
    } else if (normalizedPageType.includes('portfolio') || normalizedPageType === 'portfolio page') {
      selectedPageType = 'portfolio page';
    } else {
      selectedPageType = 'other';
    }
    
    inputs.push(`SELECTED PAGE TYPE: ${selectedPageType}`);
  }

  // Optional style or color preferences
  if (userResponses.brandDetails && userResponses.brandDetails.trim()) {
    inputs.push(`Style or Color Preferences: ${userResponses.brandDetails.trim()}`);
  }

  // Reference websites and extracted design signals
  if (userResponses.referenceWebsiteAnalysis && userResponses.referenceWebsiteAnalysis.length > 0) {
    const referenceData = userResponses.referenceWebsiteAnalysis.map((result, index) => {
      const analysis = result.analysis;
      let refInfo = `Reference Website ${index + 1}:\n`;
      refInfo += `- URL: ${result.url}\n`;
      refInfo += `- User Description (what they liked): ${result.description}\n`;
      
      // Include extracted design signals from analysis
      if (analysis) {
        if (analysis.colors && Array.isArray(analysis.colors) && analysis.colors.length > 0) {
          refInfo += `- Extracted Colors: ${JSON.stringify(analysis.colors)}\n`;
        }
        if (analysis.layout_notes) {
          refInfo += `- Layout Notes: ${analysis.layout_notes}\n`;
        }
        if (analysis.typography_notes) {
          refInfo += `- Typography Notes: ${analysis.typography_notes}\n`;
        }
        if (analysis.components_liked && Array.isArray(analysis.components_liked) && analysis.components_liked.length > 0) {
          refInfo += `- Components Liked: ${analysis.components_liked.join(', ')}\n`;
        }
        if (analysis.interaction_notes) {
          refInfo += `- Interaction Notes: ${analysis.interaction_notes}\n`;
        }
        if (analysis.design_principles && Array.isArray(analysis.design_principles) && analysis.design_principles.length > 0) {
          refInfo += `- Design Principles: ${analysis.design_principles.join(', ')}\n`;
        }
      }
      
      return refInfo;
    }).join('\n');
    
    inputs.push(`Reference Websites and Extracted Design Signals:\n${referenceData}`);
  } else if (userResponses.referencesAndCompetitors && userResponses.referencesAndCompetitors.trim()) {
    // Fallback to raw references if analysis not available
    inputs.push(`Reference/Competitor Websites: ${userResponses.referencesAndCompetitors.trim()}`);
  }

  // Build the complete user prompt
  const inputsSection = inputs.length > 0 
    ? `\n\nINPUTS PROVIDED:\n${inputs.join('\n\n')}`
    : '';

  return `${USER_PROMPT_TEMPLATE}${inputsSection}`;
}
