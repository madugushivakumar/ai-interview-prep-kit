'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useKit } from '../KitContext';
import { api } from '../../../../lib/apiClient';
import { Flashcard } from '../../../../types';
import { Sparkles, Plus, Edit2, Trash2, Check, X, Target } from 'lucide-react';

export default function FlashcardsTabPage() {
  const { kit, kitDoc, refreshKit } = useKit();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');

  if (!kit || !kitDoc) return null;

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;

    await api.post(`/kits/${kitDoc._id}/flashcards`, {
      front: newFront,
      back: newBack
    });
    setNewFront('');
    setNewBack('');
    setIsAddingNew(false);
    await refreshKit();
  };

  const handleSaveEdit = async (cardId: string) => {
    await api.patch(`/kits/${kitDoc._id}/flashcards/${cardId}`, {
      front: editFront,
      back: editBack
    });
    setEditingCardId(null);
    await refreshKit();
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this flashcard?')) return;
    await api.delete(`/kits/${kitDoc._id}/flashcards/${cardId}`);
    await refreshKit();
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800 p-4 rounded-2xl backdrop-blur">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Active Recall Flashcards ({kit.flashcards.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Key conceptual definitions, architectural decisions, and scenario drills
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Flashcard</span>
          </button>

          <Link
            href={`/kits/${kitDoc._id}/practice`}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/20 transition-all"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Start Practice</span>
          </Link>
        </div>
      </div>

      {/* Add New Flashcard Panel */}
      {isAddingNew && (
        <form
          onSubmit={handleAddCard}
          className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-5 backdrop-blur space-y-3"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">New Flashcard</h3>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Front (Prompt/Scenario)</label>
            <input
              type="text"
              required
              value={newFront}
              onChange={e => setNewFront(e.target.value)}
              placeholder="e.g. What is the difference between optimistic and pessimistic locking?"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Back (Explanation/Answer)</label>
            <textarea
              required
              rows={2}
              value={newBack}
              onChange={e => setNewBack(e.target.value)}
              placeholder="e.g. Optimistic locking verifies version before write; pessimistic locking holds exclusive lock..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg"
            >
              Add Card
            </button>
          </div>
        </form>
      )}

      {/* Flashcards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {kit.flashcards.map(card => {
          const isCardEditing = editingCardId === card.id;

          return (
            <div
              key={card.id}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 backdrop-blur flex flex-col justify-between space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="font-mono text-xs font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {card.id}
                </span>

                <div className="flex items-center gap-1.5">
                  {card.requirement_ids?.map(rid => (
                    <span key={rid} className="font-mono text-[10px] text-indigo-400 bg-indigo-950/40 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                      {rid}
                    </span>
                  ))}

                  <div className="flex items-center gap-1 ml-2">
                    {!isCardEditing ? (
                      <button
                        onClick={() => {
                          setEditingCardId(card.id);
                          setEditFront(card.front);
                          setEditBack(card.back);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-200 rounded"
                        title="Edit Flashcard"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleSaveEdit(card.id)}
                          className="p-1 text-emerald-400 hover:bg-emerald-950/40 rounded"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingCardId(null)}
                          className="p-1 text-slate-400 hover:text-slate-200 rounded"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded"
                      title="Delete Flashcard"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {isCardEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editFront}
                    onChange={e => setEditFront(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                  />
                  <textarea
                    rows={3}
                    value={editBack}
                    onChange={e => setEditBack(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Front
                    </span>
                    <p className="text-sm font-semibold text-slate-100">
                      {card.front}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400/90 block mb-1">
                      Back (Key Answer)
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {card.back}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
