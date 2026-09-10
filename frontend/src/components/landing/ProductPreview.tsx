'use client';

import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Briefcase,
  TrendingUp,
  Bookmark,
  Settings,
  Sparkles,
  FileText,
  BarChart2,
  Target,
  Flame,
  Diamond
} from 'lucide-react';

export function ProductPreview() {
  return (
    <div className="relative w-full max-w-[480px] mx-auto lg:mx-0">
      {/* 1. Soft Atmospheric Radial Glow Behind Dashboard */}
      <div
        className="absolute -inset-4 bg-gradient-to-tr from-purple-600/30 via-indigo-600/25 to-blue-500/20 rounded-3xl blur-2xl -z-10 opacity-70 pointer-events-none"
        aria-hidden="true"
      />

      {/* 2. Decorative Handwritten Callout & Curved Arrow (Matching Image 1) */}
      <div className="hidden xl:block absolute -top-1 -right-16 z-20 pointer-events-none select-none">
        <div className="flex flex-col items-center rotate-6">
          <div className="text-center font-handwriting text-purple-300 font-bold text-base leading-tight tracking-wide drop-shadow-[0_0_12px_rgba(168,85,247,0.4)]">
            <span className="block">Practice</span>
            <span className="block">Smarter</span>
            <span className="block text-purple-200">Get Hired!</span>
          </div>
          {/* Curved Hand-drawn Arrow Pointing Down-Left Toward Dashboard */}
          <svg
            className="w-8 h-8 text-purple-400 -mt-1 ml-1"
            viewBox="0 0 40 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M 28 6 Q 16 12 12 24" />
            <path d="M 8 20 L 12 24 L 18 20" />
          </svg>
        </div>
      </div>

      {/* 3. Main Dashboard Preview Card (Matching Image 1 Structure & Height) */}
      <div className="w-full bg-[#060B1E]/95 border border-indigo-500/30 rounded-2xl shadow-[0_0_50px_rgba(79,70,229,0.22)] backdrop-blur-xl p-3 sm:p-3.5 text-left select-none relative overflow-hidden">
        <div className="flex gap-2.5 sm:gap-3">
          {/* A. Left Sidebar */}
          <div className="w-24 sm:w-[110px] shrink-0 flex flex-col justify-between border-r border-slate-800/80 pr-2 sm:pr-2.5">
            <div>
              {/* Brand Header */}
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1px] shadow-sm shadow-indigo-500/30 shrink-0">
                  <div className="w-full h-full bg-slate-950 rounded-[5px] flex items-center justify-center">
                    <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                  </div>
                </div>
                <div className="leading-none">
                  <span className="text-[10px] font-extrabold text-white block">AI Interview</span>
                  <span className="text-[8.5px] font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent block">
                    Prep Kit
                  </span>
                </div>
              </div>

              {/* Sidebar Navigation Items */}
              <div className="space-y-1">
                {/* 1. Dashboard (Active Pill) */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-md px-2 py-1 flex items-center gap-1.5 text-[9px] sm:text-[9.5px] font-semibold shadow-sm">
                  <LayoutDashboard className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white shrink-0" />
                  <span className="truncate">Dashboard</span>
                </div>

                {/* 2. New Kit */}
                <div className="text-slate-400 hover:text-slate-200 px-2 py-0.5 sm:py-1 flex items-center gap-1.5 text-[9px] sm:text-[9.5px] transition-colors">
                  <PlusCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-500 shrink-0" />
                  <span className="truncate">New Kit</span>
                </div>

                {/* 3. My Interviews */}
                <div className="text-slate-400 hover:text-slate-200 px-2 py-0.5 sm:py-1 flex items-center gap-1.5 text-[9px] sm:text-[9.5px] transition-colors">
                  <Briefcase className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-500 shrink-0" />
                  <span className="truncate">My Interviews</span>
                </div>

                {/* 4. Progress */}
                <div className="text-slate-400 hover:text-slate-200 px-2 py-0.5 sm:py-1 flex items-center gap-1.5 text-[9px] sm:text-[9.5px] transition-colors">
                  <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-500 shrink-0" />
                  <span className="truncate">Progress</span>
                </div>

                {/* 5. Bookmarks */}
                <div className="text-slate-400 hover:text-slate-200 px-2 py-0.5 sm:py-1 flex items-center gap-1.5 text-[9px] sm:text-[9.5px] transition-colors">
                  <Bookmark className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-500 shrink-0" />
                  <span className="truncate">Bookmarks</span>
                </div>

                {/* 6. Settings */}
                <div className="text-slate-400 hover:text-slate-200 px-2 py-0.5 sm:py-1 flex items-center gap-1.5 text-[9px] sm:text-[9.5px] transition-colors">
                  <Settings className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-500 shrink-0" />
                  <span className="truncate">Settings</span>
                </div>
              </div>
            </div>
          </div>

          {/* B. Main Area */}
          <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2 sm:space-y-2.5">
            {/* Header Greeting & Date Badge */}
            <div className="flex items-start justify-between gap-1">
              <div>
                <h4 className="text-[11px] sm:text-xs font-bold text-white tracking-tight flex items-center gap-1 leading-tight">
                  Welcome back, Shiva Kumar <span>👋</span>
                </h4>
                <p className="text-[8.5px] sm:text-[9px] text-slate-400 mt-0.5 leading-none">
                  Let&apos;s make your next interview your best one.
                </p>
              </div>

              {/* Today Date Badge */}
              <div className="text-right shrink-0 bg-slate-900/60 border border-slate-800/80 rounded px-1.5 py-0.5">
                <div className="text-[7px] uppercase font-bold text-slate-500 leading-none">Today</div>
                <div className="text-[8px] font-bold text-slate-300 leading-tight mt-0.5">Sep 10, 2026</div>
              </div>
            </div>

            {/* Four Metric / Stat Cards (Horizontal Row of 4) */}
            <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
              {/* Stat 1: Questions Practiced (Blue) */}
              <div className="bg-blue-950/40 border border-blue-500/30 rounded-lg p-1 sm:p-1.5 flex flex-col items-center justify-center text-center">
                <FileText className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-400 mb-0.5" />
                <span className="text-[11px] sm:text-xs font-black text-white leading-none">24</span>
                <span className="text-[6.5px] sm:text-[7px] text-slate-400 leading-none mt-1 truncate max-w-full">
                  Questions Practiced
                </span>
              </div>

              {/* Stat 2: Average Score (Green) */}
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-1 sm:p-1.5 flex flex-col items-center justify-center text-center">
                <BarChart2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400 mb-0.5" />
                <span className="text-[11px] sm:text-xs font-black text-emerald-400 leading-none">78%</span>
                <span className="text-[6.5px] sm:text-[7px] text-slate-400 leading-none mt-1 truncate max-w-full">
                  Average Score
                </span>
              </div>

              {/* Stat 3: Weak Topics (Pink) */}
              <div className="bg-pink-950/40 border border-pink-500/30 rounded-lg p-1 sm:p-1.5 flex flex-col items-center justify-center text-center">
                <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-pink-400 mb-0.5" />
                <span className="text-[11px] sm:text-xs font-black text-pink-400 leading-none">5</span>
                <span className="text-[6.5px] sm:text-[7px] text-slate-400 leading-none mt-1 truncate max-w-full">
                  Weak Topics
                </span>
              </div>

              {/* Stat 4: Day Streak (Amber) */}
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-1 sm:p-1.5 flex flex-col items-center justify-center text-center">
                <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 mb-0.5" />
                <span className="text-[11px] sm:text-xs font-black text-amber-400 leading-none">12</span>
                <span className="text-[6.5px] sm:text-[7px] text-slate-400 leading-none mt-1 truncate max-w-full">
                  Days Streak
                </span>
              </div>
            </div>

            {/* Recent Practice Session */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[8.5px] sm:text-[9px]">
                <span className="font-bold text-slate-200">Recent Practice Session</span>
                <span className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer">
                  View All &rarr;
                </span>
              </div>

              {/* Practice Session Card */}
              <div className="bg-slate-900/60 border border-slate-800/90 rounded-lg p-2 space-y-1.5">
                <div className="text-[9.5px] sm:text-[10px] font-semibold text-slate-100 line-clamp-1">
                  What is event delegation in JavaScript?
                </div>

                <div className="flex items-center justify-between gap-2">
                  {/* Tag */}
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-300 text-[7.5px] font-bold shrink-0">
                    <Diamond className="w-1.5 h-1.5 text-purple-400 fill-purple-400" />
                    <span>Frontend</span>
                  </div>

                  {/* Progress Bar & Counter */}
                  <div className="flex-1 flex items-center gap-1.5 min-w-0">
                    <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="w-[30%] h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    </div>
                    <span className="text-[7.5px] text-slate-400 font-mono shrink-0">3/10</span>
                  </div>

                  {/* Practice Button */}
                  <button
                    type="button"
                    className="px-2.5 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[8.5px] font-bold shadow-sm shadow-indigo-600/30 transition-transform active:scale-95 shrink-0"
                  >
                    Practice
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
