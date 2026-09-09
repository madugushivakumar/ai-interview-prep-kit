'use client';

import React, { useState, useEffect } from 'react';
import { useKit } from '../KitContext';
import { WeakSpotsReportView } from '../../../../components/kit/WeakSpotsReportView';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { ErrorState } from '../../../../components/ui/ErrorState';
import { WeakSpotsReport } from '../../../../types';
import { api } from '../../../../lib/apiClient';
import { RefreshCw, Target } from 'lucide-react';
import Link from 'next/link';

export default function WeakSpotsTabPage() {
  const { kitDoc } = useKit();
  const [report, setReport] = useState<WeakSpotsReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    if (!kitDoc) return;
    setIsLoading(true);
    try {
      const res = await api.get<{ report: WeakSpotsReport }>(`/practice/${kitDoc._id}/weak-spots`);
      setReport(res.report);
    } catch (err: any) {
      setError(err.message || 'Failed to generate weak spots report');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [kitDoc?._id]);

  if (isLoading) {
    return <LoadingSpinner message="Analyzing practice analytics & competency risks..." />;
  }

  if (error || !report) {
    return (
      <ErrorState
        title="Could not generate Weak Spots Report"
        message={error || 'An error occurred'}
        onRetry={fetchReport}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Feature Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800 p-5 rounded-2xl backdrop-blur">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400 bg-cyan-950/50 border border-cyan-500/30 px-2 py-0.5 rounded-full">
              Creative Assessment Feature
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">
            Weak Spots & Targeted Revision Report
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Active recall confidence data translated into actionable interview gap remediation
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchReport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 rounded-xl"
            title="Refresh Analytics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <Link
            href={`/kits/${kitDoc?._id}/practice`}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-colors"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Practice Flashcards</span>
          </Link>
        </div>
      </div>

      <WeakSpotsReportView report={report} />
    </div>
  );
}
