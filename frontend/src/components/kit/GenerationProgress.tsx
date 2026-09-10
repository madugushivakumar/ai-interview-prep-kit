'use client';

import React from 'react';
import { GenerationState } from '../../types';
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';

const PIPELINE_STAGES = [
  'Validating Input',
  'Extracting Requirements',
  'Crawling Company Site',
  'Synthesizing Company Overview',
  'Researching Hiring Process',
  'Researching Public Interview Discussions',
  'Generating Role Breakdown',
  'Generating Question Bank',
  'Generating Flashcards',
  'Checking Coverage',
  'Closing Coverage Gaps',
  'Allocating Schedule',
  'Validating Kit Structure',
  'Completed'
];

interface GenerationProgressProps {
  generationState?: GenerationState;
  onRetry?: () => void;
}

export function GenerationProgress({ generationState, onRetry }: GenerationProgressProps) {
  const currentStep = generationState?.currentStep || 'Initiating Pipeline';
  const progress = generationState?.progress || 5;
  const isFailed = generationState?.status === 'failed';
  const errorMessage = generationState?.error?.message;

  // Determine status of each stage
  const getStepStatus = (stageName: string): 'pending' | 'running' | 'completed' | 'failed' => {
    if (isFailed && currentStep.includes(stageName)) return 'failed';

    const currentStageIndex = PIPELINE_STAGES.findIndex(s => currentStep.toLowerCase().includes(s.toLowerCase()));
    const thisStageIndex = PIPELINE_STAGES.indexOf(stageName);

    if (currentStageIndex === -1) {
      return thisStageIndex === 0 ? 'running' : 'pending';
    }

    if (thisStageIndex < currentStageIndex) return 'completed';
    if (thisStageIndex === currentStageIndex) return isFailed ? 'failed' : 'running';
    return 'pending';
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-900/70 border border-indigo-500/25 rounded-3xl p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(79,70,229,0.15)] relative overflow-hidden">
      <div
        className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold tracking-wide uppercase text-indigo-400">
            {isFailed ? 'Generation Interrupted' : 'Generating Interview Kit'}
          </span>
          <span className="text-sm font-bold text-slate-200">{progress}%</span>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700/50">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isFailed
                ? 'bg-rose-500'
                : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-3 text-sm text-slate-300 font-medium">
          {currentStep}...
        </p>
      </div>

      {isFailed && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-sm">
          <p className="font-semibold mb-1">Kit generation could not be completed:</p>
          <p className="text-rose-400/90">{errorMessage || 'An unexpected failure occurred during processing.'}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Retry Generation
            </button>
          )}
        </div>
      )}

      {/* Structured Pipeline Stages Checklist */}
      <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
        {PIPELINE_STAGES.map((stage) => {
          const status = getStepStatus(stage);

          return (
            <div
              key={stage}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                status === 'running'
                  ? 'bg-indigo-950/30 border-indigo-500/40'
                  : status === 'completed'
                  ? 'bg-slate-900/30 border-slate-800/60'
                  : status === 'failed'
                  ? 'bg-rose-950/20 border-rose-500/30'
                  : 'bg-transparent border-transparent opacity-40'
              }`}
            >
              <div className="flex items-center gap-3">
                {status === 'completed' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                {status === 'running' && (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                )}
                {status === 'failed' && (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                {status === 'pending' && (
                  <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                )}
                <span className={`text-sm ${status === 'running' ? 'font-semibold text-slate-100' : 'text-slate-300'}`}>
                  {stage}
                </span>
              </div>

              <span className="text-xs font-mono text-slate-500 capitalize">
                {status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
