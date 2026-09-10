'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

interface CTASectionProps {
  ctaHref: string;
}

export function CTASection({ ctaHref }: CTASectionProps) {
  return (
    <div className="relative w-full max-w-6xl mx-auto pt-6">
      {/* Subtle Glow behind CTA */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-indigo-600/15 via-purple-600/15 to-cyan-500/15 rounded-3xl blur-2xl -z-10 opacity-70 pointer-events-none"
        aria-hidden="true"
      />

      {/* Main Banner Container */}
      <div className="relative rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-slate-900/95 via-indigo-950/40 to-slate-900/95 p-6 sm:p-10 shadow-2xl backdrop-blur-md overflow-hidden">
        {/* Background Decorative Sparkle Accents */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-300 uppercase tracking-wider">
              <span>🚀</span>
              <span>Ready to Start Your Preparation?</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ready to Start Your Preparation?
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Join students and professionals who are preparing smarter with AI.
            </p>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <Link
              href={ctaHref}
              className="flex items-center gap-2 px-6 py-3 text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
