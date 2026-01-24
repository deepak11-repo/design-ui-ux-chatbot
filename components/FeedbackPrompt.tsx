// File: ./components/FeedbackPrompt.tsx
import React, { useState } from 'react';

interface FeedbackPromptProps {
  onSubmit: (feedback: string) => void;
  label?: string;
}

const FeedbackPrompt: React.FC<FeedbackPromptProps> = ({ onSubmit, label = "What didn't you like? (briefly)" }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) {
      setError('Please provide a short note.');
      return;
    }
    setError('');
    onSubmit(text.trim());
    setText('');
  };

  return (
    <div className="mt-3 w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-3">
      <p className="text-sm font-semibold text-gray-800">{label}</p>
      <textarea
        className="w-full min-h-[80px] text-sm p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
        placeholder="Share what we should improve..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          className="text-xs sm:text-sm px-4 py-2 rounded-lg bg-[#2563EB] text-white border border-[#1D4ED8] hover:bg-[#1D4ED8] hover:border-[#1E40AF] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#2563eb]/60 transition-all"
        >
          Submit feedback
        </button>
      </div>
    </div>
  );
};

export default FeedbackPrompt;
