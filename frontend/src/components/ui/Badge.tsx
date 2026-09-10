import React from 'react';

export type BadgeVariant =
  | 'must'
  | 'nice'
  | 'technical'
  | 'behavioural'
  | 'domain'
  | 'system-design'
  | 'company-fit'
  | 'easy'
  | 'medium'
  | 'hard'
  | 'active'
  | 'completed'
  | 'weak'
  | 'mastered'
  | 'default';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className = ''
}: BadgeProps) {
  const sizeClasses = {
    xs: 'px-1.5 py-0.2 text-[9px] font-bold',
    sm: 'px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold',
    md: 'px-2.5 py-1 text-xs font-semibold'
  }[size];

  const variantStyles: Record<BadgeVariant, string> = {
    must: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
    nice: 'bg-slate-800 text-slate-400 border border-slate-700',
    technical: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    behavioural: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    domain: 'bg-teal-500/15 text-teal-300 border border-teal-500/30',
    'system-design': 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
    'company-fit': 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    easy: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    medium: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    hard: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    active: 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/40',
    completed: 'bg-blue-950/50 text-blue-400 border border-blue-500/40',
    weak: 'bg-rose-950/50 text-rose-400 border border-rose-500/40',
    mastered: 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40',
    default: 'bg-slate-800/80 text-slate-300 border border-slate-700/80'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full tracking-wide ${sizeClasses} ${variantStyles[variant] || variantStyles.default} ${className}`}
    >
      {children}
    </span>
  );
}
