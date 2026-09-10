'use client';

import React from 'react';
import Link from 'next/link';

export function AuthFooter() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/40 mt-auto py-3.5 sm:py-4 text-[10px] sm:text-[11px] text-slate-500 relative z-20">
      <div className="max-w-[850px] w-full mx-auto px-4 sm:px-5 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
        {/* Left Side: Copyright */}
        <div>
          <p>© 2026 AI Interview Prep Kit. All rights reserved.</p>
        </div>

        {/* Right Side: Links & Social Icons */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4 text-slate-400 text-[10px] sm:text-[11px]">
          <Link href="/terms" className="hover:text-slate-200 transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-slate-200 transition-colors">
            Privacy Policy
          </Link>
          <a
            href="mailto:support@aiinterviewprep.kit"
            className="hover:text-slate-200 transition-colors"
          >
            Contact
          </a>

          <div className="hidden sm:block h-2.5 w-[1px] bg-slate-800" aria-hidden="true" />

          {/* Social Icons */}
          <div className="flex items-center gap-2 text-slate-500">
            {/* GitHub */}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors"
              aria-label="GitHub"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>

            {/* LinkedIn */}
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors"
              aria-label="LinkedIn"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
            </a>

            {/* Twitter / X */}
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors"
              aria-label="Twitter"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
