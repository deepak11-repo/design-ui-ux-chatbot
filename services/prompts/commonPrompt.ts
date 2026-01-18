// File: ./services/prompts/commonPrompt.ts

import { UserResponses } from '../../types';

/**
 * Builds the common part of the prompt (Part 1) that includes
 * all user-provided information and design process instructions
 */
export function buildCommonPrompt(userResponses: UserResponses): string {
  const {
    business,
    audience,
    goals,
    pageType,
    hasBrand,
    brandDetails,
    inspirationLinks,
    hasInspiration,
    competitors,
    hasCompetitors,
  } = userResponses;

  // Extract page type (remove "Other: " prefix if present)
  const pageTypeValue = pageType?.replace(/^Other:\s*/i, '') || 'Unknown';

  // Build brand guidelines section
  let brandGuidelines = 'None provided';
  if (hasBrand) {
    if (brandDetails && brandDetails.trim()) {
      brandGuidelines = brandDetails.trim();
    } else {
      brandGuidelines = 'User has brand guidelines but details were not provided';
    }
  }

  // Build inspiration links section
  let inspirationSection = 'None provided';
  if (hasInspiration && inspirationLinks && inspirationLinks.trim()) {
    inspirationSection = inspirationLinks.trim();
  }

  // Build competitor links section
  let competitorsSection = 'None provided';
  if (hasCompetitors && competitors && competitors.trim()) {
    competitorsSection = competitors.trim();
  }

  const commonPrompt = `You are an expert senior UI/UX designer with years of experience in designing high-quality, user-centered, and conversion-optimized webpages. Your task is to assist the user in structuring their webpage design based on the information they've provided.

### Design Process:
1. **Business Goals**: Ensure the design aligns with the user's business objectives (e.g., lead generation, product sales, brand awareness).
2. **Target Audience**: Prioritize the design elements to suit the user's target audience and ensure maximum usability and engagement.
3. **UI/UX Best Practices**:
   - Follow modern UI/UX principles such as visual hierarchy, intuitive navigation, accessibility (WCAG), and mobile-first design.
   - Ensure high contrast for readability and proper color accessibility. Recommend legible typography and consistent design patterns for fluid user experience.
   - Emphasize user-centered design: guide the user to actionable elements (like CTAs) without overwhelming them.
4. **Responsive Design**: Ensure that the design is fully responsive across all screen sizes (desktop, tablet, mobile). Suggest layout adjustments that are optimized for smaller screens without losing functionality or visual appeal.
5. **Conversion Optimization (CRO)**: Help the user create a design that encourages conversions through effective CTA placement, trust signals (e.g., testimonials, reviews), and clear, focused content.
6. **Visual Consistency**: Maintain a consistent visual identity throughout the design. Suggest color schemes, fonts, and layout styles that align with the user's brand guidelines or preferences.
7. **Iterative Design**: Offer multiple design solutions where appropriate, and ask for feedback to iterate and improve the design.
8. **Final Recommendations**: Provide a clear and actionable summary of design suggestions and layout strategies.

### User Information:
- **Page Type**: ${pageTypeValue}
- **Business Description**: ${business || 'Not provided'}
- **Target Audience**: ${audience || 'Not provided'}
- **Goals**: ${goals || 'Not provided'}
- **Brand Guidelines**: ${brandGuidelines}
- **Inspiration Links**: ${inspirationSection}
- **Competitor Links**: ${competitorsSection}

### Output Requirements:
- Generate a complete, standalone HTML file
- Include all CSS inline or in <style> tags within the <head> section
- Include all JavaScript inline or in <script> tags before the closing </body> tag
- The HTML must start with <!DOCTYPE html> or <html>
- The HTML must end with </html>
- Do not include any text, explanations, or markdown formatting outside of the HTML tags
- The HTML should be production-ready and fully functional
- Ensure the design is responsive and follows all the design principles mentioned above`;

  return commonPrompt;
}
