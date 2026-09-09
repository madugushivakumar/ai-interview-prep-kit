import React from 'react';

export function LoadingSpinner({ message = 'Loading...', size = 'md' }: { message?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-2',
    lg: 'w-10 h-10 border-3'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className={`${sizeMap[size]} border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-3`} />
      {message && <p className="text-sm font-medium text-slate-400">{message}</p>}
    </div>
  );
}
