'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { AuthLayout } from '../../components/auth/AuthLayout';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Email format regex validation
  const isValidEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Email address is required.');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    setIsLoading(true);
    try {
      await login(cleanEmail, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout pageType="signin">
      <div className="w-full max-w-[365px] bg-slate-900/75 border border-indigo-500/25 backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-[0_0_20px_rgba(79,70,229,0.15),0_0_40px_rgba(37,99,235,0.08)] relative overflow-hidden text-left">
        {/* Subtle Ambient Glow */}
        <div
          className="absolute -top-12 -left-12 w-24 h-24 bg-purple-500/15 rounded-full blur-xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Top Centered AI Brain / Spark Logo (~60px scale) */}
        <div className="text-center mb-3.5">
          <div className="w-[58px] h-[58px] sm:w-[62px] sm:h-[62px] rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-sm shadow-indigo-500/25 mx-auto mb-2.5">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 sm:w-6.5 sm:h-6.5 text-indigo-400" />
            </div>
          </div>

          <h1 className="text-xl sm:text-[22px] lg:text-[24px] font-extrabold text-white tracking-tight leading-tight">
            Welcome{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Back
            </span>
          </h1>

          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Sign in to your interview preparation dashboard
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="mb-3 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 flex items-start gap-2 text-rose-300 text-[11px] animate-in fade-in duration-200"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-2.5">
          {/* Email Address Field */}
          <div>
            <label
              htmlFor="signin-email"
              className="block text-[9px] sm:text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1"
            >
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <Mail
                className="w-3 h-3 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="signin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="engineer@example.com"
                className="w-full h-10 sm:h-10.5 bg-slate-950/70 border border-slate-700/80 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 pl-0.5">
              Enter your registered email address.
            </p>
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="signin-password"
              className="block text-[9px] sm:text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1"
            >
              PASSWORD
            </label>
            <div className="relative">
              <Lock
                className="w-3 h-3 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="signin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 sm:h-10.5 bg-slate-950/70 border border-slate-700/80 rounded-lg py-2 pl-9 pr-8 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-3 h-3" />
                ) : (
                  <Eye className="w-3 h-3" />
                )}
              </button>
            </div>
            {/* Helper row: Enter your password + Forgot password? */}
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] mt-0.5 pl-0.5">
              <span className="text-slate-500">Enter your password.</span>
              <span className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer font-medium">
                Forgot password?
              </span>
            </div>
          </div>

          {/* Submit Button (40-42px height) */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 sm:h-10.5 flex items-center justify-center gap-1.5 mt-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs rounded-lg shadow-sm shadow-indigo-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </form>

        {/* Bottom Link to Sign Up */}
        <p className="text-center text-[11px] sm:text-xs text-slate-400 mt-3.5 pt-2.5 border-t border-slate-800/80">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-4 transition-colors"
          >
            Create one free
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
