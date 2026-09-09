'use client';

import React, { useState } from 'react';
import { CompanyBrief } from '../../types';
import { Edit2, RefreshCw, Check, X, ExternalLink, Building2 } from 'lucide-react';

interface CompanyBriefCardProps {
  brief: CompanyBrief;
  companyName: string;
  onUpdate: (updated: { summary: string; what_they_do: string }) => Promise<void>;
  onRegenerate: () => Promise<void>;
}

export function CompanyBriefCard({ brief, companyName, onUpdate, onRegenerate }: CompanyBriefCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [summary, setSummary] = useState(brief.summary);
  const [whatTheyDo, setWhatTheyDo] = useState(brief.what_they_do);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({ summary, what_they_do: whatTheyDo });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">{companyName} — Company Overview</h2>
            <p className="text-xs text-slate-400">Synthesized from crawl discovery and official public pages</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-700/70 rounded-lg border border-slate-700/60 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Brief</span>
              </button>

              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:text-white bg-indigo-950/40 hover:bg-indigo-900/60 rounded-lg border border-indigo-500/30 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span>{isRegenerating ? 'Regenerating...' : 'Regenerate Brief'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>

              <button
                onClick={() => {
                  setSummary(brief.summary);
                  setWhatTheyDo(brief.what_they_do);
                  setIsEditing(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              What They Do
            </label>
            <textarea
              value={whatTheyDo}
              onChange={e => setWhatTheyDo(e.target.value)}
              rows={2}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Executive Summary
            </label>
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              rows={4}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400/90 mb-1">
              What They Do
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {brief.what_they_do || 'No description available.'}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400/90 mb-1">
              Executive Summary
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {brief.summary || 'No summary available.'}
            </p>
          </div>
        </div>
      )}

      {/* Sources list */}
      {brief.sources && brief.sources.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 block">
            Retrieved Sources
          </span>
          <div className="flex flex-wrap gap-2">
            {brief.sources.map((url, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-indigo-300 bg-slate-950/70 border border-slate-800 rounded-lg transition-colors truncate max-w-xs"
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate">{url}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
