'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, LogOut, PlusCircle, LayoutDashboard, UserCheck } from 'lucide-react';

export function Navbar() {
  const { user, logout, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center group-hover:bg-slate-900 transition-colors">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
            AI Interview <span className="text-indigo-400">Prep Kit</span>
          </span>
        </Link>

        {/* Navigation Links & Auth Actions */}
        <nav className="flex items-center gap-3">
          {!isLoading && (
            <>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    href="/kits/new"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>New Kit</span>
                  </Link>

                  <div className="h-4 w-[1px] bg-slate-800 mx-1" />

                  <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 border border-slate-800 px-2.5 py-1 rounded-full">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="max-w-[120px] truncate">{user.email}</span>
                  </div>

                  <button
                    onClick={() => logout()}
                    className="flex items-center gap-1 p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800/50 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-3.5 py-1.5 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="px-3.5 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
