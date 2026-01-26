// File: ./services/prompts/anthropic/redesignSpecificationPrompt.ts

import { UserResponses } from '../../../types';

/**
 * System prompt for redesign specification generation
 */
export const REDESIGN_SPECIFICATION_SYSTEM_PROMPT = `You are a senior UX designer and product strategist specializing in high-impact webpage redesigns. Act like an expert website designer: analyze an existing webpage and produce a clean, practical redesign blueprint for ONE specific page. The redesigned page must feel like a clear qualitative upgrade over the current version through improved clarity, stronger hierarchy, reduced cognitive load, better accessibility, and a more focused conversion path. Prioritize WCAG 2.1 AA accessibility, mobile-first design, and performance-centric best practices. Do not guess unknown details, do not explain reasoning, and do not write code or marketing copy. Output must be valid JSON only with no surrounding text.`;

/**
 * Base user prompt template for redesign specification
 */
const REDESIGN_USER_PROMPT_TEMPLATE = `Generate a detailed REDESIGN specification for a SINGLE existing webpage, based on the structured inputs provided.

Inputs include:
- Current webpage URL
- Screenshot of the current webpage (if provided)
- Existing webpage content (if user requested to reuse content - the actual extracted text will be provided)
- Business information
- Target audience
- Primary goal of the page
- Reasons for redesign (what is not working and why)
- Known constraints (content that must stay, branding limitations, platform or technical constraints if any)
- Optional style or direction preferences
- Optional reference websites and notes on what the user explicitly likes about them

Your task:
- Treat this strictly as a REDESIGN, not a rebuild from scratch.
- Identify the page type of the current webpage (landing page, homepage, product page, service page, portfolio page, or other) based on the URL, screenshot, and context provided.
- The identified page type must be explicitly stated in the output and used consistently to guide all redesign decisions.
- The redesigned page must feel like a clear qualitative upgrade over the existing page, not just a visual change.
- Diagnose what is currently failing and map each issue to a specific structural, layout, or design improvement.
- Preserve what is working unless it directly conflicts with the redesign goals.
- Use the screenshot ONLY to understand visual hierarchy, layout, spacing, contrast, and usability issues.
- If existing webpage content is provided (user requested to reuse content), you MUST include the actual content in the "actual_content" field of each relevant section. Preserve meaning and intent, but allow minor clarity improvements for scannability.
- Prioritize user-stated goals, problems, and constraints over observations from the screenshot.
- Perform reference selection reasoning internally; do not expose reasoning, scores, or explanations.
- Use reference websites ONLY for the elements the user explicitly liked.
- Do NOT generate HTML, CSS, components, or final marketing copy.
- Do NOT invent unknown business details, metrics, or assumptions.

OUTPUT FORMAT (VALID JSON ONLY):

1. page_overview
- current_page_url
- page_type (explicitly identified as one of: landing, homepage, product, service, portfolio, or other)
- primary_goal
- redesign_objective (what success looks like after the redesign)

2. current_page_diagnosis
- what_is_not_working
- why_it_is_not_working (clarity, hierarchy, trust, accessibility, performance, focus)
- what_can_be_retained

3. audience_context
- target_audience_summary
- user_expectations
- key_objections_or_friction_points

4. redesign_strategy
- core_strategy_shift (e.g., clarity-first, conversion-first, trust-first)
- hierarchy_and_messaging_changes
- layout_and_flow_improvements

5. revised_section_structure
- ORDERED list of sections for the redesigned page, appropriate to the identified page type
- For each section include:
  - section_name
  - change_type (retain / modify / remove / add)
  - purpose
  - content_intent (description of what content should convey)
  - actual_content (REQUIRED if user requested to reuse existing content - include the actual text content from the extracted content provided. Map the extracted content to appropriate sections. Preserve meaning and intent, but allow minor clarity improvements for scannability. This field will be used directly in HTML generation, so include the complete, usable content text)
  - key_elements
  - CTA_behavior (if applicable)
  - mobile_vs_desktop_behavior

6. design_guidelines
- color_usage (respect existing brand unless change is requested)
- typography_direction (evolution, not arbitrary replacement)
- layout_patterns
- spacing_and_hierarchy
- accessibility_requirements (WCAG 2.1 AA)

7. functional_and_interaction_updates
- CTA improvements
- form or interaction changes
- navigation or scroll behavior updates (if applicable)

8. constraints_and_notes
- elements_that_must_not_change
- technical_or_platform_constraints
- assumptions_marked_TBD

RULES:
- This is a redesign of ONE existing webpage only.
- The identified page type must not change during the redesign.
- Do not propose a full website overhaul.
- Do not add features or sections unrelated to the page goal or page type.
- If a redesign decision does not clearly improve clarity, focus, accessibility, or ease of action compared to the current page, it should be avoided.
- No explanations, no reasoning, no code.
- Output must start with '{' and end with '}'.`;

/**
 * Builds the user prompt for redesign specification with all collected inputs
 * @param userResponses - All collected user responses including redesign-specific data
 * @returns Complete user prompt with inputs
 */
export function buildRedesignSpecificationUserPrompt(userResponses: UserResponses): string {
  const inputs: string[] = [];

  // Current webpage URL
  if (userResponses.redesignCurrentUrl && userResponses.redesignCurrentUrl.trim()) {
    inputs.push(`Current Webpage URL: ${userResponses.redesignCurrentUrl.trim()}`);
  }

  // Screenshot note (image will be included separately in API call)
  inputs.push(`Screenshot of the current webpage: Provided as image attachment`);

  // Business information
  if (userResponses.redesignBusiness && userResponses.redesignBusiness.trim()) {
    inputs.push(`Business Information: ${userResponses.redesignBusiness.trim()}`);
  }

  // Target audience
  if (userResponses.redesignAudience && userResponses.redesignAudience.trim()) {
    inputs.push(`Target Audience: ${userResponses.redesignAudience.trim()}`);
  }

  // Primary goal (can be inferred from business/audience if not explicitly provided)
  // For redesign, the primary goal is typically to fix issues and improve conversion
  const primaryGoal = userResponses.redesignIssues 
    ? `Fix identified UI/UX issues and improve user experience`
    : `Improve user experience and conversion`;
  inputs.push(`Primary Goal of the Page: ${primaryGoal}`);

  // Reasons for redesign (UI/UX issues)
  if (userResponses.redesignIssues && userResponses.redesignIssues.trim()) {
    const issues = userResponses.redesignIssues
      .split('|')
      .map((issue) => issue.trim())
      .filter(Boolean)
      .join('; ');
    inputs.push(`Reasons for Redesign (What is not working): ${issues}`);
  }

  // Known constraints and extracted content (if reuse content is requested)
  const constraints: string[] = [];
  if (userResponses.redesignReuseContent === true) {
    constraints.push('Content must be retained (user requested to reuse existing content)');
    
    // Include extracted text content if available
    if (userResponses.redesignExtractedText && userResponses.redesignExtractedText.trim()) {
      inputs.push(`EXISTING WEBPAGE CONTENT (MUST BE REUSED):\n${userResponses.redesignExtractedText.trim()}\n\nInclude the actual content from the extracted text in the "actual_content" field of each relevant section in revised_section_structure. Preserve meaning and intent, with minor clarity improvements only.`);
    } else {
      inputs.push(`User requested to reuse existing content, but extracted content is not available. Use the screenshot to identify content sections and preserve their meaning.`);
    }
  }
  if (constraints.length > 0) {
    inputs.push(`Known Constraints: ${constraints.join('; ')}`);
  }

  // Optional style or direction preferences
  if (userResponses.redesignBrandDetails && userResponses.redesignBrandDetails.trim()) {
    inputs.push(`Style or Direction Preferences: ${userResponses.redesignBrandDetails.trim()}`);
  }

  // Reference websites and extracted design signals
  if (userResponses.redesignReferenceWebsiteAnalysis && userResponses.redesignReferenceWebsiteAnalysis.length > 0) {
    const referenceData = userResponses.redesignReferenceWebsiteAnalysis.map((result, index) => {
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
    
    inputs.push(`Reference Websites and Notes:\n${referenceData}`);
  } else if (userResponses.redesignReferencesAndCompetitors && userResponses.redesignReferencesAndCompetitors.trim()) {
    // Fallback to raw references if analysis not available
    inputs.push(`Reference/Competitor Websites: ${userResponses.redesignReferencesAndCompetitors.trim()}`);
  }

  // Build the complete user prompt
  const inputsSection = inputs.length > 0 
    ? `\n\nINPUTS PROVIDED:\n${inputs.join('\n\n')}`
    : '';

  return `${REDESIGN_USER_PROMPT_TEMPLATE}${inputsSection}`;
}

/**
 * Builds a combined prompt for Gemini (which doesn't use separate system/user prompts)
 * Combines the system prompt and user prompt into a single prompt string
 * @param userResponses - All collected user responses including redesign-specific data
 * @returns Complete prompt string for Gemini
 */
export function buildRedesignSpecificationPromptForGemini(userResponses: UserResponses): string {
  const systemPrompt = REDESIGN_SPECIFICATION_SYSTEM_PROMPT;
  const userPrompt = buildRedesignSpecificationUserPrompt(userResponses);
  
  // Combine system and user prompts for Gemini
  return `${systemPrompt}\n\n${userPrompt}`;
}
