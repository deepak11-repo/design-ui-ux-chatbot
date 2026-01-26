// File: ./components/GenerationLoader.tsx

import React from 'react';

interface GenerationLoaderProps {
  progressText?: string;
  showSteps?: boolean;
}

const GenerationLoader: React.FC<GenerationLoaderProps> = ({ 
  progressText = 'Generating your webpage...',
  showSteps = true,
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
    <div className="flex flex-col items-center justify-center py-12 px-4 space-y-8 bg-gradient-to-b from-white to-[#FAFAFA] rounded-lg">
      {/* Enhanced Animated Spinner */}
      <div className="relative w-20 h-20">
        {/* Outer ring */}
        <div className="absolute top-0 left-0 w-full h-full border-4 border-[#E5E9FB] rounded-full"></div>
        {/* Primary spinner */}
        <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-[#2563EB] rounded-full animate-spin" style={{ animationDuration: '1s' }}></div>
        {/* Secondary spinner */}
        <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-r-[#7C3AED] rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        {/* Inner pulse */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#2563EB] rounded-full animate-pulse opacity-60"></div>
      </div>

      {/* Progress Text with Enhanced Animation */}
      <div className="text-center space-y-3 max-w-md">
        <p className="text-xl font-semibold text-[#1F2937] tracking-tight">
          {progressText}
          <span className="inline-block w-4 ml-1">{dots || '   '}</span>
        </p>
        <p className="text-sm text-[#6B7280]">
          This may take a moment, please don't close this page
        </p>
      </div>

      {/* Animated Progress Bar (no percentage) */}
      <div className="w-full max-w-md">
        <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#2563EB] rounded-full"
            style={{ 
              width: '100%',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s infinite'
            }}
          ></div>
        </div>
      </div>

      {/* Progress Steps Animation */}
      {showSteps && (
        <div className="w-full max-w-md space-y-3">
          <div className="flex items-center space-x-3 text-sm">
            <div className="relative">
              <div className="w-3 h-3 bg-[#2563EB] rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-3 h-3 bg-[#2563EB] rounded-full animate-ping opacity-75"></div>
            </div>
            <span className="text-[#4B5563]">Analyzing requirements</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="relative">
              <div className="w-3 h-3 bg-[#7C3AED] rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
              <div className="absolute inset-0 w-3 h-3 bg-[#7C3AED] rounded-full animate-ping opacity-75" style={{ animationDelay: '200ms' }}></div>
            </div>
            <span className="text-[#4B5563]">Generating design</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export default GenerationLoader;
