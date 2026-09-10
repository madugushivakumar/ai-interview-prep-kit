import React from 'react';
import Link from 'next/link';
import { LucideIcon, Inbox, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: LucideIcon;
}

export function EmptyState({
  title,
  description,
  actionText,
  actionHref,
  onAction,
  icon: Icon = Inbox
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center border border-dashed border-indigo-500/25 rounded-2xl bg-slate-900/40 backdrop-blur-md relative overflow-hidden">
      {/* Subtle Ambient Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-sm shadow-indigo-500/20 relative z-10">
        <Icon className="w-6 h-6" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-slate-100 mb-1 relative z-10">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed relative z-10">{description}</p>

      {actionText && (
        <div className="relative z-10">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>{actionText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>{actionText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
