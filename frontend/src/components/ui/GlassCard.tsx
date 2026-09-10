'use client';

import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'highlight' | 'subtle';
  className?: string;
  glow?: boolean;
}

export function GlassCard({
  children,
  variant = 'default',
  className = '',
  glow = false,
  ...props
}: GlassCardProps) {
  const variantStyles = {
    default: 'bg-slate-900/60 border-slate-800/80 hover:border-indigo-500/35',
    highlight: 'bg-gradient-to-r from-violet-950/40 via-indigo-950/50 to-slate-900/70 border-violet-500/40 shadow-md shadow-indigo-950/40 ring-1 ring-violet-500/30',
    subtle: 'bg-slate-950/50 border-slate-800/60 hover:border-slate-700/80'
  };

  const glowStyle = glow ? 'shadow-[0_0_30px_rgba(79,70,229,0.15)]' : '';

  return (
    <div
      className={`relative rounded-2xl border backdrop-blur-xl transition-all duration-200 ${variantStyles[variant]} ${glowStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
