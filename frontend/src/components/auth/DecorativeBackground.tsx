'use client';

import React from 'react';

interface DecorativeBackgroundProps {
  pageType: 'signup' | 'signin';
}

export function DecorativeBackground({ pageType }: DecorativeBackgroundProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 select-none">
      {/* 1. Deep Midnight Base & Ambient Gradients */}
      <div className="absolute inset-0 bg-[#030717]" />

      <div
        className="absolute -top-[15%] left-[5%] w-[420px] h-[420px] rounded-full bg-purple-600/12 blur-[100px]"
        aria-hidden="true"
      />
      <div
        className="absolute top-[30%] right-[0%] w-[480px] h-[480px] rounded-full bg-blue-600/12 blur-[110px]"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-[10%] left-[25%] w-[380px] h-[380px] rounded-full bg-cyan-600/10 blur-[100px]"
        aria-hidden="true"
      />

      {/* 2. Futuristic Grid Pattern */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b18_1px,transparent_1px),linear-gradient(to_bottom,#1e293b18_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-20"
        aria-hidden="true"
      />

      {/* 3. Decorative Left Wave (Scaled down ~30-35%) */}
      <div className="hidden md:block absolute -left-12 top-[28%] w-[250px] h-[350px] opacity-35">
        <svg
          className="w-full h-full"
          viewBox="0 0 400 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="leftWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path
            d="M -50,50 Q 180,180 120,340 T 260,560"
            stroke="url(#leftWaveGrad)"
            strokeWidth="1.75"
            strokeDasharray="4 2"
          />
          <path
            d="M -70,90 Q 210,210 140,380 T 290,590"
            stroke="url(#leftWaveGrad)"
            strokeWidth="2"
          />
          <path
            d="M -90,130 Q 240,240 160,420 T 320,620"
            stroke="url(#leftWaveGrad)"
            strokeWidth="1.25"
            strokeOpacity="0.5"
          />
          <path
            d="M -110,170 Q 270,270 180,460 T 350,650"
            stroke="url(#leftWaveGrad)"
            strokeWidth="0.75"
            strokeOpacity="0.3"
          />
        </svg>
      </div>

      {/* 4. Decorative Right Wave (Scaled down ~30-35%) */}
      <div className="hidden md:block absolute -right-12 top-[15%] w-[250px] h-[380px] opacity-35">
        <svg
          className="w-full h-full"
          viewBox="0 0 400 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="rightWaveGrad" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#6366F1" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path
            d="M 450,40 Q 220,180 280,360 T 140,580"
            stroke="url(#rightWaveGrad)"
            strokeWidth="2"
          />
          <path
            d="M 470,80 Q 190,220 250,400 T 110,610"
            stroke="url(#rightWaveGrad)"
            strokeWidth="1.5"
            strokeDasharray="5 3"
          />
          <path
            d="M 490,120 Q 160,260 220,440 T 80,640"
            stroke="url(#rightWaveGrad)"
            strokeWidth="1"
            strokeOpacity="0.4"
          />
        </svg>
      </div>

      {/* 5. Handwritten Decorative Text & Curved Arrows (Desktop Only) */}
      {/* 5A. Top Left Annotation */}
      <div className="hidden 2xl:block absolute left-[max(0.5rem,calc((100vw-880px)/2-95px))] top-16 z-10">
        <div className="flex flex-col items-center rotate-[-8deg]">
          <div className="text-center font-mono text-[9.5px] font-black tracking-wider leading-tight">
            {pageType === 'signup' ? (
              <>
                <span className="bg-gradient-to-r from-purple-300 via-pink-400 to-indigo-300 bg-clip-text text-transparent block">
                  Better
                </span>
                <span className="bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent block">
                  Prep
                </span>
                <span className="text-amber-300 block">Brighter</span>
                <span className="text-emerald-400 block">Future!</span>
              </>
            ) : (
              <>
                <span className="bg-gradient-to-r from-purple-300 via-pink-400 to-indigo-300 bg-clip-text text-transparent block">
                  Same
                </span>
                <span className="bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent block">
                  Goals
                </span>
                <span className="text-amber-300 block">Brighter</span>
                <span className="text-emerald-400 block">Future!</span>
              </>
            )}
          </div>
          {/* Hand-drawn Curved Arrow pointing right toward card */}
          <svg
            className="w-8 h-6 text-pink-400/80 -mt-0.5 ml-4 rotate-12"
            viewBox="0 0 50 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M 10 10 Q 30 15 35 30" />
            <path d="M 28 27 L 35 30 L 36 21" />
          </svg>
        </div>
      </div>

      {/* 5B. Lower Left Annotation: "You Can Do It!" */}
      <div className="hidden 2xl:block absolute left-[max(0.5rem,calc((100vw-880px)/2-85px))] bottom-28 z-10">
        <div className="flex flex-col items-center rotate-[6deg]">
          <div className="text-center font-mono text-[9.5px] font-black tracking-wider leading-tight">
            <span className="text-indigo-300 block">You</span>
            <span className="text-purple-300 block">Can</span>
            <span className="text-cyan-300 block">Do</span>
            <span className="text-emerald-400 block font-extrabold">It!</span>
          </div>
          {/* Curved Arrow pointing up/right */}
          <svg
            className="w-7 h-6 text-cyan-400/80 -mt-0.5 ml-2.5"
            viewBox="0 0 45 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M 8 32 Q 22 25 32 10" />
            <path d="M 24 10 L 32 10 L 32 18" />
          </svg>
        </div>
      </div>

      {/* 5C. Right Annotation: "Practice Smarter Get Hired!" */}
      <div className="hidden 2xl:block absolute right-[max(0.5rem,calc((100vw-880px)/2-95px))] top-20 z-10">
        <div className="flex flex-col items-center rotate-[8deg]">
          <div className="text-center font-mono text-[9.5px] font-black tracking-wider leading-tight">
            <span className="text-pink-300 block">Practice</span>
            <span className="bg-gradient-to-r from-amber-300 to-pink-400 bg-clip-text text-transparent block">
              Smarter
            </span>
            <span className="text-emerald-300 font-extrabold block">Get Hired!</span>
          </div>
          {/* Curved Arrow pointing toward features panel */}
          <svg
            className="w-8 h-6 text-indigo-400/80 -mt-0.5 -ml-2.5 rotate-[-15deg]"
            viewBox="0 0 50 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M 40 10 Q 20 18 12 32" />
            <path d="M 12 23 L 12 32 L 21 31" />
          </svg>
        </div>
      </div>
    </div>
  );
}
