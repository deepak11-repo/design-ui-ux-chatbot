# Design UI/UX Chatbot

A conversational chatbot application that helps users create new webpages or redesign existing ones using AI-powered design assistance.

## Overview

This chatbot guides users through a structured conversation to collect information about their design needs, then uses AI models (Anthropic Claude and Google Gemini) to generate webpage specifications and complete HTML implementations.

## Features

- **Two Main Workflows:**
  - **New Webpage from Scratch**: Create a brand new webpage based on business requirements
  - **Webpage Redesign**: Improve an existing webpage with AI-powered analysis and redesign

- **AI-Powered Features:**
  - UI/UX audit of existing webpages
  - Reference website analysis
  - Automated specification generation
  - Complete HTML webpage generation

- **User Experience:**
  - Conversational interface with guided questions
  - Session management (limited to 2 sessions)
  - Progress indicators during generation
  - HTML preview and download functionality
  - Rating and feedback collection

## Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **AI Services**: 
  - Anthropic Claude (Sonnet & Opus models)
  - Google Gemini
- **Screenshot Service**: APIFlash API

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- API keys for:
  - Google Gemini (`VITE_GEMINI_API_KEY`)
  - Anthropic Claude (`VITE_ANTHROPIC_API_KEY`)
  - APIFlash (`VITE_APIFLASH_ACCESS_KEY`)
  - Google Chat Webhook (optional, `VITE_GOOGLE_CHAT_WEBHOOK_URL`)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_key
   VITE_ANTHROPIC_API_KEY=your_anthropic_key
   VITE_APIFLASH_ACCESS_KEY=your_apiflash_key
   VITE_GOOGLE_CHAT_WEBHOOK_URL=your_webhook_url (optional)
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

## Project Structure

```
├── components/          # React UI components
├── hooks/              # Custom React hooks (useChat)
├── services/           # AI services and API integrations
│   ├── ai/            # Anthropic and Gemini services
│   ├── api/           # External API services (APIFlash)
│   └── prompts/       # AI prompt templates
├── utils/             # Utility functions
├── constants/         # Application constants
└── types.ts          # TypeScript type definitions
```

## Key Files

- `App.tsx` - Main application component
- `hooks/useChat.ts` - Core chat logic and state management
- `services/ai/` - AI service integrations
- `services/prompts/` - AI prompt templates

## Documentation

- [Architecture.md](./Architecture.md) - Detailed system architecture
- [Prompt.md](./Prompt.md) - All AI prompts used in the application
- [Implementation.md](./Implementation.md) - Usage guide and implementation details

## License

Private project - All rights reserved
