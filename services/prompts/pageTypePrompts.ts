// File: ./services/prompts/pageTypePrompts.ts

/**
 * Page type specific prompts (Part 2)
 * These are combined with the common prompt to create the full prompt
 */
export const PAGE_TYPE_PROMPTS: Record<string, string> = {
  'Home Page': `For the homepage, the design must prioritize establishing a clear brand identity while ensuring users can easily navigate through the site and quickly understand your offerings. The layout should guide users to important sections of the website and create a seamless journey.

Key Areas to Focus On:
1. Hero Section: The headline must immediately communicate the core value proposition of your brand. The primary CTA should be clear and placed above the fold to prompt immediate action.
2. Navigation: The main navigation must be simple and intuitive, allowing users to access key sections like About, Services, and Contact with ease. A sticky navigation bar may be considered for better user accessibility.
3. Content Hierarchy: Organize content logically to ensure users can quickly understand the business's offerings. This includes clear sections for Services, Products, or Portfolio.
4. Trust Signals: Position testimonials, client logos, or awards prominently to enhance credibility.
5. Footer: The footer should contain essential links, contact information, and social media profiles, ensuring all critical points of access are available.

The homepage design should act as an effective entry point to the website, emphasizing the brand's identity and ensuring users can easily access key areas and take appropriate actions.`,

  'Landing Page': `For the landing page, the design must be laser-focused on conversion. The layout should be straightforward, with a clear call to action that leads visitors toward the primary objective, whether it's signing up, making a purchase, or downloading content.

Key Areas to Focus On:
1. Hero Section: The headline should clearly define the offer in one sentence. The primary CTA should be visible above the fold and must encourage immediate action.
2. Problem/Solution: Address the visitor's pain points directly and position the offer as the solution. Keep the messaging simple, focusing on benefits.
3. Trust Signals: Include testimonials, ratings, or endorsements early in the design to build trust and provide reassurance.
4. CTA Design: The CTA button must be highly visible, contrasting, and repeated throughout the page to guide users toward conversion. Minimize distractions by limiting other links.
5. Visual Hierarchy: Ensure the page follows a clear visual flow from headline to CTA, emphasizing critical elements with appropriate contrast and size.
6. Form Design: If the page includes a form, ensure it is minimal and easy to fill out, avoiding unnecessary fields that could create friction.

The landing page design should be conversion-centric, with a layout that minimizes distractions and guides the user toward a single, defined action.`,

  'Product Page': `For the product page, the focus is on providing visitors with clear, detailed product information while facilitating a smooth path to purchase or inquiry.

Key Areas to Focus On:
1. Product Information: Provide a concise yet thorough description of the product, emphasizing its key features and benefits. Organize the content for easy scannability using bullet points or short sections.
2. High-Quality Imagery: Include high-resolution images that display the product from various angles. If applicable, provide a zoom or 360-degree view for a detailed look.
3. Pricing and Availability: Clearly display the price, any discounts or offers, and availability (e.g., in stock, limited edition).
4. Call to Action (CTA): The purchase button should be prominently placed above the fold and also at the bottom of the page. It should be contrasting, clear, and action-oriented (e.g., 'Add to Cart,' 'Buy Now').
5. Customer Reviews: Display reviews and ratings near the product description to provide social proof and reassure the user of the product's quality.
6. Trust Signals: Highlight guarantees, warranties, or return policies to provide the user with reassurance.
7. Related Products: Include a section for related products or cross-sells to encourage further exploration and increase sales opportunities.

The design must ensure that the user has all the information needed to make a purchase decision and provide a clear, user-friendly path to complete the purchase.`,

  'Service Page': `For the service page, the design should clearly communicate the value of each service and make it easy for users to take the next step, whether that's booking a consultation, requesting a quote, or contacting the company.

Key Areas to Focus On:
1. Service Descriptions: Each service should be explained clearly, focusing on benefits and outcomes. Break down the content into digestible sections for easy scanning.
2. Visuals: Use images, icons, or infographics that visually represent the services offered. Ensure the design is consistent and aligned with your brand.
3. Call to Action (CTA): The primary CTA should be visible throughout the page, prompting users to take the next step (e.g., 'Book a Consultation,' 'Request a Quote'). Make sure the CTA is clear and contrasts well with other elements on the page.
4. Social Proof: Incorporate client testimonials, case studies, or client logos to build credibility and trust in your services.
5. Service Pricing: If applicable, provide pricing information for each service or include package options. Transparency in pricing can encourage action.
6. Trust Signals: Display industry certifications, guarantees, or accolades that reassure users of the service quality.
7. User Flow: Ensure the content flows logically from one service to the next, with clear, visual transitions that guide the user toward conversion.

The service page design should focus on educating the user and encouraging conversion by providing clear calls to action and building trust through testimonials and relevant content.`,

  'Portfolio Page': `For the portfolio page, the focus is on showcasing your best work and demonstrating your capabilities through visual examples. The design should highlight work in an attractive and easy-to-navigate way.

Key Areas to Focus On:
1. Project Display: Use a grid or carousel layout to display projects. Each project should have a thumbnail and a brief description. Ensure the layout is clean and visually appealing.
2. Case Studies: For select projects, provide detailed case studies that outline the challenge, solution, and outcome. Use bullet points or sections for clarity.
3. Filtering Options: Include filters (e.g., by project type, industry) so users can easily navigate and find relevant projects.
4. Client Testimonials: Display client feedback or testimonials alongside relevant projects to validate your work and reinforce the quality of your services.
5. Visual Hierarchy: Highlight key projects or featured work at the top of the page. Use larger images and bold text for these key projects.
6. Call to Action (CTA): The CTA should encourage users to contact you or view more work. Place the CTA prominently at the end of the page or after each project.

The portfolio page must act as a showcase of your skills and experience, guiding users to engage with your services or inquire for more information.`,
};

/**
 * Gets the page-type-specific prompt (Part 2)
 * Handles "Other" page types with a generic prompt
 */
export function getPageTypePrompt(pageType: string): string {
  // Remove "Other: " prefix if present
  const normalizedPageType = pageType.replace(/^Other:\s*/i, '');

  // Check if it's a known page type
  if (PAGE_TYPE_PROMPTS[normalizedPageType]) {
    return PAGE_TYPE_PROMPTS[normalizedPageType];
  }

  // For "Other" or unknown page types, return a generic prompt
  return `For this webpage, create a design that effectively communicates the user's business goals and engages their target audience. Focus on:

1. Clear Value Proposition: Immediately communicate what the business offers and why it matters.
2. Intuitive Navigation: Ensure users can easily find what they're looking for.
3. Strong Visual Hierarchy: Guide users' attention to the most important elements.
4. Responsive Design: Ensure the page works seamlessly across all devices.
5. Clear Call to Action: Provide clear paths for users to take the desired action.
6. Trust Building: Include elements that build credibility and trust.

The design should be modern, user-friendly, and aligned with the user's brand guidelines and business objectives.`;
}

/**
 * Combines the common prompt (Part 1) with the page-type-specific prompt (Part 2)
 */
export function buildFullPrompt(commonPrompt: string, pageTypePrompt: string): string {
  return `${commonPrompt}

---

### Page-Specific Requirements:

${pageTypePrompt}

---

Now, generate the complete HTML file based on all the information and requirements provided above.`;
}
