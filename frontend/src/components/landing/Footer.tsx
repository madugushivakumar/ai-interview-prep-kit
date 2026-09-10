'use client';

import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full max-w-6xl mx-auto pt-12 pb-8 border-t border-slate-800/60 mt-12 text-xs text-slate-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        {/* Left Side: Copyright */}
        <div>
          <p>© 2026 AI Interview Prep Kit. All rights reserved.</p>
        </div>

        {/* Right Side: Links */}
        <div className="flex items-center gap-6 text-slate-400">
          <Link
            href="/terms"
            className="hover:text-slate-200 transition-colors"
          >
            Terms of Service
          </Link>
          <span className="text-slate-700">•</span>
          <Link
            href="/privacy"
            className="hover:text-slate-200 transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="text-slate-700">•</span>
          <a
            href="mailto:support@aiinterviewprep.kit"
            className="hover:text-slate-200 transition-colors"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
