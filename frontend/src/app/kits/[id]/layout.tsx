'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { KitProvider, useKit } from './KitContext';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorState } from '../../../components/ui/ErrorState';
import {
  Building2,
  Calendar,
  ShieldCheck,
  BookOpen,
  HelpCircle,
  Clock,
  Sparkles,
  Target,
  Layout
} from 'lucide-react';

function KitHeaderAndTabs({
  kitId,
  children
}: {
  kitId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { kit, kitDoc, isLoading, error, refreshKit } = useKit();

  if (isLoading) {
    return <LoadingSpinner message="Loading interview kit..." />;
  }

  if (error || !kit) {
    return (
      <ErrorState
        title="Could not load preparation kit"
        message={error || 'Kit not found or access denied.'}
        onRetry={refreshKit}
      />
    );
  }

  const company = kit.source.company || 'Company';
  const role = kit.role.title || 'Software Engineer';
  const days = kit.schedule.days_available;
  const uncoveredCount = kit.coverage.uncovered_requirement_ids.length;

  const mustRequirements = kit.role.requirements.filter(r => r.priority === 'must');
  const coveragePercent = mustRequirements.length === 0
    ? 100
    : Math.round(((mustRequirements.length - uncoveredCount) / mustRequirements.length) * 100);

  const tabs = [
    { href: `/kits/${kitId}`, label: 'Overview', icon: Layout, exact: true },
    { href: `/kits/${kitId}/company`, label: 'Company', icon: Building2 },
    { href: `/kits/${kitId}/role`, label: 'Role & Skills', icon: BookOpen },
    { href: `/kits/${kitId}/questions`, label: `Questions (${kit.questions.length})`, icon: HelpCircle },
    { href: `/kits/${kitId}/flashcards`, label: `Flashcards (${kit.flashcards.length})`, icon: Sparkles },
    { href: `/kits/${kitId}/schedule`, label: `Schedule (${days}d)`, icon: Clock },
    { href: `/kits/${kitId}/practice`, label: 'Practice Mode', icon: Target },
    { href: `/kits/${kitId}/weak-spots`, label: 'Weak Spots Report', icon: ShieldCheck, highlight: true }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Key Metrics */}
      <div className="bg-slate-900/65 border border-indigo-500/25 rounded-3xl p-6 backdrop-blur-xl shadow-[0_0_40px_rgba(79,70,229,0.12)] relative overflow-hidden">
        {/* Ambient glow in corner */}
        <div
          className="absolute -top-16 -right-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
              <span>{company}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 tracking-tight">
              {role}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Days Available Badge */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs font-semibold text-slate-300">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>{days} Days Schedule</span>
            </div>

            {/* Coverage Badge */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border ${
                coveragePercent === 100
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{coveragePercent}% Must-Have Coverage</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto no-scrollbar relative z-10">
          {tabs.map(tab => {
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.35)]'
                    : tab.highlight
                    ? 'text-cyan-300 bg-cyan-950/30 border border-cyan-500/30 hover:bg-cyan-900/40 hover:border-cyan-400/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Tab Page Content */}
      <div>{children}</div>
    </div>
  );
}

export default function KitDetailLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  return (
    <KitProvider kitId={params.id}>
      <KitHeaderAndTabs kitId={params.id}>
        {children}
      </KitHeaderAndTabs>
    </KitProvider>
  );
}
