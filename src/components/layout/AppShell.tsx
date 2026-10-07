'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { SearchModal } from '@/components/search/SearchModal';
import { NotificationDrawer } from '@/components/notifications/NotificationDrawer';
import { AuthScreen } from '@/components/auth/AuthScreen';

import { usePathname } from 'next/navigation';
import { MobileNav } from '@/components/layout/MobileNav';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // If in active live meeting room (/live/[sessionId]), render full-screen immersive video meeting
  // like Google Meet or Zoom, avoiding mobile nav overlap and layout squishing
  const isLiveMeetingRoom = pathname?.startsWith('/live/') && pathname !== '/live';

  if (isLiveMeetingRoom) {
    return (
      <div className="fixed inset-0 w-full h-[100dvh] bg-slate-950 flex flex-col overflow-hidden z-50">
        {children}
      </div>
    );
  }

  return (
    <>
      {/* Left Navigation Sidebar (Desktop sticky & Mobile Slide-Over) */}
      <Sidebar />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden w-full">
        {/* Top Navbar */}
        <Navbar />

        {/* Page View Body with mobile bottom nav clearance */}
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav />

      {/* Global Modals */}
      <SearchModal />
      <NotificationDrawer />
    </>
  );
};
