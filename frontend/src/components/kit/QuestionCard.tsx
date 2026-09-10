'use client';

import React, { useState } from 'react';
import { Question, QuestionCategory } from '../../types';
import { Badge } from '../ui/Badge';
import { Pin, Trash2, Edit3, Check, X, ArrowRightLeft } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  onUpdate: (updated: Partial<Question>) => Promise<void>;
  onDelete: () => Promise<void>;
  onMoveCategory: (category: QuestionCategory) => Promise<void>;
}

export function QuestionCard({ question, onUpdate, onDelete, onMoveCategory }: QuestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [prompt, setPrompt] = useState(question.prompt);
  const [answerOutline, setAnswerOutline] = useState(question.answer_outline);
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(question.difficulty);
  const [isPinned, setIsPinned] = useState(Boolean(question.metadata?.isPinned));
  const [isMovingCategory, setIsMovingCategory] = useState(false);

  const isUserCreated = question.metadata?.source === 'user';
  const isEdited = Boolean(question.metadata?.isEdited);

  const handleSave = async () => {
    await onUpdate({
      prompt,
      answer_outline: answerOutline,
      difficulty,
      metadata: {
        source: isUserCreated ? 'user' : 'generated',
        isEdited: true,
        isPinned
      }
    });
    setIsEditing(false);
  };

  const handleTogglePin = async () => {
    const nextPin = !isPinned;
    setIsPinned(nextPin);
    await onUpdate({
      metadata: {
        source: isUserCreated ? 'user' : 'generated',
        isEdited: isEdited,
        isPinned: nextPin
      }
    });
  };

  const difficultyVariant = difficulty === 1 ? 'easy' : difficulty === 2 ? 'medium' : 'hard';
  const difficultyLabel = difficulty === 1 ? 'L1 Fundamental' : difficulty === 2 ? 'L2 Applied' : 'L3 Senior/Staff';

  return (
    <div
      className={`relative rounded-2xl border p-5 transition-all backdrop-blur-md ${
        isPinned
          ? 'bg-slate-900/80 border-indigo-500/50 shadow-[0_0_25px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/30'
          : 'bg-slate-900/60 border-slate-800/80 hover:border-indigo-500/30 hover:bg-slate-900/75 hover:shadow-[0_0_20px_rgba(79,70,229,0.08)]'
      }`}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800/60">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
            {question.id}
          </span>
          <Badge variant={question.category}>{question.category}</Badge>
          <Badge variant={difficultyVariant}>{difficultyLabel}</Badge>

          {/* Linked Requirements */}
          {question.requirement_ids && question.requirement_ids.length > 0 && (
            <div className="flex items-center gap-1">
              {question.requirement_ids.map(rid => (
                <span key={rid} className="font-mono text-[11px] text-indigo-400 bg-indigo-950/40 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                  {rid}
                </span>
              ))}
            </div>
          )}

          {/* User state flags */}
          {isUserCreated && (
            <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-1.5 py-0.5 rounded">
              User Created
            </span>
          )}
          {isEdited && !isUserCreated && (
            <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.5 rounded">
              Edited
            </span>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {/* Pin Button */}
          <button
            onClick={handleTogglePin}
            className={`p-1.5 rounded-lg border transition-colors ${
              isPinned
                ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800'
            }`}
            title={isPinned ? 'Pinned (Survives regeneration)' : 'Pin question (Protect from regeneration)'}
          >
            <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-indigo-400' : ''}`} />
          </button>

          {/* Move Category */}
          <button
            onClick={() => setIsMovingCategory(!isMovingCategory)}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
            title="Move Category"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>

          {/* Edit Button */}
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
              title="Edit Question"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={handleSave}
                className="p-1.5 text-emerald-400 hover:bg-emerald-950/40 rounded-lg transition-colors"
                title="Save Changes"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setPrompt(question.prompt);
                  setAnswerOutline(question.answer_outline);
                  setDifficulty(question.difficulty);
                  setIsEditing(false);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Delete Button */}
          <button
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-colors"
            title="Delete Question"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Category Move Bar */}
      {isMovingCategory && (
        <div className="mb-4 p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400">Move to category:</span>
          <div className="flex flex-wrap gap-1.5">
            {(['technical', 'behavioural', 'system-design', 'company-fit'] as QuestionCategory[]).map(cat => (
              <button
                key={cat}
                disabled={cat === question.category}
                onClick={async () => {
                  await onMoveCategory(cat);
                  setIsMovingCategory(false);
                }}
                className={`px-2 py-1 text-xs rounded-lg font-medium transition-colors ${
                  cat === question.category
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/60 border border-indigo-500/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Question Content */}
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Prompt</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={2}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Answer Outline</label>
            <textarea
              value={answerOutline}
              onChange={e => setAnswerOutline(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400">Difficulty:</span>
            {([1, 2, 3] as const).map(level => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors ${
                  difficulty === level
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                Level {level}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-100 leading-snug">
            {question.prompt}
          </p>

          <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Answer Outline & Key Points
            </span>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {question.answer_outline}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
