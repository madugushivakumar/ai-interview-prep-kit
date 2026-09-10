'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  Play,
  Zap,
  Check,
  Globe,
  Layers,
  Calendar,
  Target,
  Briefcase,
  Building2,
  Mic
} from 'lucide-react';
import { HeroBackground } from '../components/landing/HeroBackground';
import { ProductPreview } from '../components/landing/ProductPreview';
import { DemoModal } from '../components/landing/DemoModal';
import { FeatureCard, FeatureItem } from '../components/landing/FeatureCard';
import { CTASection } from '../components/landing/CTASection';
import { Footer } from '../components/landing/Footer';

export default function HomePage() {
  const { user } = useAuth();
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  // Real navigation targets depending on authentication status
  const primaryCtaHref = user ? '/kits/new' : '/register';

  // Feature Cards Row 1: Core Foundation (4 cards)
  const featuresRow1: FeatureItem[] = [
    {
      id: 'company-crawler',
      title: 'Company Crawler',
      description:
        'Crawls websites, discovers hidden hiring handbooks, and synthesizes company overview and culture.',
      icon: Globe,
      accentContainer: 'bg-blue-600/10 border-blue-500/20',
      accentIcon: 'text-blue-400'
    },
    {
      id: 'deterministic-coverage',
      title: 'Deterministic Coverage',
      description:
        'Mathematical guarantee that all must-have requirements have targeted questions across multi-pass loops.',
      icon: Layers,
      accentContainer: 'bg-purple-600/10 border-purple-500/20',
      accentIcon: 'text-purple-400'
    },
    {
      id: 'arithmetic-scheduling',
      title: 'Arithmetic Scheduling',
      description:
        'Distributes material front-loading difficult topics across your exact number of available days.',
      icon: Calendar,
      accentContainer: 'bg-emerald-600/10 border-emerald-500/20',
      accentIcon: 'text-emerald-400'
    },
    {
      id: 'confidence-practice',
      title: 'Confidence Practice',
      description:
        'Active recall flashcards with confidence ranking and actionable Weak Spots reporting.',
      icon: Target,
      accentContainer: 'bg-pink-600/10 border-pink-500/20',
      accentIcon: 'text-pink-400'
    }
  ];

  // Feature Cards Row 2: Deep Intelligence & Practice (3 cards)
  const featuresRow2: FeatureItem[] = [
    {
      id: 'role-skills-intelligence',
      title: 'Role & Skills Intelligence',
      description:
        'Extracts the complete role, responsibilities, technical skills, must-have requirements, and nice-to-have requirements directly from the job description.',
      icon: Briefcase,
      accentContainer: 'bg-amber-600/10 border-amber-500/20',
      accentIcon: 'text-amber-400'
    },
    {
      id: 'company-intelligence',
      title: 'Company Intelligence',
      description:
        'Researches the company, products, mission, engineering culture, hiring process, interview experiences, and role alignment using grounded sources.',
      icon: Building2,
      accentContainer: 'bg-cyan-600/10 border-cyan-500/20',
      accentIcon: 'text-cyan-400'
    },
    {
      id: 'real-interview-practice',
      title: 'Real Interview Practice',
      description:
        'Practice generated interview questions with answer writing, confidence scoring, progress tracking, and personalized weak-area drills.',
      icon: Mic,
      accentContainer: 'bg-violet-600/10 border-violet-500/20',
      accentIcon: 'text-violet-400'
    }
  ];

  return (
    <div className="flex flex-col items-center justify-start w-full">
      {/* ========================================================
          1. HERO SECTION (Compact 2-Column with Glowing Waves)
         ======================================================== */}
      <section className="relative w-full overflow-hidden border-b border-slate-800/60 pt-8 sm:pt-12 pb-7 sm:pb-9">
        {/* Atmospheric Gradients & Decorative Glowing Waves */}
        <HeroBackground />

        {/* Centered Hero Container (~1060px) */}
        <div className="max-w-[1060px] w-full mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column: Hero Copy & Actions */}
            <div className="lg:col-span-6 space-y-3.5 sm:space-y-4 text-left">
              {/* Small Badge: AI POWERED */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-[10px] font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(147,51,234,0.2)]">
                <Zap className="w-3 h-3 text-purple-400 fill-purple-400" />
                <span>AI POWERED</span>
              </div>

              {/* Main Heading */}
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-black tracking-tight text-white leading-[1.06]">
                  AI Interview{' '}
                  <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-indigo-300 bg-clip-text text-transparent">
                    Prep
                  </span>{' '}
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Kit
                  </span>
                </h1>
                <p className="text-base sm:text-[17px] font-medium text-slate-200 leading-snug">
                  From job description to real interview practice — your complete preparation companion.
                </p>
                <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed max-w-md">
                  Leverage AI to understand roles, research companies, generate targeted questions, and practice like in a real interview.
                </p>
              </div>

              {/* Hero Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href={primaryCtaHref}
                  className="h-10 px-5 flex items-center gap-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  type="button"
                  onClick={() => setIsDemoOpen(true)}
                  className="h-10 px-4 flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/70 hover:border-slate-500 rounded-xl transition-all shadow-sm group"
                >
                  <div className="w-4 h-4 rounded-full border border-indigo-400/50 flex items-center justify-center">
                    <Play className="w-2 h-2 text-indigo-400 fill-indigo-400 ml-0.5" />
                  </div>
                  <span>Watch Demo</span>
                </button>
              </div>

              {/* 3 Feature Checkmarks (Single Horizontal Row) */}
              <div className="flex flex-wrap items-center gap-3.5 sm:gap-5 pt-1 text-[11px] sm:text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-purple-600/90 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Check className="w-2 h-2 stroke-[3]" />
                  </div>
                  <span>Job-focused preparation</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-indigo-600/90 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Check className="w-2 h-2 stroke-[3]" />
                  </div>
                  <span>AI-powered insights</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-600/90 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Check className="w-2 h-2 stroke-[3]" />
                  </div>
                  <span>Practice &amp; track progress</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Product / Dashboard Preview */}
            <div className="lg:col-span-6 w-full flex justify-center lg:justify-end">
              <ProductPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. FEATURES SECTION (Everything You Need)
         ======================================================== */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-8 pt-6 sm:pt-8 pb-12">
        {/* Centered Heading with POWERFUL FEATURES Badge */}
        <div className="text-center space-y-2 max-w-3xl mx-auto">
          <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-indigo-400">
            POWERFUL FEATURES
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              Ace Your Interviews
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            A complete, end-to-end system from job description analysis to real interview practice.
          </p>
        </div>

        {/* Feature Cards Showcase */}
        <div className="space-y-5">
          {/* Row 1: 4 Cards on Desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuresRow1.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </div>

          {/* Row 2: 3 Cards on Desktop (balanced width, zero empty 4th column) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuresRow2.map((feature, idx) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                className={idx === 2 ? 'sm:col-span-2 lg:col-span-1' : ''}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          3. BOTTOM CTA BANNER
         ======================================================== */}
      <section className="w-full">
        <CTASection ctaHref={primaryCtaHref} />
      </section>

      {/* ========================================================
          4. MINIMAL FOOTER
         ======================================================== */}
      <Footer />

      {/* Interactive Demo Tour Modal */}
      <DemoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        ctaHref={primaryCtaHref}
      />
    </div>
  );
}
