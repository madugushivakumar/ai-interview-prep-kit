'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, LogOut, PlusCircle, LayoutDashboard, UserCheck } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#030717]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1px] shadow-sm shadow-indigo-500/25">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center group-hover:bg-slate-900 transition-colors">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
            </div>
          </div>
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
            AI Interview{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Prep Kit
            </span>
          </span>
        </Link>

        {/* Navigation Links & Auth Actions */}
        <nav className="flex items-center gap-2.5 sm:gap-3">
          {!isLoading && (
            <>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                      pathname === '/dashboard'
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    href="/kits/new"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg shadow-sm shadow-indigo-600/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>New Kit</span>
                  </Link>

                  <div className="h-3.5 w-[1px] bg-slate-800 mx-0.5" />

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-full">
                    <UserCheck className="w-3 h-3 text-emerald-400" />
                    <span className="max-w-[120px] truncate">{user.email}</span>
                  </div>

                  <button
                    onClick={() => logout()}
                    className="flex items-center p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800/60 transition-colors"
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg shadow-sm shadow-indigo-600/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
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
