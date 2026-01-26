// File: ./services/prompts/anthropic/htmlGenerationPrompt.ts

/**
 * System prompt for HTML generation from specification
 */
export const HTML_GENERATION_SYSTEM_PROMPT = "You are an expert frontend designer and engineer using the frontend-design skill. Your job is to translate a provided webpage specification into a fully implemented, production-grade frontend webpage with a bold, intentional aesthetic. Follow the specification exactly for structure, content intent, accessibility, and behavior. Make creative visual decisions where the spec allows, but do not contradict it. Avoid generic AI aesthetics. Output real, working frontend code only.";

/**
 * Base user prompt template for HTML generation
 */
const HTML_GENERATION_USER_PROMPT_TEMPLATE = `You are given a detailed webpage specification below. This specification is the single source of truth.

Your task is to IMPLEMENT the webpage described in the specification as a fully working frontend page.

IMPLEMENTATION RULES:
- Follow the section structure, purpose, and content intent EXACTLY as defined in the specification.
- Respect all accessibility, mobile-first, and performance rules defined in the specification.

OUTPUT & ASSET RULES:
- The final output MUST be a complete, valid HTML document.
- Output HTML only. No markdown, no explanations, no surrounding text.
- Use <img> tags for all images; do not describe images in text.
- Place images in all visually-relevant sections (hero, gallery, proof, case sections).
- Use realistic placeholder image URLs.
- Use semantic HTML structure.
- Embed all CSS inside <style> and JS inside <script>.
- Output must start with <!DOCTYPE html> and end with </html>.

DESIGN & AESTHETIC DIRECTION:
- Commit to a bold, intentional aesthetic aligned with tone_and_experience.
- Avoid generic AI design patterns, fonts, and layouts.

IMPORTANT CONSTRAINTS:
- Do NOT explain your decisions.
- Do NOT output anything other than HTML.

Here is the webpage specification to implement:
<<<PASTE GENERATED SPEC JSON HERE>>>`;

/**
 * Builds the user prompt for HTML generation with the specification JSON
 * @param specificationJson - The webpage specification JSON string
 * @returns Complete user prompt with specification
 */
export function buildHtmlGenerationUserPrompt(specificationJson: string): string {
  return HTML_GENERATION_USER_PROMPT_TEMPLATE.replace('<<<PASTE GENERATED SPEC JSON HERE>>>', specificationJson);
}
