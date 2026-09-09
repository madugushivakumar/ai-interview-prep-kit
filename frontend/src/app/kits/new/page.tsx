'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/apiClient';
import { GenerationProgress } from '../../../components/kit/GenerationProgress';
import { BatchGenerationProgress, BatchItemProgress } from '../../../components/kit/BatchGenerationProgress';
import { GenerationState } from '../../../types';
import {
  Sparkles,
  Globe,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  UploadCloud,
  FileText,
  CheckCircle2,
  Layers,
  ArrowRight
} from 'lucide-react';

interface MultiRoleItem {
  id: string;
  companyUrl: string;
  jd: string;
  days: number;
}

interface ParsedFilePreview {
  roles: Array<{ id: string; jd: string; company_url: string; days: number }>;
  errors: Array<{ row: number; id?: string; error: string }>;
  warnings: string[];
  totalRows: number;
}

export default function NewKitPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  // Mode: 'single' | 'multi' | 'upload'
  const [activeTab, setActiveTab] = useState<'single' | 'multi' | 'upload'>('single');

  // Single Role State
  const [singleCompanyUrl, setSingleCompanyUrl] = useState('');
  const [singleJd, setSingleJd] = useState('');
  const [singleDays, setSingleDays] = useState(5);

  // Multi Role State
  const [roles, setRoles] = useState<MultiRoleItem[]>([
    { id: 'role-1', companyUrl: '', jd: '', days: 5 },
    { id: 'role-2', companyUrl: '', jd: '', days: 5 }
  ]);

  // File Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<ParsedFilePreview | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);

  // Form submission / error states
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Single Generation Progress
  const [activeKitId, setActiveKitId] = useState<string | null>(null);
  const [generationState, setGenerationState] = useState<GenerationState | undefined>(undefined);

  // Batch Generation Progress
  const [batchItems, setBatchItems] = useState<BatchItemProgress[]>([]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
    }
  }, [user, isAuthLoading, router]);

  // Polling loop for single kit generation
  useEffect(() => {
    if (!activeKitId) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await api.get<{ status: string; generationState: GenerationState }>(
          `/kits/${activeKitId}/generation-status`
        );

        if (!isMounted) return;

        setGenerationState(res.generationState);

        if (res.status === 'completed') {
          clearInterval(interval);
          setTimeout(() => {
            router.push(`/kits/${activeKitId}`);
          }, 800);
        } else if (res.status === 'failed') {
          clearInterval(interval);
        }
      } catch (err: any) {
        console.error('Status poll error:', err);
      }
    }, 1200);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeKitId, router]);

  // Polling loop for batch multi-role generation
  useEffect(() => {
    if (batchItems.length === 0) return;

    const inProgressItems = batchItems.filter(i => i.status === 'running' || i.status === 'queued');
    if (inProgressItems.length === 0) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const updated = await Promise.all(
          batchItems.map(async item => {
            if (item.status === 'completed' || item.status === 'failed') {
              return item;
            }

            try {
              const res = await api.get<{ status: string; generationState: GenerationState }>(
                `/kits/${item.kitId}/generation-status`
              );
              return {
                ...item,
                status: res.status as any,
                progress: res.generationState?.progress || item.progress,
                currentStep: res.generationState?.currentStep || item.currentStep,
                error: res.generationState?.error?.message
              };
            } catch {
              return item;
            }
          })
        );

        if (isMounted) {
          setBatchItems(updated);
        }
      } catch (err) {
        console.error('Batch status polling error:', err);
      }
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [batchItems]);

  // Handle Single Role Submit
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (singleDays < 1 || singleDays > 60) {
      setError('Days before interview must be between 1 and 60.');
      return;
    }

    if (singleJd.trim().length < 10) {
      setError('Job description must be at least 10 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post<{ kitId?: string; kit?: any; isExisting?: boolean }>(
        '/kits',
        { company_url: singleCompanyUrl, jd: singleJd, days: singleDays }
      );

      if (res.isExisting && res.kit?._id) {
        router.push(`/kits/${res.kit._id}`);
      } else if (res.kitId) {
        setActiveKitId(res.kitId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate kit generation.');
      setIsSubmitting(false);
    }
  };

  // Handle Multi Role Submit
  const handleMultiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    for (let i = 0; i < roles.length; i++) {
      const r = roles[i];
      if (!r.companyUrl.trim()) {
        setError(`Role #${i + 1} (${r.id}) is missing a company URL.`);
        return;
      }
      if (r.jd.trim().length < 10) {
        setError(`Role #${i + 1} (${r.id}) job description must be at least 10 characters.`);
        return;
      }
      if (r.days < 1 || r.days > 60) {
        setError(`Role #${i + 1} (${r.id}) days must be between 1 and 60.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        roles: roles.map(r => ({
          id: r.id,
          company_url: r.companyUrl,
          jd: r.jd,
          days: r.days
        }))
      };

      const res = await api.post<{ items: Array<{ id: string; kitId: string; status: string }> }>(
        '/kits/batch',
        payload
      );

      const trackingItems: BatchItemProgress[] = (res.items || []).map((item, idx) => {
        const matchingRole = roles[idx] || roles[0];
        return {
          id: item.id,
          kitId: item.kitId,
          companyUrl: matchingRole.companyUrl,
          days: matchingRole.days,
          status: item.status as any,
          progress: item.status === 'completed' ? 100 : 5,
          currentStep: item.status === 'completed' ? 'Completed' : 'Initiating Pipeline'
        };
      });

      setBatchItems(trackingItems);
    } catch (err: any) {
      setError(err.message || 'Failed to launch multi-role generation batch.');
      setIsSubmitting(false);
    }
  };

  // Handle File Selection and Instant Server Preview
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    setError('');
    setIsParsingFile(true);

    try {
      const content = await file.text();
      const res = await api.post<ParsedFilePreview>(
        `/kits/batch/upload?preview=true&filename=${encodeURIComponent(file.name)}`,
        { content, fileName: file.name }
      );

      setFilePreview(res);
    } catch (err: any) {
      setError(err.message || 'Failed to parse file. Please verify JSON or CSV format.');
      setFilePreview(null);
    } finally {
      setIsParsingFile(false);
    }
  };

  // Handle File Batch Submit
  const handleFileBatchSubmit = async () => {
    if (!filePreview || filePreview.roles.length === 0) {
      setError('No valid roles found in the uploaded file.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await api.post<{ items: Array<{ id: string; kitId: string; status: string }> }>(
        '/kits/batch',
        { roles: filePreview.roles }
      );

      const trackingItems: BatchItemProgress[] = (res.items || []).map((item, idx) => {
        const matchingRole = filePreview.roles[idx] || filePreview.roles[0];
        return {
          id: item.id,
          kitId: item.kitId,
          companyUrl: matchingRole.company_url,
          days: matchingRole.days,
          status: item.status as any,
          progress: item.status === 'completed' ? 100 : 5,
          currentStep: item.status === 'completed' ? 'Completed' : 'Initiating Pipeline'
        };
      });

      setBatchItems(trackingItems);
    } catch (err: any) {
      setError(err.message || 'Failed to launch file batch generation.');
      setIsSubmitting(false);
    }
  };

  // Switch to multi-role with current single inputs preserved
  const handleAddAnotherRoleFromSingle = () => {
    setRoles([
      { id: 'role-1', companyUrl: singleCompanyUrl, jd: singleJd, days: singleDays },
      { id: 'role-2', companyUrl: '', jd: '', days: 5 }
    ]);
    setActiveTab('multi');
  };

  // Dynamic role item mutations
  const updateRoleField = (index: number, field: keyof MultiRoleItem, value: any) => {
    const nextRoles = [...roles];
    nextRoles[index] = { ...nextRoles[index], [field]: value };
    setRoles(nextRoles);
  };

  const addRoleCard = () => {
    const nextId = `role-${roles.length + 1}`;
    setRoles([...roles, { id: nextId, companyUrl: '', jd: '', days: 5 }]);
  };

  const removeRoleCard = (index: number) => {
    if (roles.length <= 1) return;
    setRoles(roles.filter((_, i) => i !== index));
  };

  // Active Batch Progress View
  if (batchItems.length > 0) {
    return (
      <div className="py-8">
        <BatchGenerationProgress
          items={batchItems}
          onReset={() => {
            setBatchItems([]);
            setIsSubmitting(false);
          }}
        />
      </div>
    );
  }

  // Active Single Progress View
  if (activeKitId) {
    return (
      <div className="py-8">
        <GenerationProgress
          generationState={generationState}
          onRetry={() => {
            setActiveKitId(null);
            setIsSubmitting(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur shadow-2xl">
        {/* Header Title */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Autonomous Intelligence Pipeline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
            Create Interview Preparation Kit
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
            Generate customized day-by-day interview preparation kits backed by live company website research, requirement analysis, and active recall flashcards.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-8 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => { setActiveTab('single'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'single'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Single Role</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('multi'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'multi'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Multi-Role Builder</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('upload'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>File Upload (JSON/CSV)</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. SINGLE ROLE MODE */}
        {activeTab === 'single' && (
          <form onSubmit={handleSingleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Company Website URL
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={singleCompanyUrl}
                  onChange={e => setSingleCompanyUrl(e.target.value)}
                  placeholder="https://company.com or http://localhost:8099/acme/"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Supports root domains, careers subpaths, or local evaluation test hosts.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Job Description (Pasted Text)
              </label>
              <textarea
                required
                rows={7}
                value={singleJd}
                onChange={e => setSingleJd(e.target.value)}
                placeholder="Paste the full job description here, including responsibilities, required skills, and nice-to-haves..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Days Before Interview (1 to 60 Days)
              </label>
              <div className="relative flex items-center gap-3">
                <div className="relative flex-1">
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    required
                    min={1}
                    max={60}
                    value={singleDays}
                    onChange={e => setSingleDays(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  {[1, 3, 5, 14, 30].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSingleDays(d)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                        singleDays === d
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01] disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Starting Research Engine...' : 'Generate Interview Prep Kit'}</span>
              </button>

              <button
                type="button"
                onClick={handleAddAnotherRoleFromSingle}
                className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Role</span>
              </button>
            </div>
          </form>
        )}

        {/* 2. MULTI-ROLE BUILDER MODE */}
        {activeTab === 'multi' && (
          <form onSubmit={handleMultiSubmit} className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Configuring {roles.length} Role Target(s)
              </span>
              <button
                type="button"
                onClick={addRoleCard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Role</span>
              </button>
            </div>

            <div className="space-y-4">
              {roles.map((role, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4 relative"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold">
                        {role.id}
                      </span>
                      <span className="text-xs text-slate-400">Role Target #{idx + 1}</span>
                    </div>

                    {roles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRoleCard(idx)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Remove role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase">
                        Company URL
                      </label>
                      <input
                        type="text"
                        required
                        value={role.companyUrl}
                        onChange={e => updateRoleField(idx, 'companyUrl', e.target.value)}
                        placeholder="https://company.com"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase">
                        Days Available (1-60)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        required
                        value={role.days}
                        onChange={e => updateRoleField(idx, 'days', parseInt(e.target.value, 10) || 1)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase">
                      Job Description
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={role.jd}
                      onChange={e => updateRoleField(idx, 'jd', e.target.value)}
                      placeholder="Paste job description..."
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Starting Batch Generation...' : `Generate All (${roles.length}) Kits`}</span>
            </button>
          </form>
        )}

        {/* 3. FILE UPLOAD (JSON/CSV) MODE */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            {/* Drag & Drop / File Input Box */}
            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-3xl p-8 text-center bg-slate-950/50 transition-colors">
              <UploadCloud className="w-10 h-10 text-indigo-400 mx-auto mb-3 animate-bounce" />
              <h3 className="text-sm font-semibold text-slate-200 mb-1">
                Upload Multi-Role Case File
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Upload structured JSON or CSV containing multiple JD and company pairs.
              </p>

              <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-md transition-colors">
                <span>Select File (.json, .csv)</span>
                <input
                  type="file"
                  accept=".json,.csv,text/csv,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {uploadFile && (
                <div className="mt-3 text-xs font-medium text-indigo-300">
                  Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            {isParsingFile && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400 animate-pulse">
                Parsing and validating file contents...
              </div>
            )}

            {/* Parsed Preview Table */}
            {filePreview && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-slate-200">
                      Found {filePreview.roles.length} valid role(s) out of {filePreview.totalRows} row(s)
                    </span>
                  </div>

                  {filePreview.errors.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30 text-xs font-semibold">
                      {filePreview.errors.length} Invalid Row(s)
                    </span>
                  )}
                </div>

                {/* Warnings banner */}
                {filePreview.warnings.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                    {filePreview.warnings.map((w, idx) => (
                      <p key={idx}>⚠️ {w}</p>
                    ))}
                  </div>
                )}

                {/* Preview Table */}
                <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-[11px] uppercase tracking-wider text-slate-400 sticky top-0">
                      <tr>
                        <th className="p-3">ID</th>
                        <th className="p-3">Company URL</th>
                        <th className="p-3">Days</th>
                        <th className="p-3">Job Description Snippet</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filePreview.roles.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-900/50">
                          <td className="p-3 font-mono font-bold text-indigo-400">{r.id}</td>
                          <td className="p-3 truncate max-w-[150px]">{r.company_url}</td>
                          <td className="p-3">{r.days}d</td>
                          <td className="p-3 truncate max-w-[200px] text-slate-400">{r.jd}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-medium text-[10px]">
                              Valid
                            </span>
                          </td>
                        </tr>
                      ))}

                      {/* Render invalid rows */}
                      {filePreview.errors.map((e, i) => (
                        <tr key={`err-${i}`} className="bg-rose-950/20">
                          <td className="p-3 font-mono text-rose-400">{e.id || `Row ${e.row}`}</td>
                          <td className="p-3 col-span-3 text-rose-300 italic" colSpan={3}>
                            {e.error}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30 font-medium text-[10px]">
                              Error
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={handleFileBatchSubmit}
                  disabled={isSubmitting || filePreview.roles.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01] disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Launching Batch...'
                      : `Generate All (${filePreview.roles.length}) Valid Kits`}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
