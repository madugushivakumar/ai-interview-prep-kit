'use client';

import React, { useState } from 'react';
import { useKit } from '../KitContext';
import { ScheduleDayCard } from '../../../../components/kit/ScheduleDayCard';
import { api } from '../../../../lib/apiClient';
import { Clock, RefreshCw, Calendar } from 'lucide-react';

export default function ScheduleTabPage() {
  const { kit, kitDoc, refreshKit } = useKit();
  const [isRegenerating, setIsRegenerating] = useState(false);

  if (!kit || !kitDoc) return null;

  const totalMinutes = kit.schedule.days.reduce((sum, d) => sum + d.minutes, 0);

  const handleRegenerateSchedule = async () => {
    setIsRegenerating(true);
    try {
      await api.post(`/kits/${kitDoc._id}/regenerate/schedule`);
      await refreshKit();
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Schedule Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/65 border border-indigo-500/25 p-5 sm:p-6 rounded-3xl backdrop-blur-xl shadow-[0_0_30px_rgba(79,70,229,0.1)]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              {kit.schedule.days_available}-Day Master Preparation Schedule
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic front-loaded curriculum • Total commitment: ~{Math.round(totalMinutes / 60)} hours ({totalMinutes} minutes)
            </p>
          </div>
        </div>

        <button
          onClick={handleRegenerateSchedule}
          disabled={isRegenerating}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:text-white bg-amber-950/30 hover:bg-amber-900/50 border border-amber-500/30 rounded-xl transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
          <span>{isRegenerating ? 'Reallocating...' : 'Reallocate Schedule'}</span>
        </button>
      </div>

      {/* Days Grid */}
      <div className="space-y-4">
        {kit.schedule.days.map(day => (
          <ScheduleDayCard
            key={day.day}
            day={day}
            allQuestions={kit.questions}
          />
        ))}
      </div>
    </div>
  );
}
