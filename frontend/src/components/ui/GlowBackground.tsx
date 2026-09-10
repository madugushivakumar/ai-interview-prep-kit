'use client';

import React from 'react';

interface GlowBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  intensity?: 'subtle' | 'medium' | 'vibrant';
}

export function GlowBackground({
  children,
  className = '',
  intensity = 'medium'
}: GlowBackgroundProps) {
  const opacityMap = {
    subtle: 'opacity-15',
    medium: 'opacity-25',
    vibrant: 'opacity-35'
  };

  return (
    <div className={`relative w-full min-h-screen bg-[#030717] text-slate-100 ${className}`}>
      {/* 1. Ambient Radial Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 select-none">
        {/* Top-Left Blue Glow */}
        <div
          className="absolute -top-20 -left-20 w-[520px] h-[520px] rounded-full bg-blue-600/10 blur-[130px]"
          aria-hidden="true"
        />
        {/* Top-Right Purple Glow */}
        <div
          className="absolute -top-32 right-[5%] w-[600px] h-[600px] rounded-full bg-purple-600/12 blur-[140px]"
          aria-hidden="true"
        />
        {/* Center-Bottom Cyan/Indigo Glow */}
        <div
          className="absolute bottom-0 left-[20%] w-[540px] h-[450px] rounded-full bg-indigo-600/10 blur-[130px]"
          aria-hidden="true"
        />

        {/* 2. Futuristic Grid Pattern */}
        <div
          className={`absolute inset-0 bg-[linear-gradient(to_right,#1e293b16_1px,transparent_1px),linear-gradient(to_bottom,#1e293b16_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_40%,#000_70%,transparent_100%)] ${opacityMap[intensity]}`}
          aria-hidden="true"
        />
      </div>

      {/* 3. Page Content */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}
