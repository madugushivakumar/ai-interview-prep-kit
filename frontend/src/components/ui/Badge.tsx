import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'must' | 'nice' | 'technical' | 'behavioural' | 'domain' | 'system-design' | 'company-fit' | 'easy' | 'medium' | 'hard' | 'default';
  size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  const variantStyles: Record<string, string> = {
    must: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
    nice: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    technical: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
    behavioural: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    domain: 'bg-teal-500/15 text-teal-300 border border-teal-500/30',
    'system-design': 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
    'company-fit': 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    easy: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    medium: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    hard: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    default: 'bg-slate-800 text-slate-300 border border-slate-700'
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${sizeClasses} ${variantStyles[variant] || variantStyles.default}`}>
      {children}
    </span>
  );
}
