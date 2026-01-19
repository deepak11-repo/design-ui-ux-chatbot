# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
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

