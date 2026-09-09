'use client';

import React from 'react';
import { RoleBreakdown } from '../../types';
import { Badge } from '../ui/Badge';
import { Briefcase, CheckCircle, ShieldCheck } from 'lucide-react';

interface RoleBreakdownCardProps {
  role: RoleBreakdown;
}

export function RoleBreakdownCard({ role }: RoleBreakdownCardProps) {
  const mustCount = role.requirements.filter(r => r.priority === 'must').length;
  const niceCount = role.requirements.filter(r => r.priority === 'nice').length;

  return (
    <div className="space-y-6">
      {/* Role Summary Banner */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">{role.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400">Seniority Level:</span>
                <span className="text-xs font-semibold text-purple-300 bg-purple-950/40 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  {role.seniority || 'Mid-Senior'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-300 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
              <span>{mustCount} Must-Have</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-300 text-xs font-medium">
              <span>{niceCount} Nice-to-Have</span>
            </div>
          </div>
        </div>

        {/* Core Responsibilities */}
        {role.responsibilities && role.responsibilities.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Core Responsibilities
            </h3>
            <ul className="space-y-1.5">
              {role.responsibilities.map((resp, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Extracted Requirements List */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur shadow-sm">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4 flex items-center justify-between">
          <span>Grounded Job Requirements ({role.requirements.length})</span>
          <span className="text-xs font-normal text-slate-400 lowercase">extracted strictly from posting text</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {role.requirements.map(req => (
            <div
              key={req.id}
              className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                  {req.id}
                </span>
                <div className="flex items-center gap-1.5">
                  <Badge variant={req.kind}>{req.kind}</Badge>
                  <Badge variant={req.priority}>{req.priority === 'must' ? 'Must Have' : 'Nice'}</Badge>
                </div>
              </div>

              <p className="text-sm text-slate-200 font-medium leading-snug">
                {req.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
