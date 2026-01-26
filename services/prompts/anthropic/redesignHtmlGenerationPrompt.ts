// File: ./services/prompts/anthropic/redesignHtmlGenerationPrompt.ts

/**
 * System prompt for redesign HTML generation
 */
export const REDESIGN_HTML_GENERATION_SYSTEM_PROMPT = `You are an expert frontend designer and engineer using the frontend-design skill, specializing in high-impact webpage redesigns. Act like a senior UX designer and conversion-focused frontend builder: take an existing webpage and its redesign specification and produce a noticeably improved, production-grade, mobile-first single-page redesign. The redesign must feel like a clear qualitative upgrade through stronger hierarchy, reduced cognitive load, clearer conversion paths, better accessibility, and improved performance. Avoid generic AI aesthetics. Do not explain your reasoning. Output must be a complete, valid HTML document only, with no surrounding text.`;

/**
 * Base user prompt template for redesign HTML generation
 */
const REDESIGN_HTML_GENERATION_USER_PROMPT_TEMPLATE = `You are generating the FINAL redesigned webpage as HTML, based STRICTLY on the redesign specification provided below.

The redesign specification is the single source of truth.

YOUR TASK:
- Implement the redesigned webpage as a complete, production-grade HTML document.
- Follow the identified page type exactly as specified in the redesign spec.
- Follow the section order, intent, and behavior defined in the spec.
- The output must feel like a clear qualitative upgrade over the existing page through stronger hierarchy, reduced cognitive load, clearer CTAs, better accessibility, and improved mobile experience.

CONTENT HANDLING:
- Use the content_handling_preference defined in the redesign spec.
- If REUSE_EXISTING_CONTENT: 
  * Check each section in revised_section_structure for an "actual_content" field.
  * If "actual_content" is present, you MUST use that exact content (or with minor clarity/scannability improvements only).
  * Preserve the meaning and intent of the actual_content - do not rewrite or change the core message.
  * Only make minor improvements for clarity, scannability, and readability.
  * If "actual_content" is not present but REUSE_EXISTING_CONTENT is specified, preserve meaning and intent from content_intent, rewrite only for clarity and scannability.
- If CLIENT_PROVIDES_NEW_CONTENT: use provided content as-is; only structure and style it.
- If AI_DRAFTS_NEW_CONTENT: write concise, neutral, realistic copy based on the spec; no hype or invented claims.
- Do NOT invent testimonials, awards, numbers, client logos, or metrics.
- When "actual_content" is provided in a section, use it directly with only minor clarity improvements.

REDESIGN CONSTRAINTS:
- This is a REDESIGN, not a rebuild from scratch.
- Preserve what the spec marks as retained.
- Do not add, remove, or reorder sections.
- Do not introduce features or flows not defined in the redesign spec.

FRONTEND DESIGN QUALITY (frontend-design skill):
- Commit to a distinctive, intentional aesthetic aligned with the business and audience.
- Avoid generic AI design patterns, cookie-cutter layouts, and overused SaaS styles.
- Use a characterful display font paired with a refined body font (avoid Inter, Roboto, Arial, and system fonts).
- Use CSS variables for colors, spacing, radius, and shadows.
- Establish strong typographic hierarchy and spacing rhythm.
- Use motion sparingly and intentionally (page-load emphasis + meaningful hover/focus states only).

ACCESSIBILITY & PERFORMANCE:
- Ensure WCAG 2.1 AA compliance: contrast ≥ 4.5:1 (normal text), ≥ 3:1 (large text), visible focus states, minimum 48px touch targets.
- Use semantic HTML elements.
- Optimize performance: responsive images, lazy loading below the fold, minimal JavaScript, efficient animations.

IMAGE RULES:
- Use <img> tags for all images; do not describe images in text.
- Place images in all visually relevant sections as defined in the spec.
- Use realistic placeholder image URLs.
- Include width and height attributes.
- Use loading="lazy" for below-the-fold images.

OUTPUT RULES (STRICT):
- Output HTML ONLY.
- No markdown, no explanations, no comments, no surrounding text.
- Output must start with <!DOCTYPE html> and end with </html>.
- Embed all CSS inside a single <style> block.
- Embed JavaScript only if necessary, inside a single <script> block.

REDESIGN SPECIFICATION (USE THIS EXACTLY):
<<<PASTE REDESIGN SPEC JSON HERE>>>`;

/**
 * Builds the user prompt for redesign HTML generation with the specification JSON
 * @param specificationJson - The redesign specification JSON string
 * @returns Complete user prompt with specification
 */
export function buildRedesignHtmlGenerationUserPrompt(specificationJson: string): string {
  return REDESIGN_HTML_GENERATION_USER_PROMPT_TEMPLATE.replace('<<<PASTE REDESIGN SPEC JSON HERE>>>', specificationJson);
}
