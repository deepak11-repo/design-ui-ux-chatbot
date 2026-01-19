// File: ./components/AuditResults.tsx

import React from 'react';

interface AuditResultsProps {
  issues: string[];
  onContinue?: () => void;
}

const AuditResults: React.FC<AuditResultsProps> = ({ issues, onContinue }) => {
  if (!issues || issues.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 w-full max-w-4xl">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-4 py-3 border-b border-[#1D4ED8]">
          <h3 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            High Impact UI/UX Issues
          </h3>
        </div>

        {/* Issues List */}
        <div className="p-4 space-y-3">
          {issues.map((issue, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-[#FEF3C7] border-l-4 border-[#F59E0B] rounded-r-lg hover:bg-[#FDE68A] transition-colors duration-200"
            >
              {/* Issue Number Badge */}
              <div className="flex-shrink-0 w-6 h-6 bg-[#F59E0B] text-white rounded-full flex items-center justify-center text-xs font-semibold">
                {index + 1}
              </div>
              
              {/* Issue Text */}
              <p className="flex-1 text-xs sm:text-sm text-[#78350F] leading-5 sm:leading-6">
                {issue}
              </p>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-600 italic">
            These issues are prioritized by severity and impact on user experience.
          </p>
        </div>
      </div>
      
      {/* Continue Button */}
      <div className="mt-3 flex justify-start">
        <button
          onClick={() => {
            if (onContinue) {
              onContinue();
            }
          }}
          className="text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-[#2563EB] text-white border border-[#1D4ED8] hover:bg-[#1D4ED8] hover:border-[#1E40AF] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm active:bg-[#1E40AF] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#2563eb]/60 cursor-pointer whitespace-nowrap font-medium transition-all duration-200"
        >
          Move Forward
        </button>
      </div>
    </div>
  );
};

export default AuditResults;
