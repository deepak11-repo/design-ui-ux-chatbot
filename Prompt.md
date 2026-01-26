# Prompt Documentation

This document describes all AI prompts used in the Design UI/UX Chatbot application.

## Overview

The application uses multiple AI prompts for different stages of the workflow:
1. **Specification Generation**: Creating detailed webpage specifications
2. **HTML Generation**: Converting specifications to HTML code
3. **UI/UX Audit**: Analyzing existing webpages for issues
4. **Reference Website Analysis**: Extracting design elements from reference sites

## Prompt Categories

### 1. New Website Specification Prompt

**Location**: `services/prompts/newWebsiteSpecPrompt.ts`

**Purpose**: Generate a detailed webpage specification for a new website based on user inputs.

**Key Requirements**:
- Must align with selected page type (landing page, homepage, product page, etc.)
- Mobile-first philosophy
- WCAG 2.1 AA accessibility compliance
- Uses reference website analysis if provided
- Outputs structured JSON with sections:
  - `page_overview`: Page type, goals, success criteria
  - `audience_context`: Target audience, pain points
  - `section_structure`: Ordered list of page sections
  - `design_guidelines`: Colors, typography, layout patterns
  - `functional_elements`: Buttons, forms, interactions
  - `tone_and_experience`: Voice, trust builders
  - `constraints_and_notes`: Scope, performance, assumptions

**Inputs Included**:
- Business information
- Target audience
- Business goals
- Page type selection
- Style/color preferences (optional)
- Reference websites (optional)

### 2. Redesign Specification Prompt

**Location**: `services/prompts/anthropic/redesignSpecificationPrompt.ts`

**Purpose**: Generate a redesign specification for an existing webpage.

**Key Requirements**:
- Treats as a redesign, not a rebuild
- Identifies current page type from URL/screenshot
- Diagnoses what's not working
- Preserves what's working
- Can reuse existing content if requested
- Outputs structured JSON with sections:
  - `page_overview`: Current URL, page type, goals
  - `current_page_diagnosis`: Issues and what to retain
  - `audience_context`: Target audience expectations
  - `redesign_strategy`: Core strategy shifts
  - `revised_section_structure`: Updated sections with content
  - `design_guidelines`: Updated design rules
  - `functional_and_interaction_updates`: CTA and interaction changes
  - `constraints_and_notes`: What must not change

**Inputs Included**:
- Current webpage URL
- Screenshot of current page
- Existing content (if reuse requested)
- Business information
- Target audience
- Redesign reasons
- Known constraints
- Reference websites (optional)

### 3. HTML Generation Prompt

**Location**: `services/prompts/anthropic/htmlGenerationPrompt.ts`

**Purpose**: Convert a webpage specification into complete HTML code.

**System Prompt**: 
"You are an expert frontend designer and engineer using the frontend-design skill. Your job is to translate a provided webpage specification into a fully implemented, production-grade frontend webpage with a bold, intentional aesthetic."

**Key Requirements**:
- Follow specification exactly
- Output complete, valid HTML document
- Embed all CSS in `<style>` block
- Embed JavaScript in `<script>` block (if needed)
- Use semantic HTML
- Include placeholder images
- No markdown, no explanations - HTML only

**Output Format**:
- Starts with `<!DOCTYPE html>`
- Ends with `</html>`
- All styles and scripts embedded
- Responsive and accessible

### 4. Redesign HTML Generation Prompt

**Location**: `services/prompts/anthropic/redesignHtmlGenerationPrompt.ts`

**Purpose**: Convert a redesign specification into improved HTML code.

**System Prompt**: 
"You are an expert frontend designer and engineer using the frontend-design skill, specializing in high-impact webpage redesigns. Act like a senior UX designer and conversion-focused frontend builder."

**Key Requirements**:
- Must feel like a clear qualitative upgrade
- Stronger hierarchy, reduced cognitive load
- Clearer conversion paths
- Better accessibility
- Improved mobile experience
- Can reuse existing content if specified
- Output complete HTML document only

**Content Handling**:
- If `REUSE_EXISTING_CONTENT`: Use `actual_content` from spec
- If `CLIENT_PROVIDES_NEW_CONTENT`: Use provided content as-is
- If `AI_DRAFTS_NEW_CONTENT`: Write concise, realistic copy

### 5. UI/UX Audit Prompt

**Location**: `services/prompts/uiUxAuditPrompt.ts`

**Purpose**: Analyze a webpage screenshot for UI/UX issues.

**Key Requirements**:
- Visual-only evaluation (no business performance analysis)
- Focus on high-severity issues that harm usability
- Maximum 5 issues
- Ordered from most to least severe
- Plain text output format

**Evaluation Areas**:
1. Page understanding (user intent, primary actions)
2. Page state and obstructions (popups, banners)
3. Clarity and wayfinding (hierarchy, scannability)
4. Interaction design (affordances, consistency)
5. Accessibility (contrast, readability, focus states)
6. Design system consistency (typography, spacing, colors)

**Output Format**:
```
High Impact:
Issue description 1
Issue description 2
...
```

### 6. Reference Website Analysis Prompt

**Location**: `services/prompts/referenceWebsitePrompt.ts`

**Purpose**: Extract UI/UX design elements from reference websites based on user preferences.

**Key Requirements**:
- Output only raw valid JSON (no markdown)
- Filter based on what user explicitly liked
- Implementation-ready values (HEX codes, CSS notes)
- Color hierarchy: Primary, Secondary, Accent, Neutral

**Output Schema**:
```json
{
  "website_url": "string",
  "user_likes_about_this": "string",
  "layout_notes": "string",
  "colors": [
    { "hex": "#HEXCODE", "type": "Primary | Secondary | Accent | Neutral" }
  ],
  "typography_notes": "string",
  "components_liked": ["string"],
  "interaction_notes": "string",
  "design_principles": ["string"]
}
```

## Prompt Building Functions

### New Website Specification

**Function**: `buildNewWebsiteUserPrompt(userResponses: UserResponses)`

Builds the complete prompt by:
1. Taking the base template
2. Adding business information
3. Adding target audience
4. Adding business goals
5. Adding page type
6. Adding style preferences (if provided)
7. Adding reference website analysis (if available)

### Redesign Specification

**Function**: `buildRedesignSpecificationUserPrompt(userResponses: UserResponses)`

Builds the complete prompt by:
1. Taking the base template
2. Adding current webpage URL
3. Adding business information
4. Adding target audience
5. Adding redesign reasons
6. Adding existing content (if reuse requested)
7. Adding reference website analysis (if available)
8. Adding known constraints

**Function**: `buildRedesignSpecificationPromptForGemini(userResponses: UserResponses)`

Similar to above but formatted for Gemini API (combines system and user prompts).

### HTML Generation

**Function**: `buildHtmlGenerationUserPrompt(specificationJson: string)`

Takes the specification JSON and inserts it into the HTML generation template.

**Function**: `buildRedesignHtmlGenerationUserPrompt(specificationJson: string)`

Takes the redesign specification JSON and inserts it into the redesign HTML generation template.

## Prompt Best Practices

1. **Clarity**: Prompts are explicit about requirements and constraints
2. **Structure**: JSON output formats are clearly defined
3. **Context**: All relevant user inputs are included
4. **Constraints**: Clear rules about what NOT to do
5. **Format**: Strict output format requirements (JSON, HTML only)

## Model Selection

- **Gemini**: Used for screenshot analysis and reference website analysis
- **Claude Sonnet**: Primary model for specifications and HTML generation
- **Claude Opus**: Fallback model for HTML generation if Sonnet fails

## Error Handling in Prompts

- Prompts explicitly request valid JSON
- Validation happens after AI response
- Retry logic handles parsing failures
- Fallback models available for critical operations
