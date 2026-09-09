'use client';

import React from 'react';
import Link from 'next/link';
import { useKit } from './KitContext';
import { Badge } from '../../../components/ui/Badge';
import {
  Sparkles,
  BookOpen,
  Calendar,
  HelpCircle,
  ArrowRight,
  Target,
  ShieldCheck,
  Building2
} from 'lucide-react';

export default function KitOverviewPage() {
  const { kit, kitDoc } = useKit();
  if (!kit || !kitDoc) return null;

  const mustReqs = kit.role.requirements.filter(r => r.priority === 'must');
  const uncoveredIds = kit.coverage.uncovered_requirement_ids;
  const isFullyCovered = uncoveredIds.length === 0;

  return (
    <div className="space-y-8">
      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href={`/kits/${kitDoc._id}/practice`}
          className="group bg-gradient-to-br from-indigo-950/40 via-slate-900/50 to-slate-900/50 border border-indigo-500/30 hover:border-indigo-500/60 rounded-2xl p-5 backdrop-blur transition-all hover:shadow-lg"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-3">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors flex items-center justify-between">
            <span>Practice Flashcards</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {kit.flashcards.length} active recall cards prioritized by confidence
          </p>
        </Link>

        <Link
          href={`/kits/${kitDoc._id}/questions`}
          className="group bg-slate-900/50 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 backdrop-blur transition-all"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-600/10 text-purple-400 flex items-center justify-center mb-3">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-100 group-hover:text-purple-300 transition-colors flex items-center justify-between">
            <span>Question Bank</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {kit.questions.length} categorized questions across 4 domains
          </p>
        </Link>

        <Link
          href={`/kits/${kitDoc._id}/schedule`}
          className="group bg-slate-900/50 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 backdrop-blur transition-all"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-600/10 text-amber-400 flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors flex items-center justify-between">
            <span>Study Schedule</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {kit.schedule.days_available} days allocated with integer durations
          </p>
        </Link>

        <Link
          href={`/kits/${kitDoc._id}/weak-spots`}
          className="group bg-slate-900/50 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 backdrop-blur transition-all"
        >
          <div className="w-9 h-9 rounded-xl bg-cyan-600/10 text-cyan-400 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors flex items-center justify-between">
            <span>Weak Spots Report</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Real-time analytics and targeted revision directives
          </p>
        </Link>
      </div>

      {/* Coverage Status Section */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span>Must-Have Requirement Coverage</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic verification across {kit.coverage.passes} generation pass(es)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isFullyCovered ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30">
                All {mustReqs.length} must-have requirements covered
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30">
                {uncoveredIds.length} uncovered requirement(s)
              </span>
            )}
          </div>
        </div>

        {/* Requirements status list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mustReqs.map(req => {
            const isCovered = !uncoveredIds.includes(req.id);
            return (
              <div
                key={req.id}
                className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                  isCovered
                    ? 'bg-slate-950/40 border-slate-800/80'
                    : 'bg-amber-950/20 border-amber-500/30'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isCovered ? 'text-emerald-400 bg-emerald-950' : 'text-amber-400 bg-amber-950'
                  }`}
                >
                  <span className="text-[10px] font-bold">✓</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-slate-400">{req.id}</span>
                    <Badge variant={req.kind} size="sm">{req.kind}</Badge>
                  </div>
                  <p className="text-xs text-slate-200 font-medium leading-relaxed">
                    {req.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Snapshot of Company & Role */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Company Snapshot</span>
            </span>
            <Link href={`/kits/${kitDoc._id}/company`} className="text-xs text-slate-400 hover:text-indigo-300">
              Details →
            </Link>
          </div>
          <h4 className="text-sm font-semibold text-slate-100">{kit.source.company}</h4>
          <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
            {kit.company_brief.what_they_do || kit.company_brief.summary}
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Role Snapshot</span>
            </span>
            <Link href={`/kits/${kitDoc._id}/role`} className="text-xs text-slate-400 hover:text-purple-300">
              Details →
            </Link>
          </div>
          <h4 className="text-sm font-semibold text-slate-100">{kit.role.title} ({kit.role.seniority})</h4>
          <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
            {kit.role.responsibilities?.[0] || 'Software engineering architecture and implementation.'}
          </p>
        </div>
      </div>
    </div>
  );
}
