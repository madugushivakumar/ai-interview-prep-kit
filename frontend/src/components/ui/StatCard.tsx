'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

export type StatAccent = 'blue' | 'emerald' | 'pink' | 'amber' | 'cyan' | 'purple';

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  subtext?: string;
  accent?: StatAccent;
  className?: string;
  onClick?: () => void;
}

const ACCENT_STYLES: Record<
  StatAccent,
  {
    container: string;
    icon: string;
    value: string;
    border: string;
    glow: string;
  }
> = {
  blue: {
    container: 'bg-blue-950/30 hover:bg-blue-950/45',
    icon: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
    value: 'text-white',
    border: 'border-blue-500/25 hover:border-blue-500/40',
    glow: 'hover:shadow-[0_0_25px_rgba(59,130,246,0.15)]'
  },
  emerald: {
    container: 'bg-emerald-950/30 hover:bg-emerald-950/45',
    icon: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    value: 'text-emerald-400',
    border: 'border-emerald-500/25 hover:border-emerald-500/40',
    glow: 'hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]'
  },
  pink: {
    container: 'bg-pink-950/30 hover:bg-pink-950/45',
    icon: 'text-pink-400 bg-pink-500/10 border-pink-500/25',
    value: 'text-pink-400',
    border: 'border-pink-500/25 hover:border-pink-500/40',
    glow: 'hover:shadow-[0_0_25px_rgba(236,72,153,0.15)]'
  },
  amber: {
    container: 'bg-amber-950/30 hover:bg-amber-950/45',
    icon: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
    value: 'text-amber-400',
    border: 'border-amber-500/25 hover:border-amber-500/40',
    glow: 'hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]'
  },
  cyan: {
    container: 'bg-cyan-950/30 hover:bg-cyan-950/45',
    icon: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
    value: 'text-cyan-400',
    border: 'border-cyan-500/25 hover:border-cyan-500/40',
    glow: 'hover:shadow-[0_0_25px_rgba(34,211,238,0.15)]'
  },
  purple: {
    container: 'bg-purple-950/30 hover:bg-purple-950/45',
    icon: 'text-purple-400 bg-purple-500/10 border-purple-500/25',
    value: 'text-purple-300',
    border: 'border-purple-500/25 hover:border-purple-500/40',
    glow: 'hover:shadow-[0_0_25px_rgba(168,85,247,0.15)]'
  }
};

export function StatCard({
  icon: Icon,
  value,
  label,
  subtext,
  accent = 'blue',
  className = '',
  onClick
}: StatCardProps) {
  const styles = ACCENT_STYLES[accent];

  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl sm:rounded-2xl border p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-200 backdrop-blur-md ${styles.container} ${styles.border} ${styles.glow} ${
        onClick ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center shrink-0 ${styles.icon}`}
        >
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        {subtext && (
          <span className="text-[10px] font-semibold text-slate-400 truncate">
            {subtext}
          </span>
        )}
      </div>

      <div>
        <div className={`text-xl sm:text-2xl font-black tracking-tight leading-none mb-1 ${styles.value}`}>
          {value}
        </div>
        <div className="text-[11px] sm:text-xs font-medium text-slate-400 leading-tight">
          {label}
        </div>
      </div>
    </div>
  );
}
