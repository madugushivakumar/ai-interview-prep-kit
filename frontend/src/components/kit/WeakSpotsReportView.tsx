'use client';

import React from 'react';
import { WeakSpotsReport } from '../../types';
import { Badge } from '../ui/Badge';
import { Target, AlertCircle, Award, BookOpen, CheckCircle, TrendingUp } from 'lucide-react';

import { StatCard } from '../ui/StatCard';

interface WeakSpotsReportViewProps {
  report: WeakSpotsReport;
}

export function WeakSpotsReportView({ report }: WeakSpotsReportViewProps) {
  return (
    <div className="space-y-8">
      {/* Metric Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Proficiency Score"
          value={`${report.overallProficiencyScore}%`}
          subtext="Overall interview readiness"
          icon={TrendingUp}
          accent="purple"
        />

        <StatCard
          label="Flashcard Coverage"
          value={`${report.completionRate}%`}
          subtext={`${report.totalCardsPracticed} total reviews`}
          icon={BookOpen}
          accent="emerald"
        />

        <StatCard
          label="Critical Weak Spots"
          value={report.weakSpots.length}
          subtext="Topics requiring immediate drill"
          icon={AlertCircle}
          accent="pink"
        />
      </div>

      {/* Summary Advice */}
      <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl flex items-start gap-3">
        <Target className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-indigo-200">Personalized Revision Directive</h4>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{report.summaryMessage}</p>
        </div>
      </div>

      {/* Critical Weak Spots List */}
      {report.weakSpots.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <span>High-Priority Gaps & Recommended Drills</span>
          </h3>

          <div className="space-y-4">
            {report.weakSpots.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900/65 border border-rose-500/30 rounded-2xl p-5 backdrop-blur-xl shadow-[0_0_20px_rgba(244,63,94,0.08)] space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-rose-400 bg-rose-950/40 border border-rose-500/30 px-2 py-0.5 rounded">
                      {item.requirementId}
                    </span>
                    <Badge variant={item.kind as any}>{item.kind}</Badge>
                    <span className="text-xs font-semibold text-rose-300 bg-rose-950/50 px-2 py-0.5 rounded">
                      Avg Confidence: {item.averageRating || 'Unranked'}/5
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Reviewed {item.practiceCount} time(s)
                  </span>
                </div>

                <p className="text-sm font-semibold text-slate-200">
                  {item.requirementText}
                </p>

                {/* Recommended Interview Question Drills */}
                {item.recommendedQuestions.length > 0 && (
                  <div className="pt-3 border-t border-slate-800">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                      Targeted Practice Questions for this Gap:
                    </span>
                    <div className="space-y-2">
                      {item.recommendedQuestions.map(q => (
                        <div
                          key={q.id}
                          className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl"
                        >
                          <p className="text-xs font-semibold text-indigo-200">
                            {q.prompt}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                            {q.answer_outline}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths List */}
      {report.strengths.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <span>Demonstrated Strengths ({report.strengths.length})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.strengths.map((s, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 flex items-start gap-3"
              >
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[11px] font-bold text-emerald-400">{s.requirementId}</span>
                    <Badge variant={s.kind as any} size="sm">{s.kind}</Badge>
                    <span className="text-[11px] font-bold text-emerald-400">{s.averageRating}/5</span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2 font-medium">
                    {s.requirementText}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
