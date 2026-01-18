// File: ./components/GenerationLoader.tsx

import React from 'react';

interface GenerationLoaderProps {
  progressText?: string;
}

const GenerationLoader: React.FC<GenerationLoaderProps> = ({ 
  progressText = 'Generating your webpage...' 
}) => {
  const [dots, setDots] = React.useState('');

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-6">
      {/* Animated Spinner */}
      <div className="relative w-16 h-16">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-[rgb(225,233,251)] rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-[#222222] rounded-full animate-spin"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-r-[#222222] rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>

      {/* Progress Text with Animation */}
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-[#222222] animate-pulse">
          {progressText}{dots}
        </p>
        <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
          <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
        </div>
      </div>

      {/* Progress Steps Animation */}
      <div className="w-full max-w-md space-y-2">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span>Connecting to AI</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
          <span>Generating design</span>
        </div>
      </div>
    </div>
  );
};

export default GenerationLoader;
