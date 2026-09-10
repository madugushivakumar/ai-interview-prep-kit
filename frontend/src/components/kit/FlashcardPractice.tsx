'use client';

import React, { useState } from 'react';
import { Flashcard } from '../../types';
import { Sparkles, Eye, RotateCw, CheckCircle2, ChevronRight } from 'lucide-react';

interface FlashcardPracticeProps {
  queue: Flashcard[];
  onRecordConfidence: (flashcardId: string, rating: number) => Promise<void>;
  onFinishSession: () => void;
}

const CONFIDENCE_LEVELS = [
  { rating: 1, label: '1 - Very Weak', color: 'border-rose-500/40 bg-rose-950/20 text-rose-300 hover:bg-rose-900/40' },
  { rating: 2, label: '2 - Weak', color: 'border-orange-500/40 bg-orange-950/20 text-orange-300 hover:bg-orange-900/40' },
  { rating: 3, label: '3 - Okay', color: 'border-amber-500/40 bg-amber-950/20 text-amber-300 hover:bg-amber-900/40' },
  { rating: 4, label: '4 - Good', color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-900/40' },
  { rating: 5, label: '5 - Mastered', color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300 hover:bg-cyan-900/40' }
];

export function FlashcardPractice({ queue, onRecordConfidence, onFinishSession }: FlashcardPracticeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [completedInSession, setCompletedInSession] = useState(0);

  if (queue.length === 0 || currentIndex >= queue.length) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center max-w-lg mx-auto backdrop-blur">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">Practice Session Complete!</h3>
        <p className="text-sm text-slate-400 mb-6">
          You practiced <span className="font-semibold text-emerald-400">{completedInSession}</span> flashcards. Low-confidence concepts will be prioritized next time!
        </p>
        <button
          onClick={onFinishSession}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-md transition-colors"
        >
          View Weak Spots Report
        </button>
      </div>
    );
  }

  const currentCard = queue[currentIndex];
  const progressPercent = Math.round(((currentIndex) / queue.length) * 100);

  const handleRate = async (rating: number) => {
    setIsSaving(true);
    try {
      await onRecordConfidence(currentCard.id, rating);
      setCompletedInSession(prev => prev + 1);
      setIsRevealed(false);
      setCurrentIndex(prev => prev + 1);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Session Progress Header */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
        <span>Card {currentIndex + 1} of {queue.length}</span>
        <span>{progressPercent}% Complete</span>
      </div>

      <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Flashcard Component */}
      <div className="bg-slate-900/65 border border-indigo-500/25 rounded-3xl p-8 min-h-[320px] flex flex-col justify-between shadow-[0_0_40px_rgba(79,70,229,0.15)] backdrop-blur-xl relative overflow-hidden">
        {/* Ambient Corner Glow */}
        <div
          className="absolute -top-16 -right-16 w-40 h-40 bg-purple-500/15 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 relative z-10">
          <span className="font-mono text-xs font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {currentCard.id}
          </span>
          <div className="flex items-center gap-1.5">
            {currentCard.requirement_ids?.map(rid => (
              <span key={rid} className="font-mono text-[11px] text-indigo-400 bg-indigo-950/40 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                {rid}
              </span>
            ))}
          </div>
        </div>

        {/* Card Body */}
        <div className="py-6 flex-1 flex flex-col justify-center relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400/90 mb-2">
            Front — Concept & Scenario
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-slate-100 leading-snug">
            {currentCard.front}
          </h3>

          {/* Answer Outline (Revealed) */}
          {isRevealed && (
            <div className="mt-6 pt-6 border-t border-slate-800/80 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400/90 mb-2 block">
                Back — Core Principle & Answer
              </span>
              <p className="text-sm text-slate-200 leading-relaxed font-medium bg-slate-950/70 p-4 rounded-2xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                {currentCard.back}
              </p>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="pt-4 border-t border-slate-800/80 relative z-10">
          {!isRevealed ? (
            <button
              onClick={() => setIsRevealed(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:via-purple-500 hover:to-cyan-500 text-white font-semibold text-sm rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Eye className="w-4 h-4 text-cyan-300" />
              <span>Reveal Answer</span>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="text-center">
                <span className="text-xs font-semibold text-slate-400">
                  How confident did you feel on this topic?
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {CONFIDENCE_LEVELS.map(lvl => (
                  <button
                    key={lvl.rating}
                    disabled={isSaving}
                    onClick={() => handleRate(lvl.rating)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center ${lvl.color}`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
