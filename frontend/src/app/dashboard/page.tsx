'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/apiClient';
import { KitDocument } from '../../types';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Badge } from '../../components/ui/Badge';
import { PlusCircle, Calendar, ArrowRight, Building2, ShieldCheck, Clock, Trash2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [kits, setKits] = useState<KitDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchKits = async () => {
    try {
      const res = await api.get<{ kits: KitDocument[] }>('/kits');
      setKits(res.kits);
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

  if (isAuthLoading || isLoading) {
    return <LoadingSpinner message="Loading your interview kits..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchKits} />;
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
            Interview Preparation Kits
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Personalized research, question banks, and revision plans
          </p>
        </div>

        <Link
          href="/kits/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/30 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Kit</span>
        </Link>
      </div>

      {/* Kits Grid */}
      {kits.length === 0 ? (
        <EmptyState
          title="You haven't created an interview kit yet."
          description="Paste a job description and company URL to generate your first custom preparation kit in seconds."
          actionText="Create Your First Kit"
          actionHref="/kits/new"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {kits.map(kit => {
            const company = kit.kit?.source?.company || kit.input.company_url.replace(/https?:\/\//, '').split('/')[0];
            const role = kit.kit?.role?.title || 'Software Engineer';
            const days = kit.input.days;
            const isCompleted = kit.status === 'completed';
            const isRunning = kit.status === 'running' || kit.status === 'queued';
            const isFailed = kit.status === 'failed';
            const uncoveredCount = kit.kit?.coverage?.uncovered_requirement_ids?.length || 0;

            return (
              <Link
                key={kit._id}
                href={`/kits/${kit._id}`}
                className="group relative bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-indigo-950/20 backdrop-blur"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold text-slate-500">
                      {new Date(kit.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isCompleted && (
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          Ready
                        </span>
                      )}
                      {isRunning && (
                        <span className="text-[11px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-full animate-pulse">
                          Generating...
                        </span>
                      )}
                      {isFailed && (
                        <span className="text-[11px] font-bold text-rose-400 bg-rose-950/40 border border-rose-500/30 px-2 py-0.5 rounded-full">
                          Failed
                        </span>
                      )}

                      <button
                        onClick={(e) => handleDelete(e, kit._id)}
                        className="p-1 text-slate-600 hover:text-rose-400 rounded transition-colors"
                        title="Delete Kit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="truncate">{company}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1 mb-4">
                    {role}
                  </h3>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{days} Days Plan</span>
                  </div>

                  {isCompleted && (
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{uncoveredCount === 0 ? '100% Covered' : `${uncoveredCount} gaps`}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
