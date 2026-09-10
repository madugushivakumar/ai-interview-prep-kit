'use client';

import React, { useState, useMemo } from 'react';
import { RoleBreakdown, SourceInfo } from '../../types';
import { Badge } from '../ui/Badge';
import {
  Briefcase,
  CheckCircle,
  ShieldCheck,
  Code2,
  Cpu,
  Database,
  Cloud,
  Terminal,
  Layers,
  Sparkles,
  BookOpen,
  Search,
  Users,
  Compass,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  Building2,
  Check,
  HelpCircle
} from 'lucide-react';

interface RoleBreakdownCardProps {
  role: RoleBreakdown;
  source?: SourceInfo;
}

type FilterTab = 'all' | 'must' | 'nice' | 'technical' | 'behavioural' | 'domain';

export function RoleBreakdownCard({ role, source }: RoleBreakdownCardProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isResponsibilitiesExpanded, setIsResponsibilitiesExpanded] = useState(true);

  // Dynamic calculations
  const totalRequirements = role.requirements.length;
  const mustCount = role.requirements.filter(r => r.priority === 'must').length;
  const niceCount = role.requirements.filter(r => r.priority === 'nice').length;
  const techCount = role.requirements.filter(r => r.kind === 'technical').length;
  const behCount = role.requirements.filter(r => r.kind === 'behavioural').length;
  const domainCount = role.requirements.filter(r => r.kind === 'domain').length;

  // Filtered requirements
  const filteredRequirements = useMemo(() => {
    return role.requirements.filter(req => {
      // Priority/Kind filter
      if (activeFilter === 'must' && req.priority !== 'must') return false;
      if (activeFilter === 'nice' && req.priority !== 'nice') return false;
      if (activeFilter === 'technical' && req.kind !== 'technical') return false;
      if (activeFilter === 'behavioural' && req.kind !== 'behavioural') return false;
      if (activeFilter === 'domain' && req.kind !== 'domain') return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const textMatch = req.text.toLowerCase().includes(q);
        const idMatch = req.id.toLowerCase().includes(q);
        const skillsMatch = (role.requirement_skill_map?.[req.id] || []).some(s => s.toLowerCase().includes(q));
        if (!textMatch && !idMatch && !skillsMatch) return false;
      }

      return true;
    });
  }, [role.requirements, activeFilter, searchQuery, role.requirement_skill_map]);

  const techCategories = role.technical_skills ? Object.entries(role.technical_skills) : [];
  const hasTechnicalSkills = techCategories.length > 0;
  const hasSoftSkills = Array.isArray(role.soft_skills) && role.soft_skills.length > 0;
  const hasDomainSkills = Array.isArray(role.domain_skills) && role.domain_skills.length > 0;

  // Icon helper for skill categories
  const getCategoryIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('language')) return <Code2 className="w-3.5 h-3.5 text-sky-400" />;
    if (c.includes('database')) return <Database className="w-3.5 h-3.5 text-amber-400" />;
    if (c.includes('cloud') || c.includes('infra')) return <Cloud className="w-3.5 h-3.5 text-blue-400" />;
    if (c.includes('devops') || c.includes('ci/cd')) return <Terminal className="w-3.5 h-3.5 text-emerald-400" />;
    if (c.includes('architecture') || c.includes('distributed')) return <Layers className="w-3.5 h-3.5 text-purple-400" />;
    return <Cpu className="w-3.5 h-3.5 text-indigo-400" />;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Summary */}
      <div className="bg-slate-900/65 border border-indigo-500/25 rounded-3xl p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(79,70,229,0.1)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              {source?.company && (
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  {source.company}
                </span>
              )}
              <span className="text-slate-600">•</span>
              <span className="text-xs font-medium text-slate-400">Grounded Role Breakdown</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              {role.title}
            </h1>

            {/* Quick Spec Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-purple-300 bg-purple-950/60 border border-purple-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                Seniority: {role.seniority || 'Mid-Level'}
              </span>

              {role.experience && role.experience !== 'Not specified in job description' && (
                <span className="text-xs font-medium text-slate-300 bg-slate-800/80 border border-slate-700/60 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  {role.experience}
                </span>
              )}

              {role.work_mode && role.work_mode !== 'Not specified in job description' && (
                <span className="text-xs font-medium text-slate-300 bg-slate-800/80 border border-slate-700/60 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  {role.work_mode}
                </span>
              )}

              {role.employment_type && role.employment_type !== 'Not specified in job description' && (
                <span className="text-xs font-medium text-slate-300 bg-slate-800/80 border border-slate-700/60 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  {role.employment_type}
                </span>
              )}
            </div>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 min-w-[280px]">
            <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 text-center">
              <div className="text-xs font-medium text-slate-400">Responsibilities</div>
              <div className="text-xl font-bold text-slate-100 mt-0.5">{role.responsibilities?.length || 0}</div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 text-center">
              <div className="text-xs font-medium text-slate-400">Total Requirements</div>
              <div className="text-xl font-bold text-slate-100 mt-0.5">{totalRequirements}</div>
            </div>
            <div className="bg-rose-950/30 border border-rose-800/40 rounded-xl p-3 text-center">
              <div className="text-xs font-medium text-rose-300">Must-Have</div>
              <div className="text-xl font-bold text-rose-200 mt-0.5">{mustCount}</div>
            </div>
            <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3 text-center">
              <div className="text-xs font-medium text-amber-300">Nice-to-Have</div>
              <div className="text-xl font-bold text-amber-200 mt-0.5">{niceCount}</div>
            </div>
          </div>
        </div>

        {/* 2. Role Overview */}
        {role.overview && (
          <div className="pt-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Role Overview
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
              {role.overview}
            </p>
          </div>
        )}
      </div>

      {/* 3. Core Responsibilities Section */}
      <div className="bg-slate-900/65 border border-indigo-500/25 rounded-3xl p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(79,70,229,0.1)]">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-indigo-400" />
              <span>Core Responsibilities</span>
              <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                {role.responsibilities?.length || 0} items
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Every day-to-day responsibility extracted directly from the job description
            </p>
          </div>

          {role.responsibilities && role.responsibilities.length > 4 && (
            <button
              onClick={() => setIsResponsibilitiesExpanded(!isResponsibilitiesExpanded)}
              className="text-xs font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800"
            >
              {isResponsibilitiesExpanded ? (
                <>Collapse <ChevronUp className="w-3.5 h-3.5" /></>
              ) : (
                <>Expand All ({role.responsibilities.length}) <ChevronDown className="w-3.5 h-3.5" /></>
              )}
            </button>
          )}
        </div>

        {role.responsibilities && role.responsibilities.length > 0 ? (
          <div className="space-y-3">
            {(isResponsibilitiesExpanded ? role.responsibilities : role.responsibilities.slice(0, 4)).map((resp, idx) => {
              const relatedSkills = role.responsibility_skill_map?.[resp] || [];
              const indexStr = String(idx + 1).padStart(2, '0');

              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/40 hover:bg-slate-950/60 transition-colors flex flex-col sm:flex-row sm:items-start gap-3.5"
                >
                  <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/40 border border-indigo-800/40 px-2 py-1 rounded shrink-0 h-fit">
                    {indexStr}
                  </span>
                  
                  <div className="space-y-2 flex-1">
                    <p className="text-sm font-medium text-slate-200 leading-snug">
                      {resp}
                    </p>

                    {relatedSkills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-slate-500 font-medium mr-1">Related Skills:</span>
                        {relatedSkills.map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="text-[11px] font-medium text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">Not specified in job description.</p>
        )}
      </div>

      {/* 4. Skills Breakdown: Technical, Behavioural, Domain */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Technical Skills (2 cols wide on desktop) */}
        <div className="lg:col-span-2 bg-slate-900/65 border border-indigo-500/25 rounded-3xl p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(79,70,229,0.1)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-sky-400" />
                <span>Grounded Technical Skills</span>
              </h2>
              <span className="text-xs text-slate-400 lowercase">strictly from JD text</span>
            </div>

            {hasTechnicalSkills ? (
              <div className="space-y-4">
                {techCategories.map(([category, skills]) => (
                  <div key={category} className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {getCategoryIcon(category)}
                      <span>{category}</span>
                      <span className="text-[10px] text-slate-500 font-normal">({skills.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 text-xs font-medium text-slate-200 bg-slate-950/80 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl">
                <HelpCircle className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Technical skills not explicitly categorized in the job description.</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/60 text-xs text-slate-500 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero hallucination guarantee: only skills explicitly cited in the JD are displayed.</span>
          </div>
        </div>

        {/* Soft Skills & Domain Knowledge (1 col wide) */}
        <div className="space-y-6">
          {/* Behavioural / Soft Skills */}
          <div className="bg-slate-900/65 border border-indigo-500/25 rounded-3xl p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(79,70,229,0.1)]">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Behavioural & Soft Skills</span>
            </h2>

            {hasSoftSkills ? (
              <div className="flex flex-wrap gap-2">
                {role.soft_skills!.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs font-medium text-purple-300 bg-purple-950/40 border border-purple-800/40 rounded-lg"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Not specified in job description.</p>
            )}
          </div>

          {/* Domain Knowledge */}
          <div className="bg-slate-900/65 border border-indigo-500/25 rounded-3xl p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(79,70,229,0.1)]">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-3">
              <Compass className="w-4 h-4 text-teal-400" />
              <span>Domain Knowledge</span>
            </h2>

            {hasDomainSkills ? (
              <div className="flex flex-wrap gap-2">
                {role.domain_skills!.map((domain, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs font-medium text-teal-300 bg-teal-950/40 border border-teal-800/40 rounded-lg"
                  >
                    {domain}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Not specified in job description.</p>
            )}
          </div>

          {/* Education Requirements */}
          <div className="bg-slate-900/65 border border-indigo-500/25 rounded-3xl p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(79,70,229,0.1)]">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Education & Qualifications</span>
            </h2>

            {role.education && role.education.length > 0 && !role.education[0].toLowerCase().includes('not specified') ? (
              <ul className="space-y-1.5">
                {role.education.map((edu, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{edu}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 italic">Education requirements not specified in the job description.</p>
            )}
          </div>
        </div>
      </div>

      {/* 5. Complete Grounded Requirements with Filter & Search */}
      <div className="bg-slate-900/65 border border-indigo-500/25 rounded-3xl p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(79,70,229,0.1)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-rose-400" />
              <span>Grounded Job Requirements</span>
              <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                {filteredRequirements.length} / {totalRequirements}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Filtered and searchable by priority, kind, or keyword
            </p>
          </div>

          {/* Search bar */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search requirements or skills..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pb-4 mb-6 border-b border-slate-800/80">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === 'all'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            All ({totalRequirements})
          </button>
          <button
            onClick={() => setActiveFilter('must')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeFilter === 'must'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-rose-400/80 hover:text-rose-300 hover:bg-slate-800'
            }`}
          >
            <span>Must-Have</span>
            <span className="text-[10px] opacity-80">({mustCount})</span>
          </button>
          <button
            onClick={() => setActiveFilter('nice')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeFilter === 'nice'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-amber-400/80 hover:text-amber-300 hover:bg-slate-800'
            }`}
          >
            <span>Nice-to-Have</span>
            <span className="text-[10px] opacity-80">({niceCount})</span>
          </button>
          <button
            onClick={() => setActiveFilter('technical')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeFilter === 'technical'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-indigo-400/80 hover:text-indigo-300 hover:bg-slate-800'
            }`}
          >
            <span>Technical</span>
            <span className="text-[10px] opacity-80">({techCount})</span>
          </button>
          <button
            onClick={() => setActiveFilter('behavioural')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeFilter === 'behavioural'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-purple-400/80 hover:text-purple-300 hover:bg-slate-800'
            }`}
          >
            <span>Behavioural</span>
            <span className="text-[10px] opacity-80">({behCount})</span>
          </button>
          <button
            onClick={() => setActiveFilter('domain')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeFilter === 'domain'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-teal-400/80 hover:text-teal-300 hover:bg-slate-800'
            }`}
          >
            <span>Domain</span>
            <span className="text-[10px] opacity-80">({domainCount})</span>
          </button>
        </div>

        {/* Requirements Grid */}
        {filteredRequirements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredRequirements.map(req => {
              const relatedSkills = role.requirement_skill_map?.[req.id] || [];

              return (
                <div
                  key={req.id}
                  className="p-4 rounded-xl border border-slate-800/90 bg-slate-950/60 hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                        {req.id}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        {req.priority === 'must' ? 'Must Have' : 'Nice to Have'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Badge variant={req.kind}>{req.kind}</Badge>
                      <Badge variant={req.priority}>{req.priority === 'must' ? 'Must' : 'Nice'}</Badge>
                    </div>
                  </div>

                  <p className="text-sm text-slate-200 font-medium leading-snug">
                    {req.text}
                  </p>

                  <div className="pt-2 border-t border-slate-900/80 flex items-center justify-between text-[11px] text-slate-500">
                    {relatedSkills.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[10px] text-slate-600 font-medium">Skills:</span>
                        {relatedSkills.map((s, idx) => (
                          <span key={idx} className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span>JD Grounded</span>
                    )}
                    <span className="text-[10px] text-slate-600">ID: {req.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-10 text-center border border-dashed border-slate-800 rounded-xl">
            <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-300">No requirements match your current filter</p>
            <p className="text-xs text-slate-500 mt-1">Try clearing your search query or selecting &quot;All&quot;.</p>
          </div>
        )}
      </div>
    </div>
  );
}

