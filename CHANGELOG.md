# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **Logging**: Removed all non-error logging (debug, warn, log) from production code - only error logging remains
- **Token usage logging**: Changed from always-logging to dev-only (logger.debug, suppressed in production)
- **Vite config**: Removed `base: '/react-app/'` from vite.config.ts to support flexible deployment paths

### Removed
- **Deprecated code**: Removed `buildUserFriendlyErrorMessage()` function (deprecated, use STANDARD_ERROR_MESSAGE)
- **Deprecated code**: Removed `extractWebpageText()` function (deprecated, use `captureWebpageScreenshotWithText()`)
- **Debug utilities**: Removed `debugLogger.ts` utility file (all debug logging removed)

### Fixed
- **Error handling**: Ensured all async errors use `handleError()` for consistent error handling
- **Comments**: Cleaned up and rewrote all code comments, removed unwanted/deprecated comments

### Refactored
- **Anthropic API calls**: Extracted common API calling logic from `opusService.ts` and `sonnetService.ts` into shared `apiCaller.ts` helper, eliminating ~100 lines of duplicate code
- **HTML generation fallback**: Consolidated duplicate fallback patterns in `htmlGenerationWithFallback.ts` using shared `fallbackHelper.ts`, reducing code duplication by ~50%
- **HTML response handling**: Created `htmlResponseHandler.ts` utility to consolidate duplicate HTML extraction and message creation logic
- **Debug logging**: Centralized console.log patterns into `debugLogger.ts` utility with functions for reference analysis, API prompts, and specification logging
- **Code organization**: Improved modularity by extracting shared patterns into reusable utilities

### Security
- **Critical**: Moved hardcoded APIFlash access key to environment variable (`VITE_APIFLASH_ACCESS_KEY`) to prevent exposure in source code
- Added comprehensive input sanitization utility (`utils/inputSanitizer.ts`) with:
  - Text sanitization (removes null bytes and control characters)
  - Email validation with RFC 5322 compliant regex
  - URL validation with SSRF protection (blocks localhost, private IPs, .local domains)
  - Input length limits for all user inputs
- Enhanced email validation in `EmailPrompt` component with proper regex and length limits
- Added URL security validation in `apiflashService.ts` to prevent SSRF attacks
- Sanitized all user data before storing in localStorage (`utils/storageSanitizer.ts`)
- Sanitized all data before sending to Google Chat webhook
- Updated `referenceParser.ts` to sanitize URLs and descriptions
- Added security comments to `HtmlPreview` iframe sandbox attributes

### Removed
- Removed unused prompt files: `commonPrompt.ts`, `pageTypePrompts.ts`, `redesignPrompt.ts` (functions were imported but never called)
- Removed unused component: `ApiKeyInfo.tsx` (component was never imported or used)
- Removed deprecated file: `anthropicService.ts` (deprecated re-export file, code now uses `anthropic/index.ts` directly)
- Removed unused exports: `generateHtmlWithGemini` and `generateHtmlWithOpus` (legacy functions not used in current flow)
- Removed deprecated functions: `callAnthropicApiWithOpus` and `saveToTextFile` (no longer needed)
- Removed unused constant: `COMPLETION_MESSAGE` from `constants/messages.ts` (imported but never used)

### Added
- Session management with usage limit: Users are limited to 2 sessions total. After submitting email, session ends and "Start a New Chat" button appears. Clicking the button clears localStorage, increments session count, and starts a fresh session. After 2 sessions, users see a limit message and cannot start new sessions. Session count is tracked in localStorage separately from chat state.
- Google Chat webhook integration: Session records are automatically sent to Google Chat space when user submits email. Includes session metadata, user information, business context, design preferences, reference websites, audit results (for redesign), and user feedback. Webhook URL configured via `VITE_GOOGLE_CHAT_WEBHOOK_URL` environment variable. Duplicate prevention ensures webhook is sent only once per session. HTML output is excluded from webhook payload as per requirements.
- Added "reuse existing content" question to redesign flow: after collecting current URL, prompts user with Yes/No options to indicate if they want to reuse existing webpage content.
- Added centralized logger utility (`utils/logger.ts`) for consistent logging with dev-only debug logs.
- Added question navigation helper utilities (`utils/questionNavigation.ts`) to reduce code duplication.

### Changed
- Simplified brand guidelines question in "New Website from Scratch" flow: replaced yes/no question with file upload/text description options with a single text input field. Question text updated to "Do you have any existing design rules regarding colors, fonts, or styling?" with "I don't have any" as a quick action option. Removed file upload functionality and brandDetails/brandDetailsText follow-up questions from the new website flow.
- Updated references/competitors question: removed word "emulate" from question text (now reads "review" instead of "emulate or review"). Improved placeholder text in input fields to be more user-friendly: "Enter website URL" and "What did you like about this website?" (replacing technical examples with conversational prompts).

### Changed
- Improved logging: Replaced direct `console.log/error/warn` calls with centralized logger utility. Debug logs are now suppressed in production builds.
- Refactored question navigation logic: Extracted duplicate code into reusable helper functions for better maintainability.
- Fixed "I don't have any" button visibility: Button now reappears when all entries are removed in ReferencesAndCompetitorsPrompt.
- Removed unused import: `normalizeUrlsInText` from `useChat.ts`.
- Cleaned up commented-out code: Removed obsolete brand question skip logic from `questionHelpers.ts`.
- Standardized phase checks: Replaced hardcoded phase string comparisons with helper function `isReferencesAndCompetitorsPhase()`.

### Changed
- Replaced single text input for references/competitors question with a multi-entry form component: "I don't have any" option displayed as a quick action button above the inputs, with two input fields (URL and description) styled to match the standard InputBar component (same position, padding, border, and styling), an "Add" icon to add entries (up to 3), individual remove options for each entry, and a "Done" button to submit. Input fields and add icon are hidden when "I don't have any" is selected. "I don't have any" option is hidden once at least one entry is added.
- URL normalization: Automatically prepends `https://` to domain-only inputs (e.g., `example.com` → `https://example.com`) across all URL input fields in the chatbot for consistent validation and processing.
- Combined reference and competitor questions into a single question for both redesign and scratch flows: "Could you share links to your top 3 reference or competitor websites, briefly explaining which design elements you would like us to emulate or review (e.g., layout, navigation, typography)?"
- Removed brand guidelines question ("Do you have existing brand guidelines?") and related follow-up questions from the webpage redesign flow.
- Anthropic: capped dynamic max_tokens to 64,000 (per model limit) while retaining heuristic `400,000 - estimated_input_tokens - 3,000` with 1,000 floor.
- Anthropic: switched to streaming for long responses, retains dynamic max_tokens heuristic (`400,000 - estimated_input_tokens - 3,000`, min 1,000), and logs token usage from streamed responses.
- Anthropic: dynamic max_tokens now mirrors OpenAI heuristic (`400,000 - estimated_input_tokens - 3,000`, floored at 1,000) and logs input/output tokens.
- OpenAI: dynamic max_output_tokens now uses heuristic `400,000 - input_tokens_est - 3,000` (floor 1,000) and logs token usage (input/output) for responses.
- Added token usage console logging for Anthropic and Gemini (including Gemini image analysis).
- Updated inspiration and competitor questions to request both links and the specific design aspects liked or to focus on (layout, typography, palette, interactions, navigation, CTAs).
- Added a design-model selector (Gemini/OpenAI/Anthropic) for webpage generation while keeping analysis on Gemini; selection applies to both scratch and redesign flows with provider-specific key validation.
- Added post-design rating + feedback + email capture flow for both routes (redesign and scratch) with interactive stars, conditional feedback for ratings below 4, and mandatory email collection before closing the session.
- Switched the **New Webpage from Scratch** generation route from OpenAI to Anthropic (prompt logic unchanged; OpenAI/Gemini code kept commented for comparison/testing).
- **Code Refactoring & Modularization**:
  - Extracted common Gemini API client creation and params building logic into `geminiApiHelpers.ts` module
  - Created centralized error message utilities in `utils/errorMessages.ts` for consistent user-friendly error handling
  - Extracted API key validation logic into reusable `getAndValidateApiKey()` function
  - Removed duplicate error handling code between `generateHtml()` and `generateRedesignHtml()` functions
  - Added helper functions `resetGenerationState()` and `resetScreenshotState()` to reduce code duplication
  - Removed unused `filename` variable from `generateHtml()` function
  - Improved progress text reset logic to only reset on cleanup, not on success
- **Error Handling Improvements**:
  - Added specific handling for 503 Service Unavailable errors with retry logic
  - Enhanced `handleGeminiError()` to detect 503 errors and mark them as retryable
  - Unified error message building across all API calls using `buildUserFriendlyErrorMessage()`
  - Added validation in `handleAuditContinue()` to ensure redesign can proceed before generating HTML
- Refactored Gemini API error handling to use centralized `geminiErrorHandler.ts` module
- Extracted common retry logic into reusable `retryHandler.ts` with exponential backoff
- Moved ArrayBuffer conversion utilities to shared `binaryUtils.ts` module
- Removed duplicate error handling code from `callGeminiApi` and `callGeminiApiWithImage` functions
- Removed duplicate retry logic from `generateHtmlWithGemini` and `analyzeScreenshotWithGemini` functions
- Fixed duplicate progress text setting ("Analyzing it..." was set twice)
- Improved error messages for better user experience with specific error types
- Added image size validation before processing (7MB limit for Gemini API)
- Enhanced audit response parser to better handle edge cases and formatting
- Improved fallback message when no audit issues are parsed
- Added redesigned HTML generation flow for the Webpage Redesign route using a dedicated redesign prompt (same AI approach as scratch route, different prompt content)
- Updated Webpage Redesign flow so analysis runs first and redesign generation starts only after the user clicks "Move Forward"
- Updated analysis loader messaging to "Analyzing your page" and "Reviewing your page"
- Updated audit action button label from "Click here to move further" to "Move Forward"
- Enabled Google Search tool for all Gemini 2.5 Flash requests (HTML generation and analysis) to improve grounding and relevance

### Added
- Added Apiflash API integration for webpage redesign flow to capture screenshots of user-provided URLs
- Created `apiflashService.ts` with functions to capture webpage screenshots and convert PNG images to binary format
- Integrated automatic screenshot capture when redesign flow completes and a URL is provided
- Added console logging of binary screenshot data for debugging purposes
- Added animated loader for webpage redesign flow that displays progress messages ("Reviewing your current webpage design..." and "Analyzing it...") during screenshot capture
- Loader remains visible until binary screenshot data is logged to console
- Added Gemini AI integration to analyze webpage screenshots using gemini-2.5-flash model with image input support
- Created `analyzeScreenshotWithGemini()` function to send base64-encoded images to Gemini API
- Added UI/UX audit prompt for comprehensive webpage design evaluation
- Integrated automatic UI/UX audit analysis after screenshot capture completes
- Added console logging of Gemini AI audit response
- Created `AuditResults` component to display UI/UX audit issues in a structured, visually appealing format
- Added `parseAuditResponse()` utility function to extract issues from Gemini audit response
- Added `auditIssues` and `isAuditMessage` properties to `Message` interface for audit result display

### Changed
- Replaced completion message with animated loader during webpage redesign screenshot capture process
- Loader automatically hides and shows audit results after screenshot capture and Gemini analysis completes
- Enhanced screenshot capture flow to include Gemini AI analysis step after binary data is obtained
- Updated UI/UX audit prompt output format to use direct issue descriptions only (removed location labels)
- Limited UI/UX audit output to maximum 5 issues (reduced from 8-12)
- Replaced generic completion message with structured display of identified UI/UX audit issues
- Audit issues are now displayed in a visually organized format with numbered badges, color-coded cards, and clear typography
- Adjusted font sizes in AuditResults component to match overall chatbot font size (text-xs sm:text-sm for issues, text-sm sm:text-base for header)
- Added "Click here to move further" button below audit results that displays completion message when clicked

### Removed
- Removed completion message from "New Webpage from Scratch" flow - HTML generation now starts immediately after questionnaire completion
- Removed "Building your prompt" loader text and step from HTML generation process
- Removed HTML download functionality - replaced with "View in new tab" option

### Added
- Implemented LLM integration for "New Webpage from Scratch" flow using Google Gemini API
- Added prompt system with two-part structure:
  - Common prompt (Part 1): Includes user information and design process instructions
  - Page-type-specific prompts (Part 2): Tailored prompts for Home, Landing, Product, Service, Portfolio, and Other page types
- Created Gemini API service using `@google/genai` SDK with retry logic (maximum 3 retries with exponential backoff)
- Added HTML extraction and cleaning functionality to process LLM responses
- Implemented HTML preview component with iframe rendering and download functionality
- Added generation loader component with animated spinner and progress text effects
- Integrated HTML generation trigger when "New Webpage from Scratch" questionnaire is completed
- Added support for displaying generated HTML files in chat with preview and download options
- Implemented progress tracking during HTML generation (Building prompt → Connecting to AI → Processing HTML)
- Added error handling with user-friendly error messages for API failures, authentication errors, and rate limits
- Added brand guidelines question to Website Redesign flow (with file upload and text description options)
- Added reference webpage question to Website Redesign flow (with "I don't have any" option)
- Added competitor webpage question to Website Redesign flow (with "I don't have any" option)
- Extended Website Redesign flow to include the same brand, inspiration, and competitor questions as the "New Webpage from Scratch" flow
- Added HTML generation functionality that automatically triggers when "New Webpage from Scratch" flow completes
- Added `htmlContent` and `isHtmlMessage` properties to `Message` interface for HTML preview support
- Added `isGeneratingHtml` and `generationProgressText` state to chat hook for generation progress tracking

### Removed
- Removed business description question ("In one or two lines, what does your business or project do?") from the Website Redesign flow - this question is now only asked in the "New Webpage from Scratch" flow

### Changed
- Updated `Message` interface to support HTML content display with `htmlContent` and `isHtmlMessage` properties
- Enhanced `useChat` hook to include HTML generation logic with progress tracking
- Updated `MessageBubble` component to render HTML preview when message contains HTML content
- Updated `ChatWindow` component to display generation loader during HTML generation
- Modified completion flow to automatically trigger HTML generation instead of just showing completion message
- Migrated Gemini API integration from REST API to official `@google/genai` SDK
- Updated to use `gemini-2.5-pro` model instead of `gemini-pro`
- **Code Refactoring & Optimization**:
  - Created `utils/responseHelpers.ts` with reusable helper functions for common patterns:
    - `isIDontHaveAny()` - Centralized check for "I don't have any" responses
    - `validateNonEmpty()` - Unified validation for empty responses
    - `parseMultiSelect()` / `joinMultiSelect()` - Consistent multi-select parsing with pipe delimiter
    - `toggleMultiSelectOption()` - Extracted multi-select toggle logic
    - `normalizeMultiSelectForDisplay()` - Normalizes "Other: [text]" for UI matching
  - Refactored `getCurrentQuestion()` to reduce duplication between flows
  - Refactored `moveToNextQuestion()` to consolidate duplicate logic
  - Extracted `handleOtherInputResponse()` to centralize "Other" input processing
  - Updated all validation calls to use `validateNonEmpty()` helper
  - Updated all "I don't have any" checks to use `isIDontHaveAny()` helper
  - Updated multi-select operations to use helper functions
- Updated terminology from "Website" to "Webpage" throughout user-facing text to reflect that the chatbot handles one page at a time
- Updated audience question phrasing from "Who are your main target audiences or user types?" to "Tell us about your main target audiences — like their gender, where they're located, and their age group"
- Temporarily removed user role question from both "New Webpage from Scratch" and "Webpage Redesign" flows (may be reintroduced later)
- Removed redesign type question ("Do you need a completely new design or a redesign of your existing website?") from the redesign flow as it's no longer required
- Updated quick action labels from "Website Redesign" and "New Website from Scratch" to "Webpage Redesign" and "New Webpage from Scratch"
- Updated page type question options to only include: Home Page, Landing Page, Product Page, Service Page, Portfolio Page, and Other (removed Contact Page, About Page, Services Page, and Blog Page)
- Combined inspiration questions into a single question: "Do you have any reference webpage in mind whose design you like? (If yes, please share the links)" with "I don't have any" quick action option and text input for links
- Combined competitor questions into a single question: "Do you have any competitor webpages in mind whose design you want us to review? (If yes, please share the links)" with "I don't have any" quick action option and text input for links
- Removed "Why do you want to redesign your webpage now?" question from redesign flow (overlapped with issues question)
- Removed "What is the primary goal for your redesigned webpage?" question from redesign flow
- Updated redesign issues question with new user-friendly options and enabled multi-select functionality with "Done selecting issues" option
- Added "Other" option support for redesign issues question with text input capability
- Updated "Done" button styling to be consistently applied across all multi-select questions (now uses pattern matching for any "Done selecting" option)
- Redesigned quick action buttons to use chip/tag style with horizontal wrapping instead of full-width stacked buttons
- Updated button styling: unselected options show white background with gray outline, selected options show blue background with white text
- Added toggle functionality for multi-select questions (clicking a selected option deselects it)
- "Done" button remains at the bottom with special blue styling for better visual hierarchy
- Fixed issue where selecting options in multi-select questions would add messages to chat - now toggles are silent (no messages added) except for "Done" and "Other" options
- Fixed issue where options containing commas (like "The site feels slow, clunky, or unresponsive") were not highlighting correctly - changed delimiter from comma to pipe (|) to properly handle options with commas
- Updated package name from `wordpress-support-chatbot` to `design-ui-ux-chatbot` in `package.json`
- Removed unused dependencies: `@google/genai` and `react-ga4` from `package.json`
- Updated `README.md` to reflect the new Design UI/UX Chatbot purpose and features
- Removed API key requirement check from `App.tsx` (API key is now optional for initial stage)
- Updated `ApiKeyInfo.tsx` message to indicate API key is optional until LLM features are added
- Updated `index.html` title from "WordPress Support Chatbot" to "Design UI/UX Chatbot"
- Updated `metadata.json` name and description to reflect Design UI/UX Chatbot
- Updated `index.css` comments to remove WordPress-specific references
- Updated `vite-env.d.ts` to remove unused environment variables (`VITE_GOOGLE_CHAT_WEBHOOK_URL`, `VITE_GA4_MEASUREMENT_ID`)
- Made `VITE_GEMINI_API_KEY` optional in `vite-env.d.ts` to match current implementation
- Redesigned chatbot from WordPress AI Support to Design UI/UX Chatbot
- Updated welcome message to greet users and ask about their design needs
- Simplified workflow to only handle initial phase and user choice selection
- Updated header branding from "WordPress AI Support" to "Design UI/UX Chatbot"
- Updated subtitle from "Your first line of defense for WP issues" to "Your design assistant for websites"
- Changed quick actions from WordPress troubleshooting options to "Website Redesign" and "New Website from Scratch"
- Simplified `types.ts` by removing unnecessary workflow phases (ESTIMATE, CLARIFICATION, SOLUTION_1_FEEDBACK, SOLUTION_2_FEEDBACK, SOLUTION_3_FEEDBACK, ESCALATE_CHOICE, EMAIL_COLLECTION, RESOLVED, END, LIMIT_REACHED)
- Simplified `useChat.ts` hook by removing complex workflow logic, LLM service calls, usage limits, and escalation handling
- Removed email collection functionality from `InputBar.tsx`
- Removed escalation choice component from `ChatWindow.tsx`
- Removed references to unused services (geminiService, googleChatService, ga4Service) from main components
- Changed localStorage key from `wpChatState` to `designChatState` for the new chatbot

### Removed
- Removed commented-out code for role questions (no longer in use)
- Removed unused types from `UserResponses` interface:
  - `role`, `redesignRole`, `redesignType`, `redesignWhyNow`, `redesignGoals`
- Cleaned up unused phase mappings in `getPhaseFromString()`
- Cleaned up unused phases in `isNewWebsitePhase()` and `isRedesignPhase()`
- Removed all complex workflow phases and logic related to WordPress issue resolution
- Removed usage limit checking and cooldown period functionality
- Removed email collection and escalation features
- Removed feedback classification and solution clarification workflows
- Removed terminal phase tracking and chat completion recording
- Deleted unused service files: `services/geminiService.ts`, `services/googleChatService.ts`, `services/ga4Service.ts`
- Deleted unused component files: `components/EscalationChoice.tsx`, `components/LimitReachedInfo.tsx`
- Deleted unused configuration files: `config.ts`, `prompts.ts`
- Removed GA4 tracking initialization from `index.tsx`
- Removed feedback functionality from `MessageBubble.tsx` and related components
- Removed unused return values (`startNewChat`, `isLimitReached`, `handleFeedback`) from `useChat.ts` hook
- Removed `feedback` property from `Message` interface in `types.ts`

### Fixed
- Fixed bug where `redesignIssues` "Other" input was using comma delimiter instead of pipe delimiter
- Fixed HTML extraction to properly handle markdown code blocks and extract clean HTML from LLM responses
- Improved error handling for API failures with user-friendly messages and proper retry logic
- Added error handling for missing questions in flow initialization
- Added error handling for missing `brandDetailsText` question
- Improved error messages with more context
- Fixed duplicate React key warning by using unique message IDs (timestamp + counter) instead of timestamp alone
- Fixed GA4 event tracking by using correct react-ga4 v2.x API format with event name as first parameter and event parameters object

### Changed (Previous)
- Updated environment variable from `API_KEY` to `VITE_GEMINI_API_KEY` to follow Vite's requirement for client-exposed environment variables to use the `VITE_` prefix
- Simplified `vite.config.ts` by removing manual `process.env` defines and `loadEnv`, now relying on Vite's automatic handling of `VITE_` prefixed environment variables
- Updated `geminiService.ts` to use `import.meta.env.VITE_GEMINI_API_KEY` instead of `process.env.API_KEY`
- Updated `App.tsx` to use `import.meta.env.VITE_GEMINI_API_KEY` for API key validation
- Updated `components/ApiKeyInfo.tsx` to display the correct environment variable name (`VITE_GEMINI_API_KEY`) in error messages
- Updated `services/googleChatService.ts` to use `VITE_GOOGLE_CHAT_WEBHOOK_URL` environment variable instead of hardcoded webhook URL
- Updated `README.md` to document the `VITE_GEMINI_API_KEY` and `VITE_GOOGLE_CHAT_WEBHOOK_URL` environment variables
- Updated `App.tsx` to use local WisdmLabs logo from `assets/wisdmlabs_logo.webp` instead of external image URL

### Added (Previous)
- Added `vite-env.d.ts` TypeScript definition file for proper type checking of Vite environment variables

### Added
- Implemented structured "New Website from Scratch" and "Website Redesign" questionnaire flows with dedicated workflow phases and question configurations
- Added Website Redesign route with role, current URL, redesign type, business description, audience, motivation, issues, and goals questions
- Extended `useChat` hook to handle both new website and redesign flows, including phase management and quick action handling
 - Introduced shared question content for role, business description, and audience across both flows to reduce duplication and keep wording consistent

