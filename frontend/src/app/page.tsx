'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowRight, ShieldCheck, Cpu, Calendar, Target } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-12">
      {/* Hero Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-inner">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        <span>Autonomous Multi-Stage Research & Preparation Engine</span>
      </div>

      {/* Hero Headline */}
      <div className="max-w-3xl space-y-5">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-100 leading-[1.15]">
          Turn Any Job Description Into A{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Personalized Prep Kit
          </span>
        </h1>
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Autonomous crawling of company hiring pages, grounded requirement extraction, deterministic question coverage, day-by-day study schedules, and interactive confidence practice.
        </p>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        {user ? (
          <Link
            href="/kits/new"
            className="flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <span>Create New Kit</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <>
            <Link
              href="/register"
              className="flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 text-base font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-2xl transition-colors"
            >
              Sign In
            </Link>
          </>
        )}
      </div>

      {/* Feature Pillar Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl w-full pt-8 text-left">
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 mb-1">Company Crawler</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Crawls websites, discovers hidden hiring handbooks, and synthesizes company overview and culture.
          </p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 mb-1">Deterministic Coverage</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Mathematical guarantee that all must-have requirements have targeted questions across multi-pass loops.
          </p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur">
          <div className="w-10 h-10 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 mb-1">Arithmetic Scheduling</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Distributes material front-loading difficult topics across your exact number of available days.
          </p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur">
          <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 mb-1">Confidence Practice</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Active recall flashcards with confidence ranking and actionable Weak Spots reporting.
          </p>
        </div>
      </div>
    </div>
  );
}
