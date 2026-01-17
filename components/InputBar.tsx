import React, { useState } from 'react';

interface InputBarProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

const SendIcon: React.FC<{ className: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
    </svg>
);

const InputBar: React.FC<InputBarProps> = ({ onSendMessage, isLoading, placeholder }) => {
  const [text, setText] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(text);
      setText('');
    }
  };

  const handleSendClick = () => {
    if (text.trim()) {
      onSendMessage(text);
      setText('');
    }
  };
  
  const inputClasses = "flex-1 px-4 py-2.5 bg-white text-sm text-[#2C2C2C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 border border-[#E5E5E5] focus:border-[#2563eb] transition-all placeholder-[#888888] cursor-text hover:border-[#D0D0D0]";
  const buttonClasses = "bg-transparent border-2 border-[#FFE5A0] text-[#2C2C2C] rounded-full p-2.5 hover:bg-[#FFE5A0]/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFE5A0]/50 disabled:opacity-50 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer";
  const placeholderText = placeholder || "Type your message...";

  return (
    <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-[#E5E5E5] shrink-0 bg-white">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholderText}
          className={inputClasses + " disabled:opacity-50"}
          disabled={isLoading}
          aria-label="Message input"
        />
        <button
          type="submit"
          onClick={handleSendClick}
          className={buttonClasses + " disabled:cursor-not-allowed shrink-0"}
          disabled={isLoading || !text.trim()}
          aria-label="Send message"
        >
          <SendIcon className="w-5 h-5 text-[#2C2C2C]" />
        </button>
      </div>
    </form>
  );
};

export default InputBar;