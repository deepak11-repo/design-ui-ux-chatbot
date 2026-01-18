// File: ./components/HtmlPreview.tsx

import React, { useRef } from 'react';

interface HtmlPreviewProps {
  html: string;
}

const HtmlPreview: React.FC<HtmlPreviewProps> = ({ html }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleViewInNewTab = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Open in new tab
    const newWindow = window.open(url, '_blank');
    
    // Clean up the URL after a delay (if window opened successfully)
    if (newWindow) {
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    } else {
      // If popup was blocked, clean up immediately
      URL.revokeObjectURL(url);
    }
  };

  // Write HTML to iframe
  React.useEffect(() => {
    if (iframeRef.current && html) {
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();
      }
    }
  }, [html]);

  return (
    <div className="w-full space-y-4">
      {/* Preview Section */}
      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-xs text-gray-600 ml-2">Webpage Preview</span>
          </div>
        </div>
        <div className="relative" style={{ height: '600px', overflow: 'auto' }}>
          <iframe
            ref={iframeRef}
            title="HTML Preview"
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        </div>
      </div>

      {/* View in New Tab Button */}
      <div className="flex justify-center">
        <button
          onClick={handleViewInNewTab}
          className="px-6 py-3 bg-[rgb(225,233,251)] hover:bg-[rgb(200,215,245)] text-[#222222] font-semibold rounded-lg transition-colors duration-200 flex items-center space-x-2 shadow-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          <span>View in New Tab</span>
        </button>
      </div>
    </div>
  );
};

export default HtmlPreview;
