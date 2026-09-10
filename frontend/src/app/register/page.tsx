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

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
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

    if (!password || password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    setIsLoading(true);
    try {
      await register(cleanEmail, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout pageType="signup">
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
            Create{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Account
            </span>
          </h1>

          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Start crafting tailored interview kits
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

        {/* Registration Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-2.5">
          {/* Email Address Field */}
          <div>
            <label
              htmlFor="signup-email"
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
                id="signup-email"
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
              Enter your email to get started
            </p>
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="signup-password"
              className="block text-[9px] sm:text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1"
            >
              PASSWORD (MIN. 8 CHARACTERS)
            </label>
            <div className="relative">
              <Lock
                className="w-3 h-3 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
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
            <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 pl-0.5">
              Create a strong password (min. 8 characters)
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 sm:h-10.5 flex items-center justify-center gap-1.5 mt-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs rounded-lg shadow-sm shadow-indigo-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <span>{isLoading ? 'Creating Account...' : 'Get Started'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </form>

        {/* Social Authentication (SIGN UP ONLY) */}
        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[9px] uppercase">
            <span className="bg-slate-900 px-2 text-slate-500 font-bold">OR</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 text-[11px] font-semibold text-slate-300 hover:text-white transition-all shadow-sm"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.3 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.4C.6 9.4 0 11.6 0 14s.6 4.6 1.6 6.6l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16c1.9 3.8 5.8 6.4 10.4 6.4z"
              />
            </svg>
            <span>Google</span>
          </button>

          <button
            type="button"
            className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 text-[11px] font-semibold text-slate-300 hover:text-white transition-all shadow-sm"
          >
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <span>GitHub</span>
          </button>
        </div>

        {/* Bottom Link to Sign In */}
        <p className="text-center text-[11px] sm:text-xs text-slate-400 mt-3.5 pt-2.5 border-t border-slate-800/80">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-4 transition-colors"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
