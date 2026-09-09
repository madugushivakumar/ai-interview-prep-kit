'use client';

import React from 'react';
import { ScheduleDay, Question } from '../../types';
import { Badge } from '../ui/Badge';
import { Clock, Calendar, CheckSquare } from 'lucide-react';

interface ScheduleDayCardProps {
  day: ScheduleDay;
  allQuestions: Question[];
}

export function ScheduleDayCard({ day, allQuestions }: ScheduleDayCardProps) {
  const qMap = new Map(allQuestions.map(q => [q.id, q]));
  const dayQuestions = day.question_ids
    .map(id => qMap.get(id))
    .filter((q): q is Question => q !== undefined);

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 backdrop-blur">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Day {day.day}</h3>
            <span className="text-xs text-indigo-400 font-medium">{day.focus}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>{Math.round(day.minutes)} min</span>
        </div>
      </div>

      {/* Allocated Questions List */}
      <div className="space-y-2">
        {dayQuestions.length > 0 ? (
          dayQuestions.map(q => (
            <div
              key={q.id}
              className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-2.5">
                <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-200 line-clamp-2">
                    {q.prompt}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="font-mono text-[10px] text-slate-400">{q.id}</span>
                    <Badge variant={q.category} size="sm">{q.category}</Badge>
                    <Badge
                      variant={q.difficulty === 1 ? 'easy' : q.difficulty === 2 ? 'medium' : 'hard'}
                      size="sm"
                    >
                      L{q.difficulty}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-xs text-slate-500 italic p-3 bg-slate-950/40 rounded-xl text-center">
            Consolidation & flashcard memory drill day
          </div>
        )}
      </div>
    </div>
  );
}
