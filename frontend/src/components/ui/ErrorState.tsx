import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-rose-500/25 bg-rose-950/20 backdrop-blur-md rounded-2xl relative overflow-hidden">
      {/* Subtle Rose Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-sm shadow-rose-950/40 relative z-10">
        <AlertCircle className="w-6 h-6" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-rose-200 mb-1 relative z-10">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-5 leading-relaxed relative z-10">{message}</p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="relative z-10 inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}
