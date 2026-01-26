# Architecture Documentation

This document explains the overall architecture of the Design UI/UX Chatbot application.

## System Overview

The application is a single-page React application that uses a conversational interface to collect user requirements and generate webpage designs using AI models.

## High-Level Architecture

```
User Interface (React Components)
    ↓
Chat Logic (useChat Hook)
    ↓
AI Services (Anthropic/Gemini)
    ↓
External APIs (APIFlash for Screenshots)
```

## Core Components

### 1. User Interface Layer

**Location**: `components/`

- **ChatWindow**: Displays the conversation messages
- **InputBar**: User input field with quick actions
- **MessageBubble**: Individual message display (text, HTML, audit results)
- **HtmlPreview**: Iframe for displaying generated HTML
- **RatingPrompt**: User rating collection (1-5 stars)
- **FeedbackPrompt**: Text feedback collection
- **EmailPrompt**: Email collection for session closure
- **ReferencesAndCompetitorsPrompt**: Multi-entry form for reference websites

### 2. State Management Layer

**Location**: `hooks/useChat.ts`

The `useChat` hook manages all application state:

- **Messages**: Conversation history
- **User Responses**: Collected user data
- **Workflow Phase**: Current step in the conversation
- **Generation State**: Loading states for HTML generation
- **Session Management**: Session tracking and limits

### 3. AI Services Layer

**Location**: `services/ai/`

#### Anthropic Services (`services/ai/anthropic/`)

- **sonnetService.ts**: Claude Sonnet model for specifications and HTML
- **opusService.ts**: Claude Opus model for HTML generation (fallback)
- **htmlGenerationWithFallback.ts**: Automatic fallback from Sonnet to Opus
- **shared/**: Common utilities (API calling, error handling, validation)

#### Gemini Services (`services/ai/geminiService.ts`)

- Screenshot analysis for UI/UX audits
- Reference website analysis
- Redesign specification generation

### 4. Prompt Management

**Location**: `services/prompts/`

- **newWebsiteSpecPrompt.ts**: Prompt for new website specifications
- **redesignSpecificationPrompt.ts**: Prompt for redesign specifications
- **htmlGenerationPrompt.ts**: Prompt for HTML generation from specifications
- **redesignHtmlGenerationPrompt.ts**: Prompt for redesign HTML generation
- **uiUxAuditPrompt.ts**: Prompt for UI/UX audit analysis
- **referenceWebsitePrompt.ts**: Prompt for reference website analysis

### 5. External API Services

**Location**: `services/api/`

- **apiflashService.ts**: Screenshot capture and text extraction
- **referenceWebsiteService.ts**: Reference website processing pipeline

### 6. Utility Functions

**Location**: `utils/`

Key utilities:
- **storage.ts**: LocalStorage management for chat state
- **validation.ts**: Input validation (URLs, emails, etc.)
- **jsonValidator.ts**: JSON extraction and validation from AI responses
- **errorMessages.ts**: Standardized error messages
- **logger.ts**: Centralized logging (errors only in production)
- **sessionId.ts**: Session ID generation and management
- **webhookSender.ts**: Google Chat webhook integration

## Data Flow

### New Website Flow

1. User selects "New Webpage from Scratch"
2. System asks questions sequentially:
   - Business description
   - Target audience
   - Business goals
   - Page type
   - Brand guidelines (optional)
   - Reference websites (optional)
3. Reference websites are analyzed (if provided)
4. Specification is generated using Anthropic Claude Sonnet
5. HTML is generated from specification using Claude (Sonnet → Opus fallback)
6. HTML is displayed and can be downloaded

### Redesign Flow

1. User selects "Webpage Redesign"
2. System asks for current webpage URL
3. Screenshot is captured using APIFlash
4. Reference websites are analyzed (if provided)
5. UI/UX audit is performed using Gemini
6. Audit issues are displayed to user
7. System collects redesign requirements
8. Redesign specification is generated using Gemini or Claude
9. HTML is generated from redesign specification
10. HTML is displayed and can be downloaded

## State Management

### User Responses Structure

```typescript
interface UserResponses {
  // New Website
  business?: string;
  audience?: string;
  goals?: string;
  pageType?: string;
  referencesAndCompetitors?: string;
  referenceWebsiteAnalysis?: Array<{...}>;
  
  // Redesign
  redesignCurrentUrl?: string;
  redesignReuseContent?: boolean;
  redesignExtractedText?: string;
  redesignBusiness?: string;
  redesignAudience?: string;
  redesignIssues?: string;
  redesignReferencesAndCompetitors?: string;
  redesignReferenceWebsiteAnalysis?: Array<{...}>;
}
```

### Workflow Phases

The application uses an enum-based phase system:
- `INITIAL`: Welcome screen
- `USER_CHOICE`: User selects workflow
- `NEW_WEBSITE_*`: New website question phases
- `REDESIGN_*`: Redesign question phases
- `*_COMPLETE`: Generation phases

## Error Handling

- All async errors use `handleError()` function
- Standard error messages shown to users
- Technical errors logged for debugging
- Graceful degradation (e.g., reference website failures don't block main flow)

## Session Management

- Sessions tracked in localStorage
- Session limit: 2 sessions per user
- Session data sent to Google Chat webhook on completion
- Session state persists across page refreshes

## Security Considerations

- API keys stored in environment variables
- Input sanitization for all user data
- URL validation with SSRF protection
- LocalStorage data sanitization
- Iframe sandboxing for HTML preview

## Performance Optimizations

- Model call delays to prevent rate limiting
- Screenshot base64 cleared after use
- LocalStorage quota management
- Lazy loading for images in generated HTML

## Build and Deployment

- **Development**: `npm run dev` (Vite dev server on port 3000)
- **Production**: `npm run build` (outputs to `dist/`)
- **Preview**: `npm run preview` (preview production build)

The application is a client-side SPA with no backend requirements.
