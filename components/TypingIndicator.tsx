import React from 'react';
import BotAvatar from './BotAvatar';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-end gap-3">
      <BotAvatar />
      <div className="px-4 py-3 rounded-xl rounded-bl-none bg-[#FFFBEB] border border-[#FFE5A0] flex items-center space-x-1.5 shadow-md">
          <div className="w-2 h-2 bg-[#FFE5A0] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-[#FFE5A0] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
          <div className="w-2 h-2 bg-[#FFE5A0] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
      </div>
    </div>
  );
};

export default TypingIndicator;