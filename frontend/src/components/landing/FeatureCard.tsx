'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentContainer: string;
  accentIcon: string;
  href?: string;
}

interface FeatureCardProps {
  feature: FeatureItem;
  className?: string;
}

export function FeatureCard({ feature, className = '' }: FeatureCardProps) {
  const Icon = feature.icon;

  const content = (
    <div
      className={`group relative flex flex-col justify-between h-full bg-slate-900/60 border border-slate-800/90 hover:border-slate-700/90 rounded-2xl p-5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-950/40 text-left ${className}`}
    >
      {/* Top Section: Icon & Title */}
      <div>
        {/* Accent Icon Container */}
        <div
          className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-105 ${feature.accentContainer}`}
        >
          <Icon className={`w-5 h-5 ${feature.accentIcon}`} />
        </div>

        {/* Feature Title */}
        <h3 className="text-sm font-bold text-slate-100 group-hover:text-white transition-colors mb-1.5">
          {feature.title}
        </h3>

        {/* Feature Description */}
        <p className="text-xs text-slate-400 group-hover:text-slate-300 leading-relaxed min-h-[50px]">
          {feature.description}
        </p>
      </div>

      {/* Bottom Row: Subtle Divider & Small Circular Arrow Button (○ →) */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-500 group-hover:text-slate-400 transition-colors">
          Capability
        </span>
        <div className="w-7 h-7 rounded-full bg-slate-800/80 border border-slate-700/70 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-all duration-200 shadow-sm">
          <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );

  if (feature.href) {
    return (
      <Link href={feature.href} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}
