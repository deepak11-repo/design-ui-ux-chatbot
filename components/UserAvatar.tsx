import React from 'react';

const UserAvatar: React.FC = () => (
  <div className="w-8 h-8 rounded-full bg-[#EDF5FF] flex items-center justify-center ring-2 ring-white/20 flex-shrink-0">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#2C2C2C]" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  </div>
);

export default UserAvatar;