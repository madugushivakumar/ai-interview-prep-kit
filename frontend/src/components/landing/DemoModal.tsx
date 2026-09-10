'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  Sparkles,
  Search,
  BookOpen,
  Brain,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  ctaHref: string;
}

const DEMO_STEPS = [
  {
    step: '01',
    title: 'Input Job Description & Target Role',
    description:
      'Paste any job posting or job requirements. The engine autonomously extracts responsibilities, must-have technologies, and role seniority.',
    icon: BookOpen,
    accent: 'text-sky-400 bg-sky-500/10 border-sky-500/30'
  },
  {
    step: '02',
    title: 'Autonomous Company Crawler & Intel',
    description:
      'Researches company mission, products, hiring handbook, team culture, and authentic interview experience reports from grounded sources.',
    icon: Search,
    accent: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
  },
  {
    step: '03',
    title: 'Deterministic Question Bank & Flashcards',
    description:
      'Multi-pass generation guarantees 100% coverage of extracted must-have skills across Technical, STAR Behavioural, and System Design domains.',
    icon: Brain,
    accent: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
  },
  {
    step: '04',
    title: 'Real Interview Practice & Weak Spots Drills',
    description:
      'Write answers under real conditions, rate your confidence from 1 to 5, track mastery progress, and target automatically flagged weak areas.',
    icon: CheckCircle2,
    accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
  }
];

export function DemoModal({ isOpen, onClose, ctaHref }: DemoModalProps) {
  const [activeStep, setActiveStep] = useState(0);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/50 space-y-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Glow */}
        <div
          className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Interactive Workflow Walkthrough</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              How AI Interview Prep Kit Works
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Four grounded stages from raw job description to verified interview readiness.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {DEMO_STEPS.map((item, idx) => {
            const Icon = item.icon;
            const isSelected = activeStep === idx;
            return (
              <div
                key={item.step}
                onClick={() => setActiveStep(idx)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left space-y-2.5 ${
                  isSelected
                    ? 'bg-slate-800/80 border-indigo-500/50 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                    : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center ${item.accent}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-500">
                    STAGE {item.step}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-200">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            <span>Ready to turn your dream role into an interview prep kit?</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Close
            </button>
            <Link
              href={ctaHref}
              onClick={onClose}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <span>Create Kit Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
