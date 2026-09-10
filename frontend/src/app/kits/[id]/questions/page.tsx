'use client';

import React, { useState } from 'react';
import { useKit } from '../KitContext';
import { QuestionCard } from '../../../../components/kit/QuestionCard';
import { QuestionCategory, Question } from '../../../../types';
import { api } from '../../../../lib/apiClient';
import { Plus, RefreshCw, Filter, Layers } from 'lucide-react';

const CATEGORIES: { key: QuestionCategory; label: string; desc: string }[] = [
  { key: 'technical', label: 'Technical Questions', desc: 'Core language, frameworks, algorithms, and technical mechanics' },
  { key: 'behavioural', label: 'Behavioural Questions', desc: 'Leadership, mentoring, cross-functional collaboration, STAR scenarios' },
  { key: 'system-design', label: 'System Design', desc: 'Scalable architecture, distributed consensus, pipelines, data partitioning' },
  { key: 'company-fit', label: 'Company Fit', desc: 'Alignment with values, domain challenges, and cultural dynamics' }
];

export default function QuestionsTabPage() {
  const { kit, kitDoc, refreshKit } = useKit();
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isRegenerating, setIsRegenerating] = useState<Record<string, boolean>>({});
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New question form state
  const [newPrompt, setNewPrompt] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newCategory, setNewCategory] = useState<QuestionCategory>('technical');
  const [newDifficulty, setNewDifficulty] = useState<1 | 2 | 3>(2);
  const [isSavingNew, setIsSavingNew] = useState(false);

  if (!kit || !kitDoc) return null;

  const handleUpdateQuestion = async (questionId: string, updated: Partial<Question>) => {
    await api.patch(`/kits/${kitDoc._id}/questions/${questionId}`, updated);
    await refreshKit();
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    await api.delete(`/kits/${kitDoc._id}/questions/${questionId}`);
    await refreshKit();
  };

  const handleMoveCategory = async (questionId: string, category: QuestionCategory) => {
    await api.patch(`/kits/${kitDoc._id}/questions/${questionId}/category`, { category });
    await refreshKit();
  };

  const handleRegenerateCategory = async (cat: QuestionCategory) => {
    setIsRegenerating(prev => ({ ...prev, [cat]: true }));
    try {
      await api.post(`/kits/${kitDoc._id}/regenerate/questions/${cat}`);
      await refreshKit();
    } finally {
      setIsRegenerating(prev => ({ ...prev, [cat]: false }));
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt.trim() || !newAnswer.trim()) return;

    setIsSavingNew(true);
    try {
      await api.post(`/kits/${kitDoc._id}/questions`, {
        prompt: newPrompt,
        answer_outline: newAnswer,
        category: newCategory,
        difficulty: newDifficulty
      });
      setNewPrompt('');
      setNewAnswer('');
      setIsAddingNew(false);
      await refreshKit();
    } finally {
      setIsSavingNew(false);
    }
  };

  const categoriesToShow = selectedCategoryFilter === 'all'
    ? CATEGORIES
    : CATEGORIES.filter(c => c.key === selectedCategoryFilter);

  return (
    <div className="space-y-8">
      {/* Top Filter and Add Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/65 border border-indigo-500/25 p-4 rounded-2xl backdrop-blur-xl shadow-[0_0_30px_rgba(79,70,229,0.1)]">
        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              selectedCategoryFilter === 'all'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.35)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            All Questions ({kit.questions.length})
          </button>
          {CATEGORIES.map(cat => {
            const count = kit.questions.filter(q => q.category === cat.key).length;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategoryFilter(cat.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                  selectedCategoryFilter === cat.key
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.35)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {cat.label.split(' ')[0]} ({count})
              </button>
            );
          })}
        </div>

        {/* Add Question Button */}
        <button
          onClick={() => setIsAddingNew(!isAddingNew)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all self-start sm:self-auto hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Question</span>
        </button>
      </div>

      {/* Inline Create Question Form Modal/Panel */}
      {isAddingNew && (
        <form
          onSubmit={handleCreateQuestion}
          className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-6 backdrop-blur space-y-4 animate-in fade-in slide-in-from-top-2"
        >
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Add New Custom Interview Question</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Prompt</label>
            <textarea
              required
              rows={2}
              value={newPrompt}
              onChange={e => setNewPrompt(e.target.value)}
              placeholder="Enter interview question prompt..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Answer Outline</label>
            <textarea
              required
              rows={3}
              value={newAnswer}
              onChange={e => setNewAnswer(e.target.value)}
              placeholder="Outline optimal answer bullets and key evaluation criteria..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as QuestionCategory)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Difficulty</label>
              <div className="flex items-center gap-1.5">
                {([1, 2, 3] as const).map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setNewDifficulty(lvl)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors ${
                      newDifficulty === lvl
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Level {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingNew}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl disabled:opacity-50"
            >
              {isSavingNew ? 'Adding...' : 'Add Question'}
            </button>
          </div>
        </form>
      )}

      {/* Categorized Question Lists */}
      <div className="space-y-10">
        {categoriesToShow.map(catGroup => {
          const categoryQuestions = kit.questions.filter(q => q.category === catGroup.key);
          const isCategoryRegenerating = isRegenerating[catGroup.key];

          return (
            <div key={catGroup.key} className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div>
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>{catGroup.label}</span>
                    <span className="text-xs font-normal text-slate-500">
                      ({categoryQuestions.length})
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">{catGroup.desc}</p>
                </div>

                {/* Section-Specific Regeneration Button */}
                <button
                  onClick={() => handleRegenerateCategory(catGroup.key)}
                  disabled={isCategoryRegenerating}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:text-white bg-indigo-950/40 hover:bg-indigo-900/60 rounded-xl border border-indigo-500/30 transition-colors disabled:opacity-50 self-start sm:self-auto"
                  title="Regenerates untouched questions while strictly preserving your edited, pinned, and custom questions"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCategoryRegenerating ? 'animate-spin' : ''}`} />
                  <span>
                    {isCategoryRegenerating ? 'Regenerating...' : `Regenerate ${catGroup.key === 'company-fit' ? 'Company Fit' : catGroup.key === 'system-design' ? 'System Design' : catGroup.label.split(' ')[0]}`}
                  </span>
                </button>
              </div>

              {categoryQuestions.length === 0 ? (
                <div className="p-6 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl text-center text-xs text-slate-500">
                  No questions in this category yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {categoryQuestions.map(q => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      onUpdate={updated => handleUpdateQuestion(q.id, updated)}
                      onDelete={() => handleDeleteQuestion(q.id)}
                      onMoveCategory={cat => handleMoveCategory(q.id, cat)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
