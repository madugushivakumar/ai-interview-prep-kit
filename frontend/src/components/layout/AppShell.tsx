'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { GlowBackground } from '../ui/GlowBackground';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isAuthPage) {
    return <div className="min-h-screen flex flex-col w-full">{children}</div>;
  }

  const isLandingPage = pathname === '/';
  if (isLandingPage) {
    return (
      <>
        <Navbar />
        <main className="flex-1 w-full overflow-x-hidden">
          {children}
        </main>
      </>
    );
  }

  // Application pages (Dashboard, Kits, New Kit, Practice, etc.)
  return (
    <GlowBackground>
      <Navbar />
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </GlowBackground>
  );
}
