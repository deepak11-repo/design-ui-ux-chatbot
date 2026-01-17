# Design UI/UX Chatbot

A modern, interactive chatbot designed to help users with their webpage design needs. The chatbot assists users in choosing between webpage redesign or creating a new webpage from scratch.

## Features

- **Welcome Message**: Greets users and introduces the chatbot
- **User Choice Selection**: Helps users choose between:
  - Webpage Redesign
  - New Webpage from Scratch
- **Interactive Chat Interface**: Clean, modern UI with real-time messaging
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Prerequisites

- Node.js (v18 or higher recommended)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (optional):
   Create a `.env.local` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
   **Note:** The API key is optional for the initial stage. It will be required when LLM features are added.

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
├── components/          # React components
│   ├── ApiKeyInfo.tsx  # API key configuration info
│   ├── BotAvatar.tsx   # Bot avatar component
│   ├── ChatWindow.tsx  # Main chat window
│   ├── ErrorBoundary.tsx # Error handling
│   ├── InputBar.tsx    # Message input component
│   ├── MessageBubble.tsx # Individual message display
│   ├── FileUpload.tsx # File upload component
│   ├── TypingIndicator.tsx # Loading indicator
│   └── UserAvatar.tsx  # User avatar component
├── hooks/              # Custom React hooks
│   └── useChat.ts      # Chat state management
├── constants.ts        # App constants
├── types.ts            # TypeScript type definitions
├── App.tsx             # Main application component
└── index.tsx           # Application entry point
```

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling

## Development

The chatbot is currently in its initial stage with basic functionality:
- Welcome message display
- User choice selection (Webpage Redesign / New Webpage from Scratch)
- Basic message handling

Future enhancements will include:
- LLM integration for intelligent responses
- Advanced conversation flows
- Additional design-related features

## License

[Add your license information here]
