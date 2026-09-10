'use client';

import React from 'react';

export function HeroBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 select-none">
      {/* 1. Deep Midnight Base Background */}
      <div className="absolute inset-0 bg-[#030717]" />

      {/* 2. Atmospheric Radial Glows */}
      {/* Left Cyan/Blue Glow */}
      <div
        className="absolute -top-10 -left-16 w-[480px] h-[480px] rounded-full bg-blue-600/12 blur-[130px]"
        aria-hidden="true"
      />
      {/* Center/Right Purple/Violet Glow */}
      <div
        className="absolute -top-24 right-[10%] w-[580px] h-[580px] rounded-full bg-purple-600/15 blur-[140px]"
        aria-hidden="true"
      />
      {/* Bottom Center Subtle Indigo Glow */}
      <div
        className="absolute bottom-0 left-[30%] w-[500px] h-[400px] rounded-full bg-indigo-600/10 blur-[120px]"
        aria-hidden="true"
      />

      {/* 3. Subtle Futuristic Grid Pattern */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b16_1px,transparent_1px),linear-gradient(to_bottom,#1e293b16_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_35%,#000_70%,transparent_100%)] opacity-25"
        aria-hidden="true"
      />

      {/* 4. Left Flowing Curved Waves (Matching Image 1) */}
      <div className="hidden sm:block absolute -left-12 bottom-4 w-[420px] h-[360px] opacity-45">
        <svg
          className="w-full h-full"
          viewBox="0 0 500 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="heroLeftWave" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#7C3AED" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          <path
            d="M -40 370 Q 90 290 150 190 T 330 60"
            stroke="url(#heroLeftWave)"
            strokeWidth="2"
          />
          <path
            d="M -60 400 Q 110 310 180 210 T 370 80"
            stroke="url(#heroLeftWave)"
            strokeWidth="1.5"
            strokeDasharray="6 3"
          />
          <path
            d="M -80 430 Q 130 330 210 230 T 410 100"
            stroke="url(#heroLeftWave)"
            strokeWidth="1.2"
            strokeOpacity="0.6"
          />
          <path
            d="M -20 340 Q 70 270 120 170 T 290 40"
            stroke="url(#heroLeftWave)"
            strokeWidth="1"
            strokeOpacity="0.45"
          />
        </svg>
      </div>

      {/* 5. Right Flowing Curved Waves (Matching Image 1) */}
      <div className="hidden sm:block absolute -right-12 bottom-4 w-[440px] h-[380px] opacity-45">
        <svg
          className="w-full h-full"
          viewBox="0 0 500 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="heroRightWave" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          <path
            d="M 540 370 Q 410 290 350 190 T 170 60"
            stroke="url(#heroRightWave)"
            strokeWidth="2"
          />
          <path
            d="M 560 400 Q 390 310 320 210 T 130 80"
            stroke="url(#heroRightWave)"
            strokeWidth="1.5"
            strokeDasharray="6 3"
          />
          <path
            d="M 580 430 Q 370 330 290 230 T 90 100"
            stroke="url(#heroRightWave)"
            strokeWidth="1.2"
            strokeOpacity="0.6"
          />
          <path
            d="M 520 340 Q 430 270 380 170 T 210 40"
            stroke="url(#heroRightWave)"
            strokeWidth="1"
            strokeOpacity="0.45"
          />
        </svg>
      </div>
    </div>
  );
}
