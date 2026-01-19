// File: ./services/prompts/redesignPrompt.ts

import { UserResponses } from '../../types';

/**
 * Builds the redesign prompt for generating a completely new webpage UI
 * using the redesign flow inputs.
 */
export function buildRedesignPrompt(userResponses: UserResponses): string {
  const {
    redesignAudience,
    redesignInspirationLinks,
    redesignCompetitors,
    redesignBrandDetails,
    redesignIssues,
  } = userResponses;

  const targetAudience = redesignAudience || 'Not provided';
  const referenceLinks = redesignInspirationLinks || 'None provided';
  const competitorLinks = redesignCompetitors || 'None provided';
  const brandLogoUrl = 'Not provided';
  const brandColorTheme =
    redesignBrandDetails && redesignBrandDetails.trim()
      ? redesignBrandDetails.trim()
      : 'Not provided';
  const imageAssetUrls = 'Not provided';

  const currentIssues = redesignIssues
    ? redesignIssues
        .split('|')
        .map((issue) => issue.trim())
        .filter(Boolean)
        .join('; ')
    : 'Not provided';

  return `You are a senior expert webpage UI designer. Your task is to design a completely new, contemporary webpage UI (not a minor refresh) using the inputs provided. You must output a single, production-ready HTML file that represents the redesigned webpage.

Goal: Produce a modern, fresh, conversion-ready design that fixes the listed UI/UX issues, aligns with the target audience and region, and incorporates contemporary UI polish and effects appropriate for 2026.

INPUT SECTION (PROVIDED BY APPLICATION)
Target Audience: ${targetAudience}
Reference Links (Optional): ${referenceLinks}
Competitor Links (Optional): ${competitorLinks}
Brand Logo (Optional): ${brandLogoUrl}
Brand Color Theme (Optional): ${brandColorTheme}
Image Assets (Optional): ${imageAssetUrls}
Current UI/UX Issues: ${currentIssues}

WEBSITE AND MARKET INTERPRETATION
1. If Reference Links includes the company website, analyze it to infer:
   - Business type and offering style (product, service, SaaS, portfolio, local business, enterprise)
   - Region and market expectations based on cues such as language, currency, location, and positioning
   - Current visual maturity level (basic, mid, premium)
2. If the company website link is missing, infer business type and region from Target Audience and other available inputs.

BRAND AND VISUAL SYSTEM RULES
1. If Brand Logo or Brand Color Theme is provided:
   - Use them as the foundation for the visual system.
2. If Brand Color Theme is not provided:
   - Select a color theme aligned with the inferred business type, target audience, and region.
3. Define a complete palette as CSS variables:
   - primary, secondary, accent, background, surface, text, mutedText, border, success, warning, error
4. Ensure readable contrast and accessibility-friendly states (focus rings, hover states, disabled states).

DESIGN REQUIREMENTS
1. Create a new page layout and component system that feels modern and premium.
2. Resolve all Current UI/UX Issues through explicit design changes reflected in the HTML/CSS/JS.
3. Ensure strong hierarchy, grid discipline, spacing rhythm, and component consistency.
4. Design must be responsive by design with mobile-first behavior and sensible breakpoints.
5. Include modern UI enhancements where appropriate without becoming distracting:
   - Subtle depth (layered surfaces, soft shadows, refined borders)
   - Micro-interactions (hover, focus, pressed, active states)
   - Restrained motion (subtle transitions, optional scroll reveals)
   - Contemporary navigation patterns (sticky header, section-aware navigation when relevant)
   - Accessibility states (clear focus rings, keyboard navigability assumptions)

ASSET HANDLING RULES
1. If Brand Logo URL is provided:
   - Use it in the header and footer. Provide appropriate sizing and clearspace.
2. If Image Assets are provided:
   - Use them purposefully (hero media, section visuals, thumbnails) and ensure responsive behavior.
3. If images are not provided:
   - Use inline SVG placeholders or CSS gradient placeholders. Do not leave broken images.

HTML OUTPUT REQUIREMENTS
1. Output must be a single HTML document.
2. Include all CSS in a single <style> block within the HTML.
3. Use minimal, dependency-free JavaScript only when needed for UX (for example: mobile nav toggle, scroll reveal, active nav highlighting). Put it in a single <script> block.
4. Do not use external libraries or CDNs.
5. Do not include long marketing copy. Use short, generic placeholder text where needed, focusing on layout and UI composition.
6. Include semantic HTML (header, main, section, nav, footer), proper ARIA labels where needed, and accessible focus styles.
7. Ensure the design looks modern by default on desktop and mobile.

MANDATORY PAGE CONTENT STRUCTURE (LAYOUT-FIRST)
Implement a complete, modern page structure that typically applies to the inferred business type, using neutral placeholders:
- Sticky header with responsive navigation and primary action button
- Hero section with CTA cluster and supporting visual area
- Value blocks/features as a responsive card grid
- Proof/trust section (logo strip or testimonial cards)
- Primary offer or service/product highlights section
- Secondary CTA band
- FAQ accordion (optional, if appropriate)
- Footer with structured links and brand area

OUTPUT FORMAT
Return only the HTML file content.
Do not include explanations, section headings, or any text outside the HTML.
Do not wrap the HTML in Markdown fences.`;
}
