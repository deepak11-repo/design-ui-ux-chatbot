// File: ./components/ReferencesAndCompetitorsPrompt.tsx
import React, { useState } from 'react';
import { hasUrls, normalizeUrl } from '../utils/validation';

interface ReferenceEntry {
  url: string;
  description: string;
}

interface ReferencesAndCompetitorsPromptProps {
  onSubmit: (entries: ReferenceEntry[]) => void;
  maxEntries?: number;
}

const ReferencesAndCompetitorsPrompt: React.FC<ReferencesAndCompetitorsPromptProps> = ({ 
  onSubmit, 
  maxEntries = 3 
}) => {
  const [entries, setEntries] = useState<ReferenceEntry[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentDescription, setCurrentDescription] = useState('');
  const [error, setError] = useState('');
  const [hasNone, setHasNone] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleAdd = () => {
    setError('');
    
    if (!currentUrl.trim()) {
      setError('Please enter a website URL.');
      return;
    }

    // Normalize URL (prepend https:// if domain-only)
    const normalizedUrl = normalizeUrl(currentUrl.trim());
    
    if (!hasUrls(normalizedUrl)) {
      setError('Please enter a valid URL (e.g., https://example.com or example.com).');
      return;
    }

    if (!currentDescription.trim()) {
      setError('Please describe what you liked about this webpage.');
      return;
    }

    if (entries.length >= maxEntries) {
      setError(`You can add up to ${maxEntries} entries.`);
      return;
    }

    // Store normalized URL
    setEntries([...entries, { url: normalizedUrl, description: currentDescription.trim() }]);
    setCurrentUrl('');
    setCurrentDescription('');
    setError('');
    setHasNone(false); // Clear "I don't have any" when entry is added
  };

  const handleRemove = (index: number) => {
    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries);
    // If all entries are removed, show "I don't have any" option again
    if (newEntries.length === 0) {
      setHasNone(false);
    }
  };

  const handleIDontHaveAny = () => {
    setHasNone(true);
    setEntries([]);
    setCurrentUrl('');
    setCurrentDescription('');
    setError('');
    setIsSubmitted(true);
    // Submit empty array to indicate "I don't have any"
    onSubmit([]);
  };

  const handleSubmit = () => {
    if (entries.length === 0 && !hasNone) {
      setError('Please add at least one reference or competitor website, or select "I don\'t have any".');
      return;
    }
    setIsSubmitted(true);
    onSubmit(entries);
  };

  // Match InputBar styling
  const inputClasses = "flex-1 px-4 py-2.5 bg-white text-sm text-[#2C2C2C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 border border-[#E5E5E5] focus:border-[#2563eb] transition-all placeholder-[#888888] cursor-text hover:border-[#D0D0D0]";
  const buttonClasses = "px-4 py-2 text-sm rounded-lg bg-[#2563EB] text-white border border-[#1D4ED8] hover:bg-[#1D4ED8] hover:border-[#1E40AF] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#2563eb]/60 transition-all font-medium";
  const removeButtonClasses = "text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all";
  const iDontHaveAnyButtonClasses = "text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer whitespace-nowrap font-medium bg-white text-[#2C2C2C] border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 focus:ring-[#2563eb]/40";
  const addIconClasses = "w-5 h-5 text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  const AddIcon: React.FC<{ className: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );

  return (
    <div className="mt-3 w-full">
      {/* "I don't have any" option as quick action button - hidden after selection or submission */}
      {!isSubmitted && entries.length === 0 && !hasNone && (
        <div className="flex flex-wrap gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={handleIDontHaveAny}
            className={iDontHaveAnyButtonClasses}
          >
            I don't have any
          </button>
        </div>
      )}

      {/* Input fields in standard InputBar style position - COMPLETELY HIDDEN when "I don't have any" is selected, max entries reached, or after submission */}
      {isSubmitted || hasNone ? null : (
        entries.length < maxEntries && (
          <div className="p-3 sm:p-4 border-t border-[#E5E5E5] shrink-0 bg-white rounded-lg mt-3">
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <input
                    type="text"
                    className={inputClasses + (entries.length >= maxEntries ? " disabled:opacity-50" : "")}
                    placeholder="Enter website URL"
                    value={currentUrl}
                    onChange={(e) => {
                      setCurrentUrl(e.target.value);
                      setHasNone(false);
                    }}
                    disabled={entries.length >= maxEntries}
                    aria-label="Website URL"
                  />
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <input
                    type="text"
                    className={inputClasses + (entries.length >= maxEntries ? " disabled:opacity-50" : "")}
                    placeholder="What did you like about this website?"
                    value={currentDescription}
                    onChange={(e) => {
                      setCurrentDescription(e.target.value);
                      setHasNone(false);
                    }}
                    disabled={entries.length >= maxEntries}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAdd();
                      }
                    }}
                    aria-label="What you liked"
                  />
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={entries.length >= maxEntries || !currentUrl.trim() || !currentDescription.trim()}
                    className="shrink-0 disabled:cursor-not-allowed"
                    aria-label="Add entry"
                  >
                    <AddIcon className={addIconClasses} />
                  </button>
                </div>
              </div>
              {error && <p className="text-xs text-red-600 px-1">{error}</p>}
            </div>
          </div>
        )
      )}

      {/* Display added entries */}
      {entries.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-gray-200 mt-3">
          <p className="text-xs font-medium text-gray-700">Added entries ({entries.length}/{maxEntries}):</p>
          {entries.map((entry, index) => (
            <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded border border-gray-200">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{entry.url}</p>
                <p className="text-xs text-gray-600 mt-0.5">{entry.description}</p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className={removeButtonClasses}
                aria-label="Remove entry"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Submit button - only show when entries are available (auto-submits when "I don't have any" is selected) */}
      {!isSubmitted && entries.length > 0 && (
        <div className={`flex justify-end pt-2 border-t border-gray-200 mt-3`}>
          <button
            type="button"
            onClick={handleSubmit}
            className={buttonClasses}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};

export default ReferencesAndCompetitorsPrompt;
