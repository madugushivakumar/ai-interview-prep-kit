'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Kit, Question, Flashcard, PracticeProgressStats, PracticeMode } from '../../types';
import { api } from '../../lib/apiClient';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import {
  Sparkles,
  Eye,
  RotateCw,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Clock,
  Star,
  BookOpen,
  Zap,
  Target,
  ShieldAlert,
  Award,
  Terminal,
  Layers,
  Building2,
  Compass,
  FileText,
  AlertCircle,
  HelpCircle,
  BarChart3,
  Bookmark
} from 'lucide-react';

interface InterviewPracticeWorkspaceProps {
  kitId: string;
  kit: Kit;
  onFinishSession?: () => void;
}

interface PracticeSessionResponse {
  mode: string;
  questions: Question[];
  flashcards: Flashcard[];
  totalAvailable: number;
}

const CONFIDENCE_LEVELS = [
  {
    rating: 1,
    title: '1 — Very Weak',
    desc: 'Would struggle or fail to answer in a real interview',
    color: 'border-rose-500/40 bg-rose-950/20 text-rose-300 hover:bg-rose-900/40'
  },
  {
    rating: 2,
    title: '2 — Shaky / Gaps',
    desc: 'Know the broad idea, but missing core mechanics or edge cases',
    color: 'border-amber-500/40 bg-amber-950/20 text-amber-300 hover:bg-amber-900/40'
  },
  {
    rating: 3,
    title: '3 — Adequate',
    desc: 'Can pass with an average answer, could be structured better',
    color: 'border-yellow-500/40 bg-yellow-950/20 text-yellow-300 hover:bg-yellow-950/40'
  },
  {
    rating: 4,
    title: '4 — Strong',
    desc: 'Clear structure, accurate technical depth and tradeoffs',
    color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-900/40'
  },
  {
    rating: 5,
    title: '5 — Mastered',
    desc: 'Senior-level fluency, exceptional clarity and system insight',
    color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300 hover:bg-cyan-900/40'
  }
];

export function InterviewPracticeWorkspace({ kitId, kit, onFinishSession }: InterviewPracticeWorkspaceProps) {
  const router = useRouter();

  // Mode Selection & Session State
  const [selectedMode, setSelectedMode] = useState<PracticeMode | string>('all');
  const [inSession, setInSession] = useState<boolean>(false);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [sessionFlashcards, setSessionFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const activeRequestIdRef = useRef<number>(0);

  // In-Question State
  const [userAnswerText, setUserAnswerText] = useState<string>('');
  const [userNoteText, setUserNoteText] = useState<string>('');
  const [showNoteInput, setShowNoteInput] = useState<boolean>(false);
  const [isGuidanceRevealed, setIsGuidanceRevealed] = useState<boolean>(false);
  const [currentRating, setCurrentRating] = useState<number | null>(null);
  const [isSavingAttempt, setIsSavingAttempt] = useState<boolean>(false);
  const [isNavigatingNext, setIsNavigatingNext] = useState<boolean>(false);
  const [isStarred, setIsStarred] = useState<boolean>(false);

  // Session Statistics
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [skippedCount, setSkippedCount] = useState<number>(0);
  const [sessionRatings, setSessionRatings] = useState<Array<{ category: string; rating: number }>>([]);
  const [isSessionComplete, setIsSessionComplete] = useState<boolean>(false);

  // Global Progress Stats from API
  const [progressStats, setProgressStats] = useState<PracticeProgressStats | null>(null);
  const [activeTab, setActiveTab] = useState<'practice' | 'history'>('practice');

  const fetchProgress = async () => {
    try {
      const res = await api.get<{ progress: PracticeProgressStats }>(`/practice/${kitId}/progress`);
      setProgressStats(res.progress);
    } catch (err) {
      console.error('Failed to fetch practice progress:', err);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [kitId]);

  // Start Practice Session
  const handleStartSession = async (mode: string) => {
    const requestId = ++activeRequestIdRef.current;
    setSelectedMode(mode);
    setIsLoadingSession(true);
    setSessionError(null);

    try {
      const res = await api.get<PracticeSessionResponse | { data: PracticeSessionResponse }>(
        `/practice/${kitId}/session?mode=${encodeURIComponent(mode)}`
      );

      // Protect against race conditions from previous in-flight requests
      if (activeRequestIdRef.current !== requestId) return;

      const sessionData: PracticeSessionResponse =
        (res as any)?.data && ((res as any).data.questions !== undefined || (res as any).data.flashcards !== undefined)
          ? (res as any).data
          : (res as PracticeSessionResponse);

      if (mode === 'flashcards') {
        const cards = Array.isArray(sessionData?.flashcards)
          ? sessionData.flashcards
          : (kit.flashcards || []);
        setSessionFlashcards(cards);
        setSessionQuestions([]);
      } else {
        if (!Array.isArray(sessionData?.questions)) {
          throw new Error('Invalid practice session response: questions array expected');
        }
        setSessionQuestions(sessionData.questions);
        setSessionFlashcards([]);
      }

      setCurrentIndex(0);
      setUserAnswerText('');
      setUserNoteText('');
      setShowNoteInput(false);
      setIsGuidanceRevealed(false);
      setCurrentRating(null);
      setCompletedCount(0);
      setSkippedCount(0);
      setSessionRatings([]);
      setIsSessionComplete(false);
      setInSession(true);
    } catch (err: any) {
      if (activeRequestIdRef.current !== requestId) return;
      console.error('Failed to load session:', err);
      setSessionError(err?.message || 'Unable to load practice session.');
    } finally {
      if (activeRequestIdRef.current === requestId) {
        setIsLoadingSession(false);
      }
    }
  };

  // Submit Rating & Advance
  const handleRateConfidence = async (rating: number) => {
    setIsSavingAttempt(true);
    setCurrentRating(rating);

    const isCard = selectedMode === 'flashcards';
    const currentItem = isCard ? sessionFlashcards[currentIndex] : sessionQuestions[currentIndex];

    try {
      await api.post(`/practice/${kitId}/attempt`, {
        itemId: currentItem.id,
        itemType: isCard ? 'flashcard' : 'question',
        category: (currentItem as Question).category || 'technical',
        confidence: rating,
        answerText: userAnswerText,
        notes: userNoteText
      });

      setCompletedCount(prev => prev + 1);
      setSessionRatings(prev => [
        ...prev,
        { category: (currentItem as Question).category || 'general', rating }
      ]);

      await fetchProgress();
    } catch (err) {
      console.error('Failed to save practice attempt:', err);
    } finally {
      setIsSavingAttempt(false);
    }
  };

  // Advance to next question
  const handleNext = () => {
    const totalItems = selectedMode === 'flashcards' ? sessionFlashcards.length : sessionQuestions.length;
    if (currentIndex + 1 >= totalItems) {
      setIsSessionComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setUserAnswerText('');
      setUserNoteText('');
      setShowNoteInput(false);
      setIsGuidanceRevealed(false);
      setCurrentRating(null);
    }
  };

  // Advance to next question via Next button with answer preservation & double-click protection
  const handleNextClick = async () => {
    if (isNavigatingNext || isSavingAttempt) return;
    setIsNavigatingNext(true);

    try {
      const isCard = selectedMode === 'flashcards';
      const currentItem = isCard ? sessionFlashcards[currentIndex] : sessionQuestions[currentIndex];

      if (currentItem) {
        const hasAnswer = userAnswerText.trim().length > 0;
        const hasNote = userNoteText.trim().length > 0;

        if (hasAnswer && currentRating === null) {
          try {
            await api.post(`/practice/${kitId}/attempt`, {
              itemId: currentItem.id,
              itemType: isCard ? 'flashcard' : 'question',
              category: (currentItem as Question).category || 'technical',
              confidence: 3,
              answerText: userAnswerText.trim(),
              notes: hasNote ? userNoteText.trim() : undefined
            });
            setCompletedCount(prev => prev + 1);
            setSessionRatings(prev => [
              ...prev,
              { category: (currentItem as Question).category || 'general', rating: 3 }
            ]);
            await fetchProgress();
          } catch (err) {
            console.error('Failed to persist answer before next:', err);
          }
        } else if (hasNote && currentRating === null) {
          try {
            await api.patch(`/practice/${kitId}/notes/${currentItem.id}`, {
              notes: userNoteText.trim()
            });
          } catch (err) {
            console.error('Failed to persist note before next:', err);
          }
        }
      }

      handleNext();
    } catch (err) {
      console.error('Error during next navigation:', err);
    } finally {
      setIsNavigatingNext(false);
    }
  };

  // Retry / Put back in queue
  const handleRetry = () => {
    if (selectedMode === 'flashcards') {
      const card = sessionFlashcards[currentIndex];
      setSessionFlashcards(prev => [...prev, card]);
    } else {
      const q = sessionQuestions[currentIndex];
      setSessionQuestions(prev => [...prev, q]);
    }
    handleNext();
  };

  // Skip question
  const handleSkip = () => {
    setSkippedCount(prev => prev + 1);
    handleNext();
  };

  // Save personal note
  const handleSaveNote = async () => {
    const isCard = selectedMode === 'flashcards';
    const currentItem = isCard ? sessionFlashcards[currentIndex] : sessionQuestions[currentIndex];
    if (!currentItem) return;

    try {
      await api.patch(`/practice/${kitId}/notes/${currentItem.id}`, {
        notes: userNoteText
      });
      setShowNoteInput(false);
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  };

  // Toggle Star
  const handleToggleStar = async () => {
    const isCard = selectedMode === 'flashcards';
    const currentItem = isCard ? sessionFlashcards[currentIndex] : sessionQuestions[currentIndex];
    if (!currentItem) return;

    try {
      const res = await api.post<{ isStarred: boolean }>(`/practice/${kitId}/star/${currentItem.id}`, {});
      setIsStarred(res.isStarred);
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  };

  const totalQuestionsInKit = kit.questions?.length || 0;
  const totalFlashcardsInKit = kit.flashcards?.length || 0;
  const overallCoverage = kit.coverage?.uncovered_requirement_ids?.length === 0 ? 100 : 90;

  // ============================================================
  // VIEW: SESSION COMPLETE
  // ============================================================
  if (inSession && isSessionComplete) {
    const totalPracticed = sessionRatings.length;
    const avgConfidence = totalPracticed > 0
      ? Math.round((sessionRatings.reduce((sum, r) => sum + r.rating, 0) / totalPracticed) * 10) / 10
      : 0;

    // Determine strongest & weakest categories
    const catBuckets: Record<string, number[]> = {};
    sessionRatings.forEach(r => {
      catBuckets[r.category] = catBuckets[r.category] || [];
      catBuckets[r.category].push(r.rating);
    });

    let strongestCat = 'N/A';
    let weakestCat = 'N/A';
    let maxAvg = -1;
    let minAvg = 999;

    Object.entries(catBuckets).forEach(([cat, ratings]) => {
      const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      if (avg > maxAvg) {
        maxAvg = avg;
        strongestCat = cat;
      }
      if (avg < minAvg) {
        minAvg = avg;
        weakestCat = cat;
      }
    });

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 sm:p-10 text-center backdrop-blur shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-4 shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-slate-100 mb-2">Practice Session Complete!</h2>
          <p className="text-sm text-slate-400 mb-8 max-w-md mx-auto">
            Session results have been persisted. Weak concepts are automatically prioritized in your next preparation round.
          </p>

          {/* Session Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 text-left">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Completed
              </span>
              <span className="text-xl font-bold text-slate-100">{completedCount}</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Skipped
              </span>
              <span className="text-xl font-bold text-slate-400">{skippedCount}</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Session Avg
              </span>
              <span className="text-xl font-bold text-cyan-400">
                {avgConfidence > 0 ? `${avgConfidence} / 5` : 'N/A'}
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Weakest Area
              </span>
              <span className="text-xs font-bold text-rose-300 capitalize truncate block">
                {weakestCat}
              </span>
            </div>
          </div>

          {/* Action Recommendations */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => handleStartSession('weak-areas')}
              className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Drill Weak Areas</span>
            </button>

            <button
              onClick={() => setInSession(false)}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              <span>Choose Another Practice</span>
            </button>

            <Link
              href={`/kits/${kitId}/weak-spots`}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>View Weak Spots Report</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // VIEW: LOADING SESSION STATE
  // ============================================================
  if (isLoadingSession) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur">
        <LoadingSpinner message={`Preparing ${selectedMode} practice session...`} />
      </div>
    );
  }

  // ============================================================
  // VIEW: SESSION FETCH ERROR STATE
  // ============================================================
  if (sessionError) {
    return (
      <div className="max-w-xl mx-auto text-center py-12 bg-slate-900/50 border border-rose-800/40 rounded-3xl p-8 backdrop-blur shadow-2xl">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-100 mb-2">Unable to load practice session</h3>
        <p className="text-xs text-slate-400 mb-6">{sessionError}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => handleStartSession(selectedMode)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
          >
            Retry Session
          </button>
          <button
            onClick={() => {
              setSessionError(null);
              setInSession(false);
            }}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            Return to Modes
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // VIEW: IN-SESSION PRACTICE (QUESTION OR FLASHCARD)
  // ============================================================
  if (inSession) {
    const isCard = selectedMode === 'flashcards';
    const totalItems = isCard ? sessionFlashcards.length : sessionQuestions.length;

    if (totalItems === 0) {
      return (
        <div className="max-w-xl mx-auto text-center py-12 bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur shadow-lg">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-100 mb-2">No questions available</h3>
          <p className="text-xs text-slate-400 mb-6">
            {selectedMode === 'weak' || selectedMode === 'weak-areas'
              ? 'No weak spots recorded yet. Rate questions confidence 1 or 2 during practice to populate this drill.'
              : selectedMode === 'starred'
              ? 'No questions starred yet. Star questions during practice to build your custom review queue.'
              : 'There are no questions matching this practice mode yet.'}
          </p>
          <button
            onClick={() => setInSession(false)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
          >
            Return to Practice Options
          </button>
        </div>
      );
    }

    const currentQuestion = !isCard ? sessionQuestions[currentIndex] : null;
    const currentFlashcard = isCard ? sessionFlashcards[currentIndex] : null;
    const progressPercent = Math.round(((currentIndex + 1) / totalItems) * 100);
    const isLastQuestion = currentIndex + 1 >= totalItems;

    const suggestedThinkingTime = currentQuestion?.category === 'system-design'
      ? '10–20 minutes'
      : currentQuestion?.category === 'behavioural'
      ? '2–3 minutes'
      : currentQuestion?.category === 'company-fit'
      ? '2–3 minutes'
      : '3–5 minutes';

    return (
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Session Navigation Bar */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setInSession(false)}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              Exit Session
            </button>
            <span>•</span>
            <span className="text-slate-200">
              {isCard ? 'Flashcard' : 'Question'} {currentIndex + 1} of {totalItems}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-indigo-400 font-mono">{progressPercent}% Completed</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Main Practice Workspace Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[460px]">
          {/* Question Metadata Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {isCard ? currentFlashcard?.id : currentQuestion?.id}
              </span>

              {!isCard && currentQuestion && (
                <>
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    currentQuestion.category === 'technical'
                      ? 'text-cyan-300 bg-cyan-950/40 border-cyan-500/30'
                      : currentQuestion.category === 'system-design'
                      ? 'text-amber-300 bg-amber-950/40 border-amber-500/30'
                      : currentQuestion.category === 'behavioural'
                      ? 'text-emerald-300 bg-emerald-950/40 border-emerald-500/30'
                      : 'text-indigo-300 bg-indigo-950/40 border-indigo-500/30'
                  }`}>
                    {currentQuestion.category}
                  </span>

                  <span className="text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    Difficulty: L{currentQuestion.difficulty}
                  </span>

                  {currentQuestion.requirement_ids?.map(rid => (
                    <span
                      key={rid}
                      className="font-mono text-[11px] text-indigo-400 bg-indigo-950/40 border border-indigo-500/20 px-1.5 py-0.5 rounded"
                    >
                      {rid}
                    </span>
                  ))}
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>Suggested time: {suggestedThinkingTime}</span>
              </div>

              <button
                onClick={handleToggleStar}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isStarred
                    ? 'text-amber-400 bg-amber-950/40 border-amber-500/30'
                    : 'text-slate-500 hover:text-slate-300 border-slate-800'
                }`}
                title="Star Question"
              >
                <Star className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Question / Prompt Body */}
          <div className="py-6 flex-1">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
              {isCard ? 'Front — Interview Concept' : 'Interviewer Asks:'}
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-100 leading-snug mb-6">
              {isCard ? currentFlashcard?.front : currentQuestion?.prompt}
            </h2>

            {/* Optional Answer Input Textarea */}
            {!isGuidanceRevealed && (
              <div className="space-y-3 mb-4">
                <textarea
                  value={userAnswerText}
                  onChange={e => setUserAnswerText(e.target.value)}
                  placeholder="Type your answer, bullet points, or thoughts here (optional)..."
                  rows={4}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-sans"
                />

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="italic">
                    Tip: You do not need to type; you can also answer mentally and click "Show Guidance".
                  </span>
                  <button
                    onClick={() => setShowNoteInput(!showNoteInput)}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{showNoteInput ? 'Hide Note' : 'Add Personal Note'}</span>
                  </button>
                </div>

                {showNoteInput && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 animate-in fade-in duration-150">
                    <input
                      type="text"
                      value={userNoteText}
                      onChange={e => setUserNoteText(e.target.value)}
                      placeholder="E.g., Reference my project PrepAI distributed worker pool..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveNote}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold rounded-md"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Answer Guidance (Revealed) */}
            {isGuidanceRevealed && (
              <div className="mt-4 pt-5 border-t border-slate-800 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>What a Strong Answer Should Cover</span>
                  </span>

                  {!isCard && currentQuestion && (
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {currentQuestion.category === 'behavioural'
                        ? 'STAR / R Framework'
                        : currentQuestion.category === 'system-design'
                        ? 'System Design Framework'
                        : 'Technical Depth'}
                    </span>
                  )}
                </div>

                {/* Answer Outline Box */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 text-sm text-slate-200 leading-relaxed">
                  <p className="whitespace-pre-line font-medium text-slate-200">
                    {isCard ? currentFlashcard?.back : currentQuestion?.answer_outline}
                  </p>
                </div>

                {/* Category Structured Breakdown Checklist */}
                {!isCard && currentQuestion && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {currentQuestion.category === 'behavioural' ? (
                      <>
                        <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
                          <span className="font-bold text-indigo-400 block mb-0.5">S / T — Situation & Task</span>
                          <span className="text-slate-400">Context, technical constraints, team stakes.</span>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
                          <span className="font-bold text-emerald-400 block mb-0.5">A / R — Action & Result</span>
                          <span className="text-slate-400">Exact technical decisions and measurable outcome.</span>
                        </div>
                      </>
                    ) : currentQuestion.category === 'system-design' ? (
                      <>
                        <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
                          <span className="font-bold text-cyan-400 block mb-0.5">1. Scope & Storage Model</span>
                          <span className="text-slate-400">Read/write QPS, data partitioning, indexing.</span>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
                          <span className="font-bold text-amber-400 block mb-0.5">2. Scalability & Failover</span>
                          <span className="text-slate-400">Caching layers, message queues, circuit breakers.</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
                          <span className="font-bold text-indigo-400 block mb-0.5">Core Mechanism</span>
                          <span className="text-slate-400">Underlying runtime or architectural mechanics.</span>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
                          <span className="font-bold text-emerald-400 block mb-0.5">Trade-offs & Traps</span>
                          <span className="text-slate-400">Memory overhead, concurrency locks, edge cases.</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action & Evaluation Bar */}
          <div className="pt-4 border-t border-slate-800">
            {!isGuidanceRevealed ? (
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsGuidanceRevealed(true)}
                  className="w-full sm:w-auto sm:flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-indigo-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  aria-label="Show Answer Guidance"
                >
                  <Eye className="w-4 h-4" aria-hidden="true" />
                  <span>Show Answer Guidance</span>
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleNextClick}
                    disabled={isNavigatingNext || isSavingAttempt}
                    className="flex-1 sm:flex-none px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-2xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:pointer-events-none"
                    aria-label={isLastQuestion ? "Finish Interview" : "Next Question"}
                  >
                    <span>{isLastQuestion ? 'Finish Interview' : 'Next'}</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={handleSkip}
                    disabled={isNavigatingNext || isSavingAttempt}
                    className="flex-1 sm:flex-none px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 text-xs font-semibold rounded-2xl border border-slate-700 transition-colors flex items-center justify-center gap-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:pointer-events-none"
                    aria-label="Skip Question"
                  >
                    Skip
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    How confident are you in answering this in a real interview?
                  </span>
                </div>

                {/* 1 - 5 Confidence Rating Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {CONFIDENCE_LEVELS.map(lvl => (
                    <button
                      key={lvl.rating}
                      disabled={isSavingAttempt}
                      onClick={() => handleRateConfidence(lvl.rating)}
                      className={`p-2.5 rounded-xl border transition-all text-left group ${lvl.color} ${
                        currentRating === lvl.rating ? 'ring-2 ring-indigo-400 shadow-md' : ''
                      }`}
                    >
                      <div className="font-bold text-xs mb-0.5">{lvl.title}</div>
                      <div className="text-[10px] text-slate-400 opacity-90 leading-tight">
                        {lvl.desc}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Immediate Result Feedback & Advance */}
                {currentRating !== null && (
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-150">
                    <div className="text-xs text-slate-300 font-medium text-center sm:text-left">
                      {currentRating <= 2 ? (
                        <span className="text-rose-400 font-semibold">
                          Recommendation: Review this topic again. Added to your weak spots queue.
                        </span>
                      ) : currentRating === 5 ? (
                        <span className="text-cyan-400 font-semibold">
                          Mastered! Confident senior-level answer recorded.
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">
                          Solid response recorded! Continue practicing to solidify details.
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {currentRating <= 2 && (
                        <button
                          onClick={handleRetry}
                          className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                        >
                          Practice Again Later
                        </button>
                      )}

                      <button
                        onClick={handleNext}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                      >
                        <span>{isLastQuestion ? 'Finish Interview' : 'Next'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // VIEW: PRACTICE HOME & MODE SELECTOR
  // ============================================================
  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900/65 border border-indigo-500/25 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_40px_rgba(79,70,229,0.12)] relative overflow-hidden">
        {/* Ambient glow in corner */}
        <div
          className="absolute -top-16 -right-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1.5 px-2.5 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-500/30">
              <Building2 className="w-3.5 h-3.5" />
              <span>{kit.source?.company || 'Company'}</span>
              <span>•</span>
              <span>{kit.role?.title || 'Role'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 tracking-tight">
              Interview Practice Workspace
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Active recall text drills tailored to job requirements, systems architecture, and company fit
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('practice')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'practice'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.35)]'
                  : 'bg-slate-800/60 text-slate-400 border border-slate-700/80 hover:text-slate-200'
              }`}
            >
              Practice Drills
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.35)]'
                  : 'bg-slate-800/60 text-slate-400 border border-slate-700/80 hover:text-slate-200'
              }`}
            >
              Practice History
            </button>
          </div>
        </div>

        {/* Global Stats Counter */}
        <div className="pt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Total Questions
            </span>
            <span className="text-xl font-bold text-slate-100">{totalQuestionsInKit}</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Flashcards
            </span>
            <span className="text-xl font-bold text-slate-100">{totalFlashcardsInKit}</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Must-Have Coverage
            </span>
            <span className="text-xl font-bold text-emerald-400">{overallCoverage}%</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Questions Practiced
            </span>
            <span className="text-xl font-bold text-indigo-400">
              {progressStats?.questionsPracticed || 0} / {totalQuestionsInKit}
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Average Confidence
            </span>
            <span className="text-xl font-bold text-cyan-400">
              {progressStats?.averageConfidence ? `${progressStats.averageConfidence} / 5` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: PRACTICE DRILLS SELECTOR */}
      {/* ============================================================ */}
      {activeTab === 'practice' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-300">
              Select Practice Mode
            </h2>
            <span className="text-xs text-slate-500">
              Choose a focused category or comprehensive drill
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Quick Practice */}
            <button
              onClick={() => handleStartSession('quick')}
              className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 text-left transition-all hover:shadow-xl group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors mb-1">
                Quick Practice Drill
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                10 prioritized questions focusing on weak areas, must-have requirements, and unpracticed topics.
              </p>
              <div className="flex items-center text-xs font-semibold text-indigo-400 gap-1">
                <span>Start Drill</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Practice All */}
            <button
              onClick={() => handleStartSession('all')}
              className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 text-left transition-all hover:shadow-xl group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-105 transition-transform">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors mb-1">
                Practice All Questions
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Full-spectrum interview bank ({totalQuestionsInKit} questions) ordered by lowest confidence first.
              </p>
              <div className="flex items-center text-xs font-semibold text-indigo-400 gap-1">
                <span>Start All</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Technical */}
            <button
              onClick={() => handleStartSession('technical')}
              className="bg-slate-900/65 hover:bg-slate-900/90 border border-indigo-500/20 rounded-2xl p-5 text-left transition-all hover:shadow-[0_0_30px_rgba(79,70,229,0.15)] group backdrop-blur-md hover:border-cyan-500/40"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-105 transition-transform">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors mb-1">
                Technical Mastery
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Conceptual questions, code reasoning, concurrency, performance trade-offs, and debugging.
              </p>
              <div className="flex items-center text-xs font-semibold text-cyan-400 gap-1">
                <span>Practice Technical</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* System Design */}
            <button
              onClick={() => handleStartSession('system-design')}
              className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 text-left transition-all hover:shadow-xl group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors mb-1">
                System Design & Scale
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Architecture, data models, scalability bottlenecks, distributed storage, and failover design.
              </p>
              <div className="flex items-center text-xs font-semibold text-amber-400 gap-1">
                <span>Practice System Design</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Behavioural */}
            <button
              onClick={() => handleStartSession('behavioural')}
              className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 text-left transition-all hover:shadow-xl group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors mb-1">
                Behavioural (STAR / R)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Scenario questions focusing on engineering leadership, conflict resolution, and technical ownership.
              </p>
              <div className="flex items-center text-xs font-semibold text-emerald-400 gap-1">
                <span>Practice Behavioural</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Company Fit */}
            <button
              onClick={() => handleStartSession('company-fit')}
              className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 text-left transition-all hover:shadow-xl group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors mb-1">
                Company Fit & Alignment
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Questions grounded in {kit.source?.company || 'the company'}'s mission, products, and culture principles.
              </p>
              <div className="flex items-center text-xs font-semibold text-indigo-400 gap-1">
                <span>Practice Company Fit</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Must-Have Requirements */}
            <button
              onClick={() => handleStartSession('must-have')}
              className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-5 text-left transition-all hover:shadow-xl group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3 group-hover:scale-105 transition-transform">
                <Star className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 group-hover:text-purple-300 transition-colors mb-1">
                Must-Have Requirements
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Target strictly the mandatory technical skills identified in the Job Description.
              </p>
              <div className="flex items-center text-xs font-semibold text-purple-400 gap-1">
                <span>Practice Must-Haves</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Weak Areas Drill */}
            <button
              onClick={() => handleStartSession('weak-areas')}
              className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-rose-500/50 rounded-2xl p-5 text-left transition-all hover:shadow-xl group"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-3 group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 group-hover:text-rose-300 transition-colors mb-1">
                Weak Areas (Rating &le; 2)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Drill topics where you rated your confidence 1 or 2 until you reach mastery.
              </p>
              <div className="flex items-center text-xs font-semibold text-rose-400 gap-1">
                <span>Drill Weak Areas</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Unpracticed Questions */}
            <button
              onClick={() => handleStartSession('unpracticed')}
              className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 text-left transition-all hover:shadow-xl group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors mb-1">
                Unpracticed Questions
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Fresh questions you have not attempted yet across all interview categories.
              </p>
              <div className="flex items-center text-xs font-semibold text-emerald-400 gap-1">
                <span>Start Unpracticed</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Starred Questions */}
            <button
              onClick={() => handleStartSession('starred')}
              className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 text-left transition-all hover:shadow-xl group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-105 transition-transform">
                <Star className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors mb-1">
                Starred Questions
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Curated items you marked with a star for targeted high-priority review.
              </p>
              <div className="flex items-center text-xs font-semibold text-amber-400 gap-1">
                <span>Practice Starred</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Flashcard Active Recall */}
            <button
              onClick={() => handleStartSession('flashcards')}
              className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 text-left transition-all hover:shadow-xl group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors mb-1">
                Flashcard Active Recall
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Rapid concept drills with front-to-back flip verification ({totalFlashcardsInKit} cards).
              </p>
              <div className="flex items-center text-xs font-semibold text-indigo-400 gap-1">
                <span>Start Flashcards</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: RECENT PRACTICE HISTORY */}
      {/* ============================================================ */}
      {activeTab === 'history' && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Recent Practice Attempts
              </h2>
              <p className="text-xs text-slate-400">
                Chronological log of your practice evaluations and ratings
              </p>
            </div>
            <Link
              href={`/kits/${kitId}/weak-spots`}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              View Weak Spots Report →
            </Link>
          </div>

          {progressStats?.recentAttempts && progressStats.recentAttempts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="pb-3">Item / Question</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Rating</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {progressStats.recentAttempts.map((attempt, idx) => (
                    <tr key={idx} className="hover:bg-slate-950/40">
                      <td className="py-3 pr-4 font-medium text-slate-200 line-clamp-1 max-w-sm">
                        {attempt.prompt || attempt.itemId}
                      </td>
                      <td className="py-3 pr-4 text-slate-400 capitalize">
                        {attempt.category || attempt.itemType}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-block font-bold px-2 py-0.5 rounded-full ${
                          attempt.confidence >= 4
                            ? 'text-emerald-400 bg-emerald-950/40'
                            : attempt.confidence === 3
                            ? 'text-amber-400 bg-amber-950/40'
                            : 'text-rose-400 bg-rose-950/40'
                        }`}>
                          {attempt.confidence} / 5
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-500">
                        {new Date(attempt.practicedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right font-medium text-slate-400">
                        {attempt.confidence === 5 ? 'Mastered' : attempt.confidence <= 2 ? 'Needs Review' : 'Practiced'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-800">
              No practice attempts logged yet. Start a practice drill above!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
