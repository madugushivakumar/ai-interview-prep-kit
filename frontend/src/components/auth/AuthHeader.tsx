'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowLeft, Sun, Moon } from 'lucide-react';

export function AuthHeader() {
  const [isDark, setIsDark] = useState(true);

  return (
    <header className="w-full h-11 sm:h-12 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md z-30 sticky top-0">
      <div className="max-w-[850px] w-full mx-auto px-4 sm:px-5 h-full flex items-center justify-between">
        {/* Left Side: AI Brain Logo + AI Interview Prep Kit */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1px] shadow-sm shadow-indigo-500/25">
            <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center group-hover:bg-slate-900 transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </div>
          </div>
          <span className="font-extrabold text-xs sm:text-sm tracking-tight text-white">
            AI Interview{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Prep Kit
            </span>
          </span>
        </Link>

        {/* Right Side: Theme Toggle | ← Back to Home */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => setIsDark(!isDark)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-3 h-3 text-amber-300/80" />
            ) : (
              <Moon className="w-3 h-3 text-slate-300" />
            )}
          </button>

          <div className="h-3 w-[1px] bg-slate-800" aria-hidden="true" />

          <Link
            href="/"
            className="flex items-center gap-1 text-[11px] sm:text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
