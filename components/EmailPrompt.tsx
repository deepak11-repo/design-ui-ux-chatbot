// File: ./components/EmailPrompt.tsx
import React, { useState } from 'react';

interface EmailPromptProps {
  onSubmit: (email: string) => void;
  label?: string;
}

const EmailPrompt: React.FC<EmailPromptProps> = ({ onSubmit, label = 'Please share your email so we can connect you with an engineer.' }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const handleSubmit = () => {
    if (!email.trim() || !isValidEmail(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    onSubmit(email.trim());
    setEmail('');
  };

  return (
    <div className="mt-3 w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-3">
      <p className="text-sm font-semibold text-gray-800">{label}</p>
      <input
        type="email"
        className="w-full text-sm p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          className="text-xs sm:text-sm px-4 py-2 rounded-lg bg-[#2563EB] text-white border border-[#1D4ED8] hover:bg-[#1D4ED8] hover:border-[#1E40AF] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#2563eb]/60 transition-all"
        >
          Submit email
        </button>
      </div>
    </div>
  );
};

export default EmailPrompt;
