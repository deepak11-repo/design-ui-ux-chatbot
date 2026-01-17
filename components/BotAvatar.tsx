import React from 'react';

const BotAvatar: React.FC = () => (
  <div className="w-8 h-8 rounded-full border-2 border-[#FFE5A0] flex items-center justify-center flex-shrink-0 overflow-hidden">
    <img 
      src={`${import.meta.env.BASE_URL}assets/wisdmlabs_logo.webp`} 
      alt="WisdmLabs Logo" 
      className="h-full w-full rounded-full object-cover" 
    />
  </div>
);

export default BotAvatar;