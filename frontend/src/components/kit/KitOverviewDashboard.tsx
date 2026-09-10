'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Kit, KitDocument, PracticeProgressStats, QuestionCategory } from '../../types';
import { api } from '../../lib/apiClient';
import { Badge } from '../ui/Badge';
import {
  Building2,
  Briefcase,
  Target,
  HelpCircle,
  BookOpen,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Star,
  Award,
  Terminal,
  Layers,
  Compass,
  Code2,
  Cpu,
  Database,
  Cloud,
  Users,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  BarChart3,
  Check,
  AlertCircle,
  FileText,
  Zap,
  Globe,
  DollarSign,
  GraduationCap
} from 'lucide-react';

interface KitOverviewDashboardProps {
  kitId: string;
  kit: Kit;
  kitDoc: KitDocument;
}

export function KitOverviewDashboard({ kitId, kit, kitDoc }: KitOverviewDashboardProps) {
  const [progressStats, setProgressStats] = useState<PracticeProgressStats | null>(null);
  const [isResponsibilitiesExpanded, setIsResponsibilitiesExpanded] = useState(false);
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);

  // Fetch live practice progress stats
  useEffect(() => {
    let isMounted = true;
    const fetchProgress = async () => {
      try {
        const res = await api.get<{ progress: PracticeProgressStats }>(`/practice/${kitId}/progress`);
        if (isMounted && res?.progress) {
          setProgressStats(res.progress);
        }
      } catch (err) {
        // Silently tolerate if practice progress is unavailable initially
      }
    };
    fetchProgress();
    return () => {
      isMounted = false;
    };
  }, [kitId]);

  // Dynamic calculations from real persisted kit data
  const totalQuestions = kit.questions?.length || 0;
  const totalFlashcards = kit.flashcards?.length || 0;
  const totalRequirements = kit.role?.requirements?.length || 0;

  const mustReqs = useMemo(
    () => kit.role?.requirements?.filter(r => r.priority === 'must') || [],
    [kit.role?.requirements]
  );
  const niceReqs = useMemo(
    () => kit.role?.requirements?.filter(r => r.priority === 'nice') || [],
    [kit.role?.requirements]
  );

  const uncoveredIds = kit.coverage?.uncovered_requirement_ids || [];
  const coveredMustReqs = mustReqs.filter(r => !uncoveredIds.includes(r.id));
  const mustHaveCoveragePercent = mustReqs.length > 0
    ? Math.round((coveredMustReqs.length / mustReqs.length) * 100)
    : 100;
  const isFullyCovered = uncoveredIds.length === 0;

  // Category breakdown of question bank
  const categoryCounts: Record<QuestionCategory, number> = useMemo(() => {
    const counts: Record<QuestionCategory, number> = {
      technical: 0,
      behavioural: 0,
      'system-design': 0,
      'company-fit': 0
    };
    (kit.questions || []).forEach(q => {
      if (counts[q.category] !== undefined) {
        counts[q.category]++;
      }
    });
    return counts;
  }, [kit.questions]);

  // Must-have linked questions
  const mustReqIdsSet = useMemo(() => new Set(mustReqs.map(r => r.id)), [mustReqs]);
  const mustHaveQuestionsCount = useMemo(
    () => (kit.questions || []).filter(q => q.requirement_ids?.some(rid => mustReqIdsSet.has(rid))).length,
    [kit.questions, mustReqIdsSet]
  );

  // Skill groups - only non-empty groups will be rendered
  const skillCategories = useMemo(() => {
    const rawTechnical = kit.role?.technical_skills || {};
    const groups: Array<{ title: string; skills: string[]; icon: React.ReactNode }> = [];

    // Map extracted technical skill categories
    Object.entries(rawTechnical).forEach(([catName, skills]) => {
      if (Array.isArray(skills) && skills.length > 0) {
        const lower = catName.toLowerCase();
        let icon = <Cpu className="w-3.5 h-3.5 text-indigo-400" />;
        if (lower.includes('language') || lower.includes('programming')) icon = <Code2 className="w-3.5 h-3.5 text-sky-400" />;
        else if (lower.includes('database') || lower.includes('data')) icon = <Database className="w-3.5 h-3.5 text-amber-400" />;
        else if (lower.includes('cloud') || lower.includes('infra')) icon = <Cloud className="w-3.5 h-3.5 text-blue-400" />;
        else if (lower.includes('devops') || lower.includes('ci')) icon = <Terminal className="w-3.5 h-3.5 text-emerald-400" />;
        else if (lower.includes('architecture') || lower.includes('system')) icon = <Layers className="w-3.5 h-3.5 text-purple-400" />;
        else if (lower.includes('front')) icon = <Globe className="w-3.5 h-3.5 text-cyan-400" />;

        groups.push({
          title: catName.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').trim(),
          skills,
          icon
        });
      }
    });

    // Append Soft Skills if non-empty
    if (Array.isArray(kit.role?.soft_skills) && kit.role.soft_skills.length > 0) {
      groups.push({
        title: 'Soft & Leadership Skills',
        skills: kit.role.soft_skills,
        icon: <Users className="w-3.5 h-3.5 text-pink-400" />
      });
    }

    // Append Domain Skills if non-empty
    if (Array.isArray(kit.role?.domain_skills) && kit.role.domain_skills.length > 0) {
      groups.push({
        title: 'Domain Competencies',
        skills: kit.role.domain_skills,
        icon: <Compass className="w-3.5 h-3.5 text-violet-400" />
      });
    }

    return groups;
  }, [kit.role]);

  // Deterministic Next Best Action recommendation
  const nextBestAction = useMemo(() => {
    const questionsPracticed = progressStats?.questionsPracticed ?? 0;
    const weakCount = progressStats?.questionsWeak ?? 0;

    if (questionsPracticed === 0) {
      return {
        title: 'Start Interview Practice Drill',
        desc: `Begin Day 1 preparation with 10 prioritized questions or practice all ${totalQuestions} questions.`,
        actionLabel: 'Launch Practice Mode',
        actionHref: `/kits/${kitId}/practice`,
        badgeText: 'Priority: Start Prep',
        badgeColor: 'text-indigo-400 bg-indigo-950/40 border-indigo-500/30',
        icon: <Zap className="w-4 h-4 text-indigo-400" />
      };
    }

    if (weakCount > 0) {
      return {
        title: `Reinforce ${weakCount} Weak Area${weakCount > 1 ? 's' : ''}`,
        desc: `You have ${weakCount} topic(s) rated at low confidence (\u2264 2). Strengthen core architecture and tradeoffs.`,
        actionLabel: 'Drill Weak Areas',
        actionHref: `/kits/${kitId}/practice`,
        badgeText: 'Targeted Review',
        badgeColor: 'text-rose-400 bg-rose-950/40 border-rose-500/30',
        icon: <ShieldAlert className="w-4 h-4 text-rose-400" />
      };
    }

    if (!isFullyCovered) {
      return {
        title: 'Review Uncovered Requirements',
        desc: `${uncoveredIds.length} requirement(s) lack questions. Review and add custom questions to reach 100% coverage.`,
        actionLabel: 'Review Coverage',
        actionHref: `/kits/${kitId}/questions`,
        badgeText: 'Gap Fill',
        badgeColor: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
        icon: <AlertCircle className="w-4 h-4 text-amber-400" />
      };
    }

    return {
      title: 'Advance Scheduled Plan',
      desc: 'Continue following your personalized day-by-day study schedule to maintain retention.',
      actionLabel: 'View Schedule',
      actionHref: `/kits/${kitId}/schedule`,
      badgeText: 'On Track',
      badgeColor: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />
    };
  }, [progressStats, totalQuestions, kitId, isFullyCovered, uncoveredIds]);

  // Schedule Preview (first 3 days + final day preview)
  const scheduleDays = kit.schedule?.days || [];
  const schedulePreview = useMemo(() => {
    if (scheduleDays.length <= 4) return scheduleDays;
    return isScheduleExpanded ? scheduleDays : scheduleDays.slice(0, 3);
  }, [scheduleDays, isScheduleExpanded]);

  const totalStudyMinutes = useMemo(
    () => scheduleDays.reduce((acc, d) => acc + (d.minutes || 0), 0),
    [scheduleDays]
  );

  return (
    <div className="space-y-8 pb-12">
      {/* ============================================================ */}
      {/* SECTION 1: HERO / KIT SUMMARY BANNER */}
      {/* ============================================================ */}
      <div className="bg-slate-900/65 border border-indigo-500/25 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_40px_rgba(79,70,229,0.12)] relative overflow-hidden">
        {/* Ambient Corner Glow */}
        <div
          className="absolute -top-16 -right-16 w-52 h-52 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-500/30">
              <Building2 className="w-3.5 h-3.5" />
              <span>{kit.source?.company || 'Company'}</span>
              <span>•</span>
              <span>{kit.role?.title || 'Role'}</span>
              {kit.role?.seniority && (
                <>
                  <span>•</span>
                  <span className="text-slate-400 font-normal capitalize">{kit.role.seniority}</span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 tracking-tight">
              {kit.role?.title || 'Interview Preparation Kit'}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Location: {kit.role?.location || kit.source?.location || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Timeline: {kit.schedule?.days_available || scheduleDays.length || 0} Days</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Must-Have Coverage: {mustHaveCoveragePercent}%</span>
              </div>
            </div>
          </div>

          {/* Direct Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/kits/${kitId}/practice`}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-cyan-300" />
              <span>Launch Practice</span>
            </Link>
            <Link
              href={`/kits/${kitId}/questions`}
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/80 transition-all flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4 text-purple-400" />
              <span>Questions ({totalQuestions})</span>
            </Link>
          </div>
        </div>

        {/* High-Level Kit Stat Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-left relative z-10">
          <div className="bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/30 rounded-2xl p-4 transition-all">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Question Bank
            </span>
            <span className="text-xl font-bold text-slate-100">{totalQuestions}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">4 categories</span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 hover:border-purple-500/30 rounded-2xl p-4 transition-all">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Active Recall Cards
            </span>
            <span className="text-xl font-bold text-indigo-400">{totalFlashcards}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Concept verification</span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/30 rounded-2xl p-4 transition-all">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Requirements
            </span>
            <span className="text-xl font-bold text-emerald-400">
              {coveredMustReqs.length} / {mustReqs.length}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Must-haves covered</span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/30 rounded-2xl p-4 transition-all">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Questions Practiced
            </span>
            <span className="text-xl font-bold text-cyan-400">
              {progressStats?.questionsPracticed ?? 0} / {totalQuestions}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Avg: {progressStats?.averageConfidence ? `${progressStats.averageConfidence} / 5` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 2 & 15: READINESS & NEXT BEST ACTION */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Best Action Card (Section 15) */}
        <div className="lg:col-span-1 bg-gradient-to-br from-indigo-950/50 via-slate-900/60 to-slate-900/60 border border-indigo-500/30 rounded-3xl p-6 backdrop-blur shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${nextBestAction.badgeColor}`}>
                {nextBestAction.icon}
                <span>{nextBestAction.badgeText}</span>
              </span>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Recommended
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-100 mb-2">
              {nextBestAction.title}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              {nextBestAction.desc}
            </p>
          </div>

          <Link
            href={nextBestAction.actionHref}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
          >
            <span>{nextBestAction.actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Preparation Readiness Matrix (Section 2) */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <span>Interview Preparation Readiness</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete operational status of your preparation pipeline
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-full">
              {mustHaveCoveragePercent}% Ready
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5">
              <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                Requirements
              </span>
              <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{mustHaveCoveragePercent}% Covered</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                {coveredMustReqs.length} of {mustReqs.length} must-haves
              </span>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5">
              <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                Question Bank
              </span>
              <div className="flex items-center gap-1.5 text-sm font-bold text-slate-100">
                <HelpCircle className="w-4 h-4 text-purple-400 shrink-0" />
                <span>{totalQuestions} Questions</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                {mustHaveQuestionsCount} linked to must-haves
              </span>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5">
              <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                Flashcards
              </span>
              <div className="flex items-center gap-1.5 text-sm font-bold text-indigo-400">
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>{totalFlashcards} Active Cards</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Concept quick drills
              </span>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5">
              <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                Study Plan
              </span>
              <div className="flex items-center gap-1.5 text-sm font-bold text-amber-400">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>{scheduleDays.length} Days Allocated</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                {Math.round((totalStudyMinutes / 60) * 10) / 10} hours allocated
              </span>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5">
              <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                Practice Drills
              </span>
              <div className="flex items-center gap-1.5 text-sm font-bold text-cyan-400">
                <Zap className="w-4 h-4 shrink-0" />
                <span>{progressStats?.questionsPracticed ?? 0} / {totalQuestions} Done</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                {progressStats?.questionsMastered ?? 0} questions mastered
              </span>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5">
              <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                Company Research
              </span>
              <div className="flex items-center gap-1.5 text-sm font-bold text-slate-200">
                <Globe className="w-4 h-4 text-sky-400 shrink-0" />
                <span>
                  {kit.company_brief?.what_they_do ? 'Synthesized' : 'Not specified'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                {kit.source?.pages_used?.length || 0} pages researched
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 3 & 4: COMPLETE ROLE OVERVIEW & RESPONSIBILITIES */}
      {/* ============================================================ */}
      <div className="bg-slate-900/65 border border-indigo-500/20 hover:border-indigo-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-lg transition-all space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">
              <Briefcase className="w-4 h-4" />
              <span>Role & Skills Breakdown</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100">
              {kit.role?.title || 'Target Role'} {kit.role?.seniority ? `(${kit.role.seniority})` : ''}
            </h2>
          </div>

          <Link
            href={`/kits/${kitId}/role`}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 shrink-0"
          >
            <span>View Full Role Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Structured Role Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-0.5">
              Seniority Level
            </span>
            <span className="font-semibold text-slate-200 capitalize">
              {kit.role?.seniority || 'Not specified'}
            </span>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-0.5">
              Location / Mode
            </span>
            <span className="font-semibold text-slate-200">
              {kit.role?.location || kit.source?.location || 'Not specified'}
            </span>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-0.5">
              Employment Type
            </span>
            <span className="font-semibold text-slate-200 capitalize">
              {kit.role?.employment_type || 'Full-time / Not specified'}
            </span>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-0.5">
              Department / Team
            </span>
            <span className="font-semibold text-slate-200">
              {kit.role?.department || kit.role?.job_family || 'Engineering / Not specified'}
            </span>
          </div>
        </div>

        {/* Role Overview Narrative if present */}
        {kit.role?.overview && (
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed">
            <p>{kit.role.overview}</p>
          </div>
        )}

        {/* Core Responsibilities (Section 4) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Core Responsibilities ({kit.role?.responsibilities?.length || 0})</span>
            </h3>
            {kit.role?.responsibilities && kit.role.responsibilities.length > 5 && (
              <button
                onClick={() => setIsResponsibilitiesExpanded(!isResponsibilitiesExpanded)}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>{isResponsibilitiesExpanded ? 'Show Less' : `Show All (${kit.role.responsibilities.length})`}</span>
                {isResponsibilitiesExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {kit.role?.responsibilities && kit.role.responsibilities.length > 0 ? (
            <div className="space-y-2">
              {(isResponsibilitiesExpanded
                ? kit.role.responsibilities
                : kit.role.responsibilities.slice(0, 5)
              ).map((resp, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 hover:border-slate-700 transition-colors"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{resp}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Not specified in the job description.</p>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 5: SKILLS & TECHNOLOGIES (NO EMPTY HEADINGS) */}
      {/* ============================================================ */}
      <div className="bg-slate-900/65 border border-indigo-500/20 hover:border-indigo-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-lg transition-all space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>Skills & Technologies</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Extracted technical and behavioral competencies grounded in the job posting
            </p>
          </div>
          <span className="text-xs text-slate-500">
            {skillCategories.reduce((acc, g) => acc + g.skills.length, 0)} total skills identified
          </span>
        </div>

        {skillCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skillCategories.map((group, idx) => (
              <div
                key={idx}
                className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60">
                  {group.icon}
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider truncate">
                    {group.title}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono ml-auto">
                    {group.skills.length}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {group.skills.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2 py-1 bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-medium text-slate-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No categorized skills specified in the job description.</p>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECTION 6 & 7: MUST-HAVE VS NICE-TO-HAVE & COVERAGE */}
      {/* ============================================================ */}
      <div className="bg-slate-900/65 border border-indigo-500/20 hover:border-indigo-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-lg transition-all space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Must-Have vs. Nice-to-Have Requirements</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified mapping between candidate requirements and generated interview questions
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-indigo-950/40 border border-indigo-500/30 rounded-full text-xs font-bold text-indigo-300">
              Passes: {kit.coverage?.passes || 1}
            </span>
            <span className="px-3 py-1 bg-emerald-950/40 border border-emerald-500/30 rounded-full text-xs font-bold text-emerald-400">
              {mustHaveCoveragePercent}% Must-Have Coverage
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Must-Have Requirements List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-purple-400">
              <span>Must-Have Requirements ({mustReqs.length})</span>
              <span className="text-[11px] text-slate-500 font-normal">Mandatory for hiring</span>
            </div>

            <div className="space-y-2.5">
              {mustReqs.map(req => {
                const questionCount = (kit.questions || []).filter(q =>
                  q.requirement_ids?.includes(req.id)
                ).length;
                const isCovered = questionCount > 0;

                return (
                  <div
                    key={req.id}
                    className={`p-3.5 rounded-2xl border transition-colors ${
                      isCovered
                        ? 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                        : 'bg-amber-950/20 border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {req.id}
                        </span>
                        <Badge variant={req.kind} size="sm">{req.kind}</Badge>
                      </div>

                      <span className={`text-[11px] font-semibold ${
                        isCovered ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {isCovered ? `\u2713 Covered by ${questionCount} Qs` : '\u26A0 Not covered yet'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 font-medium leading-relaxed">
                      {req.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nice-to-Have Requirements List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span>Nice-to-Have Requirements ({niceReqs.length})</span>
              <span className="text-[11px] text-slate-500 font-normal">Preferred skills</span>
            </div>

            {niceReqs.length > 0 ? (
              <div className="space-y-2.5">
                {niceReqs.map(req => {
                  const questionCount = (kit.questions || []).filter(q =>
                    q.requirement_ids?.includes(req.id)
                  ).length;
                  const isCovered = questionCount > 0;

                  return (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-2xl border bg-slate-950/50 border-slate-800/80 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            {req.id}
                          </span>
                          <Badge variant={req.kind} size="sm">{req.kind}</Badge>
                        </div>

                        <span className="text-[11px] text-slate-400 font-medium">
                          {isCovered ? `Covered by ${questionCount} Qs` : 'Bonus competency'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 font-normal leading-relaxed">
                        {req.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-950/30 border border-dashed border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500">
                All identified competencies were classified as Must-Have requirements.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 8, 9 & 10: COMPANY OVERVIEW & ROLE ALIGNMENT */}
      {/* ============================================================ */}
      <div className="bg-slate-900/65 border border-indigo-500/20 hover:border-indigo-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-lg transition-all space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
              <Building2 className="w-4 h-4" />
              <span>Company Intelligence Summary</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100">
              {kit.source?.company || 'Target Organization'}
            </h2>
          </div>

          <Link
            href={`/kits/${kitId}/company`}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 shrink-0"
          >
            <span>Explore Full Company Intelligence</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Quick Facts Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-0.5">
              Industry
            </span>
            <span className="font-semibold text-slate-200">
              {kit.company_brief?.industry || 'Technology / Not specified'}
            </span>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-0.5">
              Headquarters
            </span>
            <span className="font-semibold text-slate-200">
              {kit.company_brief?.headquarters || 'Not specified'}
            </span>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-0.5">
              Company Scale
            </span>
            <span className="font-semibold text-slate-200">
              {kit.company_brief?.company_scale || kit.company_brief?.company_size || 'Not specified'}
            </span>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-0.5">
              Stock / Ownership
            </span>
            <span className="font-semibold text-slate-200">
              {kit.company_brief?.stock_ticker || 'Private / Not specified'}
            </span>
          </div>
        </div>

        {/* What They Do & Mission */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-sky-400" />
              <span>What They Do</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {kit.company_brief?.what_they_do || kit.company_brief?.summary || 'Not found in retrieved sources.'}
            </p>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Mission & Core Purpose</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {kit.company_brief?.mission || 'Not specified in retrieved sources.'}
            </p>
          </div>
        </div>

        {/* Why This Role Matters (Section 9) */}
        <div className="bg-slate-950/60 border border-indigo-500/20 rounded-2xl p-5 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Why This Role Matters to the Business</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {kit.company_brief?.role_company_context?.why_they_matter ||
              kit.company_brief?.role_company_context?.distinction_notes ||
              'This role directly impacts core engineering scalability, product delivery, and customer experience.'}
          </p>
        </div>

        {/* What To Prepare (Section 10) */}
        {kit.company_brief?.what_to_prepare && kit.company_brief.what_to_prepare.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-purple-400" />
              <span>Priority Preparation Focus</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {kit.company_brief.what_to_prepare.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-1 text-[10px] uppercase font-bold text-slate-400">
                    <span className="text-indigo-400 font-mono">Priority #{idx + 1}</span>
                    <span className="capitalize">{item.category}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {item.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECTION 11 & 12: QUESTIONS & FLASHCARDS SUMMARY */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Question Bank Summary (Section 11) */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5 mb-1">
                <HelpCircle className="w-4 h-4" />
                <span>Question Bank</span>
              </span>
              <h3 className="text-lg font-bold text-slate-100">
                {totalQuestions} Categorized Questions
              </h3>
            </div>

            <Link
              href={`/kits/${kitId}/questions`}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <span>View All Questions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Category Breakdown Chips */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950/60 border border-cyan-500/20 rounded-xl p-3">
              <span className="text-cyan-400 font-bold block mb-0.5">Technical Mastery</span>
              <span className="text-lg font-bold text-slate-100">{categoryCounts.technical}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Algorithms, systems, debugging</span>
            </div>

            <div className="bg-slate-950/60 border border-emerald-500/20 rounded-xl p-3">
              <span className="text-emerald-400 font-bold block mb-0.5">Behavioural (STAR)</span>
              <span className="text-lg font-bold text-slate-100">{categoryCounts.behavioural}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Ownership, teamwork, conflict</span>
            </div>

            <div className="bg-slate-950/60 border border-amber-500/20 rounded-xl p-3">
              <span className="text-amber-400 font-bold block mb-0.5">System Design</span>
              <span className="text-lg font-bold text-slate-100">{categoryCounts['system-design']}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Architecture, scaling, storage</span>
            </div>

            <div className="bg-slate-950/60 border border-indigo-500/20 rounded-xl p-3">
              <span className="text-indigo-400 font-bold block mb-0.5">Company Fit</span>
              <span className="text-lg font-bold text-slate-100">{categoryCounts['company-fit']}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Values, mission, products</span>
            </div>
          </div>
        </div>

        {/* Flashcards Active Recall Summary (Section 12) */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 mb-1">
                <BookOpen className="w-4 h-4" />
                <span>Active Recall Flashcards</span>
              </span>
              <h3 className="text-lg font-bold text-slate-100">
                {totalFlashcards} Concept Verification Cards
              </h3>
            </div>

            <Link
              href={`/kits/${kitId}/flashcards`}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>View Flashcards</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-4 text-xs">
            <p className="text-slate-300 leading-relaxed">
              Rapid front-to-back flip verification cards mapped strictly to the mandatory requirements of the role.
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Available</span>
                <span className="text-base font-bold text-slate-100">{totalFlashcards} cards</span>
              </div>

              <Link
                href={`/kits/${kitId}/practice`}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Start Flashcard Drill</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 13: STUDY SCHEDULE PREVIEW */}
      {/* ============================================================ */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-1">
              <Calendar className="w-4 h-4" />
              <span>Study Schedule Plan</span>
            </span>
            <h3 className="text-xl font-bold text-slate-100">
              {scheduleDays.length} Days Allocated ({Math.round((totalStudyMinutes / 60) * 10) / 10} Total Study Hours)
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {scheduleDays.length > 3 && (
              <button
                onClick={() => setIsScheduleExpanded(!isScheduleExpanded)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                {isScheduleExpanded ? 'Show First 3 Days' : `Show All (${scheduleDays.length} Days)`}
              </button>
            )}
            <Link
              href={`/kits/${kitId}/schedule`}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 shrink-0"
            >
              <span>View Full Schedule</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {scheduleDays.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedulePreview.map(day => (
              <div
                key={day.day}
                className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/30 border border-amber-500/20 px-2 py-0.5 rounded">
                    Day {day.day}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{day.minutes} mins</span>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{day.focus}</h4>
                <p className="text-[11px] text-slate-400">
                  {day.question_ids?.length || 0} questions assigned
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No study schedule generated for this kit.</p>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECTION 16 & 17: RESEARCH STATUS & SOURCE PROVENANCE */}
      {/* ============================================================ */}
      <div className="bg-slate-900/65 border border-indigo-500/20 hover:border-indigo-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-lg transition-all space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400" />
              <span>Research Status & Source Provenance</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verifiable extraction provenance and external sources consulted
            </p>
          </div>

          <Link
            href={`/kits/${kitId}/company`}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 shrink-0"
          >
            <span>View All Sources</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-0.5">
              Company URL
            </span>
            <span className="font-semibold text-slate-200 truncate block">
              {kit.source?.company_url || 'Not specified'}
            </span>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-0.5">
              Pages Researched
            </span>
            <span className="font-semibold text-slate-200">
              {kit.source?.pages_used?.length || 0} pages
            </span>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-0.5">
              Hiring Process Intel
            </span>
            <span className="font-semibold text-emerald-400">
              {kit.company_brief?.hiring_process ? '\u2713 Found' : 'Not found'}
            </span>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-0.5">
              Interview Discussions
            </span>
            <span className="font-semibold text-indigo-400">
              {kit.company_brief?.public_interview_research ? '\u2713 Found' : 'Not found'}
            </span>
          </div>
        </div>

        {/* Detailed Sources Compact Chips */}
        {kit.company_brief?.detailed_sources && kit.company_brief.detailed_sources.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Consulted Sources ({kit.company_brief.detailed_sources.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {kit.company_brief.detailed_sources.slice(0, 6).map((src, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between text-xs"
                >
                  <div className="truncate mr-2">
                    <span className="font-medium text-slate-200 truncate block">{src.title}</span>
                    <span className="text-[10px] text-slate-500 capitalize">{src.source_type}</span>
                  </div>
                  {src.url && (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-200 shrink-0 p-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
