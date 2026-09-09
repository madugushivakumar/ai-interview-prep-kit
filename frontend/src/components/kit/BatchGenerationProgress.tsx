'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Loader2, ExternalLink, ArrowRight } from 'lucide-react';

export interface BatchItemProgress {
  id: string;
  kitId: string;
  companyUrl: string;
  days: number;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  error?: string;
}

interface BatchGenerationProgressProps {
  items: BatchItemProgress[];
  onReset: () => void;
}

export function BatchGenerationProgress({ items, onReset }: BatchGenerationProgressProps) {
  const total = items.length;
  const completed = items.filter(i => i.status === 'completed').length;
  const failed = items.filter(i => i.status === 'failed').length;
  const inProgress = items.filter(i => i.status === 'running' || i.status === 'queued').length;
  const isAllFinished = inProgress === 0;

  return (
    <div className="w-full max-w-3xl mx-auto bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
      {/* Header Banner */}
      <div className="mb-6 pb-6 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
              <Loader2 className={`w-3.5 h-3.5 ${!isAllFinished ? 'animate-spin text-indigo-400' : 'hidden'}`} />
              <span>{isAllFinished ? 'Batch Generation Complete' : 'Autonomous Multi-Role Generation'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
              Multi-Role Processing Dashboard
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Each role generates an independent kit with isolated research, questions, and practice state.
            </p>
          </div>

          {/* Counts pill */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300">
              {completed} Completed
            </span>
            {failed > 0 && (
              <span className="px-3 py-1.5 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300">
                {failed} Failed
              </span>
            )}
            {inProgress > 0 && (
              <span className="px-3 py-1.5 rounded-xl bg-indigo-950/50 border border-indigo-500/30 text-indigo-300">
                {inProgress} Active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* List of Role Progress Cards */}
      <div className="space-y-4">
        {items.map(item => {
          const isDone = item.status === 'completed';
          const isErr = item.status === 'failed';
          const isBusy = item.status === 'running' || item.status === 'queued';

          return (
            <div
              key={item.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isDone
                  ? 'bg-slate-950/60 border-emerald-500/30 shadow-sm'
                  : isErr
                  ? 'bg-slate-950/60 border-rose-500/30'
                  : 'bg-slate-950/80 border-indigo-500/30 shadow-indigo-950/20'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  {isDone && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                  {isErr && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
                  {isBusy && <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                        {item.id}
                      </span>
                      <span className="text-sm font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-xs">
                        {item.companyUrl}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Target Schedule: {item.days} Days
                    </span>
                  </div>
                </div>

                {/* Status action button */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {isDone && (
                    <Link
                      href={`/kits/${item.kitId}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all hover:scale-105"
                    >
                      <span>Open Kit</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  {isErr && (
                    <span className="px-2.5 py-1 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-medium">
                      Generation Failed
                    </span>
                  )}
                  {isBusy && (
                    <span className="text-xs font-medium text-indigo-300">
                      {item.progress}%
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isDone
                      ? 'bg-emerald-500'
                      : isErr
                      ? 'bg-rose-500'
                      : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                  }`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>

              {/* Subtitle / Step or Error */}
              <div className="mt-2 text-xs flex items-center justify-between text-slate-400">
                <span className="truncate">
                  {isErr ? item.error || 'Pipeline failed for this company.' : item.currentStep || 'Processing...'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Navigation */}
      <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
        <button
          onClick={onReset}
          className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          ← Back to Role Creator
        </button>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
        >
          <span>View All in Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
