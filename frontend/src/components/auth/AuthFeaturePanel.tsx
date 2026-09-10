'use client';

import React from 'react';
import {
  Sparkles,
  Briefcase,
  Building2,
  HelpCircle,
  ShieldCheck,
  Calendar,
  Mic,
  TrendingUp,
  Users
} from 'lucide-react';

export const SEVEN_FEATURES = [
  {
    number: '01',
    title: 'Job-Focused Preparation',
    description: 'Turn any job description into a personalized interview preparation plan.',
    icon: Briefcase,
    accentContainer: 'bg-amber-500/10 border-amber-500/25 text-amber-400',
    numberColor: 'text-amber-500/50'
  },
  {
    number: '02',
    title: 'Company Intelligence',
    description: 'Research the company, products, culture, engineering context, and interview process.',
    icon: Building2,
    accentContainer: 'bg-blue-500/10 border-blue-500/25 text-blue-400',
    numberColor: 'text-blue-500/50'
  },
  {
    number: '03',
    title: 'Personalized Question Bank',
    description: 'Generate targeted Technical, Behavioural, System Design, and Company Fit questions from the role.',
    icon: HelpCircle,
    accentContainer: 'bg-purple-500/10 border-purple-500/25 text-purple-400',
    numberColor: 'text-purple-500/50'
  },
  {
    number: '04',
    title: 'Deterministic Coverage',
    description: 'Make sure every must-have requirement from the job description is covered by interview questions.',
    icon: ShieldCheck,
    accentContainer: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
    numberColor: 'text-emerald-500/50'
  },
  {
    number: '05',
    title: 'Smart Study Schedule',
    description: 'Get a structured day-by-day preparation schedule based on the exact number of days available.',
    icon: Calendar,
    accentContainer: 'bg-pink-500/10 border-pink-500/25 text-pink-400',
    numberColor: 'text-pink-500/50'
  },
  {
    number: '06',
    title: 'Real Interview Practice',
    description: 'Practice questions, write answers, rate your confidence, and track your preparation progress.',
    icon: Mic,
    accentContainer: 'bg-violet-500/15 border-violet-500/40 text-violet-400',
    numberColor: 'text-violet-400/80',
    highlighted: true
  },
  {
    number: '07',
    title: 'Weak Spots Analysis',
    description: 'Identify weak areas through performance analytics and focus your revision where you need it most.',
    icon: TrendingUp,
    accentContainer: 'bg-rose-500/10 border-rose-500/25 text-rose-400',
    numberColor: 'text-rose-500/50'
  }
];

export function AuthFeaturePanel() {
  return (
    <div className="w-full max-w-[460px] space-y-3 sm:space-y-3.5 text-left">
      {/* 1. Header Section */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-[9px] font-bold tracking-wider uppercase">
          <Sparkles className="w-2.5 h-2.5 text-purple-400" />
          <span>WHY CHOOSE US</span>
        </div>

        <h2 className="text-xl sm:text-[22px] lg:text-[24px] font-extrabold text-white tracking-tight leading-tight">
          Everything You Need to{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Prepare Smarter
          </span>
        </h2>

        <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed max-w-sm">
          Turn job opportunities into interview success with the power of AI.
        </p>
      </div>

      {/* 2. Seven Features (Vertical Structured Rows, scaled to ~45-52px height) */}
      <div className="space-y-1.5">
        {SEVEN_FEATURES.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.number}
              className={`group p-2 sm:p-2.5 rounded-lg border transition-all duration-200 flex items-start gap-2.5 text-left ${
                item.highlighted
                  ? 'bg-gradient-to-r from-violet-950/40 via-indigo-950/50 to-slate-900/70 border-violet-500/40 shadow-sm shadow-indigo-950/40 ring-1 ring-violet-500/30'
                  : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/70'
              }`}
            >
              {/* Colored Icon Container */}
              <div
                className={`w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-105 ${item.accentContainer}`}
              >
                <Icon className="w-3 h-3" />
              </div>

              {/* Title & Description */}
              <div className="flex-1 min-w-0 pr-1.5">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-[11px] sm:text-xs font-bold text-slate-100 group-hover:text-white transition-colors leading-tight">
                    {item.title}
                  </h3>
                  {item.highlighted && (
                    <span className="text-[7px] font-extrabold uppercase px-1 py-0.1 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      Core
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-[10.5px] text-slate-400 group-hover:text-slate-300 leading-snug mt-0.5">
                  {item.description}
                </p>
              </div>

              {/* Right-Aligned Number */}
              <div className="shrink-0 self-center">
                <span className={`font-mono text-[11px] sm:text-xs font-bold tracking-wider ${item.numberColor}`}>
                  {item.number}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Learner Statistics Card (Bottom of Right Panel, compact ~42px height) */}
      <div className="p-2.5 sm:p-3 rounded-lg bg-gradient-to-r from-slate-900/80 via-indigo-950/30 to-slate-900/80 border border-indigo-500/20 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-sm shadow-indigo-950/20">
        <div className="flex items-center gap-2 text-left">
          <div className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-md bg-indigo-600/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0">
            <Users className="w-3 h-3" />
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-300 leading-snug">
            Join thousands of students and professionals who are preparing smarter with AI.
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Overlapping Avatar Stack */}
          <div className="flex -space-x-1.5">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-slate-900 flex items-center justify-center text-[7px] font-bold text-white shadow-sm">
              S
            </div>
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 border border-slate-900 flex items-center justify-center text-[7px] font-bold text-white shadow-sm">
              M
            </div>
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 border border-slate-900 flex items-center justify-center text-[7px] font-bold text-white shadow-sm">
              K
            </div>
          </div>
          <div className="text-left leading-none pl-0.5">
            <div className="text-[11px] font-black text-white tracking-tight">10K+</div>
            <div className="text-[8px] font-medium text-slate-400">Learners</div>
          </div>
        </div>
      </div>
    </div>
  );
}
