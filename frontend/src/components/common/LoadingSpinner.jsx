import React from 'react';

export default function LoadingSpinner({ size = 'md', color = 'text-primary' }) {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`${sizeMap[size]} ${color} border-t-transparent rounded-full animate-spin`}
      />
    </div>
  );
}