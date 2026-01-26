# Implementation Guide

This document explains how to use, configure, and deploy the Design UI/UX Chatbot application.

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js** version 18 or higher
- **npm** (comes with Node.js)
- **API Keys** for:
  - Google Gemini API
  - Anthropic Claude API
  - APIFlash API (for screenshots)
  - Google Chat Webhook (optional, for session tracking)

### Installation Steps

1. **Clone or download the project**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file**:
   
   Create a `.env` file in the root directory with the following variables:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
   VITE_APIFLASH_ACCESS_KEY=your_apiflash_key_here
   VITE_GOOGLE_CHAT_WEBHOOK_URL=your_webhook_url_here
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Open in browser**:
   
   Navigate to `http://localhost:3000`

## Using the Application

### Starting a Session

1. When you open the application, you'll see a welcome message
2. Choose one of two options:
   - **"New Webpage from Scratch"**: Create a brand new webpage
   - **"Webpage Redesign"**: Improve an existing webpage

### New Webpage from Scratch Flow

1. **Answer Questions**: The chatbot will ask you:
   - What your business does
   - Who your target audience is
   - Your top 3 business goals
   - What type of page you need (landing page, homepage, product page, etc.)
   - Brand guidelines (optional)
   - Reference websites you like (optional)

2. **Reference Websites** (Optional):
   - Provide URLs of websites you like
   - Describe what you like about each one
   - The AI will analyze these and incorporate design elements

3. **Generation**:
   - The AI generates a detailed specification
   - Then generates complete HTML code
   - You can preview and download the HTML

### Webpage Redesign Flow

1. **Provide Current URL**: Enter the URL of the webpage you want to redesign

2. **Content Reuse**: Choose whether to reuse existing content

3. **Screenshot Analysis**: 
   - The system captures a screenshot
   - AI analyzes it for UI/UX issues
   - Issues are displayed to you

4. **Answer Questions**: Similar to new website flow:
   - Business information
   - Target audience
   - Why you want to redesign
   - What's not working
   - Your goals
   - Reference websites (optional)

5. **Generation**:
   - AI generates a redesign specification
   - Then generates improved HTML code
   - You can preview and download

### Session Management

- **Session Limit**: Each user can have up to 2 sessions
- **Session Closure**: After completing a design, you'll be asked for:
  - Rating (1-5 stars)
  - Feedback (optional)
  - Email address
- **New Session**: Click "Start a New Chat" to begin again
- **Session Data**: All session data is sent to Google Chat webhook (if configured)

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GEMINI_API_KEY` | Yes | Google Gemini API key for screenshot analysis |
| `VITE_ANTHROPIC_API_KEY` | Yes | Anthropic Claude API key for specifications and HTML |
| `VITE_APIFLASH_ACCESS_KEY` | Yes | APIFlash API key for screenshot capture |
| `VITE_GOOGLE_CHAT_WEBHOOK_URL` | No | Google Chat webhook for session tracking |

### API Key Setup

#### Google Gemini API

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key to `VITE_GEMINI_API_KEY`

#### Anthropic Claude API

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Navigate to API Keys
3. Create a new API key
4. Copy the key to `VITE_ANTHROPIC_API_KEY`

#### APIFlash API

1. Sign up at [APIFlash](https://apiflash.com/)
2. Get your access key from the dashboard
3. Copy the key to `VITE_APIFLASH_ACCESS_KEY`

#### Google Chat Webhook (Optional)

1. Create a Google Chat space
2. Add a webhook to the space
3. Copy the webhook URL to `VITE_GOOGLE_CHAT_WEBHOOK_URL`

## Development

### Project Structure

```
├── components/          # React UI components
│   ├── ChatWindow.tsx
│   ├── InputBar.tsx
│   ├── MessageBubble.tsx
│   └── ...
├── hooks/              # Custom React hooks
│   └── useChat.ts      # Main chat logic
├── services/           # External services
│   ├── ai/            # AI service integrations
│   ├── api/           # API services
│   └── prompts/       # AI prompts
├── utils/             # Utility functions
└── types.ts           # TypeScript types
```

### Running in Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000` with hot-reload enabled.

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Previewing Production Build

```bash
npm run preview
```

This serves the production build locally for testing.

## Deployment

### Static Hosting

Since this is a client-side React application, it can be deployed to any static hosting service:

#### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Add environment variables in Vercel dashboard

#### Netlify

1. Install Netlify CLI: `npm i -g netlify-cli`
2. Run: `netlify deploy --prod`
3. Add environment variables in Netlify dashboard

#### GitHub Pages

1. Build the project: `npm run build`
2. Configure GitHub Actions to deploy `dist/` folder
3. Set environment variables in GitHub Secrets

### Environment Variables in Production

Make sure to set all environment variables in your hosting platform's configuration:

- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Environment Variables
- GitHub Pages: Repository Settings → Secrets

### Important Notes

- **API Keys**: Never commit API keys to version control
- **Base Path**: The app doesn't use a base path by default (can be configured in `vite.config.ts`)
- **CORS**: Ensure your hosting allows the required API calls

## Troubleshooting

### Common Issues

1. **API Key Errors**:
   - Verify all API keys are set in `.env` file
   - Check that keys are valid and have proper permissions
   - Restart the dev server after changing `.env`

2. **Build Errors**:
   - Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version: `node --version` (should be 18+)

3. **Screenshot Capture Fails**:
   - Verify APIFlash API key is valid
   - Check that URLs are accessible (not behind authentication)
   - Ensure URLs use `http://` or `https://` protocol

4. **AI Generation Fails**:
   - Check API rate limits
   - Verify API keys have sufficient credits
   - Check browser console for detailed error messages

### Getting Help

- Check browser console for error messages
- Review API service logs
- Verify all environment variables are set correctly
- Ensure network connectivity to API services

## Best Practices

1. **API Key Security**: Never expose API keys in client-side code or version control
2. **Error Handling**: The app handles errors gracefully, but monitor for API failures
3. **Session Management**: Be aware of the 2-session limit per user
4. **Performance**: Large HTML outputs may take time to generate
5. **Testing**: Test with various inputs to ensure robustness

## Support

For issues or questions:
- Check the documentation files (README.md, Architecture.md, Prompt.md)
- Review error messages in browser console
- Verify API key configurations
