import React from 'react';

const ApiKeyInfo: React.FC = () => {
  return (
    <div className="h-screen w-full flex items-center justify-center p-4">
      <div className="bg-white/70 backdrop-blur-xl border border-red-500/50 rounded-2xl p-8 max-w-lg text-center shadow-2xl">
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">API Key Not Found</h1>
        <p className="text-gray-700">
          This application will require a Google Gemini API key when LLM features are added. For now, the API key is optional. If you want to set it up, ensure the
          <code className="bg-red-100 text-red-900 rounded px-1.5 py-1 text-sm mx-1.5">VITE_GEMINI_API_KEY</code>
          environment variable is set in your <code className="bg-red-100 text-red-900 rounded px-1.5 py-1 text-sm mx-1.5">.env.local</code> file.
        </p>
      </div>
    </div>
  );
};

export default ApiKeyInfo;