'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/apiClient';
import { KitDocument } from '../../types';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { StatCard } from '../../components/ui/StatCard';
import { GlassCard } from '../../components/ui/GlassCard';
import {
  PlusCircle,
  Calendar,
  ArrowRight,
  Building2,
  ShieldCheck,
  Trash2,
  HelpCircle,
  Sparkles,
  Target,
  Flame,
  Clock,
  BookOpen,
  Play
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [kits, setKits] = useState<KitDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchKits = async () => {
    try {
      const res = await api.get<{ kits: KitDocument[] }>('/kits');
      setKits(res.kits || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load preparation kits.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading) {
      if (!user) {
        router.push('/login');
      } else {
        fetchKits();
      }
    }
  }, [user, isAuthLoading, router]);

  const handleDelete = async (e: React.MouseEvent, kitId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this prep kit?')) return;

    try {
      await api.delete(`/kits/${kitId}`);
      setKits(prev => prev.filter(k => k._id !== kitId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete kit');
    }
  };

  // Aggregated Preparation Metrics
  const metrics = useMemo(() => {
    let totalQuestions = 0;
    let totalFlashcards = 0;
    let totalPracticed = 0;
    let totalConfidenceScores: number[] = [];
    let coveragePercentages: number[] = [];

    kits.forEach(k => {
      const kit = k.kit;
      if (!kit) return;

      totalQuestions += kit.questions?.length || 0;
      totalFlashcards += kit.flashcards?.length || 0;

      // Coverage
      const mustReqs = kit.role?.requirements?.filter(r => r.priority === 'must') || [];
      const uncovered = kit.coverage?.uncovered_requirement_ids?.length || 0;
      if (mustReqs.length > 0) {
        coveragePercentages.push(
          Math.max(0, Math.round(((mustReqs.length - uncovered) / mustReqs.length) * 100))
        );
      } else if (k.status === 'completed') {
        coveragePercentages.push(100);
      }

      // Practice state
      const attempts = k.practiceState?.attempts || [];
      totalPracticed += attempts.length;

      attempts.forEach(att => {
        if (typeof att.confidence === 'number' && att.confidence > 0) {
          totalConfidenceScores.push(att.confidence);
        }
      });
      if (k.practiceState?.cards) {
        k.practiceState.cards.forEach(c => {
          if (typeof c.lastRating === 'number' && c.lastRating > 0) {
            totalConfidenceScores.push(c.lastRating);
          }
        });
      }
    });

    const avgCoverage =
      coveragePercentages.length > 0
        ? Math.round(coveragePercentages.reduce((a, b) => a + b, 0) / coveragePercentages.length)
        : 100;

    const avgConf =
      totalConfidenceScores.length > 0
        ? (totalConfidenceScores.reduce((a, b) => a + b, 0) / totalConfidenceScores.length).toFixed(1)
        : 'N/A';

    return {
      totalQuestions,
      totalFlashcards,
      avgCoverage: `${avgCoverage}%`,
      totalPracticed,
      avgConfidence: avgConf === 'N/A' ? 'N/A' : `${avgConf} / 5`
    };
  }, [kits]);

  // Derived user display name
  const displayName = user?.email ? user.email.split('@')[0] : 'Engineer';
  const latestCompletedKit = kits.find(k => k.status === 'completed');

  if (isAuthLoading || isLoading) {
    return <LoadingSpinner message="Loading your interview workspace..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchKits} />;
  }

  return (
    <div className="space-y-8">
      {/* 1. Header Banner & Welcome Message */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Welcome back, {displayName}</span>
            <span className="text-xl sm:text-2xl">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Let&apos;s prepare you for your next interview with personalized intelligence.
          </p>
        </div>

        <Link
          href="/kits/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Kit</span>
        </Link>
      </div>

      {/* 2. Five Compact Glowing StatCards Row (Matching Image 1 Palette) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          icon={HelpCircle}
          value={metrics.totalQuestions}
          label="Total Questions"
          subtext="Bank capacity"
          accent="blue"
        />
        <StatCard
          icon={Sparkles}
          value={metrics.totalFlashcards}
          label="Flashcards"
          subtext="Active recall"
          accent="purple"
        />
        <StatCard
          icon={ShieldCheck}
          value={metrics.avgCoverage}
          label="Must-Have Coverage"
          subtext="Deterministic"
          accent="emerald"
        />
        <StatCard
          icon={Target}
          value={metrics.totalPracticed}
          label="Questions Practiced"
          subtext="Drills logged"
          accent="cyan"
        />
        <StatCard
          icon={Flame}
          value={metrics.avgConfidence}
          label="Average Confidence"
          subtext="Self-assessed"
          accent="amber"
        />
      </div>

      {/* 3. Recent Preparation Kits Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Recent Preparation Kits
            </h2>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-500/30 px-2 py-0.5 rounded-full">
              {kits.length}
            </span>
          </div>

          {kits.length > 0 && (
            <Link
              href="/kits/new"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              + Add another role
            </Link>
          )}
        </div>

        {kits.length === 0 ? (
          <EmptyState
            title="You haven't created an interview kit yet."
            description="Paste a job description and company website to generate targeted questions, research, and a personalized study schedule."
            actionText="Create Your First Kit"
            actionHref="/kits/new"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {kits.map(kit => {
              const company = kit.kit?.source?.company || kit.input.company_url.replace(/https?:\/\//, '').split('/')[0];
              const role = kit.kit?.role?.title || 'Software Engineer';
              const days = kit.input.days;
              const isCompleted = kit.status === 'completed';
              const isRunning = kit.status === 'running' || kit.status === 'queued';
              const isFailed = kit.status === 'failed';
              const questionCount = kit.kit?.questions?.length || 0;
              const attemptsCount = kit.practiceState?.attempts?.length || 0;
              const uncoveredCount = kit.kit?.coverage?.uncovered_requirement_ids?.length || 0;

              return (
                <GlassCard
                  key={kit._id}
                  className="p-5 flex flex-col justify-between group hover:border-indigo-500/40 transition-all hover:shadow-xl hover:shadow-indigo-950/20"
                >
                  <div>
                    {/* Top Row: Date & Status */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-[11px] font-semibold text-slate-500">
                        {new Date(kit.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {isCompleted && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            Ready
                          </span>
                        )}
                        {isRunning && (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-full animate-pulse">
                            Generating...
                          </span>
                        )}
                        {isFailed && (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-950/40 border border-rose-500/30 px-2 py-0.5 rounded-full">
                            Failed
                          </span>
                        )}

                        <button
                          onClick={(e) => handleDelete(e, kit._id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                          title="Delete Kit"
                          aria-label="Delete Kit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Company Name */}
                    <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{company}</span>
                    </div>

                    {/* Role Title */}
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1 mb-3">
                      {role}
                    </h3>

                    {/* Key Metrics Pills */}
                    <div className="flex flex-wrap items-center gap-2 mb-4 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1 bg-slate-950/70 border border-slate-800/80 px-2 py-0.5 rounded-md">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{days}d Schedule</span>
                      </div>

                      {questionCount > 0 && (
                        <div className="flex items-center gap-1 bg-slate-950/70 border border-slate-800/80 px-2 py-0.5 rounded-md">
                          <HelpCircle className="w-3 h-3 text-indigo-400" />
                          <span>{questionCount} Qs</span>
                        </div>
                      )}

                      {isCompleted && (
                        <div className="flex items-center gap-1 bg-slate-950/70 border border-slate-800/80 px-2 py-0.5 rounded-md text-emerald-400">
                          <ShieldCheck className="w-3 h-3" />
                          <span>{uncoveredCount === 0 ? '100% Cov.' : `${uncoveredCount} gaps`}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <Link
                      href={`/kits/${kit._id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Open Kit</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {isCompleted && (
                      <Link
                        href={`/kits/${kit._id}/practice`}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Practice</span>
                      </Link>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Quick Actions Panel */}
      <div className="pt-2">
        <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mb-3">
          Quick Preparation Actions
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Link
            href="/kits/new"
            className="p-4 rounded-xl border border-indigo-500/20 bg-slate-900/50 hover:bg-slate-900/80 hover:border-indigo-500/40 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                Create New Kit
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Extract requirements and generate research from any JD.
              </div>
            </div>
          </Link>

          <Link
            href={latestCompletedKit ? `/kits/${latestCompletedKit._id}/weak-spots` : '/kits/new'}
            className="p-4 rounded-xl border border-rose-500/20 bg-slate-900/50 hover:bg-slate-900/80 hover:border-rose-500/40 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 group-hover:scale-105 transition-transform">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">
                Practice Weak Areas
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Target low-confidence questions with active recall drills.
              </div>
            </div>
          </Link>

          <Link
            href={latestCompletedKit ? `/kits/${latestCompletedKit._id}/flashcards` : '/kits/new'}
            className="p-4 rounded-xl border border-purple-500/20 bg-slate-900/50 hover:bg-slate-900/80 hover:border-purple-500/40 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                Review Flashcards
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Master core technical concepts with rapid spaced recall.
              </div>
            </div>
          </Link>

          <Link
            href={latestCompletedKit ? `/kits/${latestCompletedKit._id}/schedule` : '/kits/new'}
            className="p-4 rounded-xl border border-cyan-500/20 bg-slate-900/50 hover:bg-slate-900/80 hover:border-cyan-500/40 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-600/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                View Study Schedule
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Day-by-day structured preparation roadmap.
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
