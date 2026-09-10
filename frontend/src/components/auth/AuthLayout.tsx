'use client';

import React from 'react';
import { AuthHeader } from './AuthHeader';
import { AuthFooter } from './AuthFooter';
import { DecorativeBackground } from './DecorativeBackground';
import { AuthFeaturePanel } from './AuthFeaturePanel';

interface AuthLayoutProps {
  pageType: 'signup' | 'signin';
  children: React.ReactNode;
}

export function AuthLayout({ pageType, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col relative w-full overflow-x-hidden text-slate-100">
      {/* Top Header */}
      <AuthHeader />

      {/* Decorative Background with Waves & Ambient Effects */}
      <DecorativeBackground pageType={pageType} />

      {/* Main Centered 2-Column Work Area (~840px width, 30-35% scaled down) */}
      <main className="flex-1 max-w-[850px] w-full mx-auto px-4 sm:px-5 py-4 sm:py-6 flex items-center justify-center z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-center justify-center w-full">
          {/* Left Column: Form Card (~360-370px) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end w-full">
            {children}
          </div>

          {/* Right Column: Feature Panel (~450-460px) */}
          <div className="lg:col-span-7 flex justify-center lg:justify-start w-full">
            <AuthFeaturePanel />
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <AuthFooter />
    </div>
  );
}
