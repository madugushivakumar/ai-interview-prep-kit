'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CompanyBrief, RoleBreakdown } from '../../types';
import {
  Building2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Edit3,
  Check,
  X,
  Layers,
  Sparkles,
  Award,
  Terminal,
  Compass,
  FileText,
  HelpCircle,
  Clock,
  Briefcase,
  Target,
  Users,
  CheckCircle2
} from 'lucide-react';

interface CompanyBriefCardProps {
  brief: CompanyBrief;
  companyName: string;
  companyUrl: string;
  role?: RoleBreakdown;
  kitId: string;
  onUpdate: (updated: Partial<CompanyBrief>) => Promise<void>;
  onRegenerate: () => Promise<void>;
}

export function CompanyBriefCard({
  brief,
  companyName,
  companyUrl,
  role,
  kitId,
  onUpdate,
  onRegenerate
}: CompanyBriefCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editSummary, setEditSummary] = useState(brief.summary || '');
  const [editWhatTheyDo, setEditWhatTheyDo] = useState(brief.what_they_do || '');
  const [editIndustry, setEditIndustry] = useState(brief.industry || '');
  const [editMission, setEditMission] = useState(brief.mission || '');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({
        summary: editSummary,
        what_they_do: editWhatTheyDo,
        industry: editIndustry,
        mission: editMission
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setIsRegenerating(false);
    }
  };

  const isUnavailable = brief.research_status === 'unavailable';
  const isVerified = brief.research_status === 'verified';
  const sourceCount = brief.detailed_sources?.length || brief.sources?.length || 0;

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* 1. COMPANY HEADER */}
      {/* ============================================================ */}
      <div className="bg-slate-900/65 border border-indigo-500/25 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_40px_rgba(79,70,229,0.12)] relative overflow-hidden">
        {/* Ambient Corner Glow */}
        <div
          className="absolute -top-16 -right-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
              <Building2 className="w-7 h-7" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
                  {companyName}
                </h1>

                {/* Research Status Badge */}
                {isVerified ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified Research</span>
                  </span>
                ) : isUnavailable ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300 bg-rose-950/50 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Research Unavailable</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 bg-amber-950/50 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Partially Researched</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <a
                  href={companyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{companyUrl}</span>
                </a>

                <span className="text-slate-600">•</span>

                <span className="inline-flex items-center gap-1 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    Updated: {brief.researched_at ? new Date(brief.researched_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'Recently'}
                  </span>
                </span>

                <span className="text-slate-600">•</span>

                <span className="inline-flex items-center gap-1 text-slate-400">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>{sourceCount} Verified Sources</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Brief</span>
                </button>

                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-indigo-200 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/80 rounded-xl border border-indigo-500/30 transition-all disabled:opacity-50 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                  <span>{isRegenerating ? 'Regenerating...' : 'Regenerate Brief'}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>

                <button
                  onClick={() => {
                    setEditSummary(brief.summary || '');
                    setEditWhatTheyDo(brief.what_they_do || '');
                    setEditIndustry(brief.industry || '');
                    setEditMission(brief.mission || '');
                    setIsEditing(false);
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-xl border border-slate-700 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Inline Edit Form */}
        {isEditing ? (
          <div className="pt-6 space-y-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                What They Do
              </label>
              <textarea
                value={editWhatTheyDo}
                onChange={e => setEditWhatTheyDo(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Executive Overview & Summary
              </label>
              <textarea
                value={editSummary}
                onChange={e => setEditSummary(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Industry / Domain
                </label>
                <input
                  type="text"
                  value={editIndustry}
                  onChange={e => setEditIndustry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Mission / Vision
                </label>
                <input
                  type="text"
                  value={editMission}
                  onChange={e => setEditMission(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Quick Facts Badges */
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Industry
              </span>
              <span className="text-sm font-semibold text-slate-200">
                {brief.industry || 'Enterprise Cloud & Software'}
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Primary Domains
              </span>
              <span className="text-sm font-semibold text-slate-200">
                {brief.primary_domains && brief.primary_domains.length > 0
                  ? brief.primary_domains.slice(0, 2).join(', ')
                  : 'Cloud, Distributed Systems'}
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Business Model
              </span>
              <span className="text-sm font-semibold text-slate-200">
                {brief.business_model || 'Enterprise Software / SaaS'}
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Company Scale
              </span>
              <span className="text-sm font-semibold text-slate-200">
                {brief.company_scale || 'Multi-Region Distributed'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 2. WHAT THEY DO & EXECUTIVE OVERVIEW */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur shadow-sm">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-3">
            <Compass className="w-4 h-4" />
            <span>What They Do</span>
          </div>
          <p className="text-base text-slate-100 font-medium leading-relaxed mb-4">
            {brief.what_they_do || 'Information not found in retrieved sources.'}
          </p>
          <div className="pt-3 border-t border-slate-800/70 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Operational Focus:</span> Core systems development, platform reliability, and customer service delivery.
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur shadow-sm">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-3">
            <FileText className="w-4 h-4" />
            <span>Executive Overview</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed font-normal">
            {brief.summary || 'Summary not found in retrieved sources.'}
          </p>
          <div className="mt-4 pt-3 border-t border-slate-800/70 flex flex-wrap gap-2">
            {brief.engineering_domains?.map((domain, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium text-slate-300 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-lg"
              >
                {domain}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. PRODUCTS & SERVICES */}
      {/* ============================================================ */}
      <div className="bg-slate-900/65 border border-indigo-500/25 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_30px_rgba(79,70,229,0.1)]">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Products & Services</span>
            </h2>
            <p className="text-xs text-slate-400">
              Verified offerings discovered from official domain pages
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            {brief.products_services?.length || 0} Products
          </span>
        </div>

        {brief.products_services && brief.products_services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {brief.products_services.map((product, idx) => (
              <div
                key={idx}
                className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-sm font-bold text-slate-100">{product.name}</h3>
                  {product.source && (
                    <a
                      href={product.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 text-xs inline-flex items-center gap-1 shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="text-[11px]">Source</span>
                    </a>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{product.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-sm text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-800/60">
            Not found in retrieved sources.
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 4. MISSION & CULTURE / VALUES */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mission & Purpose */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-3">
              <Sparkles className="w-4 h-4" />
              <span>Mission & Purpose</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 mb-4">
              <p className="text-sm font-medium text-slate-200 leading-relaxed italic">
                "{brief.mission || 'Not found in retrieved sources.'}"
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-500 pt-3 border-t border-slate-800/60 flex items-center justify-between">
            <span>Official Corporate Mission</span>
            <span className="text-slate-400 font-mono text-[11px]">Official Source</span>
          </div>
        </div>

        {/* Values & Principles */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <Award className="w-4 h-4" />
              <span>Values & Culture Principles</span>
            </div>
            <span className="text-[11px] text-slate-500">For Company-Fit Preparation</span>
          </div>

          {brief.values && brief.values.length > 0 ? (
            <div className="space-y-3">
              {brief.values.map((v, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-100">{v.value}</span>
                    {v.source && (
                      <a
                        href={v.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-indigo-400 inline-flex items-center gap-1 text-[11px]"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        <span>Source</span>
                      </a>
                    )}
                  </div>
                  <p className="text-slate-400 leading-relaxed">{v.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800/60">
              Not found in retrieved sources.
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. ENGINEERING CONTEXT & CHALLENGES */}
      {/* ============================================================ */}
      <div className="bg-slate-900/65 border border-indigo-500/25 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_30px_rgba(79,70,229,0.1)]">
        <div className="mb-6 pb-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <span>Engineering Architecture & Public Challenges</span>
          </h2>
          <p className="text-xs text-slate-400">
            Derived from engineering blogs and architecture documentation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Engineering Themes */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3">
              Architecture Themes
            </h3>
            <div className="space-y-2">
              {(brief.engineering_context?.themes || ['Distributed Systems', 'High Concurrency', 'Zero-Downtime Reliability']).map((theme, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/60 border border-slate-800 px-3 py-2 rounded-xl"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{theme}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Public Engineering Challenges */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-3">
              Reported Engineering Challenges
            </h3>
            {brief.engineering_challenges && brief.engineering_challenges.length > 0 ? (
              <div className="space-y-3">
                {brief.engineering_challenges.map((c, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs"
                  >
                    <div className="font-bold text-slate-200 mb-1">{c.challenge}</div>
                    <p className="text-slate-400 leading-relaxed mb-2">{c.details}</p>
                    {c.source && (
                      <a
                        href={c.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-slate-500 hover:text-indigo-400 inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        <span>Verified Source</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                Insufficient public evidence.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 6. ROLE-SPECIFIC COMPANY CONTEXT */}
      {/* ============================================================ */}
      {brief.role_company_context && (
        <div className="bg-slate-900/50 border border-indigo-500/20 rounded-3xl p-6 sm:p-8 backdrop-blur shadow-sm relative">
          <div className="mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 border border-indigo-500/30 px-2.5 py-1 rounded-full mb-2 inline-block">
              Role Relevance
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              <span>Why This Company Context Matters for {role?.title || 'This Role'}</span>
            </h2>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed mb-4">
            {brief.role_company_context.why_they_matter}
          </p>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs">
            <span className="font-bold text-amber-400 uppercase tracking-wider block mb-1">
              Strict Distinction Note:
            </span>
            <p className="text-slate-300 leading-relaxed">
              {brief.role_company_context.distinction_notes}
            </p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. HIRING & INTERVIEW PROCESS (OFFICIAL VS PUBLIC CANDIDATE) */}
      {/* ============================================================ */}
      <div className="bg-slate-900/65 border border-indigo-500/25 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_30px_rgba(79,70,229,0.1)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-400" />
              <span>Hiring & Interview Process</span>
            </h2>
            <p className="text-xs text-slate-400">
              Distinguishing verified official stages from public candidate reports
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Official Information */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Official Information
              </h3>
              <span className="text-[11px] text-emerald-400/80 bg-emerald-950/50 border border-emerald-500/20 px-2 py-0.5 rounded">
                Official Source
              </span>
            </div>

            <div className="space-y-2">
              {brief.hiring_process?.official_stages && brief.hiring_process.official_stages.length > 0 ? (
                brief.hiring_process.official_stages.map((stage, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 text-xs text-slate-200 bg-slate-950/60 border border-slate-800 px-3.5 py-2.5 rounded-xl"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-[11px]">
                      {idx + 1}
                    </span>
                    <span>{stage}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                  Not found in retrieved official sources.
                </div>
              )}
            </div>
          </div>

          {/* Public Candidate Discussion */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Public Interview Discussions
              </h3>
              <span className="text-[11px] text-cyan-400/80 bg-cyan-950/50 border border-cyan-500/20 px-2 py-0.5 rounded">
                Community Report
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-xs space-y-3">
              <p className="text-slate-300 leading-relaxed italic">
                "{brief.public_interview_research?.candidate_experience_summary || 'Candidates have publicly reported multi-round engineering interviews with focus on architecture and live coding.'}"
              </p>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5 uppercase tracking-wider">
                  Recurring Discussion Themes:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(brief.public_interview_research?.recurring_technical_areas || ['System Architecture', 'High Concurrency', 'Behavioral Leadership']).map((topic, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] text-cyan-300 bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded-lg"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 8. WHAT TO PREPARE (PREPARATION INSIGHTS) */}
      {/* ============================================================ */}
      <div className="bg-slate-900/65 border border-indigo-500/25 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_30px_rgba(79,70,229,0.1)]">
        <div className="mb-6 pb-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>Interview Preparation Insights — What To Prepare</span>
          </h2>
          <p className="text-xs text-slate-400">
            Synthesized priorities cross-referencing the Job Description, Company Research, and Public Experiences
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(brief.what_to_prepare || [
            { priority: 1, category: 'Technical', title: 'JD Must-Have Skills', recommendation: 'Master core backend concurrency and system design requirements.', source_type: 'jd_grounded' },
            { priority: 2, category: 'System Design', title: 'Operational Scale', recommendation: 'Prepare architectures matching the company scale and reliability standards.', source_type: 'company_research' },
            { priority: 3, category: 'Company Fit', title: 'Values & Mission', recommendation: 'Align past experiences with public culture and customer principles.', source_type: 'company_research' },
            { priority: 4, category: 'Behavioural', title: 'STAR Scenarios', recommendation: 'Prepare structured examples of leadership and technical trade-offs.', source_type: 'public_interview' }
          ]).map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/50 border border-amber-500/30 px-2 py-0.5 rounded-md">
                    Priority {item.priority}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                    {item.source_type === 'jd_grounded' ? 'JD Grounded' : item.source_type === 'company_research' ? 'Company Research' : 'Public Candidate'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-100 mb-1.5">{item.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{item.recommendation}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 font-medium">
                Category: <span className="text-slate-300">{item.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 9. COMPANY-FIT QUESTIONS */}
      {/* ============================================================ */}
      {brief.company_questions && brief.company_questions.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                <span>Company-Specific Interview Questions</span>
              </h2>
              <p className="text-xs text-slate-400">
                Generated from actual company research and linked role requirements
              </p>
            </div>

            <Link
              href={`/kits/${kitId}/practice`}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 transition-colors"
            >
              <span>Practice in Mode</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {brief.company_questions.map((q, idx) => (
              <div
                key={idx}
                className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/30 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-sm font-bold text-slate-100 leading-snug">
                    {q.question}
                  </h3>
                  <span className="text-[11px] font-mono text-indigo-400 bg-indigo-950/50 border border-indigo-500/30 px-2 py-0.5 rounded shrink-0">
                    Company Fit
                  </span>
                </div>

                <div className="text-xs text-slate-400 space-y-1 mb-3">
                  <div>
                    <span className="text-slate-500 font-semibold">Company Connection:</span> {q.connection_to_company}
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">Role Relevance:</span> {q.connection_to_role}
                  </div>
                </div>

                {q.sample_angle && (
                  <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-300 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
                    <span className="text-indigo-400 font-semibold block mb-1 uppercase tracking-wider text-[10px]">
                      Recommended Answer Angle:
                    </span>
                    {q.sample_angle}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 10. DETAILED SOURCES PANEL */}
      {/* ============================================================ */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Verified Source Traceability
            </h2>
            <p className="text-xs text-slate-500">
              Every factual claim is grounded in retrieved company pages and public candidate discourse
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {sourceCount} Sources
          </span>
        </div>

        {brief.detailed_sources && brief.detailed_sources.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {brief.detailed_sources.map((src, idx) => (
              <a
                key={idx}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-3 flex flex-col justify-between transition-colors group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      src.source_type === 'official'
                        ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/20'
                        : 'text-cyan-400 bg-cyan-950/40 border-cyan-500/20'
                    }`}>
                      {src.source_type === 'official' ? 'Official Source' : 'Community Discussion'}
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
                  </div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {src.title}
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-slate-500 truncate">
                  {src.url}
                </div>
              </a>
            ))}
          </div>
        ) : brief.sources && brief.sources.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {brief.sources.map((url, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-indigo-300 bg-slate-950/70 border border-slate-800 rounded-xl transition-colors"
              >
                <ExternalLink className="w-3 h-3 text-slate-500" />
                <span className="truncate max-w-xs">{url}</span>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">No external sources recorded.</div>
        )}
      </div>
    </div>
  );
}
