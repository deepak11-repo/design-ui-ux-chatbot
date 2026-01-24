// File: ./components/RatingPrompt.tsx
import React, { useState } from 'react';

interface RatingPromptProps {
  onSubmit: (score: number) => void;
  label?: string;
}

const RatingPrompt: React.FC<RatingPromptProps> = ({ onSubmit, label = 'How would you rate this design?' }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const handleClick = (score: number) => {
    setSelected(score);
    onSubmit(score);
  };

  const getColor = (index: number) => {
    const active = hovered !== null ? index <= hovered : index <= (selected || 0);
    if (!active) return 'text-gray-300';
    if (index >= 4) return 'text-green-500';
    if (index === 3) return 'text-amber-400';
    return 'text-orange-400';
  };

  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="mt-3 w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-3">
      <p className="text-sm font-semibold text-gray-800">{label}</p>
      <div className="flex items-center gap-2">
        {stars.map((value) => (
          <button
            key={value}
            type="button"
            className={`text-2xl sm:text-3xl transition-transform duration-150 focus:outline-none ${getColor(value)} hover:scale-110`}
            aria-label={`Rate ${value} out of 5`}
            onMouseEnter={() => setHovered(value)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleClick(value)}
          >
            ⭐
          </button>
        ))}
      </div>
    </div>
  );
};

export default RatingPrompt;
